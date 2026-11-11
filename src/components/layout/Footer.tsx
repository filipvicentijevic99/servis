import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Servis</p>

        <nav aria-label="Footer navigation" className="flex gap-6">
          <Link href="/klubovi" className="hover:text-foreground">
            Klubovi
          </Link>
          <Link href="/mecevi" className="hover:text-foreground">
            Otvoreni mečevi
          </Link>
        </nav>
      </div>
    </footer>
  );
}
