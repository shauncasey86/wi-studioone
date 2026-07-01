import { getSiteData } from "@/lib/site-data";
import { savePricing } from "@/lib/admin/actions";
import { requireCapability } from "@/lib/session";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  await requireCapability("pricing");
  const { rateTiers } = await getSiteData();
  const priceByHour = new Map(rateTiers.map((t) => [t.hours, t.price]));

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title={
          <>
            Rate <em>tiers.</em>
          </>
        }
        lede="The price for each booking length. These drive the diary and the rates strip. Opening hours and booking rules live under Opening hours."
      />

      <form action={savePricing}>
        <fieldset>
          <legend>£ per booking length</legend>
          <div className="admin-grid admin-grid--tiers">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((h) => (
              <div key={h}>
                <label htmlFor={`price.${h}`}>
                  {h} hour{h > 1 ? "s" : ""}
                </label>
                <div className="admin-money">
                  <span aria-hidden="true">£</span>
                  <input
                    id={`price.${h}`}
                    name={`price.${h}`}
                    type="number"
                    min={0}
                    defaultValue={priceByHour.get(h) ?? 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <button className="btn" type="submit">
          Save rate tiers
        </button>
      </form>
    </>
  );
}
