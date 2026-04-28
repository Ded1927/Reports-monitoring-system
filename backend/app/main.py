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

app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(notifications.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "CyberMon API is running"}
