import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Send, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminDigestStatsFn, triggerAdminDigestFn } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export function AdminDigestCard() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin-digest-stats"],
    queryFn: () => getAdminDigestStatsFn(),
    staleTime: 30_000,
  });

  const testMutation = useMutation({
    mutationFn: () => triggerAdminDigestFn({ data: { testOnly: true } }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-digest-stats"] });
      if (data.sent) {
        toast.success(`E-mail de test envoyé à ${data.recipient} (${data.notificationsCount} activité(s))`);
      } else {
        toast.info(`Aucun envoi effectué : ${data.reason}`);
      }
    },
    onError: (err) => {
      toast.error(`Erreur d'envoi du test : ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const batchMutation = useMutation({
    mutationFn: () => triggerAdminDigestFn({ data: { testOnly: false } }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-digest-stats"] });
      toast.success(
        `Batch terminé : ${data.digestsSent} e-mail(s) envoyé(s), ${data.totalNotificationsEmailed} notifications archivées.`,
      );
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} erreur(s) lors de l'envoi.`);
      }
    },
    onError: (err) => {
      toast.error(`Erreur lors de l'exécution du batch : ${err instanceof Error ? err.message : String(err)}`);
    },
  });

  const stats = q.data;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">Résumé quotidien (Email Digest)</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Envoi d'un récapitulatif 24h aux utilisateurs abonnés. Route cron :{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              POST /api/cron/digest
            </code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || batchMutation.isPending}
            className="text-xs"
          >
            {testMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            M'envoyer un test
          </Button>

          <Button
            size="sm"
            onClick={() => batchMutation.mutate()}
            disabled={batchMutation.isPending || testMutation.isPending}
            className="text-xs"
          >
            {batchMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-3.5 w-3.5" />
            )}
            Exécuter le batch
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Abonnés digest</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums">
            {q.isLoading ? "—" : `${stats?.digestEnabledUsers ?? 0} / ${stats?.totalUsers ?? 0}`}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">En attente d'e-mail</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums">
            {q.isLoading ? "—" : stats?.pendingNotifications ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Domaine émetteur</p>
          <p className="mt-1 truncate font-mono text-xs text-foreground/90" title={stats?.senderDomain}>
            {q.isLoading ? "—" : stats?.senderDomain ?? "collabland-notify.lm-music.com"}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fournisseur email</p>
          <div className="mt-1 flex items-center gap-1.5">
            {stats?.hasEmailConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-500">Configuré</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-500" title="Ajouter LOVABLE_API_KEY ou RESEND_API_KEY">
                  Clé requise
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
