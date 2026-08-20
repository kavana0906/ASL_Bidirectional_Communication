from transformers import pipeline
import torch

MODEL_PATH = "backend/models/whisper_small"

device = 0 if torch.cuda.is_available() else -1

speech_to_text = pipeline(
    task="automatic-speech-recognition",
    model=MODEL_PATH,
    device=device,
)

def transcribe_audio(audio_path):
    result = speech_to_text(audio_path)
    return result["text"]