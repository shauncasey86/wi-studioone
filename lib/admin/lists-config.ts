// Config for the reorderable list editors (/admin/lists). Each list maps to a
// Prisma model and a set of fields. `links` is a special kind (FooterColumn):
// edited as one "label | href" per line.

export type ListFieldKind = "text" | "textarea" | "rich" | "links";
export type ListField = { key: string; label: string; kind: ListFieldKind };
export type ListConfig = { model: string; label: string; fields: ListField[] };

export const LISTS: Record<string, ListConfig> = {
  navItems: {
    model: "navItem",
    label: "Nav links (topbar)",
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "anchor", label: "Anchor (e.g. #book)", kind: "text" },
      { key: "cur", label: "Cursor label", kind: "text" },
    ],
  },
  heroEyebrows: {
    model: "heroEyebrow",
    label: "Hero eyebrow items",
    fields: [{ key: "text", label: "Text", kind: "text" }],
  },
  manifestoFoots: {
    model: "manifestoFoot",
    label: "§01 Manifesto footer (term / def)",
    fields: [
      { key: "term", label: "Term", kind: "text" },
      { key: "def", label: "Definition", kind: "textarea" },
    ],
  },
  kinds: {
    model: "kind",
    label: "§02 Kinds of day",
    fields: [
      { key: "kicker", label: "Kicker", kind: "text" },
      { key: "line", label: "Line (rich)", kind: "rich" },
      { key: "timeTag", label: "Time tag", kind: "text" },
    ],
  },
  howSteps: {
    model: "howStep",
    label: "§04 How-it-works steps",
    fields: [
      { key: "label", label: "Label (e.g. Step 01)", kind: "text" },
      { key: "heading", label: "Heading (rich)", kind: "rich" },
      { key: "body", label: "Body", kind: "textarea" },
    ],
  },
  roomFacts: {
    model: "roomFact",
    label: "§06 Room facts (strong / text)",
    fields: [
      { key: "strong", label: "Strong", kind: "text" },
      {
        key: "text",
        label: "Text (lead with a space unless it starts with punctuation)",
        kind: "text",
      },
    ],
  },
  changeoverItems: {
    model: "changeoverItem",
    label: "§06 Changeover items",
    fields: [{ key: "text", label: "Text", kind: "text" }],
  },
  policies: {
    model: "policy",
    label: "§06 Policies (kicker / body)",
    fields: [
      { key: "kicker", label: "Kicker", kind: "text" },
      { key: "body", label: "Body (rich)", kind: "rich" },
    ],
  },
  footerColumns: {
    model: "footerColumn",
    label: "Footer columns",
    fields: [
      { key: "title", label: "Title", kind: "text" },
      {
        key: "links",
        label: "Links — one per line as: label | href (href optional)",
        kind: "links",
      },
    ],
  },
};

export type ListKey = keyof typeof LISTS;
