import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FriendProfile = { id: string; username: string; display_name: string | null; avatar_url: string | null };

export function useFriends(uid?: string) {
  return useQuery({
    queryKey: ["friends", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("id,status,requester_id,addressee_id,requester:profiles!friendships_requester_id_fkey(id,username,display_name,avatar_url),addressee:profiles!friendships_addressee_id_fkey(id,username,display_name,avatar_url)");
      if (error) throw error;
      const rows = data as unknown as { id: string; status: string; requester_id: string; requester: FriendProfile; addressee: FriendProfile }[];
      return {
        friends: rows.filter((r) => r.status === "accepted").map((r) => (r.requester_id === uid ? r.addressee : r.requester)),
        incoming: rows.filter((r) => r.status === "pending" && r.requester_id !== uid).map((r) => r.requester),
        outgoing: rows.filter((r) => r.status === "pending" && r.requester_id === uid).map((r) => r.addressee),
      };
    },
  });
}
