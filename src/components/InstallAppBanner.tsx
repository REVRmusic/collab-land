import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "collabland-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Banner: Android/Chrome install prompt, or iOS “Add to Home Screen” tips. */
export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobile()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // iOS has no beforeinstallprompt — show Share tip after a short delay
    if (isIos()) {
      const t = window.setTimeout(() => {
        setShowIos(true);
        setVisible(true);
      }, 2500);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBip);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3 lg:bottom-4 lg:left-auto lg:right-4 lg:w-[22rem] lg:px-0">
      <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="" className="mt-0.5 h-11 w-11 rounded-xl" width={44} height={44} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Installer CollabLand</p>
            {showIos && !deferred ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Sur iPhone : appuie sur <Share className="mx-0.5 inline h-3.5 w-3.5" /> Partager, puis
                « Sur l’écran d’accueil ».
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Ajoute l’app sur ton téléphone pour un accès rapide, comme une vraie application.
              </p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {deferred && (
                <Button type="button" size="sm" onClick={install} className="h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" />Installer
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={dismiss} className="h-8">
                Plus tard
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
