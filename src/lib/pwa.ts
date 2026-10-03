/** Register the PWA service worker (production / https only). */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isLocal && location.protocol !== "https:") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent: installability degrades gracefully without SW on some hosts
    });
  });
}
