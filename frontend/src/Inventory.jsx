import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Package,
  Plus,
  X,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  getInventoryAlerts,
  getInventorySummary,
  getTopSelling,
  restockProduct,
} from "./client";

const ALERT_LABELS = {
  ok: "Normal",
  low: "Düşük",
  critical: "Kritik",
  out_of_stock: "Tükendi",
};
const ALERT_CLASSES = {
  ok: "badge-ok",
  low: "badge-low",
  critical: "badge-critical",
  out_of_stock: "badge-out_of_stock",
};
const ALERT_COLORS = {
  ok: "var(--green)",
  low: "var(--yellow)",
  critical: "var(--red)",
  out_of_stock: "var(--red)",
};

function RestockModal({ product, onClose, onDone, isMobile }) {
  const [qty, setQty] = useState(product.suggested_reorder_qty || 50);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (qty < 1) return;
    setSaving(true);
    try {
      await restockProduct(product.product_id, qty);
      onDone();
      onClose();
    } catch (e) {
      alert(e.message);
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
        zIndex: 3000,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        padding: isMobile ? 0 : "20px",
      }}
    >
      <div
        className="card fade-in"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: isMobile ? "24px 24px 0 0" : "16px",
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
      >
        <div
          className="card-header"
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="card-title text-accent">Stok Takviyesi</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "24px" }}>
          <div
            style={{
              marginBottom: "20px",
              background: "var(--bg)",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                fontSize: "15px",
                color: "var(--text-primary)",
              }}
            >
              {product.product_name}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              Mevcut:{" "}
              <span className="mono" style={{ color: "var(--text-primary)" }}>
                {product.current_stock} {product.unit}
              </span>
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Önerilen Takviye:{" "}
              <span className="mono" style={{ color: "var(--accent)" }}>
                +{product.suggested_reorder_qty}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              className="nav-section-label"
              style={{ padding: 0, marginBottom: "8px", display: "block" }}
            >
              EKLENECEK MİKTAR ({product.unit?.toUpperCase()})
            </label>
            <input
              className="input mono"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              style={{ fontSize: "18px", height: "50px", textAlign: "center" }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
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
              onClick={submit}
              disabled={saving || qty < 1}
            >
              {saving ? (
                <div
                  className="spinner"
                  style={{ width: "16px", height: "16px" }}
                />
              ) : (
                <>
                  <Plus size={18} /> Onayla
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [topSelling, setTopSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restocking, setRestocking] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const load = () => {
    setLoading(true);
    Promise.all([getInventoryAlerts(), getInventorySummary(), getTopSelling(5)])
      .then(([a, s, t]) => {
        setAlerts(a);
        setSummary(s);
        setTopSelling(t);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    load();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading)
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );

  const maxSales = Math.max(...topSelling.map((p) => p.sales_last_30_days), 1);

  return (
    <div
      className="main-content fade-in"
      style={{
        padding: isMobile ? "16px" : "32px",
        paddingBottom: isMobile ? "100px" : "32px",
      }}
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
            <h1 className="page-title">Envanter Merkezi</h1>
            <p className="page-subtitle text-muted">
              Akıllı stok analizi ve depo verimliliği
            </p>
          </div>
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {restocking && (
        <RestockModal
          product={restocking}
          onClose={() => setRestocking(null)}
          onDone={load}
          isMobile={isMobile}
        />
      )}

      {summary && (
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, 1fr)"
              : "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          {[
            {
              label: "Ürün Çeşidi",
              value: summary.total_products,
              color: "var(--blue)",
              icon: Package,
            },
            {
              label: "Düşük Stok",
              value: summary.low_stock,
              color: "var(--yellow)",
              icon: AlertTriangle,
            },
            {
              label: "Kritik/Yok",
              value: summary.critical_stock + summary.out_of_stock,
              color: "var(--red)",
              icon: PieChart,
            },
            {
              label: "Toplam Değer",
              value: `₺${(summary.total_inventory_value / 1000).toFixed(1)}k`,
              color: "var(--accent)",
              icon: BarChart3,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="stat-card"
              style={{
                padding: "16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <span
                  className="stat-label"
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {item.label}
                </span>
                <item.icon
                  size={14}
                  style={{ color: item.color, opacity: 0.8 }}
                />
              </div>
              <div
                className="stat-value mono"
                style={{ color: "var(--text-primary)", fontSize: "22px" }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "24px",
        }}
      >
        <div
          className="card"
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div className="card-header" style={{ marginBottom: "20px" }}>
            <div
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <div
                style={{
                  padding: "6px",
                  background: "var(--red-bg)",
                  borderRadius: "8px",
                }}
              >
                <AlertTriangle size={18} style={{ color: "var(--red)" }} />
              </div>
              Kritik Uyarılar
            </div>
            <span
              className="tag"
              style={{
                background: "var(--red-bg)",
                color: "var(--red)",
                border: "none",
              }}
            >
              {alerts.length} Ürün
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {alerts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "40px 20px",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
                Stok seviyeleri ideal durumda.
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.product_id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      background: ALERT_COLORS[a.alert_level],
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {a.product_name}
                      </div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        {a.category} · {a.supplier}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setRestocking(a)}
                      style={{ padding: "6px" }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div className="mono" style={{ fontSize: "12px" }}>
                      <span style={{ color: "var(--text-muted)" }}>
                        Mevcut:
                      </span>{" "}
                      <span
                        style={{
                          color: ALERT_COLORS[a.alert_level],
                          fontWeight: "700",
                        }}
                      >
                        {a.current_stock}
                      </span>
                      <span
                        style={{ color: "var(--text-muted)", margin: "0 4px" }}
                      >
                        /
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {a.min_threshold}
                      </span>
                    </div>
                    <span
                      className={`badge ${ALERT_CLASSES[a.alert_level]}`}
                      style={{ fontSize: "9px" }}
                    >
                      {ALERT_LABELS[a.alert_level]}
                    </span>
                  </div>
                  <div
                    className="progress-bar"
                    style={{ height: "6px", background: "var(--border)" }}
                  >
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (a.current_stock / a.min_threshold) * 100)}%`,
                        background: ALERT_COLORS[a.alert_level],
                        boxShadow: `0 0 10px ${ALERT_COLORS[a.alert_level]}44`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: "20px" }}>
            <div
              className="card-title"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <div
                style={{
                  padding: "6px",
                  background: "var(--green-bg)",
                  borderRadius: "8px",
                }}
              >
                <TrendingUp size={18} style={{ color: "var(--green)" }} />
              </div>
              Trend Ürünler
            </div>
            <span className="tag">30 Günlük</span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {topSelling.map((p, i) => (
              <div key={p.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "14px",
                        fontWeight: "800",
                        color: i === 0 ? "var(--accent)" : "var(--text-muted)",
                        width: "20px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px" }}>
                        {p.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        {p.category}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      className="mono"
                      style={{
                        fontWeight: "800",
                        color: "var(--text-primary)",
                        fontSize: "16px",
                      }}
                    >
                      {p.sales_last_30_days}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Sipariş
                    </div>
                  </div>
                </div>
                <div
                  className="progress-bar"
                  style={{ height: "4px", background: "var(--border)" }}
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(p.sales_last_30_days / maxSales) * 100}%`,
                      background: i === 0 ? "var(--accent)" : "var(--green)",
                      opacity: 1 - i * 0.15,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
