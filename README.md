# Servis

Platforma za rezervaciju tenis terena: pronađi klub, rezerviši termin i nađi partnera za meč.

> Live demo: _uskoro_ · Status: u razvoju

## Funkcionalnosti

- Pretraga klubova po gradu, podlozi i ceni
- Kalendar slobodnih termina i rezervacija bez preklapanja
- Moje rezervacije sa otkazivanjem do 24 h pre termina
- Otvoreni mečevi: objavi termin kome fali partner ili se priključi tuđem
- Dashboard za vlasnike klubova: tereni, radno vreme, zauzetost i prihod
- Email potvrde, responsive dizajn, svetla i tamna tema

## Stack

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL (Neon) · Prisma · Better Auth · Zod · Vercel

## Pokretanje lokalno

Potrebno: Node.js 22+ i besplatna baza na [Neon](https://neon.com).

```bash
git clone https://github.com/filipvicentijevic99/servis.git
cd servis
npm install
cp .env.example .env          # Windows: copy .env.example .env
```

U `.env` upiši `DATABASE_URL` i `BETTER_AUTH_SECRET` (`npx auth@latest secret`), pa:

```bash
npx prisma migrate dev
npm run dev
```

Aplikacija radi na http://localhost:3000.

## Skripte

| Komanda | Šta radi |
| --- | --- |
| `npm run dev` | Lokalni server |
| `npm run build` | Produkcioni build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript provera |
| `npx prisma studio` | Pregled baze u browseru |

## Kako radimo

Svaki task je GitHub issue na [Project board-u](../../projects). Rad ide na posebnoj grani, kroz pull request i code review, a `main` je zaštićen. Detalji su u [CLAUDE.md](CLAUDE.md).

## Kako smo koristili AI

_Popunjava se na kraju projekta: šta je radio AI (Claude Code), a šta mi._

## Tim

- [Filip Vicentijević](https://github.com/filipvicentijevic99): arhitektura, backend, code review
- [Tijana Đuknić](https://github.com/tijana333): frontend, UI
