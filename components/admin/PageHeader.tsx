// The consistent opening of every admin page: a mono eyebrow, a Fraunces
// title, and an optional lede. Optional `actions` sit to the right on wide
// screens (e.g. filters, a primary button).

export default function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="admin-head">
      <div className="admin-head-text">
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lede && <p className="admin-lede">{lede}</p>}
      </div>
      {actions && <div className="admin-head-actions">{actions}</div>}
    </header>
  );
}
