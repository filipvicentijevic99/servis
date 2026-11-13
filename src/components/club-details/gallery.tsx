"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { galleryIndex } from "@/lib/club-details";

export function ClubGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const src = images[index];
  const move = (direction: number) =>
    setIndex((current) => galleryIndex(current, direction, images.length));

  return (
    <section
      aria-label={`Fotografije kluba ${name}`}
      aria-roledescription="karusel"
      className="overflow-hidden rounded-2xl border bg-card"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div
        className="relative aspect-[4/3] bg-muted sm:aspect-[16/7]"
        role="group"
        aria-roledescription="slajd"
        aria-label={images.length ? `${index + 1} od ${images.length}` : "Nema fotografija"}
      >
        {src && !failed.includes(src) ? (
          <Image
            src={src}
            alt={`${name} — fotografija ${index + 1}`}
            fill
            unoptimized
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
            onError={() => setFailed((current) => [...current, src])}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <Building2 aria-hidden="true" className="size-12" />
            <p className="font-medium">Fotografija nije dostupna</p>
            <p className="text-sm">Informacije o klubu i terenima pronađi ispod.</p>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex items-center justify-between gap-3 p-3">
          <Button
            variant="outline"
            className="min-h-11"
            aria-label="Prethodna fotografija"
            onClick={() => move(-1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
            Fotografija {index + 1} od {images.length}
          </p>
          <Button
            variant="outline"
            className="min-h-11"
            aria-label="Sledeća fotografija"
            onClick={() => move(1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </section>
  );
}
