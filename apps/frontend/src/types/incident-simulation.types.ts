export type ResourceStatus = "Active" | "Maintenance" | "Faulty" | "Out of Service";

export type DeviceType = "EV" | "CHARGING_PORT";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM";

export interface IncidentAlert {
  id: string;
  deviceType: DeviceType;
  deviceCode: string;
  hubId: string;
  hubName: string;
  issueDescription: string;
  severity: SeverityLevel;
  status: ResourceStatus;
  isLocked: boolean; // BR-07: Resource locked from reservations and new charging schedules
  reportedAt: string;
}

export interface SimulationScenario {
  targetHubId: string;
  chargerFailureRate: number; // 0 to 100%
  demandSurgeRate: number; // 0 to 150%
  simulationWindow: string; // e.g. "Peak Hours (16:00 - 19:00)"
}

export interface BottleneckItem {
  hubId: string;
  hubName: string;
  currentLoad: number; // percentage
  projectedLoad: number; // percentage
  status: "Normal" | "Warning" | "Critical";
}

export interface SimulationResults {
  liveCapacityPercent: number;
  projectedCapacityPercent: number;
  liveAvgWaitMinutes: number;
  projectedAvgWaitMinutes: number;
  lostCapacitySlots: number;
  bottlenecks: BottleneckItem[];
}

export type MitigationType = "REROUTE" | "RESCHEDULE_CHARGING" | "DEPLOY_BUFFER";

export interface MitigationProposal {
  id: string;
  title: string;
  description: string;
  type: MitigationType;
  impactGain: string;
  targetHubId: string;
  targetHubName: string;
  approved: boolean;
  approvedAt?: string;
}
