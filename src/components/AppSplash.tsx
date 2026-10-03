import { useEffect, useRef, useState } from "react";
import logoAsset from "@/assets/collabland-logo.png.asset.json";

const SESSION_KEY = "cl-splash-v3";
const HOLD_MS = 900;
const MORPH_MS = 720;
const FADE_MS = 180;
const TARGET_WAIT_MS = 1200;

type Phase = "idle" | "show" | "morph" | "fade" | "done";

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

function pickVisibleLogo(): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-app-logo]"));
  return (
    nodes.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 24 && r.height >= 16;
    }) ?? null
  );
}

async function waitForLogo(timeoutMs: number) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const el = pickVisibleLogo();
    if (el) return el;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return null;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** FLIP invert : place en position finale, inverse vers l’état “centre”, puis anime vers l’identité. */
async function morphMarkToLogo(mark: HTMLElement, target: HTMLElement, duration: number) {
  const first = mark.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (first.width < 1 || targetRect.width < 1) return;

  // Tout en synchrone avant le prochain paint → pas de frame “cassée”
  mark.classList.remove("cl-splash__mark--brand", "cl-splash__mark--enter");
  mark.style.animation = "none";
  mark.style.filter = "none";
  mark.style.boxShadow = "none";
  mark.style.position = "fixed";
  mark.style.left = `${targetRect.left}px`;
  mark.style.top = `${targetRect.top}px`;
  mark.style.margin = "0";
  mark.style.zIndex = "2";
  mark.style.transformOrigin = "top left";
  mark.style.willChange = "transform";
  mark.style.transform = "none";

  void mark.offsetWidth;
  const last = mark.getBoundingClientRect();
  if (last.width < 1) return;

  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const sx = first.width / last.width;
  const sy = first.height / last.height;
  const from = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

  mark.style.transform = from;
  void mark.offsetWidth;

  const anim = mark.animate(
    [{ transform: from }, { transform: "translate(0px, 0px) scale(1, 1)" }],
    {
      duration,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "forwards",
    },
  );
  await anim.finished.catch(() => undefined);
}

/**
 * Splash : même logo + même typo que l’UI, agrandi au centre puis FLIP
 * vers le Logo réel (header mobile / sidebar desktop).
 */
export function AppSplash() {
  const [phase, setPhase] = useState<Phase>("idle");
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* ignore */
    }

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      markSeen();
      return;
    }

    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      document.body.classList.remove("cl-splash-active");
      markSeen();
      setPhase("done");
    };

    const run = async () => {
      // Attendre Space Grotesk / DM Sans pour éviter le “saut” de police
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      setPhase("show");
      document.body.classList.add("cl-splash-active");

      await wait(HOLD_MS);
      if (cancelled) return;

      const target = await waitForLogo(TARGET_WAIT_MS);
      const mark = markRef.current;
      if (cancelled) return;

      if (!target || !mark) {
        setPhase("fade");
        await wait(FADE_MS);
        finish();
        return;
      }

      setPhase("morph");
      await morphMarkToLogo(mark, target, MORPH_MS);
      if (cancelled) return;

      // Handoff immédiat : pas de fade sur un fond opaque (évite l’écran noir)
      finish();
    };

    void run();

    return () => {
      cancelled = true;
      document.body.classList.remove("cl-splash-active");
    };
  }, []);

  if (phase === "idle" || phase === "done") return null;

  const clearBg = phase === "morph" || phase === "fade";

  return (
    <div
      className={[
        "cl-splash",
        clearBg ? "cl-splash--clear" : "",
        phase === "fade" ? "cl-splash--exit" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="presentation"
      aria-hidden="true"
    >
      <div className="cl-splash__glow" />
      {/* Identique au <Logo /> : flex row, h-8, text-lg, Space Grotesk */}
      <div
        ref={markRef}
        className={`cl-splash__mark cl-splash__mark--brand flex items-center gap-2 ${phase === "show" ? "cl-splash__mark--enter" : ""}`}
      >
        <img
          src={logoAsset.url}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-xl"
          draggable={false}
        />
        <span className="font-display text-lg font-bold tracking-tight">CollabLand</span>
      </div>
    </div>
  );
}
