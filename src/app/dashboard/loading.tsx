import { AnalyticsLoading } from "@/components/dashboard/analytics-loading";

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10" role="status" aria-busy="true">
      <span className="sr-only">Učitavanje kluba, terena i statistike…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="h-24 rounded-xl bg-muted" />
        <AnalyticsLoading />
        <div className="h-96 rounded-xl bg-muted" />
      </div>
    </main>
  );
}
