/**
 * Test podaci za lokalni razvoj: nalozi, klubovi, tereni, radno vreme, rezervacije i otvoreni mečevi.
 *
 * Pokretanje: npm run db:seed
 *
 * Skripta se može pokretati više puta: prvo briše prethodne test podatke, pa ih pravi ponovo.
 * Briše SVE klubove i rezervacije, ali od korisnika samo test naloge (@servis.test),
 * tako da tvoji lični nalozi ostaju.
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Surface, SkillLevel, MatchType } from "../src/generated/prisma/client";

config({ path: [".env.local", ".env"], quiet: true });

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL nije podešen u .env.local");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const TEST_DOMAIN = "@servis.test";
const TEST_PASSWORD = "lozinka123";
const TIME_ZONE = "Europe/Belgrade";

// ─── Pomoćne funkcije ─────────────────────────────────────

/** Deterministički "slučajni" brojevi, da seed svaki put da iste podatke. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
const random = createRandom(42);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

/** Današnji datum u Beogradu kao [godina, mesec, dan]. */
function todayInBelgrade(): [number, number, number] {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE })
    .format(new Date())
    .split("-")
    .map(Number);
  return [y!, m!, d!];
}

/** Razlika (u ms) između beogradskog i UTC vremena u datom trenutku: +1 h zimi, +2 h leti. */
function belgradeOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return asUtc - instant.getTime();
}

/** Trenutak (UTC) koji odgovara satu `hour` po beogradskom vremenu, `dayOffset` dana od danas. */
function belgradeTime(dayOffset: number, hour: number): Date {
  const [y, m, d] = todayInBelgrade();
  const guess = new Date(Date.UTC(y, m - 1, d + dayOffset, hour));
  return new Date(guess.getTime() - belgradeOffsetMs(guess));
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Podaci ───────────────────────────────────────────────

type SeedUser = { name: string; email: string; role: "PLAYER" | "CLUB_OWNER" };

const USERS: SeedUser[] = [
  { name: "Marko Vlasnik", email: `vlasnik1${TEST_DOMAIN}`, role: "CLUB_OWNER" },
  { name: "Jelena Vlasnik", email: `vlasnik2${TEST_DOMAIN}`, role: "CLUB_OWNER" },
  { name: "Nikola Igrač", email: `igrac1${TEST_DOMAIN}`, role: "PLAYER" },
  { name: "Ana Igrač", email: `igrac2${TEST_DOMAIN}`, role: "PLAYER" },
  { name: "Stefan Igrač", email: `igrac3${TEST_DOMAIN}`, role: "PLAYER" },
  { name: "Milica Igrač", email: `igrac4${TEST_DOMAIN}`, role: "PLAYER" },
];

type SeedCourt = { name: string; surface: Surface; indoor: boolean; pricePerHour: number };
type SeedClub = {
  name: string;
  city: string;
  address: string;
  phone: string;
  description: string;
  owner: number; // indeks vlasnika u USERS
  hours: { weekday: [string, string]; weekend: [string, string] };
  courts: SeedCourt[];
};

const CLUBS: SeedClub[] = [
  {
    name: "Teniski centar Košutnjak",
    city: "Beograd",
    address: "Kneza Višeslava 27",
    phone: "+381 11 123 4567",
    description: "Šljaka u šumi, mir i svež vazduh. Svlačionice sa tuševima i parking.",
    owner: 0,
    hours: { weekday: ["07:00", "22:00"], weekend: ["08:00", "20:00"] },
    courts: [
      { name: "Teren 1", surface: "CLAY", indoor: false, pricePerHour: 1800 },
      { name: "Teren 2", surface: "CLAY", indoor: false, pricePerHour: 1800 },
      { name: "Teren 3", surface: "CLAY", indoor: false, pricePerHour: 1600 },
      { name: "Centralni", surface: "CLAY", indoor: false, pricePerHour: 2200 },
    ],
  },
  {
    name: "Ada Tennis Club",
    city: "Beograd",
    address: "Ada Ciganlija bb",
    phone: "+381 11 234 5678",
    description: "Tereni pored jezera, idealni za jutarnje mečeve. Kafić i iznajmljivanje reketa.",
    owner: 0,
    hours: { weekday: ["08:00", "23:00"], weekend: ["08:00", "23:00"] },
    courts: [
      { name: "Jezero 1", surface: "CLAY", indoor: false, pricePerHour: 2000 },
      { name: "Jezero 2", surface: "CLAY", indoor: false, pricePerHour: 2000 },
      { name: "Hala", surface: "HARD", indoor: true, pricePerHour: 2800 },
    ],
  },
  {
    name: "Novi Beograd Arena",
    city: "Beograd",
    address: "Bulevar Mihajla Pupina 10",
    phone: "+381 11 345 6789",
    description: "Zatvorena hala sa tri tvrda terena, radi cele godine.",
    owner: 1,
    hours: { weekday: ["07:00", "23:00"], weekend: ["09:00", "21:00"] },
    courts: [
      { name: "Hala A", surface: "HARD", indoor: true, pricePerHour: 3000 },
      { name: "Hala B", surface: "HARD", indoor: true, pricePerHour: 3000 },
      { name: "Hala C", surface: "CARPET", indoor: true, pricePerHour: 2600 },
    ],
  },
  {
    name: "TK Dunavski kej",
    city: "Novi Sad",
    address: "Dunavski kej 5",
    phone: "+381 21 456 7890",
    description: "Šljaka uz Dunav, na pet minuta od centra grada.",
    owner: 1,
    hours: { weekday: ["07:00", "21:00"], weekend: ["08:00", "20:00"] },
    courts: [
      { name: "Teren 1", surface: "CLAY", indoor: false, pricePerHour: 1400 },
      { name: "Teren 2", surface: "CLAY", indoor: false, pricePerHour: 1400 },
      { name: "Teren 3", surface: "HARD", indoor: false, pricePerHour: 1200 },
    ],
  },
  {
    name: "Liman Tenis",
    city: "Novi Sad",
    address: "Bulevar despota Stefana 42",
    phone: "+381 21 567 8901",
    description: "Porodični klub sa školom tenisa i travnatim terenom za ljubitelje.",
    owner: 1,
    hours: { weekday: ["08:00", "22:00"], weekend: ["08:00", "22:00"] },
    courts: [
      { name: "Trava", surface: "GRASS", indoor: false, pricePerHour: 2400 },
      { name: "Šljaka", surface: "CLAY", indoor: false, pricePerHour: 1500 },
    ],
  },
  {
    name: "Tenis klub Nišava",
    city: "Niš",
    address: "Bulevar Nemanjića 80",
    phone: "+381 18 678 9012",
    description: "Najveći teniski centar na jugu Srbije: šljaka napolju, tepih u balonu zimi.",
    owner: 0,
    hours: { weekday: ["07:00", "22:00"], weekend: ["08:00", "21:00"] },
    courts: [
      { name: "Teren 1", surface: "CLAY", indoor: false, pricePerHour: 1200 },
      { name: "Teren 2", surface: "CLAY", indoor: false, pricePerHour: 1200 },
      { name: "Balon", surface: "CARPET", indoor: true, pricePerHour: 1800 },
    ],
  },
];

// ─── Seed ─────────────────────────────────────────────────

async function clean() {
  await prisma.matchParticipant.deleteMany();
  await prisma.openMatch.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.openingHours.deleteMany();
  await prisma.court.deleteMany();
  await prisma.club.deleteMany();
  // Sesije i nalozi (account) se brišu kaskadno sa korisnikom.
  await prisma.user.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } });
}

async function createUsers() {
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const now = new Date();

  const users = [];
  for (const u of USERS) {
    const id = crypto.randomUUID();
    const user = await prisma.user.create({
      data: {
        id,
        name: u.name,
        email: u.email,
        emailVerified: true,
        role: u.role,
        createdAt: now,
        updatedAt: now,
        // Better Auth čuva lozinku u tabeli account, sa providerId "credential".
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: id,
            providerId: "credential",
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    });
    users.push(user);
  }
  return users;
}

async function main() {
  console.log("Brišem stare test podatke...");
  await clean();

  console.log("Pravim korisnike...");
  const users = await createUsers();
  const owners = users.filter((u) => u.role === "CLUB_OWNER");
  const players = users.filter((u) => u.role === "PLAYER");

  console.log("Pravim klubove, terene i radno vreme...");
  const courts: { id: string; pricePerHour: number; open: number; close: number }[] = [];

  for (const club of CLUBS) {
    const created = await prisma.club.create({
      data: {
        name: club.name,
        slug: slugify(club.name),
        city: club.city,
        address: club.address,
        phone: club.phone,
        description: club.description,
        images: [],
        ownerId: owners[club.owner]!.id,
        openingHours: {
          create: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
            const [openTime, closeTime] =
              dayOfWeek === 0 || dayOfWeek === 6 ? club.hours.weekend : club.hours.weekday;
            return { dayOfWeek, openTime, closeTime };
          }),
        },
        courts: { create: club.courts },
      },
      include: { courts: true },
    });

    // Za rezervacije koristimo radno vreme radnim danima (dovoljno za test podatke).
    const open = Number(club.hours.weekday[0].slice(0, 2));
    const close = Number(club.hours.weekday[1].slice(0, 2));
    for (const c of created.courts) {
      courts.push({ id: c.id, pricePerHour: c.pricePerHour, open, close });
    }
  }

  console.log("Pravim rezervacije (30 dana unazad i 14 unapred)...");
  const bookingData: {
    courtId: string;
    userId: string;
    startsAt: Date;
    endsAt: Date;
    totalPrice: number;
    status: "CONFIRMED" | "CANCELLED";
  }[] = [];

  for (let day = -30; day <= 14; day++) {
    for (const court of courts) {
      // 0–4 rezervacije po terenu dnevno, u različitim satima, bez preklapanja.
      const count = Math.floor(random() * 5);
      const hours = new Set<number>();
      while (hours.size < count) {
        hours.add(court.open + Math.floor(random() * (court.close - court.open)));
      }
      for (const hour of hours) {
        const startsAt = belgradeTime(day, hour);
        bookingData.push({
          courtId: court.id,
          userId: pick(players).id,
          startsAt,
          endsAt: addHours(startsAt, 1),
          totalPrice: court.pricePerHour,
          status: random() < 0.08 ? "CANCELLED" : "CONFIRMED",
        });
      }
    }
  }
  await prisma.booking.createMany({ data: bookingData });

  console.log("Pravim otvorene mečeve...");
  const upcoming = await prisma.booking.findMany({
    where: { status: "CONFIRMED", startsAt: { gt: belgradeTime(1, 0) } },
    orderBy: { startsAt: "asc" },
    take: 40,
  });

  const levels: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
  const notes = [
    "Tražim partnera za opušten meč.",
    "Igramo set, posle kafa.",
    "Fali nam četvrti za dubl!",
    null,
  ];

  let matches = 0;
  for (const [i, booking] of upcoming.entries()) {
    if (i % 5 !== 0) continue; // svaka peta buduća rezervacija postaje otvoren meč
    const type: MatchType = i % 2 === 0 ? "DOUBLES" : "SINGLES";
    const others = players.filter((p) => p.id !== booking.userId);
    // Dubl: organizator + 0–2 igrača, uvek bar jedno slobodno mesto. Singl: samo organizator.
    const joined = type === "DOUBLES" ? others.slice(0, Math.floor(random() * 3)) : [];

    await prisma.openMatch.create({
      data: {
        bookingId: booking.id,
        type,
        level: pick(levels),
        note: pick(notes),
        participants: {
          create: [booking.userId, ...joined.map((p) => p.id)].map((userId) => ({ userId })),
        },
      },
    });
    matches++;
  }

  console.log(
    `\nGotovo: ${users.length} korisnika, ${CLUBS.length} klubova, ${courts.length} terena, ` +
      `${bookingData.length} rezervacija, ${matches} otvorenih mečeva.`,
  );
  console.log(`Test nalozi (lozinka za sve: ${TEST_PASSWORD}):`);
  for (const u of USERS) console.log(`  ${u.email.padEnd(24)} ${u.role}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
