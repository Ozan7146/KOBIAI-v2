import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Package,
} from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
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

const emptyForm = {
  name: "",
  category: "",
  price: "",
  stock_quantity: "",
  min_stock_threshold: 10,
  unit: "adet",
  description: "",
  supplier: "",
};

function ProductDrawer({
  editingId,
  form,
  setForm,
  onClose,
  onSave,
  saving,
  isMobile,
}) {
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
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "var(--accent)",
                margin: 0,
              }}
            >
              {editingId ? "Ürünü Düzenle" : "Yeni Ürün Kaydı"}
            </h2>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Lütfen ürün bilgilerini eksiksiz giriniz.
            </p>
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
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px", display: "block" }}
              >
                ÜRÜN ADI
              </label>
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Örn: Kablosuz Mouse"
              />
            </div>

            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px", display: "block" }}
              >
                KATEGORİ
              </label>
              <input
                className="input"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="Örn: Aksesuar"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  className="nav-section-label"
                  style={{ padding: 0, marginBottom: "8px", display: "block" }}
                >
                  FİYAT (₺)
                </label>
                <input
                  className="input mono"
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  step="0.01"
                />
              </div>
              <div>
                <label
                  className="nav-section-label"
                  style={{ padding: 0, marginBottom: "8px", display: "block" }}
                >
                  BİRİM
                </label>
                <input
                  className="input"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  placeholder="adet, kg..."
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  className="nav-section-label"
                  style={{ padding: 0, marginBottom: "8px", display: "block" }}
                >
                  STOK MİKTARI
                </label>
                <input
                  className="input mono"
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock_quantity: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  className="nav-section-label"
                  style={{ padding: 0, marginBottom: "8px", display: "block" }}
                >
                  KRİTİK EŞİK
                </label>
                <input
                  className="input mono"
                  type="number"
                  value={form.min_stock_threshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      min_stock_threshold: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px", display: "block" }}
              >
                TEDARİKÇİ
              </label>
              <input
                className="input"
                value={form.supplier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier: e.target.value }))
                }
                placeholder="Firma adı..."
              />
            </div>

            <div>
              <label
                className="nav-section-label"
                style={{ padding: 0, marginBottom: "8px", display: "block" }}
              >
                AÇIKLAMA
              </label>
              <textarea
                className="input"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                style={{ resize: "none", lineHeight: "1.5" }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "24px",
            borderTop: "1px solid var(--border)",
            background: "rgba(255,255,255,0.01)",
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "12px",
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ height: "44px", justifyContent: "center" }}
          >
            İptal
          </button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={saving}
            style={{ height: "44px", justifyContent: "center" }}
          >
            {saving ? (
              <div
                className="spinner"
                style={{ width: "18px", height: "18px" }}
              />
            ) : (
              <>
                <Check size={18} /> {editingId ? "Güncelle" : "Kaydet"}
              </>
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

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertFilter, setAlertFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    load();
    return () => window.removeEventListener("resize", handleResize);
  }, [alertFilter]);

  const load = () => {
    setLoading(true);
    getProducts(alertFilter ? { alert: alertFilter } : {})
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };
  const openEdit = (p) => {
    setForm({ ...p });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      alert("Lütfen gerekli alanları doldurun.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity || 0),
        min_stock_threshold: parseInt(form.min_stock_threshold || 0),
      };
      if (editingId) await updateProduct(editingId, data);
      else await createProduct(data);
      setShowForm(false);
      load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    await deleteProduct(id);
    load();
  };

  return (
    <div
      className="main-content fade-in"
      style={{
        padding: isMobile ? "16px" : "32px",
        paddingBottom: isMobile ? "100px" : "32px",
      }}
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
            <h1 className="page-title">Ürün Kataloğu</h1>
            <p className="page-subtitle text-muted">
              Stok durumunu ve ürün listesini buradan yönetebilirsiniz.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-ghost"
              onClick={load}
              style={{ padding: "10px" }}
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="btn btn-primary"
              onClick={openCreate}
              style={{ padding: isMobile ? "10px" : "10px 20px" }}
            >
              <Plus size={18} /> {!isMobile && "Yeni Ürün"}
            </button>
          </div>
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
            placeholder="Ürün adı veya kategori ara..."
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
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
          >
            <option value="">Tüm Stok Durumları</option>
            {Object.entries(ALERT_LABELS).map(([v, l]) => (
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

      {showForm && (
        <ProductDrawer
          editingId={editingId}
          form={form}
          setForm={setForm}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          saving={saving}
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
            filtered.map((p) => (
              <div
                key={p.id}
                className="card"
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
                    className="mono text-muted"
                    style={{ fontSize: "11px" }}
                  >
                    ID: {p.id}
                  </span>
                  <span
                    className={`badge ${ALERT_CLASSES[p.stock_alert] || ""}`}
                    style={{ fontSize: "10px" }}
                  >
                    {ALERT_LABELS[p.stock_alert] || p.stock_alert}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "16px",
                    marginBottom: "4px",
                    color: "var(--text-primary)",
                  }}
                >
                  {p.name}
                </div>
                <div
                  className="text-secondary"
                  style={{ fontSize: "12px", marginBottom: "16px" }}
                >
                  {p.category} · {p.supplier || "Tedarikçi Yok"}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span className="text-muted" style={{ fontSize: "10px" }}>
                      Stok:
                    </span>
                    <span
                      className="mono text-primary"
                      style={{ fontWeight: "700" }}
                    >
                      {p.stock_quantity} {p.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <span className="text-muted" style={{ fontSize: "10px" }}>
                      Fiyat:
                    </span>
                    <span
                      className="mono text-accent"
                      style={{ fontWeight: "800" }}
                    >
                      ₺{p.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => openEdit(p)}
                  >
                    <Pencil size={16} /> Düzenle
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      color: "var(--red)",
                    }}
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={16} /> Sil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table
                  style={{ borderCollapse: "separate", borderSpacing: "0" }}
                >
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: "24px" }}>Ürün Bilgisi</th>
                      <th>Kategori</th>
                      <th>Fiyat</th>
                      <th>Stok</th>
                      <th>Durum</th>
                      <th style={{ textAlign: "right", paddingRight: "24px" }}>
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <td style={{ paddingLeft: "24px" }}>
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "14px",
                              color: "var(--text-primary)",
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            className="text-muted mono"
                            style={{ fontSize: "10px", marginTop: "2px" }}
                          >
                            ID: {p.id} · {p.supplier}
                          </div>
                        </td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {p.category}
                          </span>
                        </td>
                        <td className="mono" style={{ fontWeight: "600" }}>
                          ₺{p.price.toFixed(2)}
                        </td>
                        <td
                          className="mono"
                          style={{
                            color:
                              p.stock_quantity <= p.min_stock_threshold
                                ? "var(--red)"
                                : "var(--text-primary)",
                          }}
                        >
                          {p.stock_quantity}{" "}
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {p.unit}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${ALERT_CLASSES[p.stock_alert] || ""}`}
                            style={{ padding: "4px 10px" }}
                          >
                            {ALERT_LABELS[p.stock_alert] || p.stock_alert}
                          </span>
                        </td>
                        <td
                          style={{ textAlign: "right", paddingRight: "24px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => openEdit(p)}
                              title="Düzenle"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--red)" }}
                              onClick={() => handleDelete(p.id)}
                              title="Sil"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "var(--bg-card)",
                borderRadius: "12px",
                border: "1px dashed var(--border)",
              }}
            >
              <Package
                size={48}
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "16px",
                  opacity: 0.5,
                }}
              />
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Aradığınız kriterlere uygun ürün bulunamadı.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
