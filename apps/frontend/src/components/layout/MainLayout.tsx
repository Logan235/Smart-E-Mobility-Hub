import React, { useState } from "react";

interface MainLayoutProps {
  activeModule: number;
  setActiveModule: (module: number) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ activeModule, setActiveModule, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="hub-app-layout">
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`} style={{ width: collapsed ? "72px" : "250px", transition: "width 0.25s ease" }}>
        <div className="brand" style={{ justifyContent: collapsed ? "center" : "space-between" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div className="brand-mark">⚡</div>
              <div>
                <strong>Smart Hub</strong>
                <span>VNU-HCM Area</span>
              </div>
            </div>
          )}
          {collapsed && <div className="brand-mark" title="Smart Hub">⚡</div>}
        </div>

        {!collapsed && <div className="sidebar-label">MODULES</div>}
        <nav className="main-nav">
          <button
            className={`nav-item ${activeModule === 1 ? "active" : ""}`}
            onClick={() => setActiveModule(1)}
            title="Shared EV Mgmt"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span className="nav-icon">🚲</span>
            {!collapsed && <span>Shared EV Mgmt</span>}
            {activeModule === 1 && !collapsed && <span className="nav-dot" />}
          </button>
          <button
            className={`nav-item ${activeModule === 2 ? "active" : ""}`}
            onClick={() => setActiveModule(2)}
            title="Parking & Charging"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span className="nav-icon">🅿️</span>
            {!collapsed && <span>Parking & Charging</span>}
            {activeModule === 2 && !collapsed && <span className="nav-dot" />}
          </button>
          <button
            className={`nav-item ${activeModule === 3 ? "active" : ""}`}
            onClick={() => setActiveModule(3)}
            title="Monitoring & Incidents"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span className="nav-icon">📡</span>
            {!collapsed && <span>Monitoring & Incidents</span>}
            {activeModule === 3 && !collapsed && <span className="nav-dot" />}
          </button>
          <button
            className={`nav-item ${activeModule === 4 ? "active" : ""}`}
            onClick={() => setActiveModule(4)}
            title="Redistribution & Smart"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span className="nav-icon">⚖️</span>
            {!collapsed && <span>Redistribution & Smart</span>}
            {activeModule === 4 && !collapsed && <span className="nav-dot" />}
          </button>
          <button
            className={`nav-item ${activeModule === 5 ? "active" : ""}`}
            onClick={() => setActiveModule(5)}
            title="What-if Simulation"
            style={{ justifyContent: collapsed ? "center" : "flex-start" }}
          >
            <span className="nav-icon">🧪</span>
            {!collapsed && <span>What-if Simulation</span>}
            {activeModule === 5 && !collapsed && <span className="nav-dot" />}
          </button>
        </nav>

        <div className="sidebar-bottom" style={{ flexDirection: collapsed ? "column" : "row", gap: collapsed ? "8px" : "9px" }}>
          <div className="user-avatar">NV</div>
          {!collapsed && (
            <div className="user-info">
              <strong>Operator VNU</strong>
              <span>System Manager</span>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              background: "#f0f4f1",
              border: "1px solid #d8e2dc",
              borderRadius: "6px",
              cursor: "pointer",
              padding: "5px 8px",
              fontSize: "11px",
              color: "#334e42",
              marginLeft: collapsed ? "0" : "auto"
            }}
          >
            {collapsed ? "▶" : "◀ Thu gọn"}
          </button>
        </div>
      </aside>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};
