import React, { useEffect, useState } from 'react'
import { RefreshCw, TrendingUp, AlertTriangle, PackageX, Plus } from 'lucide-react'
import { getInventoryAlerts, getInventorySummary, getTopSelling, restockProduct } from './client'

const ALERT_LABELS = { ok: 'Normal', low: 'Düşük', critical: 'Kritik', out_of_stock: 'Tükendi' }
const ALERT_CLASSES = { ok: 'badge-ok', low: 'badge-low', critical: 'badge-critical', out_of_stock: 'badge-out_of_stock' }
const ALERT_COLORS = { ok: 'var(--green)', low: 'var(--yellow)', critical: 'var(--red)', out_of_stock: 'var(--red)' }

function RestockModal({ product, onClose, onDone }) {
  const [qty, setQty] = useState(product.suggested_reorder_qty || 50)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await restockProduct(product.product_id, qty)
      onDone()
      onClose()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 380 }}>
        <div className="card-header">
          <div className="card-title">Stok Ekle</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{product.product_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Mevcut stok: <strong>{product.current_stock} {product.unit}</strong>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Önerilen miktar: {product.suggested_reorder_qty} {product.unit}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>EKLENECEK MİKTAR ({product.unit?.toUpperCase()})</label>
          <input className="input" type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value))} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            <Plus size={14} />{saving ? '...' : 'Stok Ekle'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [alerts, setAlerts] = useState([])
  const [summary, setSummary] = useState(null)
  const [topSelling, setTopSelling] = useState([])
  const [loading, setLoading] = useState(true)
  const [restocking, setRestocking] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([getInventoryAlerts(), getInventorySummary(), getTopSelling(5)])
      .then(([a, s, t]) => { setAlerts(a); setSummary(s); setTopSelling(t) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="loading"><div className="spinner" />Yükleniyor...</div>

  const maxSales = Math.max(...topSelling.map(p => p.sales_last_30_days), 1)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="page-title">Envanter</div>
            <div className="page-subtitle">Stok yönetimi ve uyarılar</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          </div>
        </div>
      </div>

      {restocking && <RestockModal product={restocking} onClose={() => setRestocking(null)} onDone={load} />}

      {/* Summary stats */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Toplam Ürün', value: summary.total_products, color: 'var(--blue)' },
            { label: 'Normal Stok', value: summary.ok, color: 'var(--green)' },
            { label: 'Düşük Stok', value: summary.low_stock, color: 'var(--yellow)' },
            { label: 'Kritik', value: summary.critical_stock, color: 'var(--red)' },
            { label: 'Tükendi', value: summary.out_of_stock, color: 'var(--red)' },
            { label: 'Envanter Değeri', value: `₺${summary.total_inventory_value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} style={{ color: 'var(--red)' }} /> Stok Uyarıları
            </div>
            <span className="tag">{alerts.length} ürün</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: 13 }}>
                ✅ Tüm stoklar normal seviyede
              </div>
            ) : alerts.map(a => (
              <div key={a.product_id} style={{
                border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px',
                borderLeft: `3px solid ${ALERT_COLORS[a.alert_level] || 'var(--border)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.product_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.category} · {a.supplier || ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge ${ALERT_CLASSES[a.alert_level]}`}>{ALERT_LABELS[a.alert_level]}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setRestocking(a)}><Plus size={12} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>Mevcut: <strong className="mono">{a.current_stock} {a.unit}</strong></span>
                  <span>Min: <strong className="mono">{a.min_threshold}</strong></span>
                  <span>Önerilen sipariş: <strong className="mono">{a.suggested_reorder_qty}</strong></span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${Math.min(100, (a.current_stock / a.min_threshold) * 100)}%`,
                      background: ALERT_COLORS[a.alert_level]
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--green)' }} /> En Çok Satanlar
            </div>
            <span className="tag">Son 30 Gün</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topSelling.map((p, i) => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 16 }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.category}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.sales_last_30_days}</div>
                    <span className={`badge ${ALERT_CLASSES[p.stock_alert]}`} style={{ marginTop: 2 }}>{ALERT_LABELS[p.stock_alert]}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${(p.sales_last_30_days / maxSales) * 100}%`,
                    background: 'var(--green)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
