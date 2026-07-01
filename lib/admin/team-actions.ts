"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/session";

// Sub-admin management — owner only (gated by the "team" capability). Sub-admins
// are always created with role SUBADMIN; the OWNER role is reserved for the
// account seeded from ADMIN_EMAIL and is never mintable or removable from here.

export type TeamActionState = { error?: string; ok?: string };

const createSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(200, "That password is too long."),
});

export async function createSubAdmin(
  _prev: TeamActionState | undefined,
  formData: FormData,
): Promise<TeamActionState> {
  await requireCapability("team");
  const parsed = createSchema.safeParse({
    name: String(formData.get("name") || "") || undefined,
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return { error: "An admin with that email already exists." };

  await prisma.adminUser.create({
    data: {
      email,
      name: name || null,
      passwordHash: await bcrypt.hash(password, 12),
      role: "SUBADMIN",
    },
  });
  revalidatePath("/admin/team");
  return { ok: `Added ${email}.` };
}

// Only sub-admins are removable — owners can never be deleted from the UI.
export async function deleteSubAdmin(id: string) {
  await requireCapability("team");
  await prisma.adminUser.deleteMany({ where: { id, role: "SUBADMIN" } });
  revalidatePath("/admin/team");
}

const resetSchema = z.object({
  id: z.string().min(1),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(200, "That password is too long."),
});

export async function resetSubAdminPassword(
  _prev: TeamActionState | undefined,
  formData: FormData,
): Promise<TeamActionState> {
  await requireCapability("team");
  const parsed = resetSchema.safeParse({
    id: String(formData.get("id") || ""),
    password: String(formData.get("password") || ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const { id, password } = parsed.data;
  const result = await prisma.adminUser.updateMany({
    where: { id, role: "SUBADMIN" },
    data: { passwordHash: await bcrypt.hash(password, 12) },
  });
  if (result.count === 0) return { error: "That sub-admin no longer exists." };
  revalidatePath("/admin/team");
  return { ok: "Password updated." };
}
