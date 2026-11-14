"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { OpenMatchItem } from "@/server/queries/matches";
import type { joinMatch, leaveMatch } from "@/server/actions/matches";
import { MATCH_TYPE_LABELS, SKILL_LEVEL_LABELS } from "@/lib/matches";
import { TIME_ZONE, formatBelgradeTime } from "@/lib/time";
import { optimisticMembership, playerInitials, type MatchPlayer } from "@/lib/open-match-ui";

function PlayerAvatar({ player }: { player: MatchPlayer }) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <span
      aria-label={player.name}
      title={player.name}
      className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-semibold"
    >
      {player.image && failed !== player.image ? (
        <Image
          src={player.image}
          alt=""
          fill
          unoptimized
          className="object-cover"
          onError={() => setFailed(player.image)}
        />
      ) : (
        <span aria-hidden="true">{playerInitials(player.name)}</span>
      )}
    </span>
  );
}

type Props = {
  matches: OpenMatchItem[];
  user: MatchPlayer | null;
  joinAction: typeof joinMatch;
  leaveAction: typeof leaveMatch;
};

export function MatchList({ matches, user, joinAction, leaveAction }: Props) {
  const [optimistic, update] = useOptimistic(matches, optimisticMembership);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const visible = optimistic.filter(
    (match) => match.spotsLeft > 0 || (user !== null && match.isJoined),
  );

  function change(match: OpenMatchItem) {
    if (!user || match.isOrganizer || inFlight.current || (!match.isJoined && !match.canJoin))
      return;
    inFlight.current = true;
    setError(null);
    startTransition(async () => {
      update({ matchId: match.id, player: user, join: !match.isJoined });
      try {
        const result = await (match.isJoined ? leaveAction : joinAction)({ matchId: match.id });
        if (result.ok)
          toast.success(
            match.isJoined ? "Napustio/la si meč." : "Uspešno si se priključio/la meču.",
          );
        else {
          toast.error(result.error);
          setError(result.error);
        }
      } catch {
        const message = "Promena nije potvrđena. Proveri listu pre ponovnog pokušaja.";
        setError(message);
        toast.error(message);
      } finally {
        router.refresh();
        inFlight.current = false;
      }
    });
  }

  return (
    <div className="space-y-4" aria-busy={pending}>
      {error && (
        <p role="alert" className="rounded-lg border p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {pending && (
        <p role="status" className="text-sm text-muted-foreground">
          Ažuriranje mečeva…
        </p>
      )}
      {!visible.length ? (
        <div className="rounded-xl border border-dashed px-4 py-14 text-center">
          <h2 className="text-xl font-semibold">Nema otvorenih mečeva</h2>
          <p className="mt-2 text-muted-foreground">
            Svi termini su popunjeni ili nema mečeva za izabrane filtere.
          </p>
          <Link
            href="/mecevi"
            className="mt-4 inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Prikaži sve mečeve
          </Link>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {visible.map((match) => (
            <li key={match.id}>
              <Card className="h-full">
                <CardHeader>
                  <h2 className="text-xl font-semibold break-words">
                    <Link
                      href={`/klub/${match.club.slug}`}
                      className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {match.club.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {match.club.city} · {match.court.name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    {new Intl.DateTimeFormat("sr-Latn-RS", {
                      timeZone: TIME_ZONE,
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(match.startsAt)}
                    <br />
                    <span className="text-muted-foreground">
                      {formatBelgradeTime(match.startsAt)}–{formatBelgradeTime(match.endsAt)} ·
                      vreme u Srbiji
                    </span>
                  </p>
                  <p className="text-sm">
                    {MATCH_TYPE_LABELS[match.type]} · {SKILL_LEVEL_LABELS[match.level]}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Organizator: {match.organizer.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <ul aria-label="Učesnici" className="flex flex-wrap gap-2">
                      {match.players.map((player) => (
                        <li key={player.id}>
                          <PlayerAvatar player={player} />
                        </li>
                      ))}
                    </ul>
                    <p aria-live="polite" aria-atomic="true" className="text-sm font-semibold">
                      {match.players.length}/{match.capacity} učesnika
                    </p>
                  </div>
                  {match.note && (
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {match.note}
                    </p>
                  )}
                  {!user ? (
                    <Link
                      href="/login?callbackUrl=%2Fmecevi"
                      className="inline-block rounded-sm py-2 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      Prijavi se za učešće
                    </Link>
                  ) : match.isOrganizer ? (
                    <p className="text-sm text-muted-foreground">
                      Ti si organizator ovog meča i ne možeš ga napustiti.
                    </p>
                  ) : (
                    <Button
                      variant={match.isJoined ? "outline" : "default"}
                      className="min-h-11"
                      disabled={pending || (!match.isJoined && !match.canJoin)}
                      onClick={() => change(match)}
                    >
                      {match.isJoined ? "Napusti meč" : "Priključi se"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
