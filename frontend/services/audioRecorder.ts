let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  audioChunks = [];

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start();

  console.log("🎤 Recording started");
}

export function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("Recording has not started"));
      return;
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, {
        type: mediaRecorder?.mimeType || "audio/webm",
      });

      mediaRecorder?.stream
        .getTracks()
        .forEach((track) => track.stop());

      mediaRecorder = null;

      console.log("🎤 Recording stopped");

      resolve(audioBlob);
    };

    mediaRecorder.stop();
  });
}