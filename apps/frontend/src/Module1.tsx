import { useMemo, useState } from "react";
import "./Module1.css";

type VehicleStatus =
  | "Available"
  | "Reserved"
  | "In Use"
  | "Waiting for Charging"
  | "Charging"
  | "Maintenance";

type Hub = {
  id: string;
  name: string;
  area: string;
};

type Vehicle = {
  id: string;
  name: string;
  type: string;
  hubId: string;
  battery: number;
  status: VehicleStatus;
  rangeKm: number;
  chargingScheduled: boolean;
};

type Reservation = {
  id: string;
  vehicleId: string;
  hubId: string;
  createdAt: string;
  expiresAt: string;
  status: "Confirmed" | "Fulfilled";
};

type Session = {
  vehicleId: string;
  startedAt: string;
  startHubId: string;
};

const HUBS: Hub[] = [
  { id: "HUB-METRO", name: "Metro Station Hub", area: "Metro Line 1" },
  { id: "HUB-DORM", name: "Dormitory Hub", area: "Student Dormitories" },
  { id: "HUB-CAMPUS", name: "Campus Hub", area: "University Campus" },
  { id: "HUB-SERVICE", name: "Service Area Hub", area: "Service Facilities" },
];

const INITIAL_VEHICLES: Vehicle[] = [
  { id: "EV-1024", name: "E-Scooter 1024", type: "Electric scooter", hubId: "HUB-METRO", battery: 92, status: "Available", rangeKm: 42, chargingScheduled: false },
  { id: "EV-1028", name: "E-Scooter 1028", type: "Electric scooter", hubId: "HUB-METRO", battery: 64, status: "Available", rangeKm: 29, chargingScheduled: false },
  { id: "EV-1031", name: "E-Bike 1031", type: "Electric bike", hubId: "HUB-METRO", battery: 18, status: "Available", rangeKm: 8, chargingScheduled: false },
  { id: "EV-2040", name: "E-Scooter 2040", type: "Electric scooter", hubId: "HUB-DORM", battery: 78, status: "Reserved", rangeKm: 35, chargingScheduled: false },
  { id: "EV-2044", name: "E-Bike 2044", type: "Electric bike", hubId: "HUB-DORM", battery: 47, status: "Available", rangeKm: 21, chargingScheduled: false },
  { id: "EV-3012", name: "E-Scooter 3012", type: "Electric scooter", hubId: "HUB-CAMPUS", battery: 31, status: "Available", rangeKm: 14, chargingScheduled: false },
  { id: "EV-3022", name: "E-Scooter 3022", type: "Electric scooter", hubId: "HUB-CAMPUS", battery: 12, status: "Waiting for Charging", rangeKm: 5, chargingScheduled: true },
  { id: "EV-4011", name: "E-Bike 4011", type: "Electric bike", hubId: "HUB-SERVICE", battery: 86, status: "Available", rangeKm: 39, chargingScheduled: false },
];

const initialReservations: Reservation[] = [];

const initialSessions: Session[] = [];

const formatHub = (hubId: string) => HUBS.find((hub) => hub.id === hubId)?.name ?? hubId;
const batteryClass = (battery: number) => battery < 20 ? "low" : battery < 50 ? "medium" : "high";

function StatusPill({ status }: { status: VehicleStatus | Reservation["status"] }) {
  const className = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-pill ${className}`}>{status}</span>;
}

function BatteryBar({ value }: { value: number }) {
  return (
    <div className="battery-wrap" aria-label={`Battery ${value}%`}>
      <div className="battery-track"><div className={`battery-fill ${batteryClass(value)}`} style={{ width: `${value}%` }} /></div>
      <span className={`battery-value ${batteryClass(value)}`}>{value}%</span>
    </div>
  );
}

export function Module1SharedEV() {
  const [activeTab, setActiveTab] = useState<"find" | "reserve" | "pickup" | "return">("find");
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selectedVehicleId, setSelectedVehicleId] = useState("EV-1024");
  const [hubFilter, setHubFilter] = useState("HUB-METRO");
  const [minBattery, setMinBattery] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"All" | "Available">("Available");
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [returnHubId, setReturnHubId] = useState("HUB-METRO");
  const [returnBattery, setReturnBattery] = useState(42);
  const [returnFault, setReturnFault] = useState(false);
  const [chargingScheduled, setChargingScheduled] = useState(false);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const activeReservation = reservations.find((reservation) => reservation.status === "Confirmed");
  const activeSession = sessions[0];
  const sessionVehicle = activeSession ? vehicles.find((vehicle) => vehicle.id === activeSession.vehicleId) : undefined;

  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    const matchesHub = hubFilter === "all" || vehicle.hubId === hubFilter;
    const matchesBattery = vehicle.battery >= minBattery;
    const matchesStatus = statusFilter === "All" || vehicle.status === "Available";
    return matchesHub && matchesBattery && matchesStatus;
  }), [vehicles, hubFilter, minBattery, statusFilter]);

  const availableCount = vehicles.filter((vehicle) => vehicle.status === "Available").length;
  const reservedCount = vehicles.filter((vehicle) => vehicle.status === "Reserved").length;
  const inUseCount = vehicles.filter((vehicle) => vehicle.status === "In Use").length;

  const showNotice = (kind: "success" | "error" | "info", text: string) => setNotice({ kind, text });
  const updateVehicle = (vehicleId: string, patch: Partial<Vehicle>) => {
    setVehicles((current) => current.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, ...patch } : vehicle));
  };

  const startReservation = () => {
    if (!selectedVehicle) return;
    if (selectedVehicle.status !== "Available") {
      showNotice("error", "This vehicle is no longer available. Refresh the list and choose another vehicle.");
      return;
    }
    if (selectedVehicle.battery < minBattery) {
      showNotice("error", "This vehicle does not meet the selected minimum battery requirement.");
      return;
    }
    if (reservations.some((reservation) => reservation.status === "Confirmed")) {
      showNotice("error", "You already have an active reservation. Complete or cancel it before reserving another vehicle.");
      return;
    }
    const reservation: Reservation = {
      id: `RES-${Math.floor(24019 + Math.random() * 7000)}`,
      vehicleId: selectedVehicle.id,
      hubId: selectedVehicle.hubId,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      expiresAt: "15 minutes after booking",
      status: "Confirmed",
    };
    setReservations((current) => [...current, reservation]);
    updateVehicle(selectedVehicle.id, { status: "Reserved" });
    showNotice("success", `Reservation confirmed for ${selectedVehicle.name}. Pick it up before the reservation expires.`);
    setActiveTab("reserve");
  };

  const cancelReservation = () => {
    if (!activeReservation) return;
    setReservations((current) => current.map((reservation) => reservation.id === activeReservation.id ? { ...reservation, status: "Fulfilled" } : reservation));
    updateVehicle(activeReservation.vehicleId, { status: "Available" });
    showNotice("info", "Reservation cancelled. The vehicle is available again.");
  };

  const pickUpVehicle = () => {
    if (!activeReservation) {
      showNotice("error", "There is no confirmed reservation to pick up.");
      return;
    }
    const vehicle = vehicles.find((item) => item.id === activeReservation.vehicleId);
    if (!vehicle || vehicle.status !== "Reserved") {
      showNotice("error", "The vehicle is no longer eligible for pickup. Please review the latest vehicle status.");
      return;
    }
    setReservations((current) => current.map((reservation) => reservation.id === activeReservation.id ? { ...reservation, status: "Fulfilled" } : reservation));
    setSessions([{ vehicleId: vehicle.id, startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), startHubId: vehicle.hubId }]);
    updateVehicle(vehicle.id, { status: "In Use" });
    showNotice("success", `Pickup recorded. ${vehicle.name} is now marked In Use.`);
    setActiveTab("pickup");
  };

  const returnVehicle = () => {
    if (!activeSession || !sessionVehicle) {
      showNotice("error", "There is no active vehicle session to return.");
      return;
    }
    let nextStatus: VehicleStatus = "Available";
    if (returnFault) nextStatus = "Maintenance";
    else if (chargingScheduled) nextStatus = "Waiting for Charging";
    updateVehicle(sessionVehicle.id, {
      status: nextStatus,
      hubId: returnHubId,
      battery: returnBattery,
      chargingScheduled,
    });
    setSessions([]);
    setReturnFault(false);
    setChargingScheduled(false);
    showNotice(
      "success",
      nextStatus === "Maintenance"
        ? `Return recorded. ${sessionVehicle.name} has been moved to Maintenance due to a reported fault.`
        : nextStatus === "Waiting for Charging"
          ? `Return recorded. ${sessionVehicle.name} is Waiting for Charging because a charging schedule exists and charging has not started.`
          : `Return recorded at ${formatHub(returnHubId)}. Vehicle status is Available. Battery level alone did not place it in the charging queue.`
    );
    setActiveTab("return");
  };

  const chooseVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    setNotice(null);
  };

  return (
    <div className="module1-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div><strong>NVNNHub</strong><span>Smart E-Mobility</span></div>
        </div>
        <div className="sidebar-label">STUDENT SERVICES</div>
        <nav className="main-nav" aria-label="Shared EV workflows">
          <button className={activeTab === "find" ? "nav-item active" : "nav-item"} onClick={() => { setActiveTab("find"); setNotice(null); }}>
            <span className="nav-icon">⌕</span><span>Find a vehicle</span>
          </button>
          <button className={activeTab === "reserve" ? "nav-item active" : "nav-item"} onClick={() => { setActiveTab("reserve"); setNotice(null); }}>
            <span className="nav-icon">▣</span><span>My reservation</span>
            {activeReservation && <span className="nav-dot" />}
          </button>
          <button className={activeTab === "pickup" ? "nav-item active" : "nav-item"} onClick={() => { setActiveTab("pickup"); setNotice(null); }}>
            <span className="nav-icon">↗</span><span>Pick up</span>
            {activeReservation && <span className="nav-dot" />}
          </button>
          <button className={activeTab === "return" ? "nav-item active" : "nav-item"} onClick={() => { setActiveTab("return"); setNotice(null); }}>
            <span className="nav-icon">↙</span><span>Return vehicle</span>
            {activeSession && <span className="nav-dot" />}
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">ST</div>
          <div className="user-info"><strong>Student User</strong><span>Student account</span></div>
          <span className="more-icon">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Student Portal <span>/</span> Shared EV Management</div>
          <div className="topbar-right"><span className="connection-dot" /> Demo data <span className="topbar-divider" /> <div className="small-avatar">ST</div></div>
        </header>

        <div className="page-container">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SHARED EV MANAGEMENT</div>
              <h1>{activeTab === "find" ? "Find a vehicle" : activeTab === "reserve" ? "My reservation" : activeTab === "pickup" ? "Pick up vehicle" : "Return vehicle"}</h1>
              <p className="page-subtitle">Find, reserve, pick up, and return shared electric vehicles across Mobility Hubs.</p>
            </div>
            <div className="date-chip"><span>◷</span> VNU-HCM Urban Area</div>
          </div>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Available vehicles</span><span className="stat-icon green">↗</span></div><strong>{availableCount.toString().padStart(2, "0")}</strong><small>Ready to reserve</small></div>
            <div className="stat-card"><div className="stat-top"><span>Reserved</span><span className="stat-icon blue">▣</span></div><strong>{reservedCount.toString().padStart(2, "0")}</strong><small>Awaiting pickup</small></div>
            <div className="stat-card"><div className="stat-top"><span>Currently in use</span><span className="stat-icon purple">↗</span></div><strong>{inUseCount.toString().padStart(2, "0")}</strong><small>Active sessions</small></div>
            <div className="stat-card"><div className="stat-top"><span>Mobility Hubs</span><span className="stat-icon amber">⌖</span></div><strong>{HUBS.length.toString().padStart(2, "0")}</strong><small>Across the campus area</small></div>
          </section>

          {notice && <div className={`notice ${notice.kind}`} role="status"><span className="notice-symbol">{notice.kind === "success" ? "✓" : notice.kind === "error" ? "!" : "i"}</span><span>{notice.text}</span><button aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button></div>}

          {activeTab === "find" && (
            <section className="content-card">
              <div className="section-heading"><div><h2>Find a shared EV</h2><p>Choose a Hub and filter vehicles by battery level.</p></div><span className="result-count">{filteredVehicles.length} vehicles found</span></div>
              <div className="filter-row">
                <label className="field"><span>Mobility Hub</span><select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}><option value="all">All Mobility Hubs</option>{HUBS.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</select></label>
                <label className="field"><span>Minimum battery</span><select value={minBattery} onChange={(event) => setMinBattery(Number(event.target.value))}><option value={0}>Any battery level</option><option value={20}>20% or higher</option><option value={40}>40% or higher</option><option value={60}>60% or higher</option><option value={80}>80% or higher</option></select></label>
                <label className="field"><span>Availability</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | "Available")}><option value="Available">Available only</option><option value="All">All statuses</option></select></label>
              </div>
              <div className="vehicle-grid">
                {filteredVehicles.map((vehicle) => (
                  <article className={`vehicle-card ${selectedVehicleId === vehicle.id ? "selected" : ""}`} key={vehicle.id}>
                    <button className="vehicle-select" onClick={() => chooseVehicle(vehicle)} aria-label={`Select ${vehicle.name}`}>
                      <div className="vehicle-visual"><span className="vehicle-type-icon">{vehicle.type === "Electric bike" ? "🚲" : "🛵"}</span><span className="vehicle-id">{vehicle.id}</span></div>
                      <div className="vehicle-title-row"><div><h3>{vehicle.name}</h3><p>{vehicle.type}</p></div><span className="select-radio">{selectedVehicleId === vehicle.id ? "✓" : ""}</span></div>
                      <div className="battery-label-row"><span>Battery level</span><span>{vehicle.rangeKm} km range</span></div>
                      <BatteryBar value={vehicle.battery} />
                      <div className="vehicle-meta"><span className="hub-pin">⌖</span>{formatHub(vehicle.hubId)}<StatusPill status={vehicle.status} /></div>
                    </button>
                    <button className="card-action" disabled={vehicle.status !== "Available" || vehicle.battery < minBattery} onClick={() => { chooseVehicle(vehicle); setActiveTab("reserve"); }}>Select vehicle <span>→</span></button>
                  </article>
                ))}
              </div>
              {filteredVehicles.length === 0 && <div className="empty-state"><div className="empty-icon">⌕</div><h3>No matching vehicles</h3><p>Try another Mobility Hub or lower the minimum battery requirement.</p></div>}
              <div className="bottom-action"><span>Select a vehicle to continue to reservation.</span><button className="primary-button" disabled={!selectedVehicle || selectedVehicle.status !== "Available" || selectedVehicle.battery < minBattery} onClick={() => setActiveTab("reserve")}>Continue to reserve <span>→</span></button></div>
            </section>
          )}

          {activeTab === "reserve" && (
            <section className="content-card workflow-card">
              <div className="section-heading"><div><h2>Reserve a shared EV</h2><p>Confirm a vehicle that is available and meets your battery requirement.</p></div><span className="step-indicator">STEP 2 OF 4</span></div>
              {activeReservation ? (
                <div className="reservation-success">
                  <div className="success-check">✓</div><h3>Reservation confirmed</h3><p>Your vehicle is reserved. Pick it up before the reservation expires.</p>
                  <div className="reservation-code"><span>RESERVATION ID</span><strong>{activeReservation.id}</strong><StatusPill status="Confirmed" /></div>
                  <div className="detail-grid"><div><span>Vehicle</span><strong>{vehicles.find((v) => v.id === activeReservation.vehicleId)?.name ?? activeReservation.vehicleId}</strong></div><div><span>Pickup location</span><strong>{formatHub(activeReservation.hubId)}</strong></div><div><span>Booked at</span><strong>{activeReservation.createdAt}</strong></div><div><span>Expiration policy</span><strong>15-minute grace period</strong></div></div>
                  <div className="button-row"><button className="secondary-button" onClick={cancelReservation}>Cancel reservation</button><button className="primary-button" onClick={() => setActiveTab("pickup")}>Continue to pickup <span>→</span></button></div>
                </div>
              ) : (
                <>
                  <div className="selected-vehicle-panel">
                    {selectedVehicle ? <><div className="large-vehicle-icon">{selectedVehicle.type === "Electric bike" ? "🚲" : "🛵"}</div><div className="selected-vehicle-info"><span className="eyebrow">SELECTED VEHICLE</span><h3>{selectedVehicle.name}</h3><p>{selectedVehicle.id} · {formatHub(selectedVehicle.hubId)}</p><BatteryBar value={selectedVehicle.battery} /></div><StatusPill status={selectedVehicle.status} /></> : <p>Select a vehicle from Find a vehicle first.</p>}
                  </div>
                  <div className="info-callout"><span>i</span><p>Before confirming, the system checks current availability, battery eligibility, and whether you already have an active reservation.</p></div>
                  <div className="bottom-action"><button className="secondary-button" onClick={() => setActiveTab("find")}>Back to search</button><button className="primary-button" disabled={!selectedVehicle || selectedVehicle.status !== "Available" || selectedVehicle.battery < minBattery} onClick={startReservation}>Confirm reservation <span>→</span></button></div>
                </>
              )}
            </section>
          )}

          {activeTab === "pickup" && (
            <section className="content-card workflow-card">
              <div className="section-heading"><div><h2>Pick up your vehicle</h2><p>Pickup is available only for your valid confirmed reservation.</p></div><span className="step-indicator">STEP 3 OF 4</span></div>
              {activeReservation ? (
                <div className="pickup-panel">
                  <div className="pickup-header"><div className="large-vehicle-icon">🛵</div><div><StatusPill status="Confirmed" /><h3>{vehicles.find((v) => v.id === activeReservation.vehicleId)?.name}</h3><p>{activeReservation.vehicleId}</p></div></div>
                  <div className="detail-grid"><div><span>Pickup Hub</span><strong>{formatHub(activeReservation.hubId)}</strong></div><div><span>Reservation</span><strong>{activeReservation.id}</strong></div><div><span>Vehicle status</span><strong>Reserved</strong></div><div><span>Authorization</span><strong>Student account verified</strong></div></div>
                  <div className="info-callout"><span>i</span><p>Confirming pickup consumes the reservation, records the pickup time, and starts an active usage session. The vehicle status changes to In Use.</p></div>
                  <div className="bottom-action"><button className="secondary-button" onClick={() => setActiveTab("reserve")}>View reservation</button><button className="primary-button" onClick={pickUpVehicle}>Confirm pickup <span>→</span></button></div>
                </div>
              ) : activeSession && sessionVehicle ? (
                <div className="empty-state"><div className="success-check">✓</div><h3>Vehicle already picked up</h3><p>{sessionVehicle.name} is currently in use. Return it when your trip is complete.</p><button className="primary-button" onClick={() => setActiveTab("return")}>Go to return vehicle <span>→</span></button></div>
              ) : (
                <div className="empty-state"><div className="empty-icon">▣</div><h3>No active reservation</h3><p>Find a vehicle and confirm a reservation before attempting pickup.</p><button className="primary-button" onClick={() => setActiveTab("find")}>Find a vehicle <span>→</span></button></div>
              )}
            </section>
          )}

          {activeTab === "return" && (
            <section className="content-card workflow-card">
              <div className="section-heading"><div><h2>Return shared EV</h2><p>Choose the return Hub and report the vehicle's post-trip condition.</p></div><span className="step-indicator">STEP 4 OF 4</span></div>
              {activeSession && sessionVehicle ? (
                <>
                  <div className="return-vehicle-summary"><div className="large-vehicle-icon">🛵</div><div className="selected-vehicle-info"><span className="eyebrow">ACTIVE TRIP</span><h3>{sessionVehicle.name}</h3><p>{sessionVehicle.id} · Picked up at {formatHub(activeSession.startHubId)} · {activeSession.startedAt}</p></div><StatusPill status="In Use" /></div>
                  <div className="form-grid">
                    <label className="field"><span>Return Mobility Hub</span><select value={returnHubId} onChange={(event) => setReturnHubId(event.target.value)}>{HUBS.map((hub) => <option value={hub.id} key={hub.id}>{hub.name}</option>)}</select></label>
                    <label className="field"><span>Battery level after trip: {returnBattery}%</span><input type="range" min="0" max="100" step="1" value={returnBattery} onChange={(event) => setReturnBattery(Number(event.target.value))} /><div className="range-labels"><span>0%</span><span>100%</span></div></label>
                  </div>
                  <div className="return-options">
                    <label className="check-option"><input type="checkbox" checked={chargingScheduled} onChange={(event) => setChargingScheduled(event.target.checked)} /><span><strong>Charging is scheduled but has not started</strong><small>Use Waiting for Charging only when a charging schedule already exists and the session has not begun.</small></span></label>
                    <label className="check-option warning-option"><input type="checkbox" checked={returnFault} onChange={(event) => setReturnFault(event.target.checked)} /><span><strong>Report a vehicle fault</strong><small>Faulty vehicles are moved to Maintenance and removed from normal availability.</small></span></label>
                  </div>
                  {returnBattery < 20 && !chargingScheduled && !returnFault && <div className="low-battery-note"><span>!</span><p>Battery is below 20%. This alone will not set the vehicle to Waiting for Charging. Confirm a charging schedule above if one exists; otherwise the demo keeps the vehicle Available, subject to the battery eligibility filter in search.</p></div>}
                  <div className="info-callout"><span>i</span><p>The return is recorded, the active session is completed, and the Hub assignment is updated. A reported fault takes precedence over charging status.</p></div>
                  <div className="bottom-action"><span>Review the return details before confirming.</span><button className="primary-button" onClick={returnVehicle}>Confirm return <span>→</span></button></div>
                </>
              ) : (
                <div className="empty-state"><div className="empty-icon">↙</div><h3>No active trip to return</h3><p>Pick up a reserved vehicle first. The active trip will appear here.</p><button className="primary-button" onClick={() => setActiveTab(activeReservation ? "pickup" : "find")}>{activeReservation ? "Continue to pickup" : "Find a vehicle"} <span>→</span></button></div>
              )}
            </section>
          )}
          <footer className="page-footer"><span>MoveHub · Module 1: Shared EV Management</span><span>Prototype with local demo state · No backend connected</span></footer>
        </div>
      </main>
    </div>
  );
}
