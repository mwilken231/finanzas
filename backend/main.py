import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
from models import User, Category, Transaction, MonthlyPlan, CreditCard  # noqa: F401 - needed for table creation
from seed import run_seed
from routers import auth, transactions, categories, plans, cards, dashboard, backup, bot

app = FastAPI(title="Finanzas Personales API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    # Ensure data directory exists for SQLite
    db_url = os.getenv("DATABASE_URL", "sqlite:////data/finanzas.db")
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/auth",             tags=["auth"])
app.include_router(categories.router,   prefix="/categories",       tags=["categories"])
app.include_router(transactions.router, prefix="/transactions",     tags=["transactions"])
app.include_router(plans.router,        prefix="/plans",            tags=["plans"])
app.include_router(cards.router,        prefix="/cards",            tags=["cards"])
app.include_router(dashboard.router,    prefix="/dashboard",        tags=["dashboard"])
app.include_router(backup.router,       prefix="/backup",           tags=["backup"])
# Bot/n8n compatible endpoints under /api
app.include_router(bot.router,          prefix="/api",              tags=["bot"])


@app.get("/health")
def health():
    return {"status": "ok"}
