"use client";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Klub trenutno nije moguće učitati</h1>
      <p className="text-muted-foreground">Pokušaj ponovo za nekoliko trenutaka.</p>
      <Button onClick={reset}>Pokušaj ponovo</Button>
    </main>
  );
}
