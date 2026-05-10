# KOBİ AI — Yapay Zeka Destekli Operasyon Yönetimi

> YZTA 5. Dönem AI Hackathon Projesi  
> **Backend:** FastAPI + Python | **Frontend:** React + Vite

KOBİ'lerin sipariş, stok ve kargo süreçlerini tek ekrandan yapay zeka destekli olarak yönetmesini sağlayan platform.

---

## 📁 Proje Yapısı

```
KOBIAI/
├── backend/
│   ├── main.py                  # FastAPI uygulama girişi
│   ├── requirements.txt
│   ├── data/
│   │   └── store.py             # In-memory veri deposu (ürünler, siparişler, kargo)
│   └── routers/
│       ├── dashboard.py         # GET /api/dashboard/*
│       ├── products.py          # CRUD /api/products/*
│       ├── orders.py            # CRUD /api/orders/*
│       ├── cargo.py             # CRUD /api/cargo/*
│       ├── inventory.py         # GET /api/inventory/*
│       └── ai.py                # POST /api/ai/chat, GET /api/ai/insights
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js           # /api → localhost:8000 proxy
    └── src/
        ├── main.jsx
        ├── App.jsx              # Router + Sidebar
        ├── client.js            # Tüm API çağrıları
        ├── index.css            # Tema & bileşen stilleri
        ├── Dashboard.jsx
        ├── Orders.jsx
        ├── Products.jsx
        ├── Cargo.jsx
        └── Inventory.jsx
```

---

## 🚀 Kurulum ve Çalıştırma

### Ön Koşullar
- Python 3.11+
- Node.js 18+

---

### 1. Backend (FastAPI)

```bash
cd backend

# Sanal ortam oluştur (önerilen)
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Sunucuyu başlat
uvicorn main:app --reload --port 8000
```

✅ Backend `http://localhost:8000` adresinde çalışıyor olmalı  
📖 API dokümantasyonu: `http://localhost:8000/docs`

---

### 2. Frontend (React + Vite)

```bash
# Farklı bir terminal açın
cd frontend

npm install
npm run dev
```

✅ Frontend `http://localhost:5173` adresinde açılır  
Vite, `/api/*` isteklerini otomatik olarak `localhost:8000`'e yönlendirir.

---

## 🤖 AI Asistan Kurulumu (Opsiyonel)

AI chat özelliği için Anthropic API anahtarı gereklidir.

### Seçenek A — Environment Variable (Önerilen)
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Seçenek B — `.env` dosyası
```bash
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
```

> API anahtarı olmadan tüm diğer özellikler çalışmaya devam eder.  
> AI chat ve insights endpoint'leri HTTP 500 döner.

---

## 📡 API Endpoint'leri

### Dashboard
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/dashboard/stats` | Genel istatistikler |
| GET | `/api/dashboard/recent-activity` | Son aktiviteler |
| GET | `/api/dashboard/order-trend` | Sipariş trendi (grafik verisi) |

### Ürünler
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/products/` | Ürün listesi (`?alert=low/critical/out_of_stock`) |
| POST | `/api/products/` | Yeni ürün ekle |
| GET | `/api/products/{id}` | Ürün detayı |
| PUT | `/api/products/{id}` | Ürün güncelle |
| DELETE | `/api/products/{id}` | Ürün sil |
| GET | `/api/products/categories/list` | Kategori listesi |

### Siparişler
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/orders/` | Sipariş listesi (`?status=pending/shipped/...`) |
| POST | `/api/orders/` | Yeni sipariş oluştur |
| GET | `/api/orders/{id}` | Sipariş detayı |
| PUT | `/api/orders/{id}/status` | Durum güncelle (`?status=confirmed`) |
| DELETE | `/api/orders/{id}` | Siparişi iptal et |
| GET | `/api/orders/stats/summary` | İstatistik özeti |

### Kargo
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/cargo/` | Tüm kargolar |
| POST | `/api/cargo/` | Kargo oluştur (`?order_id=&carrier=`) |
| GET | `/api/cargo/{tracking}` | Kargo sorgula |
| GET | `/api/cargo/order/{order_id}` | Siparişe göre kargo |
| GET | `/api/cargo/delayed` | Gecikmeli kargolar |
| PUT | `/api/cargo/{tracking}/status` | Kargo durumu güncelle |

### Envanter
| Method | URL | Açıklama |
|--------|-----|----------|
| GET | `/api/inventory/alerts` | Stok uyarıları |
| GET | `/api/inventory/summary` | Özet istatistik |
| GET | `/api/inventory/top-selling` | En çok satanlar (`?limit=5`) |
| POST | `/api/inventory/restock/{id}` | Stok ekle (`?quantity=50`) |

### AI
| Method | URL | Açıklama |
|--------|-----|----------|
| POST | `/api/ai/chat` | AI asistanla sohbet |
| GET | `/api/ai/insights` | Otomatik AI içgörüleri |

---

## 🎯 Özellikler

### ✅ Dashboard
- Günlük/haftalık sipariş ve ciro istatistikleri
- Sipariş trend grafiği (Recharts)
- AI tarafından üretilen anlık içgörüler
- Son aktivite akışı

### ✅ Sipariş Yönetimi
- Tüm siparişleri listeleme ve filtreleme (durum, arama)
- Sipariş detay modalı (müşteri, ürünler, kargo)
- Sipariş durumu adım adım ilerleme (Beklemede → Onaylandı → Hazırlanıyor → Kargoda → Teslim)
- Siparişten kargo oluşturma
- Sipariş iptal

### ✅ Ürün & Stok Yönetimi
- Ürün CRUD (ekle, düzenle, sil)
- Stok seviyesi filtreleme
- 30 günlük satış verisi
- Kategori bazlı filtreleme

### ✅ Kargo Takibi
- Takip numarasıyla sorgulama
- Kargo hareketi zaman çizelgesi
- Gecikme tespiti ve yönetimi
- Kargo durumu manuel güncelleme

### ✅ Envanter
- Kritik stok uyarıları (renk kodlu seviyeler)
- Önerilen sipariş miktarı hesaplama
- Tek tıkla stok tazeleme
- En çok satan ürünler analizi

### ✅ AI Asistan (Claude)
- Gerçek zamanlı veri üzerinden sohbet
- Sipariş, kargo, stok soruları
- Müşteri bildirim metni üretme
- Tedarikçi sipariş maili taslağı
- Günlük operasyon önerileri

---

## 🛠 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Backend API** | FastAPI + Python 3.11 |
| **Veri** | In-memory (dict) — DB'ye taşınabilir |
| **Frontend** | React 18 + Vite |
| **Routing** | React Router v6 |
| **Grafikler** | Recharts |
| **İkonlar** | Lucide React |
| **Stil** | CSS Variables (custom design system) |
| **AI** | Anthropic Claude (claude-sonnet-4) |
| **HTTP Client** | httpx (backend), fetch (frontend) |

---

## 📝 Notlar

- Veri tamamen in-memory'de tutulur; sunucu yeniden başlatılınca sıfırlanır.
- Gerçek bir üretim ortamı için PostgreSQL/SQLite + SQLAlchemy entegrasyonu önerilir.
- API anahtarı olmadan AI endpoint'leri hata döner; diğer tüm özellikler çalışmaya devam eder.
- Swagger UI tam API dokümantasyonu için: `http://localhost:8000/docs`

---

*YZTA 5. Akademi Dönemi Hackathon — 2026*
