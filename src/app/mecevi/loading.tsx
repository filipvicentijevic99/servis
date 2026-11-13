export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10" role="status">
      <span className="sr-only">Učitavanje mečeva…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="h-40 rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-80 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </main>
  );
}
