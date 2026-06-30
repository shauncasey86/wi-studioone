import { cache } from "react";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  contentSchema,
  bacsSchema,
  contactSchema,
  mapSchema,
} from "@/lib/content";

const linksSchema = z.array(
  z.object({ label: z.string(), href: z.string() }).strict(),
);

/**
 * Single cached fetch of everything the public site renders: the SiteSettings
 * singleton (its JSON columns validated by zod) plus every reorderable list,
 * ordered. React's cache() dedupes this to one round-trip per request even
 * though several section components call it.
 */
export const getSiteData = cache(async () => {
  const [
    settings,
    kinds,
    howSteps,
    policies,
    roomFacts,
    changeoverItems,
    navItems,
    footerColumns,
    heroEyebrows,
    manifestoFoots,
    rateTiers,
  ] = await Promise.all([
    prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.kind.findMany({ orderBy: { order: "asc" } }),
    prisma.howStep.findMany({ orderBy: { order: "asc" } }),
    prisma.policy.findMany({ orderBy: { order: "asc" } }),
    prisma.roomFact.findMany({ orderBy: { order: "asc" } }),
    prisma.changeoverItem.findMany({ orderBy: { order: "asc" } }),
    prisma.navItem.findMany({ orderBy: { order: "asc" } }),
    prisma.footerColumn.findMany({ orderBy: { order: "asc" } }),
    prisma.heroEyebrow.findMany({ orderBy: { order: "asc" } }),
    prisma.manifestoFoot.findMany({ orderBy: { order: "asc" } }),
    prisma.rateTier.findMany({ orderBy: { hours: "asc" } }),
  ]);

  return {
    settings,
    content: contentSchema.parse(settings.content),
    bacs: bacsSchema.parse(settings.bacs),
    contact: contactSchema.parse(settings.contact),
    map: mapSchema.parse(settings.map),
    kinds,
    howSteps,
    policies,
    roomFacts,
    changeoverItems,
    navItems,
    footerColumns: footerColumns.map((c) => ({
      ...c,
      links: linksSchema.parse(c.links),
    })),
    heroEyebrows,
    manifestoFoots,
    rateTiers,
  };
});

export type SiteData = Awaited<ReturnType<typeof getSiteData>>;
