import type { MitigationProposal } from "../../types/incident-simulation.types";

interface MitigationCardListProps {
  proposals: MitigationProposal[];
  onApproveProposal: (proposalId: string) => void;
}

export const MitigationCardList: React.FC<MitigationCardListProps> = ({
  proposals,
  onApproveProposal,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="section-label">
          <span>💡</span> Đề xuất Giảm thiểu Tự sinh (Mitigation Actions)
        </h3>
        <span style={{ fontSize: "10px", color: "#62716a" }}>
          Quy tắc BR-09 & BR-12 (Approve trước khi áp dụng)
        </span>
      </div>

      <div
        style={{
          fontSize: "11px",
          color: "#52635a",
          backgroundColor: "#f8faf9",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #edf1ef",
        }}
      >
        🔒 <strong>Cơ chế Approve (Approval Mechanism):</strong> Kết quả giả lập chạy hoàn toàn trên
        Sandbox. Chỉ khi Operator nhấn <strong>"Approve"</strong>, giải pháp mới chính thức được đẩy vào
        hệ thống Live để điều hướng dòng khách hoặc xếp lại lịch sạc xe điện.
      </div>

      <div className="mitigation-list">
        {proposals.map((item) => (
          <div
            key={item.id}
            className={`mitigation-card ${item.approved ? "approved" : ""}`}
          >
            <div className="mitigation-header">
              <h4 className="mitigation-title">
                {item.type === "REROUTE" ? "🔀 " : item.type === "RESCHEDULE_CHARGING" ? "⏱️ " : "🔋 "}
                {item.title}
              </h4>
              <span className="gain-tag">{item.impactGain}</span>
            </div>

            <p className="mitigation-desc">{item.description}</p>

            <div className="mitigation-meta">
              <span style={{ fontSize: "10px", color: "#7c8a83" }}>
                Khu vực áp dụng: <strong>{item.targetHubName}</strong>
              </span>

              {item.approved ? (
                <span className="btn-approved">
                  <span>✓</span> Đã Phê Duyệt ({item.approvedAt || "Vừa xong"})
                </span>
              ) : (
                <button
                  type="button"
                  className="btn-approve"
                  onClick={() => onApproveProposal(item.id)}
                  title="Xác nhận phê duyệt áp dụng đề xuất này vào hệ thống Live (BR-12)"
                >
                  <span>✓</span> Approve (Approve)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
