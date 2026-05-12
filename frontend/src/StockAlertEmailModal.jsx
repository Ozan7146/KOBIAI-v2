import React, { useState, useEffect } from 'react'
import { Mail, X, Send, AlertTriangle, RefreshCw, Check } from 'lucide-react'

const ALERT_LABELS = { ok: 'Normal', low: 'Düşük', critical: 'Kritik', out_of_stock: 'Tükendi' }
const ALERT_COLORS = { low: 'var(--yellow)', critical: 'var(--red)', out_of_stock: 'var(--red)' }

async function fetchEmailDraft(productId) {
    const res = await fetch(`/api/inventory/restock-email-draft/${productId}`)
    if (!res.ok) throw new Error('Taslak oluşturulamadı')
    return res.json()
}

/** Örnek: Gemini tabanlı /api/ai/chat ile metin üretimi (şu an akışta kullanılmıyor). */
async function sendViaGeminiChat(draft, senderEmail) {
    const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: `Aşağıdaki tedarikçi mail taslağını gözden geçir ve kısa bir özet / iyileştirme önerisi ver (maili sen gönderemezsin; kullanıcı mailto ile gönderecek).
Kimden: ${senderEmail}
Konu: ${draft.subject}
İçerik: ${draft.body}`,
        })
    })
    if (!response.ok) throw new Error(`API hatası: ${response.status}`)
    const data = await response.json()
    return data.response || ''
}

export default function StockAlertEmailModal({ product, onClose }) {
    const [step, setStep] = useState('loading')
    const [draft, setDraft] = useState(null)
    const [senderEmail, setSenderEmail] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [error, setError] = useState('')
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState('')

    useEffect(() => {
        fetchEmailDraft(product.product_id || product.id)
            .then(d => {
                setDraft(d)
                setSubject(d.subject)
                setBody(d.body)
                setStep('compose')
            })
            .catch(e => { setError(e.message); setStep('error') })
    }, [product.id])


    const [supplierEmail, setSupplierEmail] = useState('')

   
    const handleSend = () => {
        if (!supplierEmail.trim()) { setError('Lütfen tedarikçi e-posta adresini girin.'); return }
        if (!senderEmail.trim()) { setError('Lütfen gönderici e-posta adresinizi girin.'); return }
        setError('')

        const mailtoLink = `mailto:${supplierEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoLink, '_blank')
        setStep('success')
    }

    const alertColor = ALERT_COLORS[product.stock_alert] || 'var(--yellow)'

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="card" style={{ width: 620, maxHeight: '92vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>

                {/* Header */}
                <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${alertColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={18} style={{ color: alertColor }} />
                        </div>
                        <div>
                            <div className="card-title">Tedarikçiye Stok Uyarısı Maili</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{product.name}</div>
                        </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
                </div>

                {/* Ürün özeti */}
                <div style={{
                    background: 'var(--bg)', border: `1px solid ${alertColor}40`,
                    borderLeft: `3px solid ${alertColor}`, borderRadius: 8,
                    padding: '10px 14px', marginBottom: 16,
                    display: 'flex', gap: 20, fontSize: 12, flexWrap: 'wrap'
                }}>
                    <span>Tedarikçi: <strong>{product.supplier || '—'}</strong></span>
                    <span>Mevcut Stok: <strong style={{ color: alertColor }}>{product.current_stock} {product.unit}</strong></span>
                    <span>Min. Eşik: <strong>{product.min_threshold} {product.unit}</strong></span>
                    <span>Durum: <strong style={{ color: alertColor }}>{ALERT_LABELS[product.alert_level]}</strong></span>
                </div>

                {/* Loading */}
                {step === 'loading' && (
                    <div className="loading" style={{ padding: '40px 0' }}>
                        <div className="spinner" />
                        Taslak oluşturuluyor...
                    </div>
                )}

                {/* Error */}
                {step === 'error' && (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--red)' }}>
                        <AlertTriangle size={32} style={{ marginBottom: 8 }} />
                        <div>{error}</div>
                        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={onClose}>Kapat</button>
                    </div>
                )}

                {/* Success */}
                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Check size={28} style={{ color: 'var(--green)' }} />
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Mail Gönderildi!</div>
                        {result && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.6 }}>
                                {result}
                            </div>
                        )}
                        <button className="btn btn-primary" onClick={onClose}>Kapat</button>
                    </div>
                )}

                {/* Compose */}
                {step === 'compose' && draft && (
                    <>
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                                TEDARİKÇİ E-POSTA (ALICI)
                            </label>
                            <input
                                className="input"
                                type="email"
                                placeholder="tedarikci@firma.com"
                                value={supplierEmail}
                                onChange={e => setSupplierEmail(e.target.value)}
                            />
                        </div>




                        {/* Gönderici */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                                GÖNDERİCİ E-POSTA (SİZİN ADRESİNİZ)
                            </label>
                            <input
                                className="input"
                                type="email"
                                placeholder="ornek@sirket.com"
                                value={senderEmail}
                                onChange={e => setSenderEmail(e.target.value)}
                            />
                        </div>

                        {/* Konu */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>
                                KONU
                            </label>
                            <input
                                className="input"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                            />
                        </div>

                        {/* İçerik */}
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <label style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                                    MAİL İÇERİĞİ (DÜZENLEYEBİLİRSİNİZ)
                                </label>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: 11 }}
                                    onClick={() => { setSubject(draft.subject); setBody(draft.body) }}
                                >
                                    <RefreshCw size={11} /> Sıfırla
                                </button>
                            </div>
                            <textarea
                                className="input"
                                rows={12}
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                style={{ resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6 }}
                            />
                        </div>

                        {error && (
                            <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={13} /> {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={onClose} disabled={sending}>İptal</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSend}
                                disabled={sending}
                                style={{ minWidth: 120 }}
                            >
                                {sending ? (
                                    <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />Gönderiliyor...</>
                                ) : (
                                    <><Send size={14} />Gmail ile Gönder</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
