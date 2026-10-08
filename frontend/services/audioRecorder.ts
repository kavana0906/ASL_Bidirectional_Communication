let stream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let processor: ScriptProcessorNode | null = null;
let samples: Float32Array[] = [];
let recording = false;
let continuousTimer: ReturnType<typeof setTimeout> | null = null;
let continuous = false;

function mergeSamples(chunks: Float32Array[]) {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  chunks.forEach((chunk) => { merged.set(chunk, offset); offset += chunk.length; });
  return merged;
}

function toWav(input: Float32Array, inputRate: number) {
  const outputRate = 16000;
  const ratio = inputRate / outputRate;
  const pcm = new Float32Array(Math.round(input.length / ratio));
  for (let i = 0; i < pcm.length; i += 1) {
    const start = Math.round(i * ratio);
    const end = Math.min(Math.round((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    pcm[i] = sum / Math.max(1, end - start);
  }

  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF"); view.setUint32(4, 36 + pcm.length * 2, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, outputRate, true);
  view.setUint32(28, outputRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, pcm.length * 2, true);
  pcm.forEach((sample, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true));
  return new Blob([buffer], { type: "audio/wav" });
}

async function beginCapture(existingStream?: MediaStream) {
  stream = existingStream || await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext();
  source = audioContext.createMediaStreamSource(stream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);
  samples = [];
  recording = true;
  processor.onaudioprocess = (event) => { if (recording) samples.push(new Float32Array(event.inputBuffer.getChannelData(0))); };
  source.connect(processor);
  processor.connect(audioContext.destination);
}

async function endCapture(stopStream: boolean) {
  recording = false;
  processor?.disconnect();
  source?.disconnect();
  const rate = audioContext?.sampleRate || 48000;
  await audioContext?.close();
  const audio = toWav(mergeSamples(samples), rate);
  processor = null; source = null; audioContext = null; samples = [];
  if (stopStream) { stream?.getTracks().forEach((track) => track.stop()); stream = null; }
  return audio;
}

export async function startRecording() { await beginCapture(); }

export async function stopRecording(): Promise<Blob> {
  if (!recording) throw new Error("Recording has not started");
  return endCapture(true);
}

export async function startContinuousRecording(onSegment: (audio: Blob) => Promise<void>, segmentMs = 3500) {
  if (continuous) return;
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  continuous = true;
  const recordSegment = async () => {
    if (!stream || !continuous) return;
    await beginCapture(stream);
    continuousTimer = setTimeout(async () => {
      if (!recording) return;
      const audio = await endCapture(false);
      if (audio.size > 44) await onSegment(audio);
      if (continuous) void recordSegment();
    }, segmentMs);
  };
  await recordSegment();
}

export async function stopContinuousRecording() {
  continuous = false;
  if (continuousTimer) clearTimeout(continuousTimer);
  continuousTimer = null;
  if (recording) await endCapture(true);
  else { stream?.getTracks().forEach((track) => track.stop()); stream = null; }
}
