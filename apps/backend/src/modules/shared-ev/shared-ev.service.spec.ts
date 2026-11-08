import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';
import { EVStatus } from './entities/shared-ev.entity.js';

describe('SharedEvService - Student Portal (Module 1)', () => {
  let service: SharedEvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedEvService],
    }).compile();

    service = module.get<SharedEvService>(SharedEvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all available shared EVs', () => {
    const evs = service.findAll();
    expect(Array.isArray(evs)).toBe(true);
    expect(evs.length).toBeGreaterThan(0);
  });

  it('should filter EVs by hubId', () => {
    const metroEvs = service.findByHub('hub-metro');
    expect(metroEvs.every((ev) => ev.hubId === 'hub-metro')).toBe(true);
  });

  it('should successfully reserve an available EV', () => {
    const res = service.reserveEv('ev-1', 'STU999');
    expect(res.message).toBeDefined();
    expect(res.ev.status).toBe(EVStatus.RESERVED);
    expect(res.ev.currentReservationId).toContain('STU999');
  });

  it('should throw BadRequestException when attempting to reserve an already unavailable EV', () => {
    expect(() => service.reserveEv('ev-2', 'STU111')).toThrow(BadRequestException);
  });

  it('should throw NotFoundException when vehicle does not exist', () => {
    expect(() => service.reserveEv('ev-nonexistent', 'STU111')).toThrow(NotFoundException);
  });
});

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { SharedEvService } from './shared-ev.service.js';
import { SharedEvRepository } from './shared-ev.repository.js';
import { ClockService } from './clock.service.js';
import { EVStatus } from './entities/shared-ev.entity.js';
import { ReservationStatus } from './entities/reservation.entity.js';
import { SessionStatus } from './entities/usage-session.entity.js';
import { RESERVATION_GRACE_MS } from './shared-ev.constants.js';

/** Controllable clock for time-based rules. */
class FakeClock extends ClockService {
  private current = new Date('2026-11-02T08:00:00.000Z');
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

const STUDENT = 'STU-001';
const OTHER_STUDENT = 'STU-003'; // STU-002 already has an active trip in the mock data

describe('SharedEvService – Module 1 Shared EV Management', () => {
  let repo: SharedEvRepository;
  let clock: FakeClock;
  let service: SharedEvService;

  beforeEach(() => {
    repo = new SharedEvRepository(); // fresh copy of the mock JSON data
    clock = new FakeClock();
    service = new SharedEvService(repo, clock);
  });

  /** Reserve + pick up EV-1024 and return the active session. */
  const startTrip = () => {
    const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
    return service.pickUpVehicle(STUDENT, reservation.id);
  };

  // ---------------------------------------------------------------- GetEV
  describe('TC-01..03 searchVehicles (UC-STU-GetEV)', () => {
    it('TC-01 returns only AVAILABLE vehicles of the selected Hub with battery >= 20%', () => {
      const result = service.searchVehicles({ hubId: 'HUB-METRO' });
      expect(result.map((v) => v.id)).toEqual(['EV-1024', 'EV-1028']);
      expect(result.every((v) => v.status === EVStatus.AVAILABLE)).toBe(true);
    });

    it('TC-02 applies the student minimum-battery filter', () => {
      const result = service.searchVehicles({ hubId: 'all', minBattery: 80 });
      expect(result.map((v) => v.id)).toEqual(['EV-1024', 'EV-4011']);
    });

    it('TC-03 returns an empty list when no vehicle matches (A1)', () => {
      expect(service.searchVehicles({ hubId: 'HUB-CAMPUS', minBattery: 60 })).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------- ReserveEV
  describe('TC-04..09 reserveVehicle (UC-STU-ReserveEV)', () => {
    it('TC-04 creates a CONFIRMED reservation and sets the vehicle RESERVED', () => {
      const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
      expect(Date.parse(reservation.expiresAt) - Date.parse(reservation.createdAt)).toBe(
        RESERVATION_GRACE_MS,
      );
      const ev = service.getVehicle('EV-1024');
      expect(ev.status).toBe(EVStatus.RESERVED);
      expect(ev.currentReservationId).toBe(reservation.id);
    });

    it('TC-05 rejects a second reservation of the same vehicle (E2, no double booking)', () => {
      service.reserveVehicle(STUDENT, 'EV-1024');
      expect(() => service.reserveVehicle(OTHER_STUDENT, 'EV-1024')).toThrow(ConflictException);
    });

    it('TC-06 rejects a vehicle that is not AVAILABLE (E1)', () => {
      expect(() => service.reserveVehicle(STUDENT, 'EV-3030')).toThrow(ConflictException); // MAINTENANCE
    });

    it('TC-07 rejects a vehicle whose battery is below 20% (BR-04)', () => {
      const ev = service.getVehicle('EV-1028');
      ev.batteryLevel = 19;
      expect(() => service.reserveVehicle(STUDENT, 'EV-1028')).toThrow(BadRequestException);
      expect(ev.status).toBe(EVStatus.AVAILABLE);
    });

    it('TC-08 rejects a student who already has an active reservation', () => {
      service.reserveVehicle(STUDENT, 'EV-1024');
      expect(() => service.reserveVehicle(STUDENT, 'EV-1028')).toThrow(ConflictException);
    });

    it('TC-09 cancelling releases the vehicle and marks the reservation CANCELLED (A1)', () => {
      const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
      const cancelled = service.cancelReservation(STUDENT, reservation.id);
      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(service.getVehicle('EV-1024').status).toBe(EVStatus.AVAILABLE);
    });
  });

  // ------------------------------------------------------------ FR-AUTO-01
  describe('TC-10..11 expireOverdueReservations (FR-AUTO-01 / BR-03)', () => {
    it('TC-10 expires a reservation after the grace period and releases the vehicle', () => {
      const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
      clock.advance(RESERVATION_GRACE_MS - 1);
      expect(service.expireOverdueReservations()).toHaveLength(0);
      clock.advance(1);
      expect(service.expireOverdueReservations().map((r) => r.id)).toEqual([reservation.id]);
      expect(service.getVehicle('EV-1024').status).toBe(EVStatus.AVAILABLE);
    });

    it('TC-11 an old reservation never releases a vehicle re-reserved by someone else', () => {
      const first = service.reserveVehicle(STUDENT, 'EV-1024');
      service.cancelReservation(STUDENT, first.id);
      const second = service.reserveVehicle(OTHER_STUDENT, 'EV-1024');
      clock.advance(RESERVATION_GRACE_MS - 1000);
      service.expireOverdueReservations();
      const ev = service.getVehicle('EV-1024');
      expect(ev.status).toBe(EVStatus.RESERVED);
      expect(ev.currentReservationId).toBe(second.id);
    });
  });

  // ------------------------------------------------------------------ Pick up
  describe('TC-12..14 pickUpVehicle (UC-STU-03)', () => {
    it('TC-12 starts an ACTIVE session, fulfils the reservation and sets IN_USE', () => {
      const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
      const session = service.pickUpVehicle(STUDENT, reservation.id);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(repo.findReservation(reservation.id)?.status).toBe(ReservationStatus.FULFILLED);
      expect(service.getVehicle('EV-1024').status).toBe(EVStatus.IN_USE);
    });

    it('TC-13 rejects pickup of an expired reservation (E1)', () => {
      const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
      clock.advance(RESERVATION_GRACE_MS);
      expect(() => service.pickUpVehicle(STUDENT, reservation.id)).toThrow(ConflictException);
    });

    it('TC-14 rejects pickup by a student who does not own the reservation (E3)', () => {
      const reservation = service.reserveVehicle(STUDENT, 'EV-1024');
      expect(() => service.pickUpVehicle(OTHER_STUDENT, reservation.id)).toThrow(ForbiddenException);
    });
  });

  // ------------------------------------------------------------------- Return
  describe('TC-15..20 returnVehicle (UC-STU-02)', () => {
    it('TC-15 battery >= 20% -> AVAILABLE at the destination Hub, session COMPLETED (A3)', () => {
      const session = startTrip();
      const { vehicle, session: done } = service.returnVehicle(session.id, {
        studentId: STUDENT,
        returnHubId: 'HUB-DORM',
        batteryLevel: 20,
      });
      expect(vehicle.status).toBe(EVStatus.AVAILABLE);
      expect(vehicle.hubId).toBe('HUB-DORM');
      expect(done.status).toBe(SessionStatus.COMPLETED);
    });

    it('TC-16 battery < 20% -> WAITING_FOR_CHARGING automatically (A2)', () => {
      const session = startTrip();
      const { vehicle } = service.returnVehicle(session.id, {
        studentId: STUDENT,
        returnHubId: 'HUB-METRO',
        batteryLevel: 19,
      });
      expect(vehicle.status).toBe(EVStatus.WAITING_FOR_CHARGING);
    });

    it('TC-17 reported fault -> MAINTENANCE, even with a full battery (E3)', () => {
      const session = startTrip();
      const { vehicle } = service.returnVehicle(session.id, {
        studentId: STUDENT,
        returnHubId: 'HUB-METRO',
        batteryLevel: 90,
        faultReported: true,
      });
      expect(vehicle.status).toBe(EVStatus.MAINTENANCE);
    });

    it('TC-18 rejects a return to a full Hub (E2)', () => {
      const session = startTrip();
      expect(() =>
        service.returnVehicle(session.id, { studentId: STUDENT, returnHubId: 'HUB-SERVICE', batteryLevel: 50 }),
      ).toThrow(ConflictException);
      expect(service.getVehicle('EV-1024').status).toBe(EVStatus.IN_USE); // state unchanged
    });

    it('TC-19 rejects a return by a student without that active session (E1)', () => {
      const session = startTrip();
      expect(() =>
        service.returnVehicle(session.id, { studentId: OTHER_STUDENT, returnHubId: 'HUB-METRO', batteryLevel: 50 }),
      ).toThrow(ForbiddenException);
    });

    it('TC-20 rejects an invalid battery value', () => {
      const session = startTrip();
      expect(() =>
        service.returnVehicle(session.id, { studentId: STUDENT, returnHubId: 'HUB-METRO', batteryLevel: 120 }),
      ).toThrow(BadRequestException);
    });
  });
});
