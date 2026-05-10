import React, { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, MapPin, Clock, ChevronDown, X } from 'lucide-react'
import { getAllCargo, getDelayedShipments, updateCargoStatus } from "./client.js";

const CARGO_STATUS_LABELS = {
  not_shipped: 'Kargoya Verilmedi',
  picked_up: 'Kargo Alındı',
  in_transit: 'Yolda',
  out_for_delivery: 'Dağıtımda',
  delivered: 'Teslim Edildi',
  delayed: 'Gecikmeli',
  returned: 'İade',
}
const CARGO_STATUS_CLASSES = {
  not_shipped: 'badge-pending',
  picked_up: 'badge-confirmed',
  in_transit: 'badge-shipped',
  out_for_delivery: 'badge-preparing',
  delivered: 'badge-delivered',
  delayed: 'badge-critical',
  returned: 'badge-cancelled',
}

function CargoDetail({ cargo, onClose, onUpdate }) {
  const [newStatus, setNewStatus] = useState(cargo.status)
  const [location, setLocation] = useState(cargo.current_location || '')
  const [isDelayed, setIsDelayed] = useState(cargo.is_delayed)
  const [delayReason, setDelayReason] = useState(cargo.delay_reason || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateCargoStatus(cargo.tracking_number, newStatus, location, isDelayed, delayReason || undefined)
      onUpdate(); onClose()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 560, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Kargo: {cargo.tracking_number}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cargo.carrier} · Sipariş: {cargo.order_id}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        {cargo.is_delayed && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Gecikme Tespit Edildi</strong>
              {cargo.delay_reason && <div style={{ marginTop: 4, fontSize: 12 }}>{cargo.delay_reason}</div>}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 10 }}>KARGO HAREKETLERİ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[...(cargo.events || [])].reverse().map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 12, position: 'relative' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--border-light)', marginTop: 4, flexShrink: 0, zIndex: 1 }} />
                {i < (cargo.events?.length || 0) - 1 && (
                  <div style={{ position: 'absolute', left: 3.5, top: 12, bottom: 0, width: 1, background: 'var(--border)' }} />
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{ev.status}</div>
                  {ev.location && <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={10} />{ev.location}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />{ev.time ? new Date(ev.time).toLocaleString('tr-TR') : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>YENİ DURUM</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {Object.entries(CARGO_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>GÜNCEL KONUM</label>
            <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Şehir / Dağıtım Merkezi" />
          </div>
          <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="delayed" checked={isDelayed} onChange={e => setIsDelayed(e.target.checked)} style={{ cursor: 'pointer' }} />
            <label htmlFor="delayed" style={{ fontSize: 13, cursor: 'pointer', color: isDelayed ? 'var(--red)' : 'var(--text-secondary)' }}>Gecikme var</label>
          </div>
          {isDelayed && (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>GECİKME SEBEBİ</label>
              <input className="input" value={delayReason} onChange={e => setDelayReason(e.target.value)} placeholder="Hava koşulları, trafik vb." />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Kapat</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Güncelle'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Cargo() {
  const [cargo, setCargo] = useState([])
  const [delayed, setDelayed] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([getAllCargo(), getDelayedShipments()])
      .then(([all, del]) => { setCargo(all); setDelayed(del) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const displayList = tab === 'delayed' ? delayed : cargo

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="page-title">Kargo Takibi</div>
            <div className="page-subtitle">Gönderilerin anlık durumu</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {delayed.length > 0 && (
              <div className="alert alert-error" style={{ padding: '6px 12px', fontSize: 12 }}>
                <AlertTriangle size={14} />{delayed.length} gecikmeli gönderi
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
        {[['all', 'Tüm Kargolar'], ['delayed', `Gecikmeli (${delayed.length})`]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            padding: '8px 16px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
            color: tab === val ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: -1, fontWeight: tab === val ? 600 : 400, transition: 'all 0.15s'
          }}>{label}</button>
        ))}
      </div>

      {selected && <CargoDetail cargo={selected} onClose={() => setSelected(null)} onUpdate={load} />}

      {loading ? (
        <div className="loading"><div className="spinner" />Yükleniyor...</div>
      ) : (
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{displayList.length} kayıt</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Takip No</th>
                  <th>Sipariş</th>
                  <th>Kargo Firması</th>
                  <th>Durum</th>
                  <th>Güncel Konum</th>
                  <th>Tahmini Teslimat</th>
                  <th>Son Güncelleme</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayList.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                    <td><span className="mono" style={{ color: 'var(--accent)', fontSize: 12 }}>{c.tracking_number}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{c.order_id}</td>
                    <td>{c.carrier}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span className={`badge ${CARGO_STATUS_CLASSES[c.status] || ''}`}>{CARGO_STATUS_LABELS[c.status] || c.status}</span>
                        {c.is_delayed && <span className="badge badge-critical" style={{ fontSize: 9 }}>⚠ GECİKMELİ</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                        <MapPin size={11} />{c.current_location || '—'}
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {c.estimated_delivery ? new Date(c.estimated_delivery).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(c.last_update).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
