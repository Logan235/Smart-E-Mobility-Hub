import { useCallback, useEffect, useRef, useState } from "react";
import "./Module1.css";
import {
  MIN_BATTERY_LEVEL,
  errorMessage,
  previewReturnStatus,
  sharedEvApi,
  type EVStatus,
  type HubOverview,
  type Reservation,
  type ReservationStatus,
  type SharedEV,
  type UsageSession,
} from "./sharedEvApi"

type Tab = "find" | "reserve" | "pickup" | "return";
type Notice = { kind: "success" | "error" | "info"; text: string } | null;

const STATUS_LABEL: Record<EVStatus | ReservationStatus | "ACTIVE", string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  IN_USE: "In Use",
  WAITING_FOR_CHARGING: "Waiting for Charging",
  CHARGING: "Charging",
  MAINTENANCE: "Maintenance",
  CONFIRMED: "Confirmed",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  ACTIVE: "In Use",
};

const POLL_INTERVAL_MS = 5000;

const batteryClass = (battery: number) => (battery < 20 ? "low" : battery < 50 ? "medium" : "high");
const vehicleIcon = (ev?: SharedEV) => (ev?.type === "BIKE" ? "🚲" : "🛵");
const vehicleTypeLabel = (ev: SharedEV) => (ev.type === "BIKE" ? "Electric bike" : "Electric scooter");
const rangeKm = (ev: SharedEV) => Math.round((ev.batteryLevel * ev.maxRangeKm) / 100);
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
};

function StatusPill({ status }: { status: keyof typeof STATUS_LABEL }) {
  const label = STATUS_LABEL[status];
  return <span className={`status-pill ${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</span>;
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
  const [activeTab, setActiveTab] = useState<Tab>("find");
  const [hubs, setHubs] = useState<HubOverview[]>([]);
  const [vehicles, setVehicles] = useState<SharedEV[]>([]);
  const [searchResults, setSearchResults] = useState<SharedEV[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [session, setSession] = useState<UsageSession | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [hubFilter, setHubFilter] = useState("HUB-METRO");
  const [minBattery, setMinBattery] = useState(MIN_BATTERY_LEVEL);
  const [notice, setNotice] = useState<Notice>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [returnHubId, setReturnHubId] = useState("HUB-METRO");
  const [returnBattery, setReturnBattery] = useState(42);
  const [returnFault, setReturnFault] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const lastReservationId = useRef<string | null>(null);

  const showNotice = (kind: "success" | "error" | "info", text: string) => setNotice({ kind, text });

  /** Loads the latest state from the backend (UC-STU-GetEV step 3, E1 on failure). */
  const refresh = useCallback(async () => {
    try {
      const [hubList, allVehicles, results, activeReservation, activeSession] = await Promise.all([
        sharedEvApi.getHubs(),
        sharedEvApi.getAllVehicles(),
        sharedEvApi.searchVehicles(hubFilter, minBattery),
        sharedEvApi.getActiveReservation(),
        sharedEvApi.getActiveSession(),
      ]);
      setHubs(hubList);
      setVehicles(allVehicles);
      setSearchResults(results);
      setSession(activeSession);
      setReservation(activeReservation);
      // FR-AUTO-01: the backend expired the reservation while the student was waiting.
      if (lastReservationId.current && !activeReservation && !activeSession) {
        showNotice("error", "Your reservation expired because the vehicle was not picked up within the grace period. The vehicle has been released.");
      }
      lastReservationId.current = activeReservation?.id ?? null;
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [hubFilter, minBattery]);

  useEffect(() => {
    void refresh();
    const poll = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [refresh]);

  // 1-second tick for the reservation countdown.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const runAction = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      showNotice("error", errorMessage(error));
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  const hubName = (hubId: string) => hubs.find((hub) => hub.id === hubId)?.name ?? hubId;
  const findVehicle = (id?: string | null) => vehicles.find((ev) => ev.id === id);
  const selectedVehicle = findVehicle(selectedVehicleId);
  const reservedVehicle = findVehicle(reservation?.vehicleId);
  const sessionVehicle = findVehicle(session?.vehicleId);
  const selectedIsEligible =
    !!selectedVehicle && selectedVehicle.status === "AVAILABLE" && selectedVehicle.batteryLevel >= MIN_BATTERY_LEVEL;
  const remainingMs = reservation ? Date.parse(reservation.expiresAt) - now : 0;

  const count = (status: EVStatus) => vehicles.filter((ev) => ev.status === status).length;
  const returnPreview = previewReturnStatus(returnBattery, returnFault);
  const returnHub = hubs.find((hub) => hub.id === returnHubId);

  // ---- UC-STU-ReserveEV ----
  const confirmReservation = () => {
    if (!selectedVehicle) return;
    void runAction(async () => {
      const created = await sharedEvApi.reserveVehicle(selectedVehicle.id);
      lastReservationId.current = created.id;
      showNotice("success", `Reservation confirmed for ${selectedVehicle.name}. Pick it up before ${formatTime(created.expiresAt)}.`);
    });
  };

  const cancelReservation = () => {
    if (!reservation) return;
    void runAction(async () => {
      await sharedEvApi.cancelReservation(reservation.id);
      lastReservationId.current = null;
      setSelectedVehicleId(null);
      showNotice("info", "Reservation cancelled. The vehicle is available again.");
    });
  };

  // ---- UC-STU-03 ----
  const pickUpVehicle = () => {
    if (!reservation) return;
    void runAction(async () => {
      await sharedEvApi.pickUpVehicle(reservation.id);
      lastReservationId.current = null;
      showNotice("success", `Pickup recorded. ${reservedVehicle?.name ?? reservation.vehicleId} is now In Use.`);
      setActiveTab("return");
    });
  };

  // ---- UC-STU-02 ----
  const returnVehicle = () => {
    if (!session) return;
    void runAction(async () => {
      const { vehicle } = await sharedEvApi.returnVehicle(session.id, returnHubId, returnBattery, returnFault);
      setReturnFault(false);
      setSelectedVehicleId(null);
      const text =
        vehicle.status === "MAINTENANCE"
          ? `Return recorded. ${vehicle.name} was moved to Maintenance because a fault was reported.`
          : vehicle.status === "WAITING_FOR_CHARGING"
            ? `Return recorded. Battery is below ${MIN_BATTERY_LEVEL}%, so ${vehicle.name} is now Waiting for Charging.`
            : `Return recorded at ${hubName(vehicle.hubId)}. ${vehicle.name} is Available again.`;
      showNotice("success", text);
    });
  };

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    setNotice(null);
  };

  const headings: Record<Tab, string> = {
    find: "Find a vehicle",
    reserve: "My reservation",
    pickup: "Pick up vehicle",
    return: "Return vehicle",
  };

  return (
    <div className="module4-container">
      <div className="module4-tabs">
        <button className={activeTab === "find" ? "tab-button active" : "tab-button"} onClick={() => goTo("find")}>⌕ Find a vehicle</button>
        <button className={activeTab === "reserve" ? "tab-button active" : "tab-button"} onClick={() => goTo("reserve")}>▣ My reservation {reservation && <span className="nav-dot" />}</button>
        <button className={activeTab === "pickup" ? "tab-button active" : "tab-button"} onClick={() => goTo("pickup")}>↗ Pick up {reservation && <span className="nav-dot" />}</button>
        <button className={activeTab === "return" ? "tab-button active" : "tab-button"} onClick={() => goTo("return")}>↙ Return vehicle {session && <span className="nav-dot" />}</button>
      </div>

      <div className="module4-content">
        <div className="page-container">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SHARED EV MANAGEMENT</div>
              <h1>{headings[activeTab]}</h1>
              <p className="page-subtitle">Find, reserve, pick up, and return shared electric vehicles across Mobility Hubs.</p>
            </div>
            <div className="date-chip"><span>◷</span> VNU-HCM Urban Area</div>
          </div>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Available vehicles</span><span className="stat-icon green">↗</span></div><strong>{count("AVAILABLE").toString().padStart(2, "0")}</strong><small>Ready to reserve</small></div>
            <div className="stat-card"><div className="stat-top"><span>Reserved</span><span className="stat-icon blue">▣</span></div><strong>{count("RESERVED").toString().padStart(2, "0")}</strong><small>Awaiting pickup</small></div>
            <div className="stat-card"><div className="stat-top"><span>Currently in use</span><span className="stat-icon purple">↗</span></div><strong>{count("IN_USE").toString().padStart(2, "0")}</strong><small>Active sessions</small></div>
            <div className="stat-card"><div className="stat-top"><span>Mobility Hubs</span><span className="stat-icon amber">⌖</span></div><strong>{hubs.length.toString().padStart(2, "0")}</strong><small>Across the campus area</small></div>
          </section>

          {loadError && (
            <div className="notice error" role="alert">
              <span className="notice-symbol">!</span>
              <span>Vehicle information cannot be retrieved. {loadError}</span>
              <button aria-label="Retry" onClick={() => void refresh()}>↻</button>
            </div>
          )}
          {notice && <div className={`notice ${notice.kind}`} role="status"><span className="notice-symbol">{notice.kind === "success" ? "✓" : notice.kind === "error" ? "!" : "i"}</span><span>{notice.text}</span><button aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button></div>}

          {/* ------------------------------------------------ UC-STU-GetEV */}
          {activeTab === "find" && (
            <section className="content-card">
              <div className="section-heading"><div><h2>Find a shared EV</h2><p>Only Available vehicles with at least {MIN_BATTERY_LEVEL}% battery are shown.</p></div><span className="result-count">{searchResults.length} vehicles found</span></div>
              <div className="filter-row">
                <label className="field"><span>Mobility Hub</span><select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}><option value="all">All Mobility Hubs</option>{hubs.map((hub) => <option value={hub.id} key={hub.id} disabled={!hub.operational}>{hub.name} · {hub.availableVehicles} available</option>)}</select></label>
                <label className="field"><span>Minimum battery</span><select value={minBattery} onChange={(event) => setMinBattery(Number(event.target.value))}><option value={20}>20% or higher</option><option value={40}>40% or higher</option><option value={60}>60% or higher</option><option value={80}>80% or higher</option></select></label>
              </div>
              {loading ? (
                <div className="empty-state"><div className="empty-icon">◷</div><h3>Loading vehicles…</h3></div>
              ) : (
                <div className="vehicle-grid">
                  {searchResults.map((vehicle) => (
                    <article className={`vehicle-card ${selectedVehicleId === vehicle.id ? "selected" : ""}`} key={vehicle.id}>
                      <button className="vehicle-select" onClick={() => { setSelectedVehicleId(vehicle.id); setNotice(null); }} aria-label={`Select ${vehicle.name}`}>
                        <div className="vehicle-visual"><span className="vehicle-type-icon">{vehicleIcon(vehicle)}</span><span className="vehicle-id">{vehicle.id}</span></div>
                        <div className="vehicle-title-row"><div><h3>{vehicle.name}</h3><p>{vehicleTypeLabel(vehicle)}</p></div><span className="select-radio">{selectedVehicleId === vehicle.id ? "✓" : ""}</span></div>
                        <div className="battery-label-row"><span>Battery level</span><span>~{rangeKm(vehicle)} km range</span></div>
                        <BatteryBar value={vehicle.batteryLevel} />
                        <div className="vehicle-meta"><span className="hub-pin">⌖</span>{hubName(vehicle.hubId)}<StatusPill status={vehicle.status} /></div>
                      </button>
                      <button className="card-action" onClick={() => { setSelectedVehicleId(vehicle.id); goTo("reserve"); }}>Select vehicle <span>→</span></button>
                    </article>
                  ))}
                </div>
              )}
              {!loading && searchResults.length === 0 && <div className="empty-state"><div className="empty-icon">⌕</div><h3>No suitable vehicle is available</h3><p>Try another Mobility Hub or lower the minimum battery requirement.</p></div>}
              <div className="bottom-action"><span>{selectedVehicle ? `Selected: ${selectedVehicle.name}` : "Select a vehicle to continue to reservation."}</span><button className="primary-button" disabled={!selectedIsEligible || !!reservation} onClick={() => goTo("reserve")}>Continue to reserve <span>→</span></button></div>
            </section>
          )}

          {/* --------------------------------------------- UC-STU-ReserveEV */}
          {activeTab === "reserve" && (
            <section className="content-card workflow-card">
              <div className="section-heading"><div><h2>Reserve a shared EV</h2><p>Confirm a vehicle that is available and meets the battery requirement.</p></div><span className="step-indicator">STEP 2 OF 4</span></div>
              {reservation ? (
                <div className="reservation-success">
                  <div className="success-check">✓</div><h3>Reservation confirmed</h3><p>Your vehicle is reserved. Pick it up before the reservation expires.</p>
                  <div className="reservation-code"><span>RESERVATION ID</span><strong>{reservation.id}</strong><StatusPill status={reservation.status} /></div>
                  <div className="detail-grid">
                    <div><span>Vehicle</span><strong>{reservedVehicle?.name ?? reservation.vehicleId}</strong></div>
                    <div><span>Pickup location</span><strong>{hubName(reservation.hubId)}</strong></div>
                    <div><span>Booked at</span><strong>{formatTime(reservation.createdAt)}</strong></div>
                    <div><span>Expires in</span><strong className={remainingMs < 60_000 ? "countdown-warning" : ""}>{formatCountdown(remainingMs)} (at {formatTime(reservation.expiresAt)})</strong></div>
                  </div>
                  <div className="button-row"><button className="secondary-button" disabled={busy} onClick={cancelReservation}>Cancel reservation</button><button className="primary-button" onClick={() => goTo("pickup")}>Continue to pickup <span>→</span></button></div>
                </div>
              ) : session ? (
                <div className="empty-state"><div className="empty-icon">↗</div><h3>You are on a trip</h3><p>Return {sessionVehicle?.name ?? "your vehicle"} before reserving another one.</p><button className="primary-button" onClick={() => goTo("return")}>Go to return vehicle <span>→</span></button></div>
              ) : (
                <>
                  <div className="selected-vehicle-panel">
                    {selectedVehicle ? <><div className="large-vehicle-icon">{vehicleIcon(selectedVehicle)}</div><div className="selected-vehicle-info"><span className="eyebrow">SELECTED VEHICLE</span><h3>{selectedVehicle.name}</h3><p>{selectedVehicle.id} · {hubName(selectedVehicle.hubId)}</p><BatteryBar value={selectedVehicle.batteryLevel} /></div><StatusPill status={selectedVehicle.status} /></> : <p>Select a vehicle from Find a vehicle first.</p>}
                  </div>
                  {selectedVehicle && !selectedIsEligible && <div className="low-battery-note"><span>!</span><p>This vehicle is no longer available for reservation. Please go back and choose another vehicle.</p></div>}
                  <div className="info-callout"><span>i</span><p>Before confirming, the system checks current availability, the {MIN_BATTERY_LEVEL}% battery rule, and whether you already have an active reservation. Unclaimed reservations expire automatically after the grace period.</p></div>
                  <div className="bottom-action"><button className="secondary-button" onClick={() => goTo("find")}>Back to search</button><button className="primary-button" disabled={!selectedIsEligible || busy} onClick={confirmReservation}>Confirm reservation <span>→</span></button></div>
                </>
              )}
            </section>
          )}

          {/* ---------------------------------------------------- UC-STU-03 */}
          {activeTab === "pickup" && (
            <section className="content-card workflow-card">
              <div className="section-heading"><div><h2>Pick up your vehicle</h2><p>Pickup is available only for your valid confirmed reservation.</p></div><span className="step-indicator">STEP 3 OF 4</span></div>
              {reservation ? (
                <div className="pickup-panel">
                  <div className="pickup-header"><div className="large-vehicle-icon">{vehicleIcon(reservedVehicle)}</div><div><StatusPill status={reservation.status} /><h3>{reservedVehicle?.name ?? reservation.vehicleId}</h3><p>{reservation.vehicleId}</p></div></div>
                  <div className="detail-grid">
                    <div><span>Pickup Hub</span><strong>{hubName(reservation.hubId)}</strong></div>
                    <div><span>Reservation</span><strong>{reservation.id}</strong></div>
                    <div><span>Vehicle status</span><strong>{reservedVehicle ? STATUS_LABEL[reservedVehicle.status] : "—"}</strong></div>
                    <div><span>Time left</span><strong className={remainingMs < 60_000 ? "countdown-warning" : ""}>{formatCountdown(remainingMs)}</strong></div>
                  </div>
                  <div className="info-callout"><span>i</span><p>Confirming pickup consumes the reservation, records the pickup time, and starts an active usage session. The vehicle status changes to In Use.</p></div>
                  <div className="bottom-action"><button className="secondary-button" onClick={() => goTo("reserve")}>View reservation</button><button className="primary-button" disabled={busy} onClick={pickUpVehicle}>Confirm pickup <span>→</span></button></div>
                </div>
              ) : session ? (
                <div className="empty-state"><div className="success-check">✓</div><h3>Vehicle already picked up</h3><p>{sessionVehicle?.name} is currently in use. Return it when your trip is complete.</p><button className="primary-button" onClick={() => goTo("return")}>Go to return vehicle <span>→</span></button></div>
              ) : (
                <div className="empty-state"><div className="empty-icon">▣</div><h3>No active reservation</h3><p>Find a vehicle and confirm a reservation before attempting pickup.</p><button className="primary-button" onClick={() => goTo("find")}>Find a vehicle <span>→</span></button></div>
              )}
            </section>
          )}

          {/* ---------------------------------------------------- UC-STU-02 */}
          {activeTab === "return" && (
            <section className="content-card workflow-card">
              <div className="section-heading"><div><h2>Return shared EV</h2><p>Choose the return Hub and report the vehicle's post-trip condition.</p></div><span className="step-indicator">STEP 4 OF 4</span></div>
              {session ? (
                <>
                  <div className="return-vehicle-summary"><div className="large-vehicle-icon">{vehicleIcon(sessionVehicle)}</div><div className="selected-vehicle-info"><span className="eyebrow">ACTIVE TRIP</span><h3>{sessionVehicle?.name ?? session.vehicleId}</h3><p>{session.vehicleId} · Picked up at {hubName(session.startHubId)} · {formatTime(session.startedAt)}</p></div><StatusPill status="IN_USE" /></div>
                  <div className="form-grid">
                    <label className="field"><span>Return Mobility Hub</span><select value={returnHubId} onChange={(event) => setReturnHubId(event.target.value)}>{hubs.map((hub) => <option value={hub.id} key={hub.id} disabled={!hub.operational || hub.freeSpots === 0}>{hub.name} · {hub.freeSpots > 0 ? `${hub.freeSpots} free spot${hub.freeSpots === 1 ? "" : "s"}` : "full"}</option>)}</select></label>
                    <label className="field"><span>Battery level after trip: {returnBattery}%</span><input type="range" min="0" max="100" step="1" value={returnBattery} onChange={(event) => setReturnBattery(Number(event.target.value))} /><div className="range-labels"><span>0%</span><span>100%</span></div></label>
                  </div>
                  <div className="return-options">
                    <label className="check-option warning-option"><input type="checkbox" checked={returnFault} onChange={(event) => setReturnFault(event.target.checked)} /><span><strong>Report a vehicle fault</strong><small>Faulty vehicles are moved to Maintenance and removed from normal availability.</small></span></label>
                  </div>
                  <div className={returnPreview === "AVAILABLE" ? "info-callout" : "low-battery-note"}>
                    <span>{returnPreview === "AVAILABLE" ? "i" : "!"}</span>
                    <p>
                      After return the vehicle will be <strong>{STATUS_LABEL[returnPreview]}</strong>
                      {returnPreview === "MAINTENANCE" && " because a fault is reported (a fault takes precedence over battery level)."}
                      {returnPreview === "WAITING_FOR_CHARGING" && ` because the battery is below ${MIN_BATTERY_LEVEL}%.`}
                      {returnPreview === "AVAILABLE" && ` because the battery is ${MIN_BATTERY_LEVEL}% or higher.`}
                    </p>
                  </div>
                  <div className="bottom-action"><span>Returning to {returnHub?.name ?? returnHubId}.</span><button className="primary-button" disabled={busy || !returnHub || returnHub.freeSpots === 0} onClick={returnVehicle}>Confirm return <span>→</span></button></div>
                </>
              ) : (
                <div className="empty-state"><div className="empty-icon">↙</div><h3>No active trip to return</h3><p>Pick up a reserved vehicle first. The active trip will appear here.</p><button className="primary-button" onClick={() => goTo(reservation ? "pickup" : "find")}>{reservation ? "Continue to pickup" : "Find a vehicle"} <span>→</span></button></div>
              )}
            </section>
          )}
          <footer className="page-footer"><span>MoveHub · Module 1: Shared EV Management</span><span>{loadError ? "Backend unreachable" : "Connected to backend · mock JSON data"}</span></footer>
        </div>
      </div>
    </div>
  );
}
