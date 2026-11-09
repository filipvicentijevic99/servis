"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction, logoutAction, registerAction } from "@/server/actions/auth";
import { signInWithGoogle } from "@/lib/auth-client";
import type { Role } from "@/lib/roles";

const input = "w-full rounded border px-3 py-2 text-sm";
const button = "rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50";

export function DevAuthForms({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "Uspešno." : (result.error ?? "Greška."));
      router.refresh();
    });
  }

  if (loggedIn) {
    return (
      <form action={logoutAction}>
        <button className={button}>Odjavi se</button>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      {message && <p className="text-sm">{message}</p>}

      <form
        className="space-y-2"
        action={(fd) =>
          run(() =>
            registerAction({
              name: String(fd.get("name")),
              email: String(fd.get("email")),
              password: String(fd.get("password")),
              confirmPassword: String(fd.get("password")),
              role: String(fd.get("role")) as Role,
            }),
          )
        }
      >
        <h2 className="font-medium">Registracija</h2>
        <input className={input} name="name" placeholder="Ime" required />
        <input className={input} name="email" type="email" placeholder="Email" required />
        <input className={input} name="password" type="password" placeholder="Lozinka (8+)" required />
        <select className={input} name="role" defaultValue="PLAYER">
          <option value="PLAYER">Igrač</option>
          <option value="CLUB_OWNER">Vlasnik kluba</option>
        </select>
        <button className={button} disabled={pending}>Registruj se</button>
      </form>

      <form
        className="space-y-2"
        action={(fd) =>
          run(() =>
            loginAction({ email: String(fd.get("email")), password: String(fd.get("password")) }),
          )
        }
      >
        <h2 className="font-medium">Prijava</h2>
        <input className={input} name="email" type="email" placeholder="Email" required />
        <input className={input} name="password" type="password" placeholder="Lozinka" required />
        <button className={button} disabled={pending}>Prijavi se</button>
      </form>

      <button className={button} onClick={() => signInWithGoogle("/dev/auth")}>
        Nastavi sa Google-om
      </button>
    </div>
  );
}
