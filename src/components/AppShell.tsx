import { Link } from "@tanstack/react-router";
import { FolderKanban, Home, Plus, Settings, User, Users } from "lucide-react";
import logoAsset from "@/assets/collabland-logo.png.asset.json";
import type { ReactNode } from "react";
import { useMe } from "@/hooks/use-me";
import { NotificationBell } from "./NotificationBell";
import { UserAvatar } from "./UserAvatar";

export function Logo({ to = "/feed" }: { to?: "/" | "/feed" }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <img src={logoAsset.url} alt="CollabLand" className="h-8 w-8 rounded-xl" width={32} height={32} />
      <span className="font-display text-lg font-bold tracking-tight">CollabLand</span>
    </Link>
  );
}

const navCls = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground";
const activeCls = { className: "bg-sidebar-accent !text-foreground" };

export function AppShell({ children }: { children: ReactNode }) {
  const { uid, profile } = useMe();
  const username = profile?.username ?? "";
  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1">
          <Link to="/feed" className={navCls} activeProps={activeCls}><Home className="h-4 w-4" />Accueil</Link>
          <Link to="/projects" className={navCls} activeProps={activeCls}><FolderKanban className="h-4 w-4" />Projets</Link>
          <Link to="/friends" className={navCls} activeProps={activeCls}><Users className="h-4 w-4" />Amis</Link>
          {username && (
            <Link to="/u/$username" params={{ username }} className={navCls} activeProps={activeCls}><User className="h-4 w-4" />Ma vitrine</Link>
          )}
        </nav>
        <Link to="/projects/new" className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
          <Plus className="h-4 w-4" />Nouveau projet
        </Link>
        <div className="mt-auto flex items-center gap-2 rounded-lg p-2">
          <UserAvatar profile={profile} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.display_name || username}</p>
            <p className="truncate text-xs text-muted-foreground">@{username}</p>
          </div>
          <Link
            to="/settings"
            aria-label="Paramètres"
            title="Paramètres"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
            activeProps={{ className: "!text-primary bg-sidebar-accent" }}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl lg:ml-60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <NotificationBell uid={uid ?? undefined} />
            <Link to="/settings" className="lg:hidden"><UserAvatar profile={profile} className="h-8 w-8" /></Link>
          </div>
        </div>
      </header>

      <main className="pb-24 lg:ml-60 lg:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <Link to="/feed" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary" }}><Home className="h-5 w-5" />Accueil</Link>
        <Link to="/projects" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary" }}><FolderKanban className="h-5 w-5" />Projets</Link>
        <Link to="/projects/new" className="flex items-center justify-center"><span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></span></Link>
        <Link to="/friends" className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary" }}><Users className="h-5 w-5" />Amis</Link>
        {username ? (
          <Link to="/u/$username" params={{ username }} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary" }}><User className="h-5 w-5" />Vitrine</Link>
        ) : <span />}
      </nav>
    </div>
  );
}
