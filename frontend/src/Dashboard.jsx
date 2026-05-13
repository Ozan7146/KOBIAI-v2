import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import {
  getDemandForecast,
  getDepletionForecast,
  getSalesAnalytics,
  recommendCarrier,
  getOrders,
} from "./client";

const Dashboard = () => {
  const navigate = useNavigate();

  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [depletionForecast, setDepletionForecast] = useState(null);
  const [cargoRecommendation, setCargoRecommendation] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const [salesLoading, setSalesLoading] = useState(false);
  const [depletionLoading, setDepletionLoading] = useState(false);
  const [cargoLoading, setCargoLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [salesError, setSalesError] = useState("");
  const [depletionError, setDepletionError] = useState("");
  const [cargoError, setCargoError] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const aiUnavailableMessage = (data) => {
    if (!data?.ai_unavailable) return "";
    return data.ai_error || data.summary || "AI yanıtı alınamadı.";
  };

  const loadSales = async (forceRefresh = false) => {
    setSalesLoading(true);
    setSalesError("");
    try {
      if (!forceRefresh) {
        const cachedSales = sessionStorage.getItem("cache_sales");
        const cachedDemand = sessionStorage.getItem("cache_demand");
        if (cachedSales) {
          setSalesAnalytics(JSON.parse(cachedSales));
          if (cachedDemand) {
            setDemandForecast(JSON.parse(cachedDemand));
          }
          setSalesLoading(false);
          return;
        }
      }

      const analytics = await getSalesAnalytics();
      setSalesAnalytics(analytics);
      sessionStorage.setItem("cache_sales", JSON.stringify(analytics));

      try {
        const forecast = await getDemandForecast();
        setDemandForecast(forecast);
        sessionStorage.setItem("cache_demand", JSON.stringify(forecast));
      } catch (forecastError) {
        setDemandForecast(null);
        sessionStorage.removeItem("cache_demand");
      }
    } catch (e) {
      setSalesError(e.message || "Satış analizi alınamadı.");
    } finally {
      setSalesLoading(false);
    }
  };

  const loadDepletion = async (forceRefresh = false) => {
    setDepletionLoading(true);
    setDepletionError("");
    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("cache_depletion");
        if (cached) {
          setDepletionForecast(JSON.parse(cached));
          setDepletionLoading(false);
          return;
        }
      }

      const data = await getDepletionForecast();
      setDepletionForecast(data);
      sessionStorage.setItem("cache_depletion", JSON.stringify(data));
    } catch (e) {
      setDepletionError(e.message || "Stok tükendi tahmini alınamadı.");
    } finally {
      setDepletionLoading(false);
    }
  };

  const loadCargo = async (forceRefresh = false) => {
    setCargoLoading(true);
    setCargoError("");
    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("cache_cargo");
        if (cached) {
          setCargoRecommendation(JSON.parse(cached));
          setCargoLoading(false);
          return;
        }
      }

      const data = await recommendCarrier(10.0, "balanced");
      setCargoRecommendation(data || null);
      if (data) {
        sessionStorage.setItem("cache_cargo", JSON.stringify(data));
      }
    } catch (e) {
      setCargoError(e.message || "Kargo optimizasyonu alınamadı.");
    } finally {
      setCargoLoading(false);
    }
  };

  const loadOrders = async (forceRefresh = false) => {
    setOrdersLoading(true);
    try {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("cache_orders");
        if (cached) {
          const data = JSON.parse(cached);
          setRecentOrders(
            data
              .filter((o) => o.status === "pending" || o.status === "shipped")
              .slice(0, 5),
          );
          setOrdersLoading(false);
          return;
        }
      }

      const data = await getOrders();
      sessionStorage.setItem("cache_orders", JSON.stringify(data));
      setRecentOrders(
        data
          .filter((o) => o.status === "pending" || o.status === "shipped")
          .slice(0, 5),
      );
    } catch (e) {
      // sessiz hata
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const gap = () => new Promise((r) => setTimeout(r, 350));
    (async () => {
      await loadSales();
      if (cancelled) return;
      await gap();
      await loadDepletion();
      if (cancelled) return;
      await gap();
      await loadCargo();
      if (cancelled) return;
      await gap();
      await loadOrders();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topSalesProduct = salesAnalytics?.products?.[0];
  const topDemandForecast = demandForecast?.forecasts?.[0];
  const salesAIError =
    aiUnavailableMessage(demandForecast) ||
    aiUnavailableMessage(salesAnalytics);
  const stockAIError = aiUnavailableMessage(depletionForecast);
  const cargoAIError = aiUnavailableMessage(cargoRecommendation);
  const cargoChoice = cargoRecommendation?.recommendation;
  const urgentStock = depletionForecast?.forecasts?.slice().sort((a, b) => {
    const order = { critical: 0, warning: 1, watch: 2, ok: 3 };
    return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
  })[0];

  const salesMessage = (() => {
    if (salesLoading) return "Analiz yapılıyor...";
    if (salesError) return salesError;
    if (salesAIError) return `AI yanıtı alınamadı: ${salesAIError}`;
    if (topDemandForecast) {
      return `${topDemandForecast.product_name}: ${topDemandForecast.next_week_estimate}. ${topDemandForecast.action}`;
    }
    if (!topSalesProduct) return "Veri henüz yüklenmedi.";

    const dir = topSalesProduct.trend_direction;
    const pct = Number(topSalesProduct.trend_pct || 0);
    const formattedPct = `${pct >= 0 ? "+" : ""}${pct}%`;
    if (dir === "up") {
      return `Önümüzdeki hafta '${topSalesProduct.product_name}' talebi ${formattedPct} artabilir.`;
    }
    if (dir === "down") {
      return `Önümüzdeki hafta '${topSalesProduct.product_name}' talebi ${formattedPct} azalabilir.`;
    }
    return `Önümüzdeki hafta '${topSalesProduct.product_name}' talebi ${formattedPct} (istikrarlı).`;
  })();

  const stockMessage = (() => {
    if (depletionLoading) return "Tahmin hesaplanıyor...";
    if (depletionError) return depletionError;
    if (stockAIError) return `AI yanıtı alınamadı: ${stockAIError}`;
    if (!urgentStock) return "Veri henüz yüklenmedi.";

    const unit = urgentStock.unit || "adet";
    const days = urgentStock.days_until_empty;
    const qty = urgentStock.suggested_reorder_qty;
    if (days === null || days === undefined) {
      return (
        urgentStock.urgency_label ||
        `${urgentStock.product_name} için tahmin yapılacak satış verisi yetersiz.`
      );
    }

    return `${urgentStock.product_name} ${days} günde bitecek. Hemen ${qty} ${unit} sipariş önerilir.`;
  })();

  const cargoMessage = (() => {
    if (cargoLoading) return "Kargo firmaları değerlendiriliyor...";
    if (cargoError) return cargoError;
    if (cargoAIError) return `AI yanıtı alınamadı: ${cargoAIError}`;
    if (!cargoChoice) return "Veri henüz yüklenmedi.";

    return `${cargoChoice.carrier} önerildi. ${cargoChoice.reason} Ortalama teslimat: ${cargoChoice.avg_delivery_days} iş günü. Tahmini maliyet: ₺${cargoChoice.estimated_cost}.`;
  })();

  return (
    <div className="main-content fade-in" style={{ padding: "16px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <h1
          className="page-title"
          style={{ fontSize: "clamp(20px, 5vw, 26px)" }}
        >
          Akıllı Operasyon Merkezi
        </h1>
        <p className="page-subtitle text-muted">
          Yapay Zeka Destekli İşletme Öngörüleri ve Otomasyon
        </p>
      </div>

      <div
        className="stats-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <div
          className="stat-card"
          style={{
            borderColor: "rgba(248, 113, 113, 0.3)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                className="stat-icon"
                style={{
                  background: "var(--red-bg)",
                  color: "var(--red)",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3
                className="card-title"
                style={{ fontSize: "15px", margin: 0 }}
              >
                Kritik Stok Uyarısı
              </h3>
            </div>
            <button
              onClick={() => loadDepletion(true)}
              disabled={depletionLoading}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
              title="Yenile"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: depletionLoading
                    ? "spin 1s linear infinite"
                    : "none",
                }}
              />
            </button>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            {depletionLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                ⏳ Tahmin hesaplanıyor...
              </div>
            ) : depletionError ? (
              <div
                style={{
                  color: "var(--red)",
                  fontSize: "13px",
                  padding: "8px",
                  background: "var(--red-bg)",
                  borderRadius: "6px",
                }}
              >
                ⚠ {depletionError}
              </div>
            ) : (
              <>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {stockAIError
                    ? "AI yok"
                    : depletionForecast
                      ? `${depletionForecast.summary.critical} Kritik / ${depletionForecast.summary.warning} Uyarı`
                      : "—"}
                </div>
                <p className="stat-label" style={{ marginTop: "6px" }}>
                  {stockAIError ? "AI Durumu:" : "YZ Analizi:"}{" "}
                  <span className="text-red" style={{ fontWeight: "700" }}>
                    {stockMessage}
                  </span>
                </p>
              </>
            )}
          </div>
          <button
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "auto",
            }}
            onClick={() => navigate("/inventory")}
          >
            {urgentStock
              ? `Hemen ${urgentStock.suggested_reorder_qty} ${urgentStock.unit || "adet"} Sipariş Ver`
              : "Stok Planını Gör"}
          </button>
        </div>

        <div
          className="stat-card"
          style={{
            borderColor: "rgba(52, 211, 153, 0.3)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                className="stat-icon"
                style={{
                  background: "var(--green-bg)",
                  color: "var(--green)",
                  flexShrink: 0,
                }}
              >
                <CheckCircle size={20} />
              </div>
              <h3
                className="card-title"
                style={{ fontSize: "15px", margin: 0 }}
              >
                Kargo Optimizasyonu
              </h3>
            </div>
            <button
              onClick={() => loadCargo(true)}
              disabled={cargoLoading}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
              title="Yenile"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: cargoLoading ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            {cargoLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                ⏳ Kargo firmaları değerlendiriliyor...
              </div>
            ) : cargoError ? (
              <div
                style={{
                  color: "var(--red)",
                  fontSize: "13px",
                  padding: "8px",
                  background: "var(--red-bg)",
                  borderRadius: "6px",
                }}
              >
                ⚠ {cargoError}
              </div>
            ) : (
              <>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {cargoAIError
                    ? "AI yok"
                    : cargoChoice
                      ? cargoChoice.carrier
                      : "—"}
                </div>
                <p className="stat-label" style={{ marginTop: "6px" }}>
                  {cargoAIError
                    ? cargoMessage
                    : cargoChoice
                      ? `${cargoChoice.reason} Ort. teslimat: ${cargoChoice.avg_delivery_days} gün · ₺${cargoChoice.estimated_cost}`
                      : "Veri bekleniyor..."}
                </p>
              </>
            )}
          </div>
          <button
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "auto",
            }}
            onClick={() => navigate("/cargo")}
          >
            Rota Detaylarını Gör
          </button>
        </div>

        <div
          className="stat-card"
          style={{
            borderColor: "rgba(96, 165, 250, 0.3)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                className="stat-icon"
                style={{
                  background: "var(--blue-bg)",
                  color: "var(--blue)",
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={20} />
              </div>
              <h3
                className="card-title"
                style={{ fontSize: "15px", margin: 0 }}
              >
                Satış & Talep Analizi
              </h3>
            </div>
            <button
              onClick={() => loadSales(true)}
              disabled={salesLoading}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: "4px",
              }}
              title="Yenile"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: salesLoading ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            {salesLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                ⏳ Analiz yapılıyor...
              </div>
            ) : salesError ? (
              <div
                style={{
                  color: "var(--red)",
                  fontSize: "13px",
                  padding: "8px",
                  background: "var(--red-bg)",
                  borderRadius: "6px",
                }}
              >
                ⚠ {salesError}
              </div>
            ) : (
              <>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {salesAIError
                    ? "AI yok"
                    : topDemandForecast
                      ? topDemandForecast.urgency?.toUpperCase()
                      : topSalesProduct
                        ? `${topSalesProduct.trend_pct > 0 ? "+" : ""}${topSalesProduct.trend_pct}% Trend`
                        : "—"}
                </div>
                <p className="stat-label" style={{ marginTop: "6px" }}>
                  {salesMessage}
                </p>
              </>
            )}
          </div>
          <button
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "auto",
            }}
            onClick={() => navigate("/inventory")}
          >
            Analitik Raporunu İncele
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        className="grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}
      >
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header" style={{ padding: "20px" }}>
            <h3 className="card-title">Aktif Sipariş İşlemleri</h3>
          </div>
          {isMobile ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "0 20px 20px",
              }}
            >
              {ordersLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-muted)",
                  }}
                >
                  ⏳ Siparişler yükleniyor...
                </div>
              ) : recentOrders.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-muted)",
                  }}
                >
                  Aktif sipariş bulunmuyor.
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "var(--text-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        Sipariş #{order.id}
                      </div>
                      <div
                        className="text-muted"
                        style={{ fontSize: "11px", marginBottom: "8px" }}
                      >
                        {order.customer_name} • ₺{order.total_amount}
                      </div>
                      <span
                        className={`badge ${
                          order.status === "pending"
                            ? "badge-preparing"
                            : order.status === "shipped"
                              ? "badge-confirmed"
                              : "badge-delayed"
                        }`}
                        style={{ fontSize: "10px", padding: "4px 8px" }}
                      >
                        {order.status === "pending"
                          ? "Paketleniyor"
                          : order.status === "shipped"
                            ? "Kargoda"
                            : order.status === "delayed"
                              ? "Gecikti"
                              : order.status}
                      </span>
                    </div>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => navigate("/orders")}
                    >
                      İncele
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div
              className="table-wrap"
              style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
            >
              <table style={{ minWidth: "500px" }}>
                <thead>
                  <tr>
                    <th>Sipariş Bilgisi</th>
                    <th>YZ Durumu</th>
                    <th>Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ⏳ Siparişler yükleniyor...
                      </td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Aktif sipariş bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "var(--text-primary)",
                            }}
                          >
                            Sipariş #{order.id}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "11px", marginTop: "2px" }}
                          >
                            {order.customer_name} • ₺{order.total_amount}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              order.status === "pending"
                                ? "badge-preparing"
                                : order.status === "shipped"
                                  ? "badge-confirmed"
                                  : "badge-delayed"
                            }`}
                          >
                            {order.status === "pending"
                              ? "Paketleniyor"
                              : order.status === "shipped"
                                ? "Kargoda"
                                : order.status === "delayed"
                                  ? "Gecikti"
                                  : order.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => navigate("/orders")}
                          >
                            İncele
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
