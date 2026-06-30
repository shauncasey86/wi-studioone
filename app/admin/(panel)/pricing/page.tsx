import { getSiteData } from "@/lib/site-data";
import { savePricing } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

const OPS: { key: string; label: string }[] = [
  { key: "openHour", label: "Open hour (0–23)" },
  { key: "closeHour", label: "Close hour (0–23)" },
  { key: "minHours", label: "Min hours" },
  { key: "maxHours", label: "Max hours" },
  { key: "resetHours", label: "Reset hours (buffer each side)" },
  { key: "daysAhead", label: "Days ahead (diary window)" },
  { key: "pendingTtlHrs", label: "Pending hold TTL (hours)" },
];

export default async function PricingPage() {
  const { settings, rateTiers } = await getSiteData();
  const priceByHour = new Map(rateTiers.map((t) => [t.hours, t.price]));
  const ops = settings as unknown as Record<string, number>;

  return (
    <>
      <h1>Pricing &amp; rules</h1>
      <p className="muted">
        Rate tiers drive the diary and the rates strip; the rules drive
        availability. Saving updates the live site immediately.
      </p>

      <form action={savePricing}>
        <fieldset>
          <legend>Rate tiers (£ per booking length)</legend>
          {Array.from({ length: 8 }, (_, i) => i + 1).map((h) => (
            <div key={h}>
              <label htmlFor={`price.${h}`}>{h} hour(s) — £</label>
              <input
                id={`price.${h}`}
                name={`price.${h}`}
                type="number"
                min={0}
                defaultValue={priceByHour.get(h) ?? 0}
              />
            </div>
          ))}
        </fieldset>

        <fieldset>
          <legend>Operational rules</legend>
          {OPS.map((o) => (
            <div key={o.key}>
              <label htmlFor={o.key}>{o.label}</label>
              <input
                id={o.key}
                name={o.key}
                type="number"
                defaultValue={ops[o.key]}
              />
            </div>
          ))}
        </fieldset>

        <button className="btn" type="submit">
          Save pricing &amp; rules
        </button>
      </form>
    </>
  );
}
