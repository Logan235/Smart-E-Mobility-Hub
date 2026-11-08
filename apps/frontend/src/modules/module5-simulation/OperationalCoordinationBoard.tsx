import React from "react";
import type { OperationalAction } from "../../types/incident-simulation.types";

interface OperationalCoordinationBoardProps {
  actions: OperationalAction[];
}

export const OperationalCoordinationBoard: React.FC<OperationalCoordinationBoardProps> = ({
  actions,
}) => {
  return (
    <div className="coordination-board-card">
      <div className="coordination-header">
        <div className="coord-title-group">
          <h3>
            <span>📋</span> Live Operational Coordination Board (BR-12)
          </h3>
          <p className="coord-subtitle">
            Approved simulation recommendations converted into live operational coordination actions. Live network state is updated ONLY upon explicit operator approval.
          </p>
        </div>
        <div className="coord-counter-badge">
          {actions.length} Actions Active
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="empty-coordination-state">
          <span className="empty-icon">🛡️</span>
          <div className="empty-title">Simulation Sandbox Fully Isolated (BR-09)</div>
          <p className="empty-desc">
            No simulation proposals have been approved yet. Live Mobility Hub network remains strictly untouched.
            To dispatch operational coordination, click <strong>"Review & Apply"</strong> on any mitigation recommendation above and confirm approval.
          </p>
        </div>
      ) : (
        <div className="coordination-table-wrapper">
          <table className="coordination-table">
            <thead>
              <tr>
                <th>Action ID & Time</th>
                <th>Recommendation / Action Title</th>
                <th>Corridor / Target Hub</th>
                <th>Affected Hardware</th>
                <th>Dispatch Target</th>
                <th>Status & Live State</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((act) => (
                <tr key={act.actionId}>
                  <td>
                    <span className="action-id-tag">{act.actionId}</span>
                    <span className="action-time">{act.createdAt}</span>
                  </td>
                  <td>
                    <div className="action-title-cell">
                      <strong>{act.title}</strong>
                      <span className="action-type-pill">{act.actionType}</span>
                      {act.operatorNotes && (
                        <p className="action-notes">"{act.operatorNotes}"</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="hub-cell-name">{act.targetHubName}</span>
                  </td>
                  <td>
                    <div className="affected-chips">
                      {act.affectedResources.map((r) => (
                        <span key={r} className="chip">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="dispatch-target">{act.dispatchedTo}</span>
                  </td>
                  <td>
                    <div className="status-live-cell">
                      <span className="status-badge-applied">{act.status}</span>
                      {act.liveNetworkApplied && (
                        <span
                          className="live-sync-badge"
                          title="BR-12: Live operational network state modified explicitly via this action"
                        >
                          ● LIVE MODIFIED
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

