"""
KOBİ AI – In-memory data store.
Bütün CRUD işlemleri bu modüldeki dict'ler üzerinden yapılır.
"""

from datetime import datetime, timedelta
import random, uuid

# ──────────────────────────────────────────────
# PRODUCTS
# ──────────────────────────────────────────────
PRODUCTS: dict = {
    "PRD-001": {
        "id": "PRD-001",
        "name": "Organik Domates",
        "category": "Sebze",
        "price": 45.0,
        "stock_quantity": 120,
        "min_stock_threshold": 50,
        "unit": "kg",
        "supplier": "Akdeniz Tarım A.Ş.",
        "description": "Sertifikalı organik domates, yöresel üretim.",
        "stock_alert": "ok",
        "sales_last_30_days": 420,
    },
    "PRD-002": {
        "id": "PRD-002",
        "name": "Çiçek Balı",
        "category": "Gıda",
        "price": 180.0,
        "stock_quantity": 35,
        "min_stock_threshold": 40,
        "unit": "kg",
        "supplier": "Karadeniz Arı Çiftliği",
        "description": "Doğal çiçek balı, katkısız.",
        "stock_alert": "low",
        "sales_last_30_days": 62,
    },
    "PRD-003": {
        "id": "PRD-003",
        "name": "El Yapımı Zeytinyağı 500ml",
        "category": "Gıda",
        "price": 220.0,
        "stock_quantity": 0,
        "min_stock_threshold": 20,
        "unit": "şişe",
        "supplier": "Ege Zeytin Kooperatifi",
        "description": "Soğuk sıkım, ilk hasat zeytinyağı.",
        "stock_alert": "out_of_stock",
        "sales_last_30_days": 38,
    },
    "PRD-004": {
        "id": "PRD-004",
        "name": "Köy Yumurtası 30'lu",
        "category": "Gıda",
        "price": 95.0,
        "stock_quantity": 200,
        "min_stock_threshold": 60,
        "unit": "koli",
        "supplier": "Yıldız Çiftlik Ürünleri",
        "description": "Serbest dolaşımlı tavuk yumurtası.",
        "stock_alert": "ok",
        "sales_last_30_days": 310,
    },
    "PRD-005": {
        "id": "PRD-005",
        "name": "El Dokuması Kilim 80x150",
        "category": "Tekstil",
        "price": 1850.0,
        "stock_quantity": 8,
        "min_stock_threshold": 10,
        "unit": "adet",
        "supplier": "Anadolu El Sanatları Koop.",
        "description": "El dokuması, yün kilim.",
        "stock_alert": "low",
        "sales_last_30_days": 9,
    },
    "PRD-006": {
        "id": "PRD-006",
        "name": "Organik Mercimek 1kg",
        "category": "Bakliyat",
        "price": 55.0,
        "stock_quantity": 340,
        "min_stock_threshold": 100,
        "unit": "kg",
        "supplier": "Güneydoğu Tarım Koop.",
        "description": "Sertifikalı organik yeşil mercimek.",
        "stock_alert": "ok",
        "sales_last_30_days": 155,
    },
    "PRD-007": {
        "id": "PRD-007",
        "name": "Seramik Kupa Set 6'lı",
        "category": "Ev & Yaşam",
        "price": 420.0,
        "stock_quantity": 22,
        "min_stock_threshold": 15,
        "unit": "set",
        "supplier": "Çanakkale Seramik Atölyesi",
        "description": "El yapımı seramik kupa seti.",
        "stock_alert": "ok",
        "sales_last_30_days": 27,
    },
    "PRD-008": {
        "id": "PRD-008",
        "name": "Ahşap Kesme Tahtası Ceviz",
        "category": "Ev & Yaşam",
        "price": 680.0,
        "stock_quantity": 5,
        "min_stock_threshold": 8,
        "unit": "adet",
        "supplier": "Kastamonu Ağaç İşleri",
        "description": "Masif ceviz ahşabından el yapımı.",
        "stock_alert": "critical",
        "sales_last_30_days": 14,
    },
}

# ──────────────────────────────────────────────
# ORDERS
# ──────────────────────────────────────────────
ORDERS: dict = {
    "ORD-001": {
        "id": "ORD-001",
        "customer_name": "Ayşe Kaya",
        "customer_email": "ayse.kaya@email.com",
        "customer_phone": "0532 111 22 33",
        "shipping_address": "Çankaya, Ankara",
        "items": [
            {"product_id": "PRD-001", "product_name": "Organik Domates", "quantity": 5, "unit_price": 45.0, "total_price": 225.0},
            {"product_id": "PRD-004", "product_name": "Köy Yumurtası 30'lu", "quantity": 2, "unit_price": 95.0, "total_price": 190.0},
        ],
        "total_amount": 415.0,
        "status": "shipped",
        "notes": None,
        "cargo_tracking_number": "YK123456789TR",
        "created_at": "2026-05-09T10:30:00",
        "updated_at": "2026-05-09T14:00:00",
    },
    "ORD-002": {
        "id": "ORD-002",
        "customer_name": "Mehmet Demir",
        "customer_email": "m.demir@gmail.com",
        "customer_phone": "0541 333 44 55",
        "shipping_address": "Kadıköy, İstanbul",
        "items": [
            {"product_id": "PRD-002", "product_name": "Çiçek Balı", "quantity": 3, "unit_price": 180.0, "total_price": 540.0},
        ],
        "total_amount": 540.0,
        "status": "pending",
        "notes": "Hediye paketi yapılsın",
        "cargo_tracking_number": None,
        "created_at": "2026-05-10T08:15:00",
        "updated_at": "2026-05-10T08:15:00",
    },
    "ORD-003": {
        "id": "ORD-003",
        "customer_name": "Fatma Şahin",
        "customer_email": "fatma.sahin@hotmail.com",
        "customer_phone": "0555 777 88 99",
        "shipping_address": "Konak, İzmir",
        "items": [
            {"product_id": "PRD-005", "product_name": "El Dokuması Kilim 80x150", "quantity": 1, "unit_price": 1850.0, "total_price": 1850.0},
            {"product_id": "PRD-007", "product_name": "Seramik Kupa Set 6'lı", "quantity": 1, "unit_price": 420.0, "total_price": 420.0},
        ],
        "total_amount": 2270.0,
        "status": "preparing",
        "notes": None,
        "cargo_tracking_number": None,
        "created_at": "2026-05-09T16:00:00",
        "updated_at": "2026-05-10T09:00:00",
    },
    "ORD-004": {
        "id": "ORD-004",
        "customer_name": "Ali Yılmaz",
        "customer_email": "ali.yilmaz@icloud.com",
        "customer_phone": "0533 999 00 11",
        "shipping_address": "Nilüfer, Bursa",
        "items": [
            {"product_id": "PRD-006", "product_name": "Organik Mercimek 1kg", "quantity": 10, "unit_price": 55.0, "total_price": 550.0},
            {"product_id": "PRD-004", "product_name": "Köy Yumurtası 30'lu", "quantity": 3, "unit_price": 95.0, "total_price": 285.0},
        ],
        "total_amount": 835.0,
        "status": "shipped",
        "notes": None,
        "cargo_tracking_number": "ARS987654321TR",
        "created_at": "2026-05-08T11:00:00",
        "updated_at": "2026-05-09T09:00:00",
    },
    "ORD-005": {
        "id": "ORD-005",
        "customer_name": "Zeynep Arslan",
        "customer_email": "zeynep.arslan@outlook.com",
        "customer_phone": "0544 222 33 44",
        "shipping_address": "Keçiören, Ankara",
        "items": [
            {"product_id": "PRD-008", "product_name": "Ahşap Kesme Tahtası Ceviz", "quantity": 2, "unit_price": 680.0, "total_price": 1360.0},
        ],
        "total_amount": 1360.0,
        "status": "delivered",
        "notes": None,
        "cargo_tracking_number": "PTT111222333TR",
        "created_at": "2026-05-07T09:00:00",
        "updated_at": "2026-05-09T15:30:00",
    },
    "ORD-006": {
        "id": "ORD-006",
        "customer_name": "Can Öztürk",
        "customer_email": "can.ozturk@gmail.com",
        "customer_phone": "0536 555 66 77",
        "shipping_address": "Bornova, İzmir",
        "items": [
            {"product_id": "PRD-001", "product_name": "Organik Domates", "quantity": 10, "unit_price": 45.0, "total_price": 450.0},
            {"product_id": "PRD-006", "product_name": "Organik Mercimek 1kg", "quantity": 5, "unit_price": 55.0, "total_price": 275.0},
        ],
        "total_amount": 725.0,
        "status": "pending",
        "notes": None,
        "cargo_tracking_number": None,
        "created_at": "2026-05-10T07:45:00",
        "updated_at": "2026-05-10T07:45:00",
    },
}

# ──────────────────────────────────────────────
# CARGO
# ──────────────────────────────────────────────
CARGO: dict = {
    "YK123456789TR": {
        "id": "CRG-001",
        "tracking_number": "YK123456789TR",
        "order_id": "ORD-001",
        "carrier": "Yurtiçi Kargo",
        "status": "in_transit",
        "current_location": "Ankara Dağıtım Merkezi",
        "estimated_delivery": "2026-05-11",
        "is_delayed": False,
        "delay_reason": None,
        "last_update": "2026-05-10T08:30:00",
        "events": [
            {"status": "Kargo Kabul", "location": "İstanbul Şubesi", "time": "2026-05-09T15:00:00"},
            {"status": "Transfer Merkezi", "location": "İstanbul Toplu Dağıtım", "time": "2026-05-09T22:00:00"},
            {"status": "Yolda", "location": "Ankara Dağıtım Merkezi", "time": "2026-05-10T08:30:00"},
        ],
    },
    "ARS987654321TR": {
        "id": "CRG-002",
        "tracking_number": "ARS987654321TR",
        "order_id": "ORD-004",
        "carrier": "Aras Kargo",
        "status": "delayed",
        "current_location": "Bursa Transfer Merkezi",
        "estimated_delivery": "2026-05-12",
        "is_delayed": True,
        "delay_reason": "Hava koşulları nedeniyle gecikme",
        "last_update": "2026-05-09T18:00:00",
        "events": [
            {"status": "Kargo Kabul", "location": "İzmir Şubesi", "time": "2026-05-08T14:00:00"},
            {"status": "Transfer Merkezi", "location": "Bursa Transfer", "time": "2026-05-09T09:00:00"},
            {"status": "Gecikme", "location": "Bursa Transfer Merkezi", "time": "2026-05-09T18:00:00"},
        ],
    },
    "PTT111222333TR": {
        "id": "CRG-003",
        "tracking_number": "PTT111222333TR",
        "order_id": "ORD-005",
        "carrier": "PTT Kargo",
        "status": "delivered",
        "current_location": "Teslim Edildi",
        "estimated_delivery": "2026-05-09",
        "is_delayed": False,
        "delay_reason": None,
        "last_update": "2026-05-09T15:30:00",
        "events": [
            {"status": "Kargo Kabul", "location": "Ankara Şubesi", "time": "2026-05-07T12:00:00"},
            {"status": "Dağıtıma Çıktı", "location": "Keçiören Şubesi", "time": "2026-05-09T09:00:00"},
            {"status": "Teslim Edildi", "location": "Alıcı", "time": "2026-05-09T15:30:00"},
        ],
    },
}


def _compute_stock_alert(p: dict) -> str:
    q = p["stock_quantity"]
    t = p["min_stock_threshold"]
    if q == 0:
        return "out_of_stock"
    elif q < t:
        return "critical"
    elif q < t * 1.5:
        return "low"
    return "ok"


def refresh_stock_alerts():
    for p in PRODUCTS.values():
        p["stock_alert"] = _compute_stock_alert(p)
