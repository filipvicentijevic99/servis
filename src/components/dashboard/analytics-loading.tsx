export function AnalyticsLoading() {
  return (
    <section role="status" aria-busy="true" className="space-y-5">
      <span className="sr-only">Učitavanje prihoda i popunjenosti…</span>
      <div aria-hidden="true" className="animate-pulse space-y-5">
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
    </section>
  );
}
