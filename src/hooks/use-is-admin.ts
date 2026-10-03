import { useQuery } from "@tanstack/react-query";
import { checkIsAdmin } from "@/lib/admin.functions";
import { useMe } from "@/hooks/use-me";

export function useIsAdmin() {
  const { uid } = useMe();
  return useQuery({
    queryKey: ["is-admin", uid],
    enabled: !!uid,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await checkIsAdmin();
      return res.admin;
    },
  });
}
