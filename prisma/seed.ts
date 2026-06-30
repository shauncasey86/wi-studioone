// Idempotent seed: loads today's exact copy from legacy/studioone.html (the
// Phase 1 hardcoded content) into the database, so a fresh deploy renders the
// current site exactly. Re-running replaces the content singleton and all list
// rows; it never touches bookings.
//
// Rich fields use the *italic* / **bold** / [label](href) convention
// (see lib/richtext). A non-breaking space is written as  .

import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seed/refresh the single owner from ADMIN_EMAIL/ADMIN_PASSWORD (CLAUDE.md §15).
// The password is read at seed-time only and stored as a bcrypt hash. Skips when
// the env vars are absent. Safe to run on every deploy.
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
  console.log(`[seed] Admin user ensured: ${email}`);
}

const NB = " ";

const content = {
  meta: {
    title:
      "StudioONE — one studio in Hull, booked by the hour. Sutton Village.",
    description:
      "StudioONE — a bare, daylit studio in Sutton Village, Hull. £45 the first hour, less for each after, one-hour minimum. Pay by bank transfer; your door code arrives by email once it clears. For shoots, classes, dinners, workshops and quiet days.",
    canonical: "https://studioone.room/",
    ogTitle: "StudioONE — a room in Hull, kept by the hour",
    ogDescription:
      "A bare, daylit room in Sutton Village, Hull. £45 the first hour, less for each after, one-hour minimum. Pay by transfer; the door code lands by email once it clears.",
    ogImage:
      "https://images.unsplash.com/photo-1722604819704-78b6d9c26ea9?auto=format&fit=crop&w=1200&h=630&q=80",
    ogImageAlt: "The room — empty, daylit, oak floor, lime-plaster walls.",
    twitterTitle: "StudioONE — a room in Hull, kept by the hour",
    twitterDescription:
      "A bare, daylit room in Sutton Village, Hull. £45 the first hour, less for each after, one-hour minimum. Code by email once payment clears.",
    themeColor: "#221a13",
  },
  brand: { lead: "Studio", mark: "ONE" },
  hero: {
    titleLines: ["A room", "kept by", "the *hour.*"],
    sub: "Forty square metres, bare and daylit. Booked by the hour, up to eight at a time. Pay by transfer; the door code lands by email once it clears.",
    price: {
      amount: "£45",
      unit: "first hour",
      fine: "Less for each after · no account",
    },
    cta: { label: "See the diary", target: "#book", cur: "Book" },
  },
  manifesto: {
    cnum: "01 — One room, on purpose",
    clede:
      "A class at seven in the morning. A birthday dinner that night. Same plaster, same floor, same room. Pay by transfer; the code arrives by email once it clears.",
    pullWords: [
      "One",
      "room.",
      "Plain",
      "enough",
      "to",
      "shoot",
      "in.",
      "Quiet",
      "enough",
      "to",
      "teach",
      "in.",
      "Big",
      "enough",
      "to",
      "*sit ten for dinner.*",
    ],
  },
  days: {
    cnum: "02 — One room, many days",
    title: "Five kinds *of day.*",
    lede: "Some weeks all five. Some weeks the same one, every Tuesday.",
  },
  roomStatement: { line: "Bare. Daylit. *Looked after.*" },
  how: {
    cnum: "03 — How it works",
    title: "Three steps. *That's it.*",
    lede: "Pick a time. Get a code. Walk in. No account, no subscription, no surprise at the door.",
  },
  diary: {
    cnum: "04 — The diary",
    title: "Four weeks *out.*",
    lede: "Live availability, four weeks out. Choose a day on the calendar and its open hours appear beside it.",
  },
  practical: {
    cnum: "05 — Before you book",
    title: "The practical part, *kept short.*",
    lede: "What the room is, how it's kept between bookings, what it costs — and where to find it.",
    roomFactsLabel: "The room",
    docket: {
      header: "Changeover record",
      status: "Ready",
      sign: "Self-access, start to finish — left ready for you",
    },
    rates: {
      header: "By the hour, kinder by the day",
      note: "Every hour in between is priced to match; eight hours is the longest single booking, and you pay by bank transfer at checkout. Need a full day-plus or a block of dates? [Message the studio](mailto:hello@studioone.room?subject=Block%20booking%20%E2%80%94%20StudioONE) and we'll set a rate.",
    },
  },
  cta: {
    headline: "An hour *is plenty.*",
    button: { label: "Reserve the room", target: "#book", cur: "Book" },
  },
  footer: {
    lede: "A ground-floor room in Sutton Village, Hull. Let by the hour, every day.",
    bottom: ["StudioONE · HU7 · 2026", "Built for the room, not the brief"],
  },
};

const bacs = {
  accountName: "StudioONE",
  sortCode: "00-00-00",
  accountNo: "0000 0000",
  referencePrefix: "S1",
  demo: true,
};

const contact = {
  email: "hello@studioone.room",
  phone: "07700 900 482",
  replies: "Replies within the hour",
};

const map = {
  lat: 53.7773,
  lng: -0.3203,
  zoom: 15,
  tagLabel: "Sutton Village · Hull",
  coordsText: "53.7773° N · 0.3203° W · HU7",
  openMapsUrl:
    "https://www.openstreetmap.org/?mlat=53.7773&mlon=-0.3203#map=15/53.7773/-0.3203",
  embedSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=-0.3323%2C53.7703%2C-0.3083%2C53.7843&layer=mapnik&marker=53.7773%2C-0.3203",
};

const navItems = [
  { label: "The day", anchor: "#days", cur: "Read" },
  { label: "The room", anchor: "#room", cur: "Look" },
  { label: "Upkeep", anchor: "#care", cur: "Upkeep" },
  { label: "Book", anchor: "#book", cur: "Book" },
];

const heroEyebrows = ["Sutton Village · Hull", "One room", "Est. 2026"];

const manifestoFoots = [
  {
    term: "Where",
    def: "Sutton Village, Hull. Ground floor, step-free. Free street parking. Twelve minutes from the centre.",
  },
  {
    term: "When",
    def: "Daily, 07:00–22:00. Whole hours, one-hour minimum. An hour's reset between guests.",
  },
  {
    term: "How",
    def: "Pick a day, a start and how long. Pay by transfer; the code lands by email once it clears. Walk in. That's the whole of it.",
  },
];

const kinds = [
  {
    kicker: "Dinners",
    line: "A long table for ten — candles, takeaway from up the road, the kettle on as you *arrive.*",
    timeTag: "Fri · evening",
  },
  {
    kicker: "Classes",
    line: "Twelve mats, two hours, morning light through the two tall *sashes.*",
    timeTag: "Tue · 07:00",
  },
  {
    kicker: "Shoots",
    line: "North-east light, and nothing in the frame to *edit out.*",
    timeTag: "Wed · daytime",
  },
  {
    kicker: "Quiet days",
    line: "A laptop, the kettle, the door shut — warmer than the *library.*",
    timeTag: "Thu · 09:00",
  },
  {
    kicker: "Workshops",
    line: "Eight wheels, plenty of clay, a big sink, then a clean *reset.*",
    timeTag: "Sat · daytime",
  },
];

const howSteps = [
  {
    label: "Step 01",
    heading: "Pick *your time.*",
    body: "Choose a day, a start time and how long you need. £45 the first hour and less for each after, one-hour minimum up to eight-hour days, booked in whole hours. Nothing to set up.",
  },
  {
    label: "Step 02",
    heading: "Get *the code.*",
    body: "Pay by bank transfer with the reference shown at checkout. Once it clears, your door code arrives by email — usually the same working day.",
  },
  {
    label: "Step 03",
    heading: "Find *it ready.*",
    body: "Reset between every guest. Cleaned, restocked, looked after. The room you booked is the room you walk into.",
  },
];

const roomFacts = [
  { strong: `~40${NB}m²`, text: " ground floor" },
  { strong: "Oak", text: " boards, sealed" },
  { strong: "North-east", text: " light, two tall sashes" },
  { strong: "Step-free", text: " wide door" },
  { strong: "Kettle", text: ", fridge, sink" },
  { strong: `250${NB}Mbps`, text: " fibre" },
  { strong: "14", text: " seated" },
  { strong: "Free", text: " on-street parking" },
];

const changeoverItems = [
  "Floors swept & mopped",
  "Surfaces wiped down",
  "Chairs reset & squared",
  "Windows aired, blinds set",
  "Kettle filled, mugs washed",
  "Bins fresh, WC restocked",
  "Heating & lights set",
  "Door code rolled over",
];

const policies = [
  {
    kicker: "Cancellation",
    body: "Cancel or move a booking up to **24 hours** before the start and you're refunded in full. Inside 24 hours, the first hour is kept and the rest comes back.",
  },
  {
    kicker: "Refunds",
    body: "Back to the account you paid from within **5–10 working days**. If the room is ever unavailable on our side — a leak, a power cut — you're refunded in full and offered the next free slot.",
  },
  {
    kicker: "Terms",
    body: "Daily 07:00–22:00, whole hours, one-hour minimum, an hour's reset between guests. Leave it as you found it. Over-18s book; under-18s welcome with a booking adult present.",
  },
];

const footerColumns = [
  {
    title: "Address",
    links: [
      { label: "Sutton Village", href: "" },
      { label: "Hull HU7", href: "" },
      { label: "United Kingdom", href: "" },
    ],
  },
  {
    title: "Hours",
    links: [
      { label: "Daily, 07:00–22:00", href: "" },
      { label: "Reset between guests", href: "" },
      { label: "Code by email", href: "" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "hello@studioone.room", href: "mailto:hello@studioone.room" },
      { label: "07700 900 482", href: "tel:+447700900482" },
      { label: "Replies within the hour", href: "" },
    ],
  },
  {
    title: "The fine print",
    links: [
      { label: "Cancellation", href: "#terms" },
      { label: "Refunds", href: "#terms" },
      { label: "Terms & map", href: "#terms" },
    ],
  },
];

const rateTiers = [
  { hours: 1, price: 45 },
  { hours: 2, price: 80 },
  { hours: 3, price: 110 },
  { hours: 4, price: 140 },
  { hours: 5, price: 170 },
  { hours: 6, price: 200 },
  { hours: 7, price: 225 },
  { hours: 8, price: 250 },
];

async function main() {
  await seedAdmin();

  // Seed-if-empty: safe to run on every deploy. If content already exists we
  // skip, so production admin edits (Phase 3) are never clobbered. Pass
  // SEED_FORCE=1 (or --force) to overwrite — used in dev to reset to baseline.
  const force =
    process.env.SEED_FORCE === "1" || process.argv.includes("--force");
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (existing && !force) {
    console.log(
      "[seed] SiteSettings already present — skipping (set SEED_FORCE=1 to overwrite).",
    );
    return;
  }

  await prisma.$transaction([
    prisma.siteSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        content: content as unknown as Prisma.InputJsonValue,
        bacs: bacs as unknown as Prisma.InputJsonValue,
        contact: contact as unknown as Prisma.InputJsonValue,
        map: map as unknown as Prisma.InputJsonValue,
        doorCode: "1701",
        doorCodeNote: "Rolled over at each changeover.",
        studioEmails: ["hello@studioone.room"],
        fromEmail: "hello@studioone.room",
      },
      update: {
        content: content as unknown as Prisma.InputJsonValue,
        bacs: bacs as unknown as Prisma.InputJsonValue,
        contact: contact as unknown as Prisma.InputJsonValue,
        map: map as unknown as Prisma.InputJsonValue,
      },
    }),

    prisma.kind.deleteMany(),
    prisma.kind.createMany({
      data: kinds.map((k, order) => ({ ...k, order })),
    }),

    prisma.howStep.deleteMany(),
    prisma.howStep.createMany({
      data: howSteps.map((s, order) => ({ ...s, order })),
    }),

    prisma.policy.deleteMany(),
    prisma.policy.createMany({
      data: policies.map((p, order) => ({ ...p, order })),
    }),

    prisma.roomFact.deleteMany(),
    prisma.roomFact.createMany({
      data: roomFacts.map((f, order) => ({ ...f, order })),
    }),

    prisma.changeoverItem.deleteMany(),
    prisma.changeoverItem.createMany({
      data: changeoverItems.map((text, order) => ({ text, order })),
    }),

    prisma.navItem.deleteMany(),
    prisma.navItem.createMany({
      data: navItems.map((n, order) => ({ ...n, order })),
    }),

    prisma.footerColumn.deleteMany(),
    prisma.footerColumn.createMany({
      data: footerColumns.map((c, order) => ({
        title: c.title,
        links: c.links as unknown as Prisma.InputJsonValue,
        order,
      })),
    }),

    prisma.heroEyebrow.deleteMany(),
    prisma.heroEyebrow.createMany({
      data: heroEyebrows.map((text, order) => ({ text, order })),
    }),

    prisma.manifestoFoot.deleteMany(),
    prisma.manifestoFoot.createMany({
      data: manifestoFoots.map((m, order) => ({ ...m, order })),
    }),

    prisma.rateTier.deleteMany(),
    prisma.rateTier.createMany({ data: rateTiers }),
  ]);

  console.log("[seed] Site content seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
