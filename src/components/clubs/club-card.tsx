import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ClubImage } from "./club-image";
import { SURFACE_LABELS } from "@/lib/surfaces";
import { formatPrice } from "@/lib/format";
import type { ClubListItem } from "@/server/queries/clubs";

export function ClubCard({ club }: { club: ClubListItem }) {
  return (
    <li>
      <Link
        href={`/klub/${club.slug}`}
        className="group block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Card className="h-full pt-0 transition-shadow group-hover:shadow-md">
          <ClubImage src={club.image} name={club.name} />
          <CardHeader>
            <h2 className="text-xl font-semibold break-words group-hover:underline">{club.name}</h2>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              {club.city}
            </p>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            {club.surfaces.length ? (
              <ul aria-label="Dostupne podloge" className="flex flex-wrap gap-2">
                {club.surfaces.map((surface) => (
                  <li
                    key={surface}
                    className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                  >
                    {SURFACE_LABELS[surface]}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nema dostupnih podloga</p>
            )}
            <p className="font-semibold">
              {club.minPrice !== null ? (
                <>
                  Od {formatPrice(club.minPrice)}{" "}
                  <span className="font-normal text-muted-foreground">/ sat</span>
                </>
              ) : (
                "Cena nije dostupna"
              )}
            </p>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}
