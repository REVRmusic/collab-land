/** Register the PWA service worker (production / https only). */
function canUseServiceWorker(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isLocal && location.protocol !== "https:") return false;
  return true;
}

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

function registerNow(): Promise<ServiceWorkerRegistration | null> {
  if (!canUseServiceWorker()) return Promise.resolve(null);
  return navigator.serviceWorker.register("/sw.js").catch((err) => {
    console.warn("[pwa] service worker registration failed:", err);
    return null;
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(t);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(t);
        reject(err);
      },
    );
  });
}

/**
 * Fire-and-forget registration (call from app boot).
 * If `load` already fired (SPA / PWA), register immediately — waiting only on `load`
 * made push status hang forever on "Vérification…".
 */
export function registerServiceWorker() {
  if (!canUseServiceWorker()) return;
  if (registrationPromise) return;

  if (document.readyState === "complete") {
    registrationPromise = registerNow();
    return;
  }

  registrationPromise = new Promise((resolve) => {
    window.addEventListener(
      "load",
      () => {
        void registerNow().then(resolve);
      },
      { once: true },
    );
  });
}

/** Await an active service worker registration (for Web Push). */
export async function ensureServiceWorkerRegistration(
  timeoutMs = 12_000,
): Promise<ServiceWorkerRegistration> {
  if (!canUseServiceWorker()) {
    throw new Error("Service worker indisponible.");
  }

  if (!registrationPromise) {
    registrationPromise = registerNow();
  }

  const reg = await withTimeout(
    registrationPromise,
    timeoutMs,
    "Délai dépassé en attendant le service worker.",
  );
  if (!reg) throw new Error("Enregistrement du service worker impossible.");

  await withTimeout(
    navigator.serviceWorker.ready,
    timeoutMs,
    "Délai dépassé pendant l’activation du service worker.",
  );
  return reg;
}
