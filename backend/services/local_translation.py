"""Lazy local inference with AI4Bharat IndicTrans2 distilled checkpoints."""

import os
import re
import threading
from pathlib import Path

LANGUAGE_CODES = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "kn": "kan_Knda",
}

MODEL_IDS = {
    "en-indic": "ai4bharat/indictrans2-en-indic-dist-200M",
    "indic-en": "ai4bharat/indictrans2-indic-en-dist-200M",
    "indic-indic": "ai4bharat/indictrans2-indic-indic-dist-320M",
}

_MODEL_CACHE = {}
_PROCESSOR = None
_TORCH = None
_DEVICE = None
_LOCK = threading.RLock()


def detect_language(text: str) -> str:
    """Detect English, Hindi, or Kannada from script; default to English."""
    devanagari = sum(0x0900 <= ord(char) <= 0x097F for char in text)
    kannada = sum(0x0C80 <= ord(char) <= 0x0CFF for char in text)
    if kannada > devanagari:
        return "kn"
    if devanagari > kannada:
        return "hi"
    return "en"


def _load_runtime():
    global _PROCESSOR, _TORCH, _DEVICE
    if _PROCESSOR is None:
        import torch
        from IndicTransToolkit.processor import IndicProcessor

        _TORCH = torch
        _DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _PROCESSOR = IndicProcessor(inference=True)
    return _TORCH, _PROCESSOR, _DEVICE


def _load_model(direction: str):
    if direction in _MODEL_CACHE:
        return _MODEL_CACHE[direction]

    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    torch, _, device = _load_runtime()
    model_id = MODEL_IDS[direction]
    cache_dir = os.getenv(
        "INDICTRANS2_CACHE_DIR",
        str(Path.home() / ".cache" / "signbridge" / "indictrans2"),
    )
    hf_token = os.getenv("HF_TOKEN") or None
    model_args = {
        "trust_remote_code": True,
        "cache_dir": cache_dir,
        "token": hf_token,
    }
    tokenizer = AutoTokenizer.from_pretrained(model_id, **model_args)
    dtype = torch.float16 if device.type == "cuda" else torch.float32
    model = AutoModelForSeq2SeqLM.from_pretrained(
        model_id,
        torch_dtype=dtype,
        low_cpu_mem_usage=True,
        **model_args,
    ).to(device)
    # IndicTrans2 uses the legacy tuple cache. Transformers 4.57+ otherwise
    # wraps it in EncoderDecoderCache, which breaks generation in its decoder.
    model._supports_default_dynamic_cache = lambda: False
    model.eval()
    _MODEL_CACHE[direction] = (tokenizer, model)
    return _MODEL_CACHE[direction]


def translate_local(text: str, source_language: str, target_language: str) -> dict:
    """Translate one sentence locally and return detected/source language metadata."""
    if source_language == "auto":
        source_language = detect_language(text)
    if source_language not in LANGUAGE_CODES or target_language not in LANGUAGE_CODES:
        raise ValueError("Supported languages are English, Hindi, and Kannada.")
    if source_language == target_language:
        return {"text": text, "source_language": source_language, "target_language": target_language}

    if source_language == "en":
        direction = "en-indic"
    elif target_language == "en":
        direction = "indic-en"
    else:
        direction = "indic-indic"

    with _LOCK:
        torch, processor, device = _load_runtime()
        tokenizer, model = _load_model(direction)
        source_code = LANGUAGE_CODES[source_language]
        target_code = LANGUAGE_CODES[target_language]
        sentences = [part.strip() for part in re.split(r"(?<=[.!?।॥])\s+", text) if part.strip()]
        chunks = []
        for sentence in sentences:
            words = sentence.split()
            chunks.extend(" ".join(words[index:index + 50]) for index in range(0, len(words), 50))

        translated_chunks = []
        for index in range(0, len(chunks), 4):
            preprocessed = processor.preprocess_batch(
                chunks[index:index + 4], src_lang=source_code, tgt_lang=target_code
            )
            inputs = tokenizer(
                preprocessed,
                truncation=True,
                padding="longest",
                return_tensors="pt",
                return_attention_mask=True,
            ).to(device)

            with torch.inference_mode():
                generated = model.generate(
                    **inputs,
                    use_cache=True,
                    min_length=0,
                    max_length=256,
                    num_beams=5,
                    num_return_sequences=1,
                )

            decoded = tokenizer.batch_decode(
                generated,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True,
            )
            translated_chunks.extend(processor.postprocess_batch(decoded, lang=target_code))

        translated = " ".join(translated_chunks)
        return {
            "text": translated,
            "source_language": source_language,
            "target_language": target_language,
        }
