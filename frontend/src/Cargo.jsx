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
        background: "rgba(10, 10, 15, 0.9)",
        zIndex: 2000,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        padding: isMobile ? "0" : "20px",
      }}
    >
      <div
        className="card fade-in"
        style={{
          width: "100%",
          maxWidth: "520px",
          maxHeight: isMobile ? "92vh" : "85vh",
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: isMobile ? "24px 24px 0 0" : "12px",
          background: "var(--bg-card)",
        }}
      >
        <div
          className="card-header"
          style={{
            position: "sticky",
            top: 0,
            background: "var(--bg-card)",
            zIndex: 10,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div
              className="card-title text-accent"
              style={{ fontSize: "16px" }}
            >
              {cargo.tracking_number}
            </div>
            <div className="text-muted mono" style={{ fontSize: "11px" }}>
              {cargo.carrier} · {cargo.order_id}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: isMobile ? "16px" : "20px" }}>
          {cargo.is_delayed && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              <AlertTriangle size={18} />
              <div>
                <strong style={{ fontSize: "13px" }}>
                  Gecikme Tespit Edildi
                </strong>
                {cargo.delay_reason && (
                  <div style={{ fontSize: "11px" }}>
                    Sebep: {cargo.delay_reason}
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              marginBottom: "24px",
              padding: "16px",
              background: "var(--bg)",
              borderRadius: "10px",
            }}
          >
            <div
              className="nav-section-label"
              style={{ padding: 0, marginBottom: "12px", fontSize: "10px" }}
            >
              KARGO HAREKETLERİ
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[...(cargo.events || [])].reverse().map((ev, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    paddingBottom: i !== arr.length - 1 ? "16px" : "0",
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
                        width: "8px",
                        height: "8px",
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
                          top: "12px",
                          bottom: "-16px",
                          width: "2px",
                          background: "var(--border)",
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "600",
                        color:
                          i === 0
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {ev.status}
                    </div>
                    {ev.location && (
                      <div
                        className="text-muted"
                        style={{
                          fontSize: "11px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <MapPin size={10} /> {ev.location}
                      </div>
                    )}
                    <div
                      className="text-muted mono"
                      style={{ fontSize: "10px" }}
                    >
                      {ev.time ? new Date(ev.time).toLocaleString("tr-TR") : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "4px", fontSize: "10px" }}
              >
                YENİ DURUM
              </label>
              <select
                className="input"
                style={{ width: "100%" }}
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
                style={{ padding: 0, marginBottom: "4px", fontSize: "10px" }}
              >
                GÜNCEL KONUM
              </label>
              <input
                className="input"
                style={{ width: "100%" }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Konum..."
              />
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--bg)",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <input
                type="checkbox"
                id="delayed-checkbox"
                checked={isDelayed}
                onChange={(e) => setIsDelayed(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              <label
                htmlFor="delayed-checkbox"
                style={{
                  fontSize: "13px",
                  color: isDelayed ? "var(--red)" : "var(--text-secondary)",
                }}
              >
                Bu kargoda gecikme var
              </label>
            </div>
            {isDelayed && (
              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  className="nav-section-label"
                  style={{ padding: 0, marginBottom: "4px", fontSize: "10px" }}
                >
                  SEBEP
                </label>
                <input
                  className="input"
                  style={{ width: "100%" }}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  placeholder="Gecikme nedeni..."
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              İptal
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: "center" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <div
                  className="spinner"
                  style={{ width: "14px", height: "14px" }}
                />
              ) : (
                "Güncelle"
              )}
            </button>
          </div>
        </div>
      </div>
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
      style={{ padding: isMobile ? "12px" : "24px" }}
    >
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 className="page-title">Kargo ve Lojistik</h1>
            <p className="page-subtitle text-muted">Anlık kargo takibi</p>
          </div>
          <button className="btn btn-ghost" onClick={loadData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: "24px",
          overflowX: "auto",
        }}
      >
        <button
          onClick={() => setActiveTab("all")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 4px",
            cursor: "pointer",
            fontSize: "13px",
            color:
              activeTab === "all" ? "var(--accent)" : "var(--text-secondary)",
            borderBottom:
              activeTab === "all"
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          Tümü ({cargoList.length})
        </button>
        <button
          onClick={() => setActiveTab("delayed")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 4px",
            cursor: "pointer",
            fontSize: "13px",
            color:
              activeTab === "delayed" ? "var(--red)" : "var(--text-secondary)",
            borderBottom:
              activeTab === "delayed"
                ? "2px solid var(--red)"
                : "2px solid transparent",
            whiteSpace: "nowrap",
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
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {isMobile ? (
            displayList.map((c) => (
              <div
                key={c.id}
                className="card"
                onClick={() => setSelectedCargo(c)}
                style={{
                  padding: "16px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    alignItems: "center",
                  }}
                >
                  <span
                    className="mono text-accent"
                    style={{ fontSize: "12px", fontWeight: "700" }}
                  >
                    {c.tracking_number}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span
                      className={`badge ${CARGO_STATUS_CLASSES[c.status]}`}
                      style={{ fontSize: "9px" }}
                    >
                      {CARGO_STATUS_LABELS[c.status]}
                    </span>
                    {c.is_delayed && (
                      <span
                        className="badge badge-critical"
                        style={{ fontSize: "9px" }}
                      >
                        ⚠
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                >
                  {c.carrier} · {c.order_id}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "12px",
                  }}
                >
                  <MapPin size={12} />{" "}
                  {c.current_location || "Konum Belirtilmedi"}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "10px",
                  }}
                >
                  <span className="text-muted" style={{ fontSize: "11px" }}>
                    Güncelleme:
                  </span>
                  <span
                    className="mono text-muted"
                    style={{ fontSize: "11px" }}
                  >
                    {new Date(c.last_update).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Takip No</th>
                      <th>Sipariş</th>
                      <th>Firma</th>
                      <th>Durum</th>
                      <th>Güncel Konum</th>
                      <th>Tarih</th>
                      <th style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map((c) => (
                      <tr
                        key={c.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedCargo(c)}
                      >
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: "var(--bg)",
                              border: "1px solid var(--border)",
                              color: "var(--accent)",
                            }}
                          >
                            {c.tracking_number}
                          </span>
                        </td>
                        <td className="mono text-muted">{c.order_id}</td>
                        <td style={{ fontWeight: "500" }}>{c.carrier}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <span
                              className={`badge ${CARGO_STATUS_CLASSES[c.status]}`}
                            >
                              {CARGO_STATUS_LABELS[c.status]}
                            </span>
                            {c.is_delayed && (
                              <span
                                className="badge badge-critical"
                                style={{ fontSize: "9px" }}
                              >
                                ⚠ GECİKME
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {c.current_location || "—"}
                        </td>
                        <td
                          className="mono text-muted"
                          style={{ fontSize: "11px" }}
                        >
                          {new Date(c.last_update).toLocaleDateString("tr-TR")}
                        </td>
                        <td>
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
                padding: "60px 20px",
                color: "var(--text-muted)",
              }}
            >
              Kargo kaydı bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
