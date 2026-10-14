import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.sign import router as sign_router
from backend.routes.speech import router as speech_router
from backend.routes.room import router as room_router
from backend.routes.translation import router as translation_router
from backend.services.sign_services import is_sign_recognition_available
app = FastAPI(
    title="SignBridge AI Backend",
    version="1.0.0"
)
app.include_router(room_router)
# Allow React frontend to connect
cors_origins = [
    origin.strip()
    for origin in os.getenv("SIGNBRIDGE_CORS_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "SignBridge AI Backend Running",
        "status": "success"
    }

@app.get("/health")
def health():
    return {
        "server": "online",
        "camera": "ready" if is_sign_recognition_available() else "unavailable",
        "speech": "ready",
        "avatar": "ready"
    }
app.include_router(speech_router,prefix="/speech",tags=["Speech"])
app.include_router(sign_router, tags=["Sign"])
app.include_router(translation_router, tags=["Translation"])
