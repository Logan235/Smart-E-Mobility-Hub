import { SharedEV, EVStatus } from '../modules/shared-ev/entities/shared-ev.entity.js';

export const INITIAL_SHARED_EVS: SharedEV[] = [
  { id: 'ev-1', code: 'EV-001', hubId: 'hub-metro', batteryLevel: 85, status: EVStatus.AVAILABLE },
  { id: 'ev-2', code: 'EV-002', hubId: 'hub-metro', batteryLevel: 15, status: EVStatus.CHARGING },
  { id: 'ev-3', code: 'EV-003', hubId: 'hub-ktxb', batteryLevel: 90, status: EVStatus.AVAILABLE },
  { id: 'ev-4', code: 'EV-004', hubId: 'hub-ktxb', batteryLevel: 45, status: EVStatus.AVAILABLE },
];

