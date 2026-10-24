import type { SimulationResults } from "../../types/incident-simulation.types";

interface SimulationResultViewProps {
  results: SimulationResults;
}

export const SimulationResultView: React.FC<SimulationResultViewProps> = ({
  results,
}) => {
  const capacityDelta = results.projectedCapacityPercent - results.liveCapacityPercent;
  const waitDelta = results.projectedAvgWaitMinutes - results.liveAvgWaitMinutes;

  return (
    <div className="results-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="section-label">
          <span>📊</span> Kết quả Giả lập & So sánh Mạng lưới (Simulation Results)
        </h3>
        <span style={{ fontSize: "10px", color: "#62716a", fontWeight: 600 }}>
          Live vs. Projected
        </span>
      </div>

      {/* Metric Comparison Grid */}
      <div className="metric-comparison-grid">
        {/* Capacity Metric */}
        <div className="metric-card">
          <div className="metric-title">Công suất phục vụ mạng lưới</div>
          <div className="metric-values">
            <span className="metric-val-live">Live: {results.liveCapacityPercent}%</span>
            <span
              className="metric-val-projected"
              style={{
                color: results.projectedCapacityPercent < 70 ? "#c74b47" : "#087e5b",
              }}
            >
              {results.projectedCapacityPercent}%
            </span>
          </div>
          <div
            className="metric-diff"
            style={{
              color: capacityDelta < 0 ? "#c74b47" : "#087e5b",
            }}
          >
            {capacityDelta < 0 ? `Hao hụt: ${capacityDelta}%` : "Ổn định"}
          </div>
        </div>

        {/* Avg Wait Time Metric */}
        <div className="metric-card">
          <div className="metric-title">Thời gian chờ dự kiến</div>
          <div className="metric-values">
            <span className="metric-val-live">Live: {results.liveAvgWaitMinutes} phút</span>
            <span
              className="metric-val-projected"
              style={{
                color: results.projectedAvgWaitMinutes > 15 ? "#c74b47" : "#087e5b",
              }}
            >
              {results.projectedAvgWaitMinutes} phút
            </span>
          </div>
          <div
            className="metric-diff"
            style={{
              color: waitDelta > 0 ? "#c74b47" : "#087e5b",
            }}
          >
            {waitDelta > 0 ? `Tăng thêm: +${waitDelta.toFixed(1)} phút` : "Bình thường"}
          </div>
        </div>
      </div>

      {/* Capacity Deficit Warning */}
      <div
        style={{
          padding: "10px 14px",
          backgroundColor: "#fff4df",
          border: "1px solid #fed7aa",
          borderRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "11px",
        }}
      >
        <span style={{ color: "#b77918", fontWeight: 600 }}>
          ⚠️ Ước tính hao hụt phục vụ do quá tải & lỗi trạm:
        </span>
        <strong style={{ color: "#b77918", fontFamily: "Manrope, sans-serif", fontSize: "13px" }}>
          -{results.lostCapacitySlots} lượt xe / giờ
        </strong>
      </div>

      {/* Bottlenecks Bar Visualization */}
      <div className="bottleneck-box">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "#172b25" }}>
          <span>Phân tích Điểm nghẽn Trọng yếu (Hub Bottlenecks)</span>
          <span style={{ fontSize: "10px", color: "#8b9992" }}>Mức tải dự phóng</span>
        </div>

        {results.bottlenecks.map((item) => (
          <div key={item.hubId} className="bar-item">
            <div className="bar-header">
              <span>{item.hubName}</span>
              <span
                style={{
                  color:
                    item.status === "Critical"
                      ? "#c74b47"
                      : item.status === "Warning"
                      ? "#b77918"
                      : "#087e5b",
                  fontWeight: 700,
                }}
              >
                {item.projectedLoad}% {item.status === "Critical" ? "(Nghẽn nghiêm trọng)" : item.status === "Warning" ? "(Cảnh báo nghẽn)" : "(Thông suốt)"}
              </span>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill ${item.status.toLowerCase()}`}
                style={{
                  width: `${Math.min(item.projectedLoad, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
