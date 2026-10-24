import { IncidentSimulationCenter } from "./IncidentSimulationCenter";

export function Module5View() {
  return (
    <div className="page-container">
      <div className="page-heading">
        <div>
          <div className="eyebrow">WHAT-IF SIMULATION & COORDINATION</div>
          <h1>Network & Incident Simulation Center</h1>
          <p className="page-subtitle">Evaluate hypothetical hardware failures and network demand shocks.</p>
        </div>
      </div>
      <IncidentSimulationCenter />
    </div>
  );
}
