export function ClubListLoading() {
  return (
    <div role="status" aria-label="Učitavanje klubova">
      <span className="sr-only">Učitavanje klubova…</span>
      <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border motion-safe:animate-pulse">
            <div className="aspect-[16/10] bg-muted" />
            <div className="space-y-4 p-4">
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-8 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
