import type { SharedEvDataSet } from '../modules/shared-ev/shared-ev.repository.js';
import { EVStatus, VehicleType } from '../modules/shared-ev/entities/shared-ev.entity.js';
import { ReservationStatus } from '../modules/shared-ev/entities/reservation.entity.js';
import { SessionStatus } from '../modules/shared-ev/entities/usage-session.entity.js';

export const INITIAL_SHARED_EV_DATA: SharedEvDataSet = {
  students: [
    { id: 'STU-001', name: 'Nguyen Thanh An', email: 'an.nguyen@hcmut.edu.vn' },
    { id: 'STU-002', name: 'Tran Thi Binh', email: 'binh.tran@hcmut.edu.vn' },
    { id: 'STU-003', name: 'Nguyen Van Nghi Ngoo', email: 'chau.le@hcmut.edu.vn' },
  ],
  hubs: [
    { id: 'HUB-METRO', name: 'Metro Station Hub', area: 'Metro Line 1', parkingCapacity: 6, operational: true },
    { id: 'HUB-DORM', name: 'Dormitory Hub', area: 'Student Dormitories', parkingCapacity: 5, operational: true },
    { id: 'HUB-CAMPUS', name: 'Campus Hub', area: 'University Campus', parkingCapacity: 4, operational: true },
    { id: 'HUB-SERVICE', name: 'Service Area Hub', area: 'Service Facilities', parkingCapacity: 2, operational: true },
  ],
  vehicles: [
    { id: 'EV-1024', code: 'EV-1024', name: 'E-Scooter 1024', type: VehicleType.SCOOTER, hubId: 'HUB-METRO', batteryLevel: 92, maxRangeKm: 45, status: EVStatus.AVAILABLE, currentReservationId: null },
    { id: 'EV-1028', code: 'EV-1028', name: 'E-Scooter 1028', type: VehicleType.SCOOTER, hubId: 'HUB-METRO', batteryLevel: 64, maxRangeKm: 45, status: EVStatus.AVAILABLE, currentReservationId: null },
    { id: 'EV-1031', code: 'EV-1031', name: 'E-Bike 1031', type: VehicleType.BIKE, hubId: 'HUB-METRO', batteryLevel: 18, maxRangeKm: 40, status: EVStatus.WAITING_FOR_CHARGING, currentReservationId: null },
    { id: 'EV-2040', code: 'EV-2040', name: 'E-Scooter 2040', type: VehicleType.SCOOTER, hubId: 'HUB-DORM', batteryLevel: 78, maxRangeKm: 45, status: EVStatus.IN_USE, currentReservationId: null },
    { id: 'EV-2044', code: 'EV-2044', name: 'E-Bike 2044', type: VehicleType.BIKE, hubId: 'HUB-DORM', batteryLevel: 47, maxRangeKm: 40, status: EVStatus.AVAILABLE, currentReservationId: null },
    { id: 'EV-3012', code: 'EV-3012', name: 'E-Scooter 3012', type: VehicleType.SCOOTER, hubId: 'HUB-CAMPUS', batteryLevel: 31, maxRangeKm: 45, status: EVStatus.AVAILABLE, currentReservationId: null },
    { id: 'EV-3022', code: 'EV-3022', name: 'E-Scooter 3022', type: VehicleType.SCOOTER, hubId: 'HUB-CAMPUS', batteryLevel: 12, maxRangeKm: 45, status: EVStatus.WAITING_FOR_CHARGING, currentReservationId: null },
    { id: 'EV-3030', code: 'EV-3030', name: 'E-Bike 3030', type: VehicleType.BIKE, hubId: 'HUB-CAMPUS', batteryLevel: 70, maxRangeKm: 40, status: EVStatus.MAINTENANCE, currentReservationId: null },
    { id: 'EV-4011', code: 'EV-4011', name: 'E-Bike 4011', type: VehicleType.BIKE, hubId: 'HUB-SERVICE', batteryLevel: 86, maxRangeKm: 40, status: EVStatus.AVAILABLE, currentReservationId: null },
    { id: 'EV-4015', code: 'EV-4015', name: 'E-Scooter 4015', type: VehicleType.SCOOTER, hubId: 'HUB-SERVICE', batteryLevel: 55, maxRangeKm: 45, status: EVStatus.AVAILABLE, currentReservationId: null },
  ],
  reservations: [
    { id: 'RES-SEED-01', studentId: 'STU-002', vehicleId: 'EV-2040', hubId: 'HUB-DORM', createdAt: '2026-11-02T06:00:00.000Z', expiresAt: '2026-11-02T06:15:00.000Z', status: ReservationStatus.FULFILLED },
  ],
  usageSessions: [
    { id: 'SES-SEED-01', studentId: 'STU-002', vehicleId: 'EV-2040', reservationId: 'RES-SEED-01', startHubId: 'HUB-DORM', startedAt: '2026-11-02T06:05:00.000Z', endHubId: null, endedAt: null, status: SessionStatus.ACTIVE },
  ],
};

