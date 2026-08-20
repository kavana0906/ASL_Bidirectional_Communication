from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.sign import router as sign_router
from backend.routes.speech import router as speech_router
app = FastAPI(
    title="SignBridge AI Backend",
    version="1.0.0"
)

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
        "camera": "ready",
        "speech": "ready",
        "avatar": "ready"
    }
app.include_router(speech_router,prefix="/speech",tags=["Speech"])