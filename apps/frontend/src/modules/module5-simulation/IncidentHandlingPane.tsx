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
            <span>⚠️</span> Xử lý Sự cố Thời gian thực (Incident Handling)
          </h2>
          <p className="pane-subtitle">
            Giám sát cảnh báo thiết bị, chuyển đổi trạng thái và thực thi Khóa tài nguyên (BR-07)
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span className="pane-tag alert-count">
            {alerts.length} Sự cố
          </span>
          <span className="pane-tag" style={{ color: "#c74b47", borderColor: "#fecaca" }}>
            🔒 {lockedCount} Đang Khóa
          </span>
        </div>
      </div>

      <div className="pane-body">
        {/* Rule note explaining BR-07 */}
        <div className="rule-note">
          <strong>Quy tắc Nghiệp vụ BR-07:</strong> Khi tài nguyên được gắn trạng thái{" "}
          <em>Maintenance</em>, <em>Faulty</em>, hoặc <em>Out of Service</em>, hệ thống lập tức kích hoạt biểu tượng{" "}
          <strong>Khóa (Locked)</strong> để ngăn chặn triệt để mọi yêu cầu đặt chỗ xe điện hoặc lập lịch sạc mới.
        </div>

        {/* Incident Alerts Table */}
        <div className="incident-table-wrapper">
          <table className="incident-table">
            <thead>
              <tr>
                <th>Thiết bị / Vị trí</th>
                <th>Mô tả Sự cố</th>
                <th>Mức độ</th>
                <th>Trạng thái & Khóa (BR-07)</th>
                <th>Thao tác Nhanh</th>
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
                          title="BR-07: Tài nguyên đang khóa, không thể đặt xe hoặc sạc"
                        >
                          🔒 ĐÃ KHÓA
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#087e5b",
                            backgroundColor: "#eaf6f0",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            width: "fit-content",
                          }}
                        >
                          ✓ SẴN SÀNG
                        </span>
                      )}
                      <small style={{ fontSize: "10px", color: "#7c8a83" }}>
                        Hiện tại: {alert.status}
                      </small>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`status-select ${
                        alert.status === "Maintenance"
                          ? "maintenance"
                          : alert.status === "Faulty"
                          ? "faulty"
                          : ""
                      }`}
                      value={alert.status}
                      onChange={(e) =>
                        onStatusChange(alert.id, e.target.value as ResourceStatus)
                      }
                      aria-label={`Thay đổi trạng thái cho ${alert.deviceCode}`}
                    >
                      <option value="Active">Active (Mở khóa)</option>
                      <option value="Maintenance">Maintenance (Bảo trì)</option>
                      <option value="Faulty">Faulty (Báo hỏng)</option>
                      <option value="Out of Service">Out of Service (Ngừng HĐ)</option>
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
