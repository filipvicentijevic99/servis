import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-16 text-center sm:py-24">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MapPinOff aria-hidden="true" className="size-8" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Greška 404</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Stranica nije pronađena</h1>
      <p className="mx-auto max-w-md text-muted-foreground">
        Adresa je možda promenjena ili stranica više ne postoji. Pronađi novi teren ili se vrati na
        početnu.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/klubovi" />} className="min-h-11">
          Pronađi klub
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
