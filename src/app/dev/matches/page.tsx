// TEMPORARY test page for open matches (/dev/matches) until the real /mecevi page exists.
// Try: /dev/matches?grad=Beograd&tip=dubl&nivo=srednji&datum=2026-11-14
// Sign in at /dev/auth first to join or leave. Delete before deploying.
import { redirect } from "next/navigation";
import { getOpenMatches } from "@/server/queries/matches";
import { cancelOpenMatch, joinMatch, leaveMatch } from "@/server/actions/matches";
import { parseMatchFilters } from "@/lib/validations/matches";
import { MATCH_TYPE_LABELS, SKILL_LEVEL_LABELS } from "@/lib/matches";
import { formatBelgradeTime, todayInBelgrade } from "@/lib/time";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function act(formData: FormData) {
  "use server";
  const matchId = String(formData.get("matchId"));
  const action = String(formData.get("action"));
  const result =
    action === "join"
      ? await joinMatch({ matchId })
      : action === "leave"
        ? await leaveMatch({ matchId })
        : await cancelOpenMatch({ matchId });
  const msg = result.ok ? `${action}: OK` : result.error;
  redirect(`/dev/matches?msg=${encodeURIComponent(msg)}`);
}

export default async function DevMatchesPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.msg === "string" ? params.msg : null;
  const filters = parseMatchFilters(params);
  const matches = await getOpenMatches(filters);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8 text-sm">
      <h1 className="text-2xl font-semibold">Open matches test ({matches.length})</h1>
      <pre>{JSON.stringify(filters)}</pre>
      {message && <p className="rounded border p-2">{message}</p>}
      <ul className="space-y-2">
        {matches.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 rounded border p-2">
            <span>
              {todayInBelgrade(m.startsAt)} {formatBelgradeTime(m.startsAt)} · {m.club.name} (
              {m.club.city}) · {MATCH_TYPE_LABELS[m.type]} · {SKILL_LEVEL_LABELS[m.level]} ·{" "}
              {m.players.length}/{m.capacity} · {m.players.map((p) => p.name).join(", ")}
              {m.note && ` · "${m.note}"`}
            </span>
            <form action={act} className="flex gap-1">
              <input type="hidden" name="matchId" value={m.id} />
              {m.canJoin && (
                <button name="action" value="join" className="rounded border px-2 py-1">
                  Join
                </button>
              )}
              {m.isJoined && !m.isOrganizer && (
                <button name="action" value="leave" className="rounded border px-2 py-1">
                  Leave
                </button>
              )}
              {m.isOrganizer && (
                <button name="action" value="cancel" className="rounded border px-2 py-1">
                  Cancel match
                </button>
              )}
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
