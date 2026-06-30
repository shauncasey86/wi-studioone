import { prisma } from "@/lib/prisma";
import { createHold, deleteHold } from "@/lib/admin/booking-actions";

export const dynamic = "force-dynamic";

const DOW = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function hh(h: number) {
  return String(h).padStart(2, "0") + ":00";
}

export default async function HoldsPage() {
  const holds = await prisma.recurringHold.findMany({
    orderBy: [{ weekday: "asc" }, { startHour: "asc" }],
  });

  return (
    <>
      <h1>Recurring holds</h1>
      <p className="muted">
        Weekly repeating reservations (e.g. a Tuesday class). Holds subtract
        from availability on every matching weekday.
      </p>

      <h2>Add a weekly hold</h2>
      <form action={createHold}>
        <fieldset>
          <div className="row">
            <div style={{ flex: 2 }}>
              <label htmlFor="h-weekday">Weekday</label>
              <select id="h-weekday" name="weekday" required>
                {DOW.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="h-start">Start hour (0–23)</label>
              <input
                id="h-start"
                name="startHour"
                type="number"
                min={0}
                max={23}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="h-end">End hour (exclusive)</label>
              <input
                id="h-end"
                name="endHour"
                type="number"
                min={1}
                max={24}
                required
              />
            </div>
          </div>
          <label htmlFor="h-label">Label (optional)</label>
          <input
            id="h-label"
            name="label"
            type="text"
            placeholder="e.g. Yoga class"
          />
          <div style={{ marginTop: "0.9rem" }}>
            <button className="btn" type="submit">
              Add hold
            </button>
          </div>
        </fieldset>
      </form>

      <h2>Current holds</h2>
      {holds.length === 0 ? (
        <p className="muted">No recurring holds.</p>
      ) : (
        holds.map((h) => (
          <div className="list-item" key={h.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{DOW[h.weekday]}</strong> · {hh(h.startHour)}–
                {hh(h.endHour)}
                {h.label ? ` · ${h.label}` : ""}
              </div>
              <form action={deleteHold.bind(null, h.id)}>
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
