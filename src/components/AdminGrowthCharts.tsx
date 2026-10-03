import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminGrowthPoint = {
  date: string;
  label: string;
  new: number;
  total: number;
};

const projectsConfig = {
  total: { label: "Projets", color: "oklch(0.65 0.24 297)" },
} satisfies ChartConfig;

const profilesConfig = {
  total: { label: "Profils", color: "oklch(0.72 0.14 200)" },
} satisfies ChartConfig;

function GrowthChart({
  title,
  description,
  data,
  config,
  gradientId,
  loading,
}: {
  title: string;
  description: string;
  data: AdminGrowthPoint[];
  config: ChartConfig;
  gradientId: string;
  loading?: boolean;
}) {
  const latest = data.length ? data[data.length - 1]!.total : 0;

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <p className="font-display text-xl font-semibold tabular-nums text-foreground">
          {loading ? "—" : latest}
        </p>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-44 w-full rounded-xl" />
      ) : (
        <ChartContainer config={config} className="mt-3 aspect-[2/1] w-full">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as AdminGrowthPoint | undefined;
                    return row ? `${row.label} · +${row.new} ce jour` : "";
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-total)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

export function AdminGrowthCharts({
  projects,
  profiles,
  loading,
}: {
  projects: AdminGrowthPoint[];
  profiles: AdminGrowthPoint[];
  loading?: boolean;
}) {
  return (
    <section className="mt-10 space-y-4 border-t border-border/70 pt-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Croissance</h2>
        <p className="text-sm text-muted-foreground">Cumul sur les 90 derniers jours.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <GrowthChart
          title="Projets publiés"
          description="Nombre total de projets créés dans le temps"
          data={projects}
          config={projectsConfig}
          gradientId="admin-fill-projects"
          loading={loading}
        />
        <GrowthChart
          title="Profils inscrits"
          description="Nombre total de comptes créés dans le temps"
          data={profiles}
          config={profilesConfig}
          gradientId="admin-fill-profiles"
          loading={loading}
        />
      </div>
    </section>
  );
}
