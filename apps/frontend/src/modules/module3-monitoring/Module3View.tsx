import { useMemo, useState } from "react";
import "./Module2.css";

/* ============================================================
 * Module 2: Network & Smart Charging Dashboard
 * Operator-facing desktop dashboard (UC-OP-01)
 * Dark mode — bird's-eye view of the network + smart charging queue
 * ============================================================ */

/* ----------------------------- Types ----------------------------- */

type EVStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "IN_USE"
  | "CHARGING"
  | "WAITING_CHARGING"
  | "MAINTENANCE";

type ChargerStatus = "FREE" | "BUSY" | "FAULTY" | "MAINTENANCE";

type Hub = {
  id: string;
  name: string;
  area: string;
  evCapacity: number; // total EV slots
  chargerCount: number; // total chargers
};

type SharedEV = {
  id: string;
  code: string;
  hubId: string;
  batteryLevel: number;
  status: EVStatus;
  rangeKm: number;
};

type Charger = {
  id: string;
  code: string;
  hubId: string;
  status: ChargerStatus;
  powerKw: number;
  currentEV?: string;
};

type ChargingQueueItem = {
  evId: string;
  evCode: string;
  hubId: string;
  batteryLevel: number;
  state: "charging" | "waiting";
  priority: "high" | "normal";
  estimatedWait?: string;
};

type RedistributionPlan = {
  id: string;
  fromHub: string;
  toHub: string;
  vehicleCount: number;
  reason: string;
  confirmed: boolean;
};

/* --------------------------- Mock Data --------------------------- */

const HUBS: Hub[] = [
  { id: "hub-metro", name: "Ga Metro", area: "Metro Line 1", evCapacity: 12, chargerCount: 6 },
  { id: "hub-ktxb", name: "KTX B", area: "Ký túc xá B", evCapacity: 10, chargerCount: 5 },
  { id: "hub-campus", name: "Khu học chính", area: "Trường Đại học", evCapacity: 8, chargerCount: 4 },
  { id: "hub-service", name: "Khu dịch vụ", area: "Trung tâm dịch vụ", evCapacity: 6, chargerCount: 3 },
];

const INITIAL_EVS: SharedEV[] = [
  { id: "ev-1", code: "EV-001", hubId: "hub-metro", batteryLevel: 85, status: "AVAILABLE", rangeKm: 38 },
  { id: "ev-2", code: "EV-002", hubId: "hub-metro", batteryLevel: 15, status: "CHARGING", rangeKm: 6 },
  { id: "ev-3", code: "EV-003", hubId: "hub-metro", batteryLevel: 42, status: "AVAILABLE", rangeKm: 19 },
  { id: "ev-4", code: "EV-004", hubId: "hub-metro", batteryLevel: 78, status: "IN_USE", rangeKm: 35 },
  { id: "ev-5", code: "EV-005", hubId: "hub-metro", batteryLevel: 22, status: "WAITING_CHARGING", rangeKm: 10 },
  { id: "ev-6", code: "EV-006", hubId: "hub-metro", batteryLevel: 60, status: "RESERVED", rangeKm: 27 },
  { id: "ev-7", code: "EV-007", hubId: "hub-ktxb", batteryLevel: 90, status: "AVAILABLE", rangeKm: 40 },
  { id: "ev-8", code: "EV-008", hubId: "hub-ktxb", batteryLevel: 33, status: "AVAILABLE", rangeKm: 15 },
  { id: "ev-9", code: "EV-009", hubId: "hub-ktxb", batteryLevel: 12, status: "CHARGING", rangeKm: 5 },
  { id: "ev-10", code: "EV-010", hubId: "hub-ktxb", batteryLevel: 67, status: "AVAILABLE", rangeKm: 30 },
  { id: "ev-11", code: "EV-011", hubId: "hub-ktxb", batteryLevel: 8, status: "WAITING_CHARGING", rangeKm: 3 },
  { id: "ev-12", code: "EV-012", hubId: "hub-campus", batteryLevel: 72, status: "AVAILABLE", rangeKm: 32 },
  { id: "ev-13", code: "EV-013", hubId: "hub-campus", batteryLevel: 45, status: "IN_USE", rangeKm: 20 },
  { id: "ev-14", code: "EV-014", hubId: "hub-campus", batteryLevel: 88, status: "AVAILABLE", rangeKm: 39 },
  { id: "ev-15", code: "EV-015", hubId: "hub-service", batteryLevel: 55, status: "AVAILABLE", rangeKm: 25 },
  { id: "ev-16", code: "EV-016", hubId: "hub-service", batteryLevel: 30, status: "MAINTENANCE", rangeKm: 13 },
];

const INITIAL_CHARGERS: Charger[] = [
  { id: "ch-1", code: "CH-001", hubId: "hub-metro", status: "BUSY", powerKw: 7, currentEV: "EV-002" },
  { id: "ch-2", code: "CH-002", hubId: "hub-metro", status: "FREE", powerKw: 7 },
  { id: "ch-3", code: "CH-003", hubId: "hub-metro", status: "BUSY", powerKw: 7, currentEV: "EV-005" },
  { id: "ch-4", code: "CH-004", hubId: "hub-ktxb", status: "BUSY", powerKw: 7, currentEV: "EV-009" },
  { id: "ch-5", code: "CH-005", hubId: "hub-ktxb", status: "FREE", powerKw: 7 },
  { id: "ch-6", code: "CH-006", hubId: "hub-ktxb", status: "FAULTY", powerKw: 7 },
  { id: "ch-7", code: "CH-007", hubId: "hub-campus", status: "FREE", powerKw: 7 },
  { id: "ch-8", code: "CH-008", hubId: "hub-campus", status: "BUSY", powerKw: 7, currentEV: "EV-013" },
  { id: "ch-9", code: "CH-009", hubId: "hub-service", status: "MAINTENANCE", powerKw: 7 },
];

const CRITICAL_BATTERY_THRESHOLD = 20; // FR-AUTO-02

/* ------------------------- Helper components ------------------------- */

const evStatusMeta: Record<EVStatus, { label: string; cls: string }> = {
  AVAILABLE: { label: "Rảnh", cls: "available" },
  RESERVED: { label: "Đã đặt", cls: "reserved" },
  IN_USE: { label: "Đang dùng", cls: "in-use" },
  CHARGING: { label: "Đang sạc", cls: "charging" },
  WAITING_CHARGING: { label: "Chờ sạc", cls: "waiting" },
  MAINTENANCE: { label: "Bảo trì", cls: "maintenance" },
};


function StatusPill({ status }: { status: EVStatus }) {
  const meta = evStatusMeta[status];
  return <span className={`m2-status-pill ${meta.cls}`}>{meta.label}</span>;
}

function BatteryBar({ value }: { value: number }) {
  const cls = value < 20 ? "low" : value < 50 ? "medium" : "high";
  return (
    <div className="m2-battery-wrap" aria-label={`Pin ${value}%`}>
      <div className="m2-battery-track">
        <div className={`m2-battery-fill ${cls}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`m2-battery-value ${cls}`}>{value}%</span>
    </div>
  );
}

/** Capacity level classification for highlight */
type ImbalanceLevel = "normal" | "warning" | "critical";
const getImbalance = (fillPct: number): ImbalanceLevel => {
  if (fillPct >= 90) return "critical";
  if (fillPct >= 70) return "warning";
  return "normal";
};

/* ============================== Main Component ============================== */

export function Module2NetworkDashboard() {
  const [evs] = useState<SharedEV[]>(INITIAL_EVS);
  const [chargers] = useState<Charger[]>(INITIAL_CHARGERS);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  const showNotice = (kind: "success" | "error" | "info", text: string) => setNotice({ kind, text });

  const hubName = (id: string) => HUBS.find((h) => h.id === id)?.name ?? id;

  /* ----- Per-hub aggregated metrics ----- */
  const hubMetrics = useMemo(
    () =>
      HUBS.map((hub) => {
        const evsAtHub = evs.filter((e) => e.hubId === hub.id);
        const available = evsAtHub.filter((e) => e.status === "AVAILABLE").length;
        const inUse = evsAtHub.filter((e) => e.status === "IN_USE" || e.status === "RESERVED").length;
        const charging = evsAtHub.filter((e) => e.status === "CHARGING" || e.status === "WAITING_CHARGING").length;
        const fillPct = Math.min(100, ((hub.evCapacity - available) / hub.evCapacity) * 100);

        const chargersAtHub = chargers.filter((c) => c.hubId === hub.id);
        const freeChargers = chargersAtHub.filter((c) => c.status === "FREE").length;
        const faultyChargers = chargersAtHub.filter((c) => c.status === "FAULTY" || c.status === "MAINTENANCE").length;

        return {
          hub,
          available,
          inUse,
          charging,
          fillPct: Math.round(fillPct),
          freeChargers,
          faultyChargers,
          imbalance: getImbalance(fillPct),
        };
      }),
    [evs, chargers],
  );

  /* ----- Smart charging queue (charging + waiting) ----- */
  const chargingQueue = useMemo<ChargingQueueItem[]>(() => {
    const items: ChargingQueueItem[] = [];
    evs.forEach((ev) => {
      if (ev.status === "CHARGING") {
        items.push({
          evId: ev.id,
          evCode: ev.code,
          hubId: ev.hubId,
          batteryLevel: ev.batteryLevel,
          state: "charging",
          priority: ev.batteryLevel < CRITICAL_BATTERY_THRESHOLD ? "high" : "normal",
        });
      } else if (ev.status === "WAITING_CHARGING") {
        items.push({
          evId: ev.id,
          evCode: ev.code,
          hubId: ev.hubId,
          batteryLevel: ev.batteryLevel,
          state: "waiting",
          priority: ev.batteryLevel < CRITICAL_BATTERY_THRESHOLD ? "high" : "normal",
          estimatedWait: ev.batteryLevel < CRITICAL_BATTERY_THRESHOLD ? "Ưu tiên cao" : "~5 phút",
        });
      }
    });
    // High priority first, then charging before waiting
    return items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
      if (a.state !== b.state) return a.state === "charging" ? -1 : 1;
      return a.batteryLevel - b.batteryLevel;
    });
  }, [evs]);

  /* ----- Vehicle redistribution suggestions ----- */
  const [plans, setPlans] = useState<RedistributionPlan[]>([
    {
      id: "plan-1",
      fromHub: "hub-ktxb",
      toHub: "hub-metro",
      vehicleCount: 3,
      reason: "Ga Metro sắp quá tải (89% lấp đầy), KTX B còn dư 4 xe rảnh.",
      confirmed: false,
    },
    {
      id: "plan-2",
      fromHub: "hub-campus",
      toHub: "hub-service",
      vehicleCount: 1,
      reason: "Khu dịch vụ chỉ còn 1 xe rảnh, Khu học chính có dư 2 xe.",
      confirmed: false,
    },
  ]);

  const confirmPlan = (id: string) => {
    setPlans((cur) => cur.map((p) => (p.id === id ? { ...p, confirmed: true } : p)));
    const plan = plans.find((p) => p.id === id);
    if (plan) {
      showNotice(
        "success",
        `Đã xác nhận điều phối: chuyển ${plan.vehicleCount} xe từ ${hubName(plan.fromHub)} sang ${hubName(plan.toHub)}.`,
      );
    }
  };

  /* ----- Overall KPIs ----- */
  const totalAvailable = evs.filter((e) => e.status === "AVAILABLE").length;
  const totalInUse = evs.filter((e) => e.status === "IN_USE" || e.status === "RESERVED").length;
  const totalCharging = evs.filter((e) => e.status === "CHARGING" || e.status === "WAITING_CHARGING").length;
  const totalFreeChargers = chargers.filter((c) => c.status === "FREE").length;
  const criticalHubs = hubMetrics.filter((m) => m.imbalance !== "normal").length;

  /* ----------------------------- Render ----------------------------- */
  return (
    <div className="m2-app">
      {/* ===== Sidebar ===== */}
      <aside className="m2-sidebar">
        <div className="m2-brand">
          <div className="m2-brand-mark">⚡</div>
          <div>
            <strong>NVNNHub</strong>
            <span>Operator Console</span>
          </div>
        </div>
        <div className="m2-sidebar-label">OPERATOR CENTER</div>
        <nav className="m2-nav" aria-label="Module 2 navigation">
          <button className="m2-nav-item" disabled>
            <span className="m2-nav-icon">⚠</span>
            <span>Sự cố &amp; Mô phỏng</span>
          </button>
          <button className="m2-nav-item active">
            <span className="m2-nav-icon">🗺</span>
            <span>Tổng quan mạng lưới</span>
          </button>
          <button className="m2-nav-item" disabled>
            <span className="m2-nav-icon">⚙</span>
            <span>Cấu hình hệ thống</span>
          </button>
        </nav>
        <div className="m2-sidebar-bottom">
          <div className="m2-avatar">OP</div>
          <div className="m2-user-info">
            <strong>Operator</strong>
            <span>Quản trị viên</span>
          </div>
        </div>
      </aside>

      {/* ===== Main content ===== */}
      <main className="m2-main">
        <header className="m2-topbar">
          <div className="m2-breadcrumbs">
            Operator Console <span>/</span> Module 2: Tổng quan mạng lưới
          </div>
          <div className="m2-topbar-right">
            <span className="m2-connection-dot" /> Live data
            <span className="m2-topbar-divider" />
            <div className="m2-small-avatar">OP</div>
          </div>
        </header>

        <div className="m2-page">
          <div className="m2-page-heading">
            <div>
              <div className="m2-eyebrow">NETWORK &amp; SMART CHARGING DASHBOARD</div>
              <h1>Tổng quan mạng lưới &amp; Sạc thông minh</h1>
              <p className="m2-subtitle">
                Cái nhìn toàn cảnh về tình trạng tài nguyên, luân chuyển phương tiện và hàng chờ sạc thông minh trên toàn hệ thống.
              </p>
            </div>
          </div>

          {/* KPI summary */}
          <section className="m2-stats">
            <div className="m2-stat-card">
              <div className="m2-stat-top"><span>Xe rảnh</span><span className="m2-stat-icon ok">✓</span></div>
              <strong>{totalAvailable.toString().padStart(2, "0")}</strong>
              <small>trong {evs.length} xe</small>
            </div>
            <div className="m2-stat-card">
              <div className="m2-stat-top"><span>Đang sử dụng</span><span className="m2-stat-icon purple">↗</span></div>
              <strong>{totalInUse.toString().padStart(2, "0")}</strong>
              <small>đã đặt / đang dùng</small>
            </div>
            <div className="m2-stat-card">
              <div className="m2-stat-top"><span>Đang sạc / chờ sạc</span><span className="m2-stat-icon amber">⚡</span></div>
              <strong>{totalCharging.toString().padStart(2, "0")}</strong>
              <small>{chargingQueue.filter((q) => q.state === "waiting").length} đang chờ</small>
            </div>
            <div className="m2-stat-card">
              <div className="m2-stat-top"><span>Cổng sạc trống</span><span className="m2-stat-icon info">⌁</span></div>
              <strong>{totalFreeChargers.toString().padStart(2, "0")}</strong>
              <small>trong {chargers.length} cổng</small>
            </div>
            <div className="m2-stat-card">
              <div className="m2-stat-top"><span>Hub cần chú ý</span><span className="m2-stat-icon critical">⚠</span></div>
              <strong>{criticalHubs.toString().padStart(2, "0")}</strong>
              <small>quá tải / thiếu xe</small>
            </div>
          </section>

          {notice && (
            <div className={`m2-notice ${notice.kind}`} role="status">
              <span className="m2-notice-symbol">{notice.kind === "success" ? "✓" : notice.kind === "error" ? "!" : "i"}</span>
              <span>{notice.text}</span>
              <button aria-label="Đóng thông báo" onClick={() => setNotice(null)}>×</button>
            </div>
          )}

          {/* ===== Main grid: Hub map + Charging queue ===== */}
          <div className="m2-grid">
            {/* ===== Live Network Map / Grid ===== */}
            <section className="m2-panel m2-hub-map">
              <div className="m2-panel-header">
                <div>
                  <h2><span className="m2-panel-icon">🗺</span> Bản đồ mạng lưới trực tiếp</h2>
                  <p>Tình trạng từng Hub — thanh progress thể hiện tỷ lệ lấp đầy.</p>
                </div>
                <span className="m2-legend-inline">
                  <span className="m2-legend-dot normal" /> Bình thường
                  <span className="m2-legend-dot warning" /> Cảnh báo
                  <span className="m2-legend-dot critical" /> Quá tải
                </span>
              </div>

              <div className="m2-hub-grid">
                {hubMetrics.map(({ hub, available, inUse, charging, fillPct, freeChargers, faultyChargers, imbalance }) => (
                  <article className={`m2-hub-card ${imbalance}`} key={hub.id}>
                    <div className="m2-hub-head">
                      <div>
                        <h3>{hub.name}</h3>
                        <span className="m2-hub-area">{hub.area}</span>
                      </div>
                      {imbalance !== "normal" && (
                        <span className={`m2-imbalance-badge ${imbalance}`}>
                          {imbalance === "critical" ? "Quá tải" : "Cảnh báo"}
                        </span>
                      )}
                    </div>

                    <div className="m2-capacity-row">
                      <span className="m2-capacity-label">Tỷ lệ lấp đầy</span>
                      <strong className="m2-capacity-value">{fillPct}%</strong>
                    </div>
                    <div className="m2-progress-track">
                      <div
                        className={`m2-progress-fill ${imbalance}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>

                    <div className="m2-hub-metrics">
                      <div className="m2-metric">
                        <span className="m2-metric-label">Xe rảnh</span>
                        <span className="m2-metric-value ok">{available}</span>
                        <span className="m2-metric-total">/ {hub.evCapacity}</span>
                      </div>
                      <div className="m2-metric">
                        <span className="m2-metric-label">Đang dùng</span>
                        <span className="m2-metric-value purple">{inUse}</span>
                      </div>
                      <div className="m2-metric">
                        <span className="m2-metric-label">Đang sạc</span>
                        <span className="m2-metric-value amber">{charging}</span>
                      </div>
                      <div className="m2-metric">
                        <span className="m2-metric-label">Cổng trống</span>
                        <span className="m2-metric-value info">{freeChargers}</span>
                        <span className="m2-metric-total">/ {hub.chargerCount}</span>
                      </div>
                    </div>

                    {faultyChargers > 0 && (
                      <div className="m2-fault-note">
                        ⚠ {faultyChargers} cổng sạc đang lỗi/bảo trì
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* ===== Smart Charging Queue ===== */}
            <section className="m2-panel m2-charging-panel">
              <div className="m2-panel-header">
                <div>
                  <h2><span className="m2-panel-icon">⚡</span> Hàng đợi sạc thông minh</h2>
                  <p>Xe dưới {CRITICAL_BATTERY_THRESHOLD}% được gắn badge "Ưu tiên cao" (FR-AUTO-02).</p>
                </div>
                <span className="m2-result-count">{chargingQueue.length} xe</span>
              </div>

              <div className="m2-queue-tabs">
                <span className="m2-tab active">Tất cả ({chargingQueue.length})</span>
                <span className="m2-tab">Đang sạc ({chargingQueue.filter((q) => q.state === "charging").length})</span>
                <span className="m2-tab">Chờ sạc ({chargingQueue.filter((q) => q.state === "waiting").length})</span>
              </div>

              <div className="m2-queue-list">
                {chargingQueue.length === 0 && (
                  <div className="m2-empty">
                    <div className="m2-empty-icon">⚡</div>
                    <h3>Không có xe trong hàng đợi</h3>
                    <p>Tất cả cổng sạc đang trống.</p>
                  </div>
                )}
                {chargingQueue.map((item) => (
                  <div className={`m2-queue-item ${item.state}`} key={item.evId}>
                    <div className="m2-queue-icon">
                      {item.state === "charging" ? "🔌" : "⏳"}
                    </div>
                    <div className="m2-queue-body">
                      <div className="m2-queue-top">
                        <strong>{item.evCode}</strong>
                        <span className="m2-queue-hub">⌖ {hubName(item.hubId)}</span>
                        {item.priority === "high" && (
                          <span className="m2-priority-badge">Ưu tiên cao</span>
                        )}
                      </div>
                      <BatteryBar value={item.batteryLevel} />
                      <div className="m2-queue-bottom">
                        <StatusPill status={item.state === "charging" ? "CHARGING" : "WAITING_CHARGING"} />
                        {item.estimatedWait && <span className="m2-eta">{item.estimatedWait}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ===== Vehicle Redistribution ===== */}
          <section className="m2-panel m2-redistribution">
            <div className="m2-panel-header">
              <div>
                <h2><span className="m2-panel-icon">🔄</span> Điều phối xe (Vehicle Redistribution)</h2>
                <p>Đề xuất luân chuyển xe giữa các Hub để cân bằng mạng lưới.</p>
              </div>
            </div>

            <div className="m2-plan-list">
              {plans.map((plan) => (
                <div className={`m2-plan-card ${plan.confirmed ? "confirmed" : ""}`} key={plan.id}>
                  <div className="m2-plan-route">
                    <span className="m2-plan-hub">{hubName(plan.fromHub)}</span>
                    <span className="m2-plan-arrow">→</span>
                    <span className="m2-plan-hub">{hubName(plan.toHub)}</span>
                    <span className="m2-plan-count">{plan.vehicleCount} xe</span>
                  </div>
                  <p className="m2-plan-reason">{plan.reason}</p>
                  <div className="m2-plan-actions">
                    {plan.confirmed ? (
                      <span className="m2-confirmed-tag">✓ Đã xác nhận điều phối</span>
                    ) : (
                      <button className="m2-primary-btn" onClick={() => confirmPlan(plan.id)}>
                        Xác nhận Điều phối
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="m2-footer">
            <span>NVNNHub · Module 2: Network &amp; Smart Charging Dashboard</span>
            <span>Prototype với dữ liệu mẫu · Cập nhật theo thời gian thực</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
