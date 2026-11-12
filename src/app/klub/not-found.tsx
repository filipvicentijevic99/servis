import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Klub nije pronađen</h1>
      <p className="text-muted-foreground">Proveri adresu ili se vrati na početnu stranicu.</p>
      <Link
        href="/"
        className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        Početna stranica
      </Link>
    </main>
  );
}
