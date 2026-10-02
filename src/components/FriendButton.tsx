import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, UserPlus, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function FriendButton({ me, other }: { me: string; other: string }) {
  const qc = useQueryClient();
  const key = ["friendship", me, other];
  const { data: f } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(requester_id.eq.${me},addressee_id.eq.${other}),and(requester_id.eq.${other},addressee_id.eq.${me})`)
        .maybeSingle();
      return data;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["friends"] });
  };
  const run = async (p: PromiseLike<{ error: unknown }>) => {
    const { error } = await p;
    if (error) toast.error("Action impossible");
    refresh();
  };

  if (me === other) return null;
  if (!f)
    return (
      <Button size="sm" onClick={() => run(supabase.from("friendships").insert({ requester_id: me, addressee_id: other }))}>
        <UserPlus className="h-4 w-4" />Ajouter
      </Button>
    );
  if (f.status === "accepted")
    return (
      <Button size="sm" variant="secondary" onClick={() => confirm("Retirer cet ami ?") && run(supabase.from("friendships").delete().eq("id", f.id))}>
        <UserCheck className="h-4 w-4" />Amis
      </Button>
    );
  if (f.addressee_id === me)
    return (
      <Button size="sm" onClick={() => run(supabase.from("friendships").update({ status: "accepted" }).eq("id", f.id))}>
        <Check className="h-4 w-4" />Accepter
      </Button>
    );
  return (
    <Button size="sm" variant="secondary" onClick={() => run(supabase.from("friendships").delete().eq("id", f.id))}>
      <Clock className="h-4 w-4" />Envoyée
    </Button>
  );
}
