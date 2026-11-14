"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function recover() {
    // A server failure needs fresh RSC data as well as a cleared error boundary.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }
  return (
    <main
      className="mx-auto max-w-6xl space-y-5 px-4 py-16 text-center sm:py-24"
      aria-busy={pending}
    >
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <TriangleAlert aria-hidden="true" className="size-8" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Došlo je do greške</h1>
      <p role="alert" className="mx-auto max-w-md text-muted-foreground">
        Stranicu trenutno nije moguće prikazati. Pokušaj ponovo ili se vrati na početnu stranicu.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={recover} disabled={pending} className="min-h-11">
          {pending ? "Učitavanje…" : "Pokušaj ponovo"}
        </Button>
        <Button
          nativeButton={false}
          render={<Link href="/" />}
          variant="outline"
          className="min-h-11"
        >
          Početna stranica
        </Button>
      </div>
    </main>
  );
}
