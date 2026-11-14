export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10" role="status">
      <span className="sr-only">Učitavanje rezervacija…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="h-12 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-64 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
