import os
import subprocess
import tempfile

import numpy as np
import soundfile as sf
import torch

from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
)


# ============================================================
# PATHS
# ============================================================

PROJECT_PATH = r"C:\ASL_Project"

MODEL_PATH = os.path.join(
    PROJECT_PATH,
    "backend",
    "models",
    "whisper_small"
)

FFMPEG_BIN = r"C:\ffmpeg-8.1.2-full_build-shared\bin"

FFMPEG_PATH = os.path.join(
    FFMPEG_BIN,
    "ffmpeg.exe"
)


# ============================================================
# CHECK PATHS
# ============================================================

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Whisper model not found:\n{MODEL_PATH}"
    )

if not os.path.exists(FFMPEG_PATH):
    raise FileNotFoundError(
        f"FFmpeg not found:\n{FFMPEG_PATH}"
    )


# ============================================================
# ADD FFMPEG DLL DIRECTORY
# ============================================================

if hasattr(os, "add_dll_directory"):
    os.add_dll_directory(FFMPEG_BIN)


# ============================================================
# WHISPER MODEL
# ============================================================

print("Loading Whisper...")
print(f"Whisper model: {MODEL_PATH}")
print(f"FFmpeg: {FFMPEG_PATH}")


processor = WhisperProcessor.from_pretrained(
    MODEL_PATH,
    local_files_only=True,
)


model = WhisperForConditionalGeneration.from_pretrained(
    MODEL_PATH,
    local_files_only=True,
)


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

model = model.to(device)
model.eval()


print(f"Device: {device}")
print("Whisper loaded successfully!")


# ============================================================
# TRANSCRIBE AUDIO
# ============================================================

def transcribe_audio(audio_path: str) -> str:

    print(f"Transcribing audio: {audio_path}")

    if not os.path.exists(audio_path):
        raise FileNotFoundError(
            f"Audio file not found:\n{audio_path}"
        )

    # --------------------------------------------------------
    # Create temporary WAV file
    # --------------------------------------------------------

    with tempfile.NamedTemporaryFile(
        suffix=".wav",
        delete=False
    ) as temp_file:

        wav_path = temp_file.name

    try:

        # ====================================================
        # WEBM -> WAV
        # ====================================================

        command = [
            FFMPEG_PATH,
            "-y",
            "-i",
            audio_path,
            "-ar",
            "16000",
            "-ac",
            "1",
            "-sample_fmt",
            "s16",
            wav_path,
        ]

        print("Converting audio with FFmpeg...")

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        if result.returncode != 0:

            print("FFmpeg error:")
            print(result.stderr)

            raise RuntimeError(
                "FFmpeg failed to convert the audio."
            )

        print(f"WAV created: {wav_path}")

        # ====================================================
        # LOAD WAV
        # ====================================================

        audio, sample_rate = sf.read(
            wav_path,
            dtype="float32",
        )

        print(
            f"Audio loaded: "
            f"shape={audio.shape}, "
            f"sample_rate={sample_rate}"
        )

        # ====================================================
        # STEREO -> MONO
        # ====================================================

        if len(audio.shape) > 1:
            audio = np.mean(
                audio,
                axis=1
            )

        # ====================================================
        # WHISPER PROCESSOR
        # ====================================================

        print("Sending audio to Whisper...")

        inputs = processor(
            audio,
            sampling_rate=sample_rate,
            return_tensors="pt",
        )

        input_features = inputs.input_features.to(device)

        # ====================================================
        # WHISPER GENERATION
        # ====================================================

        with torch.no_grad():

            predicted_ids = model.generate(
                input_features
            )

        # ====================================================
        # DECODE
        # ====================================================

        text = processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0].strip()

        print(f"Whisper result: {text}")

        return text

    finally:

        # ====================================================
        # DELETE TEMPORARY WAV
        # ====================================================

        if os.path.exists(wav_path):
            os.remove(wav_path)

            print(
                f"Temporary WAV deleted: {wav_path}"
            )