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
export async function speechToText(
  audioBlob: Blob,
  language: "en" | "hi" | "kn",
) {
  const formData = new FormData();

  formData.append(
    "audio",
    audioBlob,
    "recording.wav"
  );
  formData.append("language", language);

  const response = await fetch(
    `${API_URL}/speech/speech-to-text`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Speech-to-text failed (${response.status}): ${errorBody}`
    );
  }

  return response.json();
}

export async function translateText(
  text: string,
  sourceLanguage: "hi" | "kn",
) {
  const response = await fetch(
    `${API_URL}/translation/translate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        source_language: sourceLanguage,
        target_language: "en",
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Translation failed (${response.status}): ${errorBody}`
    );
  }

  return response.json();
}