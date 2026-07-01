import { getSiteData } from "@/lib/site-data";
import { LISTS, type ListField } from "@/lib/admin/lists-config";
import {
  addListItem,
  updateListItem,
  deleteListItem,
  moveListItem,
} from "@/lib/admin/actions";
import { resetList } from "@/lib/admin/reset";
import { requireCapability } from "@/lib/session";
import RichField from "@/components/admin/RichField";
import ImageField from "@/components/admin/ImageField";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

type Item = Record<string, unknown> & { id: string };

function fieldValue(item: Item, field: ListField): string {
  const v = item[field.key];
  if (field.kind === "links" && Array.isArray(v)) {
    return (v as { label: string; href: string }[])
      .map((l) => (l.href ? `${l.label} | ${l.href}` : l.label))
      .join("\n");
  }
  return v == null ? "" : String(v);
}

export default async function ListsPage() {
  await requireCapability("lists");
  const data = await getSiteData();
  const itemsByKey: Record<string, Item[]> = {
    navItems: data.navItems,
    heroEyebrows: data.heroEyebrows,
    manifestoFoots: data.manifestoFoots,
    kinds: data.kinds,
    howSteps: data.howSteps,
    roomPhotos: data.roomPhotos,
    roomFacts: data.roomFacts,
    changeoverItems: data.changeoverItems,
    policies: data.policies,
    footerColumns: data.footerColumns as unknown as Item[],
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title={
          <>
            The <em>lists.</em>
          </>
        }
        lede="Add, edit, remove and reorder every repeatable list. Saving updates the live site immediately."
      />

      {Object.entries(LISTS).map(([key, cfg]) => {
        const items = itemsByKey[key] ?? [];
        return (
          <section key={key}>
            <h2>{cfg.label}</h2>
            {items.map((item, i) => (
              <div className="list-item" key={item.id}>
                <form action={updateListItem.bind(null, key, item.id)}>
                  {cfg.fields.map((field) => {
                    const val = fieldValue(item, field);
                    const id = `${key}-${item.id}-${field.key}`;
                    return (
                      <div key={field.key}>
                        <label htmlFor={id}>{field.label}</label>
                        {field.kind === "rich" ? (
                          <RichField name={field.key} defaultValue={val} />
                        ) : field.kind === "image" ? (
                          <ImageField name={field.key} defaultValue={val} />
                        ) : field.kind === "textarea" ||
                          field.kind === "links" ? (
                          <textarea
                            id={id}
                            name={field.key}
                            defaultValue={val}
                            rows={field.kind === "links" ? 4 : 2}
                          />
                        ) : (
                          <input
                            id={id}
                            name={field.key}
                            type="text"
                            defaultValue={val}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div className="ops">
                    <button className="btn" type="submit">
                      Save
                    </button>
                  </div>
                </form>
                <div className="ops">
                  <form action={moveListItem.bind(null, key, item.id, "up")}>
                    <button
                      className="btn ghost"
                      type="submit"
                      disabled={i === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveListItem.bind(null, key, item.id, "down")}>
                    <button
                      className="btn ghost"
                      type="submit"
                      disabled={i === items.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteListItem.bind(null, key, item.id)}>
                    <button className="btn ghost" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
            <div className="ops">
              <form action={addListItem.bind(null, key)}>
                <button className="btn ghost" type="submit">
                  + Add item
                </button>
              </form>
              <form action={resetList.bind(null, key)}>
                <button className="btn ghost" type="submit">
                  Reset list to defaults
                </button>
              </form>
            </div>
          </section>
        );
      })}
    </>
  );
}
