/** Decorative analytics placeholder, for use inside a loading region that already announces itself. */
export function AnalyticsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((key) => (
          <div key={key} className="h-72 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

/** Suspense fallback for the analytics section: announces loading to screen readers. */
export function AnalyticsLoading() {
  return (
    <section role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Učitavanje prihoda i popunjenosti…</span>
      <AnalyticsSkeleton />
    </section>
  );
}
