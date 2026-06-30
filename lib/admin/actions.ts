"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/session";
import { verifyCredentials, rateLimit, clearRateLimit } from "@/lib/auth";
import {
  contentSchema,
  bacsSchema,
  contactSchema,
  mapSchema,
} from "@/lib/content";
import { ALL_FIELDS, setPath } from "@/lib/admin/content-fields";
import { LISTS } from "@/lib/admin/lists-config";
import { save as saveMedia, isAllowedImage } from "@/lib/storage";

function revalidateSite() {
  revalidatePath("/");
}

// ── auth ──
export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "local";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(limit.retryInMs / 60000)} min.`,
    };
  }
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const user = await verifyCredentials(email, password);
  if (!user) return { error: "Incorrect email or password." };

  clearRateLimit(ip);
  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  await session.save();
  redirect("/admin");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

// ── scalar content ──
export async function saveContent(formData: FormData) {
  await requireAdmin();
  const content: Record<string, unknown> = {};
  for (const f of ALL_FIELDS) {
    const raw = formData.get(f.path);
    if (f.kind === "lines") {
      const arr = String(raw ?? "")
        .split("\n")
        .map((s) => s.replace(/\r$/, ""))
        .filter((s) => s.trim() !== "");
      setPath(content, f.path, arr);
    } else {
      setPath(content, f.path, String(raw ?? ""));
    }
  }
  const parsed = contentSchema.parse(content);
  await prisma.siteSettings.update({
    where: { id: 1 },
    data: { content: parsed },
  });
  revalidateSite();
  revalidatePath("/admin/content");
}

// ── settings (BACS, contact, map, door code, emails) ──
export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const s = (k: string) => String(formData.get(k) ?? "");
  const bacs = bacsSchema.parse({
    accountName: s("bacs.accountName"),
    sortCode: s("bacs.sortCode"),
    accountNo: s("bacs.accountNo"),
    referencePrefix: s("bacs.referencePrefix"),
    demo: formData.get("bacs.demo") === "on",
  });
  const contact = contactSchema.parse({
    email: s("contact.email"),
    phone: s("contact.phone"),
    replies: s("contact.replies"),
  });
  const map = mapSchema.parse({
    lat: Number(s("map.lat")),
    lng: Number(s("map.lng")),
    zoom: Number(s("map.zoom")),
    tagLabel: s("map.tagLabel"),
    coordsText: s("map.coordsText"),
    openMapsUrl: s("map.openMapsUrl"),
    embedSrc: s("map.embedSrc"),
  });
  const studioEmails = s("studioEmails")
    .split(/[\n,]/)
    .map((e) => e.trim())
    .filter(Boolean);

  await prisma.siteSettings.update({
    where: { id: 1 },
    data: {
      bacs,
      contact,
      map,
      doorCode: s("doorCode"),
      doorCodeNote: s("doorCodeNote") || null,
      fromEmail: s("fromEmail"),
      studioEmails,
    },
  });
  revalidateSite();
  revalidatePath("/admin/settings");
}

// ── pricing & operational rules ──
export async function savePricing(formData: FormData) {
  await requireAdmin();
  const int = (k: string, fallback: number) => {
    const n = parseInt(String(formData.get(k) ?? ""), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const tierUpdates = [];
  for (let h = 1; h <= 8; h++) {
    const price = int(`price.${h}`, 0);
    tierUpdates.push(
      prisma.rateTier.upsert({
        where: { hours: h },
        create: { hours: h, price },
        update: { price },
      }),
    );
  }

  await prisma.$transaction([
    ...tierUpdates,
    prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        openHour: int("openHour", 7),
        closeHour: int("closeHour", 22),
        minHours: int("minHours", 1),
        maxHours: int("maxHours", 8),
        resetHours: int("resetHours", 1),
        daysAhead: int("daysAhead", 28),
        pendingTtlHrs: int("pendingTtlHrs", 48),
      },
    }),
  ]);
  revalidateSite();
  revalidatePath("/admin/pricing");
}

// ── reorderable lists (generic CRUD) ──
type AnyDelegate = {
  findMany: (a: unknown) => Promise<Array<{ id: string; order: number }>>;
  aggregate: (a: unknown) => Promise<{ _max: { order: number | null } }>;
  create: (a: unknown) => Promise<unknown>;
  update: (a: unknown) => Promise<unknown>;
  delete: (a: unknown) => Promise<unknown>;
};

function delegate(listKey: string): AnyDelegate {
  const cfg = LISTS[listKey];
  if (!cfg) throw new Error(`Unknown list: ${listKey}`);
  return (prisma as unknown as Record<string, AnyDelegate>)[cfg.model];
}

function parseLinks(raw: string) {
  return raw
    .split("\n")
    .map((l) => l.replace(/\r$/, "").trim())
    .filter(Boolean)
    .map((l) => {
      const [label, href = ""] = l.split("|").map((p) => p.trim());
      return { label, href };
    });
}

function dataFromForm(listKey: string, formData: FormData) {
  const cfg = LISTS[listKey];
  const data: Record<string, unknown> = {};
  for (const field of cfg.fields) {
    const raw = String(formData.get(field.key) ?? "");
    data[field.key] = field.kind === "links" ? parseLinks(raw) : raw;
  }
  return data;
}

export async function addListItem(listKey: string) {
  await requireAdmin();
  const cfg = LISTS[listKey];
  const del = delegate(listKey);
  const max = await del.aggregate({ _max: { order: true } });
  const order = (max._max.order ?? -1) + 1;
  const blank: Record<string, unknown> = { order };
  for (const field of cfg.fields)
    blank[field.key] = field.kind === "links" ? [] : "";
  await del.create({ data: blank });
  revalidateSite();
  revalidatePath("/admin/lists");
}

export async function updateListItem(
  listKey: string,
  id: string,
  formData: FormData,
) {
  await requireAdmin();
  await delegate(listKey).update({
    where: { id },
    data: dataFromForm(listKey, formData),
  });
  revalidateSite();
  revalidatePath("/admin/lists");
}

export async function deleteListItem(listKey: string, id: string) {
  await requireAdmin();
  await delegate(listKey).delete({ where: { id } });
  revalidateSite();
  revalidatePath("/admin/lists");
}

export async function moveListItem(
  listKey: string,
  id: string,
  dir: "up" | "down",
) {
  await requireAdmin();
  const del = delegate(listKey);
  const items = await del.findMany({ orderBy: { order: "asc" } });
  const idx = items.findIndex((i) => i.id === id);
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
  const a = items[idx];
  const b = items[swapIdx];
  // Two-step swap via a temporary order to respect any future unique(order).
  await del.update({ where: { id: a.id }, data: { order: -1 } });
  await del.update({ where: { id: b.id }, data: { order: a.order } });
  await del.update({ where: { id: a.id }, data: { order: b.order } });
  revalidateSite();
  revalidatePath("/admin/lists");
}

// ── media upload ──
export async function uploadMedia(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file." };
  }
  if (!isAllowedImage(file.type)) {
    return { error: `Unsupported type: ${file.type || "unknown"}` };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Max 5 MB." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const { key, url } = await saveMedia(buf, file.type);
  await prisma.mediaAsset.create({
    data: { key, url, alt: String(formData.get("alt") || "") || null },
  });
  return { url };
}
