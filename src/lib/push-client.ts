import { supabase } from "@/integrations/supabase/client";
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from "@/lib/push-shared";
import { ensureServiceWorkerRegistration } from "@/lib/pwa";

export type PushSupport = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
};

export function pushUnsupportedReason(): string | null {
  if (typeof window === "undefined") return "unavailable";
  if (!("Notification" in window)) return "Ce navigateur ne gère pas les notifications.";
  if (!("serviceWorker" in navigator)) return "Service worker indisponible.";
  if (!("PushManager" in window)) {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const win = window as Window & { matchMedia: (q: string) => MediaQueryList };
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = win.matchMedia("(display-mode: standalone)").matches || Boolean(nav.standalone);
    if (isIos && !standalone) {
      return "Sur iPhone : ajoute d’abord CollabLand à l’écran d’accueil (Partager → Sur l’écran d’accueil), puis réactive les notifications.";
    }
    return "Les notifications push ne sont pas disponibles ici.";
  }
  return null;
}

async function ensureWorker() {
  return ensureServiceWorkerRegistration();
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (pushUnsupportedReason()) return null;
  const reg = await ensureWorker();
  return reg.pushManager.getSubscription();
}

export async function getPushStatus(): Promise<PushSupport> {
  const reason = pushUnsupportedReason();
  if (reason) return { supported: false, permission: "unsupported", subscribed: false };
  try {
    const sub = await getPushSubscription();
    return {
      supported: true,
      permission: Notification.permission,
      subscribed: !!sub,
    };
  } catch {
    return {
      supported: true,
      permission: Notification.permission,
      subscribed: false,
    };
  }
}

export async function enablePushNotifications(): Promise<{ ok: boolean; error?: string }> {
  const reason = pushUnsupportedReason();
  if (reason) return { ok: false, error: reason };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, error: "Permission refusée. Tu peux la réactiver dans les réglages du navigateur." };
    }

    const reg = await ensureWorker();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const p256dh = json.keys?.["p256dh"];
    const auth = json.keys?.["auth"];
    if (!json.endpoint || !p256dh || !auth) {
      return { ok: false, error: "Abonnement push invalide." };
    }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return { ok: false, error: "Non connecté." };

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: uid,
        endpoint: json.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent.slice(0, 300),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) return { ok: false, error: error.message };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Activation impossible" };
  }
}

export async function disablePushNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (pushUnsupportedReason()) return { ok: true };
  try {
    const reg = await ensureWorker();
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => undefined);
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Désactivation impossible" };
  }
}
