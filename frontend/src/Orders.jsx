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
        background: "rgba(10, 10, 15, 0.9)",
        zIndex: 2000,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="card fade-in"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: isMobile ? "92vh" : "85vh",
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: isMobile ? "20px 20px 0 0" : "12px",
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
              style={{ fontSize: "18px" }}
            >
              {order.id}
            </div>
            <div className="text-muted mono" style={{ fontSize: "11px" }}>
              {new Date(order.created_at).toLocaleString("tr-TR")}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "20px",
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
              <div style={{ fontWeight: "700", fontSize: "15px" }}>
                {order.customer_name}
              </div>
              <div className="text-secondary" style={{ fontSize: "12px" }}>
                {order.customer_email}
              </div>
              <div className="text-secondary mono" style={{ fontSize: "12px" }}>
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
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th style={{ textAlign: "center" }}>Adet</th>
                  <th style={{ textAlign: "right" }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "13px" }}>{item.product_name}</td>
                    <td className="mono" style={{ textAlign: "center" }}>
                      {item.quantity}
                    </td>
                    <td
                      className="mono text-accent"
                      style={{ textAlign: "right", fontWeight: "600" }}
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
              style={{ fontSize: "24px", fontWeight: "800" }}
            >
              ₺{order.total_amount.toFixed(2)}
            </div>
          </div>

          {order.cargo_tracking_number && (
            <div className="alert alert-info" style={{ marginBottom: "20px" }}>
              <Truck size={16} />
              <div className="mono" style={{ fontSize: "13px" }}>
                Takip: {order.cargo_tracking_number}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <span
                className={`badge ${STATUS_CLASSES[status]}`}
                style={{
                  padding: "10px 15px",
                  flex: isMobile ? 1 : "none",
                  justifyContent: "center",
                }}
              >
                {STATUS_LABELS[status]}
              </span>
              {status === "preparing" && (
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Firma..."
                />
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {!["cancelled", "delivered"].includes(status) && (
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, color: "var(--red)" }}
                  onClick={cancel}
                >
                  İptal
                </button>
              )}
              {NEXT_STATUS[status] && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: "center" }}
                  onClick={advance}
                  disabled={updating}
                >
                  {updating ? "..." : NEXT_LABEL[status]}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
          <h1 className="page-title">Siparişler</h1>
          <button className="btn btn-ghost" onClick={loadData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={{ position: "relative", flex: 2 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: "40px" }}
            placeholder="Müşteri veya ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ flex: 1 }}
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
      </div>

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={loadData}
        />
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {isMobile ? (
            filteredOrders.map((o) => (
              <div
                key={o.id}
                className="card"
                onClick={() => setSelectedOrder(o)}
                style={{ padding: "16px", border: "1px solid var(--border)" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    className="mono text-accent"
                    style={{ fontSize: "13px", fontWeight: "700" }}
                  >
                    {o.id}
                  </span>
                  <span
                    className={`badge ${STATUS_CLASSES[o.status]}`}
                    style={{ fontSize: "10px" }}
                  >
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "15px",
                    marginBottom: "4px",
                  }}
                >
                  {o.customer_name}
                </div>
                <div
                  className="text-secondary"
                  style={{ fontSize: "12px", marginBottom: "12px" }}
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
                    paddingTop: "10px",
                  }}
                >
                  <span className="text-muted" style={{ fontSize: "12px" }}>
                    Toplam Tutar:
                  </span>
                  <span
                    className="mono text-primary"
                    style={{ fontWeight: "800" }}
                  >
                    ₺{o.total_amount.toFixed(2)}
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
                      <th>Sipariş ID</th>
                      <th>Müşteri</th>
                      <th>Tutar</th>
                      <th>Durum</th>
                      <th>Tarih</th>
                      <th style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedOrder(o)}
                      >
                        <td className="mono text-accent">{o.id}</td>
                        <td style={{ fontWeight: "600" }}>{o.customer_name}</td>
                        <td className="mono" style={{ fontWeight: "700" }}>
                          ₺{o.total_amount.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_CLASSES[o.status]}`}>
                            {STATUS_LABELS[o.status]}
                          </span>
                        </td>
                        <td
                          className="mono text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          {new Date(o.created_at).toLocaleDateString("tr-TR")}
                        </td>
                        <td>
                          <ChevronDown size={16} className="text-muted" />
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
                padding: "40px",
                color: "var(--text-muted)",
              }}
            >
              Kayıt bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
