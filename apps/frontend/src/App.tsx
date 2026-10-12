import { useEffect, useState } from "react";
import { apiClient } from "./api/client";
import { Module1SharedEV } from "./Module1";

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
  return <Module1SharedEV />;
}
