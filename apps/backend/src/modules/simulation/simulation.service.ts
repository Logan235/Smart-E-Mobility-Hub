import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

export interface BackendAdjustableParameter {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
}

export interface BackendAlternativeHub {
  hubId: string;
  hubName: string;
  distanceMeters: number;
  currentOccupancy: number;
  availableSlots: number;
  isEligible: boolean;
}

export interface BackendOperationalAction {
  actionId: string;
  recommendationId: string;
  title: string;
  actionType: string;
  targetHubId: string;
  targetHubName: string;
  affectedResources: string[];
  status: 'SCHEDULED' | 'DISPATCHED' | 'APPLIED' | 'PENDING_REVIEW_FAILED';
  createdAt: string;
  dispatchedTo: string;
  liveNetworkApplied: boolean;
  operatorNotes?: string;
}

export interface BackendRecommendation {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'REROUTE' | 'RESCHEDULE_CHARGING' | 'DEPLOY_BUFFER';
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
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  approved: boolean;
  approvedAt?: string;
  adjustableParams: BackendAdjustableParameter[];
  alternativeHubs: BackendAlternativeHub[];
  feasibility: {
    isFeasible: boolean;
    stateMatch: boolean;
    lastCheckedAt: string;
    constraintsChecked: { name: string; passed: boolean; detail: string }[];
    warningMessage?: string;
  };
  coordinationAction?: BackendOperationalAction;
  auditTrail: { timestamp: string; operatorId: string; decision: string; summary: string }[];
}

@Injectable()
export class SimulationService {
  private recommendations: BackendRecommendation[] = [
    {
      id: 'REC-01',
      code: 'REC-SIM-01',
      title: 'Divert 40% of Passenger Flow to Nearby Dormitory Hub',
      description:
        'Automatically send passenger notifications recommending nearby Dormitory Area B Hub (450m away) with a 20% trip discount incentive to relieve Metro station charging bottlenecks.',
      type: 'REROUTE',
      impactGain: '+18% Serving Capacity',
      targetHubId: 'HUB-METRO',
      targetHubName: 'Metro Station Hub ➔ Dormitory Area B Hub',
      affectedResources: ['PORT-METRO-01', 'PORT-METRO-04', 'EV-1024', 'EV-1028'],
      expectedImpact: {
        capacityGainPercent: 18,
        waitReductionMinutes: 8.5,
        relievedSlotsPerHour: 24,
        reliabilityScore: 92,
      },
      status: 'PENDING_REVIEW',
      approved: false,
      adjustableParams: [
        {
          id: 'reroute_ratio',
          name: 'Diverted Passenger Percentage',
          currentValue: 40,
          unit: '%',
          min: 10,
          max: 80,
          step: 5,
          description: 'Percentage of arriving users receiving rerouting recommendations',
        },
        {
          id: 'discount_incentive',
          name: 'Discount Incentive Rate',
          currentValue: 20,
          unit: '%',
          min: 0,
          max: 50,
          step: 5,
          description: 'Fare discount offered to incentivize student hub switching',
        },
      ],
      alternativeHubs: [
        {
          hubId: 'HUB-DORM',
          hubName: 'Dormitory Area B Hub',
          distanceMeters: 450,
          currentOccupancy: 58,
          availableSlots: 18,
          isEligible: true,
        },
        {
          hubId: 'HUB-CAMPUS',
          hubName: 'Campus Center Hub',
          distanceMeters: 750,
          currentOccupancy: 42,
          availableSlots: 26,
          isEligible: true,
        },
        {
          hubId: 'HUB-SERVICE',
          hubName: 'Service & Sports Area Hub',
          distanceMeters: 1100,
          currentOccupancy: 88,
          availableSlots: 4,
          isEligible: false,
        },
      ],
      feasibility: {
        isFeasible: true,
        stateMatch: true,
        lastCheckedAt: '15:20:00',
        constraintsChecked: [
          { name: 'Destination Hub Available Capacity', passed: true, detail: 'Dorm Hub has 18 slots available' },
          { name: 'Student Walking Distance', passed: true, detail: '450m walking distance (< 600m VNU-HCM standard)' },
          { name: 'Live Network State Compatibility (BR-11)', passed: true, detail: 'Real-time network operational state verified' },
        ],
      },
      auditTrail: [
        {
          timestamp: '15:15:30',
          operatorId: 'SIM-ENGINE',
          decision: 'INITIALIZED',
          summary: 'What-if simulation engine generated automated mitigation recommendation.',
        },
      ],
    },
    {
      id: 'REC-02',
      code: 'REC-SIM-02',
      title: 'Reschedule Slow AC Charging for 6 Standby EVs',
      description:
        'Temporarily defer slow AC charging sessions of 6 standby vehicles to off-peak hours (after 21:30) to allocate electrical capacity for fast DC chargers.',
      type: 'RESCHEDULE_CHARGING',
      impactGain: 'Frees 45kW Grid Load',
      targetHubId: 'HUB-METRO',
      targetHubName: 'Metro Station Hub (Grid Infrastructure)',
      affectedResources: ['EV-1031', 'EV-1045', 'EV-1052', 'PORT-METRO-AC1', 'PORT-METRO-AC2'],
      expectedImpact: {
        capacityGainPercent: 14,
        waitReductionMinutes: 6.0,
        relievedSlotsPerHour: 16,
        reliabilityScore: 96,
      },
      status: 'PENDING_REVIEW',
      approved: false,
      adjustableParams: [
        {
          id: 'defer_hours',
          name: 'Deferral Duration',
          currentValue: 3,
          unit: 'hours',
          min: 1,
          max: 6,
          step: 1,
          description: 'Duration to postpone charging for unreserved standby vehicles',
        },
        {
          id: 'power_saving_cap',
          name: 'Power Capacity Cap',
          currentValue: 45,
          unit: 'kW',
          min: 15,
          max: 75,
          step: 10,
          description: 'Maximum grid capacity threshold reallocated to fast chargers',
        },
      ],
      alternativeHubs: [],
      feasibility: {
        isFeasible: true,
        stateMatch: true,
        lastCheckedAt: '15:21:00',
        constraintsChecked: [
          { name: 'Standby Vehicle Battery Threshold', passed: true, detail: 'All 6 target EVs have SOC > 35%' },
          { name: 'Station Substation Load Capacity', passed: true, detail: 'Switchgear supports safe dynamic phase redistribution' },
        ],
      },
      auditTrail: [
        {
          timestamp: '15:16:00',
          operatorId: 'SIM-ENGINE',
          decision: 'INITIALIZED',
          summary: 'Load optimization recommendation generated by What-if Engine.',
        },
      ],
    },
    {
      id: 'REC-03',
      code: 'REC-SIM-03',
      title: 'Deploy Mobile Fast-Charging Buffer Unit to Metro Station',
      description:
        'Dispatch a mobile battery van to Metro Station terminal during peak hours (16:30 - 18:30) to provide 8 additional emergency charging slots.',
      type: 'DEPLOY_BUFFER',
      impactGain: '+12 Slots / Hour',
      targetHubId: 'HUB-METRO',
      targetHubName: 'Metro Station Hub (Intermodal Bay)',
      affectedResources: ['MOBILE-UNIT-01', 'PORT-BUFFER-01', 'PORT-BUFFER-02'],
      expectedImpact: {
        capacityGainPercent: 11,
        waitReductionMinutes: 5.2,
        relievedSlotsPerHour: 12,
        reliabilityScore: 89,
      },
      status: 'PENDING_REVIEW',
      approved: false,
      adjustableParams: [
        {
          id: 'buffer_units',
          name: 'Mobile Units Deployed',
          currentValue: 1,
          unit: 'units',
          min: 1,
          max: 3,
          step: 1,
          description: 'Number of mobile charging buffer vans deployed',
        },
      ],
      alternativeHubs: [],
      feasibility: {
        isFeasible: true,
        stateMatch: true,
        lastCheckedAt: '15:22:00',
        constraintsChecked: [
          { name: 'Designated Parking Bay', passed: true, detail: 'Emergency vehicle zone reserved at Metro Hub' },
          { name: 'Vehicle Operational Readiness', passed: true, detail: 'Mobile Unit 01 is currently standby and fully charged' },
        ],
      },
      auditTrail: [
        {
          timestamp: '15:16:45',
          operatorId: 'SIM-ENGINE',
          decision: 'INITIALIZED',
          summary: 'Mobile buffer unit proposal initialized for Operator review.',
        },
      ],
    },
  ];

  private coordinationActions: BackendOperationalAction[] = [];

  findAllRecommendations(): BackendRecommendation[] {
    return this.recommendations;
  }

  findRecommendationById(id: string): BackendRecommendation {
    const item = this.recommendations.find((r) => r.id === id);
    if (!item) throw new NotFoundException(`Recommendation with ID ${id} not found`);
    return item;
  }

  validateRecommendation(id: string, simulateMismatch = false): BackendRecommendation {
    const rec = this.findRecommendationById(id);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (simulateMismatch) {
      rec.feasibility = {
        isFeasible: false,
        stateMatch: false,
        lastCheckedAt: now,
        warningMessage:
          'WARNING: Live operational network state change detected! Substation supply fault at destination hub. Recommendation can no longer be safely applied. Rerun simulation (Exception E2).',
        constraintsChecked: [
          { name: 'Destination Hub Available Capacity', passed: false, detail: 'Voltage instability reported at destination' },
          { name: 'Live Operational State Compatibility', passed: false, detail: 'Real-time assumptions mismatch baseline data' },
        ],
      };
      return rec;
    }

    rec.feasibility = {
      isFeasible: true,
      stateMatch: true,
      lastCheckedAt: now,
      constraintsChecked: [
        { name: 'Substation & Terminal Feasibility', passed: true, detail: 'All resources meet operational criteria' },
        { name: 'Live Network Compatibility (BR-09, BR-11)', passed: true, detail: 'No conflict with ongoing maintenance tasks' },
      ],
    };
    return rec;
  }

  adjustParameter(id: string, paramId: string, newValue: number): BackendRecommendation {
    const rec = this.findRecommendationById(id);
    const param = rec.adjustableParams.find((p) => p.id === paramId);
    if (!param) throw new BadRequestException(`Parameter ${paramId} not found`);

    param.currentValue = newValue;

    // Recalculate impact dynamically (Alternate Flow A1)
    if (paramId === 'reroute_ratio') {
      rec.expectedImpact.capacityGainPercent = Math.round(newValue * 0.45);
      rec.expectedImpact.waitReductionMinutes = Number((newValue * 0.22).toFixed(1));
      rec.expectedImpact.relievedSlotsPerHour = Math.round(newValue * 0.6);
      rec.impactGain = `+${rec.expectedImpact.capacityGainPercent}% Serving Capacity`;
    } else if (paramId === 'defer_hours') {
      rec.expectedImpact.capacityGainPercent = Math.round(10 + newValue * 1.5);
      rec.impactGain = `Frees ${newValue * 15}kW Grid Load`;
    }

    rec.auditTrail.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      operatorId: 'OPERATOR-MAIN',
      decision: 'ADJUSTED',
      summary: `Adjusted parameter "${param.name}" to ${newValue}${param.unit}. Recalculated expected operational impact.`,
    });

    return rec;
  }

  switchAlternativeHub(id: string, newHubId: string): BackendRecommendation {
    const rec = this.findRecommendationById(id);
    const targetHub = rec.alternativeHubs.find((h) => h.hubId === newHubId);
    if (!targetHub) throw new BadRequestException(`Alternative hub ${newHubId} not found`);
    if (!targetHub.isEligible) throw new BadRequestException(`Hub ${targetHub.hubName} is currently overloaded`);

    const oldName = rec.targetHubName;
    rec.targetHubName = `Metro Station Hub ➔ ${targetHub.hubName}`;

    rec.auditTrail.unshift({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      operatorId: 'OPERATOR-MAIN',
      decision: 'HUB_SWITCHED',
      summary: `Switched destination hub from ${oldName} to ${targetHub.hubName} (${targetHub.distanceMeters}m).`,
    });

    return rec;
  }

  approveRecommendation(id: string, operatorNotes?: string): BackendRecommendation {
    const rec = this.findRecommendationById(id);

    if (!rec.feasibility.isFeasible) {
      throw new BadRequestException('Recommendation does not satisfy operational feasibility constraints (Exception E2). Cannot apply to live network!');
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const actionId = `ACT-COORD-${Math.floor(8000 + Math.random() * 1000)}`;

    const action: BackendOperationalAction = {
      actionId,
      recommendationId: rec.id,
      title: rec.title,
      actionType: rec.type,
      targetHubId: rec.targetHubId,
      targetHubName: rec.targetHubName,
      affectedResources: rec.affectedResources,
      status: 'APPLIED',
      createdAt: timestamp,
      dispatchedTo: 'Fleet Dispatch & Technical Operations Center',
      liveNetworkApplied: true, // Live state modified explicitly via this action (BR-12)
      operatorNotes: operatorNotes || 'Approved via What-if Simulation Engine (UC-SIM-02).',
    };

    rec.status = 'APPROVED';
    rec.approved = true;
    rec.approvedAt = timestamp;
    rec.coordinationAction = action;

    rec.auditTrail.unshift({
      timestamp,
      operatorId: 'OPERATOR-MAIN',
      decision: 'APPROVED',
      summary: `Approved recommendation. Dispatched action "${actionId}" and applied to live operational network.`,
    });

    this.coordinationActions.unshift(action);
    return rec;
  }

  rejectRecommendation(id: string, reason?: string): BackendRecommendation {
    const rec = this.findRecommendationById(id);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    rec.status = 'REJECTED';
    rec.approved = false;

    rec.auditTrail.unshift({
      timestamp,
      operatorId: 'OPERATOR-MAIN',
      decision: 'REJECTED',
      summary: `Operator rejected proposal: ${reason || 'Does not align with current operational requirements.'} Live network unchanged.`,
    });

    return rec;
  }

  archiveRecommendation(id: string): BackendRecommendation {
    const rec = this.findRecommendationById(id);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    rec.status = 'ARCHIVED';

    rec.auditTrail.unshift({
      timestamp,
      operatorId: 'OPERATOR-MAIN',
      decision: 'ARCHIVED',
      summary: 'Archived scenario results for analytical records. No operational action dispatched (A3).',
    });

    return rec;
  }

  findAllCoordinationActions(): BackendOperationalAction[] {
    return this.coordinationActions;
  }
}

