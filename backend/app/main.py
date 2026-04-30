from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import templates, reports, auth, admin, notifications

app = FastAPI(
    title="Інформаційна система моніторингу стану кіберзахисту",
    description="API для управління звітами та кібероцінюванням",
    version="1.0.0",
    root_path="/api"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
import uuid
import json
import time
from .logger import logger, request_id_var, user_id_var
from .redis_client import get_redis
from .auth import _session_key

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())
    request_id_var.set(req_id)
    
    user_id = None
    token = request.cookies.get("__Host-session") or request.cookies.get("session")
    if token:
        try:
            r = get_redis()
            raw = r.get(_session_key(token))
            if raw:
                data = json.loads(raw)
                user_id = data.get("user_id")
        except:
            pass
            
    user_id_var.set(user_id)

    logger.info(f"Incoming request", extra={
        "http_method": request.method,
        "path": request.url.path,
        "query": request.url.query
    })
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(f"Request completed", extra={
        "status_code": response.status_code,
        "process_time_s": round(process_time, 4)
    })
    return response

app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(notifications.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "CyberMon API is running"}
