import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function How() {
  const { content, howSteps } = await getSiteData();
  const { how } = content;

  return (
    <section className="how chapter" aria-labelledby="how-title">
      <div className="frame">
        <div className="chead">
          <span className="cnum">{how.cnum}</span>
          <div>
            <h2 className="ctitle" id="how-title">
              {rich(how.title)}
            </h2>
            <p className="clede">{how.lede}</p>
          </div>
        </div>

        <div className="steps">
          {howSteps.map((s) => (
            <article className="step r-up" key={s.id}>
              <span className="num">{s.label}</span>
              <h3>{rich(s.heading)}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
