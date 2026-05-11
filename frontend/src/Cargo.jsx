import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import {
  getAllCargo,
  getDelayedShipments,
  updateCargoStatus,
} from "./client.js";

const CARGO_STATUS_LABELS = {
  not_shipped: "Kargoya Verilmedi",
  picked_up: "Kargo Alındı",
  in_transit: "Yolda",
  out_for_delivery: "Dağıtımda",
  delivered: "Teslim Edildi",
  delayed: "Gecikmeli",
  returned: "İade",
};

const CARGO_STATUS_CLASSES = {
  not_shipped: "badge-pending",
  picked_up: "badge-confirmed",
  in_transit: "badge-shipped",
  out_for_delivery: "badge-preparing",
  delivered: "badge-delivered",
  delayed: "badge-critical",
  returned: "badge-cancelled",
};

function CargoDetail({ cargo, onClose, onUpdate, isMobile }) {
  const [newStatus, setNewStatus] = useState(cargo.status);
  const [location, setLocation] = useState(cargo.current_location || "");
  const [isDelayed, setIsDelayed] = useState(cargo.is_delayed);
  const [delayReason, setDelayReason] = useState(cargo.delay_reason || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCargoStatus(
        cargo.tracking_number,
        newStatus,
        location,
        isDelayed,
        delayReason || undefined,
      );
      onUpdate();
      onClose();
    } catch (e) {
      alert("Hata: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: "flex",
        justifyContent: "flex-end",
        pointerEvents: "auto",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.3s ease",
        }}
      />

      <div
        style={{
          position: "relative",
          width: isMobile ? "100%" : "440px",
          height: "100%",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div>
            <div
              className="card-title text-accent"
              style={{ fontSize: "18px", margin: 0 }}
            >
              {cargo.tracking_number}
            </div>
            <div
              className="text-muted mono"
              style={{ fontSize: "12px", marginTop: "4px" }}
            >
              {cargo.carrier} · Sipariş: {cargo.order_id}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: "8px", borderRadius: "50%" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {cargo.is_delayed && (
            <div className="alert alert-error" style={{ marginBottom: "24px" }}>
              <AlertTriangle size={18} />
              <div>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>
                  Gecikme Tespit Edildi
                </strong>
                {cargo.delay_reason && (
                  <div style={{ fontSize: "12px" }}>
                    Sebep: {cargo.delay_reason}
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              marginBottom: "24px",
              padding: "20px",
              background: "var(--bg)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="nav-section-label"
              style={{ padding: 0, marginBottom: "16px", fontSize: "11px" }}
            >
              KARGO HAREKETLERİ
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[...(cargo.events || [])].reverse().map((ev, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "16px",
                    paddingBottom: i !== arr.length - 1 ? "20px" : "0",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background:
                          i === 0 ? "var(--accent)" : "var(--border-light)",
                        zIndex: 2,
                        marginTop: "4px",
                      }}
                    />
                    {i !== arr.length - 1 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "14px",
                          bottom: "-20px",
                          width: "2px",
                          background: "var(--border)",
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color:
                          i === 0
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                        marginBottom: "4px",
                      }}
                    >
                      {ev.status}
                    </div>
                    {ev.location && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "4px",
                        }}
                      >
                        <MapPin size={12} /> {ev.location}
                      </div>
                    )}
                    <div
                      className="text-muted mono"
                      style={{
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Clock size={12} />
                      {ev.time ? new Date(ev.time).toLocaleString("tr-TR") : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px", display: "block" }}
              >
                YENİ DURUM
              </label>
              <select
                className="input"
                style={{ width: "100%", height: "44px" }}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {Object.entries(CARGO_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px", display: "block" }}
              >
                GÜNCEL KONUM
              </label>
              <input
                className="input"
                style={{ width: "100%", height: "44px" }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Örn: İstanbul Dağıtım Merkezi"
              />
            </div>
            
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--bg)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                marginTop: "8px"
              }}
            >
              <input
                type="checkbox"
                id="delayed-checkbox"
                checked={isDelayed}
                onChange={(e) => setIsDelayed(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label
                htmlFor="delayed-checkbox"
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: isDelayed ? "var(--red)" : "var(--text-primary)",
                }}
              >
                Bu kargoda gecikme var
              </label>
            </div>
            
            {isDelayed && (
              <div>
                <label
                  className="nav-section-label"
                  style={{ padding: 0, marginBottom: "8px", display: "block", color: "var(--red)" }}
                >
                  GECİKME SEBEBİ
                </label>
                <input
                  className="input"
                  style={{ width: "100%", height: "44px", borderColor: "rgba(248,113,113,0.3)" }}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="Gecikme nedeni..."
                />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderTop: "1px solid var(--border)",
            background: "rgba(255,255,255,0.01)",
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            className="btn btn-ghost"
            style={{ flex: 1, height: "44px", justifyContent: "center" }}
            onClick={onClose}
            disabled={saving}
          >
            İptal
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2, height: "44px", justifyContent: "center" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div
                className="spinner"
                style={{ width: "18px", height: "18px" }}
              />
            ) : (
              "Güncelle"
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

export default function Cargo() {
  const [cargoList, setCargoList] = useState([]);
  const [delayedList, setDelayedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    loadData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([getAllCargo(), getDelayedShipments()])
      .then(([all, delayed]) => {
        setCargoList(all);
        setDelayedList(delayed);
      })
      .finally(() => setLoading(false));
  };

  const displayList = activeTab === "delayed" ? delayedList : cargoList;

  return (
    <div
      className="main-content fade-in"
      style={{ padding: isMobile ? "16px" : "32px", paddingBottom: isMobile ? "100px" : "32px" }}
    >
      <div className="page-header" style={{ marginBottom: "32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 className="page-title">Kargo ve Lojistik</h1>
            <p className="page-subtitle text-muted">Anlık kargo takibi ve durum güncellemeleri</p>
          </div>
          <button className="btn btn-ghost" onClick={loadData} style={{ padding: "10px" }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "24px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "32px",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("all")}
          style={{
            background: "none",
            border: "none",
            padding: "0 4px 16px 4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "all" ? "600" : "500",
            color:
              activeTab === "all" ? "var(--accent)" : "var(--text-secondary)",
            borderBottom:
              activeTab === "all"
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}
        >
          Tüm Kargolar ({cargoList.length})
        </button>
        <button
          onClick={() => setActiveTab("delayed")}
          style={{
            background: "none",
            border: "none",
            padding: "0 4px 16px 4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "delayed" ? "600" : "500",
            color:
              activeTab === "delayed" ? "var(--red)" : "var(--text-secondary)",
            borderBottom:
              activeTab === "delayed"
                ? "2px solid var(--red)"
                : "2px solid transparent",
            whiteSpace: "nowrap",
            transition: "all 0.2s"
          }}
        >
          Gecikmeliler ({delayedList.length})
        </button>
      </div>

      {selectedCargo && (
        <CargoDetail
          cargo={selectedCargo}
          onClose={() => setSelectedCargo(null)}
          onUpdate={loadData}
          isMobile={isMobile}
        />
      )}

      {loading ? (
        <div className="loading" style={{ height: "300px" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {isMobile ? (
            displayList.map((c) => (
              <div
                key={c.id}
                className="card"
                onClick={() => setSelectedCargo(c)}
                style={{
                  padding: "20px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                    alignItems: "center",
                  }}
                >
                  <span
                    className="mono text-accent"
                    style={{ fontSize: "14px", fontWeight: "700" }}
                  >
                    {c.tracking_number}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span
                      className={`badge ${CARGO_STATUS_CLASSES[c.status]}`}
                      style={{ fontSize: "10px", padding: "4px 8px" }}
                    >
                      {CARGO_STATUS_LABELS[c.status]}
                    </span>
                    {c.is_delayed && (
                      <span
                        className="badge badge-critical"
                        style={{ fontSize: "10px", padding: "4px 8px" }}
                      >
                        ⚠
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    marginBottom: "12px",
                    color: "var(--text-primary)"
                  }}
                >
                  {c.carrier} · Sipariş: <span className="text-muted mono">{c.order_id}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    marginBottom: "16px",
                  }}
                >
                  <MapPin size={14} />{" "}
                  {c.current_location || "Konum Belirtilmedi"}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "16px",
                  }}
                >
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    Son Güncelleme:
                  </span>
                  <span
                    className="mono text-primary"
                    style={{ fontSize: "12px", fontWeight: "600" }}
                  >
                    {new Date(c.last_update).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: "24px" }}>Takip No</th>
                      <th>Sipariş</th>
                      <th>Firma</th>
                      <th>Durum</th>
                      <th>Güncel Konum</th>
                      <th>Son Güncelleme</th>
                      <th style={{ width: "40px", paddingRight: "24px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((c) => (
                      <tr
                        key={c.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedCargo(c)}
                      >
                        <td style={{ paddingLeft: "24px" }}>
                          <span
                            className="badge"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid var(--border)",
                              color: "var(--accent)",
                              fontWeight: "600"
                            }}
                          >
                            {c.tracking_number}
                          </span>
                        </td>
                        <td className="mono text-muted">{c.order_id}</td>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{c.carrier}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              alignItems: "flex-start"
                            }}
                          >
                            <span
                              className={`badge ${CARGO_STATUS_CLASSES[c.status]}`}
                              style={{ padding: "4px 10px" }}
                            >
                              {CARGO_STATUS_LABELS[c.status]}
                            </span>
                            {c.is_delayed && (
                              <span
                                className="badge badge-critical"
                                style={{ fontSize: "10px", padding: "2px 6px" }}
                              >
                                ⚠ GECİKME
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {c.current_location || "—"}
                        </td>
                        <td
                          className="mono text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          {new Date(c.last_update).toLocaleDateString("tr-TR")}
                        </td>
                        <td style={{ paddingRight: "24px", textAlign: "right" }}>
                          <ChevronDown
                            size={16}
                            className="text-muted"
                            style={{ transform: "rotate(-90deg)" }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {displayList.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "var(--bg-card)",
                borderRadius: "12px",
                border: "1px dashed var(--border)",
                color: "var(--text-muted)",
              }}
            >
              Aradığınız kriterlere uygun kargo kaydı bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}