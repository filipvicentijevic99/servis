import { getClubStats } from "@/server/queries/dashboard-stats";
import { DashboardAnalytics } from "./dashboard-analytics";

export async function ClubAnalytics({ clubId }: { clubId: string }) {
  const stats = await getClubStats(clubId);
  if (!stats)
    return (
      <p role="alert" className="rounded-xl border p-4 text-sm">
        Statistika ovog kluba nije dostupna.
      </p>
    );
  return <DashboardAnalytics stats={stats} />;
}
