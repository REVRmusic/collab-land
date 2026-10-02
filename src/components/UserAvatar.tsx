import { useMemo, useRef, useState, type CSSProperties } from "react";
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

/** Blue→violet washes; vivid enough to read on tiny thumbs, stable per seed. */
function coverPlaceholderStyle(seed: string): CSSProperties {
  const h = hashSeed(seed || "collabland");
  const rand = mulberry32(h);
  const bands = [200, 230, 255, 275, 295, 320];
  const baseHue = bands[h % bands.length]!;
  const accentHue = bands[(h + 2) % bands.length]!;
  const base = `hsl(${baseHue} 55% ${10 + rand() * 8}%)`;

  const corners = [
    [8, 10], [92, 12], [10, 90], [90, 88],
    [50, 6], [50, 94], [4, 50], [96, 50],
  ] as const;
  const a = corners[h % corners.length]!;
  const b = corners[(h + 3) % corners.length]!;
  const c = corners[(h + 5) % corners.length]!;

  // `at X% Y%` form is widely supported; avoid `circle N%` which some engines drop
  const layers = [
    `radial-gradient(at ${a[0]}% ${a[1]}%, hsl(${baseHue} 90% 62% / 0.95) 0%, transparent 55%)`,
    `radial-gradient(at ${b[0]}% ${b[1]}%, hsl(${accentHue} 85% 55% / 0.75) 0%, transparent 50%)`,
    `radial-gradient(at ${c[0]}% ${c[1]}%, hsl(${(baseHue + accentHue) / 2} 70% 45% / 0.45) 0%, transparent 45%)`,
    `linear-gradient(${Math.floor(rand() * 360)}deg, hsl(${baseHue} 40% 8% / 0.9), hsl(${accentHue} 35% 6% / 0.85))`,
  ];

  return { backgroundColor: base, backgroundImage: layers.join(", ") };
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
  const [broken, setBroken] = useState(false);
  const placeholder = useMemo(
    () => coverPlaceholderStyle(seed || path || "cover"),
    [seed, path],
  );
  const showImage = !!url && !broken;
  return (
    <div className={`relative aspect-square shrink-0 self-start overflow-hidden bg-surface-2 ${className}`}>
      <div className="absolute inset-0" style={placeholder} aria-hidden />
      {showImage && (
        <img
          src={url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => {
            if (!retried.current) {
              retried.current = true;
              qc.invalidateQueries({ queryKey: ["media", "covers", path] });
              return;
            }
            setBroken(true);
          }}
        />
      )}
    </div>
  );
}
