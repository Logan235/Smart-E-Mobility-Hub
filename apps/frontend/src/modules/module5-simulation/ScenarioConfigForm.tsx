import React from "react";
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
    { id: "HUB-METRO", name: "Metro Station Hub (Intermodal Corridor)" },
    { id: "HUB-DORM", name: "Dormitory Area B Hub (Student Residential)" },
    { id: "HUB-CAMPUS", name: "Campus Center Hub (University Faculties)" },
    { id: "HUB-SERVICE", name: "Service & Sports Area Hub" },
  ];

  return (
    <div className="config-box">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#172b25" }}>
          ⚙️ Scenario Configuration (What-if Engine)
        </span>
        <span style={{ fontSize: "11px", color: "#62716a" }}>
          Sandbox Environment (BR-09)
        </span>
      </div>

      {/* Target Hub Selection */}
      <div className="form-group">
        <label className="form-label-row" htmlFor="target-hub">
          <span>Primary Target Corridor / Hub</span>
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
            Hardware Failure Rate (Charging Ports & EVs)
          </label>
          <span className="value-tag">{scenario.chargerFailureRate}% Offline</span>
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
          <span>0% (Nominal)</span>
          <span>50% (Major Incident)</span>
          <span>100% (Substation Outage)</span>
        </div>
      </div>

      {/* Demand Surge Slider */}
      <div className="form-group">
        <div className="form-label-row">
          <label htmlFor="demand-surge">
            Mobility Demand Surge (User Influx)
          </label>
          <span className="value-tag">+{scenario.demandSurgeRate}% Influx</span>
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
          <span>+0% (Base Traffic)</span>
          <span>+75% (Commuter Peak)</span>
          <span>+150% (Campus Event Surge)</span>
        </div>
      </div>

      {/* Time Window */}
      <div className="form-group">
        <label className="form-label-row" htmlFor="time-window">
          <span>Simulation Horizon Window</span>
        </label>
        <select
          id="time-window"
          className="select-input"
          value={scenario.simulationWindow}
          onChange={(e) =>
            onScenarioChange({ ...scenario, simulationWindow: e.target.value })
          }
        >
          <option value="Peak Hours (16:30 - 19:00)">Evening Peak Hours (16:30 - 19:00)</option>
          <option value="Morning Peak (07:00 - 09:30)">Morning Peak Hours (07:00 - 09:30)</option>
          <option value="Night Operations (21:00 - 23:00)">Night Operational Window (21:00 - 23:00)</option>
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
        {isSimulating ? "Computing Network Matrix..." : "Run Simulation Analysis (Simulate)"}
      </button>
    </div>
  );
};
