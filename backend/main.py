from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, products, orders, cargo, inventory, ai

app = FastAPI(
    title="KOBİ AI API",
    description="KOBİ'ler için Yapay Zeka Destekli Operasyon Yönetimi — FastAPI Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(products.router,  prefix="/api/products",  tags=["Ürünler"])
app.include_router(orders.router,    prefix="/api/orders",    tags=["Siparişler"])
app.include_router(cargo.router,     prefix="/api/cargo",     tags=["Kargo"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Envanter"])
app.include_router(ai.router,        prefix="/api/ai",        tags=["AI"])


@app.get("/")
def root():
    return {"message": "KOBİ AI Backend çalışıyor 🚀", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
