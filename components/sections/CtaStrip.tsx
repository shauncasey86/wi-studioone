import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function CtaStrip() {
  const { content } = await getSiteData();
  const { cta } = content;

  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="frame">
        <h2 id="cta-title">{rich(cta.headline)}</h2>
        <a
          href={cta.button.target}
          className="big"
          data-cur={cta.button.cur ?? undefined}
        >
          {cta.button.label} <span className="ar">→</span>
        </a>
      </div>
    </section>
  );
}
