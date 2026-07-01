"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

/**
 * Testing mode. On enter we snapshot the editable content (SiteSettings JSON +
 * operational fields) and every reorderable list / block / hold. While on, you
 * can book and edit freely. On exit we restore that snapshot and delete any
 * bookings created during the test window — so testing leaves no trace.
 *
 * Emails still send in testing mode (so you can verify them end to end).
 */

type Snapshot = {
  settings: {
    content: Prisma.InputJsonValue;
    bacs: Prisma.InputJsonValue;
    contact: Prisma.InputJsonValue;
    map: Prisma.InputJsonValue;
    openHour: number;
    closeHour: number;
    minHours: number;
    maxHours: number;
    resetHours: number;
    daysAhead: number;
    pendingTtlHrs: number;
    doorCode: string;
    doorCodeNote: string | null;
    studioEmails: string[];
    fromEmail: string;
  };
  kinds: unknown[];
  howSteps: unknown[];
  policies: unknown[];
  roomFacts: unknown[];
  roomPhotos: unknown[];
  changeoverItems: unknown[];
  navItems: unknown[];
  footerColumns: unknown[];
  heroEyebrows: unknown[];
  manifestoFoots: unknown[];
  rateTiers: unknown[];
  blocks: unknown[];
  holds: unknown[];
};

async function capture(): Promise<Snapshot> {
  const s = await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  const [
    kinds,
    howSteps,
    policies,
    roomFacts,
    roomPhotos,
    changeoverItems,
    navItems,
    footerColumns,
    heroEyebrows,
    manifestoFoots,
    rateTiers,
    blocks,
    holds,
  ] = await Promise.all([
    prisma.kind.findMany({
      select: { order: true, kicker: true, line: true, timeTag: true },
    }),
    prisma.howStep.findMany({
      select: { order: true, label: true, heading: true, body: true },
    }),
    prisma.policy.findMany({
      select: { order: true, kicker: true, body: true },
    }),
    prisma.roomFact.findMany({
      select: { order: true, strong: true, text: true },
    }),
    prisma.roomPhoto.findMany({
      select: { order: true, url: true, alt: true },
    }),
    prisma.changeoverItem.findMany({ select: { order: true, text: true } }),
    prisma.navItem.findMany({
      select: { order: true, label: true, anchor: true, cur: true },
    }),
    prisma.footerColumn.findMany({
      select: { order: true, title: true, links: true },
    }),
    prisma.heroEyebrow.findMany({ select: { order: true, text: true } }),
    prisma.manifestoFoot.findMany({
      select: { order: true, term: true, def: true },
    }),
    prisma.rateTier.findMany({ select: { hours: true, price: true } }),
    prisma.block.findMany({
      select: { date: true, startHour: true, endHour: true, label: true },
    }),
    prisma.recurringHold.findMany({
      select: { weekday: true, startHour: true, endHour: true, label: true },
    }),
  ]);
  return {
    settings: {
      content: s.content as Prisma.InputJsonValue,
      bacs: s.bacs as Prisma.InputJsonValue,
      contact: s.contact as Prisma.InputJsonValue,
      map: s.map as Prisma.InputJsonValue,
      openHour: s.openHour,
      closeHour: s.closeHour,
      minHours: s.minHours,
      maxHours: s.maxHours,
      resetHours: s.resetHours,
      daysAhead: s.daysAhead,
      pendingTtlHrs: s.pendingTtlHrs,
      doorCode: s.doorCode,
      doorCodeNote: s.doorCodeNote,
      studioEmails: s.studioEmails,
      fromEmail: s.fromEmail,
    },
    kinds,
    howSteps,
    policies,
    roomFacts,
    roomPhotos,
    changeoverItems,
    navItems,
    footerColumns,
    heroEyebrows,
    manifestoFoots,
    rateTiers,
    blocks,
    holds,
  };
}

export async function enterTestMode() {
  await requireAdmin();
  const snap = await capture();
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      testMode: true,
      testStartedAt: new Date(),
      testSnapshot: snap as unknown as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}

export async function exitTestMode() {
  await requireAdmin();
  const s = await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
  if (!s.testMode) return;
  const snap = s.testSnapshot as unknown as Snapshot | null;
  const startedAt = s.testStartedAt;

  await prisma.$transaction(async (tx) => {
    if (snap) {
      await tx.siteSettings.update({
        where: { id: 1 },
        data: {
          ...snap.settings,
          content: snap.settings.content,
          bacs: snap.settings.bacs,
          contact: snap.settings.contact,
          map: snap.settings.map,
        },
      });
      // restore every list / block / hold from the snapshot
      await tx.kind.deleteMany();
      await tx.howStep.deleteMany();
      await tx.policy.deleteMany();
      await tx.roomFact.deleteMany();
      await tx.roomPhoto.deleteMany();
      await tx.changeoverItem.deleteMany();
      await tx.navItem.deleteMany();
      await tx.footerColumn.deleteMany();
      await tx.heroEyebrow.deleteMany();
      await tx.manifestoFoot.deleteMany();
      await tx.rateTier.deleteMany();
      await tx.block.deleteMany();
      await tx.recurringHold.deleteMany();

      const as = <T>(rows: unknown[]) => rows as unknown as T[];
      if (snap.kinds.length)
        await tx.kind.createMany({
          data: as<Prisma.KindCreateManyInput>(snap.kinds),
        });
      if (snap.howSteps.length)
        await tx.howStep.createMany({
          data: as<Prisma.HowStepCreateManyInput>(snap.howSteps),
        });
      if (snap.policies.length)
        await tx.policy.createMany({
          data: as<Prisma.PolicyCreateManyInput>(snap.policies),
        });
      if (snap.roomFacts.length)
        await tx.roomFact.createMany({
          data: as<Prisma.RoomFactCreateManyInput>(snap.roomFacts),
        });
      if (snap.roomPhotos.length)
        await tx.roomPhoto.createMany({
          data: as<Prisma.RoomPhotoCreateManyInput>(snap.roomPhotos),
        });
      if (snap.changeoverItems.length)
        await tx.changeoverItem.createMany({
          data: as<Prisma.ChangeoverItemCreateManyInput>(snap.changeoverItems),
        });
      if (snap.navItems.length)
        await tx.navItem.createMany({
          data: as<Prisma.NavItemCreateManyInput>(snap.navItems),
        });
      if (snap.footerColumns.length)
        await tx.footerColumn.createMany({
          data: as<Prisma.FooterColumnCreateManyInput>(snap.footerColumns),
        });
      if (snap.heroEyebrows.length)
        await tx.heroEyebrow.createMany({
          data: as<Prisma.HeroEyebrowCreateManyInput>(snap.heroEyebrows),
        });
      if (snap.manifestoFoots.length)
        await tx.manifestoFoot.createMany({
          data: as<Prisma.ManifestoFootCreateManyInput>(snap.manifestoFoots),
        });
      if (snap.rateTiers.length)
        await tx.rateTier.createMany({
          data: as<Prisma.RateTierCreateManyInput>(snap.rateTiers),
        });
      if (snap.blocks.length)
        await tx.block.createMany({
          data: (snap.blocks as { date: string }[]).map((b) => ({
            ...b,
            date: new Date(b.date),
          })) as Prisma.BlockCreateManyInput[],
        });
      if (snap.holds.length)
        await tx.recurringHold.createMany({
          data: as<Prisma.RecurringHoldCreateManyInput>(snap.holds),
        });
    }

    // remove bookings made during the test window
    if (startedAt) {
      await tx.booking.deleteMany({ where: { createdAt: { gte: startedAt } } });
    }

    await tx.siteSettings.update({
      where: { id: 1 },
      data: {
        testMode: false,
        testStartedAt: null,
        testSnapshot: Prisma.DbNull,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}
