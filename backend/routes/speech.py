from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from backend.services.tts_services import generate_speech
from backend.services.speech_services import transcribe_audio

import os
import shutil
import uuid


router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SPEAKER_DIR = os.path.join(
    BASE_DIR,
    "models",
    "xtts",
    "speakers"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "models",
    "xtts",
    "outputs"
)

AUDIO_DIR = os.path.join(
    BASE_DIR,
    "models",
    "whisper",
    "audio"
)

os.makedirs(SPEAKER_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)


# =========================================================
# SPEECH → TEXT
# =========================================================

@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...)
):
    try:
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
        text = transcribe_audio(audio_path)

        print(f"Transcription: {text}")

        # Delete temporary audio after transcription
        try:
            os.remove(audio_path)
        except Exception:
            pass

        return {
            "text": text
        }

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
            filename="speech.wav"
        )

    except Exception as e:
        print(f"TTS Error: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )