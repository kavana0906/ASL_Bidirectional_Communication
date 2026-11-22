from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import os
import shutil
import uuid


router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv("SIGNBRIDGE_DATA_DIR")

SPEAKER_DIR = os.path.join(
    DATA_DIR or os.path.join(BASE_DIR, "models", "xtts"),
    "speakers",
)

OUTPUT_DIR = os.path.join(
    DATA_DIR or os.path.join(BASE_DIR, "models", "xtts"),
    "outputs",
)

AUDIO_DIR = os.path.join(
    DATA_DIR or os.path.join(BASE_DIR, "models", "whisper"),
    "audio",
)

os.makedirs(SPEAKER_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


def _cleanup_generated_audio(speaker_path: str, output_path: str):
    for path in (speaker_path, output_path):
        try:
            os.remove(path)
        except FileNotFoundError:
            pass


# =========================================================
# SPEECH → TEXT
# =========================================================

@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form("en"),
):
    try:
        if language not in {"en", "hi", "kn"}:
            raise HTTPException(
                status_code=422,
                detail="Supported languages are English, Hindi, and Kannada.",
            )
        file_id = str(uuid.uuid4())

        # Keep the original extension
        extension = os.path.splitext(audio.filename or "")[1]

        if not extension:
            extension = ".webm"

        audio_path = os.path.join(
            AUDIO_DIR,
            f"{file_id}{extension}"
        )

        # Save uploaded audio
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        print(f"Transcribing audio: {audio_path}")

        # Whisper transcription
        from backend.services.speech_services import transcribe_audio

        text = transcribe_audio(audio_path, language)

        print(f"Transcription: {text}")

        # Delete temporary audio after transcription
        try:
            os.remove(audio_path)
        except Exception:
            pass

        return {
            "text": text,
            "source_language": language,
            "output_language": language,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Speech-to-text error: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# TEXT → SPEECH
# =========================================================

@router.post("/text-to-speech")
async def text_to_speech(
    text: str = Form(...),
    speaker_audio: UploadFile = File(...),
    language: str = Form("en")
):
    try:
        from backend.services.tts_services import generate_speech

        file_id = str(uuid.uuid4())

        speaker_path = os.path.join(
            SPEAKER_DIR,
            f"{file_id}_{speaker_audio.filename}"
        )

        output_path = os.path.join(
            OUTPUT_DIR,
            f"{file_id}.wav"
        )

        # Save speaker audio
        with open(speaker_path, "wb") as buffer:
            shutil.copyfileobj(
                speaker_audio.file,
                buffer
            )

        print(f"Generating speech for: {text}")

        # Generate XTTS speech
        generate_speech(
            text=text,
            speaker_wav=speaker_path,
            output_path=output_path,
            language=language
        )

        print(f"Speech generated: {output_path}")

        return FileResponse(
            output_path,
            media_type="audio/wav",
            filename="speech.wav",
            background=BackgroundTask(
                _cleanup_generated_audio,
                speaker_path,
                output_path,
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"TTS Error: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
