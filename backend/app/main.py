from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os, traceback
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


@app.exception_handler(Exception)
async def _debug_exception_handler(request: Request, exc: Exception):
    if os.environ.get("DEBUG_TRACEBACKS") == "1":
        return JSONResponse(
            status_code=500,
            content={"error": str(exc), "type": type(exc).__name__, "trace": traceback.format_exc().splitlines()[-15:]},
        )
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
