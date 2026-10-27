"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, SessionLocal, engine
from .routers import tickets
from .seed import seed

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("app")
settings = get_settings()

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    # JSON API: nothing should ever be rendered or framed from here (the /docs page is the exception).
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.demo_mode:
        log.warning("DEMO_MODE is on: users are identified by the unauthenticated X-User header. "
                    "Do not expose this instance to untrusted networks.")
    Base.metadata.create_all(engine)
    if get_settings().seed_on_startup:
        with SessionLocal() as db:
            seed(db)
    yield


_docs = settings.demo_mode or settings.debug
app = FastAPI(title="Smart IT Support Tickets", lifespan=lifespan,
              docs_url="/docs" if _docs else None, redoc_url=None,
              openapi_url="/openapi.json" if _docs else None)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    for k, v in SECURITY_HEADERS.items():
        if k == "Content-Security-Policy" and request.url.path in ("/docs", "/openapi.json"):
            continue  # Swagger UI needs its own scripts/styles
        response.headers.setdefault(k, v)
    return response
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-User"],
)
app.include_router(tickets.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "ai_enabled": get_settings().ai_enabled}
