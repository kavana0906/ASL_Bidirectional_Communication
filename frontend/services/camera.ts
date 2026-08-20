export function captureFrame(
  video: HTMLVideoElement
): Promise<Blob> {

  return new Promise((resolve, reject) => {

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject("Canvas not supported");
      return;
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject("Unable to capture image");
      }
    }, "image/jpeg");

  });

}