import type { SimulationScenario } from "../../types/incident-simulation.types";

interface ScenarioConfigFormProps {
  scenario: SimulationScenario;
  onScenarioChange: (newScenario: SimulationScenario) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export const ScenarioConfigForm: React.FC<ScenarioConfigFormProps> = ({
  scenario,
  onScenarioChange,
  onRunSimulation,
  isSimulating,
}) => {
  const hubs = [
    { id: "HUB-METRO", name: "Ga Metro Hub (Khu vực trung tâm)" },
    { id: "HUB-DORM", name: "Hub Ký túc xá Khu B (Khu dân cư sinh viên)" },
    { id: "HUB-CAMPUS", name: "Hub Trung tâm Khu ĐHQG (Giảng đường)" },
    { id: "HUB-SERVICE", name: "Hub Khu Dịch Vụ & Thể Thao" },
  ];

  return (
    <div className="config-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#172b25" }}>
          ⚙️ Cấu hình Kịch bản What-if
        </span>
        <span style={{ fontSize: "11px", color: "#62716a" }}>
          Môi trường mô phỏng ảo (Sandbox)
        </span>
      </div>

      {/* Target Hub Selection */}
      <div className="form-group">
        <label className="form-label-row" htmlFor="target-hub">
          <span>Trạm áp dụng kịch bản chính</span>
        </label>
        <select
          id="target-hub"
          className="select-input"
          value={scenario.targetHubId}
          onChange={(e) =>
            onScenarioChange({ ...scenario, targetHubId: e.target.value })
          }
        >
          {hubs.map((hub) => (
            <option key={hub.id} value={hub.id}>
              {hub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Hardware Failure Rate Slider */}
      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="charger-failure">
            Tỷ lệ sự cố phần cứng cổng sạc tại trạm
          </label>
          <span className="value-tag">{scenario.chargerFailureRate}% hỏng hóc</span>
        </div>
        <input
          id="charger-failure"
          type="range"
          min="0"
          max="100"
          step="5"
          className="slider-input"
          value={scenario.chargerFailureRate}
          onChange={(e) =>
            onScenarioChange({
              ...scenario,
              chargerFailureRate: Number(e.target.value),
            })
          }
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#8b9992" }}>
          <span>0% (Bình thường)</span>
          <span>50% (Sự cố lớn)</span>
          <span>100% (Mất điện toàn trạm)</span>
        </div>
      </div>

      {/* Demand Surge Slider */}
      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="demand-surge">
            Đột biến nhu cầu di chuyển (Demand Surge)
          </label>
          <span className="value-tag">+{scenario.demandSurgeRate}% nhu cầu</span>
        </div>
        <input
          id="demand-surge"
          type="range"
          min="0"
          max="150"
          step="5"
          className="slider-input"
          value={scenario.demandSurgeRate}
          onChange={(e) =>
            onScenarioChange({
              ...scenario,
              demandSurgeRate: Number(e.target.value),
            })
          }
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#8b9992" }}>
          <span>+0% (Tải cơ bản)</span>
          <span>+75% (Tan tầm cao điểm)</span>
          <span>+150% (Sự kiện / Giờ vàng)</span>
        </div>
      </div>

      {/* Time Window */}
      <div className="form-group">
        <label className="form-label-row" htmlFor="time-window">
          <span>Khung giờ dự phóng kịch bản</span>
        </label>
        <select
          id="time-window"
          className="select-input"
          value={scenario.simulationWindow}
          onChange={(e) =>
            onScenarioChange({ ...scenario, simulationWindow: e.target.value })
          }
        >
          <option value="Peak Hours (16:30 - 19:00)">Giờ cao điểm chiều (16:30 - 19:00)</option>
          <option value="Morning Peak (07:00 - 09:30)">Giờ cao điểm sáng (07:00 - 09:30)</option>
          <option value="Night Operations (21:00 - 23:00)">Khung giờ đêm (21:00 - 23:00)</option>
        </select>
      </div>

      {/* Action Button */}
      <button
        type="button"
        className={`btn-simulate ${isSimulating ? "running" : ""}`}
        onClick={onRunSimulation}
        disabled={isSimulating}
      >
        <span>⚡</span>
        {isSimulating ? "Đang tính toán ma trận mạng lưới..." : "Chạy Phân Tích Mô Phỏng (Simulate)"}
      </button>
    </div>
  );
};
