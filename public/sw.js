/* Minimal service worker — installability + Web Push notifications. */
const CACHE = "collabland-shell-v1";
const PRECACHE = ["/", "/manifest.webmanifest", "/favicon.png", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_serverFn") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/") || caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok && (url.pathname.startsWith("/icons/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".css"))) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "CollabLand", body: "Nouvelle activité", url: "/notifications", tag: "collabland", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      const text = event.data?.text();
      if (text) data.body = text;
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "CollabLand", {
      body: data.body,
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/icon-192.png",
      tag: data.tag || "collabland",
      data: { url: data.url || "/notifications" },
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
