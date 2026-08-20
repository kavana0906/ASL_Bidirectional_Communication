from transformers import WhisperProcessor, WhisperForConditionalGeneration

MODEL_NAME = "openai/whisper-small"
SAVE_PATH = "backend/models/whisper_small"

print("Downloading processor...")
processor = WhisperProcessor.from_pretrained(MODEL_NAME)
processor.save_pretrained(SAVE_PATH)

print("Downloading model...")
model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
model.save_pretrained(SAVE_PATH)

print("✅ Whisper downloaded successfully!")