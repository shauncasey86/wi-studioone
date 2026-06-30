import { Fragment } from "react";
import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function Manifesto() {
  const { content, manifestoFoots } = await getSiteData();
  const { manifesto } = content;

  return (
    <section className="manifesto" aria-labelledby="m-title">
      <div className="frame man-frame">
        <div className="chead">
          <span className="cnum">{manifesto.cnum}</span>
          <p className="clede">{manifesto.clede}</p>
        </div>

        <h2 className="pull" id="m-title">
          {manifesto.pullWords.map((w, i) => (
            <Fragment key={i}>
              <span className="w">{rich(w)}</span>
              {i < manifesto.pullWords.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </h2>

        <dl className="man-foot">
          {manifestoFoots.map((f) => (
            <div key={f.id}>
              <dt>{f.term}</dt>
              <dd>{f.def}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
