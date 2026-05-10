from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from data.store import PRODUCTS, refresh_stock_alerts
import uuid

router = APIRouter()


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    stock_quantity: int
    min_stock_threshold: int = 10
    unit: str = "adet"
    description: str = ""
    supplier: str = ""


class ProductUpdate(ProductCreate):
    pass


def _compute_alert(p: dict) -> str:
    q = p["stock_quantity"]
    t = p["min_stock_threshold"]
    if q == 0:        return "out_of_stock"
    elif q < t:       return "critical"
    elif q < t * 1.5: return "low"
    return "ok"


@router.get("/categories/list")
def list_categories():
    cats = sorted(set(p["category"] for p in PRODUCTS.values()))
    return cats


@router.get("/")
def list_products(alert: Optional[str] = None, category: Optional[str] = None):
    items = list(PRODUCTS.values())
    if alert:
        items = [p for p in items if p["stock_alert"] == alert]
    if category:
        items = [p for p in items if p["category"].lower() == category.lower()]
    return items


@router.get("/{product_id}")
def get_product(product_id: str):
    p = PRODUCTS.get(product_id)
    if not p:
        raise HTTPException(404, f"Ürün bulunamadı: {product_id}")
    return p


@router.post("/", status_code=201)
def create_product(data: ProductCreate):
    new_id = f"PRD-{str(uuid.uuid4())[:6].upper()}"
    p = data.model_dump()
    p["id"] = new_id
    p["sales_last_30_days"] = 0
    p["stock_alert"] = _compute_alert(p)
    PRODUCTS[new_id] = p
    return p


@router.put("/{product_id}")
def update_product(product_id: str, data: ProductUpdate):
    if product_id not in PRODUCTS:
        raise HTTPException(404, f"Ürün bulunamadı: {product_id}")
    updated = data.model_dump()
    updated["id"] = product_id
    updated["sales_last_30_days"] = PRODUCTS[product_id].get("sales_last_30_days", 0)
    updated["stock_alert"] = _compute_alert(updated)
    PRODUCTS[product_id] = updated
    return updated


@router.delete("/{product_id}")
def delete_product(product_id: str):
    if product_id not in PRODUCTS:
        raise HTTPException(404, f"Ürün bulunamadı: {product_id}")
    del PRODUCTS[product_id]
    return {"message": f"{product_id} silindi"}
