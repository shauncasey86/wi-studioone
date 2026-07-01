import { getSiteData } from "@/lib/site-data";
import { saveHours } from "@/lib/admin/actions";
import { requireCapability } from "@/lib/session";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

const OPENING: { key: string; label: string; hint: string }[] = [
  { key: "openHour", label: "Opens at", hint: "Earliest bookable hour (0–23)" },
  {
    key: "closeHour",
    label: "Closes at",
    hint: "Latest bookable hour, exclusive (0–24)",
  },
];

const RULES: { key: string; label: string; hint: string }[] = [
  {
    key: "minHours",
    label: "Minimum length",
    hint: "Fewest hours per booking",
  },
  { key: "maxHours", label: "Maximum length", hint: "Most hours per booking" },
  {
    key: "resetHours",
    label: "Changeover buffer",
    hint: "Empty hours kept either side of a booking",
  },
  {
    key: "daysAhead",
    label: "Booking window",
    hint: "How many days ahead the diary opens",
  },
  {
    key: "pendingTtlHrs",
    label: "Hold expiry",
    hint: "Hours an unpaid reservation is held",
  },
];

export default async function HoursPage() {
  await requireCapability("hours");
  const { settings } = await getSiteData();
  const ops = settings as unknown as Record<string, number>;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title={
          <>
            Opening <em>hours.</em>
          </>
        }
        lede="When the studio can be booked, and the rules that shape the diary. Saving updates availability on the live site immediately."
      />

      <form action={saveHours}>
        <fieldset>
          <legend>Opening hours</legend>
          <div className="admin-grid">
            {OPENING.map((o) => (
              <div key={o.key}>
                <label htmlFor={o.key}>{o.label}</label>
                <input
                  id={o.key}
                  name={o.key}
                  type="number"
                  min={0}
                  max={24}
                  defaultValue={ops[o.key]}
                />
                <p className="hint">{o.hint}</p>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Booking rules</legend>
          <div className="admin-grid">
            {RULES.map((o) => (
              <div key={o.key}>
                <label htmlFor={o.key}>{o.label}</label>
                <input
                  id={o.key}
                  name={o.key}
                  type="number"
                  min={0}
                  defaultValue={ops[o.key]}
                />
                <p className="hint">{o.hint}</p>
              </div>
            ))}
          </div>
        </fieldset>

        <button className="btn" type="submit">
          Save opening hours
        </button>
      </form>
    </>
  );
}
