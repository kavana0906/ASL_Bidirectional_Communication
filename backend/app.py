from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.sign import router as sign_router
from backend.routes.speech import router as speech_router
from backend.routes.room import router as room_router
app = FastAPI(
    title="SignBridge AI Backend",
    version="1.0.0"
)
app.include_router(room_router)
# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    # Allow the local Next.js development server, whichever local URL/port it uses.
allow_origins=[],
allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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
app.include_router(sign_router, tags=["Sign"])
