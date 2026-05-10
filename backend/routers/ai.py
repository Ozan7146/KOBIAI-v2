from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from data.store import ORDERS, PRODUCTS, CARGO
import httpx

router = APIRouter()

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"


class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


def _build_system_prompt() -> str:
    orders = list(ORDERS.values())
    products = list(PRODUCTS.values())
    delayed = [c for c in CARGO.values() if c.get("is_delayed")]
    low_stock = [p for p in products if p["stock_alert"] in ("low", "critical", "out_of_stock")]

    pending = [o for o in orders if o["status"] == "pending"]
    shipped = [o for o in orders if o["status"] == "shipped"]
    delivered = [o for o in orders if o["status"] == "delivered"]

    orders_text = "\n".join(
        f"- {o['id']}: {o['customer_name']}, ₺{o['total_amount']}, {o['status']}"
        + (f", Kargo: {o['cargo_tracking_number']}" if o.get("cargo_tracking_number") else "")
        for o in orders
    )
    low_stock_text = "\n".join(
        f"- {p['name']}: {p['stock_quantity']}/{p['min_stock_threshold']} {p['unit']} [{p['stock_alert']}]"
        for p in low_stock
    ) or "Kritik stok yok"

    delayed_text = "\n".join(
        f"- {c['tracking_number']} ({c['carrier']}): {c.get('delay_reason', 'Bilinmiyor')}"
        for c in delayed
    ) or "Gecikmeli kargo yok"

    return f"""Sen KOBİ AI'ın yapay zeka asistanısın. Küçük ve orta ölçekli bir KOBİ'nin sipariş, stok ve kargo operasyonlarını yönetmesine yardım ediyorsun.
Türkçe yanıt ver. Kısa, net ve yardımcı ol. Emojiler kullanabilirsin.

=== GÜNCEL VERİLER ===

📦 SİPARİŞLER ({len(orders)} toplam):
{orders_text}

Beklemede: {len(pending)} | Kargoda: {len(shipped)} | Teslim: {len(delivered)}

⚠️ KRİTİK STOK ({len(low_stock)} ürün):
{low_stock_text}

🚚 GECİKMELİ KARGO ({len(delayed)} adet):
{delayed_text}

=== GÖREVLERİN ===
- Sipariş durumu, kargo takibi, stok bilgisi ver
- Gecikmeli kargolar için müşteri bildirimi metni hazırla
- Kritik stoklar için tedarikçiye sipariş maili yaz
- Günlük operasyon özeti sun
- "Ne yapmalıyım bugün?" gibi sorulara aksiyon listesi ver
"""


@router.post("/chat")
async def chat(req: ChatRequest):
    system = _build_system_prompt()
    messages = [{"role": "user", "content": req.message}]
    if req.context:
        messages[0]["content"] = f"[Bağlam: {req.context}]\n\n{req.message}"

    headers = {"Content-Type": "application/json", "anthropic-version": "2023-06-01"}
    payload = {"model": MODEL, "max_tokens": 1024, "system": system, "messages": messages}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(ANTHROPIC_URL, headers=headers, json=payload)

    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"AI servisi hatası: {resp.text}")

    data = resp.json()
    return {"response": data["content"][0]["text"]}


@router.get("/insights")
def ai_insights():
    """Otomatik AI içgörüleri — sabit + dinamik veri kombinasyonu."""
    orders = list(ORDERS.values())
    products = list(PRODUCTS.values())
    delayed = [c for c in CARGO.values() if c.get("is_delayed")]
    low_stock = [p for p in products if p["stock_alert"] in ("low", "critical", "out_of_stock")]
    out_of_stock = [p for p in products if p["stock_alert"] == "out_of_stock"]
    pending = [o for o in orders if o["status"] == "pending"]

    insights = []

    if delayed:
        insights.append({
            "type": "critical",
            "title": f"{len(delayed)} Gecikmeli Kargo",
            "message": f"{', '.join(c['tracking_number'] for c in delayed[:2])} takip numaralı gönderiler gecikiyor. Müşteriler bilgilendirilmeli.",
            "icon": "🚨",
        })

    if out_of_stock:
        names = ", ".join(p["name"] for p in out_of_stock[:3])
        insights.append({
            "type": "critical",
            "title": "Stok Tükendi",
            "message": f"{names} — acil sipariş gerekli!",
            "icon": "📦",
        })

    if len(low_stock) > len(out_of_stock):
        low_only = [p for p in low_stock if p["stock_alert"] != "out_of_stock"]
        if low_only:
            insights.append({
                "type": "warning",
                "title": f"{len(low_only)} Ürün Kritik Stok Seviyesinde",
                "message": f"{', '.join(p['name'] for p in low_only[:2])} ürünleri yakında tükenebilir.",
                "icon": "⚠️",
            })

    if pending:
        insights.append({
            "type": "info",
            "title": f"{len(pending)} Sipariş İşlem Bekliyor",
            "message": "Bekleyen siparişler hazırlanmaya başlanabilir.",
            "icon": "🕐",
        })

    revenue = sum(o["total_amount"] for o in orders if o["status"] != "cancelled")
    insights.append({
        "type": "success",
        "title": "Toplam Ciro",
        "message": f"₺{revenue:,.0f} toplam satış gerçekleşti.",
        "icon": "📈",
    })

    return {"insights": insights}
