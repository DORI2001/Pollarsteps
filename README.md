# 🗺️ Pollarsteps

A modern travel tracking app with interactive maps, trip management, and location tracking.

**Status:** ✅ Production-Ready | **Tests:** ✅ 11/11 Passing | **Code:** ✅ Refactored & Type-Safe

---

## 🎯 Quick Start

### Prerequisites
- Python 3.9+ 
- Node.js 18+

### Setup (2 minutes)

```bash
# Backend
cd backend_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Run

**Terminal 1 - Backend:**
```bash
cd backend_app
export PYTHONPATH=.:$PYTHONPATH
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:3000** | API: **http://127.0.0.1:8000**

---

## ✨ Features

- 🗺️ Interactive Mapbox visualization
- ✈️ Trip & location management
- 🔐 JWT authentication
- 📊 Trip statistics (distance, duration)
- 🖼️ Photo gallery support
- 🤖 AI recommendations (Gemini-ready)
- 📦 Type-safe TypeScript frontend
- ✅ Comprehensive test coverage

---

## 🧪 Testing

```bash
cd / && python test_integration.py
```

**Result:** ✅ 11/11 Integration Tests Passing

---

## 📁 Structure

```
backend_app/app/
├── utils/          ← Centralized utilities
├── services/       ← Business logic
├── api/routes/     ← Endpoints
├── models/         ← SQLAlchemy ORM
└── schemas/        ← Pydantic validation

frontend/lib/
├── types.ts        ← TypeScript types
├── errors.ts       ← Error handling
├── stats.ts        ← Calculations
└── api.ts          ← API client
```

---

## ⚙️ Configuration

### Backend `.env`
```env
DATABASE_URL=sqlite+aiosqlite:///./pollarsteps.db
JWT_SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-key-here
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

---

## 📚 Documentation

- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - Code quality improvements
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Using utilities & patterns

---

## 🆕 Recent Improvements

✅ Backend utilities (distance, errors, config)  
✅ Full TypeScript type safety on frontend  
✅ 50-67% code duplication reduction  
✅ All 11 integration tests passing  

---

## 🐛 Quick Fixes

**Backend won't start?**
```bash
export PYTHONPATH=backend_app:$PYTHONPATH
python -c "from app.utils import calculate_total_distance; print('OK')"
```

**Map not showing?**
- Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `frontend/.env.local`
- Token must start with `pk.`
- Restart frontend server

---

## 📄 License

MIT
