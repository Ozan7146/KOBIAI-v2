import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

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
              gap: "12px",
              marginBottom: "16px",
            }}
          >
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
            <h3 className="card-title" style={{ fontSize: "15px", margin: 0 }}>
              Kritik Stok Uyarısı
            </h3>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            <div className="stat-value" style={{ fontSize: "20px" }}>
              X Model Kulaklık
            </div>
            <p className="stat-label" style={{ marginTop: "6px" }}>
              YZ Analizi: Bu ürün{" "}
              <span className="text-red" style={{ fontWeight: "700" }}>
                3 gün içinde
              </span>{" "}
              tükenecek.
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "auto",
            }}
          >
            Hemen 50 Adet Sipariş Ver
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
              gap: "12px",
              marginBottom: "16px",
            }}
          >
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
            <h3 className="card-title" style={{ fontSize: "15px", margin: 0 }}>
              Kargo Optimizasyonu
            </h3>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            <div className="stat-value" style={{ fontSize: "20px" }}>
              12 Yeni Sipariş
            </div>
            <p className="stat-label" style={{ marginTop: "6px" }}>
              Sistem hız analizi yaparak siparişleri{" "}
              <span className="text-green" style={{ fontWeight: "700" }}>
                Firma Y'ye
              </span>{" "}
              atadı.
            </p>
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
              gap: "12px",
              marginBottom: "16px",
            }}
          >
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
            <h3 className="card-title" style={{ fontSize: "15px", margin: 0 }}>
              Satış & Talep Analizi
            </h3>
          </div>
          <div style={{ flexGrow: 1, marginBottom: "20px" }}>
            <div className="stat-value" style={{ fontSize: "20px" }}>
              Yaklaşan Talep Artışı
            </div>
            <p className="stat-label" style={{ marginTop: "6px" }}>
              Gelecek hafta yazlık ürünlerde{" "}
              <span className="text-accent" style={{ fontWeight: "700" }}>
                %40 artış
              </span>{" "}
              bekleniyor.
            </p>
          </div>
          <button
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "auto",
            }}
          >
            Analitik Raporunu İncele
          </button>
        </div>
      </div>

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
