import React from "react";
import type { MitigationProposal } from "../../types/incident-simulation.types";

interface MitigationCardListProps {
  proposals: MitigationProposal[];
  onOpenReview: (proposal: MitigationProposal) => void;
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal?: (proposalId: string) => void;
  onArchiveProposal?: (proposalId: string) => void;
}

export const MitigationCardList: React.FC<MitigationCardListProps> = ({
  proposals,
  onOpenReview,
  onApproveProposal,
  onRejectProposal,
  onArchiveProposal,
}) => {
  return (
    <div className="proposals-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="section-label">
          <span>💡</span> Automated Mitigation Recommendations (What-if Engine)
        </h3>
        <span style={{ fontSize: "10px", color: "#62716a", fontWeight: 600 }}>
          {proposals.length} Proposals Generated
        </span>
      </div>

      <div className="approval-rule-note">
        <strong>Operational Governance (BR-09, BR-12):</strong> The simulation engine runs in an isolated sandbox.
        Live network resources are updated <strong>only</strong> when the Operator explicitly reviews and approves the recommendation below.
      </div>

      <div className="proposal-cards-stack">
        {proposals.map((proposal) => {
          const isApproved = proposal.status === "APPROVED";
          const isRejected = proposal.status === "REJECTED";
          const isArchived = proposal.status === "ARCHIVED";
          const canAct = !isApproved && !isRejected && !isArchived;

          return (
            <div
              key={proposal.id}
              className={`proposal-card ${
                isApproved
                  ? "card-approved"
                  : isRejected
                  ? "card-rejected"
                  : isArchived
                  ? "card-archived"
                  : ""
              }`}
            >
              <div className="card-top-row">
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span
                    className="type-tag"
                    style={{
                      backgroundColor:
                        proposal.type === "REROUTE"
                          ? "#eaf6f0"
                          : proposal.type === "RESCHEDULE_CHARGING"
                          ? "#eff6ff"
                          : "#fdf4ff",
                      color:
                        proposal.type === "REROUTE"
                          ? "#087e5b"
                          : proposal.type === "RESCHEDULE_CHARGING"
                          ? "#1e40af"
                          : "#86198f",
                    }}
                  >
                    {proposal.type === "REROUTE"
                      ? "Reroute Flow"
                      : proposal.type === "RESCHEDULE_CHARGING"
                      ? "Reschedule Charging"
                      : "Deploy Mobile Buffer"}
                  </span>
                  <span className="hub-route-tag">{proposal.targetHubName}</span>
                </div>

                <span className="gain-badge">{proposal.impactGain}</span>
              </div>

              <h4 className="proposal-title">{proposal.title}</h4>
              <p className="proposal-desc">{proposal.description}</p>

              {/* Status and Action Buttons */}
              <div className="card-action-row">
                <div className="proposal-status-info">
                  {isApproved && (
                    <span className="approved-badge">
                      ✓ Approved & Dispatched ({proposal.approvedAt})
                    </span>
                  )}
                  {isRejected && (
                    <span className="rejected-badge">
                      ✗ Rejected by Operator (Live Unchanged)
                    </span>
                  )}
                  {isArchived && (
                    <span className="archived-badge">
                      📁 Archived for Analysis (A3)
                    </span>
                  )}
                  {canAct && (
                    <span className="pending-badge">
                      ● Pending Operator Review
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className="btn-review-detail"
                    onClick={() => onOpenReview(proposal)}
                  >
                    🔍 Review & Apply
                  </button>

                  {canAct && (
                    <>
                      <button
                        type="button"
                        className="btn-approve"
                        onClick={() => onApproveProposal(proposal.id)}
                        title="Quick Approve: Directly dispatch action to live network (BR-12)"
                      >
                        Approve (BR-12)
                      </button>

                      {onArchiveProposal && (
                        <button
                          type="button"
                          className="btn-archive-quick"
                          onClick={() => onArchiveProposal(proposal.id)}
                          title="Archive Scenario (Alternate Flow A3)"
                        >
                          Archive (A3)
                        </button>
                      )}

                      {onRejectProposal && (
                        <button
                          type="button"
                          className="btn-reject-quick"
                          onClick={() => onRejectProposal(proposal.id)}
                          title="Reject Proposal (Alternate Flow A4)"
                        >
                          Reject (A4)
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
