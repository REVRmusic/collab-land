import { useState } from "react";
import { Lock, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFriends } from "@/hooks/use-friends";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cleanLink } from "@/lib/links";

type P = {
  id: string; title: string; genre: string | null; bpm: number | null; musical_key: string | null;
  description: string | null; help_needed: string | null; download_url: string | null; visibility: string;
};

export function EditProjectDialog({ project, uid, memberIds, onSaved }: { project: P; uid: string; memberIds: string[]; onSaved: () => void }) {
  const friends = useFriends(uid);
  const [open, setOpen] = useState(false);
  const init = () => ({
    title: project.title, genre: project.genre ?? "", bpm: project.bpm?.toString() ?? "", musical_key: project.musical_key ?? "",
    description: project.description ?? "", help_needed: project.help_needed ?? "",
  });
  const [f, setF] = useState(init);
  const [visibility, setVisibility] = useState(project.visibility as "friends" | "selected");
  const [selected, setSelected] = useState<string[]>(memberIds);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.title.trim()) { toast.error("Le titre est obligatoire"); return; }
    if (visibility === "selected" && selected.length === 0) { toast.error("Choisis au moins un ami"); return; }
    setBusy(true);
    const { error } = await supabase.from("projects").update({
      title: f.title.trim(), genre: f.genre || null, bpm: f.bpm ? parseInt(f.bpm) : null, musical_key: f.musical_key || null,
      description: f.description || null, help_needed: f.help_needed.trim() || null,
      visibility, updated_at: new Date().toISOString(),
    }).eq("id", project.id);
    if (error) { setBusy(false); toast.error("Enregistrement impossible"); return; }
    const want = visibility === "selected" ? selected : [];
    const toRemove = memberIds.filter((m) => !want.includes(m));
    const toAdd = want.filter((m) => !memberIds.includes(m));
    if (toRemove.length) await supabase.from("project_members").delete().eq("project_id", project.id).in("user_id", toRemove);
    if (toAdd.length) await supabase.from("project_members").insert(toAdd.map((user_id) => ({ project_id: project.id, user_id })));
    setBusy(false);
    setOpen(false);
    toast.success("Projet mis à jour");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setF(init()); setVisibility(project.visibility as "friends" | "selected"); setSelected(memberIds); } }}>
      <DialogTrigger asChild><Button variant="ghost"><Pencil className="h-4 w-4" />Modifier</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Modifier le projet</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Titre</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5"><Label>Genre</Label><Input value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>BPM</Label><Input type="number" value={f.bpm} onChange={(e) => setF({ ...f, bpm: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Tonalité</Label><Input value={f.musical_key} onChange={(e) => setF({ ...f, musical_key: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Besoin d'aide sur… (optionnel)</Label><Input value={f.help_needed} onChange={(e) => setF({ ...f, help_needed: e.target.value })} placeholder="Besoin d'un drop plus impactant" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Qui peut voir ce projet ?</Label>
            <div className="grid grid-cols-2 gap-2">
              {([["friends", Users, "Tous mes amis"], ["selected", Lock, "Amis choisis"]] as const).map(([v, Icon, t]) => (
                <button type="button" key={v} onClick={() => setVisibility(v)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${visibility === v ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                  <Icon className="h-4 w-4 text-primary" />{t}
                </button>
              ))}
            </div>
            {visibility === "selected" && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-1">
                {friends.data?.friends.length === 0 && <p className="p-3 text-sm text-muted-foreground">Aucun ami à inviter.</p>}
                {friends.data?.friends.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-accent">
                    <Checkbox checked={selected.includes(p.id)} onCheckedChange={(c) => setSelected((s) => (c ? [...s, p.id] : s.filter((x) => x !== p.id)))} />
                    <UserAvatar profile={p} className="h-7 w-7" />
                    <span className="text-sm">{p.display_name || p.username}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button className="w-full" disabled={busy} onClick={save}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EditVersionDialog({ version, onSaved }: { version: { id: string; version_number: number; title: string | null; notes: string | null; download_url: string | null; stems_url: string | null }; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [stemsLink, setStemsLink] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setTitle(version.title ?? ""); setNotes(version.notes ?? ""); setLink(version.download_url ?? ""); setStemsLink(version.stems_url ?? ""); } }}>
      <DialogTrigger asChild>
        <button className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={`Modifier la V${version.version_number}`}><Pencil className="h-4 w-4" /></button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Modifier la V{version.version_number}</DialogTitle></DialogHeader>
        <div className="space-y-1.5"><Label>Titre</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ce qui a changé…" /></div>
        <div className="space-y-1.5"><Label>Lien du projet complet</Label><Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Fichier FL Studio, Ableton, Logic…" maxLength={2000} /></div>
        <div className="space-y-1.5"><Label>Lien des STEMS</Label><Input type="url" value={stemsLink} onChange={(e) => setStemsLink(e.target.value)} placeholder="https://wetransfer.com/…" maxLength={2000} /></div>
        <Button onClick={async () => {
          let download_url: string | null;
          let stems_url: string | null;
          try {
            download_url = cleanLink(link);
            stems_url = cleanLink(stemsLink);
          } catch (e) { toast.error((e as Error).message); return; }
          const { error } = await supabase.from("project_versions").update({ title: title || null, notes: notes || null, download_url, stems_url }).eq("id", version.id);
          if (error) { toast.error("Enregistrement impossible"); return; }
          toast.success("Version mise à jour");
          setOpen(false);
          onSaved();
        }}>Enregistrer</Button>
      </DialogContent>
    </Dialog>
  );
}
