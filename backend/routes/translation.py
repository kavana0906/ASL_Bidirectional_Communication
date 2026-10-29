import asyncio
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.local_translation import LANGUAGE_CODES, translate_local

router = APIRouter(prefix="/translation", tags=["Translation"])
SUPPORTED_LANGUAGES = set(LANGUAGE_CODES)
logger = logging.getLogger(__name__)


class TranslationRequest(BaseModel):
    text: str = Field(max_length=30000)
    source_language: str = "auto"
    target_language: str = "en"


@router.post("/translate")
async def translate_text(request: TranslationRequest):
    text = request.text.strip()
    source_language = request.source_language.lower()
    target_language = request.target_language.lower()

    if not text:
        return {"text": "", "source_language": source_language, "target_language": target_language}
    if source_language not in SUPPORTED_LANGUAGES | {"auto"}:
        raise HTTPException(status_code=422, detail="Source language must be English, Hindi, Kannada, or auto-detected.")
    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=422, detail="Target language must be English, Hindi, or Kannada.")

    try:
        return await asyncio.to_thread(translate_local, text, source_language, target_language)
    except ImportError as error:
        raise HTTPException(
            status_code=503,
            detail="Local translation dependencies are missing. Install backend/requirements.txt.",
        ) from error
    except Exception as error:
        logger.exception("Local IndicTrans2 translation failed")
        raise HTTPException(
            status_code=503,
            detail=(
                "The local IndicTrans2 model could not translate this text. "
                "Check model access, HF_TOKEN, the model cache, and backend memory."
            ),
        ) from error
