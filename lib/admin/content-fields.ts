// Drives the scalar-content editor (/admin/content) and the saveContent action.
// Each field maps a dot-path in SiteSettings.content to an input. Kinds:
//   text     single-line
//   textarea multi-line plain
//   rich     multi-line with *italic*/**bold**/[label](href) + live preview
//   lines    one array item per line (e.g. hero title lines, manifesto words)
//   image    an image URL with upload

export type FieldKind = "text" | "textarea" | "rich" | "lines" | "image";
export type Field = { path: string; label: string; kind: FieldKind };
export type Group = { key: string; title: string; fields: Field[] };

export const CONTENT_GROUPS: Group[] = [
  {
    key: "brand",
    title: "Brand mark",
    fields: [
      { path: "brand.lead", label: "Lead (e.g. Studio)", kind: "text" },
      { path: "brand.mark", label: "Mark (e.g. ONE)", kind: "text" },
    ],
  },
  {
    key: "hero",
    title: "Hero",
    fields: [
      {
        path: "hero.titleLines",
        label: "Title lines (one per line, rich)",
        kind: "lines",
      },
      { path: "hero.sub", label: "Sub paragraph", kind: "textarea" },
      { path: "hero.price.amount", label: "Price amount", kind: "text" },
      { path: "hero.price.unit", label: "Price unit", kind: "text" },
      { path: "hero.price.fine", label: "Price fine line", kind: "text" },
      { path: "hero.cta.label", label: "CTA label", kind: "text" },
      { path: "hero.cta.target", label: "CTA target", kind: "text" },
      { path: "hero.cta.cur", label: "CTA cursor label", kind: "text" },
    ],
  },
  {
    key: "manifesto",
    title: "§01 Manifesto",
    fields: [
      { path: "manifesto.cnum", label: "Chapter label", kind: "text" },
      { path: "manifesto.clede", label: "Lede", kind: "textarea" },
      {
        path: "manifesto.pullWords",
        label: "Pull headline words (one token per line, rich)",
        kind: "lines",
      },
    ],
  },
  {
    key: "days",
    title: "§02 Days",
    fields: [
      { path: "days.cnum", label: "Chapter label", kind: "text" },
      { path: "days.title", label: "Title (rich)", kind: "rich" },
      { path: "days.lede", label: "Lede", kind: "textarea" },
    ],
  },
  {
    key: "roomStatement",
    title: "§03 Room statement",
    fields: [
      { path: "roomStatement.line", label: "Statement (rich)", kind: "rich" },
    ],
  },
  {
    key: "how",
    title: "§04 How it works",
    fields: [
      { path: "how.cnum", label: "Chapter label", kind: "text" },
      { path: "how.title", label: "Title (rich)", kind: "rich" },
      { path: "how.lede", label: "Lede", kind: "textarea" },
    ],
  },
  {
    key: "diary",
    title: "§05 Diary header",
    fields: [
      { path: "diary.cnum", label: "Chapter label", kind: "text" },
      { path: "diary.title", label: "Title (rich)", kind: "rich" },
      { path: "diary.lede", label: "Lede", kind: "textarea" },
    ],
  },
  {
    key: "practical",
    title: "§06 Before you book",
    fields: [
      { path: "practical.cnum", label: "Chapter label", kind: "text" },
      { path: "practical.title", label: "Title (rich)", kind: "rich" },
      { path: "practical.lede", label: "Lede", kind: "textarea" },
      {
        path: "practical.roomFactsLabel",
        label: "Room facts aria-label",
        kind: "text",
      },
      {
        path: "practical.docket.header",
        label: "Changeover header",
        kind: "text",
      },
      {
        path: "practical.docket.status",
        label: "Changeover status",
        kind: "text",
      },
      {
        path: "practical.docket.sign",
        label: "Changeover sign-off",
        kind: "text",
      },
      { path: "practical.rates.header", label: "Rates header", kind: "text" },
      {
        path: "practical.rates.note",
        label: "Rates note (rich)",
        kind: "rich",
      },
    ],
  },
  {
    key: "cta",
    title: "CTA strip",
    fields: [
      { path: "cta.headline", label: "Headline (rich)", kind: "rich" },
      { path: "cta.button.label", label: "Button label", kind: "text" },
      { path: "cta.button.target", label: "Button target", kind: "text" },
      { path: "cta.button.cur", label: "Button cursor label", kind: "text" },
    ],
  },
  {
    key: "footer",
    title: "Footer",
    fields: [
      { path: "footer.lede", label: "Lede", kind: "textarea" },
      {
        path: "footer.bottom",
        label: "Bottom lines (one per line)",
        kind: "lines",
      },
    ],
  },
  {
    key: "meta",
    title: "Meta / <head>",
    fields: [
      { path: "meta.title", label: "Title", kind: "text" },
      { path: "meta.description", label: "Description", kind: "textarea" },
      { path: "meta.canonical", label: "Canonical URL", kind: "text" },
      { path: "meta.ogTitle", label: "OG title", kind: "text" },
      { path: "meta.ogDescription", label: "OG description", kind: "textarea" },
      { path: "meta.ogImage", label: "OG image", kind: "image" },
      { path: "meta.ogImageAlt", label: "OG image alt", kind: "text" },
      { path: "meta.twitterTitle", label: "Twitter title", kind: "text" },
      {
        path: "meta.twitterDescription",
        label: "Twitter description",
        kind: "textarea",
      },
      { path: "meta.themeColor", label: "Theme colour", kind: "text" },
    ],
  },
];

export const ALL_FIELDS: Field[] = CONTENT_GROUPS.flatMap((g) => g.fields);

// ── dot-path helpers ──
export function getPath(obj: unknown, dot: string): unknown {
  return dot.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object")
      return (acc as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export function setPath(
  obj: Record<string, unknown>,
  dot: string,
  value: unknown,
) {
  const keys = dot.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}
