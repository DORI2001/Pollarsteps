from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.db import engine, Base
from app.api.routes import auth, trips, steps, ai_chronicler, analytics, uploads, geocoding, recommendations, stories
from app.models.step_image import StepImage  # noqa: F401 — ensure table is created
from app.models.collaborator import TripCollaborator  # noqa: F401
import os

# Load .env file explicitly at startup
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(os.path.abspath(env_path), override=True)

app = FastAPI(title="Pollarsteps Clone API")

# Add CORS middleware — origins can be extended via ALLOWED_ORIGINS env var
_default_origins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
_extra = os.environ.get("ALLOWED_ORIGINS", "")
_allowed_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory (used by uploads router)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health():
    return {"status": "ok"}


# Register all API routers with /api prefix for consistency
app.include_router(auth.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(steps.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(ai_chronicler.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(geocoding.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(stories.router, prefix="/api")
