import { useMediaUrl } from "@/lib/media";

type P = { avatar_url?: string | null; username?: string | null; display_name?: string | null } | null | undefined;

export function UserAvatar({ profile, className = "h-9 w-9" }: { profile: P; className?: string }) {
  const url = useMediaUrl("avatars", profile?.avatar_url);
  const letter = (profile?.display_name || profile?.username || "?").charAt(0).toUpperCase();
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-full bg-surface-2 ring-1 ring-border`}>
      {url ? (
        <img src={url} alt={profile?.username ?? ""} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/40 to-voice/40 font-display text-sm font-semibold">
          {letter}
        </div>
      )}
    </div>
  );
}

export function CoverImage({ path, className = "" }: { path?: string | null; className?: string }) {
  const url = useMediaUrl("covers", path);
  return (
    <div className={`overflow-hidden bg-surface-2 ${className}`}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,var(--primary),transparent_55%),radial-gradient(circle_at_80%_90%,var(--voice),transparent_50%)] opacity-60" />
      )}
    </div>
  );
}
