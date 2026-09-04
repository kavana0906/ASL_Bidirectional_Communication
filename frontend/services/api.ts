const API_URL = "http://127.0.0.1:8000";

export async function checkBackend() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is not responding");
  }

  return response.json();
}

export async function predictSign(frameBlobs: Blob[]) {
  const formData = new FormData();

  frameBlobs.forEach((frame, index) => {
    formData.append("frames", frame, `frame-${index}.jpg`);
  });

  const response = await fetch(`${API_URL}/predict-sequence`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Prediction failed");
  }

  return response.json();
}
export async function speechToText(audioBlob: Blob) {
  const formData = new FormData();

  formData.append(
    "audio",
    audioBlob,
    "recording.webm"
  );

  const response = await fetch(
    `${API_URL}/speech/speech-to-text`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      "Speech-to-text request failed"
    );
  }

  return response.json();
}