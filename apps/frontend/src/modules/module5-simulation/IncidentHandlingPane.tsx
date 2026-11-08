import React from "react";
import type { IncidentAlert, ResourceStatus } from "../../types/incident-simulation.types";

interface IncidentHandlingPaneProps {
  alerts: IncidentAlert[];
  onStatusChange: (alertId: string, newStatus: ResourceStatus) => void;
}

export const IncidentHandlingPane: React.FC<IncidentHandlingPaneProps> = ({
  alerts,
  onStatusChange,
}) => {
  const lockedCount = alerts.filter((a) => a.isLocked).length;

  return (
    <div className="pane-card">
      <div className="pane-header">
        <div>
          <h2>
            <span>⚠️</span> Real-time Incident Handling
          </h2>
          <p className="pane-subtitle">
            Hardware alert monitoring, quick status transitions, and resource locking (BR-07)
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="pane-tag alert-count">
            {alerts.length} Incidents
          </span>
          <span className="pane-tag" style={{ color: "#c74b47", borderColor: "#fecaca" }}>
            🔒 {lockedCount} Locked
          </span>
        </div>
      </div>

      <div className="pane-body">
        {/* Rule note explaining BR-07 */}
        <div className="rule-note">
          <strong>Business Rule BR-07:</strong> When a resource is set to{" "}
          <em>Maintenance</em>, <em>Faulty</em>, or <em>Out of Service</em>, the system immediately applies a{" "}
          <strong>Locked</strong> state to strictly prevent new EV reservations or charging schedules.
        </div>

        {/* Incident Alerts Table */}
        <div className="incident-table-wrapper">
          <table className="incident-table">
            <thead>
              <tr>
                <th>Device / Location</th>
                <th>Issue Description</th>
                <th>Severity</th>
                <th>Status & Lock (BR-07)</th>
                <th>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <span className="device-badge">
                      {alert.deviceType === "EV" ? "🚗" : "⚡"} {alert.deviceCode}
                    </span>
                    <span className="hub-label">{alert.hubName}</span>
                    <span className="time-stamp">{alert.reportedAt}</span>
                  </td>
                  <td>
                    <span className="issue-text">{alert.issueDescription}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "3px 6px",
                        borderRadius: "4px",
                        backgroundColor:
                          alert.severity === "CRITICAL"
                            ? "#ffebea"
                            : alert.severity === "HIGH"
                            ? "#fff4df"
                            : "#f6f8f7",
                        color:
                          alert.severity === "CRITICAL"
                            ? "#c74b47"
                            : alert.severity === "HIGH"
                            ? "#b77918"
                            : "#62716a",
                      }}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <div className="status-lock-cell">
                      {alert.isLocked ? (
                        <span
                          className="lock-pill"
                          title="BR-07: Resource is locked, preventing reservations and charging"
                        >
                          🔒 LOCKED
                        </span>
                      ) : (
                        <span className="unlocked-pill">🟢 UNLOCKED</span>
                      )}
                      <span className="current-status-label">{alert.status}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={alert.status}
                      onChange={(e) =>
                        onStatusChange(alert.id, e.target.value as ResourceStatus)
                      }
                      aria-label={`Change status of ${alert.deviceCode}`}
                    >
                      <option value="Active">Active (Unlocked)</option>
                      <option value="Maintenance">Maintenance (Lock)</option>
                      <option value="Faulty">Faulty (Lock)</option>
                      <option value="Out of Service">Out of Service (Lock)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
