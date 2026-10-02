/** Client-side MP3 compression (192 kbps) so large WAV/AIFF/FLAC uploads stay light. */
const KBPS = 192;

export async function compressAudio(file: File, onProgress?: (pct: number) => void): Promise<{ blob: Blob; ext: string }> {
  const isMp3 = file.type === "audio/mpeg" || /\.mp3$/i.test(file.name);
  if (isMp3) return { blob: file, ext: "mp3" };

  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let audio: AudioBuffer;
  try {
    audio = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    ctx.close();
    throw new Error("Format audio non pris en charge par ce navigateur");
  }
  ctx.close();

  const channels = Math.min(2, audio.numberOfChannels);
  const rate = [32000, 44100, 48000].includes(audio.sampleRate) ? audio.sampleRate : 44100;
  const enc = new Mp3Encoder(channels, rate, KBPS);
  const toI16 = (f: Float32Array) => {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const s = Math.max(-1, Math.min(1, f[i] ?? 0));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  };
  const left = toI16(audio.getChannelData(0));
  const right = channels > 1 ? toI16(audio.getChannelData(1)) : null;
  const parts: BlobPart[] = [];
  const block = 1152 * 20;
  for (let i = 0; i < left.length; i += block) {
    const l = left.subarray(i, i + block);
    const buf = right ? enc.encodeBuffer(l, right.subarray(i, i + block)) : enc.encodeBuffer(l);
    if (buf.length) parts.push(new Uint8Array(buf));
    if ((i / block) % 40 === 0) {
      onProgress?.(Math.round((i / left.length) * 100));
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const end = enc.flush();
  if (end.length) parts.push(new Uint8Array(end));
  onProgress?.(100);
  return { blob: new Blob(parts, { type: "audio/mpeg" }), ext: "mp3" };
}

export const AUDIO_ACCEPT = "audio/*,.wav,.aif,.aiff,.flac,.mp3,.m4a";
