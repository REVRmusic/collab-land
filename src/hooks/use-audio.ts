import { useCallback, useEffect, useRef, useState } from "react";

// Only one sound plays at a time across the whole app.
let current: HTMLAudioElement | null = null;

export function useAudio(url?: string, knownDuration?: number | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(knownDuration ?? 0);
  const [rate, setRateState] = useState(1);

  const ensure = useCallback(() => {
    if (!url) return null;
    if (!ref.current) {
      const a = new Audio(url);
      a.preload = "metadata";
      a.addEventListener("timeupdate", () => setTime(a.currentTime));
      a.addEventListener("loadedmetadata", () => isFinite(a.duration) && setDuration(a.duration));
      a.addEventListener("play", () => setPlaying(true));
      a.addEventListener("pause", () => setPlaying(false));
      a.addEventListener("ended", () => {
        setPlaying(false);
        setTime(0);
      });
      ref.current = a;
    }
    return ref.current;
  }, [url]);

  useEffect(
    () => () => {
      ref.current?.pause();
      ref.current = null;
    },
    [url],
  );

  const toggle = useCallback(() => {
    const a = ensure();
    if (!a) return;
    if (a.paused) {
      if (current && current !== a) current.pause();
      current = a;
      a.play().catch(() => {});
    } else a.pause();
  }, [ensure]);

  const seek = useCallback(
    (ratio: number) => {
      const a = ensure();
      if (!a) return;
      const d = isFinite(a.duration) && a.duration ? a.duration : duration;
      if (!d) return;
      a.currentTime = ratio * d;
      setTime(a.currentTime);
      if (a.paused) {
        if (current && current !== a) current.pause();
        current = a;
        a.play().catch(() => {});
      }
    },
    [ensure, duration],
  );

  const seekTo = useCallback(
    (sec: number) => {
      const a = ensure();
      if (!a) return;
      const d = isFinite(a.duration) && a.duration ? a.duration : duration;
      a.currentTime = d ? Math.min(Math.max(0, sec), d) : Math.max(0, sec);
      setTime(a.currentTime);
      if (a.paused) {
        if (current && current !== a) current.pause();
        current = a;
        a.play().catch(() => {});
      }
    },
    [ensure, duration],
  );

  const setRate = useCallback(
    (r: number) => {
      const a = ensure();
      if (a) a.playbackRate = r;
      setRateState(r);
    },
    [ensure],
  );

  return { playing, time, duration, progress: duration ? time / duration : 0, toggle, seek, seekTo, rate, setRate, ready: !!url };
}
