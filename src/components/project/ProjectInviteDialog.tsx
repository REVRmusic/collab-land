import { useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProjectInviteDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async (rotate = false) => {
    setBusy(true);
    try {
      if (rotate) {
        const { error } = await supabase.rpc("revoke_project_invite", { _project_id: projectId });
        if (error) throw error;
      }
      const { data, error } = await supabase.rpc("get_or_create_project_invite", { _project_id: projectId });
      if (error) throw error;
      setLink(`${window.location.origin}/invite/${data as string}`);
      if (rotate) toast.success("Nouveau lien généré");
    } catch (e) {
      toast.error((e as Error).message || "Impossible de créer le lien");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien d'invitation copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) load(); }}>
      <DialogTrigger asChild>
        <Button variant="secondary"><Link2 className="h-4 w-4" />Inviter par lien</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter hors de ton cercle</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Envoie ce lien à un mixeur, un featuré ou un collab. La personne n’a pas besoin d’être ton ami : après connexion, elle devient collaboratrice du projet.
        </p>
        <div className="space-y-1.5">
          <Label>Lien d'invitation</Label>
          <Input readOnly value={link} placeholder={busy ? "Génération…" : ""} onFocus={(e) => e.target.select()} />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => load(true)}>
            <RefreshCw className="h-4 w-4" />Régénérer
          </Button>
          <Button type="button" disabled={busy || !link} onClick={copy}>Copier le lien</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
