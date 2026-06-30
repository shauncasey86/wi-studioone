import { Fragment } from "react";
import { getSiteData } from "@/lib/site-data";

export default async function Footer() {
  const { content, footerColumns } = await getSiteData();
  const { brand, footer } = content;

  return (
    <footer className="foot">
      <div className="frame">
        <div className="foot-grid">
          <div>
            <a className="mark" href="#top">
              {brand.lead}
              <span className="hr">{brand.mark}</span>
            </a>
            <p className="lede">{footer.lede}</p>
          </div>
          {footerColumns.map((col) => (
            <dl className="fcol" key={col.id}>
              <dt>{col.title}</dt>
              {col.links.map((l, i) => (
                <dd key={i}>
                  {l.href ? <a href={l.href}>{l.label}</a> : l.label}
                </dd>
              ))}
            </dl>
          ))}
        </div>
        <div className="foot-mark" aria-hidden="true">
          {brand.lead}
          <em>{brand.mark}</em>
        </div>
        <div className="foot-bottom">
          {footer.bottom.map((line, i) => (
            <Fragment key={i}>
              <span>{line}</span>
            </Fragment>
          ))}
        </div>
      </div>
    </footer>
  );
}
