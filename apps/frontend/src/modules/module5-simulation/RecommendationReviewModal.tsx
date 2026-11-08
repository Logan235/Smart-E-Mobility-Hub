import React, { useState } from "react";
import type {
  MitigationProposal,
} from "../../types/incident-simulation.types";

interface RecommendationReviewModalProps {
  proposal: MitigationProposal;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (proposalId: string, notes?: string) => void;
  onReject: (proposalId: string, reason?: string) => void;
  onArchive: (proposalId: string) => void;
  onAdjustParam: (proposalId: string, paramId: string, value: number) => void;
  onSwitchHub: (proposalId: string, newHubId: string) => void;
  onTestExceptionE2: (proposalId: string) => void;
}

export const RecommendationReviewModal: React.FC<RecommendationReviewModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onArchive,
  onAdjustParam,
  onSwitchHub,
  onTestExceptionE2,
}) => {
  const [operatorNotes, setOperatorNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!isOpen) return null;

  const isApproved = proposal.status === "APPROVED";
  const isRejected = proposal.status === "REJECTED";
  const isArchived = proposal.status === "ARCHIVED";
  const canAct = !isApproved && !isRejected && !isArchived;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-eyebrow">
              {proposal.code} • UC-SIM-02 REVIEW & APPLY
            </div>
            <h3>{proposal.title}</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className={`status-pill ${
                isApproved
                  ? "pill-approved"
                  : isRejected
                  ? "pill-rejected"
                  : isArchived
                  ? "pill-archived"
                  : "pill-pending"
              }`}
            >
              {proposal.status}
            </span>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Target Scope */}
          <div className="modal-section">
            <h4 className="section-title">1. Operational Scope & Affected Resources</h4>
            <div className="scope-grid">
              <div className="scope-item">
                <span className="scope-label">Target Hub Corridor:</span>
                <span className="scope-value">{proposal.targetHubName}</span>
              </div>
              <div className="scope-item">
                <span className="scope-label">Mitigation Type:</span>
                <span className="scope-value">{proposal.type}</span>
              </div>
              <div className="scope-item full-width">
                <span className="scope-label">Affected Hardware / Vehicles:</span>
                <div className="resource-pills-list">
                  {proposal.affectedResources.map((res) => (
                    <span key={res} className="resource-tag">
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Expected Operational Impact */}
          <div className="modal-section">
            <h4 className="section-title">2. Expected Operational Impact</h4>
            <div className="impact-metrics-grid">
              <div className="metric-box">
                <span className="metric-number">
                  +{proposal.expectedImpact.capacityGainPercent}%
                </span>
                <span className="metric-desc">Serving Capacity Gain</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">
                  -{proposal.expectedImpact.waitReductionMinutes}m
                </span>
                <span className="metric-desc">Avg Wait Reduction</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">
                  +{proposal.expectedImpact.relievedSlotsPerHour}
                </span>
                <span className="metric-desc">Relieved Slots / Hour</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">
                  {proposal.expectedImpact.reliabilityScore}%
                </span>
                <span className="metric-desc">Model Reliability Score</span>
              </div>
            </div>
          </div>

          {/* Feasibility & Constraints Verification */}
          <div className="modal-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h4 className="section-title" style={{ margin: 0 }}>
                3. Real-time Feasibility & Constraint Verification (BR-11)
              </h4>
              <button
                type="button"
                className="btn-test-e2"
                onClick={() => onTestExceptionE2(proposal.id)}
                title="Simulate network fault causing constraint violation"
              >
                ⚠️ Test Exception Flow E2 (State Conflict)
              </button>
            </div>

            {proposal.feasibility.warningMessage && (
              <div className="feasibility-alert-box alert-error">
                <strong>Exception Flow E2 Triggered:</strong> {proposal.feasibility.warningMessage}
              </div>
            )}

            <div className="constraints-list">
              {proposal.feasibility.constraintsChecked.map((constraint, idx) => (
                <div
                  key={idx}
                  className={`constraint-row ${constraint.passed ? "passed" : "failed"}`}
                >
                  <span className="constraint-indicator">
                    {constraint.passed ? "✓" : "✗"}
                  </span>
                  <div className="constraint-info">
                    <span className="constraint-name">{constraint.name}</span>
                    <span className="constraint-detail">{constraint.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parameter Tuning (Alternate Flow A1) */}
          {proposal.adjustableParams && proposal.adjustableParams.length > 0 && (
            <div className="modal-section">
              <h4 className="section-title">
                4. Parameter Fine-Tuning (Alternate Flow A1)
              </h4>
              <p className="section-hint">
                Adjust supported parameters to recalculate expected operational impacts dynamically before approval.
              </p>
              <div className="parameters-stack">
                {proposal.adjustableParams.map((param) => (
                  <div key={param.id} className="param-item">
                    <div className="param-header">
                      <div>
                        <strong>{param.name}</strong>
                        <div className="param-desc">{param.description}</div>
                      </div>
                      <div className="param-badge">
                        {param.currentValue} {param.unit}
                      </div>
                    </div>
                    <div className="slider-row">
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={param.currentValue}
                        disabled={!canAct}
                        onChange={(e) =>
                          onAdjustParam(proposal.id, param.id, Number(e.target.value))
                        }
                      />
                      <span className="slider-limits">
                        {param.min}{param.unit} - {param.max}{param.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Hub Selection (Alternate Flow A2) */}
          {proposal.alternativeHubs && proposal.alternativeHubs.length > 0 && (
            <div className="modal-section">
              <h4 className="section-title">
                5. Alternative Hub Accommodation (Alternate Flow A2)
              </h4>
              <p className="section-hint">
                Select an alternative eligible Hub if primary corridor cannot accommodate the proposed action.
              </p>
              <div className="hubs-grid">
                {proposal.alternativeHubs.map((hub) => (
                  <div
                    key={hub.hubId}
                    className={`hub-card ${
                      proposal.targetHubName.includes(hub.hubName)
                        ? "hub-selected"
                        : ""
                    } ${!hub.isEligible ? "hub-ineligible" : ""}`}
                    onClick={() => {
                      if (canAct && hub.isEligible) {
                        onSwitchHub(proposal.id, hub.hubId);
                      }
                    }}
                  >
                    <div className="hub-card-top">
                      <strong>{hub.hubName}</strong>
                      <span className="hub-dist">{hub.distanceMeters}m</span>
                    </div>
                    <div className="hub-card-stats">
                      <span>Occupancy: {hub.currentOccupancy}%</span>
                      <span>Available: {hub.availableSlots} slots</span>
                    </div>
                    <div className="hub-card-tag">
                      {hub.isEligible ? "Eligible" : "Overloaded"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operator Coordination Notes */}
          <div className="modal-section">
            <h4 className="section-title">6. Operator Coordination Notes</h4>
            <textarea
              className="notes-textarea"
              placeholder="Enter dispatch instructions, justification, or monitoring notes before applying to live network..."
              value={operatorNotes}
              disabled={!canAct}
              onChange={(e) => setOperatorNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Audit Trail & Decision History */}
          <div className="modal-section">
            <h4 className="section-title">7. Audit Trail & Decision Log</h4>
            <div className="audit-timeline">
              {proposal.auditTrail.map((log, idx) => (
                <div key={idx} className="audit-entry">
                  <div className="audit-time">{log.timestamp}</div>
                  <div className="audit-content">
                    <span className="audit-actor">{log.operatorId}</span>
                    <span className="audit-badge">{log.decision}</span>
                    <p className="audit-summary">{log.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {canAct && !showRejectInput && (
              <button
                type="button"
                className="btn-modal-reject"
                onClick={() => setShowRejectInput(true)}
              >
                Reject Proposal (A4)
              </button>
            )}

            {canAct && showRejectInput && (
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "1px solid #d8e2dc",
                    fontSize: "12px",
                  }}
                />
                <button
                  type="button"
                  className="btn-modal-reject"
                  onClick={() => {
                    onReject(proposal.id, rejectReason);
                    setShowRejectInput(false);
                  }}
                >
                  Confirm Reject
                </button>
              </div>
            )}

            {canAct && (
              <button
                type="button"
                className="btn-modal-archive"
                onClick={() => onArchive(proposal.id)}
              >
                Archive Scenario (A3)
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Close
            </button>
            {canAct && (
              <button
                type="button"
                className="btn-modal-approve"
                disabled={!proposal.feasibility.isFeasible}
                onClick={() => onApprove(proposal.id, operatorNotes)}
                title={
                  !proposal.feasibility.isFeasible
                    ? "Cannot apply: Operational constraints not met (BR-11)"
                    : "Explicit Operator approval will dispatch live operational action (BR-12)"
                }
              >
                <span>✓</span> Approve & Dispatch Action (BR-12)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

