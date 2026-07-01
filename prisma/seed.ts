// Idempotent seed: loads today's exact copy from legacy/studioone.html (the
// Phase 1 content, now kept in lib/defaults.ts) into the database, so a fresh
// deploy renders the current site exactly. Re-running replaces the content
// singleton and all list rows; it never touches bookings.
//
// The default copy is the single source of truth in lib/defaults.ts — shared
// with the admin "reset to defaults" actions so the two can never drift.

import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  defaultContent as content,
  defaultBacs as bacs,
  defaultContact as contact,
  defaultMap as map,
  defaultNavItems as navItems,
  defaultHeroEyebrows as heroEyebrows,
  defaultManifestoFoots as manifestoFoots,
  defaultKinds as kinds,
  defaultHowSteps as howSteps,
  defaultRoomFacts as roomFacts,
  defaultRoomPhotos as roomPhotos,
  defaultChangeoverItems as changeoverItems,
  defaultPolicies as policies,
  defaultFooterColumns as footerColumns,
  defaultRateTiers as rateTiers,
} from "../lib/defaults";

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

    prisma.roomPhoto.deleteMany(),
    prisma.roomPhoto.createMany({
      data: roomPhotos.map((p, order) => ({ ...p, order })),
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
