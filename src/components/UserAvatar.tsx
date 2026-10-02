import { useMemo, useRef, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMediaUrl } from "@/lib/media";

type P = { avatar_url?: string | null; username?: string | null; display_name?: string | null } | null | undefined;

export function UserAvatar({ profile, className = "h-9 w-9" }: { profile: P; className?: string }) {
  const url = useMediaUrl("avatars", profile?.avatar_url);
  const letter = (profile?.display_name || profile?.username || "?").charAt(0).toUpperCase();
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border`}>
      {url ? (
        <img src={url} alt={profile?.username ?? ""} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/40 to-voice/40 font-display text-sm font-semibold">
          {letter}
        </div>
      )}
    </div>
  );
}

function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft blue/violet glows — stable for a given seed, varied across projects. */
function coverPlaceholderStyle(seed: string): CSSProperties {
  const rand = mulberry32(hashSeed(seed || "collabland"));
  const count = 2 + Math.floor(rand() * 3); // 2–4 glows
  const layers: string[] = [];

  // Deep charcoal base with a faint wash
  const baseHue = 270 + rand() * 30;
  layers.push(`radial-gradient(120% 120% at 50% 50%, oklch(0.22 0.03 ${baseHue}), oklch(0.14 0.015 ${baseHue - 10}))`);

  for (let i = 0; i < count; i++) {
    const x = 5 + rand() * 90;
    const y = 5 + rand() * 90;
    const stop = 40 + rand() * 40;
    // Blues (~250) through violets (~300)
    const hue = 248 + rand() * 58;
    const chroma = 0.14 + rand() * 0.14;
    const light = 0.42 + rand() * 0.28;
    const alpha = 0.35 + rand() * 0.45;
    layers.push(
      `radial-gradient(circle at ${x.toFixed(1)}% ${y.toFixed(1)}%, oklch(${light.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)} / ${alpha.toFixed(3)}), transparent ${stop.toFixed(0)}%)`,
    );
  }

  // Soft vignette
  layers.push("radial-gradient(circle at 50% 50%, transparent 35%, oklch(0.1 0.02 280 / 0.55) 100%)");

  return { backgroundImage: layers.join(",") };
}

export function CoverImage({
  path,
  className = "",
  seed,
}: {
  path?: string | null;
  className?: string;
  /** Stable seed so the same project always gets the same placeholder */
  seed?: string | null;
}) {
  const url = useMediaUrl("covers", path);
  const qc = useQueryClient();
  const retried = useRef(false);
  const placeholder = useMemo(
    () => coverPlaceholderStyle(seed || path || "cover"),
    [seed, path],
  );
  return (
    <div className={`relative aspect-square shrink-0 self-start overflow-hidden bg-surface-2 ${className}`}>
      {url ? (
        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => { if (retried.current) return; retried.current = true; qc.invalidateQueries({ queryKey: ["media", "covers", path] }); }} />
      ) : (
        <div className="absolute inset-0" style={placeholder} />
      )}
    </div>
  );
}
