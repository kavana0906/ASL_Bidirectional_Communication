from TTS.api import TTS
import os

MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"
OUTPUT = r"C:\ASL_Project\backend\models\xtts\test_output.wav"
SPEAKER = r"C:\ASL_Project\speaker.wav"

print("Loading XTTS-v2...")

tts = TTS(MODEL).to("cpu")

print("XTTS-v2 loaded!")

print("Generating speech...")

tts.tts_to_file(
    text="Hello, welcome to SignBridge AI.",
    speaker_wav=SPEAKER,
    language="en",
    file_path=OUTPUT
)

print("Speech generated!")
print("Output:", OUTPUT)