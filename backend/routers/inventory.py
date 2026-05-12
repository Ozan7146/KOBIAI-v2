import json

from fastapi import APIRouter, HTTPException
from data.store import PRODUCTS
from ai_client import AIClientError, ask_gemini_json

router = APIRouter()

ALERT_ORDER = {"out_of_stock": 0, "critical": 1, "low": 2, "ok": 3}


def _suggested_qty(p: dict) -> int:
    base = max(p["min_stock_threshold"] * 3, 50)
    return max(base - p["stock_quantity"], p["min_stock_threshold"])


def _compute_alert(p: dict) -> str:
    q = p["stock_quantity"]
    t = p["min_stock_threshold"]
    if q == 0:        return "out_of_stock"
    elif q < t:       return "critical"
    elif q < t * 1.5: return "low"
    return "ok"


@router.get("/alerts")
def inventory_alerts():
    alerts = []
    for p in PRODUCTS.values():
        alert = _compute_alert(p)
        if alert != "ok":
            alerts.append({
                "product_id":            p["id"],
                "product_name":          p["name"],
                "category":              p["category"],
                "supplier":              p.get("supplier", ""),
                "current_stock":         p["stock_quantity"],
                "min_threshold":         p["min_stock_threshold"],
                "unit":                  p.get("unit", "adet"),
                "alert_level":           alert,
                "suggested_reorder_qty": _suggested_qty(p),
            })
    return sorted(alerts, key=lambda a: ALERT_ORDER.get(a["alert_level"], 9))


@router.get("/summary")
def inventory_summary():
    products = list(PRODUCTS.values())
    alert_counts = {"ok": 0, "low": 0, "critical": 0, "out_of_stock": 0}
    total_value = 0.0
    for p in products:
        lvl = _compute_alert(p)
        alert_counts[lvl] = alert_counts.get(lvl, 0) + 1
        total_value += p["price"] * p["stock_quantity"]
    return {
        "total_products":        len(products),
        "ok":                    alert_counts["ok"],
        "low_stock":             alert_counts["low"],
        "critical_stock":        alert_counts["critical"],
        "out_of_stock":          alert_counts["out_of_stock"],
        "total_inventory_value": round(total_value, 2),
    }


@router.get("/top-selling")
def top_selling(limit: int = 5):
    products = list(PRODUCTS.values())
    return sorted(products, key=lambda p: p.get("sales_last_30_days", 0), reverse=True)[:limit]


@router.post("/restock/{product_id}")
def restock(product_id: str, quantity: int):
    p = PRODUCTS.get(product_id)
    if not p:
        raise HTTPException(404, f"Ürün bulunamadı: {product_id}")
    if quantity <= 0:
        raise HTTPException(400, "Miktar pozitif olmalı")
    p["stock_quantity"] += quantity
    p["stock_alert"] = _compute_alert(p)
    return {"message": f"{p['name']} için {quantity} {p['unit']} stok eklendi", "product": p}


@router.get("/restock-email-draft/{product_id}")
def get_restock_email_draft(product_id: str):
    p = PRODUCTS.get(product_id)
    if not p:
        raise HTTPException(404, f"Ürün bulunamadı: {product_id}")

    alert = _compute_alert(p)
    if alert == "ok":
        raise HTTPException(400, "Bu ürünün stok seviyesi normal, mail gerekmez.")

    supplier = p.get("supplier", "Tedarikçi")
    suggested = _suggested_qty(p)

    if alert == "out_of_stock":
        subject = f"[ACİL] {p['name']} Stok Tükendi - Acil Sipariş Talebi"
        body = f"""Sayın {supplier} Yetkilileri,

{p['name']} ürününün stoğumuz tamamen tükenmiş bulunmaktadır. Müşteri siparişlerini karşılayabilmek için en kısa sürede {suggested} {p.get('unit', 'adet')} sipariş vermek istiyoruz.

Ürün Bilgileri:
- Ürün Adı: {p['name']}
- Kategori: {p['category']}
- Mevcut Stok: 0 {p.get('unit', 'adet')}
- Talep Miktarı: {suggested} {p.get('unit', 'adet')}
- Birim Fiyat: ₺{p['price']}

Lütfen en kısa sürede stok durumunuzu ve teslimat tarihinizi bildiriniz.

Saygılarımızla"""

    elif alert == "critical":
        subject = f"[KRİTİK] {p['name']} Stok Kritik Seviyede - Sipariş Talebi"
        body = f"""Sayın {supplier} Yetkilileri,

{p['name']} ürününün stok miktarı kritik seviyeye düşmüştür ({p['stock_quantity']} {p.get('unit', 'adet')} kalmıştır). Minimum stok eşiğimiz {p['min_stock_threshold']} {p.get('unit', 'adet')} olup bu seviyenin altına düşmüş bulunmaktayız.

Ürün Bilgileri:
- Ürün Adı: {p['name']}
- Kategori: {p['category']}
- Mevcut Stok: {p['stock_quantity']} {p.get('unit', 'adet')}
- Minimum Eşik: {p['min_stock_threshold']} {p.get('unit', 'adet')}
- Talep Miktarı: {suggested} {p.get('unit', 'adet')}
- Birim Fiyat: ₺{p['price']}

Lütfen en kısa sürede sipariş onayı ve teslimat tarihi hakkında bilgi veriniz.

Saygılarımızla"""

    else:
        subject = f"[BİLGİ] {p['name']} Stok Azalma Bildirimi"
        body = f"""Sayın {supplier} Yetkilileri,

{p['name']} ürününün stok seviyesi düşmeye başlamıştır. Stok takibimiz kapsamında sizi önceden bilgilendirmek istedik.

Ürün Bilgileri:
- Ürün Adı: {p['name']}
- Kategori: {p['category']}
- Mevcut Stok: {p['stock_quantity']} {p.get('unit', 'adet')}
- Minimum Eşik: {p['min_stock_threshold']} {p.get('unit', 'adet')}
- Önerilen Sipariş: {suggested} {p.get('unit', 'adet')}
- Birim Fiyat: ₺{p['price']}

Yakında sipariş talebinde bulunacağız. Stok durumunuzu paylaşırsanız seviniriz.

Saygılarımızla"""

    return {
        "product_id":       product_id,
        "product_name":     p["name"],
        "supplier":         supplier,
        "alert_level":      alert,
        "subject":          subject,
        "body":             body,
        "suggested_quantity": suggested,
        "unit":             p.get("unit", "adet"),
        "current_stock":    p["stock_quantity"],
        "min_threshold":    p["min_stock_threshold"],
    }


# ── YENİ: Stok Tükenme Tahmini ────────────────────────────────────────────────
def _local_depletion_forecast() -> dict:
    """
    Her ürün için günlük satış hızına göre kaç günde stok biteceğini hesaplar.
    Urgency seviyeleri:
      - critical : <= 3 gün
      - warning  : <= 7 gün
      - watch    : <= 14 gün
      - ok       : 14 günden fazla
    """
    results = []

    for p in PRODUCTS.values():
        sales_30 = p.get("sales_last_30_days", 0)
        stock    = p["stock_quantity"]
        unit     = p.get("unit", "adet")
        daily    = round(sales_30 / 30, 2)

        if stock == 0:
            results.append({
                "product_id":           p["id"],
                "product_name":         p["name"],
                "category":             p["category"],
                "supplier":             p.get("supplier", ""),
                "current_stock":        0,
                "daily_sales_rate":     daily,
                "days_until_empty":     0,
                "urgency":              "critical",
                "urgency_label":        "🔴 Stok Tükendi",
                "suggested_reorder_qty": _suggested_qty(p),
                "unit":                 unit,
            })
            continue

        if daily <= 0:
            # Satış verisi yoksa tahmin yapılamaz, ama stok uyarısı varsa yine ekle
            alert = _compute_alert(p)
            if alert != "ok":
                results.append({
                    "product_id":           p["id"],
                    "product_name":         p["name"],
                    "category":             p["category"],
                    "supplier":             p.get("supplier", ""),
                    "current_stock":        stock,
                    "daily_sales_rate":     0,
                    "days_until_empty":     None,
                    "urgency":              "watch",
                    "urgency_label":        "⚪ Satış Verisi Yetersiz",
                    "suggested_reorder_qty": _suggested_qty(p),
                    "unit":                 unit,
                })
            continue

        days = round(stock / daily, 1)

        if days <= 3:
            urgency       = "critical"
            urgency_label = f"🔴 {days} günde tükenir — Acil sipariş ver!"
        elif days <= 7:
            urgency       = "warning"
            urgency_label = f"🟠 {days} günde tükenir — Bu hafta sipariş ver"
        elif days <= 14:
            urgency       = "watch"
            urgency_label = f"🟡 {days} günde tükenir — Takipte tut"
        else:
            urgency       = "ok"
            urgency_label = f"🟢 {days} günde tükenir — Stok yeterli"

        results.append({
            "product_id":           p["id"],
            "product_name":         p["name"],
            "category":             p["category"],
            "supplier":             p.get("supplier", ""),
            "current_stock":        stock,
            "daily_sales_rate":     daily,
            "days_until_empty":     days,
            "urgency":              urgency,
            "urgency_label":        urgency_label,
            "suggested_reorder_qty": _suggested_qty(p),
            "unit":                 unit,
        })

    # Önce critical/warning, sonra gün sayısına göre sırala
    urgency_order = {"critical": 0, "warning": 1, "watch": 2, "ok": 3}
    results.sort(key=lambda x: (
        urgency_order.get(x["urgency"], 9),
        x["days_until_empty"] if x["days_until_empty"] is not None else 9999
    ))

    critical_count = sum(1 for r in results if r["urgency"] == "critical")
    warning_count  = sum(1 for r in results if r["urgency"] == "warning")

    return {
        "summary": {
            "critical": critical_count,
            "warning":  warning_count,
            "total_analyzed": len(results),
        },
        "forecasts": results,
    }


@router.get("/depletion-forecast")
async def depletion_forecast():
    """
    Stok tükenme tahminini Gemini ile yaptırır.
    Gemini kullanılamazsa aynı shape ile yerel tahmin döner ve ai_unavailable=true olur.
    """
    local_result = _local_depletion_forecast()
    products = list(PRODUCTS.values())

    prompt = f"""Aşağıdaki ürün, stok ve geçmiş satış verilerini analiz et.
Mevsimsellik varsayımlarını ve KOBİ operasyon risklerini dikkate alarak stokların ne zaman tükeneceğini tahmin et.
Özellikle "A ürünü 3 gün içinde bitecek, hemen 50 adet sipariş verilmeli" gibi net uyarılar üret.

Ürünler:
{json.dumps(products, ensure_ascii=False)}

Yerel ön hesaplama:
{json.dumps(local_result, ensure_ascii=False)}

Yanıtı SADECE şu JSON formatında ver:
{{
  "summary": {{
    "critical": 0,
    "warning": 0,
    "total_analyzed": 8,
    "ai_comment": "Kısa genel stok riski yorumu"
  }},
  "forecasts": [
    {{
      "product_id": "PRD-001",
      "product_name": "Ürün adı",
      "current_stock": 120,
      "daily_sales_rate": 14,
      "days_until_empty": 3,
      "urgency": "critical | warning | watch | ok",
      "urgency_label": "3 gün içinde bitecek, hemen 50 adet sipariş verilmeli",
      "suggested_reorder_qty": 50,
      "unit": "adet",
      "ai_reason": "Kısa gerekçe"
    }}
  ]
}}"""

    try:
        ai_result = await ask_gemini_json(
            "Sen KOBİ stok ve talep tahmini yapan bir yapay zekasın. Türkçe, net ve geçerli JSON döndür.",
            prompt,
        )
        ai_result["ai_powered"] = True
        ai_result["ai_request_attempted"] = True
        ai_result["source"] = "gemini"
        return ai_result
    except AIClientError as exc:
        return {
            **local_result,
            "ai_request_attempted": True,
            "ai_powered": False,
            "ai_unavailable": True,
            "source": "local_fallback",
            "ai_error": str(exc),
        }
