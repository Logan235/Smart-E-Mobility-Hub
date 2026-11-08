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
  simulationWindow: string; // e.g. "Peak Hours (16:30 - 19:00)"
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

export interface AdjustableParameter {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

export interface AlternativeHub {
  hubId: string;
  hubName: string;
  distanceMeters: number;
  currentOccupancy: number;
  availableSlots: number;
  isEligible: boolean;
}

export interface FeasibilityCheck {
  isFeasible: boolean;
  stateMatch: boolean;
  lastCheckedAt: string;
  constraintsChecked: { name: string; passed: boolean; detail: string }[];
  warningMessage?: string;
}

export interface OperationalAction {
  actionId: string;
  recommendationId: string;
  title: string;
  actionType: string;
  targetHubId: string;
  targetHubName: string;
  affectedResources: string[];
  status: "SCHEDULED" | "DISPATCHED" | "APPLIED" | "PENDING_REVIEW_FAILED";
  createdAt: string;
  dispatchedTo: string;
  liveNetworkApplied: boolean;
  operatorNotes?: string;
}

export interface MitigationProposal {
  id: string;
  code: string;
  title: string;
  description: string;
  type: MitigationType;
  impactGain: string;
  targetHubId: string;
  targetHubName: string;
  affectedResources: string[];
  expectedImpact: {
    capacityGainPercent: number;
    waitReductionMinutes: number;
    relievedSlotsPerHour: number;
    reliabilityScore: number;
  };
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ARCHIVED";
  approved: boolean;
  approvedAt?: string;
  adjustableParams: AdjustableParameter[];
  alternativeHubs: AlternativeHub[];
  feasibility: FeasibilityCheck;
  coordinationAction?: OperationalAction;
  auditTrail: { timestamp: string; operatorId: string; decision: string; summary: string }[];
}
