import { useEffect, useState } from "react";
import logoAsset from "@/assets/collabland-logo.png.asset.json";

const SESSION_KEY = "cl-splash-v1";
const HOLD_MS = 900;
const EXIT_MS = 480;

/**
 * Court splash au froid démarrage (onglet / PWA).
 * Une fois par session navigateur — pas à chaque navigation interne.
 */
export function AppSplash() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      /* private mode */
    }

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      return;
    }

    setVisible(true);

    const exitTimer = window.setTimeout(() => setExiting(true), HOLD_MS);
    const doneTimer = window.setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    }, HOLD_MS + EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`cl-splash ${exiting ? "cl-splash--exit" : ""}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="cl-splash__glow" />
      <div className="cl-splash__mark">
        <img
          src={logoAsset.url}
          alt=""
          width={88}
          height={88}
          className="cl-splash__logo"
          draggable={false}
        />
        <p className="cl-splash__wordmark">CollabLand</p>
      </div>
    </div>
  );
}
