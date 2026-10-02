import { cleanLink } from "@/lib/links";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImagePlus, Music, Users, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { compressImage, computePeaks, extOf, uploadFile } from "@/lib/media";
import { compressAudio, AUDIO_ACCEPT } from "@/lib/audio-compress";
import { useFriends } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import { Waveform } from "@/components/Waveform";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({
    meta: [
      { title: "Nouveau projet — CollabLand" },
      { name: "description", content: "Publie une démo et choisis avec qui la partager." },
      { property: "og:title", content: "Nouveau projet — CollabLand" },
      { property: "og:description", content: "Publie une démo et choisis avec qui la partager." },
    ],
  }),
  component: NewProject,
});

function NewProject() {
  const { uid } = useMe();
  const friends = useFriends(uid);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", genre: "", bpm: "", musical_key: "", description: "", help_needed: "", download_url: "", stems_url: "" });
  const [audio, setAudio] = useState<File | null>(null);
  const [wave, setWave] = useState<{ peaks: number[]; duration: number } | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<"friends" | "selected">("friends");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const pickAudio = async (file?: File) => {
    if (!file) return;
    setAudio(file);
    setWave(null);
    setWave(await computePeaks(file));
    if (!f.title) setF((s) => ({ ...s, title: file.name.replace(/\.[^.]+$/, "") }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audio || !uid) { toast.error("Ajoute un extrait audio"); return; }
    if (visibility === "selected" && selected.length === 0) { toast.error("Choisis au moins un ami"); return; }
    let download_url: string | null;
    let stems_url: string | null;
    try {
      download_url = cleanLink(f.download_url);
      stems_url = cleanLink(f.stems_url);
    } catch (err) { toast.error((err as Error).message); return; }
    setBusy(true);
    try {
      const w = wave ?? (await computePeaks(audio));
      const [audioPath, coverPath] = await Promise.all([
        compressAudio(audio, (p) => toast.loading(`Compression… ${p} %`, { id: "compress" })).then((c) => { toast.dismiss("compress"); return uploadFile("audio", c.blob, c.ext); }),
        cover ? compressImage(cover).then((b) => uploadFile("covers", b, b.type === "image/jpeg" ? "jpg" : extOf(cover, "jpg"))) : Promise.resolve(null),
      ]);
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          owner_id: uid,
          title: f.title,
          genre: f.genre || null,
          bpm: f.bpm ? parseInt(f.bpm) : null,
          musical_key: f.musical_key || null,
          description: f.description || null,
          help_needed: f.help_needed.trim() || null,
          cover_url: coverPath,
          visibility,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (visibility === "selected")
        await supabase.from("project_members").insert(selected.map((user_id) => ({ project_id: project.id, user_id })));
      await supabase.from("project_versions").insert({
        project_id: project.id,
        author_id: uid,
        title: "Démo",
        notes: "Première version",
        audio_url: audioPath,
        peaks: w.peaks,
        duration: w.duration,
        download_url,
        stems_url,
      });
      if (coverPath) await supabase.from("covers").insert({ project_id: project.id, author_id: uid, image_url: coverPath, caption: "Cover originale" });
      qc.invalidateQueries();
      toast.success("Projet publié");
      navigate({ to: "/projects/$id", params: { id: project.id } });
    } catch (err) {
      toast.dismiss("compress");
      toast.error((err as Error).message || "Publication impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Nouveau projet</h1>

      <label className="block cursor-pointer rounded-2xl border border-dashed border-border bg-card p-6 transition hover:border-primary/50">
        <input type="file" accept={AUDIO_ACCEPT} hidden onChange={(e) => pickAudio(e.target.files?.[0])} />
        {audio ? (
          <div>
            <p className="mb-3 truncate text-sm font-medium">{audio.name}</p>
            <Waveform peaks={wave?.peaks ?? []} progress={0} height={70} />
            {!wave && <p className="mt-2 text-xs text-muted-foreground">Analyse de la forme d'onde…</p>}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Music className="h-8 w-8 text-primary" />
            <p className="font-semibold">Ajoute l'extrait démo</p>
            <p className="text-sm text-muted-foreground">MP3, WAV, M4A… jusqu'à 50 Mo</p>
          </div>
        )}
      </label>

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <label className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-card">
          <input type="file" accept="image/*" hidden onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
          {cover ? <img src={URL.createObjectURL(cover)} alt="" className="absolute inset-0 h-full w-full object-cover" /> : (
            <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><ImagePlus className="h-6 w-6" />Cover</span>
          )}
        </label>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Titre</Label><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5"><Label>Genre</Label><Input value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })} placeholder="Melodic House" /></div>
            <div className="space-y-1.5"><Label>BPM</Label><Input type="number" value={f.bpm} onChange={(e) => setF({ ...f, bpm: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Tonalité</Label><Input value={f.musical_key} onChange={(e) => setF({ ...f, musical_key: e.target.value })} placeholder="A min" /></div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5"><Label>Besoin d'aide sur… (optionnel)</Label><Input value={f.help_needed} onChange={(e) => setF({ ...f, help_needed: e.target.value })} placeholder="Besoin d'un drop plus impactant" /></div>
      <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="space-y-1.5">
        <Label>Lien du projet complet de la V1 (optionnel)</Label>
        <Input type="url" value={f.download_url} onChange={(e) => setF({ ...f, download_url: e.target.value })} placeholder="Fichier FL Studio, Ableton, Logic…" maxLength={2000} />
      </div>
      <div className="space-y-1.5">
        <Label>Lien des STEMS de la V1 (optionnel)</Label>
        <Input type="url" value={f.stems_url} onChange={(e) => setF({ ...f, stems_url: e.target.value })} placeholder="WeTransfer, SwissTransfer, Google Drive, Dropbox, iCloud…" maxLength={2000} />
      </div>

      <div className="space-y-3">
        <Label>Qui peut voir ce projet ?</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["friends", Users, "Tous mes amis", "Visible par tout ton cercle"],
            ["selected", Lock, "Amis sélectionnés", "Seulement les collaborateurs choisis"],
          ] as const).map(([v, Icon, t, d]) => (
            <button type="button" key={v} onClick={() => setVisibility(v)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${visibility === v ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
              <Icon className="mt-0.5 h-5 w-5 text-primary" />
              <span><span className="block font-semibold">{t}</span><span className="text-sm text-muted-foreground">{d}</span></span>
            </button>
          ))}
        </div>
        {visibility === "selected" && (
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-2">
            {friends.data?.friends.length === 0 && <p className="p-3 text-sm text-muted-foreground">Tu n'as pas encore d'amis à inviter.</p>}
            {friends.data?.friends.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-accent">
                <Checkbox checked={selected.includes(p.id)} onCheckedChange={(c) => setSelected((s) => (c ? [...s, p.id] : s.filter((x) => x !== p.id)))} />
                <UserAvatar profile={p} className="h-8 w-8" />
                <span className="text-sm font-medium">{p.display_name || p.username}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={busy} className="h-12 w-full text-base">{busy ? "Publication…" : "Publier le projet"}</Button>
    </form>
  );
}
