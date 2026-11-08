import React from "react";
import type {
  MitigationProposal,
  OperationalAction,
  SimulationResults,
  SimulationScenario,
} from "../../types/incident-simulation.types";
import { ScenarioConfigForm } from "./ScenarioConfigForm";
import { SimulationResultView } from "./SimulationResultView";
import { MitigationCardList } from "./MitigationCardList";
import { OperationalCoordinationBoard } from "./OperationalCoordinationBoard";

interface WhatIfSimulationPaneProps {
  scenario: SimulationScenario;
  results: SimulationResults;
  proposals: MitigationProposal[];
  coordinationActions: OperationalAction[];
  isSimulating: boolean;
  onScenarioChange: (scenario: SimulationScenario) => void;
  onRunSimulation: () => void;
  onOpenReview: (proposal: MitigationProposal) => void;
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
  onArchiveProposal: (proposalId: string) => void;
}

export const WhatIfSimulationPane: React.FC<WhatIfSimulationPaneProps> = ({
  scenario,
  results,
  proposals,
  coordinationActions,
  isSimulating,
  onScenarioChange,
  onRunSimulation,
  onOpenReview,
  onApproveProposal,
  onRejectProposal,
  onArchiveProposal,
}) => {
  const approvedCount = proposals.filter((p) => p.status === "APPROVED").length;

  return (
    <div className="pane-card">
      <div className="pane-header">
        <div>
          <h2>
            <span>📈</span> Module 5: What-if Simulation & Operator Center
          </h2>
          <p className="pane-subtitle">
            Demand & Capacity Simulation and Recommendation Evaluation (UC-SIM-02)
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="pane-tag" style={{ color: "#087e5b", borderColor: "#a7f3d0" }}>
            🛡️ Isolated Sandbox (BR-09)
          </span>
          <span className="pane-tag" style={{ color: "#11936a" }}>
            ✓ {approvedCount}/{proposals.length} Approved & Dispatched (BR-12)
          </span>
        </div>
      </div>

      <div className="pane-body">
        {/* Scenario Configuration Form */}
        <ScenarioConfigForm
          scenario={scenario}
          onScenarioChange={onScenarioChange}
          onRunSimulation={onRunSimulation}
          isSimulating={isSimulating}
        />

        {/* Simulation Results View */}
        <SimulationResultView results={results} />

        {/* Mitigation Recommendations & Evaluation (UC-SIM-02) */}
        <MitigationCardList
          proposals={proposals}
          onOpenReview={onOpenReview}
          onApproveProposal={onApproveProposal}
          onRejectProposal={onRejectProposal}
          onArchiveProposal={onArchiveProposal}
        />

        {/* Operational Coordination Board (Post-conditions 2, 3, 4) */}
        <OperationalCoordinationBoard actions={coordinationActions} />
      </div>
    </div>
  );
};
