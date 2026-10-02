import { useEffect, useRef, useState } from "react";

type Props = {
  peaks: number[];
  progress: number;
  onSeek?: (ratio: number) => void;
  height?: number;
  /** "track" = SoundCloud style with reflection, "voice" = rounded centered bars */
  variant?: "track" | "voice";
  barWidth?: number;
  gap?: number;
  playedVar?: string;
  restVar?: string;
  className?: string;
  /** Markers as ratios 0..1 along the waveform */
  markers?: { id: string; ratio: number; active?: boolean }[];
  onMarkerClick?: (id: string) => void;
};

function cssVar(el: Element, name: string) {
  return getComputedStyle(el).getPropertyValue(name).trim() || "#888";
}

export function Waveform({
  peaks,
  progress,
  onSeek,
  height = 72,
  variant = "track",
  barWidth,
  gap,
  playedVar = "--wave-played",
  restVar = "--wave",
  className,
  markers,
  onMarkerClick,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = width * dpr;
    c.height = height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const bw = barWidth ?? (variant === "voice" ? 3 : 2);
    const g = gap ?? (variant === "voice" ? 2 : 1);
    const count = Math.max(8, Math.floor(width / (bw + g)));
    const src = peaks.length ? peaks : Array(count).fill(0.15);
    const played = cssVar(c, playedVar);
    const rest = cssVar(c, restVar);
    const playedX = progress * width;
    const hoverX = hover !== null ? hover * width : null;

    for (let i = 0; i < count; i++) {
      const p = src[Math.floor((i / count) * src.length)] ?? 0;
      const x = i * (bw + g);
      const isPlayed = x < playedX;
      const isHover = hoverX !== null && x < hoverX && !isPlayed;
      ctx.fillStyle = isPlayed ? played : rest;
      ctx.globalAlpha = isHover ? 0.85 : isPlayed ? 1 : variant === "voice" ? 0.55 : 0.9;
      if (isHover) ctx.fillStyle = played;

      if (variant === "track") {
        const top = height * 0.68;
        const h = Math.max(2, p * (top - 2));
        ctx.fillRect(x, top - h, bw, h);
        ctx.globalAlpha = (isPlayed ? 0.45 : 0.25) * (isHover ? 1.4 : 1);
        const rh = Math.max(1, p * (height - top - 1));
        ctx.fillRect(x, top + 1, bw, rh);
      } else {
        const h = Math.max(bw, p * height);
        const y = (height - h) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, h, bw / 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }, [peaks, progress, width, height, hover, variant, barWidth, gap, playedVar, restVar]);

  const ratioFrom = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  return (
    <div
      ref={wrap}
      className={`relative w-full select-none ${onSeek ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={{ height }}
      onMouseMove={(e) => onSeek && setHover(ratioFrom(e.clientX))}
      onMouseLeave={() => setHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onSeek?.(ratioFrom(e.clientX));
      }}
    >
      <canvas ref={canvas} style={{ width: "100%", height }} className="block" />
      {markers?.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-label="Annotation"
          className={`absolute top-0 z-10 h-full w-3 -translate-x-1/2 ${m.active ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
          style={{ left: `${Math.min(100, Math.max(0, m.ratio * 100))}%` }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMarkerClick?.(m.id);
          }}
        >
          <span className={`absolute left-1/2 top-[8%] h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-background ${m.active ? "bg-primary" : "bg-voice"}`} />
          <span className={`absolute left-1/2 top-[8%] h-[60%] w-px -translate-x-1/2 ${m.active ? "bg-primary/70" : "bg-voice/50"}`} />
        </button>
      ))}
    </div>
  );
}
