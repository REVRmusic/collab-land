import { useEffect, useRef, useState } from "react";
import logoAsset from "@/assets/collabland-logo.png.asset.json";

const SESSION_KEY = "cl-splash-v2";
const HOLD_MS = 720;
const MORPH_MS = 680;
const FADE_MS = 220;
const TARGET_WAIT_MS = 900;

type Phase = "idle" | "show" | "morph" | "fade" | "done";

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode */
  }
}

function pickVisible(selector: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return (
    nodes.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width >= 8 && r.height >= 8;
    }) ?? null
  );
}

async function waitForTargets(timeoutMs: number) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    const icon = pickVisible("[data-app-logo-icon]");
    const text = pickVisible("[data-app-logo-text]");
    if (icon && text) return { icon, text };
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return null;
}

function flyTo(el: HTMLElement, target: HTMLElement) {
  const first = el.getBoundingClientRect();
  const last = target.getBoundingClientRect();
  if (first.width < 1 || last.width < 1) return;

  el.style.position = "fixed";
  el.style.left = `${first.left}px`;
  el.style.top = `${first.top}px`;
  el.style.width = `${first.width}px`;
  el.style.height = `${first.height}px`;
  el.style.margin = "0";
  el.style.zIndex = "2";
  el.style.transformOrigin = "top left";
  el.style.willChange = "transform";
  // Cancel entrance keyframes so transform isn't overridden
  el.style.animation = "none";

  void el.offsetWidth;

  const dx = last.left - first.left;
  const dy = last.top - first.top;
  const sx = last.width / first.width;
  const sy = last.height / first.height;
  el.style.transition = `transform ${MORPH_MS}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${MORPH_MS}ms ease`;
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  el.style.borderRadius = getComputedStyle(target).borderRadius;
}

/**
 * Splash d’ouverture : logo + nom au centre, puis volent
 * vers le Logo réel (header mobile ou sidebar desktop).
 */
export function AppSplash() {
  const [phase, setPhase] = useState<Phase>("idle");
  const logoRef = useRef<HTMLImageElement>(null);
  const wordRef = useRef<HTMLParagraphElement>(null);

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

    setPhase("show");
    document.body.classList.add("cl-splash-active");

    let cancelled = false;
    const timers: number[] = [];

    const finish = () => {
      if (cancelled) return;
      document.body.classList.remove("cl-splash-active");
      markSeen();
      setPhase("done");
    };

    const run = async () => {
      await new Promise<void>((r) => {
        timers.push(window.setTimeout(r, HOLD_MS));
      });
      if (cancelled) return;

      const targets = await waitForTargets(TARGET_WAIT_MS);
      if (cancelled) return;

      if (!targets || !logoRef.current || !wordRef.current) {
        setPhase("fade");
        timers.push(window.setTimeout(finish, FADE_MS + 40));
        return;
      }

      setPhase("morph");
      flyTo(logoRef.current, targets.icon);
      flyTo(wordRef.current, targets.text);

      await new Promise<void>((r) => {
        timers.push(window.setTimeout(r, MORPH_MS));
      });
      if (cancelled) return;

      setPhase("fade");
      timers.push(window.setTimeout(finish, FADE_MS + 40));
    };

    void run();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      document.body.classList.remove("cl-splash-active");
    };
  }, []);

  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      className={[
        "cl-splash",
        phase === "morph" ? "cl-splash--morph" : "",
        phase === "fade" ? "cl-splash--exit" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="presentation"
      aria-hidden="true"
    >
      <div className="cl-splash__glow" />
      <div className="cl-splash__mark">
        <img
          ref={logoRef}
          src={logoAsset.url}
          alt=""
          width={88}
          height={88}
          className="cl-splash__logo"
          draggable={false}
        />
        <p ref={wordRef} className="cl-splash__wordmark">
          CollabLand
        </p>
      </div>
    </div>
  );
}
