#!/usr/bin/env bash
# Pravi labele, milestone-e i sve issue-e za projekat "Servis" (rezervacija tenis terena).
#
# Potrebno: GitHub CLI (https://cli.github.com) i login: gh auth login
# Tijana mora prvo da prihvati poziv za collaboratora, inače dodela issue-a ne uspeva.
#
# Upotreba:
#   chmod +x create_issues.sh
#   ./create_issues.sh tvoj-username/servis
#   (Tijanin GitHub je podrazumevano tijana333; drugi argument ga menja)

set -euo pipefail

REPO="${1:?Upotreba: ./create_issues.sh vlasnik/repo}"
TIJANA="${2:-tijana333}"
JA="@me"

M1="M1 Osnova"
M2="M2 Rezervacije"
M3="M3 Mečevi i dashboard"
M4="M4 Polish i deploy"

echo "==> Labele"
label() { gh label create "$1" --color "$2" --description "$3" --repo "$REPO" --force >/dev/null; echo "   $1"; }
label "feature"          "1D76DB" "Nova funkcionalnost"
label "bug"              "D73A4A" "Nešto ne radi kako treba"
label "chore"            "C5DEF5" "Setup, alati, dokumentacija, sređivanje"
label "frontend"         "BFD4F2" "UI, stranice, komponente"
label "backend"          "0E8A16" "Baza, server akcije, logika"
label "good first issue" "7057FF" "Dobro za početak"
label "priority: high"   "B60205" "Blokira druge taskove"

echo "==> Milestone-i"
existing_milestones="$(gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title')"
milestone() {
  if grep -Fxq "$1" <<<"$existing_milestones"; then
    echo "   $1 (već postoji)"
  else
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null
    echo "   $1"
  fi
}
milestone "$M1" "Dani 1–2: setup, baza, auth, layout. Cilj: login radi."
milestone "$M2" "Dani 3–5: klubovi, tereni, slotovi, rezervacija. Cilj: prva rezervacija."
milestone "$M3" "Dani 6–8: otvoreni mečevi i dashboard vlasnika. Cilj: sve funkcije rade."
milestone "$M4" "Dani 9–10: email, testovi, polish, README, deploy. Cilj: live demo."

# issue "naslov" "labele" "milestone" "assignee"  <<'EOF' ... opis ... EOF
issue() {
  gh issue create --repo "$REPO" --title "$1" --label "$2" --milestone "$3" --assignee "$4" --body-file - >/dev/null
  echo "   [$3] $1"
}

echo "==> Issue-i: M1 Osnova"

issue "Inicijalni setup: Next.js, TypeScript, Tailwind, shadcn/ui, ESLint i Prettier" "chore,priority: high" "$M1" "$JA" <<'EOF'
## Opis
Kostur projekta na koji se sve ostalo nadovezuje.

## Acceptance criteria
- [ ] Next.js (App Router) + TypeScript (strict)
- [ ] Tailwind CSS i shadcn/ui inicijalizovani, dodate osnovne komponente (button, input, card, dialog, dropdown-menu)
- [ ] ESLint + Prettier, skripte `lint`, `format`, `typecheck` u package.json
- [ ] Struktura foldera kao u planu projekta
- [ ] `.env.example` sa svim promenljivama (bez pravih vrednosti)
EOF

issue "CI: GitHub Actions za lint, typecheck i build" "chore" "$M1" "$JA" <<'EOF'
## Opis
Svaki PR automatski prolazi proveru pre review-a.

## Acceptance criteria
- [ ] `.github/workflows/ci.yml` se pokreće na svaki PR ka `main`
- [ ] Koraci: install, lint, typecheck, build
- [ ] U zaštiti `main` grane CI je obavezan za merge
EOF

issue "CLAUDE.md, šabloni za issue i PR i kostur README-a" "chore" "$M1" "$JA" <<'EOF'
## Opis
Pravila projekta za ljude i za AI.

## Acceptance criteria
- [ ] `CLAUDE.md`: stack, struktura foldera, konvencije imenovanja, pravila (shadcn komponente, Zod validacija, server akcije u `src/server/actions`)
- [ ] `.github/ISSUE_TEMPLATE/feature.md` i `bug.md`
- [ ] `.github/pull_request_template.md` (šta je urađeno, kako testirati, screenshot, `Closes #`)
- [ ] README: opis, stack, pokretanje lokalno, sekcija "Tim"
EOF

issue "Prisma šema, migracije i seed sa test klubovima" "backend,priority: high" "$M1" "$JA" <<'EOF'
## Opis
Model podataka: User (uloga PLAYER / CLUB_OWNER), Club, Court, OpeningHours, Booking, OpenMatch, MatchParticipant.

## Acceptance criteria
- [ ] `prisma/schema.prisma` sa svim modelima i relacijama
- [ ] Baza na Neon-u (dev grana), prva migracija
- [ ] `prisma/seed.ts`: 5–6 klubova u par gradova, različite podloge (šljaka, beton, trava), radno vreme, nekoliko rezervacija
- [ ] Tipovi i primer podataka podeljeni sa Tijanom da može da radi UI sa mock podacima
EOF

issue "Better Auth: email i Google login, uloge i zaštita ruta" "backend,priority: high" "$M1" "$JA" <<'EOF'
## Opis
Login i uloge. Tijana radi UI stranica za login i registraciju i povezuje ih sa ovim.

## Acceptance criteria
- [ ] Better Auth sa Prisma adapterom, email/lozinka + Google
- [ ] Uloga u sesiji
- [ ] `proxy.ts`: `/igrac/*` samo ulogovani, `/dashboard/*` samo CLUB_OWNER
- [ ] Server akcije `register` i `login` sa Zod šemama koje koristi i forma
EOF

issue "Podesi projekat lokalno i otvori svoj prvi PR" "chore,good first issue" "$M1" "$TIJANA" <<'EOF'
## Opis
Cilj je da prođeš ceo GitHub tok na nečemu jednostavnom: grana → commit → PR → review → merge.

## Acceptance criteria
- [ ] Projekat radi lokalno (`npm install`, `.env` po `.env.example`, `npm run dev`)
- [ ] Na grani `chore/<broj-issue-a>-dodaj-sebe-u-readme` dodaj sebe u sekciju "Tim" u README-u (ime, GitHub link)
- [ ] PR sa `Closes #<broj>` u opisu i popunjenim šablonom
- [ ] Odgovori na bar jedan komentar sa review-a

## Hintovi
- `git checkout -b chore/1-dodaj-sebe-u-readme`
- Commit poruka: `docs: dodaj sebe u tim`
- Pročitaj `CLAUDE.md` pre nego što počneš da radiš sa AI-jem
EOF

issue "Layout: navbar, footer i responsive meni" "feature,frontend" "$M1" "$TIJANA" <<'EOF'
## Opis
Zajednički layout za sve stranice.

## Acceptance criteria
- [ ] Navbar: logo, linkovi (Klubovi, Otvoreni mečevi), dugme Prijava ili meni korisnika ako je ulogovan
- [ ] Na telefonu meni u `Sheet` komponenti (hamburger)
- [ ] Footer sa linkovima i godinom
- [ ] Izgleda dobro na 375 px i na desktopu

## Hintovi
- shadcn: `navigation-menu`, `sheet`, `dropdown-menu`, `avatar`
- Za početak koristi lažnog korisnika; sa sesijom povezuješ kad bude gotov auth issue
EOF

issue "Početna stranica: hero, kako funkcioniše i CTA" "feature,frontend" "$M1" "$TIJANA" <<'EOF'
## Opis
Prvi utisak aplikacije, treba da izgleda kao pravi proizvod.

## Acceptance criteria
- [ ] Hero sa naslovom, podnaslovom, poljem za pretragu grada i dugmetom "Pronađi teren"
- [ ] Sekcija "Kako funkcioniše" u 3 koraka sa ikonama
- [ ] Sekcija sa 3 istaknuta kluba (mock podaci za sada)
- [ ] CTA za vlasnike klubova ("Dodaj svoj klub")

## Hintovi
- lucide ikone, `card` komponenta
- Slike: besplatne sa Unsplash-a, sačuvaj ih u `public/`
EOF

issue "Stranice za login i registraciju sa validacijom" "feature,frontend" "$M1" "$TIJANA" <<'EOF'
## Opis
UI za auth koji koristi server akcije iz issue-a za Better Auth.

## Acceptance criteria
- [ ] `/login` i `/registracija` sa React Hook Form + Zod
- [ ] Greške ispod polja, dugme u loading stanju dok se šalje
- [ ] Na registraciji izbor uloge: igrač ili vlasnik kluba
- [ ] Dugme "Nastavi sa Google-om"
- [ ] Posle logina redirect na početnu (igrač) ili `/dashboard` (vlasnik)

## Hintovi
- shadcn `form` komponenta je već povezana sa React Hook Form
- Zod šeme uvezi iz `src/lib/validations`, ne piši ih ponovo
EOF

echo "==> Issue-i: M2 Rezervacije"

issue "Server akcije za klubove i terene (lista, filteri, detalji)" "backend" "$M2" "$JA" <<'EOF'
## Acceptance criteria
- [ ] `getClubs({ grad, podloga, maxCena })` sa paginacijom
- [ ] `getClub(id)` sa terenima, radnim vremenom i slikama
- [ ] Tipovi rezultata izvezeni za UI
EOF

issue "Upload slika klubova i terena" "backend" "$M2" "$JA" <<'EOF'
## Acceptance criteria
- [ ] UploadThing ili Cloudinary podešen
- [ ] Samo vlasnik kluba može da doda ili obriše sliku
- [ ] Ograničenje veličine i tipa fajla
EOF

issue "Logika slobodnih slotova sa unit testovima" "backend,priority: high" "$M2" "$JA" <<'EOF'
## Opis
Najvažnija logika u aplikaciji, dobra tema za intervju.

## Acceptance criteria
- [ ] `getAvailableSlots(courtId, datum)` vraća slotove od 1 h u okviru radnog vremena
- [ ] Zauzeti i prošli termini se ne vraćaju
- [ ] Vremenska zona Europe/Belgrade, i oko promene letnjeg/zimskog vremena
- [ ] Vitest testovi za ivične slučajeve (početak i kraj radnog vremena, preklapanja, prošli dan)
EOF

issue "Kreiranje i otkazivanje rezervacije" "backend" "$M2" "$JA" <<'EOF'
## Acceptance criteria
- [ ] `createBooking` u transakciji, odbija preklapanje i kad dva korisnika rezervišu istovremeno
- [ ] `cancelBooking` dozvoljeno najkasnije 24 h pre termina, samo vlasniku rezervacije
- [ ] `getMyBookings` vraća predstojeće i prošle
- [ ] Jasne poruke greške koje UI može da prikaže
EOF

issue "Lista klubova: kartice i filteri" "feature,frontend" "$M2" "$TIJANA" <<'EOF'
## Opis
Stranica `/klubovi`.

## Acceptance criteria
- [ ] Grid kartica (slika, ime, grad, podloge, cena od ... po satu)
- [ ] Filteri: grad, podloga, maksimalna cena
- [ ] Filteri se čuvaju u URL-u (`?grad=Beograd&podloga=sljaka`), da link može da se podeli
- [ ] Prazno stanje kad nema rezultata

## Hintovi
- `useSearchParams` i `useRouter` za filtere u URL-u
- Podatke dobijaš iz `getClubs` (backend issue u istom milestone-u); dok ga nema, koristi mock podatke istog tipa
EOF

issue "Stranica kluba: galerija, informacije i lista terena" "feature,frontend" "$M2" "$TIJANA" <<'EOF'
## Opis
Stranica `/klub/[id]`.

## Acceptance criteria
- [ ] Galerija slika (carousel)
- [ ] Adresa, radno vreme, opis, kontakt
- [ ] Lista terena sa podlogom i cenom, dugme "Rezerviši" na svakom
- [ ] Loading stanje i 404 ako klub ne postoji (`notFound()`)

## Hintovi
- shadcn `carousel`, `badge`
EOF

issue "Komponenta za izbor datuma i termina" "feature,frontend,priority: high" "$M2" "$TIJANA" <<'EOF'
## Opis
Srce aplikacije sa strane korisnika: korisnik bira dan, vidi slobodne termine i rezerviše.

## Acceptance criteria
- [ ] Izbor datuma (danas + narednih 14 dana)
- [ ] Mreža termina; zauzeti i prošli su onemogućeni
- [ ] Dialog za potvrdu (teren, datum, vreme, cena), pa poziv `createBooking`
- [ ] Toast za uspeh ili grešku, termini se osvežavaju posle rezervacije
- [ ] Radi na telefonu

## Hintovi
- shadcn `calendar`, `toggle-group`, `dialog`, `sonner`
- Slotove dobijaš iz `getAvailableSlots`; ne računaj ih ponovo na frontendu
- Za formatiranje datuma koristi date-fns sa srpskim lokalom (`sr-Latn`)
EOF

issue "Moje rezervacije: predstojeće, prošle i otkazivanje" "feature,frontend" "$M2" "$TIJANA" <<'EOF'
## Opis
Stranica `/igrac/rezervacije`.

## Acceptance criteria
- [ ] Tabovi: Predstojeće / Prošle
- [ ] Kartica: klub, teren, datum, vreme, cena
- [ ] Dugme "Otkaži" sa potvrdom; onemogućeno ako je manje od 24 h do termina (uz objašnjenje u tooltipu)
- [ ] Prazno stanje sa linkom ka klubovima

## Hintovi
- shadcn `tabs`, `alert-dialog`, `tooltip`
EOF

echo "==> Issue-i: M3 Mečevi i dashboard"

issue "Otvoreni mečevi: kreiranje, priključivanje i limit igrača" "backend" "$M3" "$JA" <<'EOF'
## Acceptance criteria
- [ ] Igrač od svoje rezervacije pravi otvoren meč (singl 2 ili dubl 4 igrača, nivo, napomena)
- [ ] `joinMatch` i `leaveMatch`; ne može preko limita, ni kad se dvoje priključe istovremeno
- [ ] Kad se meč popuni, više se ne prikazuje u listi
- [ ] `getOpenMatches({ grad, nivo, tip, datum })`
EOF

issue "Dashboard: autorizacija vlasnika i akcije za terene i radno vreme" "backend" "$M3" "$JA" <<'EOF'
## Acceptance criteria
- [ ] Vlasnik vidi i menja samo svoj klub
- [ ] CRUD akcije za terene (naziv, podloga, cena, aktivan)
- [ ] Izmena radnog vremena po danima
- [ ] Lista rezervacija za izabrani dan
EOF

issue "Dashboard: upiti za zauzetost i prihod" "backend" "$M3" "$JA" <<'EOF'
## Acceptance criteria
- [ ] Prihod po danu za poslednjih 30 dana
- [ ] Zauzetost po terenu u procentima
- [ ] Najpopularniji termini u nedelji
- [ ] Vraćeni podaci su u obliku spremnom za Recharts
EOF

issue "Lista otvorenih mečeva sa filterima" "feature,frontend" "$M3" "$TIJANA" <<'EOF'
## Opis
Stranica `/mecevi`, ono što aplikaciju izdvaja od običnog kalendara.

## Acceptance criteria
- [ ] Kartica meča: klub, datum i vreme, tip (singl/dubl), nivo, popunjena mesta (npr. 3/4 sa avatarima)
- [ ] Filteri: grad, nivo, tip, datum
- [ ] Dugme "Priključi se" / "Napusti meč", sa optimističkim ažuriranjem
- [ ] Popunjen meč nestaje iz liste

## Hintovi
- `useOptimistic` iz React-a
EOF

issue "Forma \"Objavi otvoren meč\"" "feature,frontend" "$M3" "$TIJANA" <<'EOF'
## Acceptance criteria
- [ ] Otvara se iz "Moje rezervacije" za predstojeću rezervaciju
- [ ] Polja: tip (singl/dubl), nivo (početnik, srednji, napredni), napomena
- [ ] Validacija sa Zod-om, toast posle objave

## Hintovi
- shadcn `radio-group`, `select`, `textarea`
EOF

issue "Dashboard: forme za dodavanje i izmenu terena" "feature,frontend" "$M3" "$TIJANA" <<'EOF'
## Opis
Deo `/dashboard` gde vlasnik upravlja terenima.

## Acceptance criteria
- [ ] Tabela terena (naziv, podloga, cena, aktivan) sa dugmićima Izmeni i Obriši
- [ ] Dialog sa formom za dodavanje i izmenu
- [ ] Forma za radno vreme po danima
- [ ] Potvrda pre brisanja

## Hintovi
- shadcn `table`, `dialog`, `switch`
- Ista forma za dodavanje i izmenu: prima opcione početne vrednosti
EOF

issue "Dashboard: grafikoni zauzetosti i prihoda" "feature,frontend" "$M3" "$TIJANA" <<'EOF'
## Acceptance criteria
- [ ] Kartice na vrhu: prihod ovog meseca, broj rezervacija, prosečna zauzetost
- [ ] Linijski grafikon prihoda za poslednjih 30 dana
- [ ] Bar grafikon zauzetosti po terenu
- [ ] Grafikoni se lepo vide i u dark mode-u

## Hintovi
- shadcn `chart` komponenta (radi preko Recharts-a)
EOF

echo "==> Issue-i: M4 Polish i deploy"

issue "Slanje email potvrde rezervacije preko Resend-a" "backend" "$M4" "$JA" <<'EOF'
## Acceptance criteria
- [ ] Email se šalje posle uspešne rezervacije i posle otkazivanja
- [ ] Koristi šablon koji pravi Tijana
- [ ] Greška pri slanju ne obara rezervaciju (loguje se)
EOF

issue "E2E test glavnog toka (Playwright)" "chore" "$M4" "$JA" <<'EOF'
## Acceptance criteria
- [ ] Test: registracija → pretraga kluba → rezervacija termina → termin u "Moje rezervacije"
- [ ] Pokreće se u CI-ju na test bazi
EOF

issue "Deploy na Vercel i Neon" "chore,priority: high" "$M4" "$JA" <<'EOF'
## Acceptance criteria
- [ ] Produkciona baza na Neon-u, migracije pokrenute
- [ ] Env promenljive na Vercelu, Google OAuth podešen za produkcioni domen
- [ ] Demo nalozi (igrač i vlasnik) sa seed podacima, upisani u README
- [ ] Preview deploy za svaki PR
EOF

issue "Email šablon potvrde rezervacije" "feature,frontend" "$M4" "$TIJANA" <<'EOF'
## Acceptance criteria
- [ ] React Email šablon: logo, klub, teren, datum, vreme, cena, dugme "Pogledaj rezervaciju"
- [ ] Varijanta za otkazivanje
- [ ] Pregled u browseru preko `email dev`

## Hintovi
- Komponente iz `@react-email/components`
EOF

issue "Loading skeletoni, prazna stanja i 404 stranica" "chore,frontend" "$M4" "$TIJANA" <<'EOF'
## Acceptance criteria
- [ ] `loading.tsx` sa skeletonima za listu klubova, stranicu kluba, mečeve i dashboard
- [ ] Lepa prazna stanja (ikona, tekst, akcija) svuda gde lista može biti prazna
- [ ] Prilagođena `not-found.tsx` i `error.tsx`

## Hintovi
- shadcn `skeleton`
EOF

issue "Dark mode i provera izgleda na telefonu" "chore,frontend" "$M4" "$TIJANA" <<'EOF'
## Acceptance criteria
- [ ] Prekidač za temu u navbaru (svetla, tamna, sistemska)
- [ ] Sve stranice proverene u obe teme
- [ ] Sve stranice proverene na 375 px; nema horizontalnog skrolovanja
- [ ] Problemi koje nađeš prijavljeni kao zasebni `bug` issue-i

## Hintovi
- `next-themes`, shadcn ima uputstvo za dark mode
EOF

issue "Screenshotovi i opis projekta u README-u" "chore" "$M4" "$TIJANA" <<'EOF'
## Acceptance criteria
- [ ] Screenshotovi glavnih ekrana (početna, klub sa kalendarom, mečevi, dashboard), svetla i tamna tema
- [ ] Kratak GIF rezervacije termina
- [ ] Sekcije: funkcionalnosti, stack, pokretanje lokalno, demo nalozi, "Kako smo koristili AI", tim
- [ ] Link ka live demu na vrhu
EOF

echo
echo "Gotovo. Sada napravi Project board (github.com/$REPO → Projects → New project → Board)"
echo "i dodaj sve issue-e u njega, ili ga podesi da ih dodaje automatski (Workflows → Auto-add)."
