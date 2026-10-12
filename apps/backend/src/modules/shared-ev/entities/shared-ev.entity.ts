export enum EVStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  IN_USE = 'IN_USE',
  CHARGING = 'CHARGING',
  MAINTENANCE = 'MAINTENANCE',
}

export class SharedEV {
  id: string;
  code: string;
  hubId: string;
  batteryLevel: number; // 0 - 100%
  status: EVStatus;
  currentReservationId?: string | null;
}
