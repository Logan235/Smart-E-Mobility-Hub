import { useState } from 'react';
import './Module4.css';

type Hub = { id: string; name: string; availableCount: number; reservedCount: number; inUseCount: number; totalCapacity: number; demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' };
type Vehicle = { id: string; name: string; type: string; hubId: string; battery: number; status: string; rangeKm: number; eligible: boolean };
type ChargingRequest = { id: string; vehicleId: string; vehicleName: string; hubId: string; battery: number; priority: 'CRITICAL' | 'HIGH' | 'MEDIUM'; waitingTime: number; usageRequired: string; riskLevel: string; status: string; assignedPort?: string };
type ChargingPort = { id: string; name: string; capacity: string; status: 'AVAILABLE' | 'IN_USE' | 'DISABLED' };
type ChargingSchedule = { requestId: string; portId: string; startTime: string; endTime: string; estimatedTime: number; fromBattery: number; toBattery: number };

const HUBS_MOCK: Hub[] = [
  { id: 'HUB-METRO', name: 'Ga Metro Hub', availableCount: 3, reservedCount: 2, inUseCount: 1, totalCapacity: 12, demandLevel: 'HIGH' },
  { id: 'HUB-DORM', name: 'Dormitory Hub', availableCount: 1, reservedCount: 1, inUseCount: 2, totalCapacity: 12, demandLevel: 'LOW' },
  { id: 'HUB-CAMPUS', name: 'Campus Hub', availableCount: 4, reservedCount: 1, inUseCount: 1, totalCapacity: 12, demandLevel: 'MEDIUM' },
  { id: 'HUB-SERVICE', name: 'Service Area Hub', availableCount: 2, reservedCount: 0, inUseCount: 1, totalCapacity: 12, demandLevel: 'LOW' },
];

const VEHICLES_MOCK: Vehicle[] = [
  { id: 'EV-1024', name: 'E-Scooter 1024', type: 'Electric scooter', hubId: 'HUB-METRO', battery: 92, status: 'Available', rangeKm: 42, eligible: true },
  { id: 'EV-1028', name: 'E-Scooter 1028', type: 'Electric scooter', hubId: 'HUB-METRO', battery: 64, status: 'Available', rangeKm: 29, eligible: true },
  { id: 'EV-1031', name: 'E-Bike 1031', type: 'Electric bike', hubId: 'HUB-METRO', battery: 18, status: 'Available', rangeKm: 8, eligible: false },
  { id: 'EV-2040', name: 'E-Scooter 2040', type: 'Electric scooter', hubId: 'HUB-DORM', battery: 78, status: 'Reserved', rangeKm: 35, eligible: false },
  { id: 'EV-2044', name: 'E-Bike 2044', type: 'Electric bike', hubId: 'HUB-DORM', battery: 47, status: 'Available', rangeKm: 21, eligible: true },
  { id: 'EV-3012', name: 'E-Scooter 3012', type: 'Electric scooter', hubId: 'HUB-CAMPUS', battery: 31, status: 'Available', rangeKm: 14, eligible: true },
  { id: 'EV-3022', name: 'E-Scooter 3022', type: 'Electric scooter', hubId: 'HUB-CAMPUS', battery: 12, status: 'Charging', rangeKm: 5, eligible: false },
  { id: 'EV-4011', name: 'E-Bike 4011', type: 'Electric bike', hubId: 'HUB-SERVICE', battery: 86, status: 'Available', rangeKm: 39, eligible: true },
];

const CHARGING_REQUESTS_MOCK: ChargingRequest[] = [
  { id: 'CHG-001', vehicleId: 'EV-1031', vehicleName: 'E-Bike 1031', hubId: 'HUB-METRO', battery: 5, priority: 'CRITICAL', waitingTime: 15, usageRequired: '10:30 AM', riskLevel: 'AT_RISK', status: 'PENDING' },
  { id: 'CHG-002', vehicleId: 'EV-2040', vehicleName: 'E-Scooter 2040', hubId: 'HUB-DORM', battery: 4, priority: 'CRITICAL', waitingTime: 8, usageRequired: '10:45 AM', riskLevel: 'CRITICAL', status: 'PENDING' },
  { id: 'CHG-003', vehicleId: 'EV-3012', vehicleName: 'E-Scooter 3012', hubId: 'HUB-CAMPUS', battery: 25, priority: 'HIGH', waitingTime: 22, usageRequired: '11:00 AM', riskLevel: 'NORMAL', status: 'ASSIGNED', assignedPort: 'PORT-METRO-01' },
  { id: 'CHG-004', vehicleId: 'EV-1024', vehicleName: 'E-Scooter 1024', hubId: 'HUB-METRO', battery: 45, priority: 'MEDIUM', waitingTime: 35, usageRequired: '12:00 PM', riskLevel: 'NORMAL', status: 'ASSIGNED', assignedPort: 'PORT-DORM-02' },
  { id: 'CHG-005', vehicleId: 'EV-2044', vehicleName: 'E-Bike 2044', hubId: 'HUB-DORM', battery: 47, priority: 'MEDIUM', waitingTime: 18, usageRequired: '11:30 AM', riskLevel: 'NORMAL', status: 'ASSIGNED', assignedPort: 'PORT-CAMPUS-03' },
];

const CHARGING_PORTS_MOCK: ChargingPort[] = [
  { id: 'PORT-METRO-01', name: 'Fast DC Port 1', capacity: '50kW', status: 'IN_USE' },
  { id: 'PORT-METRO-02', name: 'Standard Port 2', capacity: '11kW', status: 'AVAILABLE' },
  { id: 'PORT-METRO-04', name: 'Fast DC Port 4', capacity: '50kW', status: 'DISABLED' },
  { id: 'PORT-DORM-02', name: 'Standard Port 2', capacity: '11kW', status: 'IN_USE' },
  { id: 'PORT-CAMPUS-03', name: 'Standard Port 3', capacity: '11kW', status: 'IN_USE' },
];

const CHARGING_SCHEDULE_MOCK: ChargingSchedule[] = [
  { requestId: 'CHG-001', portId: 'PORT-METRO-02', startTime: '10:30', endTime: '10:55', estimatedTime: 25, fromBattery: 5, toBattery: 80 },
  { requestId: 'CHG-002', portId: 'PORT-DORM-02', startTime: '10:45', endTime: '11:10', estimatedTime: 25, fromBattery: 4, toBattery: 75 },
  { requestId: 'CHG-003', portId: 'PORT-METRO-01', startTime: '11:00', endTime: '11:25', estimatedTime: 25, fromBattery: 25, toBattery: 85 },
  { requestId: 'CHG-004', portId: 'PORT-DORM-02', startTime: '11:15', endTime: '12:00', estimatedTime: 45, fromBattery: 45, toBattery: 95 },
];

export function Module4ResourceRedistribution() {
  const [activeTab, setActiveTab] = useState<'redistribution' | 'charging'>('redistribution');
  return (
    <div className="module4-container">
      <div className="module4-tabs">
        <button className={`tab-button ${activeTab === 'redistribution' ? 'active' : ''}`} onClick={() => setActiveTab('redistribution')}>🚚 Vehicle Redistribution</button>
        <button className={`tab-button ${activeTab === 'charging' ? 'active' : ''}`} onClick={() => setActiveTab('charging')}>⚡ Smart Charging Schedule</button>
      </div>
      <div className="module4-content">
        {activeTab === 'redistribution' && <VehicleRedistributionTab />}
        {activeTab === 'charging' && <SmartChargingTab />}
      </div>
    </div>
  );
}
function VehicleRedistributionTab() {
  const [selectedDestination, setSelectedDestination] = useState('HUB-METRO');
  const [selectedSource, setSelectedSource] = useState('HUB-CAMPUS');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['EV-3012', 'EV-4011']);
  const [planConfirmed, setPlanConfirmed] = useState(false);

  const destinationHub = HUBS_MOCK.find((h) => h.id === selectedDestination);
  const sourceHub = HUBS_MOCK.find((h) => h.id === selectedSource);
  const availableVehicles = VEHICLES_MOCK.filter((v) => v.hubId === selectedSource && v.eligible);

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles((prev) => prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]);
  };

  if (planConfirmed && sourceHub && destinationHub) {
    return <RedistributionReviewView sourceHub={sourceHub} destinationHub={destinationHub} vehicles={selectedVehicles} onEdit={() => setPlanConfirmed(false)} />;
  }

  return (
    <div className="redistribution-tab">
      <div className="hub-status-section">
        <h3>📊 HUB STATUS OVERVIEW</h3>
        <div className="hub-grid">
          {HUBS_MOCK.map((hub) => (
            <div key={hub.id} className={`hub-card hub-demand-${hub.demandLevel.toLowerCase()}`}>
              <div className="hub-header">
                <h4>{hub.name}</h4>
                <span className={`demand-badge ${hub.demandLevel.toLowerCase()}`}>{hub.demandLevel}</span>
              </div>
              <div className="hub-stats">
                <div className="hub-stat"><span>Available:</span><strong>{hub.availableCount}</strong></div>
                <div className="hub-stat"><span>Reserved:</span><strong>{hub.reservedCount}</strong></div>
                <div className="hub-stat"><span>In Use:</span><strong>{hub.inUseCount}</strong></div>
                <div className="hub-stat"><span>Capacity:</span><strong>{hub.totalCapacity}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="selection-section">
        <div className="selector-group">
          <label>📍 SELECT DESTINATION HUB (Needs vehicles)</label>
          <select value={selectedDestination} onChange={(e) => setSelectedDestination(e.target.value)}>
            {HUBS_MOCK.map((hub) => (<option key={hub.id} value={hub.id}>{hub.name} (Demand: {hub.demandLevel})</option>))}
          </select>
          {destinationHub && (<div className="hub-info"><p>Current Available: {destinationHub.availableCount}</p><p>Need: 3 more vehicles</p></div>)}
        </div>

        <div className="selector-group">
          <label>📦 SELECT SOURCE HUB (Has surplus)</label>
          <div className="radio-group">
            {HUBS_MOCK.filter((h) => h.id !== selectedDestination).map((hub) => (
              <label key={hub.id} className="radio-item">
                <input type="radio" value={hub.id} checked={selectedSource === hub.id} onChange={(e) => setSelectedSource(e.target.value)} />
                <span>{hub.name} ({hub.availableCount} surplus vehicles)</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="vehicle-selection-section">
        <h3>🚗 SELECT VEHICLES FOR REDISTRIBUTION</h3>
        <p className="route-info">From: <strong>{sourceHub?.name}</strong> → To: <strong>{destinationHub?.name}</strong></p>
        <div className="vehicle-checklist">
          {availableVehicles.map((vehicle) => (
            <label key={vehicle.id} className="vehicle-checkbox-item">
              <input type="checkbox" checked={selectedVehicles.includes(vehicle.id)} onChange={() => handleVehicleToggle(vehicle.id)} />
              <div className="vehicle-checkbox-content">
                <div className="vehicle-name"><strong>{vehicle.name}</strong><span className="vehicle-type">{vehicle.type}</span></div>
                <div className="vehicle-info"><span>🔋 {vehicle.battery}%</span><span>📍 {vehicle.rangeKm}km</span><span>✓ {vehicle.status}</span></div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={() => setSelectedVehicles([])}>Cancel</button>
        <button className="btn btn-primary" disabled={selectedVehicles.length === 0} onClick={() => setPlanConfirmed(true)}>Review & Confirm Plan</button>
      </div>
    </div>
  );
}

function RedistributionReviewView({ sourceHub, destinationHub, vehicles, onEdit }: { sourceHub: Hub; destinationHub: Hub; vehicles: string[]; onEdit: () => void }) {
  const selectedVehicles = VEHICLES_MOCK.filter((v) => vehicles.includes(v.id));
  return (
    <div className="review-view">
      <h3>✓ REDISTRIBUTION PLAN SUMMARY</h3>
      <div className="plan-summary-card">
        <div className="plan-row"><span className="label">Source Hub:</span><span className="value">{sourceHub.name}</span></div>
        <div className="plan-row"><span className="label">Destination Hub:</span><span className="value">{destinationHub.name}</span></div>
        <div className="plan-row"><span className="label">Vehicles Selected:</span><span className="value">{vehicles.length}</span></div>
        <div className="plan-row"><span className="label">Timeline Estimate:</span><span className="value">~45 minutes</span></div>
        <div className="plan-impact">
          <h4>📊 Impact:</h4>
          <p>• {sourceHub.name}: {sourceHub.availableCount} → {sourceHub.availableCount - vehicles.length} available</p>
          <p>• {destinationHub.name}: {destinationHub.availableCount} → {destinationHub.availableCount + vehicles.length} available</p>
        </div>
        <div className="selected-vehicles-summary">
          <h4>Selected Vehicles:</h4>
          {selectedVehicles.map((v) => (<div key={v.id} className="vehicle-summary-item"><span>{v.name}</span><span>🔋 {v.battery}%</span></div>))}
        </div>
      </div>
      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onEdit}>Edit Plan</button>
        <button className="btn btn-primary">✓ Confirm & Submit</button>
      </div>
    </div>
  );
}

function SmartChargingTab() {
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false);
  const groupedRequests = {
    critical: CHARGING_REQUESTS_MOCK.filter((r) => r.priority === 'CRITICAL'),
    high: CHARGING_REQUESTS_MOCK.filter((r) => r.priority === 'HIGH'),
    medium: CHARGING_REQUESTS_MOCK.filter((r) => r.priority === 'MEDIUM'),
  };
  if (scheduleConfirmed) return <ChargingScheduleReviewView onEdit={() => setScheduleConfirmed(false)} />;

  const totalRequests = CHARGING_REQUESTS_MOCK.length;
  const assignedRequests = CHARGING_REQUESTS_MOCK.filter((r) => r.status === 'ASSIGNED').length;
  const pendingRequests = totalRequests - assignedRequests;

  return (
    <div className="charging-tab">
      <div className="charging-status-grid">
        <div className="status-card"><div className="status-label">Total Requests</div><div className="status-value">{totalRequests}</div></div>
        <div className="status-card"><div className="status-label">Assigned</div><div className="status-value assigned">{assignedRequests}</div></div>
        <div className="status-card"><div className="status-label">Pending</div><div className="status-value pending">{pendingRequests}</div></div>
        <div className="status-card"><div className="status-label">Available Ports</div><div className="status-value">{CHARGING_PORTS_MOCK.filter((p) => p.status === 'AVAILABLE').length}/{CHARGING_PORTS_MOCK.length}</div></div>
      </div>

      <div className="charging-queue-section">
        <h3>📋 PENDING CHARGING REQUESTS (Priority Queue)</h3>
        {groupedRequests.critical.length > 0 && (<div className="priority-group priority-critical"><div className="priority-header"><span className="priority-badge">🔴 CRITICAL PRIORITY</span><span className="count">{groupedRequests.critical.length}</span></div>{groupedRequests.critical.map((req) => <ChargingRequestItemComponent key={req.id} request={req} />)}</div>)}
        {groupedRequests.high.length > 0 && (<div className="priority-group priority-high"><div className="priority-header"><span className="priority-badge">🟠 HIGH PRIORITY</span><span className="count">{groupedRequests.high.length}</span></div>{groupedRequests.high.map((req) => <ChargingRequestItemComponent key={req.id} request={req} />)}</div>)}
        {groupedRequests.medium.length > 0 && (<div className="priority-group priority-medium"><div className="priority-header"><span className="priority-badge">🟡 MEDIUM PRIORITY</span><span className="count">{groupedRequests.medium.length}</span></div>{groupedRequests.medium.map((req) => <ChargingRequestItemComponent key={req.id} request={req} />)}</div>)}
      </div>

      <div className="available-ports-section">
        <h3>⚡ AVAILABLE CHARGING PORTS</h3>
        <div className="ports-grid">
          {CHARGING_PORTS_MOCK.map((port) => (
            <div key={port.id} className={`port-card port-status-${port.status.toLowerCase()}`}>
              <div className="port-title"><span className="port-id">{port.id}</span><span className={`port-status ${port.status.toLowerCase()}`}>{port.status === 'AVAILABLE' ? '✓ Available' : port.status === 'IN_USE' ? '⏳ In Use' : '✗ Disabled'}</span></div>
              <div className="port-info"><p>{port.name}</p><p>Capacity: {port.capacity}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="gantt-section">
        <h3>📊 CHARGING SCHEDULE TIMELINE (Gantt Chart)</h3>
        <div className="gantt-chart">
          <div className="gantt-time-axis"><div className="time-marker">10:30</div><div className="time-marker">11:00</div><div className="time-marker">11:30</div><div className="time-marker">12:00</div></div>
          <div className="gantt-rows">
            {CHARGING_SCHEDULE_MOCK.map((schedule) => {
              const request = CHARGING_REQUESTS_MOCK.find((r) => r.id === schedule.requestId);
              const startHour = parseInt(schedule.startTime.split(':')[0]);
              const startMin = parseInt(schedule.startTime.split(':')[1]);
              const startPos = (startHour - 10 + startMin / 60) * 25;
              const barWidth = (schedule.estimatedTime / 60) * 25;
              return (
                <div key={schedule.requestId} className="gantt-row">
                  <div className="gantt-label">{request?.vehicleName}</div>
                  <div className="gantt-bar-container">
                    <div className="gantt-bar" style={{ left: `${startPos}%`, width: `${barWidth}%` }}>
                      <div className="gantt-bar-text"><span>{schedule.startTime}</span><span>{schedule.fromBattery}%→{schedule.toBattery}%</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-secondary">Cancel</button>
        <button className="btn btn-primary" onClick={() => setScheduleConfirmed(true)}>Review & Confirm Schedule</button>
      </div>
    </div>
  );
}

function ChargingRequestItemComponent({ request }: { request: ChargingRequest }) {
  return (
    <div className="request-item">
      <div className="request-vehicle"><strong>{request.vehicleName}</strong><span className="hub-tag">{request.hubId}</span></div>
      <div className="request-battery"><div className="battery-bar"><div className="battery-fill" style={{ width: `${request.battery}%` }}></div></div><span className="battery-text">{request.battery}%</span></div>
      <div className="request-details"><div className="detail">⏰ {request.usageRequired}</div><div className="detail">⏳ {request.waitingTime}m</div></div>
      <div className="request-status">
        <span className={`risk-badge ${request.riskLevel.toLowerCase()}`}>{request.riskLevel === 'AT_RISK' && '⚠️ At Risk'}{request.riskLevel === 'CRITICAL' && '🚨 Critical'}{request.riskLevel === 'NORMAL' && '✓ Normal'}</span>
        {request.assignedPort && <span className="assigned-badge">✓ {request.assignedPort}</span>}
      </div>
    </div>
  );
}

function ChargingScheduleReviewView({ onEdit }: { onEdit: () => void }) {
  const totalRequests = CHARGING_REQUESTS_MOCK.length;
  const assigned = CHARGING_REQUESTS_MOCK.filter((r) => r.status === 'ASSIGNED').length;
  const queued = totalRequests - assigned;
  return (
    <div className="review-view">
      <h3>✓ CHARGING SCHEDULE SUMMARY</h3>
      <div className="schedule-summary-card">
        <div className="summary-row"><span className="label">Total Requests:</span><span className="value">{totalRequests}</span></div>
        <div className="summary-row"><span className="label">Assigned:</span><span className="value assigned">{assigned}</span></div>
        <div className="summary-row"><span className="label">Queued (Waiting):</span><span className="value pending">{queued}</span></div>
        <div className="summary-row"><span className="label">Estimated Total Time:</span><span className="value">~2 hours 30 mins</span></div>
        <div className="summary-row"><span className="label">Total Energy:</span><span className="value">~450 kWh</span></div>
        <div className="priority-breakdown"><h4>Priority Breakdown:</h4><p>🔴 Critical (At Risk): 2 → Assigned ✓</p><p>🟠 High: 1 → Assigned ✓</p><p>🟡 Medium: 2 → Assigned ✓</p></div>
      </div>
      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onEdit}>Edit Schedule</button>
        <button className="btn btn-primary">✓ Confirm & Apply</button>
      </div>
    </div>
  );
}
