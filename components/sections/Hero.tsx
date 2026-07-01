import { Fragment } from "react";
import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function Hero() {
  const { content, heroEyebrows } = await getSiteData();
  const { hero } = content;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="frame">
          <div className="hero-grid">
            <div>
              <div className="hero-eyebrow eyebrow r-fade">
                {heroEyebrows.map((e, i) => (
                  <Fragment key={e.id}>
                    {i > 0 && <span className="ln"></span>}
                    <span>{e.text}</span>
                  </Fragment>
                ))}
              </div>
              <h1 className="hero-title" id="hero-title">
                {hero.titleLines.map((line, i) => (
                  <span className="row" key={i}>
                    <span>{rich(line)}</span>
                  </span>
                ))}
              </h1>
              <p className="hero-sub r-fade">{hero.sub}</p>
              <div className="hero-foot r-fade">
                <div className="price">
                  <div className="n">
                    {hero.price.amount}
                    <span className="u">{hero.price.unit}</span>
                  </div>
                  <div className="fine">{hero.price.fine}</div>
                </div>
                <a
                  href={hero.cta.target}
                  className="hero-cta"
                  data-cur={hero.cta.cur ?? undefined}
                >
                  {hero.cta.label} <span className="ar">→</span>
                </a>
              </div>
            </div>

            {/* the day-arc — skeleton; SiteEffects draws it */}
            <div className="arc-wrap r-fade">
              <svg
                id="arc"
                viewBox="0 0 880 510"
                role="img"
                aria-labelledby="arc-title"
              >
                <title id="arc-title">
                  Today&apos;s open hours, 07:00 to 22:00, with the current time
                  marked
                </title>
                <line
                  className="arc-base"
                  x1="60"
                  y1="470"
                  x2="820"
                  y2="470"
                ></line>
                <path id="arc-daylight" className="arc-daylight"></path>
                <g id="arc-ticks"></g>
                <g id="arc-suntimes"></g>
                <path id="arc-track" className="arc-track"></path>
                <g id="arc-booked-g"></g>
                <path id="arc-elapsed" className="arc-elapsed"></path>
                <g id="arc-sun"></g>
                <text className="arc-lab" x="60" y="494" textAnchor="start">
                  07:00
                </text>
                <text className="arc-lab" x="820" y="494" textAnchor="end">
                  22:00
                </text>
              </svg>
              <span className="arc-cap" id="arc-cap">
                the day, open to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
