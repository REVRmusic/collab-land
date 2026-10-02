import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Bucket = "avatars" | "covers" | "audio";

export async function uploadFile(bucket: Bucket, file: Blob, ext: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non connecté");
  const path = `${data.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

export function extOf(file: File | Blob, fallback = "bin") {
  if (file instanceof File && file.name.includes(".")) return file.name.split(".").pop()!.toLowerCase();
  const t = file.type;
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4") || t.includes("m4a")) return "m4a";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("mpeg")) return "mp3";
  if (t.includes("wav")) return "wav";
  return fallback;
}

/** Resolves a stored path into a temporary signed URL (or passes through absolute URLs). */
export function useMediaUrl(bucket: Bucket, path?: string | null) {
  const q = useQuery({
    queryKey: ["media", bucket, path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      if (/^https?:\/\//.test(path)) return path;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  return q.data ?? undefined;
}

/** Decodes audio and returns normalized amplitude peaks (0..1) plus duration in seconds. */
export async function computePeaks(blob: Blob, buckets = 180): Promise<{ peaks: number[]; duration: number }> {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const ch = audio.getChannelData(0);
    const ch2 = audio.numberOfChannels > 1 ? audio.getChannelData(1) : null;
    const size = Math.floor(ch.length / buckets) || 1;
    const peaks: number[] = [];
    for (let i = 0; i < buckets; i++) {
      let max = 0;
      let sum = 0;
      const start = i * size;
      const step = Math.max(1, Math.floor(size / 400));
      let n = 0;
      for (let j = start; j < start + size && j < ch.length; j += step) {
        const v = Math.abs(ch2 ? (ch[j] + ch2[j]) / 2 : ch[j]);
        if (v > max) max = v;
        sum += v * v;
        n++;
      }
      const rms = Math.sqrt(sum / Math.max(1, n));
      peaks.push(max * 0.4 + rms * 0.6 * 2);
    }
    const top = Math.max(...peaks, 0.0001);
    return { peaks: peaks.map((p) => Math.round((p / top) * 1000) / 1000), duration: audio.duration };
  } catch {
    return { peaks: Array.from({ length: buckets }, () => 0.3 + Math.random() * 0.5), duration: 0 };
  } finally {
    ctx.close();
  }
}

export function formatTime(s?: number | null) {
  if (!s || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function timeAgo(date: string) {
  const d = (Date.now() - new Date(date).getTime()) / 1000;
  if (d < 60) return "à l'instant";
  if (d < 3600) return `il y a ${Math.floor(d / 60)} min`;
  if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`;
  if (d < 604800) return `il y a ${Math.floor(d / 86400)} j`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
