import { Pause, Play } from "lucide-react";
import { useAudio } from "@/hooks/use-audio";
import { formatTime, useMediaUrl } from "@/lib/media";
import { Waveform } from "./Waveform";

type Props = {
  path: string;
  peaks?: number[] | null;
  duration?: number | null;
  height?: number;
  size?: "sm" | "lg";
};

export function TrackPlayer({ path, peaks, duration, height = 72, size = "lg" }: Props) {
  const url = useMediaUrl("audio", path);
  const a = useAudio(url, duration);
  const btn = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  return (
    <div className="flex w-full items-center gap-4">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          a.toggle();
        }}
        disabled={!a.ready}
        aria-label={a.playing ? "Pause" : "Lecture"}
        className={`${btn} grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_-8px_var(--primary)] transition hover:scale-105 disabled:opacity-50`}
      >
        {a.playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
      </button>
      <div className="relative min-w-0 flex-1">
        <Waveform peaks={(peaks as number[]) ?? []} progress={a.progress} onSeek={a.seek} height={height} />
        <span className="pointer-events-none absolute left-0 top-[58%] rounded bg-background/85 px-1 text-[11px] font-medium tabular-nums text-primary">
          {formatTime(a.time)}
        </span>
        <span className="pointer-events-none absolute right-0 top-[58%] rounded bg-background/85 px-1 text-[11px] tabular-nums text-muted-foreground">
          {formatTime(a.duration || duration)}
        </span>
      </div>
    </div>
  );
}
