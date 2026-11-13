from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from fastapi import Depends

from .auth import router as auth_router
from .config import get_settings
from .db import get_db

app = FastAPI(title="SafeSphere AI Demo API", version="0.1.0")


@app.middleware("http")
async def origin_check(request: Request, call_next):
    # Browser write requests must originate from the configured frontend.
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        origin = request.headers.get("origin")
        if origin and origin.rstrip("/") != get_settings().app_origin.rstrip("/"):
            return JSONResponse(status_code=403, content={"detail": "Invalid request origin"})
    return await call_next(request)


@app.get("/health")
def health():
    return {"status": "ok", "service": "safesphere-api"}


@app.get("/health/db")
def db_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {"status": "ok", "database": "connected"}


app.include_router(auth_router)
