/**
 * audioUtils.ts
 * Browser-side audio utilities for VoiceView.
 *
 * Converts a MediaRecorder Blob (WebM/Opus) to a 16kHz mono 16-bit WAV
 * ArrayBuffer so the FastAPI /voice/analyze endpoint can decode it with
 * soundfile (which only reads PCM-based formats, not WebM).
 */

const TARGET_SAMPLE_RATE = 16000;

/**
 * Writes a 4-byte ASCII string into a DataView at the given byte offset.
 */
function writeStr(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Encodes a mono Float32Array of PCM samples as a 16-bit WAV ArrayBuffer.
 * @param samples  Normalised [-1, 1] PCM audio at the given sample rate.
 * @param sampleRate  Must match TARGET_SAMPLE_RATE (16000).
 */
export function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const byteCount = samples.length * 2; // 16-bit = 2 bytes/sample
  const buffer = new ArrayBuffer(44 + byteCount);
  const view = new DataView(buffer);

  /* RIFF header */
  writeStr(view, 0,  'RIFF');
  view.setUint32(4,  36 + byteCount,  true); // file length − 8
  writeStr(view, 8,  'WAVE');
  /* fmt  chunk */
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16,         true); // chunk size
  view.setUint16(20, 1,          true); // PCM format
  view.setUint16(22, 1,          true); // mono
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2,          true); // block align
  view.setUint16(34, 16,         true); // bits per sample
  /* data chunk */
  writeStr(view, 36, 'data');
  view.setUint32(40, byteCount, true);

  /* Convert Float32 → Int16 */
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

/**
 * Decodes a MediaRecorder Blob (WebM/Opus), resamples to 16 kHz mono,
 * and returns a WAV ArrayBuffer ready to POST to /voice/analyze.
 *
 * Throws a descriptive Error if decoding or rendering fails.
 */
export async function blobToWAV(blob: Blob): Promise<ArrayBuffer> {
  const rawBuffer = await blob.arrayBuffer();

  // Step 1 — browser decodes WebM/Opus natively
  const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(rawBuffer);
  } finally {
    decodeCtx.close();
  }

  // Step 2 — offline render at 16 kHz mono
  const frameCount = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE);
  const offlineCtx = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const rendered = await offlineCtx.startRendering();
  const pcm = rendered.getChannelData(0); // Float32Array

  // Step 3 — encode as WAV
  return encodeWAV(pcm, TARGET_SAMPLE_RATE);
}

export interface VoiceAnalysisResult {
  jitter_pct: number;
  shimmer_pct: number;
  tempo_wpm: number;
  pitch_mean_hz: number;
  pitch_variance: number;
  voiced_fraction: number;
  strain_index: number;
  emotion_proxy: 'calm' | 'stressed' | 'fatigued';
  emotion_confidence: number;
  snr_db: number;
  analysis_quality: 'good' | 'acceptable' | 'poor' | 'too_quiet' | 'too_short' | 'no_speech';
  duration_s: number;
}

/** Quality values that indicate the analysis produced usable numbers. */
export const USABLE_QUALITY: VoiceAnalysisResult['analysis_quality'][] = ['good', 'acceptable'];
