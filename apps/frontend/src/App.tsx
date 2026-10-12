import { useEffect, useState } from "react";
import { apiClient } from "./api/client";
import { Module1SharedEV } from "./Module1";
import  Module2 from "./Module2";

import { IncidentSimulationCenter } from "./components/incident-simulation/IncidentSimulationCenter";
import { Module4ResourceRedistribution } from "./Module4"; 

interface SharedEV {
  id: string;
  code: string;
  hubId: string;
  batteryLevel: number;
  status: string;
}

export default function App() {
  const [evs, setEvs] = useState<SharedEV[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchEVs = async () => {
    try {
      const res = await apiClient.get<SharedEV[]>("/shared-ev");
      setEvs(res.data);
    } catch (err) {
      console.error("Lỗi kết nối API:", err);
    }
  };

  useEffect(() => {
    fetchEVs();
  }, []);

  const handleReserve = async (evId: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post(`/shared-ev/${evId}/reserve`, {
        studentId: "STU123456",
      });
      setMessage(res.data.message);
      fetchEVs(); // Reload lại danh sách xe
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        backgroundColor: "#18181b",
        color: "#f4f4f5",
        minHeight: "100vh",
      }}
    >
      <h1>Smart E-Mobility Hub - Demo System</h1>
      {message && (
        <div
          style={{
            padding: "12px",
            background: "#27272a",
            marginBottom: "16px",
            borderRadius: "6px",
          }}
        >
          {message}
        </div>
      )}

      <h2>Danh sách Phương tiện tại Ga Metro & KTX</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {evs.map((ev) => (
          <div
            key={ev.id}
            style={{
              border: "1px solid #3f3f46",
              padding: "16px",
              borderRadius: "8px",
              background: "#27272a",
            }}
          >
            <h3>{ev.code}</h3>
            <p>
              Hub: <strong>{ev.hubId}</strong>
            </p>
            <p>
              Mức pin: <strong>{ev.batteryLevel}%</strong>
            </p>
            <p>
              Trạng thái:{" "}
              <span
                style={{
                  color: ev.status === "AVAILABLE" ? "#4ade80" : "#f87171",
                }}
              >
                {ev.status}
              </span>
            </p>

            <button
              disabled={ev.status !== "AVAILABLE" || loading}
              onClick={() => handleReserve(ev.id)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                cursor: ev.status === "AVAILABLE" ? "pointer" : "not-allowed",
                backgroundColor:
                  ev.status === "AVAILABLE" ? "#2563eb" : "#52525b",
                color: "#fff",
                border: "none",
              }}
            >
              {ev.status === "AVAILABLE" ? "Đặt xe ngay" : "Không thể đặt"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Apptest() {
  const [currentModule, setCurrentModule] = useState<"module1" |"module2"| "module3" | "module4">("module3");


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
        backgroundColor: "#f6f8f7",
      }}
    >
      {/* Ecosystem Top Navigation Bar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e8eeeb",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#087e5b",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            N
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "#172b25" }}>
              Smart E-Mobility Hub
            </div>
            <div style={{ fontSize: "10px", color: "#8b9992" }}>
              Hệ thống Vận hành Đa Phân hệ ĐHQG-HCM
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setCurrentModule("module1")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border:
                currentModule === "module1"
                  ? "1px solid #11936a"
                  : "1px solid #e8eeeb",
              backgroundColor:
                currentModule === "module1" ? "#eaf6f0" : "#ffffff",
              color: currentModule === "module1" ? "#087e5b" : "#62716a",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            🚗 Phân hệ 1: Shared EV (Sinh viên)
          </button>
            {/* CHỈ THÊM NÚT NÀY CHO PHÂN HỆ 2 CỦA BẠN */}
          <button
            type="button"
            onClick={() => setCurrentModule("module2")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border:
                currentModule === "module2"
                  ? "1px solid #3b82f6"
                  : "1px solid #e8eeeb",
              backgroundColor:
                currentModule === "module2" ? "#eff6ff" : "#ffffff",
              color: currentModule === "module2" ? "#2563eb" : "#62716a",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            🛵 Phân hệ 2: Personal EV
          </button>
          <button
            type="button"
            onClick={() => setCurrentModule("module3")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border:
                currentModule === "module3"
                  ? "1px solid #11936a"
                  : "1px solid #e8eeeb",
              backgroundColor:
                currentModule === "module3" ? "#eaf6f0" : "#ffffff",
              color: currentModule === "module3" ? "#087e5b" : "#62716a",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            

            🎛️ Phân hệ 3: Incident & Simulation (Operator)
          </button>
          <button
            type="button"
            onClick={() => setCurrentModule("module4")}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border:
                currentModule === "module4"
                  ? "1px solid #11936a"
                  : "1px solid #e8eeeb",
              backgroundColor:
                currentModule === "module4" ? "#eaf6f0" : "#ffffff",
              color: currentModule === "module4" ? "#087e5b" : "#62716a",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            🔄 Phân hệ 4: Resource Redistribution (Admin)
          </button>
        </div>
      </nav>

      <div style={{ flex: 1 }}>
        {currentModule === "module1" && <Module1SharedEV />}

{currentModule === "module2" && <Module2 />}
{currentModule === "module3" && <IncidentSimulationCenter />}
{currentModule === "module4" && <Module4ResourceRedistribution />}

      </div>
    </div>
  );
}
