import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
  pushUnsupportedReason,
} from "@/lib/push-client";

export function PushNotificationsSettings() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refresh = async () => {
    const unsupported = pushUnsupportedReason();
    if (unsupported) {
      setHint(unsupported);
      setOn(false);
      setLoading(false);
      return;
    }
    const status = await getPushStatus();
    setOn(status.subscribed && status.permission === "granted");
    setHint(
      status.permission === "denied"
        ? "Les notifications sont bloquées dans ton navigateur. Réactive-les dans les réglages du site."
        : null,
    );
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const toggle = async (next: boolean) => {
    setBusy(true);
    if (next) {
      const res = await enablePushNotifications();
      if (!res.ok) {
        toast.error(res.error || "Activation impossible");
        setBusy(false);
        await refresh();
        return;
      }
      toast.success("Notifications activées");
      setOn(true);
    } else {
      await disablePushNotifications();
      toast.success("Notifications désactivées");
      setOn(false);
    }
    setBusy(false);
    await refresh();
  };

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-surface-2 p-4">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium">
          {on ? <BellRing className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          Notifications push
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Reçois une alerte sur ton téléphone ou ton ordinateur même si CollabLand est fermé
          (nouveaux projets, versions, messages, demandes d’amis…).
        </p>
        {hint && <p className="mt-2 text-xs text-amber-400/90">{hint}</p>}
        {loading && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />Vérification…
          </p>
        )}
      </div>
      <Switch
        checked={on}
        disabled={loading || busy || !!pushUnsupportedReason()}
        onCheckedChange={(v) => void toggle(!!v)}
      />
    </div>
  );
}
