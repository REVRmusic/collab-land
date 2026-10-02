import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, GitBranch, ImagePlus, Layers, LifeBuoy, Lock, MessageCircle, Palette, Plus, Star, Trash2, Users } from "lucide-react";
import { linkHost, cleanLink } from "@/lib/links";
import { EditProjectDialog, EditVersionDialog } from "@/components/project/EditProjectDialog";
import { ProjectInviteDialog } from "@/components/project/ProjectInviteDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { compressImage, extOf, removeFiles, timeAgo, uploadFile } from "@/lib/media";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { CoverImage, UserAvatar } from "@/components/UserAvatar";
import { TrackPlayer } from "@/components/TrackPlayer";
import { Discussion } from "@/components/project/Discussion";
import { NewVersionDialog } from "@/components/project/NewVersionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({
    meta: [
      { title: "Projet — CollabLand" },
      { name: "description", content: "Versions, discussion et covers d'un projet partagé." },
      { property: "og:title", content: "Projet — CollabLand" },
      { property: "og:description", content: "Versions, discussion et covers d'un projet partagé." },
    ],
  }),
  component: ProjectPage,
});

type Prof = { id: string; username: string; display_name: string | null; avatar_url: string | null };

function ProjectPage() {
  const { id } = Route.useParams();
  const { uid } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileDiscussionOpen, setMobileDiscussionOpen] = useState(false);

  const project = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*,owner:profiles!projects_owner_id_fkey(id,username,display_name,avatar_url),project_members(user:profiles(id,username,display_name,avatar_url))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as (typeof data & { owner: Prof; project_members: { user: Prof }[] }) | null;
    },
  });
  const versions = useQuery({
    queryKey: ["versions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_versions")
        .select("*,author:profiles!project_versions_author_id_fkey(id,username,display_name,avatar_url)")
        .eq("project_id", id)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; version_number: number; title: string | null; notes: string | null; download_url: string | null; stems_url: string | null; audio_url: string; peaks: number[] | null; duration: number | null; created_at: string; author: Prof }[];
    },
  });

  if (project.isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  const p = project.data;
  if (!p) return <p className="text-muted-foreground">Ce projet n'existe pas ou ne t'est pas partagé.</p>;
  const latest = versions.data?.[0];
  const isOwner = uid === p.owner_id;

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 sm:p-6" style={{ backgroundImage: "var(--gradient-glow)" }}>
        <div className="flex flex-col gap-5 md:flex-row">
          <CoverImage path={p.cover_url} className="aspect-square w-full rounded-2xl md:w-56" />
          <div className="flex min-w-0 flex-1 flex-col">
            <Link to="/u/$username" params={{ username: p.owner.username }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <UserAvatar profile={p.owner} className="h-6 w-6" />{p.owner.display_name || p.owner.username}
            </Link>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{p.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {p.genre && <span className="rounded-full bg-secondary px-3 py-1"># {p.genre}</span>}
              {p.bpm && <span className="rounded-full bg-secondary px-3 py-1">{p.bpm} BPM</span>}
              {p.musical_key && <span className="rounded-full bg-secondary px-3 py-1">{p.musical_key}</span>}
              {latest && <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">V{latest.version_number}</span>}
              <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
                {p.visibility === "selected" ? <><Lock className="h-3 w-3" />Collaborateurs choisis</> : <><Users className="h-3 w-3" />Tous les amis</>}
              </span>
            </div>
            {p.help_needed && (
              <div className="mt-3 flex max-w-2xl items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
                <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span><span className="font-semibold text-primary">Besoin d'aide : </span>{p.help_needed}</span>
              </div>
            )}
            {p.description && <p className="mt-3 max-w-2xl text-sm text-foreground/80">{p.description}</p>}
            <div className="mt-auto pt-5">
              {latest && <TrackPlayer path={latest.audio_url} peaks={latest.peaks} duration={latest.duration} height={84} versionId={latest.id} projectId={id} />}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {latest?.download_url && (
            <a href={latest.download_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Download className="h-4 w-4" />Projet V{latest.version_number} · {linkHost(latest.download_url)}
            </a>
          )}
          {latest?.stems_url && (
            <a href={latest.stems_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold hover:bg-accent">
              <Layers className="h-4 w-4 text-primary" />STEMS V{latest.version_number} · {linkHost(latest.stems_url)}
            </a>
          )}
          {uid && !isOwner && latest && !latest.stems_url && (
            <StemRequestButton projectId={id} uid={uid} versionId={latest.id} versionNumber={latest.version_number} />
          )}
          {uid && <NewVersionDialog projectId={id} uid={uid} trigger={<Button variant="secondary"><Plus className="h-4 w-4" />Nouvelle version</Button>} />}
          {isOwner && (
            <ConfirmDelete title="Supprimer ce projet ?" description="Versions, covers, discussion et demandes de STEMS seront supprimés définitivement." onConfirm={async () => {
              const audio = (versions.data ?? []).filter((v) => v.author.id === uid).map((v) => v.audio_url);
              const { error } = await supabase.from("projects").delete().eq("id", id);
              if (error) { toast.error("Suppression impossible"); return; }
              await removeFiles("audio", audio);
              toast.success("Projet supprimé");
              qc.invalidateQueries();
              navigate({ to: "/u/$username", params: { username: p.owner.username }, replace: true });
            }}>
              <Button variant="ghost" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" />Supprimer</Button>
            </ConfirmDelete>
          )}
          {isOwner && <ProjectInviteDialog projectId={id} />}
          {isOwner && uid && <EditProjectDialog project={p} uid={uid} memberIds={p.project_members.map((m) => m.user.id)} onSaved={() => qc.invalidateQueries()} />}
          {p.project_members.length > 0 && (
            <div className="ml-auto flex items-center -space-x-2">
              {p.project_members.map((m) => <UserAvatar key={m.user.id} profile={m.user} className="h-8 w-8 ring-2 ring-card" />)}
            </div>
          )}
        </div>
      </section>

      {isOwner && <StemRequests projectId={id} versions={versions.data ?? []} />}

      <Tabs defaultValue="discussion" className="mt-6">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="discussion" onClick={() => { if (isMobile) setMobileDiscussionOpen(true); }}><MessageCircle className="h-4 w-4" />Discussion</TabsTrigger>
          <TabsTrigger value="versions"><GitBranch className="h-4 w-4" />Versions ({versions.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="covers"><Palette className="h-4 w-4" />Covers</TabsTrigger>
        </TabsList>
        <TabsContent value="discussion" className="mt-4">
          {uid && (
            <>
              <Button className="h-12 w-full md:hidden" onClick={() => setMobileDiscussionOpen(true)}>
                <MessageCircle className="h-4 w-4" />Ouvrir la discussion
              </Button>
              <Discussion projectId={id} uid={uid} projectTitle={p.title} mobileOpen={mobileDiscussionOpen} onMobileClose={() => setMobileDiscussionOpen(false)} />
            </>
          )}
        </TabsContent>
        <TabsContent value="versions" className="mt-4">
          <ol className="relative space-y-4 border-l border-border pl-6">
            {versions.data?.map((v, i) => (
              <li key={v.id} className="relative">
                <span className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-background ${i === 0 ? "bg-primary" : "bg-muted-foreground"}`} />
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-display text-lg font-bold">V{v.version_number}</span>
                    {v.title && <span className="font-medium">{v.title}</span>}
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserAvatar profile={v.author} className="h-4 w-4" />{v.author.display_name || v.author.username} · {timeAgo(v.created_at)}</span>
                    {i === 0 && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">Dernière</span>}
                    {(isOwner || v.author.id === uid) && (
                      <span className="ml-auto"><EditVersionDialog version={v} onSaved={() => { qc.invalidateQueries({ queryKey: ["versions", id] }); }} /></span>
                    )}
                    {(isOwner || v.author.id === uid) && (versions.data?.length ?? 0) > 1 && (
                      <ConfirmDelete title={`Supprimer la V${v.version_number} ?`} description="La version et son message dans la discussion seront supprimés." onConfirm={async () => {
                        const { error } = await supabase.from("project_versions").delete().eq("id", v.id);
                        if (error) { toast.error(error.message.includes("seule version") ? "Impossible de supprimer la seule version" : "Suppression impossible"); return; }
                        if (v.author.id === uid) await removeFiles("audio", [v.audio_url]);
                        toast.success("Version supprimée");
                        qc.invalidateQueries({ queryKey: ["versions", id] });
                        qc.invalidateQueries({ queryKey: ["messages", id] });
                      }}>
                        <button className="ml-auto grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-destructive" aria-label={`Supprimer la V${v.version_number}`}><Trash2 className="h-4 w-4" /></button>
                      </ConfirmDelete>
                    )}
                  </div>
                  <TrackPlayer path={v.audio_url} peaks={v.peaks} duration={v.duration} size="sm" height={60} versionId={v.id} projectId={id} />
                  {v.notes && <p className="mt-3 text-sm text-foreground/80">{v.notes}</p>}
                  {v.download_url && (
                    <a href={v.download_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent">
                      <Download className="h-3.5 w-3.5" />Projet V{v.version_number} · {linkHost(v.download_url)}
                    </a>
                  )}
                  {v.stems_url && (
                    <a href={v.stems_url} target="_blank" rel="noreferrer" className="mt-3 ml-2 inline-flex items-center gap-2 rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
                      <Layers className="h-3.5 w-3.5" />STEMS V{v.version_number} · {linkHost(v.stems_url)}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </TabsContent>
        <TabsContent value="covers" className="mt-4">{uid && <Covers projectId={id} uid={uid} isOwner={isOwner} currentCover={p.cover_url} />}</TabsContent>
      </Tabs>
    </div>
  );
}

function StemRequestButton({ projectId, uid, versionId, versionNumber }: { projectId: string; uid: string; versionId: string; versionNumber: number }) {
  const qc = useQueryClient();
  const key = ["my-stem", projectId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => (await supabase.from("stem_requests").select("*").eq("project_id", projectId).eq("requester_id", uid).maybeSingle()).data,
  });
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  if (data)
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground">
        <Layers className="h-4 w-4" />STEMS : {data.status === "pending" ? "demande envoyée" : data.status === "accepted" ? "acceptée" : "refusée"}
      </span>
    );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Layers className="h-4 w-4" />Demander les STEMS</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Demander les STEMS de la V{versionNumber}</DialogTitle></DialogHeader>
        <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Explique ce que tu veux en faire (remix, édit, collab…)" rows={4} />
        <Button
          onClick={async () => {
            const { error } = await supabase.from("stem_requests").insert({ project_id: projectId, requester_id: uid, version_id: versionId, message: msg.trim() || null });
            if (error) { toast.error("Demande impossible"); return; }
            toast.success("Demande envoyée");
            setOpen(false);
            qc.invalidateQueries({ queryKey: key });
          }}
        >
          Envoyer la demande
        </Button>
      </DialogContent>
    </Dialog>
  );
}

type VersionLite = { id: string; version_number: number; stems_url: string | null };

function StemRequests({ projectId, versions }: { projectId: string; versions: VersionLite[] }) {
  const qc = useQueryClient();
  const [share, setShare] = useState<{ versionId: string; versionNumber: number; stemsUrl: string | null } | null>(null);
  const [stemsLink, setStemsLink] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["stems", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("stem_requests")
        .select("id,status,message,created_at,version_id,requester:profiles!stem_requests_requester_id_fkey(id,username,display_name,avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as { id: string; status: string; message: string | null; created_at: string; version_id: string | null; requester: Prof }[];
    },
  });
  const pending = (data ?? []).filter((r) => r.status === "pending");
  if (!pending.length && !share) return null;

  const versionLabel = (versionId: string | null) => {
    const v = versions.find((x) => x.id === versionId) ?? versions[0];
    return v ? `V${v.version_number}` : null;
  };

  const openShareFor = (versionId: string | null) => {
    const v = versions.find((x) => x.id === versionId) ?? versions[0];
    if (!v) { toast.success("Demande acceptée"); return; }
    setStemsLink(v.stems_url ?? "");
    setShare({ versionId: v.id, versionNumber: v.version_number, stemsUrl: v.stems_url });
  };

  const answer = async (r: { id: string; version_id: string | null }, status: "accepted" | "declined") => {
    const { error } = await supabase.from("stem_requests").update({ status }).eq("id", r.id);
    if (error) { toast.error("Mise à jour impossible"); return; }
    qc.invalidateQueries({ queryKey: ["stems", projectId] });
    if (status === "accepted") openShareFor(r.version_id);
    else toast.success("Demande refusée");
  };

  const saveStems = async () => {
    if (!share) return;
    let stems_url: string | null;
    try {
      stems_url = cleanLink(stemsLink);
    } catch (e) { toast.error((e as Error).message); return; }
    if (!stems_url) { toast.error("Colle un lien https:// pour les STEMS"); return; }
    setBusy(true);
    const { error } = await supabase.from("project_versions").update({ stems_url }).eq("id", share.versionId);
    setBusy(false);
    if (error) { toast.error("Enregistrement du lien impossible"); return; }
    toast.success(`Lien STEMS ajouté sur la V${share.versionNumber}`);
    setShare(null);
    setStemsLink("");
    qc.invalidateQueries({ queryKey: ["versions", projectId] });
    qc.invalidateQueries({ queryKey: ["project", projectId] });
  };

  return (
    <>
      {pending.length > 0 && (
        <section className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <h2 className="flex items-center gap-2 font-semibold"><Layers className="h-4 w-4 text-primary" />Demandes de STEMS</h2>
          <div className="mt-3 space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 rounded-xl bg-card p-3 sm:flex-row sm:items-center">
                <UserAvatar profile={r.requester} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {r.requester.display_name || r.requester.username}
                    {versionLabel(r.version_id) && <span className="ml-2 text-muted-foreground">· {versionLabel(r.version_id)}</span>}
                  </p>
                  {r.message && <p className="text-sm text-muted-foreground">{r.message}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => answer(r, "accepted")}>Accepter</Button>
                  <Button size="sm" variant="secondary" onClick={() => answer(r, "declined")}>Refuser</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!share} onOpenChange={(o) => { if (!o) setShare(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager les STEMS de la V{share?.versionNumber}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            La demande est acceptée. Colle le lien des stems pour cette version : il sera visible pour les collaborateurs.
          </p>
          <div className="space-y-1.5">
            <Label>Lien des STEMS</Label>
            <Input
              type="url"
              value={stemsLink}
              onChange={(e) => setStemsLink(e.target.value)}
              placeholder="WeTransfer, SwissTransfer, Drive, Dropbox, iCloud…"
              maxLength={2000}
              autoFocus
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setShare(null)}>Plus tard</Button>
            <Button disabled={busy} onClick={saveStems}>{busy ? "Enregistrement…" : "Publier le lien"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


function Covers({ projectId, uid, isOwner, currentCover }: { projectId: string; uid: string; isOwner: boolean; currentCover: string | null }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("");
  const { data } = useQuery({
    queryKey: ["covers", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("covers")
        .select("id,image_url,caption,created_at,author_id,author:profiles!covers_author_id_fkey(id,username,display_name,avatar_url)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as { id: string; image_url: string; caption: string | null; created_at: string; author_id: string; author: Prof }[];
    },
  });
  const upload = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const img = await compressImage(f);
      const path = await uploadFile("covers", img, img.type === "image/jpeg" ? "jpg" : extOf(f, "jpg"));
      const { error } = await supabase.from("covers").insert({ project_id: projectId, author_id: uid, image_url: path, caption: caption || null });
      if (error) throw error;
      setCaption("");
      qc.invalidateQueries({ queryKey: ["covers", projectId] });
      toast.success("Cover proposée");
    } catch {
      toast.error("Envoi impossible");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Une note sur ton artwork (optionnel)" className="flex-1" />
        <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ${busy ? "opacity-50" : ""}`}>
          <ImagePlus className="h-4 w-4" />{busy ? "Envoi…" : "Proposer une cover"}
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        {data?.map((c) => (
          <figure key={c.id} className="group overflow-hidden rounded-2xl border border-border bg-card">
            <div className="relative">
              <CoverImage path={c.image_url} className="aspect-square w-full" />
              {currentCover === c.image_url && (
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground"><Star className="h-3 w-3 fill-current" />Principale</span>
              )}
            </div>
            <figcaption className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><UserAvatar profile={c.author} className="h-5 w-5" />{c.author.display_name || c.author.username}</div>
              {c.caption && <p className="mt-1 text-sm">{c.caption}</p>}
              <div className="mt-2 flex gap-1">
                {isOwner && currentCover !== c.image_url && (
                  <Button size="sm" variant="secondary" onClick={async () => {
                    const { error } = await supabase.from("projects").update({ cover_url: c.image_url }).eq("id", projectId);
                    if (error) { toast.error("Impossible de définir la cover principale"); return; }
                    toast.success("Cover principale mise à jour");
                    qc.invalidateQueries();
                  }}>Définir principale</Button>
                )}
                {(isOwner || c.author_id === uid) && (
                  <ConfirmDelete title="Supprimer cette cover ?" onConfirm={async () => {
                    const { error } = await supabase.from("covers").delete().eq("id", c.id);
                    if (error) { toast.error("Suppression impossible"); return; }
                    if (currentCover === c.image_url) await supabase.from("projects").update({ cover_url: null }).eq("id", projectId);
                    if (c.author_id === uid) await removeFiles("covers", [c.image_url]);
                    toast.success("Cover supprimée");
                    qc.invalidateQueries();
                  }}>
                    <Button size="sm" variant="ghost" aria-label="Supprimer la cover"><Trash2 className="h-4 w-4" /></Button>
                  </ConfirmDelete>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
