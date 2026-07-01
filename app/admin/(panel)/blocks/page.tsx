import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/session";
import { createBlock, deleteBlock } from "@/lib/admin/booking-actions";
import { isoOf } from "@/lib/booking/time";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

function hh(h: number) {
  return String(h).padStart(2, "0") + ":00";
}

export default async function BlocksPage() {
  await requireCapability("bookings");
  const blocks = await prisma.block.findMany({
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={
          <>
            One-off <em>blocks.</em>
          </>
        }
        lede="Block a specific date and time — maintenance, or the owner's own use. Blocks subtract from availability just like bookings."
      />

      <h2>Add a block</h2>
      <form action={createBlock}>
        <fieldset>
          <div className="row">
            <div style={{ flex: 2 }}>
              <label htmlFor="b-date">Date</label>
              <input id="b-date" name="date" type="date" required />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="b-start">Start hour (0–23)</label>
              <input
                id="b-start"
                name="startHour"
                type="number"
                min={0}
                max={23}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="b-end">End hour (exclusive)</label>
              <input
                id="b-end"
                name="endHour"
                type="number"
                min={1}
                max={24}
                required
              />
            </div>
          </div>
          <label htmlFor="b-label">Label (optional)</label>
          <input
            id="b-label"
            name="label"
            type="text"
            placeholder="e.g. Maintenance"
          />
          <div style={{ marginTop: "0.9rem" }}>
            <button className="btn" type="submit">
              Add block
            </button>
          </div>
        </fieldset>
      </form>

      <h2>Current blocks</h2>
      {blocks.length === 0 ? (
        <p className="muted">No blocks.</p>
      ) : (
        blocks.map((b) => (
          <div className="list-item" key={b.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{isoOf(b.date)}</strong> · {hh(b.startHour)}–
                {hh(b.endHour)}
                {b.label ? ` · ${b.label}` : ""}
              </div>
              <form action={deleteBlock.bind(null, b.id)}>
                <button className="ghost btn" type="submit">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </>
  );
}
