from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from data.store import ORDERS, PRODUCTS
import uuid

router = APIRouter()

VALID_STATUSES = {"pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"}


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_phone: str = ""
    shipping_address: str
    items: List[OrderItemIn]
    notes: Optional[str] = None


# ── GET /orders/stats/summary  (must be before /{id}) ──
@router.get("/stats/summary")
def order_stats():
    orders = list(ORDERS.values())
    by_status = {}
    for s in VALID_STATUSES:
        by_status[s] = sum(1 for o in orders if o["status"] == s)
    return {
        "total": len(orders),
        "by_status": by_status,
        "total_revenue": sum(o["total_amount"] for o in orders if o["status"] != "cancelled"),
    }


@router.get("/")
def list_orders(status: Optional[str] = None):
    items = list(ORDERS.values())
    if status:
        items = [o for o in items if o["status"] == status]
    return sorted(items, key=lambda o: o["created_at"], reverse=True)


@router.get("/{order_id}")
def get_order(order_id: str):
    o = ORDERS.get(order_id)
    if not o:
        raise HTTPException(404, f"Sipariş bulunamadı: {order_id}")
    return o


@router.post("/", status_code=201)
def create_order(data: OrderCreate):
    new_id = f"ORD-{str(uuid.uuid4())[:6].upper()}"
    now = datetime.now().isoformat(timespec="seconds")

    # Build items from product catalog
    items = []
    total = 0.0
    for item in data.items:
        p = PRODUCTS.get(item.product_id)
        if not p:
            raise HTTPException(404, f"Ürün bulunamadı: {item.product_id}")
        line_total = round(p["price"] * item.quantity, 2)
        total += line_total
        items.append({
            "product_id": item.product_id,
            "product_name": p["name"],
            "quantity": item.quantity,
            "unit_price": p["price"],
            "total_price": line_total,
        })

    order = {
        "id": new_id,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "customer_phone": data.customer_phone,
        "shipping_address": data.shipping_address,
        "items": items,
        "total_amount": round(total, 2),
        "status": "pending",
        "notes": data.notes,
        "cargo_tracking_number": None,
        "created_at": now,
        "updated_at": now,
    }
    ORDERS[new_id] = order
    return order


@router.put("/{order_id}/status")
def update_order_status(order_id: str, status: str, notes: Optional[str] = None):
    if status not in VALID_STATUSES:
        raise HTTPException(400, f"Geçersiz durum: {status}")
    o = ORDERS.get(order_id)
    if not o:
        raise HTTPException(404, f"Sipariş bulunamadı: {order_id}")
    o["status"] = status
    o["updated_at"] = datetime.now().isoformat(timespec="seconds")
    if notes:
        o["notes"] = notes
    return o


@router.delete("/{order_id}")
def cancel_order(order_id: str):
    o = ORDERS.get(order_id)
    if not o:
        raise HTTPException(404, f"Sipariş bulunamadı: {order_id}")
    o["status"] = "cancelled"
    o["updated_at"] = datetime.now().isoformat(timespec="seconds")
    return {"message": f"Sipariş {order_id} iptal edildi"}
