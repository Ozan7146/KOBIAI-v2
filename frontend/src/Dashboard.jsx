import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from "lucide-react";
import { getDemandForecast, getDepletionForecast, getSalesAnalytics, recommendCarrier } from "./client";

const Dashboard = () => {
  const navigate = useNavigate();

  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [depletionForecast, setDepletionForecast] = useState(null);
  const [cargoRecommendation, setCargoRecommendation] = useState(null);

  const [salesLoading, setSalesLoading] = useState(false);
  const [depletionLoading, setDepletionLoading] = useState(false);
  const [cargoLoading, setCargoLoading] = useState(false);

  const [salesError, setSalesError] = useState("");
  const [depletionError, setDepletionError] = useState("");
  const [cargoError, setCargoError] = useState("");

  const aiUnavailableMessage = (data) => {
    if (!data?.ai_unavailable) return "";
    return data.ai_error || data.summary || "Gemini yanıtı alınamadı.";
  };

  const loadSales = async () => {
    setSalesLoading(true);
    setSalesError("");
    try {
      const analytics = await getSalesAnalytics();
      setSalesAnalytics(analytics);

      try {
        const forecast = await getDemandForecast();
        setDemandForecast(forecast);
      } catch (forecastError) {
        setDemandForecast(null);
        console.warn("Gemini talep tahmini alınamadı:", forecastError);
      }
    } catch (e) {
      setSalesError(e.message || "Satış analizi alınamadı.");
    } finally {
      setSalesLoading(false);
    }
  };

  const loadDepletion = async () => {
    setDepletionLoading(true);
    setDepletionError("");
    try {
      const data = await getDepletionForecast();
      setDepletionForecast(data);
    } catch (e) {
      setDepletionError(e.message || "Stok tükendi tahmini alınamadı.");
    } finally {
      setDepletionLoading(false);
    }
  };

  const loadCargo = async () => {
    setCargoLoading(true);
    setCargoError("");
    try {
      const data = await recommendCarrier(10.0, "balanced");
      setCargoRecommendation(data || null);
    } catch (e) {
      setCargoError(e.message || "Kargo optimizasyonu alınamadı.");
    } finally {
      setCargoLoading(false);
    }
  };

  useEffect(() => {
    // Üç AI endpoint’ini aynı anda tetiklemek ücretsiz Gemini kotasında 429 üretir; sırayla yükle.
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
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topSalesProduct = salesAnalytics?.products?.[0];
  const topDemandForecast = demandForecast?.forecasts?.[0];
  const salesAIError = aiUnavailableMessage(demandForecast) || aiUnavailableMessage(salesAnalytics);
  const stockAIError = aiUnavailableMessage(depletionForecast);
  const cargoAIError = aiUnavailableMessage(cargoRecommendation);
  const cargoChoice = cargoRecommendation?.recommendation;
  const urgentStock = depletionForecast?.forecasts
    ?.slice()
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, watch: 2, ok: 3 };
      return (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
    })[0];

  const salesMessage = (() => {
    if (salesLoading) return "Analiz yapılıyor...";
    if (salesError) return salesError;
    if (salesAIError) return `Gemini yanıtı alınamadı: ${salesAIError}`;
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
    if (stockAIError) return `Gemini yanıtı alınamadı: ${stockAIError}`;
    if (!urgentStock) return "Veri henüz yüklenmedi.";

    const unit = urgentStock.unit || "adet";
    const days = urgentStock.days_until_empty;
    const qty = urgentStock.suggested_reorder_qty;
    if (days === null || days === undefined) {
      return urgentStock.urgency_label || `${urgentStock.product_name} için tahmin yapılacak satış verisi yetersiz.`;
    }

    return `${urgentStock.product_name} ${days} günde bitecek. Hemen ${qty} ${unit} sipariş önerilir.`;
  })();

  const cargoMessage = (() => {
    if (cargoLoading) return "Kargo firmaları değerlendiriliyor...";
    if (cargoError) return cargoError;
    if (cargoAIError) return `Gemini yanıtı alınamadı: ${cargoAIError}`;
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
        {/* ── Kart 1: Kritik Stok Uyarısı ── */}
        <div
          className="stat-card"
          style={{
            borderColor: "rgba(248, 113, 113, 0.3)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="stat-icon" style={{ background: "var(--red-bg)", color: "var(--red)", flexShrink: 0 }}>
                <AlertTriangle size={20} />
              </div>
              <h3 className="card-title" style={{ fontSize: "15px", margin: 0 }}>
                Kritik Stok Uyarısı
              </h3>
            </div>
            <button
              onClick={loadDepletion}
              disabled={depletionLoading}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              title="Yenile"
            >
              <RefreshCw size={14} style={{ animation: depletionLoading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            {depletionLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>⏳ Tahmin hesaplanıyor...</div>
            ) : depletionError ? (
              <div style={{ color: "var(--red)", fontSize: "13px", padding: "8px", background: "var(--red-bg)", borderRadius: "6px" }}>
                ⚠ {depletionError}
              </div>
            ) : (
              <>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {stockAIError
                    ? "Gemini yok"
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
            style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
            onClick={() => navigate("/inventory")}
          >
            {urgentStock
              ? `Hemen ${urgentStock.suggested_reorder_qty} ${urgentStock.unit || "adet"} Sipariş Ver`
              : "Stok Planını Gör"}
          </button>
        </div>

        {/* ── Kart 2: Kargo Optimizasyonu ── */}
        <div
          className="stat-card"
          style={{
            borderColor: "rgba(52, 211, 153, 0.3)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)", flexShrink: 0 }}>
                <CheckCircle size={20} />
              </div>
              <h3 className="card-title" style={{ fontSize: "15px", margin: 0 }}>
                Kargo Optimizasyonu
              </h3>
            </div>
            <button
              onClick={loadCargo}
              disabled={cargoLoading}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              title="Yenile"
            >
              <RefreshCw size={14} style={{ animation: cargoLoading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            {cargoLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>⏳ Kargo firmaları değerlendiriliyor...</div>
            ) : cargoError ? (
              <div style={{ color: "var(--red)", fontSize: "13px", padding: "8px", background: "var(--red-bg)", borderRadius: "6px" }}>
                ⚠ {cargoError}
              </div>
            ) : (
              <>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {cargoAIError ? "Gemini yok" : cargoChoice ? cargoChoice.carrier : "—"}
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
            style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
            onClick={() => navigate("/cargo")}
          >
            Rota Detaylarını Gör
          </button>
        </div>

        {/* ── Kart 3: Satış & Talep Analizi ── */}
        <div
          className="stat-card"
          style={{
            borderColor: "rgba(96, 165, 250, 0.3)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="stat-icon" style={{ background: "var(--blue-bg)", color: "var(--blue)", flexShrink: 0 }}>
                <TrendingUp size={20} />
              </div>
              <h3 className="card-title" style={{ fontSize: "15px", margin: 0 }}>
                Satış & Talep Analizi
              </h3>
            </div>
            <button
              onClick={loadSales}
              disabled={salesLoading}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
              title="Yenile"
            >
              <RefreshCw size={14} style={{ animation: salesLoading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            {salesLoading ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>⏳ Analiz yapılıyor...</div>
            ) : salesError ? (
              <div style={{ color: "var(--red)", fontSize: "13px", padding: "8px", background: "var(--red-bg)", borderRadius: "6px" }}>
                ⚠ {salesError}
              </div>
            ) : (
              <>
                <div className="stat-value" style={{ fontSize: "20px" }}>
                  {salesAIError
                    ? "Gemini yok"
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
            style={{ width: "100%", justifyContent: "center", marginTop: "auto" }}
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
                <tr>
                  <td>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--text-primary)",
                      }}
                    >
                      Sipariş #10495
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "11px", marginTop: "2px" }}
                    >
                      İstanbul - Hızlı Teslimat
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-confirmed">YZ Atandı</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">İncele</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--text-primary)",
                      }}
                    >
                      Sipariş #10496
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "11px", marginTop: "2px" }}
                    >
                      Ankara - Standart Teslimat
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-preparing">Paketleniyor</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">İncele</button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--text-primary)",
                      }}
                    >
                      Sipariş #10497
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "11px", marginTop: "2px" }}
                    >
                      İzmir - Hızlı Teslimat
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-delayed">Hava Muhalefeti</span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-ghost">İncele</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
