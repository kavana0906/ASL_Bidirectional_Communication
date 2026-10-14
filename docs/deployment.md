# Running SignBridge on more than one device

Room links identify a room, but they do not host the application or backend. Both participants need to open the same reachable frontend, and that frontend must be able to reach one shared backend.

For a local network setup, start the API so it listens on the host machine's network interface:

```powershell
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Set `NEXT_PUBLIC_API_URL` for the frontend to the backend URL, such as `http://192.168.1.20:8000`, and set `SIGNBRIDGE_CORS_ORIGINS` on the backend to the frontend origin, such as `http://192.168.1.20:3000`. The backend's room state lives in process memory, so run one API process for a room.

For use across the public internet, deploy the frontend and backend at stable HTTPS addresses, set `NEXT_PUBLIC_API_URL` to the HTTPS backend address, and set `SIGNBRIDGE_CORS_ORIGINS` to the exact frontend origin. HTTPS is required for browser camera and microphone access on non-localhost addresses. The frontend automatically uses a secure WebSocket (`wss`) when the configured API URL uses HTTPS.

ASL recognition and avatar output currently cover the included 22-class sign model and available sign animations. This is a prototype vocabulary, not general-purpose ASL translation. Speech transcription and Hindi/Kannada handling also depend on the local Whisper model and the configured runtime dependencies.
