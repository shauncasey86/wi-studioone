import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/session";
import { deleteSubAdmin } from "@/lib/admin/team-actions";
import { roleLabel } from "@/lib/admin/permissions";
import PageHeader from "@/components/admin/PageHeader";
import CreateSubAdminForm from "@/components/admin/CreateSubAdminForm";
import ResetPasswordForm from "@/components/admin/ResetPasswordForm";

export const dynamic = "force-dynamic";

const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function when(d: Date) {
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function TeamPage() {
  await requireCapability("team");
  const admins = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  const subAdmins = admins.filter((a) => a.role === "SUBADMIN");

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title={
          <>
            The <em>team.</em>
          </>
        }
        lede="Sub-admins can manage bookings, blocks, holds, opening hours and pricing — everything to run the diary day to day — but not site content, settings, testing mode or the team itself."
      />

      <CreateSubAdminForm />

      <h2>People with access</h2>
      <ul className="admin-people">
        {admins.map((a) => {
          const isOwner = a.role === "OWNER";
          const name = a.name || a.email;
          return (
            <li className="admin-person" key={a.id}>
              <div className="admin-person-id">
                <span className="admin-person-name">{name}</span>
                {a.name && (
                  <span className="admin-person-email">{a.email}</span>
                )}
                <span className="admin-person-meta">
                  Added {when(a.createdAt)}
                </span>
              </div>
              <div className="admin-person-side">
                <span className="admin-pill" data-role={roleLabel(a.role)}>
                  {roleLabel(a.role)}
                </span>
                {!isOwner && (
                  <div className="admin-person-ops">
                    <ResetPasswordForm id={a.id} label={name} />
                    <form action={deleteSubAdmin.bind(null, a.id)}>
                      <button className="btn ghost" type="submit">
                        Remove
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {subAdmins.length === 0 && (
        <p className="hint" style={{ marginTop: "0.75rem" }}>
          No sub-admins yet. Add one above to share day-to-day booking
          management.
        </p>
      )}
    </>
  );
}
