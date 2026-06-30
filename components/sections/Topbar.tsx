import { getSiteData } from "@/lib/site-data";

const pad = (n: number) => String(n).padStart(2, "0");

export default async function Topbar() {
  const { content, navItems, settings } = await getSiteData();
  const { brand } = content;
  const status = `Open · ${pad(settings.openHour)}:00–${pad(settings.closeHour)}:00`;

  return (
    <header className="bar" role="banner">
      <div className="frame">
        <a className="mark" href="#top" aria-label="StudioONE — home">
          {brand.lead}
          <span className="hr">{brand.mark}</span>
        </a>
        <nav aria-label="Primary">
          {navItems.map((n) => (
            <a key={n.id} href={n.anchor} data-cur={n.cur ?? undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <span className="status">
          <span id="status">{status}</span>
        </span>
      </div>
    </header>
  );
}
