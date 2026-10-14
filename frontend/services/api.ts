// Set NEXT_PUBLIC_API_URL when the frontend and API are hosted separately.
// Otherwise, use the page's hostname so other devices on the same network can
// reach the API through the machine hosting the frontend.
function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  if (typeof window === "undefined") return "http://localhost:8000";
  return `${window.location.protocol}//${window.location.hostname}:8000`;
}

const API_URL = getApiBaseUrl();

export class SignPredictionError extends Error {
  constructor(public readonly status: number, detail: string) {
    super(`Sign prediction failed (${status}): ${detail}`);
    this.name = "SignPredictionError";
  }
}

export function roomSocketUrl(roomId: string) {
  const baseUrl = getApiBaseUrl();
  const socketProtocol = baseUrl.startsWith("https:") ? "wss:" : "ws:";
  const socketHost = baseUrl.replace(/^https?:/, "");
  return `${socketProtocol}${socketHost}/ws/${encodeURIComponent(roomId)}`;
}

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
    const responseText = await response.text();
    let detail = responseText;
    try {
      const body = JSON.parse(responseText);
      detail = body.detail || responseText;
    } catch {
      // Keep the plain response text when the API did not return JSON.
    }
    throw new SignPredictionError(response.status, detail);
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
