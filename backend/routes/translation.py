from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/translation",
    tags=["Translation"]
)


class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str = "en"


# Basic offline translations for common project vocabulary.
# This avoids external translation API rate limits.
OFFLINE_TRANSLATIONS = {
    "hi": {
        "namaste": "hello",
        "नमस्ते": "hello",
        "धन्यवाद": "thank you",
        "धन्यवाद।": "thank you",
        "मदद": "help",
        "कृपया": "please",
        "माफ़ कीजिए": "sorry",
        "हाँ": "yes",
        "नहीं": "no",
        "आप": "you",
        "हम": "we",
        "कहाँ": "where",
        "कब": "when",
        "क्यों": "why",
        "प्यार": "love",
        "अच्छा": "good",
        "बुरा": "bad",
        "अधिक": "more",
        "कम": "less",
        "नाम": "name",
        "रुको": "stop",
        "शुरू": "start",
    },
    "kn": {
        "ನಮಸ್ಕಾರ": "hello",
        "ನಮಸ್ತೆ": "hello",
        "ಧನ್ಯವಾದಗಳು": "thank you",
        "ಸಹಾಯ": "help",
        "ದಯವಿಟ್ಟು": "please",
        "ಕ್ಷಮಿಸಿ": "sorry",
        "ಹೌದು": "yes",
        "ಇಲ್ಲ": "no",
        "ನೀವು": "you",
        "ನಾವು": "we",
        "ಎಲ್ಲಿ": "where",
        "ಯಾವಾಗ": "when",
        "ಏಕೆ": "why",
        "ಪ್ರೀತಿ": "love",
        "ಒಳ್ಳೆಯ": "good",
        "ಕೆಟ್ಟ": "bad",
        "ಹೆಚ್ಚು": "more",
        "ಕಡಿಮೆ": "less",
        "ಹೆಸರು": "name",
        "ನಿಲ್ಲಿಸಿ": "stop",
        "ಪ್ರಾರಂಭ": "start",
    },
}


@router.post("/translate")
async def translate_text(request: TranslationRequest):

    text = request.text.strip()

    if not text:
        return {
            "text": "",
            "source_language": request.source_language,
            "target_language": request.target_language,
        }

    # English does not need translation.
    if request.source_language == "en":
        translated = text

    else:
        translations = OFFLINE_TRANSLATIONS.get(
            request.source_language,
            {}
        )

        # Exact phrase match
        translated = translations.get(
            text.lower(),
            translations.get(text, text)
        )

    return {
        "text": translated,
        "source_language": request.source_language,
        "target_language": request.target_language,
    }