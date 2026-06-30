"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { contentSchema } from "@/lib/content";
import { CONTENT_GROUPS, getPath, setPath } from "@/lib/admin/content-fields";
import { LISTS } from "@/lib/admin/lists-config";
import { defaultContent, listDefaults } from "@/lib/defaults";

/**
 * "Reset to defaults" — restore the seeded copy from lib/defaults.ts. Granular:
 * a single content section, a single list, or everything at once. None of these
 * touch bookings, pricing/rate tiers, BACS/contact/map settings, or uploaded
 * media — only the editable site copy and the reorderable lists.
 */

type ListDelegate = {
  deleteMany: (args?: unknown) => Promise<unknown>;
  createMany: (args: { data: unknown }) => Promise<unknown>;
};

function listDelegate(
  tx: Prisma.TransactionClient,
  model: string,
): ListDelegate {
  return (tx as unknown as Record<string, ListDelegate>)[model];
}

async function rebuildList(tx: Prisma.TransactionClient, listKey: string) {
  const cfg = LISTS[listKey];
  if (!cfg) throw new Error(`Unknown list: ${listKey}`);
  const del = listDelegate(tx, cfg.model);
  await del.deleteMany();
  const data = listDefaults[listKey];
  if (data.length) await del.createMany({ data });
}

// Reset one content section to its default copy, leaving every other section's
// edits untouched. groupKey is a CONTENT_GROUPS key.
export async function resetContentSection(groupKey: string) {
  await requireAdmin();
  const group = CONTENT_GROUPS.find((g) => g.key === groupKey);
  if (!group) throw new Error(`Unknown content section: ${groupKey}`);
  const settings = await prisma.siteSettings.findUniqueOrThrow({
    where: { id: 1 },
  });
  const next = structuredClone(settings.content) as Record<string, unknown>;
  for (const f of group.fields) {
    setPath(next, f.path, getPath(defaultContent, f.path));
  }
  const parsed = contentSchema.parse(next);
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: { content: parsed },
  });
  revalidatePath("/");
  revalidatePath("/admin/content");
}

// Reset one reorderable list to its default rows.
export async function resetList(listKey: string) {
  await requireAdmin();
  await prisma.$transaction((tx) => rebuildList(tx, listKey));
  revalidatePath("/");
  revalidatePath("/admin/lists");
}

// Reset every content section and every list to defaults in one go.
export async function resetEverything() {
  await requireAdmin();
  const parsed = contentSchema.parse(defaultContent);
  await prisma.$transaction(async (tx) => {
    await tx.siteSettings.update({
      where: { id: 1 },
      data: { content: parsed },
    });
    for (const listKey of Object.keys(LISTS)) {
      await rebuildList(tx, listKey);
    }
  });
  revalidatePath("/");
  revalidatePath("/admin/content");
  revalidatePath("/admin/lists");
  revalidatePath("/admin");
}
