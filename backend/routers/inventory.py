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
                "product_id":          p["id"],
                "product_name":        p["name"],
                "category":            p["category"],
                "supplier":            p.get("supplier", ""),
                "current_stock":       p["stock_quantity"],
                "min_threshold":       p["min_stock_threshold"],
                "unit":                p.get("unit", "adet"),
                "alert_level":         alert,
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
        "total_products":       len(products),
        "ok":                   alert_counts["ok"],
        "low_stock":            alert_counts["low"],
        "critical_stock":       alert_counts["critical"],
        "out_of_stock":         alert_counts["out_of_stock"],
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
