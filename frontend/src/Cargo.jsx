import React, { useEffect, useState } from "react";
import {
    AlertTriangle, RefreshCw, MapPin, Clock,
    ChevronDown, X, Mail, Send, Check,
} from "lucide-react";
import { getAllCargo, getDelayedShipments, updateCargoStatus } from "./client.js";
import { createPortal } from "react-dom";


const CARGO_STATUS_LABELS = {
    not_shipped: "Kargoya Verilmedi",
    picked_up: "Kargo Alındı",
    in_transit: "Yolda",
    out_for_delivery: "Dağıtımda",
    delivered: "Teslim Edildi",
    delayed: "Gecikmeli",
    returned: "İade",
};

const CARGO_STATUS_CLASSES = {
    not_shipped: "badge-pending",
    picked_up: "badge-confirmed",
    in_transit: "badge-shipped",
    out_for_delivery: "badge-preparing",
    delivered: "badge-delivered",
    delayed: "badge-critical",
    returned: "badge-cancelled",
};

// ── Gecikme Mail Modalı ──────────────────────────────────────
export function DelayEmailModal({ cargo, onClose }) {
    const [step, setStep] = useState("loading");
    const [draft, setDraft] = useState(null);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [senderEmail, setSenderEmail] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    useEffect(() => {
        fetch(`/api/cargo/delay-email-draft/${cargo.tracking_number}`)
            .then((r) => {
                if (!r.ok) throw new Error("Taslak oluşturulamadı");
                return r.json();
            })
            .then((d) => {
                setDraft(d);
                setSubject(d.subject);
                setBody(d.body);
                setStep("compose");
            })
            .catch((e) => {
                setError(e.message);
                setStep("error");
            });
    }, [cargo]);

    const handleSend = () => {
        if (!senderEmail.trim()) {
            setError("Gönderici e-posta girin");
            return;
        }

        const link = `mailto:${draft.customer_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.open(link, "_blank");
        setStep("success");
    };

    return createPortal(
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "720px",
                    maxWidth: "95vw",
                    maxHeight: "92vh",
                    overflow: "hidden",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "24px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                    display: "flex",
                    flexDirection: "column",
                    animation: "fadeIn 0.25s ease",
                }}
            >
                {/* HEADER */}
                <div
                    style={{
                        padding: "24px 28px",
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
                                fontSize: "22px",
                                fontWeight: "800",
                                color: "var(--accent)",
                                margin: 0,
                                marginBottom: "6px",
                            }}
                        >
                            Gecikme Bildirimi
                        </h2>

                        <div
                            style={{
                                fontSize: "13px",
                                color: "var(--text-muted)",
                            }}
                        >
                            {cargo.tracking_number} · {cargo.carrier}
                        </div>
                    </div>

                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={onClose}
                        style={{
                            padding: "10px",
                            borderRadius: "50%",
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* LOADING */}
                {step === "loading" && (
                    <div
                        className="loading"
                        style={{
                            padding: "60px 0",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                        }}
                    >
                        <div className="spinner" />
                        Taslak hazırlanıyor...
                    </div>
                )}

                {/* ERROR */}
                {step === "error" && (
                    <div
                        style={{
                            color: "var(--red)",
                            textAlign: "center",
                            padding: "40px",
                        }}
                    >
                        <AlertTriangle size={34} />
                        <div style={{ marginTop: "12px" }}>{error}</div>
                    </div>
                )}

                {/* SUCCESS */}
                {step === "success" && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "50px 30px",
                        }}
                    >
                        <Check
                            size={46}
                            style={{ color: "var(--green)" }}
                        />

                        <div
                            style={{
                                marginTop: "16px",
                                fontWeight: "700",
                                fontSize: "18px",
                            }}
                        >
                            Mail hazırlandı
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{
                                marginTop: "24px",
                                height: "46px",
                                padding: "0 22px",
                            }}
                            onClick={onClose}
                        >
                            Kapat
                        </button>
                    </div>
                )}

                {/* COMPOSE */}
                {step === "compose" && draft && (
                    <>
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "28px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "18px",
                            }}
                        >
                            {/* INFO CARD */}
                            <div
                                style={{
                                    background: "var(--bg)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "16px",
                                    padding: "18px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: "700",
                                        fontSize: "15px",
                                    }}
                                >
                                    {draft.customer_name}
                                </div>

                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {draft.customer_email}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontSize: "13px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        Sipariş:
                                    </span>

                                    <span className="mono">
                                        #{draft.order_id}
                                    </span>
                                </div>
                            </div>

                            {/* INPUTS */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "14px",
                                }}
                            >
                                <input
                                    className="input"
                                    placeholder="Gönderici e-posta"
                                    value={senderEmail}
                                    onChange={(e) =>
                                        setSenderEmail(e.target.value)
                                    }
                                    style={{
                                        height: "52px",
                                        fontSize: "14px",
                                    }}
                                />

                                <input
                                    className="input"
                                    value={draft.customer_email}
                                    disabled
                                    style={{
                                        opacity: 0.7,
                                        height: "52px",
                                    }}
                                />

                                <input
                                    className="input"
                                    value={subject}
                                    onChange={(e) =>
                                        setSubject(e.target.value)
                                    }
                                    style={{
                                        height: "52px",
                                        fontSize: "14px",
                                    }}
                                />

                                <textarea
                                    className="input"
                                    rows={12}
                                    value={body}
                                    onChange={(e) =>
                                        setBody(e.target.value)
                                    }
                                    style={{
                                        resize: "vertical",
                                        fontSize: "13px",
                                        lineHeight: 1.6,
                                        minHeight: "320px",
                                        paddingTop: "16px",
                                    }}
                                />
                            </div>

                            {error && (
                                <div
                                    style={{
                                        color: "var(--red)",
                                        fontSize: "13px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <AlertTriangle size={14} />
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* FOOTER */}
                        <div
                            style={{
                                padding: "24px 28px",
                                borderTop: "1px solid var(--border)",
                                background: "rgba(255,255,255,0.02)",
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                            }}
                        >
                            <button
                                className="btn btn-ghost"
                                onClick={onClose}
                                style={{
                                    height: "46px",
                                    padding: "0 18px",
                                }}
                            >
                                İptal
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={handleSend}
                                style={{
                                    height: "46px",
                                    padding: "0 22px",
                                }}
                            >
                                <Send size={16} />
                                Müşteriyi Bilgilendir
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>,
        document.body
    );
}




// ── Kargo Detay Paneli ───────────────────────────────────────
function CargoDetail({ cargo, onClose, onUpdate, isMobile, onEmailClick }) {
    const [newStatus, setNewStatus] = useState(cargo.status);
    const [location, setLocation] = useState(cargo.current_location || "");
    const [isDelayed, setIsDelayed] = useState(cargo.is_delayed);
    const [delayReason, setDelayReason] = useState(cargo.delay_reason || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateCargoStatus(cargo.tracking_number, newStatus, location, isDelayed, delayReason || undefined);
            onUpdate();
            onClose();
        } catch (e) {
            alert("Hata: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 2500, display: "flex", justifyContent: "flex-end", pointerEvents: "auto" }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", animation: "fadeIn 0.3s ease" }} />
            <div style={{ position: "relative", width: isMobile ? "100%" : "440px", height: "100%", background: "var(--bg-card)", borderLeft: "1px solid var(--border)", boxShadow: "-10px 0 30px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", animation: "slideInRight 0.3s cubic-bezier(0.25,0.8,0.25,1)" }}>

                <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
                    <div>
                        <div className="card-title text-accent" style={{ fontSize: "18px", margin: 0 }}>{cargo.tracking_number}</div>
                        <div className="text-muted mono" style={{ fontSize: "12px", marginTop: "4px" }}>{cargo.carrier} · Sipariş: {cargo.order_id}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "8px", borderRadius: "50%" }}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                    {cargo.is_delayed && (
                        <div className="alert alert-error" style={{ marginBottom: "24px" }}>
                            <AlertTriangle size={18} />
                            <div>
                                <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Gecikme Tespit Edildi</strong>
                                {cargo.delay_reason && <div style={{ fontSize: "12px" }}>Sebep: {cargo.delay_reason}</div>}
                            </div>
                            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", color: "var(--red)", border: "1px solid rgba(248,113,113,0.3)", whiteSpace: "nowrap" }} onClick={() => onEmailClick(cargo)}>
                                <Mail size={13} /> Müşteriyi Bilgilendir
                            </button>
                        </div>
                    )}

                    <div style={{ marginBottom: "24px", padding: "20px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <div className="nav-section-label" style={{ padding: 0, marginBottom: "16px", fontSize: "11px" }}>KARGO HAREKETLERİ</div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {[...(cargo.events || [])].reverse().map((ev, i, arr) => (
                                <div key={i} style={{ display: "flex", gap: "16px", paddingBottom: i !== arr.length - 1 ? "20px" : "0", position: "relative" }}>
                                    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: i === 0 ? "var(--accent)" : "var(--border-light)", zIndex: 2, marginTop: "4px" }} />
                                        {i !== arr.length - 1 && <div style={{ position: "absolute", top: "14px", bottom: "-20px", width: "2px", background: "var(--border)" }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: "700", color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)", marginBottom: "4px" }}>{ev.status}</div>
                                        {ev.location && <div className="text-muted" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}><MapPin size={12} /> {ev.location}</div>}
                                        <div className="text-muted mono" style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}><Clock size={12} />{ev.time ? new Date(ev.time).toLocaleString("tr-TR") : ""}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                        <div>
                            <label className="nav-section-label" style={{ padding: 0, marginBottom: "8px", display: "block" }}>YENİ DURUM</label>
                            <select className="input" style={{ width: "100%", height: "44px" }} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                {Object.entries(CARGO_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="nav-section-label" style={{ padding: 0, marginBottom: "8px", display: "block" }}>GÜNCEL KONUM</label>
                            <input className="input" style={{ width: "100%", height: "44px" }} value={location} onChange={e => setLocation(e.target.value)} placeholder="Örn: İstanbul Dağıtım Merkezi" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                            <input type="checkbox" id="delayed-checkbox" checked={isDelayed} onChange={e => setIsDelayed(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                            <label htmlFor="delayed-checkbox" style={{ fontSize: "14px", fontWeight: "600", cursor: "pointer", color: isDelayed ? "var(--red)" : "var(--text-primary)" }}>Bu kargoda gecikme var</label>
                        </div>
                        {isDelayed && (
                            <div>
                                <label className="nav-section-label" style={{ padding: 0, marginBottom: "8px", display: "block", color: "var(--red)" }}>GECİKME SEBEBİ</label>
                                <input className="input" style={{ width: "100%", height: "44px" }} value={delayReason} onChange={e => setDelayReason(e.target.value)} placeholder="Gecikme nedeni..." />
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: "24px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
                    <button className="btn btn-ghost" style={{ flex: 1, height: "44px", justifyContent: "center" }} onClick={onClose} disabled={saving}>İptal</button>
                    <button className="btn btn-primary" style={{ flex: 2, height: "44px", justifyContent: "center" }} onClick={handleSave} disabled={saving}>
                        {saving ? <div className="spinner" style={{ width: "18px", height: "18px" }} /> : "Güncelle"}
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

// ── Ana Sayfa ────────────────────────────────────────────────
export default function Cargo() {
    const [cargoList, setCargoList] = useState([]);
    const [delayedList, setDelayedList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCargo, setSelectedCargo] = useState(null);
    const [emailCargo, setEmailCargo] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        loadData();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const loadData = () => {
        setLoading(true);
        Promise.all([getAllCargo(), getDelayedShipments()])
            .then(([all, delayed]) => { setCargoList(all); setDelayedList(delayed); })
            .finally(() => setLoading(false));
    };

    const displayList = activeTab === "delayed" ? delayedList : cargoList;

    return (
        <div className="main-content fade-in" style={{ padding: isMobile ? "16px" : "32px", paddingBottom: isMobile ? "100px" : "32px" }}>
            <div className="page-header" style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 className="page-title">Kargo ve Lojistik</h1>
                        <p className="page-subtitle text-muted">Anlık kargo takibi ve durum güncellemeleri</p>
                    </div>
                    <button className="btn btn-ghost" onClick={loadData} style={{ padding: "10px" }}><RefreshCw size={18} /></button>
                </div>
            </div>

            <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--border)", marginBottom: "32px", overflowX: "auto" }}>
                {[["all", `Tüm Kargolar (${cargoList.length})`, false], ["delayed", `Gecikmeliler (${delayedList.length})`, true]].map(([tab, label, isRed]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: "none", border: "none", padding: "0 4px 16px 4px", cursor: "pointer", fontSize: "14px", fontWeight: activeTab === tab ? "600" : "500", color: activeTab === tab ? (isRed ? "var(--red)" : "var(--accent)") : "var(--text-secondary)", borderBottom: activeTab === tab ? `2px solid ${isRed ? "var(--red)" : "var(--accent)"}` : "2px solid transparent", whiteSpace: "nowrap", transition: "all 0.2s" }}>
                        {label}
                    </button>
                ))}
            </div>

            {emailCargo && <DelayEmailModal cargo={emailCargo} onClose={() => setEmailCargo(null)} />}

            {selectedCargo && (
                <CargoDetail
                    cargo={selectedCargo}
                    onClose={() => setSelectedCargo(null)}
                    onUpdate={loadData}
                    isMobile={isMobile}
                    onEmailClick={(c) => { setSelectedCargo(null); setEmailCargo(c); }}
                />
            )}

            {loading ? (
                <div className="loading" style={{ height: "300px" }}><div className="spinner" /></div>
            ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                    {isMobile ? (
                        displayList.map((c) => (
                            <div key={c.id} className="card" style={{ padding: "20px", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                                    <span className="mono text-accent" style={{ fontSize: "14px", fontWeight: "700" }}>{c.tracking_number}</span>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <span className={`badge ${CARGO_STATUS_CLASSES[c.status]}`} style={{ fontSize: "10px", padding: "4px 8px" }}>{CARGO_STATUS_LABELS[c.status]}</span>
                                        {c.is_delayed && <span className="badge badge-critical" style={{ fontSize: "10px", padding: "4px 8px" }}>⚠</span>}
                                    </div>
                                </div>
                                <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "12px" }}>{c.carrier} · <span className="text-muted mono">{c.order_id}</span></div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                                    <MapPin size={14} /> {c.current_location || "Konum Belirtilmedi"}
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setSelectedCargo(c)}>Detay</button>
                                    {c.is_delayed && (
                                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, color: "var(--red)", border: "1px solid rgba(248,113,113,0.3)" }} onClick={() => setEmailCargo(c)}>
                                            <Mail size={13} /> Bilgilendir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ padding: 0 }}>
                            <div className="table-wrap">
                                <table style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ paddingLeft: "24px" }}>Takip No</th>
                                            <th>Sipariş</th>
                                            <th>Firma</th>
                                            <th>Durum</th>
                                            <th>Güncel Konum</th>
                                            <th>Son Güncelleme</th>
                                            <th style={{ paddingRight: "24px" }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayList.map((c) => (
                                            <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelectedCargo(c)}>
                                                <td style={{ paddingLeft: "24px" }}>
                                                    <span className="badge" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--accent)", fontWeight: "600" }}>{c.tracking_number}</span>
                                                </td>
                                                <td className="mono text-muted">{c.order_id}</td>
                                                <td style={{ fontWeight: "600" }}>{c.carrier}</td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                                        <span className={`badge ${CARGO_STATUS_CLASSES[c.status]}`} style={{ padding: "4px 10px" }}>{CARGO_STATUS_LABELS[c.status]}</span>
                                                        {c.is_delayed && <span className="badge badge-critical" style={{ fontSize: "10px", padding: "2px 6px" }}>⚠ GECİKME</span>}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{c.current_location || "—"}</td>
                                                <td className="mono text-muted" style={{ fontSize: "12px" }}>{new Date(c.last_update).toLocaleDateString("tr-TR")}</td>
                                                <td style={{ paddingRight: "24px" }} onClick={e => e.stopPropagation()}>
                                                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                                        {c.is_delayed && (
                                                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", padding: "6px 10px" }} onClick={() => setEmailCargo(c)} title="Müşteriyi bilgilendir">
                                                                <Mail size={14} />
                                                            </button>
                                                        )}
                                                        <ChevronDown size={16} className="text-muted" style={{ transform: "rotate(-90deg)", marginTop: 4 }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {displayList.length === 0 && (
                        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
                            Aradığınız kriterlere uygun kargo kaydı bulunamadı.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}