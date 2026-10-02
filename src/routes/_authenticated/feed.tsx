import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROJECT_SELECT, ProjectCard, type ProjectRow } from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Fil — Stemroom" },
      { name: "description", content: "Les derniers projets et versions de tes amis producteurs." },
      { property: "og:title", content: "Fil — Stemroom" },
      { property: "og:description", content: "Les derniers projets et versions de tes amis." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const q = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select(PROJECT_SELECT).order("updated_at", { ascending: false }).limit(40);
      if (error) throw error;
      return data as unknown as ProjectRow[];
    },
  });
  return (
    <div>
      <h1 className="text-3xl font-bold">Fil d'actualité</h1>
      <p className="mt-1 text-muted-foreground">Les derniers projets et versions de ton cercle.</p>
      <div className="mt-6 space-y-4">
        {q.isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        {q.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <h2 className="text-lg font-semibold">C'est calme ici</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ajoute des amis ou publie ton premier projet.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link to="/friends" className="rounded-full border border-border px-4 py-2 text-sm">Trouver des producteurs</Link>
              <Link to="/projects/new" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Nouveau projet</Link>
            </div>
          </div>
        )}
        {q.data?.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
