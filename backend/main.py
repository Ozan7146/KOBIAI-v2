from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load both locations; existing values are preserved so an empty placeholder
# in backend/.env does not erase a real key from the project root.
load_dotenv(dotenv_path=ROOT_DIR / ".env")
load_dotenv(dotenv_path=BASE_DIR / ".env")

from routers import dashboard, products, orders, cargo, inventory, ai, chat

app = FastAPI(
    title="Qtech AI API",
    description="Q'ler için Yapay Zeka Destekli Operasyon Yönetimi — FastAPI Backend",
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
app.include_router(chat.router,      prefix="/api/ai",        tags=["Chat"])

@app.get("/")
def root():
    return {"message": "Qtech AI Backend çalışıyor 🚀", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}