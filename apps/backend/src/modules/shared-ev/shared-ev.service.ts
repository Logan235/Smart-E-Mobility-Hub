import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SharedEvRepository } from './shared-ev.repository.js';
import { ClockService } from './clock.service.js';
import { EVStatus, SharedEV } from './entities/shared-ev.entity.js';
import { HubOverview, MobilityHub } from './entities/mobility-hub.entity.js';
import { Reservation, ReservationStatus } from './entities/reservation.entity.js';
import { SessionStatus, UsageSession } from './entities/usage-session.entity.js';
import { Student } from './entities/student.entity.js';
import { ReturnVehicleDto, SearchVehicleQueryDto } from './dto/shared-ev.dto.js';
import {
  EXPIRATION_SWEEP_INTERVAL_MS,
  MIN_BATTERY_LEVEL,
  RESERVATION_GRACE_MS,
} from './shared-ev.constants.js';

/**
 * Business logic of Module 1 – Shared EV Management.
 * Covers UC-STU-GetEV, UC-STU-ReserveEV, UC-STU-03 (Pick up), UC-STU-02 (Return)
 * and FR-AUTO-01 (automatic reservation expiration).
 *
 * Concurrency note (NFR 3.2): every state-changing method checks and updates the
 * in-memory state synchronously, without any await in between. Node.js runs one
 * request handler at a time, so two concurrent reservations of the same vehicle
 * cannot both pass the availability check – the second one is rejected (E2).
 */
@Injectable()
export class SharedEvService implements OnModuleInit, OnModuleDestroy {
  private sequence = 0;
  private sweepTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly repo: SharedEvRepository,
    private readonly clock: ClockService,
  ) {}

  // ------------------------------------------------------------------ lifecycle

  /** Starts the background job of FR-AUTO-01. */
  onModuleInit(): void {
    this.sweepTimer = setInterval(
      () => this.expireOverdueReservations(),
      EXPIRATION_SWEEP_INTERVAL_MS,
    );
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  // --------------------------------------------------------- UC-STU-GetEV (find)

  /** Returns all Hubs with live occupancy numbers. */
  getHubs(): HubOverview[] {
    return this.repo.findAllHubs().map((hub) => this.toHubOverview(hub));
  }

  /** Returns every vehicle with any status (used for the overview counters). */
  getAllVehicles(): SharedEV[] {
    this.expireOverdueReservations();
    return this.repo.findAllVehicles();
  }

  /** Alias for getAllVehicles() to support adapters. */
  findAll(): SharedEV[] {
    return this.getAllVehicles();
  }

  /**
   * Searches reservable vehicles: status AVAILABLE and battery >= the required level.
   * Only Available vehicles are returned (post-condition of UC-STU-GetEV).
   */
  searchVehicles(query: SearchVehicleQueryDto): SharedEV[] {
    this.expireOverdueReservations();
    const requiredBattery = Math.max(MIN_BATTERY_LEVEL, Number(query.minBattery ?? 0) || 0);
    const allHubs = !query.hubId || query.hubId === 'all';

    if (!allHubs) {
      this.getOperationalHub(query.hubId!);
    }
    const operationalHubIds = new Set(
      this.repo.findAllHubs().filter((h) => h.operational).map((h) => h.id),
    );

    return this.repo
      .findAllVehicles()
      .filter((ev) => (allHubs ? operationalHubIds.has(ev.hubId) : ev.hubId === query.hubId))
      .filter((ev) => this.isEligibleForReservation(ev, requiredBattery))
      .sort((a, b) => b.batteryLevel - a.batteryLevel);
  }

  /** Returns one vehicle or throws 404. */
  getVehicle(vehicleId: string): SharedEV {
    const ev = this.repo.findVehicle(vehicleId);
    if (!ev) throw new NotFoundException(`Vehicle ${vehicleId} was not found.`);
    return ev;
  }

  /** BR-04: a vehicle is reservable only when Available and battery is high enough. */
  isEligibleForReservation(ev: SharedEV, requiredBattery = MIN_BATTERY_LEVEL): boolean {
    return ev.status === EVStatus.AVAILABLE && ev.batteryLevel >= requiredBattery;
  }

  // --------------------------------------------------- UC-STU-ReserveEV (reserve)

  /** Creates a reservation and moves the vehicle from AVAILABLE to RESERVED. */
  reserveVehicle(studentId: string, vehicleId: string): Reservation {
    this.expireOverdueReservations();
    this.getStudent(studentId);
    const ev = this.getVehicle(vehicleId);
    const hub = this.getOperationalHub(ev.hubId);

    // E1 / E2: vehicle is no longer available (e.g. reserved by another student first)
    if (ev.status !== EVStatus.AVAILABLE) {
      throw new ConflictException(
        `Vehicle ${ev.id} is no longer available (current status: ${ev.status}). Please choose another vehicle.`,
      );
    }
    // BR-04: battery condition
    if (ev.batteryLevel < MIN_BATTERY_LEVEL) {
      throw new BadRequestException(
        `Vehicle ${ev.id} has ${ev.batteryLevel}% battery; at least ${MIN_BATTERY_LEVEL}% is required.`,
      );
    }
    // Eligibility: one active reservation and no active trip per student
    if (this.hasActiveReservation(studentId)) {
      throw new ConflictException('You already have an active reservation. Pick it up or cancel it first.');
    }
    if (this.getActiveSession(studentId)) {
      throw new ConflictException('You are currently using a vehicle. Return it before reserving another one.');
    }

    const now = this.clock.now();
    const reservation: Reservation = {
      id: this.nextId('RES'),
      studentId,
      vehicleId: ev.id,
      hubId: hub.id,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + RESERVATION_GRACE_MS).toISOString(),
      status: ReservationStatus.CONFIRMED,
    };
    this.repo.saveReservation(reservation);
    ev.status = EVStatus.RESERVED;
    ev.currentReservationId = reservation.id;
    return reservation;
  }

  /** Returns the student's CONFIRMED reservation, if any. */
  getActiveReservation(studentId: string): Reservation | null {
    this.expireOverdueReservations();
    return (
      this.repo
        .findAllReservations()
        .find((r) => r.studentId === studentId && r.status === ReservationStatus.CONFIRMED) ?? null
    );
  }

  hasActiveReservation(studentId: string): boolean {
    return this.getActiveReservation(studentId) !== null;
  }

  /** Student cancels a confirmed reservation; the vehicle becomes AVAILABLE again. */
  cancelReservation(studentId: string, reservationId: string): Reservation {
    this.expireOverdueReservations();
    const reservation = this.getOwnedReservation(studentId, reservationId);
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(`Reservation ${reservation.id} is already ${reservation.status}.`);
    }
    reservation.status = ReservationStatus.CANCELLED;
    this.releaseVehicle(reservation);
    return reservation;
  }

  /**
   * FR-AUTO-01 / BR-03: expires every CONFIRMED reservation whose grace period has
   * passed and releases its vehicle. Called by the background job and before each
   * operation, so the state is always consistent. Returns the expired reservations.
   */
  expireOverdueReservations(): Reservation[] {
    const now = this.clock.now().getTime();
    const expired = this.repo
      .findAllReservations()
      .filter((r) => r.status === ReservationStatus.CONFIRMED && Date.parse(r.expiresAt) <= now);
    for (const reservation of expired) {
      reservation.status = ReservationStatus.EXPIRED;
      this.releaseVehicle(reservation);
    }
    return expired;
  }

  // ------------------------------------------------------- UC-STU-03 (pick up)

  /** Consumes a valid reservation, starts a usage session and sets the vehicle IN_USE. */
  pickUpVehicle(studentId: string, reservationId: string): UsageSession {
    this.expireOverdueReservations();
    const reservation = this.getOwnedReservation(studentId, reservationId); // E3

    // E1: expired or cancelled
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        `Reservation ${reservation.id} is ${reservation.status} and can no longer be picked up.`,
      );
    }
    // E2: vehicle no longer eligible (fault / maintenance / reassigned)
    const ev = this.getVehicle(reservation.vehicleId);
    if (ev.status !== EVStatus.RESERVED || ev.currentReservationId !== reservation.id) {
      throw new ConflictException(
        `Vehicle ${ev.id} is no longer available for pickup (current status: ${ev.status}).`,
      );
    }

    const session: UsageSession = {
      id: this.nextId('SES'),
      studentId,
      vehicleId: ev.id,
      reservationId: reservation.id,
      startHubId: ev.hubId,
      startedAt: this.clock.now().toISOString(),
      endHubId: null,
      endedAt: null,
      status: SessionStatus.ACTIVE,
    };
    this.repo.saveSession(session);
    reservation.status = ReservationStatus.FULFILLED;
    ev.status = EVStatus.IN_USE;
    ev.currentReservationId = null;
    return session;
  }

  /** Returns the student's ACTIVE usage session, if any. */
  getActiveSession(studentId: string): UsageSession | null {
    return (
      this.repo
        .findAllSessions()
        .find((s) => s.studentId === studentId && s.status === SessionStatus.ACTIVE) ?? null
    );
  }

  // --------------------------------------------------------- UC-STU-02 (return)

  /** Completes a usage session and decides the vehicle's post-return status. */
  returnVehicle(
    sessionId: string,
    dto: ReturnVehicleDto,
  ): { session: UsageSession; vehicle: SharedEV } {
    const session = this.repo.findSession(sessionId);
    // E1: not the student's active session
    if (!session || session.studentId !== dto.studentId || session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException('This vehicle is not associated with your active usage session.');
    }
    const battery = Number(dto.batteryLevel);
    if (!Number.isFinite(battery) || battery < 0 || battery > 100) {
      throw new BadRequestException('Battery level must be a number between 0 and 100.');
    }
    const ev = this.getVehicle(session.vehicleId);
    if (ev.status !== EVStatus.IN_USE) {
      throw new ConflictException(`Vehicle ${ev.id} is not in use (current status: ${ev.status}).`);
    }
    // E2 / A1: destination Hub must be operational and have a free spot
    const hub = this.getOperationalHub(dto.returnHubId);
    if (!this.canAcceptVehicle(hub)) {
      throw new ConflictException(`${hub.name} is full. Please return the vehicle to another Hub.`);
    }

    const now = this.clock.now().toISOString();
    ev.hubId = hub.id;
    ev.batteryLevel = Math.round(battery);
    ev.status = this.determinePostReturnStatus(ev.batteryLevel, Boolean(dto.faultReported));
    session.status = SessionStatus.COMPLETED;
    session.endHubId = hub.id;
    session.endedAt = now;
    return { session, vehicle: ev };
  }

  /**
   * BR-05 / UC-STU-02 post-conditions:
   * fault -> MAINTENANCE (E3), battery < 20% -> WAITING_FOR_CHARGING (A2), otherwise AVAILABLE (A3).
   */
  determinePostReturnStatus(batteryLevel: number, faultReported: boolean): EVStatus {
    if (faultReported) return EVStatus.MAINTENANCE;
    if (batteryLevel < MIN_BATTERY_LEVEL) return EVStatus.WAITING_FOR_CHARGING;
    return EVStatus.AVAILABLE;
  }

  /** A Hub accepts a returned vehicle when it is operational and has a free spot. */
  canAcceptVehicle(hub: MobilityHub): boolean {
    return hub.operational && this.toHubOverview(hub).freeSpots > 0;
  }

  // ------------------------------------------------------------------- helpers

  private getStudent(studentId: string): Student {
    const student = this.repo.findStudent(studentId);
    if (!student) throw new ForbiddenException(`Student ${studentId} is not authenticated.`);
    return student;
  }

  private getOperationalHub(hubId: string): MobilityHub {
    const hub = this.repo.findHub(hubId);
    if (!hub) throw new NotFoundException(`Mobility Hub ${hubId} was not found.`);
    if (!hub.operational) throw new BadRequestException(`${hub.name} is not operational.`);
    return hub;
  }

  private getOwnedReservation(studentId: string, reservationId: string): Reservation {
    const reservation = this.repo.findReservation(reservationId);
    if (!reservation) throw new NotFoundException(`Reservation ${reservationId} was not found.`);
    if (reservation.studentId !== studentId) {
      throw new ForbiddenException('This reservation does not belong to you.');
    }
    return reservation;
  }

  /** Puts a RESERVED vehicle back to AVAILABLE, only if it is still held by this reservation. */
  private releaseVehicle(reservation: Reservation): void {
    const ev = this.repo.findVehicle(reservation.vehicleId);
    if (ev && ev.status === EVStatus.RESERVED && ev.currentReservationId === reservation.id) {
      ev.status = EVStatus.AVAILABLE;
      ev.currentReservationId = null;
    }
  }

  private toHubOverview(hub: MobilityHub): HubOverview {
    const parked = this.repo
      .findVehiclesByHub(hub.id)
      .filter((v) => v.status !== EVStatus.IN_USE);
    return {
      ...hub,
      parkedVehicles: parked.length,
      freeSpots: Math.max(0, hub.parkingCapacity - parked.length),
      availableVehicles: parked.filter((v) => this.isEligibleForReservation(v)).length,
    };
  }

  private nextId(prefix: 'RES' | 'SES'): string {
    this.sequence += 1;
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${this.sequence}`;
  }
}
