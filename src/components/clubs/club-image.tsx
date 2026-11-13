"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";

export function ClubImage({ src, name }: { src: string | null; name: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {src && failedSource !== src ? (
        <Image
          src={src}
          alt={`Teniski tereni kluba ${name}`}
          fill
          unoptimized
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <Building2 aria-hidden="true" className="size-10" />
          <span className="text-sm">Fotografija nije dostupna</span>
        </div>
      )}
    </div>
  );
}
