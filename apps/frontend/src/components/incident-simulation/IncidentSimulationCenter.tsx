import React, { useMemo, useState } from "react";
import "./IncidentSimulationCenter.css";
import type {
  IncidentAlert,
  MitigationProposal,
  ResourceStatus,
  SimulationResults,
  SimulationScenario,
} from "../../types/incident-simulation.types";
import { IncidentHandlingPane } from "./IncidentHandlingPane";
import { WhatIfSimulationPane } from "./WhatIfSimulationPane";

const INITIAL_ALERTS: IncidentAlert[] = [
  {
    id: "ALT-01",
    deviceType: "CHARGING_PORT",
    deviceCode: "PORT-METRO-04",
    hubId: "HUB-METRO",
    hubName: "Ga Metro Hub",
    issueDescription: "Mất kết nối nguồn cao áp DC, không thể cấp điện sạc",
    severity: "CRITICAL",
    status: "Faulty",
    isLocked: true, // BR-07
    reportedAt: "10:14:22",
  },
  {
    id: "ALT-02",
    deviceType: "EV",
    deviceCode: "EV-1031 (E-Bike)",
    hubId: "HUB-METRO",
    hubName: "Ga Metro Hub",
    issueDescription: "Cảm biến phanh báo lỗi, pin tụt nhanh đột ngột (18%)",
    severity: "HIGH",
    status: "Maintenance",
    isLocked: true, // BR-07
    reportedAt: "10:28:40",
  },
  {
    id: "ALT-03",
    deviceType: "CHARGING_PORT",
    deviceCode: "PORT-DORM-02",
    hubId: "HUB-DORM",
    hubName: "Hub Ký túc xá Khu B",
    issueDescription: "Chốt khóa đầu sạc cơ khí bị kẹt, cần kiểm tra kỹ thuật",
    severity: "MEDIUM",
    status: "Maintenance",
    isLocked: true, // BR-07
    reportedAt: "09:45:10",
  },
  {
    id: "ALT-04",
    deviceType: "EV",
    deviceCode: "EV-3022 (E-Scooter)",
    hubId: "HUB-CAMPUS",
    hubName: "Hub Giảng đường ĐHQG",
    issueDescription: "Lốp trước giảm áp suất, cần bơm bảo dưỡng",
    severity: "MEDIUM",
    status: "Out of Service",
    isLocked: true, // BR-07
    reportedAt: "08:30:15",
  },
  {
    id: "ALT-05",
    deviceType: "CHARGING_PORT",
    deviceCode: "PORT-METRO-02",
    hubId: "HUB-METRO",
    hubName: "Ga Metro Hub",
    issueDescription: "Cổng sạc sẵn sàng hoạt động",
    severity: "MEDIUM",
    status: "Active",
    isLocked: false,
    reportedAt: "07:15:00",
  },
];

const INITIAL_PROPOSALS: MitigationProposal[] = [
  {
    id: "PROP-01",
    title: "Điều hướng lưu lượng khách sang Hub Ký túc xá lân cận",
    description:
      "Tự động gửi thông báo gợi ý người dùng di chuyển sang Hub KTX Khu B cách 450m (tặng ưu đãi 20% cước phí chuyến).",
    type: "REROUTE",
    impactGain: "+18% công suất phục vụ",
    targetHubId: "HUB-METRO",
    targetHubName: "Ga Metro Hub ➔ KTX Khu B",
    approved: false,
  },
  {
    id: "PROP-02",
    title: "Dời lịch sạc thường của 6 xe điện dự phòng",
    description:
      "Tạm hoãn lịch sạc chậm AC của các phương tiện chưa có khách đặt sang khung giờ thấp điểm (sau 21:00) để nhường công suất nguồn điện cho cổng sạc nhanh.",
    type: "RESCHEDULE_CHARGING",
    impactGain: "Giải phóng 45kW tải điện",
    targetHubId: "HUB-METRO",
    targetHubName: "Ga Metro Hub",
    approved: false,
  },
  {
    id: "PROP-03",
    title: "Triển khai trạm sạc lưu động dự phòng Buffer",
    description:
      "Điều động xe lưu động cấp pin nhanh đến điểm đón Ga Metro trong khung giờ cao điểm để bù đắp các cổng sạc đang bảo trì.",
    type: "DEPLOY_BUFFER",
    impactGain: "+12 lượt phục vụ/giờ",
    targetHubId: "HUB-METRO",
    targetHubName: "Ga Metro Hub",
    approved: false,
  },
];

export const IncidentSimulationCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [scenario, setScenario] = useState<SimulationScenario>({
    targetHubId: "HUB-METRO",
    chargerFailureRate: 30, // 30% hỏng hóc cổng sạc
    demandSurgeRate: 45, // 45% đột biến nhu cầu
    simulationWindow: "Peak Hours (16:30 - 19:00)",
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [proposals, setProposals] = useState<MitigationProposal[]>(INITIAL_PROPOSALS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Thay đổi trạng thái thiết bị và cập nhật Khóa (BR-07)
  const handleStatusChange = (alertId: string, newStatus: ResourceStatus) => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === alertId) {
          const isNowLocked = newStatus !== "Active";
          const updated = {
            ...alert,
            status: newStatus,
            isLocked: isNowLocked,
          };
          if (isNowLocked) {
            showToast(
              `🔒 Đã Khóa thiết bị ${alert.deviceCode} theo BR-07: Ngăn cấp phát đặt xe và lịch sạc mới.`
            );
          } else {
            showToast(`✓ Đã Mở khóa thiết bị ${alert.deviceCode}: Trạng thái hoạt động bình thường.`);
          }
          return updated;
        }
        return alert;
      })
    );
  };

  // Tính toán kết quả mô phỏng theo tham số kịch bản
  const simulationResults: SimulationResults = useMemo(() => {
    const failurePenalty = scenario.chargerFailureRate * 0.45;
    const surgePenalty = scenario.demandSurgeRate * 0.35;

    // Giảm sút công suất so với live 94%
    const projectedCapacity = Math.max(
      28,
      Math.round(94 - failurePenalty - surgePenalty * 0.4)
    );

    // Thời gian chờ tăng từ live 4.2 phút
    const projectedWait = Number(
      (4.2 + (scenario.chargerFailureRate / 100) * 12 + (scenario.demandSurgeRate / 100) * 16).toFixed(1)
    );

    // Số lượt mất do thiếu hụt
    const lostSlots = Math.round(
      (scenario.chargerFailureRate * 0.8) + (scenario.demandSurgeRate * 0.5)
    );

    // Tính tải trọng cho các Hub
    const metroLoad = Math.min(
      160,
      Math.round(75 + scenario.chargerFailureRate * 0.6 + scenario.demandSurgeRate * 0.7)
    );
    const dormLoad = Math.min(
      120,
      Math.round(60 + scenario.demandSurgeRate * 0.35)
    );
    const campusLoad = Math.min(
      100,
      Math.round(45 + scenario.demandSurgeRate * 0.2)
    );

    return {
      liveCapacityPercent: 94,
      projectedCapacityPercent: projectedCapacity,
      liveAvgWaitMinutes: 4.2,
      projectedAvgWaitMinutes: projectedWait,
      lostCapacitySlots: lostSlots,
      bottlenecks: [
        {
          hubId: "HUB-METRO",
          hubName: "Ga Metro Hub",
          currentLoad: 75,
          projectedLoad: metroLoad,
          status: metroLoad >= 100 ? "Critical" : metroLoad >= 80 ? "Warning" : "Normal",
        },
        {
          hubId: "HUB-DORM",
          hubName: "Hub Ký túc xá Khu B",
          currentLoad: 60,
          projectedLoad: dormLoad,
          status: dormLoad >= 100 ? "Critical" : dormLoad >= 80 ? "Warning" : "Normal",
        },
        {
          hubId: "HUB-CAMPUS",
          hubName: "Hub Giảng đường ĐHQG",
          currentLoad: 45,
          projectedLoad: campusLoad,
          status: campusLoad >= 100 ? "Critical" : campusLoad >= 80 ? "Warning" : "Normal",
        },
      ],
    };
  }, [scenario]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      showToast(
        `⚡ Đã hoàn tất mô phỏng kịch bản (${scenario.chargerFailureRate}% hỏng cổng, +${scenario.demandSurgeRate}% nhu cầu). Dữ liệu Live được bảo toàn tuyệt đối.`
      );
    }, 700);
  };

  // Phê duyệt đề xuất (BR-09, BR-12)
  const handleApproveProposal = (proposalId: string) => {
    const target = proposals.find((p) => p.id === proposalId);
    if (!target) return;

    const timeString = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setProposals((prev) =>
      prev.map((item) =>
        item.id === proposalId
          ? { ...item, approved: true, approvedAt: timeString }
          : item
      )
    );

    showToast(
      `✓ [BR-12 Xác nhận] Operator đã phê duyệt "${target.title}". Đang cập nhật giải pháp vào mạng lưới thực tế!`
    );
  };

  return (
    <div className="incident-sim-root">
      {/* Top Header */}
      <header className="incident-sim-header">
        <div className="header-title-group">
          <h1>Incident & Simulation Center (Phân hệ 3)</h1>
          <p>
            Bàn làm việc vận hành Operator: Xử lý sự cố thời gian thực và Giả lập kịch bản tương lai (What-if)
          </p>
        </div>

        <div className="header-badge-group">
          <div className="live-indicator">
            <span className="live-pulse" />
            <span>MẠNG LƯỚI TRỰC TIẾP (LIVE)</span>
          </div>
          <div className="operator-badge">
            <span>Vai trò: Operator Trung Tâm</span>
          </div>
        </div>
      </header>

      {/* Split-View Container (50:50) */}
      <main className="split-view-container">
        {/* Phân vùng Trái */}
        <IncidentHandlingPane
          alerts={alerts}
          onStatusChange={handleStatusChange}
        />

        {/* Phân vùng Phải */}
        <WhatIfSimulationPane
          scenario={scenario}
          results={simulationResults}
          proposals={proposals}
          isSimulating={isSimulating}
          onScenarioChange={setScenario}
          onRunSimulation={handleRunSimulation}
          onApproveProposal={handleApproveProposal}
        />
      </main>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="feedback-toast" role="status">
          <span className="check-icon">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
