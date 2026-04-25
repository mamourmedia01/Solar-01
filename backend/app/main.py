from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import connect_db, close_db
from app.api.routes import auth, leads, enrichment, roi, outreach, billing


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="Solar-01 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",       tags=["auth"])
app.include_router(leads.router,      prefix="/api/leads",      tags=["leads"])
app.include_router(enrichment.router, prefix="/api/enrichment", tags=["enrichment"])
app.include_router(roi.router,        prefix="/api/roi",        tags=["roi"])
app.include_router(outreach.router,   prefix="/api/outreach",   tags=["outreach"])
app.include_router(billing.router,    prefix="/api/billing",    tags=["billing"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
