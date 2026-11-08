import React, { useMemo, useState, useEffect } from "react";
import "./IncidentSimulationCenter.css";
import type {
  IncidentAlert,
  MitigationProposal,
  OperationalAction,
  ResourceStatus,
  SimulationResults,
  SimulationScenario,
} from "../../types/incident-simulation.types";
import { IncidentHandlingPane } from "./IncidentHandlingPane";
import { WhatIfSimulationPane } from "./WhatIfSimulationPane";
import { RecommendationReviewModal } from "./RecommendationReviewModal";
import { simulationApi } from "../../services/simulation.service";

const INITIAL_ALERTS: IncidentAlert[] = [
  {
    id: "ALT-01",
    deviceType: "CHARGING_PORT",
    deviceCode: "PORT-METRO-04",
    hubId: "HUB-METRO",
    hubName: "Metro Station Hub",
    issueDescription: "DC fast-charger voltage transformer overload, hardware isolated",
    severity: "CRITICAL",
    status: "Faulty",
    isLocked: true, // BR-07: Resource locked
    reportedAt: "10:14:22",
  },
  {
    id: "ALT-02",
    deviceType: "EV",
    deviceCode: "EV-1031 (E-Bike)",
    hubId: "HUB-METRO",
    hubName: "Metro Station Hub",
    issueDescription: "Brake system sensor warning and abnormal battery discharge (18% SOC)",
    severity: "HIGH",
    status: "Maintenance",
    isLocked: true, // BR-07: Resource locked
    reportedAt: "10:28:40",
  },
  {
    id: "ALT-03",
    deviceType: "CHARGING_PORT",
    deviceCode: "PORT-DORM-02",
    hubId: "HUB-DORM",
    hubName: "Dormitory Area B Hub",
    issueDescription: "Mechanical connector latch malfunction, scheduled for inspection",
    severity: "MEDIUM",
    status: "Maintenance",
    isLocked: true, // BR-07: Resource locked
    reportedAt: "09:45:10",
  },
  {
    id: "ALT-04",
    deviceType: "EV",
    deviceCode: "EV-3022 (E-Scooter)",
    hubId: "HUB-CAMPUS",
    hubName: "Campus Center Hub",
    issueDescription: "Front tire pressure loss below safety operating threshold",
    severity: "MEDIUM",
    status: "Out of Service",
    isLocked: true, // BR-07: Resource locked
    reportedAt: "08:30:15",
  },
  {
    id: "ALT-05",
    deviceType: "CHARGING_PORT",
    deviceCode: "PORT-METRO-02",
    hubId: "HUB-METRO",
    hubName: "Metro Station Hub",
    issueDescription: "AC charging connector verified and operational",
    severity: "MEDIUM",
    status: "Active",
    isLocked: false,
    reportedAt: "07:15:00",
  },
];

const INITIAL_PROPOSALS: MitigationProposal[] = [
  {
    id: "REC-01",
    code: "REC-SIM-01",
    title: "Divert 40% of Passenger Flow to Nearby Dormitory Hub",
    description:
      "Automatically send passenger notifications recommending nearby Dormitory Area B Hub (450m away) with a 20% trip discount incentive to relieve Metro station charging bottlenecks.",
    type: "REROUTE",
    impactGain: "+18% Serving Capacity",
    targetHubId: "HUB-METRO",
    targetHubName: "Metro Station Hub ➔ Dormitory Area B Hub",
    affectedResources: ["PORT-METRO-01", "PORT-METRO-04", "EV-1024", "EV-1028"],
    expectedImpact: {
      capacityGainPercent: 18,
      waitReductionMinutes: 8.5,
      relievedSlotsPerHour: 24,
      reliabilityScore: 92,
    },
    status: "PENDING_REVIEW",
    approved: false,
    adjustableParams: [
      {
        id: "reroute_ratio",
        name: "Diverted Passenger Percentage",
        currentValue: 40,
        unit: "%",
        min: 10,
        max: 80,
        step: 5,
        description: "Percentage of arriving users receiving rerouting recommendations",
      },
      {
        id: "discount_incentive",
        name: "Discount Incentive Rate",
        currentValue: 20,
        unit: "%",
        min: 0,
        max: 50,
        step: 5,
        description: "Fare discount offered to incentivize student hub switching",
      },
    ],
    alternativeHubs: [
      {
        hubId: "HUB-DORM",
        hubName: "Dormitory Area B Hub",
        distanceMeters: 450,
        currentOccupancy: 58,
        availableSlots: 18,
        isEligible: true,
      },
      {
        hubId: "HUB-CAMPUS",
        hubName: "Campus Center Hub",
        distanceMeters: 750,
        currentOccupancy: 42,
        availableSlots: 26,
        isEligible: true,
      },
      {
        hubId: "HUB-SERVICE",
        hubName: "Service & Sports Area Hub",
        distanceMeters: 1100,
        currentOccupancy: 88,
        availableSlots: 4,
        isEligible: false,
      },
    ],
    feasibility: {
      isFeasible: true,
      stateMatch: true,
      lastCheckedAt: "15:20:00",
      constraintsChecked: [
        { name: "Destination Hub Available Capacity", passed: true, detail: "Dorm Hub has 18 slots available" },
        { name: "Student Walking Distance", passed: true, detail: "450m walking distance (< 600m VNU-HCM standard)" },
        { name: "Live Network State Compatibility (BR-11)", passed: true, detail: "Real-time network operational state verified" },
      ],
    },
    auditTrail: [
      {
        timestamp: "15:15:30",
        operatorId: "SIM-ENGINE",
        decision: "INITIALIZED",
        summary: "What-if simulation engine generated automated mitigation recommendation.",
      },
    ],
  },
  {
    id: "REC-02",
    code: "REC-SIM-02",
    title: "Reschedule Slow AC Charging for 6 Standby EVs",
    description:
      "Temporarily defer slow AC charging sessions of 6 standby vehicles to off-peak hours (after 21:30) to allocate electrical capacity for fast DC chargers.",
    type: "RESCHEDULE_CHARGING",
    impactGain: "Frees 45kW Grid Load",
    targetHubId: "HUB-METRO",
    targetHubName: "Metro Station Hub (Grid Infrastructure)",
    affectedResources: ["EV-1031", "EV-1045", "EV-1052", "PORT-METRO-AC1", "PORT-METRO-AC2"],
    expectedImpact: {
      capacityGainPercent: 14,
      waitReductionMinutes: 6.0,
      relievedSlotsPerHour: 16,
      reliabilityScore: 96,
    },
    status: "PENDING_REVIEW",
    approved: false,
    adjustableParams: [
      {
        id: "defer_hours",
        name: "Deferral Duration",
        currentValue: 3,
        unit: "hours",
        min: 1,
        max: 6,
        step: 1,
        description: "Duration to postpone charging for unreserved standby vehicles",
      },
      {
        id: "power_saving_cap",
        name: "Power Capacity Cap",
        currentValue: 45,
        unit: "kW",
        min: 15,
        max: 75,
        step: 10,
        description: "Maximum grid capacity threshold reallocated to fast chargers",
      },
    ],
    alternativeHubs: [],
    feasibility: {
      isFeasible: true,
      stateMatch: true,
      lastCheckedAt: "15:21:00",
      constraintsChecked: [
        { name: "Standby Vehicle Battery Threshold", passed: true, detail: "All 6 target EVs have SOC > 35%" },
        { name: "Station Substation Load Capacity", passed: true, detail: "Switchgear supports safe dynamic phase redistribution" },
      ],
    },
    auditTrail: [
      {
        timestamp: "15:16:00",
        operatorId: "SIM-ENGINE",
        decision: "INITIALIZED",
        summary: "Load optimization recommendation generated by What-if Engine.",
      },
    ],
  },
  {
    id: "REC-03",
    code: "REC-SIM-03",
    title: "Deploy Mobile Fast-Charging Buffer Unit to Metro Station",
    description:
      "Dispatch a mobile battery van to Metro Station terminal during peak hours (16:30 - 18:30) to provide 8 additional emergency charging slots.",
    type: "DEPLOY_BUFFER",
    impactGain: "+12 Slots / Hour",
    targetHubId: "HUB-METRO",
    targetHubName: "Metro Station Hub (Intermodal Bay)",
    affectedResources: ["MOBILE-UNIT-01", "PORT-BUFFER-01", "PORT-BUFFER-02"],
    expectedImpact: {
      capacityGainPercent: 11,
      waitReductionMinutes: 5.2,
      relievedSlotsPerHour: 12,
      reliabilityScore: 89,
    },
    status: "PENDING_REVIEW",
    approved: false,
    adjustableParams: [
      {
        id: "buffer_units",
        name: "Mobile Units Deployed",
        currentValue: 1,
        unit: "units",
        min: 1,
        max: 3,
        step: 1,
        description: "Number of mobile charging buffer vans deployed",
      },
    ],
    alternativeHubs: [],
    feasibility: {
      isFeasible: true,
      stateMatch: true,
      lastCheckedAt: "15:22:00",
      constraintsChecked: [
        { name: "Designated Parking Bay", passed: true, detail: "Emergency vehicle zone reserved at Metro Hub" },
        { name: "Vehicle Operational Readiness", passed: true, detail: "Mobile Unit 01 is currently standby and fully charged" },
      ],
    },
    auditTrail: [
      {
        timestamp: "15:16:45",
        operatorId: "SIM-ENGINE",
        decision: "INITIALIZED",
        summary: "Mobile buffer unit proposal initialized for Operator review.",
      },
    ],
  },
];

export const IncidentSimulationCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [scenario, setScenario] = useState<SimulationScenario>({
    targetHubId: "HUB-METRO",
    chargerFailureRate: 30, // 30% failure rate
    demandSurgeRate: 45, // 45% demand surge
    simulationWindow: "Peak Hours (16:30 - 19:00)",
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [proposals, setProposals] = useState<MitigationProposal[]>(INITIAL_PROPOSALS);
  const [coordinationActions, setCoordinationActions] = useState<OperationalAction[]>([]);
  const [selectedProposalForReview, setSelectedProposalForReview] = useState<MitigationProposal | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync initial backend recommendations if available
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const remote = await simulationApi.getRecommendations();
      if (mounted && remote && remote.length > 0) {
        setProposals(remote);
      }
      const actions = await simulationApi.getCoordinationActions();
      if (mounted && actions && actions.length > 0) {
        setCoordinationActions(actions);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Change resource status and enforce lock state (BR-07)
  const handleStatusChange = (alertId: string, newStatus: ResourceStatus) => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === alertId) {
          const isNowLocked = newStatus !== "Active";
          const updated = {
            ...alert,
            status: newStatus,
            isLocked: isNowLocked,
          };
          if (isNowLocked) {
            showToast(
              `🔒 Locked resource ${alert.deviceCode} under BR-07: Strictly preventing new EV reservations and charging schedules.`
            );
          } else {
            showToast(`✓ Unlocked resource ${alert.deviceCode}: Normal operating status restored.`);
          }
          return updated;
        }
        return alert;
      })
    );
  };

  // Compute simulation projection based on scenario parameters (What-if Engine)
  const simulationResults: SimulationResults = useMemo(() => {
    const failurePenalty = scenario.chargerFailureRate * 0.45;
    const surgePenalty = scenario.demandSurgeRate * 0.35;

    // Projected serving capacity (baseline 94%)
    const projectedCapacity = Math.max(
      28,
      Math.round(94 - failurePenalty - surgePenalty * 0.4)
    );

    // Projected user wait time (baseline 4.2 min)
    const projectedWait = Number(
      (4.2 + (scenario.chargerFailureRate / 100) * 12 + (scenario.demandSurgeRate / 100) * 16).toFixed(1)
    );

    // Capacity deficit slots lost
    const lostSlots = Math.round(
      (scenario.chargerFailureRate * 0.8) + (scenario.demandSurgeRate * 0.5)
    );

    // Hub load breakdown
    const metroLoad = Math.min(
      160,
      Math.round(75 + scenario.chargerFailureRate * 0.6 + scenario.demandSurgeRate * 0.7)
    );
    const dormLoad = Math.min(
      120,
      Math.round(60 + scenario.demandSurgeRate * 0.35)
    );
    const campusLoad = Math.min(
      100,
      Math.round(45 + scenario.demandSurgeRate * 0.2)
    );

    return {
      liveCapacityPercent: 94,
      projectedCapacityPercent: projectedCapacity,
      liveAvgWaitMinutes: 4.2,
      projectedAvgWaitMinutes: projectedWait,
      lostCapacitySlots: lostSlots,
      bottlenecks: [
        {
          hubId: "HUB-METRO",
          hubName: "Metro Station Hub",
          currentLoad: 75,
          projectedLoad: metroLoad,
          status: metroLoad >= 100 ? "Critical" : metroLoad >= 80 ? "Warning" : "Normal",
        },
        {
          hubId: "HUB-DORM",
          hubName: "Dormitory Area B Hub",
          currentLoad: 60,
          projectedLoad: dormLoad,
          status: dormLoad >= 100 ? "Critical" : dormLoad >= 80 ? "Warning" : "Normal",
        },
        {
          hubId: "HUB-CAMPUS",
          hubName: "Campus Center Hub",
          currentLoad: 45,
          projectedLoad: campusLoad,
          status: campusLoad >= 100 ? "Critical" : campusLoad >= 80 ? "Warning" : "Normal",
        },
      ],
    };
  }, [scenario]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      showToast(
        `⚡ What-if scenario analysis complete (${scenario.chargerFailureRate}% port failure, +${scenario.demandSurgeRate}% surge). Live operational network state is strictly preserved (BR-09).`
      );
    }, 600);
  };

  // Open review modal (UC-SIM-02 Main Flow Steps 1–3)
  const handleOpenReview = (proposal: MitigationProposal) => {
    setSelectedProposalForReview(proposal);
    setIsReviewModalOpen(true);
  };

  // Parameter fine-tuning (Alternate Flow A1)
  const handleAdjustParam = (proposalId: string, paramId: string, value: number) => {
    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === proposalId) {
          const updatedParams = item.adjustableParams.map((p) =>
            p.id === paramId ? { ...p, currentValue: value } : p
          );
          const impact = { ...item.expectedImpact };
          let impactGain = item.impactGain;

          if (paramId === "reroute_ratio") {
            impact.capacityGainPercent = Math.round(value * 0.45);
            impact.waitReductionMinutes = Number((value * 0.22).toFixed(1));
            impact.relievedSlotsPerHour = Math.round(value * 0.6);
            impactGain = `+${impact.capacityGainPercent}% Serving Capacity`;
          } else if (paramId === "defer_hours") {
            impact.capacityGainPercent = Math.round(10 + value * 1.5);
            impactGain = `Frees ${value * 15}kW Grid Load`;
          }

          const updatedProposal: MitigationProposal = {
            ...item,
            adjustableParams: updatedParams,
            expectedImpact: impact,
            impactGain,
            auditTrail: [
              {
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                operatorId: "OPERATOR-MAIN",
                decision: "ADJUSTED",
                summary: `Adjusted parameter ${paramId} to ${value}. Recalculated expected operational impact (A1).`,
              },
              ...item.auditTrail,
            ],
          };

          if (selectedProposalForReview?.id === proposalId) {
            setSelectedProposalForReview(updatedProposal);
          }
          return updatedProposal;
        }
        return item;
      })
    );
  };

  // Alternative Hub Switching (Alternate Flow A2)
  const handleSwitchHub = (proposalId: string, newHubId: string) => {
    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === proposalId) {
          const target = item.alternativeHubs.find((h) => h.hubId === newHubId);
          if (!target || !target.isEligible) return item;

          const updatedProposal: MitigationProposal = {
            ...item,
            targetHubName: `Metro Station Hub ➔ ${target.hubName}`,
            auditTrail: [
              {
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                operatorId: "OPERATOR-MAIN",
                decision: "HUB_SWITCHED",
                summary: `Switched destination corridor to ${target.hubName} (${target.distanceMeters}m).`,
              },
              ...item.auditTrail,
            ],
          };

          if (selectedProposalForReview?.id === proposalId) {
            setSelectedProposalForReview(updatedProposal);
          }
          showToast(`Switched destination hub to ${target.hubName} (Alternate Flow A2).`);
          return updatedProposal;
        }
        return item;
      })
    );
  };

  // Test Exception Flow E2: Operational state conflict simulation
  const handleTestExceptionE2 = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === proposalId) {
          const updatedProposal: MitigationProposal = {
            ...item,
            feasibility: {
              isFeasible: false,
              stateMatch: false,
              lastCheckedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              warningMessage:
                "CRITICAL CONFLICT: Live network state mismatch detected! Substation supply instability reported at destination hub. Recommendation cannot be applied safely to live operations (Exception E2).",
              constraintsChecked: [
                { name: "Destination Hub Available Capacity", passed: false, detail: "Voltage instability reported at destination" },
                { name: "Live Operational State Compatibility (BR-11)", passed: false, detail: "Real-time assumptions mismatch baseline data" },
              ],
            },
          };
          if (selectedProposalForReview?.id === proposalId) {
            setSelectedProposalForReview(updatedProposal);
          }
          showToast("⚠️ Exception Flow E2 Triggered: Real-time network conflict detected. Application blocked!");
          return updatedProposal;
        }
        return item;
      })
    );
  };

  // Approve recommendation and dispatch operational action (Main Flow Steps 5–8, BR-12)
  const handleApproveProposal = (proposalId: string, notes?: string) => {
    const target = proposals.find((p) => p.id === proposalId);
    if (!target) return;

    if (!target.feasibility.isFeasible) {
      showToast("❌ Cannot approve: Proposal does not meet operational constraints (Exception E2).");
      return;
    }

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const actionId = `ACT-COORD-${Math.floor(8000 + Math.random() * 1000)}`;

    const newAction: OperationalAction = {
      actionId,
      recommendationId: target.id,
      title: target.title,
      actionType: target.type,
      targetHubId: target.targetHubId,
      targetHubName: target.targetHubName,
      affectedResources: target.affectedResources,
      status: "APPLIED",
      createdAt: timeString,
      dispatchedTo: "Fleet Dispatch & Technical Operations Center",
      liveNetworkApplied: true, // Live state modified explicitly via this action (BR-12)
      operatorNotes: notes || "Approved via What-if Simulation Engine (UC-SIM-02).",
    };

    setCoordinationActions((prev) => [newAction, ...prev]);

    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === proposalId) {
          const approvedProposal: MitigationProposal = {
            ...item,
            status: "APPROVED",
            approved: true,
            approvedAt: timeString,
            coordinationAction: newAction,
            auditTrail: [
              {
                timestamp: timeString,
                operatorId: "OPERATOR-MAIN",
                decision: "APPROVED",
                summary: `Approved recommendation. Dispatched action "${actionId}" and applied changes to live network.`,
              },
              ...item.auditTrail,
            ],
          };
          if (selectedProposalForReview?.id === proposalId) {
            setSelectedProposalForReview(approvedProposal);
          }
          return approvedProposal;
        }
        return item;
      })
    );

    // Call backend API asynchronously
    void simulationApi.approveRecommendation(proposalId, notes);

    setIsReviewModalOpen(false);
    showToast(
      `✓ [BR-12 Confirmed] Operator approved "${target.title}". Dispatched action ${actionId} to live network!`
    );
  };

  // Reject recommendation (Alternate Flow A4)
  const handleRejectProposal = (proposalId: string, reason?: string) => {
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === proposalId) {
          const rejectedProposal: MitigationProposal = {
            ...item,
            status: "REJECTED",
            approved: false,
            auditTrail: [
              {
                timestamp: timeString,
                operatorId: "OPERATOR-MAIN",
                decision: "REJECTED",
                summary: `Operator rejected proposal: ${reason || "Does not align with current operational requirements."} Live network unchanged (A4).`,
              },
              ...item.auditTrail,
            ],
          };
          if (selectedProposalForReview?.id === proposalId) {
            setSelectedProposalForReview(rejectedProposal);
          }
          return rejectedProposal;
        }
        return item;
      })
    );

    void simulationApi.rejectRecommendation(proposalId, reason);
    setIsReviewModalOpen(false);
    showToast(`Proposal rejected (A4). Live network state remains completely unchanged.`);
  };

  // Archive scenario results only (Alternate Flow A3)
  const handleArchiveProposal = (proposalId: string) => {
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setProposals((prev) =>
      prev.map((item) => {
        if (item.id === proposalId) {
          const archivedProposal: MitigationProposal = {
            ...item,
            status: "ARCHIVED",
            auditTrail: [
              {
                timestamp: timeString,
                operatorId: "OPERATOR-MAIN",
                decision: "ARCHIVED",
                summary: "Scenario results archived for analytical records. No operational action dispatched (A3).",
              },
              ...item.auditTrail,
            ],
          };
          if (selectedProposalForReview?.id === proposalId) {
            setSelectedProposalForReview(archivedProposal);
          }
          return archivedProposal;
        }
        return item;
      })
    );

    void simulationApi.archiveRecommendation(proposalId);
    setIsReviewModalOpen(false);
    showToast(`Scenario archived for analytical records (A3). No live network actions dispatched.`);
  };

  return (
    <div className="incident-sim-root">
      {/* Top Header */}
      <header className="incident-sim-header">
        <div className="header-title-group">
          <h1>Network & Incident Simulation Center</h1>
          <p>
            Operator Workspace: Real-time incident handling (BR-07) & What-if simulation and decision apply (UC-SIM-02)
          </p>
        </div>

        <div className="header-badge-group">
          <div className="live-indicator">
            <span className="live-pulse" />
            <span>OPERATIONAL NETWORK (LIVE)</span>
          </div>
          <div className="operator-badge">
            <span>Role: Central Dispatch Operator</span>
          </div>
        </div>
      </header>

      {/* Split-View Container (50:50) */}
      <main className="split-view-container">
        {/* Left Pane: Real-time Incident Handling */}
        <IncidentHandlingPane
          alerts={alerts}
          onStatusChange={handleStatusChange}
        />

        {/* Right Pane: What-if Simulation Engine */}
        <WhatIfSimulationPane
          scenario={scenario}
          results={simulationResults}
          proposals={proposals}
          coordinationActions={coordinationActions}
          isSimulating={isSimulating}
          onScenarioChange={setScenario}
          onRunSimulation={handleRunSimulation}
          onOpenReview={handleOpenReview}
          onApproveProposal={handleApproveProposal}
          onRejectProposal={handleRejectProposal}
          onArchiveProposal={handleArchiveProposal}
        />
      </main>

      {/* Review & Feasibility Modal (UC-SIM-02) */}
      {selectedProposalForReview && (
        <RecommendationReviewModal
          proposal={selectedProposalForReview}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onApprove={handleApproveProposal}
          onReject={handleRejectProposal}
          onArchive={handleArchiveProposal}
          onAdjustParam={handleAdjustParam}
          onSwitchHub={handleSwitchHub}
          onTestExceptionE2={handleTestExceptionE2}
        />
      )}

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="feedback-toast" role="status">
          <span className="check-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
