export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10" role="status">
      <span className="sr-only">Učitavanje kluba…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="aspect-[4/3] rounded-2xl bg-muted sm:aspect-[16/7]" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    </main>
  );
}
