/** Public VAPID key (safe to expose in the client). Private key stays server-only. */
export const VAPID_PUBLIC_KEY =
  "BFqxxZFQiEie28e9tkPUPhWzGhwwRmPYePWCdbC85UiDM6rZzKLxbXsJeDYbUA8JLul4Q7Mcf9oZcO_DwNVaHrI";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function notifPlainText(type: string, data: Record<string, unknown> | null | undefined, actorName?: string | null) {
  const who = actorName || "Quelqu'un";
  const t = (data?.["title"] as string) || "un projet";
  switch (type) {
    case "new_project":
      return { title: "Nouveau projet", body: `${who} a partagé « ${t} »` };
    case "new_version":
      return { title: "Nouvelle version", body: `${who} a publié la V${String(data?.["version"] ?? "")} de « ${t} »` };
    case "new_message":
      return {
        title: data?.["kind"] === "voice" ? "Nouveau vocal" : "Nouveau message",
        body: `${who} a ${data?.["kind"] === "voice" ? "envoyé un vocal" : "écrit"} dans « ${t} »`,
      };
    case "new_cover":
      return { title: "Nouvelle cover", body: `${who} a proposé une cover pour « ${t} »` };
    case "friend_request":
      return { title: "Demande d'ami", body: `${who} veut t'ajouter en ami` };
    case "friend_accepted":
      return { title: "Ami accepté", body: `${who} a accepté ta demande d'ami` };
    case "stem_request":
      return { title: "Demande de STEMS", body: `${who} demande les STEMS de « ${t} »` };
    case "stem_accepted":
      return { title: "STEMS acceptés", body: `${who} a accepté ta demande de STEMS pour « ${t} »` };
    case "stem_declined":
      return { title: "STEMS refusés", body: `${who} a refusé ta demande de STEMS pour « ${t} »` };
    default:
      return { title: "CollabLand", body: "Nouvelle activité" };
  }
}
