import React, { useEffect, useState } from 'react'
import { Plus, Search, RefreshCw, Pencil, Trash2, X, Check } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct } from './client'

const ALERT_LABELS = { ok: 'Normal', low: 'Düşük', critical: 'Kritik', out_of_stock: 'Tükendi' }
const ALERT_CLASSES = { ok: 'badge-ok', low: 'badge-low', critical: 'badge-critical', out_of_stock: 'badge-out_of_stock' }

const emptyForm = {
  name: '', category: '', price: '', stock_quantity: '', min_stock_threshold: 10, unit: 'adet', description: '', supplier: ''
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [alertFilter, setAlertFilter] = useState('')

  const load = () => {
    setLoading(true)
    getProducts(alertFilter ? { alert: alertFilter } : {})
      .then(setProducts)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [alertFilter])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowForm(true) }
  const openEdit = (p) => {
    setForm({ ...p, price: p.price, stock_quantity: p.stock_quantity, min_stock_threshold: p.min_stock_threshold })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = {
        ...form,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity),
        min_stock_threshold: parseInt(form.min_stock_threshold),
      }
      if (editingId) {
        await updateProduct(editingId, data)
      } else {
        await createProduct(data)
      }
      setShowForm(false)
      load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return
    await deleteProduct(id)
    load()
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="page-title">Ürünler</div>
            <div className="page-subtitle">Ürün kataloğu ve stok bilgileri</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
            <button className="btn btn-primary" onClick={openCreate}><Plus size={14} />Ürün Ekle</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Ürün veya kategori ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={alertFilter} onChange={e => setAlertFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="ok">Normal</option>
          <option value="low">Düşük Stok</option>
          <option value="critical">Kritik</option>
          <option value="out_of_stock">Tükendi</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 520, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <div className="card-title">{editingId ? 'Ürünü Düzenle' : 'Yeni Ürün'}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['name', 'Ürün Adı', 'text', true],
                ['category', 'Kategori', 'text', true],
                ['price', 'Fiyat (₺)', 'number', true],
                ['unit', 'Birim', 'text', false],
                ['stock_quantity', 'Stok Miktarı', 'number', true],
                ['min_stock_threshold', 'Min. Eşik', 'number', false],
                ['supplier', 'Tedarikçi', 'text', false],
              ].map(([field, label, type, required]) => (
                <div key={field} style={field === 'name' || field === 'supplier' ? { gridColumn: '1/-1' } : {}}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{label.toUpperCase()}</label>
                  <input
                    className="input"
                    type={type}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    required={required}
                    step={type === 'number' && field === 'price' ? '0.01' : '1'}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>AÇIKLAMA</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                <Check size={14} />{saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading"><div className="spinner" />Yükleniyor...</div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{filtered.length} ürün</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ürün</th>
                  <th>Kategori</th>
                  <th>Fiyat</th>
                  <th>Stok</th>
                  <th>Durum</th>
                  <th>30g Satış</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td><span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.supplier && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.supplier}</div>}
                    </td>
                    <td><span className="tag">{p.category}</span></td>
                    <td className="mono">₺{p.price.toFixed(2)}</td>
                    <td className="mono">{p.stock_quantity} {p.unit}</td>
                    <td><span className={`badge ${ALERT_CLASSES[p.stock_alert] || ''}`}>{ALERT_LABELS[p.stock_alert] || p.stock_alert}</span></td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{p.sales_last_30_days}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Pencil size={12} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
