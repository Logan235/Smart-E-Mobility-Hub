import { useState, useEffect } from "react";
import "./Module2.css"; // Chỉ chứa CSS đặc thù cho QR code

type SlotStatus = "Available" | "Reserved" | "Occupied" | "Maintenance";

interface ParkingSlot {
  id: string;
  name: string;
  hubId: string;
  type: string;
  status: SlotStatus;
}

const HUBS = [
  { id: "HUB-METRO", name: "Metro Station Hub" },
  { id: "HUB-DORM", name: "Dormitory Hub" },
  { id: "HUB-CAMPUS", name: "Campus Hub" },
];

const INITIAL_SLOTS: ParkingSlot[] = [
  { id: "SLOT-A01", name: "A01", hubId: "HUB-METRO", type: "Motorbike", status: "Available" },
  { id: "SLOT-A02", name: "A02", hubId: "HUB-METRO", type: "Motorbike", status: "Available" },
  { id: "SLOT-A03", name: "A03", hubId: "HUB-METRO", type: "Motorbike", status: "Reserved" },
  { id: "SLOT-B01", name: "B01", hubId: "HUB-METRO", type: "Car", status: "Occupied" },
  { id: "SLOT-C01", name: "C01", hubId: "HUB-DORM", type: "Motorbike", status: "Available" },
];

// Hàm tái sử dụng thanh Pin của Module 1
const batteryClass = (battery: number) => battery < 20 ? "low" : battery < 50 ? "medium" : "high";
function BatteryBar({ value }: { value: number }) {
  return (
    <div className="battery-wrap" aria-label={`Battery ${value}%`}>
      <div className="battery-track"><div className={`battery-fill ${batteryClass(value)}`} style={{ width: `${value}%` }} /></div>
      <span className={`battery-value ${batteryClass(value)}`}>{value}%</span>
    </div>
  );
}

// Hàm tái sử dụng Pill trạng thái của Module 1
function StatusPill({ status }: { status: string }) {
  let className = "available";
  if (status === "Reserved") className = "reserved";
  if (status === "Occupied" || status === "Charging") className = "in-use";
  if (status === "Maintenance") className = "maintenance";
  if (status === "Queued") className = "waiting-for-charging";
  
  return <span className={`status-pill ${className}`}>{status}</span>;
}

export default function Module2() {
  const [activeTab, setActiveTab] = useState<"parking" | "charging" | "session">("parking");
  const [hubFilter, setHubFilter] = useState("HUB-METRO");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  
  // States cho quá trình đặt chỗ & sạc
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [targetSoC, setTargetSoC] = useState(80);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const filteredSlots = INITIAL_SLOTS.filter(s => s.hubId === hubFilter);
  const selectedSlot = INITIAL_SLOTS.find(s => s.id === selectedSlotId);

  // Đếm ngược giữ chỗ
  useEffect(() => {
    if (activeReservation && timeLeft > 0 && !activeReservation.isCheckedIn) {
      const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timerId);
    }
  }, [activeReservation, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleReserve = () => {
    if (!selectedSlot) return;
    setActiveReservation({
      id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      slotId: selectedSlot.id,
      hubId: selectedSlot.hubId,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCheckedIn: false,
    });
    alert(`Slot ${selectedSlot.name} reserved successfully! 15-min grace period started.`);
    setActiveTab("session");
  };

  return (
    <div className="module4-container">
      <div className="module4-tabs">
        <button className={activeTab === "parking" ? "tab-button active" : "tab-button"} onClick={() => setActiveTab("parking")}>🅿️ Find Parking</button>
        <button className={activeTab === "charging" ? "tab-button active" : "tab-button"} onClick={() => setActiveTab("charging")}>⚡ Book Charging</button>
        <button className={activeTab === "session" ? "tab-button active" : "tab-button"} onClick={() => setActiveTab("session")}>▣ Active Session {activeReservation && <span className="nav-dot" />}</button>
      </div>

      <div className="module4-content">
        <div className="page-container">
          <div className="page-heading">
            <div>
              <div className="eyebrow">MODULE 2</div>
              <h1>{activeTab === "parking" ? "Reserve Parking Spot" : activeTab === "charging" ? "Book Charging Slot" : "Active Session"}</h1>
              <p className="page-subtitle">Manage your personal electric vehicle parking, charging schedules, and check-in.</p>
            </div>
            <div className="date-chip"><span>◷</span> Grace Period: 15 mins</div>
          </div>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Available Slots</span><span className="stat-icon green">🅿️</span></div><strong>24</strong><small>At selected Hub</small></div>
            <div className="stat-card"><div className="stat-top"><span>Active Booking</span><span className="stat-icon blue">▣</span></div><strong>{activeReservation ? '1' : '0'}</strong><small>Pending arrival</small></div>
            <div className="stat-card"><div className="stat-top"><span>Charging Ports</span><span className="stat-icon amber">⚡</span></div><strong>5</strong><small>Available now</small></div>
            <div className="stat-card"><div className="stat-top"><span>My EV Battery</span><span className="stat-icon purple">🔋</span></div><strong>18%</strong><small>Synced via BLE</small></div>
          </section>

          {/* TAB 1: PARKING RESERVATION */}
          {activeTab === "parking" && (
            <section className="content-card">
              <div className="section-heading">
                <div><h2>Find a Parking Slot</h2><p>Select an available spot for your personal vehicle.</p></div>
              </div>
              
              <div className="filter-row" style={{ gridTemplateColumns: '1fr' }}>
                <label className="field"><span>Select Mobility Hub</span>
                  <select value={hubFilter} onChange={(e) => setHubFilter(e.target.value)}>
                    {HUBS.map(h => <option value={h.id} key={h.id}>{h.name}</option>)}
                  </select>
                </label>
              </div>

              <div className="vehicle-grid">
                {filteredSlots.map((slot) => (
                  <article className={`vehicle-card ${selectedSlotId === slot.id ? "selected" : ""}`} key={slot.id}>
                    <button className="vehicle-select" onClick={() => setSelectedSlotId(slot.id)}>
                      <div className="vehicle-visual">
                        <span className="vehicle-type-icon">{slot.type === "Motorbike" ? "🛵" : "🚗"}</span>
                        <span className="vehicle-id">{slot.id}</span>
                      </div>
                      <div className="vehicle-title-row">
                        <div><h3>Slot {slot.name}</h3><p>{slot.type}</p></div>
                        <span className="select-radio">{selectedSlotId === slot.id ? "✓" : ""}</span>
                      </div>
                      <div className="vehicle-meta">
                        <span className="hub-pin">⌖</span>{HUBS.find(h => h.id === slot.hubId)?.name}
                        <StatusPill status={slot.status} />
                      </div>
                    </button>
                  </article>
                ))}
              </div>

              <div className="bottom-action">
                <span>Prevent double booking: Slots are locked atomically upon confirmation.</span>
                <button 
                  className="primary-button" 
                  disabled={!selectedSlot || selectedSlot.status !== "Available"} 
                  onClick={handleReserve}
                >
                  Reserve Spot <span>→</span>
                </button>
              </div>
            </section>
          )}

          {/* TAB 2: SMART CHARGING */}
          {activeTab === "charging" && (
            <section className="content-card workflow-card">
              <div className="section-heading">
                <div><h2>Book Charging Slot</h2><p>Your vehicle battery data is automatically synced via Telemetry.</p></div>
                <span className="step-indicator">TV4 INTEGRATION</span>
              </div>

              <div className="selected-vehicle-panel">
                <div className="large-vehicle-icon">🛵</div>
                <div className="selected-vehicle-info">
                  <span className="eyebrow">MY PERSONAL EV (WINX-EV)</span>
                  <h3>Telemetry Synced Battery</h3>
                  <p>Honda Winner EV · Connected via BLE</p>
                  <BatteryBar value={18} />
                </div>
                <StatusPill status="Critical" />
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Target SoC after charge: {targetSoC}%</span>
                  <input type="range" min="20" max="100" step="1" value={targetSoC} onChange={(e) => setTargetSoC(Number(e.target.value))} />
                  <div className="range-labels"><span>20%</span><span>100%</span></div>
                </label>
                <label className="field"><span>Estimated Departure Time</span><select><option>11:30 AM</option><option>12:00 PM</option></select></label>
                <label className="field"><span>Charging Mode</span><select><option>Standard Charge (7.4 kW)</option><option>Fast Charge (22 kW)</option></select></label>
              </div>

              <div className="detail-grid" style={{ maxWidth: '100%', marginBottom: '20px' }}>
                <div><span>Estimated Duration</span><strong>1 hour 15 mins</strong></div>
                <div><span>Estimated Fee</span><strong>25,000 VND</strong></div>
              </div>

              <div className="info-callout"><span>i</span><p>This request will be forwarded to the Smart Charging Scheduler (Module 4). If all ports are full, you will be placed in the Priority Waitlist.</p></div>
              
              <div className="bottom-action">
                <button className="secondary-button" onClick={() => setActiveTab("parking")}>Cancel</button>
                <button className="primary-button" onClick={() => alert("Request sent to Module 4 (TV4) Scheduler!")}>Confirm Charging Schedule <span>→</span></button>
              </div>
            </section>
          )}

          {/* TAB 3: ACTIVE SESSION (CHECK-IN/CHECK-OUT) */}
          {activeTab === "session" && (
            <section className="content-card workflow-card">
              <div className="section-heading">
                <div><h2>Active Session</h2><p>Scan the QR code at the barrier to check in.</p></div>
              </div>

              {activeReservation ? (
                <div className="reservation-success">
                  <div className="success-check">✓</div>
                  <h3>Reservation Confirmed</h3>
                  <p>Arrive at the Hub before the grace period expires.</p>
                  
                  <div className="m2-qr-box">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HCMUT-EV" alt="QR Code" />
                  </div>
                  
                  <div className="m2-countdown">
                     Expires in: {formatTime(timeLeft)}
                  </div>

                  <div className="reservation-code">
                    <span>RESERVATION ID</span><strong>{activeReservation.id}</strong>
                    <StatusPill status="Reserved" />
                  </div>

                  <div className="detail-grid">
                    <div><span>Slot</span><strong>{selectedSlot?.name}</strong></div>
                    <div><span>Hub</span><strong>{HUBS.find(h => h.id === activeReservation.hubId)?.name}</strong></div>
                  </div>

                  <div className="button-row">
                    <button className="secondary-button" onClick={() => setActiveReservation(null)}>Cancel Booking</button>
                    <button className="primary-button" onClick={() => alert("Check-in successful! Barrier opened. Status: OCCUPIED.")}>Simulate Check-in <span>→</span></button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">▣</div>
                  <h3>No active session</h3>
                  <p>Reserve a parking spot to see your QR check-in ticket.</p>
                  <button className="primary-button" onClick={() => setActiveTab("parking")}>Find Parking <span>→</span></button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}