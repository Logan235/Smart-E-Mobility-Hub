import type {
  MitigationProposal,
  SimulationResults,
  SimulationScenario,
} from "../../types/incident-simulation.types";
import { ScenarioConfigForm } from "./ScenarioConfigForm";
import { SimulationResultView } from "./SimulationResultView";
import { MitigationCardList } from "./MitigationCardList";

interface WhatIfSimulationPaneProps {
  scenario: SimulationScenario;
  results: SimulationResults;
  proposals: MitigationProposal[];
  isSimulating: boolean;
  onScenarioChange: (scenario: SimulationScenario) => void;
  onRunSimulation: () => void;
  onApproveProposal: (proposalId: string) => void;
}

export const WhatIfSimulationPane: React.FC<WhatIfSimulationPaneProps> = ({
  scenario,
  results,
  proposals,
  isSimulating,
  onScenarioChange,
  onRunSimulation,
  onApproveProposal,
}) => {
  const approvedCount = proposals.filter((p) => p.approved).length;

  return (
    <div className="pane-card">
      <div className="pane-header">
        <div>
          <h2>
            <span>📈</span> Simulation Dashboard (What-if Simulation Engine)
          </h2>
          <p className="pane-subtitle">
            Giả lập kịch bản sự cố phần cứng & đột biến tải, đánh giá điểm nghẽn và phê duyệt hành động
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="pane-tag" style={{ color: "#087e5b", borderColor: "#a7f3d0" }}>
            Sandbox An Toàn
          </span>
          <span className="pane-tag" style={{ color: "#11936a" }}>
            ✓ {approvedCount}/{proposals.length} Đã Duyệt (BR-12)
          </span>
        </div>
      </div>

      <div className="pane-body">
        {/* Form Scenario Configuration */}
        <ScenarioConfigForm
          scenario={scenario}
          onScenarioChange={onScenarioChange}
          onRunSimulation={onRunSimulation}
          isSimulating={isSimulating}
        />

        {/* Khối Kết quả Giả lập */}
        <SimulationResultView results={results} />

        {/* Khối Đề xuất Giảm thiểu & Approve */}
        <MitigationCardList
          proposals={proposals}
          onApproveProposal={onApproveProposal}
        />
      </div>
    </div>
  );
};
