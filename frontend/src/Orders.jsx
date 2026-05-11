import React, { useEffect, useState } from "react";
import { Search, RefreshCw, ChevronDown, X, Truck } from "lucide-react";
import {
  getOrders,
  updateOrderStatus,
  cancelOrder,
  createCargo,
} from "./client";

const STATUS_LABELS = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const STATUS_CLASSES = {
  pending: "badge-pending",
  confirmed: "badge-confirmed",
  preparing: "badge-preparing",
  shipped: "badge-shipped",
  delivered: "badge-delivered",
  cancelled: "badge-cancelled",
};

const NEXT_STATUS = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "shipped",
  shipped: "delivered",
};

const NEXT_LABEL = {
  pending: "Onayla",
  confirmed: "Hazırla",
  preparing: "Kargola",
  shipped: "Teslim Et",
};

function OrderDetail({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [carrier, setCarrier] = useState("Yurtiçi Kargo");
  const [updating, setUpdating] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const advance = async () => {
    const next = NEXT_STATUS[status];
    if (!next) return;
    setUpdating(true);
    try {
      if (status === "preparing" && next === "shipped") {
        await createCargo(order.id, carrier);
      } else {
        await updateOrderStatus(order.id, next);
      }
      setStatus(next);
      onUpdate();
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Siparişi iptal etmek istiyor musunuz?")) return;
    await cancelOrder(order.id);
    onUpdate();
    onClose();
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
              {order.id}
            </div>
            <div
              className="text-muted mono"
              style={{ fontSize: "12px", marginTop: "4px" }}
            >
              {new Date(order.created_at).toLocaleString("tr-TR")}
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "var(--bg)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px" }}
              >
                MÜŞTERİ
              </div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-primary)" }}>
                {order.customer_name}
              </div>
              <div className="text-secondary" style={{ fontSize: "12px", marginTop: "4px" }}>
                {order.customer_email}
              </div>
              <div className="text-secondary mono" style={{ fontSize: "12px", marginTop: "2px" }}>
                {order.customer_phone}
              </div>
            </div>
            
            <div
              style={{
                background: "var(--bg)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px" }}
              >
                ADRES
              </div>
              <div
                className="text-primary"
                style={{ fontSize: "13px", lineHeight: "1.5" }}
              >
                {order.shipping_address}
              </div>
            </div>
          </div>

          <div
            className="table-wrap"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px", textAlign: "left" }}>Ürün</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Adet</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-primary)" }}>
                      {item.product_name}
                    </td>
                    <td className="mono" style={{ padding: "12px", textAlign: "center", color: "var(--text-secondary)" }}>
                      {item.quantity}
                    </td>
                    <td
                      className="mono text-accent"
                      style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}
                    >
                      ₺{item.total_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: "right", marginBottom: "24px" }}>
            <span className="text-muted" style={{ fontSize: "13px" }}>
              Genel Toplam:
            </span>
            <div
              className="text-primary mono"
              style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px" }}
            >
              ₺{order.total_amount.toFixed(2)}
            </div>
          </div>

          {order.cargo_tracking_number && (
            <div
              className="alert alert-info"
              style={{
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "8px",
              }}
            >
              <Truck size={16} />
              <div className="mono" style={{ fontSize: "13px" }}>
                Takip: {order.cargo_tracking_number}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label className="nav-section-label" style={{ padding: 0 }}>SİPARİŞ DURUMU</label>
              <span
                className={`badge ${STATUS_CLASSES[status]}`}
                style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>

            {status === "preparing" && (
              <div style={{ marginTop: "8px" }}>
                <label className="nav-section-label" style={{ padding: 0, marginBottom: "8px", display: "block" }}>KARGO FİRMASI</label>
                <input
                  className="input"
                  style={{ width: "100%", height: "44px" }}
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Kargo firması giriniz..."
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
            display: "grid",
            gridTemplateColumns: ["cancelled", "delivered"].includes(status) ? "1fr" : "1fr 2fr",
            gap: "12px",
          }}
        >
          {!["cancelled", "delivered"].includes(status) && (
            <button
              className="btn btn-ghost"
              style={{ color: "var(--red)", height: "44px", justifyContent: "center" }}
              onClick={cancel}
            >
              İptal Et
            </button>
          )}
          {NEXT_STATUS[status] ? (
            <button
              className="btn btn-primary"
              style={{ height: "44px", justifyContent: "center" }}
              onClick={advance}
              disabled={updating}
            >
              {updating ? <div className="spinner" style={{ width: "18px", height: "18px" }} /> : NEXT_LABEL[status]}
            </button>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ height: "44px", justifyContent: "center" }}
              onClick={onClose}
            >
              Kapat
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    loadData();
    return () => window.removeEventListener("resize", handleResize);
  }, [statusFilter]);

  const loadData = () => {
    setLoading(true);
    getOrders(statusFilter ? { status: statusFilter } : {})
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()),
  );

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
            <h1 className="page-title">Sipariş Yönetimi</h1>
            <p className="page-subtitle text-muted">Müşteri siparişleri ve onay süreçleri</p>
          </div>
          <button className="btn btn-ghost" onClick={loadData} style={{ padding: "10px" }}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          marginBottom: "32px",
        }}
      >
        <div style={{ position: "relative", flex: 2 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: "44px", width: "100%", height: "44px" }}
            placeholder="Müşteri adı veya sipariş ID ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <select
            className="input"
            style={{
              width: "100%",
              height: "44px",
              appearance: "none",
              paddingRight: "40px",
              cursor: "pointer",
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={loadData}
        />
      )}

      {loading ? (
        <div className="loading" style={{ height: "300px" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {isMobile ? (
            filteredOrders.map((o) => (
              <div
                key={o.id}
                className="card"
                onClick={() => setSelectedOrder(o)}
                style={{ padding: "20px", border: "1px solid var(--border)", background: "var(--bg-card)" }}
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
                    {o.id}
                  </span>
                  <span
                    className={`badge ${STATUS_CLASSES[o.status]}`}
                    style={{ fontSize: "11px", padding: "4px 8px" }}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "16px",
                    marginBottom: "6px",
                    color: "var(--text-primary)"
                  }}
                >
                  {o.customer_name}
                </div>
                <div
                  className="text-secondary"
                  style={{ fontSize: "12px", marginBottom: "16px" }}
                >
                  {o.items.length} Kalem ·{" "}
                  {new Date(o.created_at).toLocaleDateString("tr-TR")}
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
                    Toplam Tutar:
                  </span>
                  <span
                    className="mono text-primary"
                    style={{ fontWeight: "800", fontSize: "16px" }}
                  >
                    ₺{o.total_amount.toFixed(2)}
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
                      <th style={{ paddingLeft: "24px" }}>Sipariş ID</th>
                      <th>Müşteri</th>
                      <th>Tutar</th>
                      <th>Durum</th>
                      <th>Tarih</th>
                      <th style={{ width: "40px", paddingRight: "24px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className="mono text-accent" style={{ paddingLeft: "24px", fontWeight: "600" }}>{o.id}</td>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{o.customer_name}</td>
                        <td className="mono" style={{ fontWeight: "700" }}>
                          ₺{o.total_amount.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_CLASSES[o.status]}`} style={{ padding: "4px 10px" }}>
                            {STATUS_LABELS[o.status]}
                          </span>
                        </td>
                        <td
                          className="mono text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          {new Date(o.created_at).toLocaleDateString("tr-TR")}
                        </td>
                        <td style={{ paddingRight: "24px", textAlign: "right" }}>
                          <ChevronDown size={16} className="text-muted" style={{ transform: "rotate(-90deg)" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {filteredOrders.length === 0 && (
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
              Aradığınız kriterlere uygun sipariş bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}