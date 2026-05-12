import json
import re
from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from data.store import ORDERS, PRODUCTS, CARGO
from ai_client import (
    AIClientError,
    gemini_api_key as _gemini_api_key,
    ask_gemini_json,
    ask_gemini_text,
)

router = APIRouter()

# ── Yardımcılar ───────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


def _build_system_prompt() -> str:
    orders    = list(ORDERS.values())
    products  = list(PRODUCTS.values())
    delayed   = [c for c in CARGO.values()    if c.get("is_delayed")]
    low_stock = [p for p in products if p["stock_alert"] in ("low", "critical", "out_of_stock")]

    pending   = [o for o in orders if o["status"] == "pending"]
    shipped   = [o for o in orders if o["status"] == "shipped"]
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


def _parse_json_from_text(text: str) -> dict:
    """AI yanıtından JSON bloğunu güvenle çeker."""
    clean = re.sub(r"```json|```", "", text).strip()
    return json.loads(clean)


def _local_forecast_fallback(products: list[dict], reason: str) -> dict:
    forecasts = []
    for p in products[:5]:
        trend = p.get("trend_direction", "stable")
        daily_rate = p.get("daily_rate", 0)
        current_stock = p.get("current_stock", 0)
        next_week = max(1, round(daily_rate * 7))

        if current_stock <= next_week:
            urgency = "high"
            action = "Stok bu hafta yetmeyebilir; acil sipariş planlayın."
        elif trend == "up":
            urgency = "medium"
            action = "Talep artışı için ek stok hazırlığı yapın."
        else:
            urgency = "low"
            action = "Mevcut stok seviyesini izlemeye devam edin."

        forecasts.append({
            "product_name": p["product_name"],
            "next_week_estimate": f"~{next_week} adet",
            "trend_comment": f"Trend: {trend}, son 30 gün ortalaması {daily_rate}/gün.",
            "action": action,
            "urgency": urgency,
        })

    return {
        "forecasts": forecasts,
        "summary": f"Gemini çağrısı yapılamadı; yerel satış verisine göre tahmin üretildi. Sebep: {reason}",
        "ai_request_attempted": True,
        "ai_powered": False,
        "ai_unavailable": True,
        "source": "local_fallback",
    }


# ── Mevcut endpoint'ler ────────────────────────────────────────────────────────
@router.post("/chat")
async def chat(req: ChatRequest):
    key = _gemini_api_key()
    if not key:
        raise HTTPException(500, "GEMINI_API_KEY (veya GOOGLE_API_KEY) ayarlanmadı. .env dosyasına ekleyin.")
    system   = _build_system_prompt()
    content  = f"[Bağlam: {req.context}]\n\n{req.message}" if req.context else req.message

    try:
        text = await ask_gemini_text(system, content, max_tokens=1024)
    except AIClientError as exc:
        raise HTTPException(502, f"AI servisi hatası: {exc}") from exc

    return {"response": text}


@router.get("/insights")
def ai_insights():
    orders    = list(ORDERS.values())
    products  = list(PRODUCTS.values())
    delayed   = [c for c in CARGO.values() if c.get("is_delayed")]
    low_stock = [p for p in products if p["stock_alert"] in ("low", "critical", "out_of_stock")]
    out_of_stock = [p for p in products if p["stock_alert"] == "out_of_stock"]
    pending   = [o for o in orders if o["status"] == "pending"]

    insights = []

    if delayed:
        insights.append({
            "type":    "critical",
            "title":   f"{len(delayed)} Gecikmeli Kargo",
            "message": f"{', '.join(c['tracking_number'] for c in delayed[:2])} takip numaralı gönderiler gecikiyor.",
            "icon":    "🚨",
        })

    if out_of_stock:
        names = ", ".join(p["name"] for p in out_of_stock[:3])
        insights.append({
            "type":    "critical",
            "title":   "Stok Tükendi",
            "message": f"{names} — acil sipariş gerekli!",
            "icon":    "📦",
        })

    low_only = [p for p in low_stock if p["stock_alert"] != "out_of_stock"]
    if low_only:
        insights.append({
            "type":    "warning",
            "title":   f"{len(low_only)} Ürün Kritik Stok Seviyesinde",
            "message": f"{', '.join(p['name'] for p in low_only[:2])} ürünleri yakında tükenebilir.",
            "icon":    "⚠️",
        })

    if pending:
        insights.append({
            "type":    "info",
            "title":   f"{len(pending)} Sipariş İşlem Bekliyor",
            "message": "Bekleyen siparişler hazırlanmaya başlanabilir.",
            "icon":    "🕐",
        })

    revenue = sum(o["total_amount"] for o in orders if o["status"] != "cancelled")
    insights.append({
        "type":    "success",
        "title":   "Toplam Ciro",
        "message": f"₺{revenue:,.0f} toplam satış gerçekleşti.",
        "icon":    "📈",
    })

    return {"insights": insights}


def _local_sales_analytics() -> dict:
    orders   = list(ORDERS.values())
    products = {p["id"]: p for p in PRODUCTS.values()}
    now      = datetime.now()

    # product_id → hafta_no (0=bu hafta) → satış adedi
    weekly: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    for order in orders:
        if order["status"] == "cancelled":
            continue
        try:
            created = datetime.fromisoformat(order["created_at"])
        except ValueError:
            continue
        week_no = (now - created).days // 7
        if week_no > 3:
            continue
        for item in order.get("items", []):
            weekly[item["product_id"]][week_no] += item["quantity"]

    result = []
    for pid, w in weekly.items():
        p = products.get(pid)
        if not p:
            continue
        this_week  = w.get(0, 0)
        last_week  = w.get(1, 0)
        w2_ago     = w.get(2, 0)
        w3_ago     = w.get(3, 0)
        trend_pct  = round(((this_week - last_week) / last_week) * 100, 1) if last_week else 0

        result.append({
            "product_id":      pid,
            "product_name":    p["name"],
            "category":        p["category"],
            "weekly_sales":    {
                "this_week":   this_week,
                "last_week":   last_week,
                "2_weeks_ago": w2_ago,
                "3_weeks_ago": w3_ago,
            },
            "trend_pct":       trend_pct,
            "trend_direction": "up" if trend_pct > 5 else "down" if trend_pct < -5 else "stable",
            "current_stock":   p["stock_quantity"],
            "daily_rate":      round(p.get("sales_last_30_days", 0) / 30, 2),
        })

    result.sort(key=lambda x: abs(x["trend_pct"]), reverse=True)
    return {"period": "son_4_hafta", "products": result}


# ── YENİ 1: Sipariş Analitiği — Haftalık Satış Trendleri ──────────────────────
@router.get("/sales-analytics")
async def sales_analytics():
    """
    Ürün bazında son 4 haftalık satış trendlerini Gemini ile analiz ettirir.
    Gemini kullanılamazsa yerel ham trend verisini ai_unavailable bilgisiyle döner.
    """
    local_result = _local_sales_analytics()
    result = local_result["products"]

    prompt = f"""Aşağıdaki ürün, stok ve sipariş verilerini analiz et.
Hangi ürünlerin hangi dönemlerde daha çok sattığını yorumla ve önümüzdeki hafta için işletme sahibine net öneriler üret.

Ürün satış trend verisi:
{json.dumps(result, ensure_ascii=False)}

Son siparişler:
{json.dumps(list(ORDERS.values()), ensure_ascii=False)}

Yanıtı SADECE şu JSON formatında ver:
{{
  "period": "son_4_hafta",
  "summary": "Kısa işletme özeti",
  "products": [
    {{
      "product_id": "PRD-001",
      "product_name": "Ürün adı",
      "trend_pct": 40,
      "trend_direction": "up | down | stable",
      "next_week_estimate": "~45 adet",
      "recommendation": "Önümüzdeki hafta bu ürüne talep %40 artabilir, hazırlıklı olun.",
      "confidence": "high | medium | low"
    }}
  ]
}}"""

    try:
        ai_result = await ask_gemini_json(
            "Sen KOBİ'ler için çalışan bir sipariş analitiği yapay zekasısın. Türkçe ve geçerli JSON döndür.",
            prompt,
        )
        ai_result.setdefault("period", "son_4_hafta")
        ai_result["ai_request_attempted"] = True
        ai_result["ai_powered"] = True
        ai_result["source"] = "gemini"
        return ai_result
    except AIClientError as exc:
        return {
            "period": "son_4_hafta",
            "products": result,
            "summary": f"Gemini sipariş analitiği alınamadı; yerel trend verisi gösteriliyor. Sebep: {exc}",
            "ai_request_attempted": True,
            "ai_powered": False,
            "ai_unavailable": True,
            "source": "local_fallback",
        }


# ── YENİ 2: Talep Tahmini (AI destekli) ───────────────────────────────────────
@router.get("/forecast")
async def demand_forecast():
    """
    Haftalık satış trendlerini Gemini'ye gönderir; ürün bazında:
    - Önümüzdeki hafta tahmini
    - Önerilen aksiyon
    - Aciliyet seviyesi
    döner.
    """
    analytics = _local_sales_analytics()
    products  = analytics["products"]

    if not products:
        return {
            "forecasts": [],
            "summary":   "Henüz yeterli satış verisi yok. Siparişler işlendikçe tahmin oluşturulacak.",
        }

    # Gemini'ye gönderilecek özet tablo
    rows = "\n".join(
        f"- {p['product_name']} | Bu hafta: {p['weekly_sales']['this_week']} | "
        f"Geçen hafta: {p['weekly_sales']['last_week']} | "
        f"Trend: %{p['trend_pct']:+.1f} | Stok: {p['current_stock']} {p.get('unit', 'adet')}"
        for p in products[:12]          # en fazla 12 ürün → token tasarrufu
    )

    prompt = f"""Aşağıdaki haftalık satış trend tablosunu analiz et ve her ürün için talep tahmini yap:

{rows}

Yanıtını SADECE aşağıdaki JSON formatında ver — başka hiçbir metin ekleme:
{{
  "forecasts": [
    {{
      "product_name": "Ürün adı",
      "next_week_estimate": "örn. ~45 adet",
      "trend_comment": "Kısa trend açıklaması",
      "action": "Yapılması gereken aksiyon",
      "urgency": "high | medium | low"
    }}
  ],
  "summary": "2-3 cümle genel operasyon özeti"
}}"""

    try:
        ai_result = await ask_gemini_json(
            "Sen bir KOBİ satış analisti yapay zekasısın. Türkçe, kısa ve net yanıt ver. Her zaman geçerli JSON döndür.",
            prompt,
            max_tokens=1024,
        )
    except AIClientError as exc:
        ai_result = _local_forecast_fallback(products, str(exc))
        return {
            "generated_at":    datetime.now().isoformat(timespec="seconds"),
            "products_analyzed": len(products),
            **ai_result,
        }

    return {
        "generated_at":    datetime.now().isoformat(timespec="seconds"),
        "products_analyzed": len(products),
        "ai_request_attempted": True,
        "ai_powered": True,
        "source": "gemini",
        **ai_result,
    }
