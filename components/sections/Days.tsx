import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function Days() {
  const { content, kinds } = await getSiteData();
  const { days } = content;

  return (
    <section className="days chapter" id="days" aria-labelledby="days-title">
      <div className="frame">
        <div className="chead">
          <span className="cnum">{days.cnum}</span>
          <div>
            <h2 className="ctitle" id="days-title">
              {rich(days.title)}
            </h2>
            <p className="clede">{days.lede}</p>
          </div>
        </div>

        <ul className="kinds">
          {kinds.map((k) => (
            <li className="kind" key={k.id}>
              <span className="kind-k">{k.kicker}</span>
              <p className="kind-l">{rich(k.line)}</p>
              <span className="kind-t">{k.timeTag}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
