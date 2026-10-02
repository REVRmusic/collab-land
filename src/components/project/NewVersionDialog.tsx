import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computePeaks, extOf, uploadFile } from "@/lib/media";
import { compressAudio, AUDIO_ACCEPT } from "@/lib/audio-compress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Waveform } from "@/components/Waveform";

export function NewVersionDialog({ projectId, uid, trigger }: { projectId: string; uid: string; trigger: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [wave, setWave] = useState<{ peaks: number[]; duration: number } | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = async (f?: File) => {
    if (!f) return;
    setFile(f);
    setWave(await computePeaks(f));
  };

  const submit = async () => {
    if (!file) { toast.error("Ajoute un fichier audio"); return; }
    setBusy(true);
    try {
      const w = wave ?? (await computePeaks(file));
      const path = await compressAudio(file, (p) => toast.loading(`Compression… ${p} %`, { id: "compress" })).then((c) => { toast.dismiss("compress"); return uploadFile("audio", c.blob, c.ext); });
      const { data: v, error } = await supabase
        .from("project_versions")
        .insert({ project_id: projectId, author_id: uid, title: title || null, notes: notes || null, audio_url: path, peaks: w.peaks, duration: w.duration })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("messages").insert({ project_id: projectId, author_id: uid, kind: "version", version_id: v.id, body: notes || null });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["versions", projectId] });
      qc.invalidateQueries({ queryKey: ["messages", projectId] });
      toast.success("Nouvelle version publiée");
      setOpen(false);
      setFile(null);
      setWave(null);
      setTitle("");
      setNotes("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Publier une nouvelle version</DialogTitle></DialogHeader>
        <label className="block cursor-pointer rounded-xl border border-dashed border-border p-4 hover:border-primary/50">
          <input type="file" accept={AUDIO_ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
          {file ? (
            <>
              <p className="mb-2 truncate text-sm">{file.name}</p>
              <Waveform peaks={wave?.peaks ?? []} progress={0} height={56} />
            </>
          ) : (
            <span className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"><Upload className="h-4 w-4" />Choisir un fichier audio</span>
          )}
        </label>
        <div className="space-y-1.5"><Label>Titre (optionnel)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouveau drop, mix plus large…" /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ce qui a changé…" /></div>
        <Button onClick={submit} disabled={busy}>{busy ? "Envoi…" : "Publier"}</Button>
      </DialogContent>
    </Dialog>
  );
}
