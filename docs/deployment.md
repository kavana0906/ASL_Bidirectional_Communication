# Running SignBridge on more than one device

Room links identify a room, but they do not host the application or backend. Both participants need to open the same reachable frontend, and that frontend must be able to reach one shared backend.

For a local network setup, start the API so it listens on the host machine's network interface:

```powershell
uvicorn backend.app:app --host 0.0.0.0 --port 8000
```

Set `NEXT_PUBLIC_API_URL` for the frontend to the backend URL, such as `http://192.168.1.20:8000`, and set `SIGNBRIDGE_CORS_ORIGINS` on the backend to the frontend origin, such as `http://192.168.1.20:3000`. The backend's room state lives in process memory, so run one API process for a room.

For use across the public internet, deploy the frontend and backend at stable HTTPS addresses, set `NEXT_PUBLIC_API_URL` to the HTTPS backend address, and set `SIGNBRIDGE_CORS_ORIGINS` to the exact frontend origin. HTTPS is required for browser camera and microphone access on non-localhost addresses. The frontend automatically uses a secure WebSocket (`wss`) when the configured API URL uses HTTPS.

ASL recognition and avatar output currently cover the included 22-class sign model and available sign animations. This is a prototype vocabulary, not general-purpose ASL translation. Speech transcription and Hindi/Kannada handling also depend on the local Whisper model and the configured runtime dependencies.

## Local Hindi and Kannada text translation

The `/translation/translate` endpoint runs AI4Bharat IndicTrans2 locally. It handles English, Hindi, and Kannada in both directions, including direct Hindi↔Kannada translation. The app uses the [English-to-Indic](https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M), [Indic-to-English](https://huggingface.co/ai4bharat/indictrans2-indic-en-dist-200M), and [Indic-to-Indic](https://huggingface.co/ai4bharat/indictrans2-indic-indic-dist-320M) distilled models. There is no per-request translation API charge.

Install the backend dependencies:

```powershell
python -m pip install -r backend/requirements.txt
```

The IndicTrans2 model repositories require accepting their Hugging Face access terms. Sign in to Hugging Face, open and accept the terms for the three model repositories listed in `backend/services/local_translation.py`, then create a read token. For the first model download, set the token in the same PowerShell session before starting FastAPI:

```powershell
$env:HF_TOKEN = "your-hugging-face-read-token"
$env:INDICTRANS2_CACHE_DIR = Join-Path $env:LOCALAPPDATA "SignBridgeAI\indictrans2"
python -m uvicorn backend.app:app --reload
```

The backend downloads a model the first time a translation direction needs it. Once cached, inference runs locally. Keep the cache outside the project directory so Uvicorn's `--reload` watcher does not restart the backend when model files are created. If you already downloaded models into `backend/models/indictrans2`, copy that directory's contents to the new cache path before restarting to avoid downloading them again. Provide persistent storage at the cache path on a deployed backend; otherwise the models may download again after a restart or redeploy. Configure `HF_TOKEN` as a backend secret environment variable, never in frontend code. The first model download needs internet access, and the backend needs several GB of storage and enough memory for the cached model weights, Whisper, and the rest of the app. Automatic text-language detection uses the writing system; romanized Hindi or Kannada should be entered using its native script for correct detection.

The distilled models are licensed MIT, but model access requires accepting the Hugging Face terms and sharing the account information requested on the model pages. See the [IndicTrans2 project](https://github.com/AI4Bharat/IndicTrans2) for supported languages and inference details.
