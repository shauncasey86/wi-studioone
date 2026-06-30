import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function Practical() {
  const { content, roomFacts, changeoverItems, rateTiers, policies, map } =
    await getSiteData();
  const { practical } = content;

  return (
    <section
      className="practical chapter"
      id="terms"
      aria-labelledby="prac-title"
    >
      <div className="frame">
        <div className="chead">
          <span className="cnum">{practical.cnum}</span>
          <div>
            <h2 className="ctitle" id="prac-title">
              {rich(practical.title)}
            </h2>
            <p className="clede">{practical.lede}</p>
          </div>
        </div>

        <div className="prac">
          <ul className="room-facts" aria-label={practical.roomFactsLabel}>
            {roomFacts.map((f) => (
              <li key={f.id}>
                <b>{f.strong}</b>
                {f.text}
              </li>
            ))}
          </ul>

          <aside
            className="docket"
            id="care"
            aria-label="What's done between every booking"
          >
            <div className="docket-h">
              <span className="t">{practical.docket.header}</span>
              <span className="st">{practical.docket.status}</span>
            </div>
            <ul className="docket-list">
              {changeoverItems.map((c) => (
                <li key={c.id}>
                  <span className="tick" aria-hidden="true">
                    ✓
                  </span>{" "}
                  {c.text}
                </li>
              ))}
            </ul>
            <div className="docket-foot">
              <span id="reset-stamp">Last reset 09:18 · Hull</span>
              <span className="sign">{practical.docket.sign}</span>
            </div>
          </aside>

          <div className="rates-strip">
            <span className="rates-h">{practical.rates.header}</span>
            <ul className="rates">
              {rateTiers.map((t) => (
                <li key={t.hours}>
                  {`${t.hours}h `}
                  <b>{`£${t.price}`}</b>
                </li>
              ))}
            </ul>
            <p className="rates-note">{rich(practical.rates.note)}</p>
          </div>

          <div className="policy-grid">
            {policies.map((p) => (
              <div className="pol" key={p.id}>
                <span className="k">{p.kicker}</span>
                <p>{rich(p.body)}</p>
              </div>
            ))}
          </div>

          <div className="mapband">
            <div className="map-frame">
              <span className="map-tag">{map.tagLabel}</span>
              <iframe
                title="Map showing StudioONE in Sutton Village, Hull"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={map.embedSrc}
              ></iframe>
            </div>
            <div className="map-foot">
              <span>{map.coordsText}</span>
              <a
                href={map.openMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in maps →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
