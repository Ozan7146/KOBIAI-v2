from fastapi import APIRouter, HTTPException
from data.store import PRODUCTS

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