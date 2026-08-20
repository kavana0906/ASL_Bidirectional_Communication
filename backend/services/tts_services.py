import os
from TTS.api import TTS


# XTTS model location
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "xtts"
)

# Load XTTS-v2
print("Loading XTTS-v2...")

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

print("XTTS-v2 loaded!")


def generate_speech(
    text: str,
    speaker_wav: str,
    output_path: str,
    language: str = "en"
):
    """
    Generate speech using XTTS-v2.
    """

    os.makedirs(
        os.path.dirname(output_path),
        exist_ok=True
    )

    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav,
        language=language,
        file_path=output_path
    )

    return output_path