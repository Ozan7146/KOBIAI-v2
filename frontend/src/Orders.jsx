import React, { useEffect, useState } from 'react'
import { Search, RefreshCw, ChevronDown, X, Truck } from 'lucide-react'
import { getOrders, updateOrderStatus, cancelOrder, createCargo } from './client'

const STATUS_LABELS = {
  pending: 'Beklemede', confirmed: 'Onaylandı', preparing: 'Hazırlanıyor',
  shipped: 'Kargoda', delivered: 'Teslim Edildi', cancelled: 'İptal'
}
const STATUS_CLASSES = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', preparing: 'badge-preparing',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled'
}
const NEXT_STATUS = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'shipped', shipped: 'delivered'
}
const NEXT_LABEL = {
  pending: 'Onayla', confirmed: 'Hazırlamaya Başla', preparing: 'Kargoya Ver', shipped: 'Teslim Edildi İşaretle'
}

function OrderDetail({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status)
  const [carrier, setCarrier] = useState('Yurtiçi Kargo')
  const [updating, setUpdating] = useState(false)

  const advance = async () => {
    const next = NEXT_STATUS[status]
    if (!next) return
    setUpdating(true)
    try {
      if (status === 'preparing' && next === 'shipped') {
        await createCargo(order.id, carrier)
      } else {
        await updateOrderStatus(order.id, next)
      }
      setStatus(next)
      onUpdate()
    } catch (e) { alert(e.message) }
    finally { setUpdating(false) }
  }

  const cancel = async () => {
    if (!confirm('Siparişi iptal etmek istediğinizden emin misiniz?')) return
    await cancelOrder(order.id)
    onUpdate(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 580, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="card-header">
          <div>
            <div className="card-title">{order.id}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {new Date(order.created_at).toLocaleString('tr-TR')}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>MÜŞTERİ</div>
            <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.customer_email}</div>
            {order.customer_phone && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{order.customer_phone}</div>}
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 4 }}>TESLİMAT ADRESİ</div>
            <div style={{ fontSize: 13 }}>{order.shipping_address}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 8 }}>SİPARİŞ KALEMLERİ</div>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                {['Ürün', 'Adet', 'Birim Fiyat', 'Toplam'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '6px 0', textAlign: 'left', letterSpacing: 1 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0', fontSize: 13 }}>{item.product_name}</td>
                  <td className="mono" style={{ padding: '8px 0' }}>{item.quantity}</td>
                  <td className="mono" style={{ padding: '8px 0' }}>₺{item.unit_price.toFixed(2)}</td>
                  <td className="mono" style={{ padding: '8px 0', fontWeight: 600 }}>₺{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
            Toplam: ₺{order.total_amount.toFixed(2)}
          </div>
        </div>

        {order.notes && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 10, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
            📝 {order.notes}
          </div>
        )}

        {order.cargo_tracking_number && (
          <div style={{ background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, padding: 10, fontSize: 12.5, color: 'var(--blue)', marginBottom: 16 }}>
            🚚 Kargo Takip: <span className="mono">{order.cargo_tracking_number}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <span className={`badge ${STATUS_CLASSES[status]}`}>{STATUS_LABELS[status]}</span>

          {status === 'preparing' && (
            <input className="input" style={{ flex: 1, maxWidth: 180 }} value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="Kargo firması" />
          )}

          {NEXT_STATUS[status] && (
            <button className="btn btn-primary btn-sm" onClick={advance} disabled={updating} style={{ marginLeft: 'auto' }}>
              <Truck size={12} />{updating ? '...' : NEXT_LABEL[status]}
            </button>
          )}

          {!['cancelled', 'delivered'].includes(status) && (
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={cancel}>İptal Et</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    getOrders(statusFilter ? { status: statusFilter } : {})
      .then(setOrders)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const filtered = orders.filter(o =>
    o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="page-title">Siparişler</div>
            <div className="page-subtitle">Tüm sipariş yönetimi</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Müşteri adı veya sipariş ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} onUpdate={load} />}

      {loading ? (
        <div className="loading"><div className="spinner" />Yükleniyor...</div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{filtered.length} sipariş</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sipariş ID</th>
                  <th>Müşteri</th>
                  <th>Adres</th>
                  <th>Ürünler</th>
                  <th>Toplam</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(o)}>
                    <td><span className="mono" style={{ color: 'var(--accent)', fontSize: 12 }}>{o.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{o.shipping_address}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.items.length} kalem</td>
                    <td className="mono" style={{ fontWeight: 700 }}>₺{o.total_amount.toFixed(2)}</td>
                    <td><span className={`badge ${STATUS_CLASSES[o.status] || ''}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(o.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td><ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: 'rotate(-90deg)' }} /></td>
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
