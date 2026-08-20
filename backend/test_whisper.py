from services.speech_services import transcribe_audio

audio_file = "datasets/audio/sample.wav"

text = transcribe_audio(audio_file)

print("Transcription:")
print(text)