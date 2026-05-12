import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from data.store import ORDERS, PRODUCTS, CARGO

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
async def chat_endpoint(req: ChatRequest):
    system = _build_system_prompt()
    content = f"[Bağlam: {req.context}]\n\n{req.message}" if req.context else req.message

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": content}
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
        
        if resp.status_code != 200:
            raise HTTPException(resp.status_code, f"Groq API Hatası: {resp.text}")

        data = resp.json()
        answer = data["choices"][0]["message"]["content"]
        return {"response": answer}
    except Exception as exc:
        raise HTTPException(502, f"Chat servisi hatası: {exc}")