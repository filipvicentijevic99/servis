// TEMPORARY auth test page (/dev/auth) until the real login and registration pages exist.
// Delete before deploying.
import { getSession } from "@/lib/session";
import { DevAuthForms } from "./forms";

export default async function DevAuthPage() {
  const session = await getSession();

  return (
    <main className="mx-auto max-w-xl space-y-8 p-8">
      <h1 className="text-2xl font-semibold">Auth test</h1>

      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Trenutna sesija (sa servera)</h2>
        <pre className="overflow-x-auto text-xs">
          {session ? JSON.stringify(session.user, null, 2) : "Niko nije ulogovan."}
        </pre>
      </section>

      <DevAuthForms loggedIn={Boolean(session)} />
    </main>
  );
}
