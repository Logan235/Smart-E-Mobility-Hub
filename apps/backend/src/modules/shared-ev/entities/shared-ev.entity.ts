export enum EVStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_USE = 'IN_USE',
  WAITING_FOR_CHARGING = 'WAITING_FOR_CHARGING',
  CHARGING = 'CHARGING',
  MAINTENANCE = 'MAINTENANCE',
}

export class SharedEV {
  id: string;
  code: string;
  name: string;
  type: VehicleType;
  hubId: string;
  batteryLevel: number; // 0 - 100 (%)
  maxRangeKm: number; // range at 100% battery
  status: EVStatus;
  currentReservationId: string | null;
}
export enum VehicleType {
  SCOOTER = 'SCOOTER',
  BIKE = 'BIKE',
}