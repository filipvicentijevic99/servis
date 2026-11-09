@AGENTS.md

# Servis: rezervacija tenis terena

Full-stack aplikacija: klubovi objavljuju terene i radno vreme, igrači rezervišu termine i traže partnere za otvorene mečeve, vlasnici imaju dashboard. Tim od dvoje radi kroz GitHub issues i PR-ove.

## Stack

- Next.js 16 (App Router, `src/` folder), TypeScript strict, React 19
- Tailwind CSS + shadcn/ui (`src/components/ui`), ikone iz `lucide-react`
- PostgreSQL (Neon) + Prisma 7: šema u `prisma/schema.prisma`, klijent se generiše u `src/generated/prisma`
- Promenljive okruženja su u `.env.local` (ne commit-uje se); spisak je u `.env.example`
- Better Auth (email/lozinka + Google), uloge `PLAYER` i `CLUB_OWNER`
- Zod 4 za validaciju, React Hook Form za forme
- date-fns za datume, Recharts (preko shadcn `chart`) za grafikone

## Komande

- `npm run dev`: lokalni server na http://localhost:3000
- `npm run lint`, `npm run typecheck`: moraju da prođu pre svakog commit-a
- `npx prisma migrate dev --name <ime>` pa `npx prisma generate`: posle izmene šeme (Prisma 7 ne generiše klijent sam posle migracije)
- `npx prisma studio`: pregled baze

## Struktura

```
src/
  app/                 rute (App Router)
    (public)/          početna, klubovi, klub/[id], mečevi
    (auth)/            login, registracija
    igrac/             zaštićeno: samo ulogovani
    dashboard/         zaštićeno: samo CLUB_OWNER
    api/auth/[...all]/ Better Auth handler (ne menjati)
  components/
    ui/                shadcn komponente (dodaju se sa `npx shadcn@latest add <ime>`)
    <oblast>/          komponente po funkcionalnosti, npr. clubs/, booking/, matches/
  lib/
    prisma.ts          jedini Prisma klijent: `import prisma from "@/lib/prisma"`
    auth.ts            Better Auth konfiguracija (samo server)
    auth-client.ts     klijent za browser: useSession, signOut, signInWithGoogle
    session.ts         getSession, requireUser, requireRole (samo server)
    roles.ts           ROLES, ROLE_LABELS, homeForRole
    validations/       Zod šeme, dele ih forme i server akcije
  server/actions/      server akcije ("use server")
  proxy.ts             zaštita ruta (Next.js 16 ime za middleware)
```

## Pravila

### Kod
- Imena u kodu (promenljive, funkcije, fajlovi, tabele) su na engleskom; sav tekst koji korisnik vidi je na srpskom latinicom.
- Server komponente su podrazumevane; `"use client"` samo kad treba state, efekti ili event handleri.
- Upiti ka bazi samo na serveru: server komponente ili server akcije. Nikad ne uvoziti `@/lib/prisma` ni `@/lib/auth` u klijent komponentu.
- Server akcija uvek: (1) proveri korisnika sa `requireUser()` / `requireRole()`, (2) validira ulaz Zod šemom iz `src/lib/validations`, (3) vrati `ActionResult` (`{ ok: true, ... }` ili `{ ok: false, error, fieldErrors? }`), ne baca greške ka UI-ju.
- Ulozi sa klijenta se nikad ne veruje; uloga se čita iz sesije na serveru.
- Ista Zod šema za formu (`zodResolver`) i za server akciju; ne duplirati validaciju.
- Cene su `Int` u dinarima. Prikaz: `new Intl.NumberFormat("sr-RS").format(cena) + " RSD"`.
- Vreme se čuva u UTC, prikazuje u `Europe/Belgrade`; formatiranje preko date-fns sa lokalom `sr-Latn`.
- Ne menjati ručno fajlove u `src/generated/` ni `src/components/ui/` osim kad je to cilj taska.
- Ne dodavati nove npm pakete bez pitanja u issue-u ili PR-u.

### UI
- Samo Tailwind klase i shadcn komponente; bez posebnih CSS fajlova.
- Mobile first: svaka stranica mora da radi na 375 px širine.
- Svaka lista ima loading stanje (skeleton) i prazno stanje.
- Podržati svetlu i tamnu temu: koristiti shadcn tokene (`bg-background`, `text-muted-foreground`...), ne fiksne boje.

### Git
- Nikad direktno na `main`. Grana po issue-u: `feature/<broj>-kratak-opis`, `fix/<broj>-...`, `chore/<broj>-...`.
- Conventional Commits: `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`.
- Mali PR-ovi (do oko 300 linija), u opisu `Closes #<broj>` i screenshot za UI promene.

## Kako radimo sa AI-jem
- Jedan issue = jedna sesija. Na početku pročitaj issue i acceptance criteria i predloži plan pre pisanja koda.
- Posle izmena pokreni `npm run lint` i `npm run typecheck` i popravi greške.
- Objasni šta si promenio i zašto, da autor PR-a može da odgovori na pitanja sa review-a.
- Ako nešto u issue-u nije jasno, pitaj umesto da pretpostaviš.
