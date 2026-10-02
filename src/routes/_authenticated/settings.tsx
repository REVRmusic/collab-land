import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { extOf, uploadFile } from "@/lib/media";
import { UserAvatar } from "@/components/UserAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — Stemroom" },
      { name: "description", content: "Modifie ton nom d'utilisateur, ta photo et tes notifications." },
      { property: "og:title", content: "Paramètres — Stemroom" },
      { property: "og:description", content: "Modifie ton profil et tes notifications." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { uid, profile } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ username: "", display_name: "", bio: "", email_digest: true });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile)
      setForm({ username: profile.username, display_name: profile.display_name ?? "", bio: profile.bio ?? "", email_digest: profile.email_digest });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,24}$/.test(username)) { toast.error("Nom d'utilisateur : 3 à 24 caractères (lettres, chiffres, _ et .)"); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ ...form, username }).eq("id", uid!);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "Ce nom d'utilisateur est déjà pris" : "Enregistrement impossible"); return; }
    toast.success("Profil mis à jour");
    qc.invalidateQueries();
  };

  const onAvatar = async (f?: File) => {
    if (!f) return;
    try {
      const path = await uploadFile("avatars", f, extOf(f, "jpg"));
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", uid!);
      qc.invalidateQueries();
      toast.success("Photo mise à jour");
    } catch {
      toast.error("Envoi de la photo impossible");
    }
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold">Paramètres</h1>
      <form onSubmit={save} className="mt-6 space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="group relative">
            <UserAvatar profile={profile} className="h-20 w-20" />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-background/60 opacity-0 transition group-hover:opacity-100"><Camera className="h-5 w-5" /></span>
          </button>
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Changer la photo</Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onAvatar(e.target.files?.[0])} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nom d'utilisateur</Label>
          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Nom d'artiste</Label>
          <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Melodic techno, Paris…" />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-2 p-4">
          <div>
            <p className="font-medium">Résumé quotidien par email</p>
            <p className="text-sm text-muted-foreground">Un mail par jour avec les nouveautés de tes amis et projets.</p>
          </div>
          <Switch checked={form.email_digest} onCheckedChange={(v) => setForm({ ...form, email_digest: v })} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">Enregistrer</Button>
      </form>
      <Button variant="ghost" onClick={signOut} className="mt-4 w-full text-muted-foreground"><LogOut className="h-4 w-4" />Se déconnecter</Button>
    </div>
  );
}
