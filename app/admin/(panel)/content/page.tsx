import { getSiteData } from "@/lib/site-data";
import { saveContent } from "@/lib/admin/actions";
import { CONTENT_GROUPS, getPath } from "@/lib/admin/content-fields";
import RichField from "@/components/admin/RichField";
import ImageField from "@/components/admin/ImageField";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const { content } = await getSiteData();

  const valueOf = (path: string, kind: string): string => {
    const v = getPath(content, path);
    if (kind === "lines") return Array.isArray(v) ? v.join("\n") : "";
    return v == null ? "" : String(v);
  };

  return (
    <>
      <h1>Content</h1>
      <p className="muted">
        All site copy, by section. Saving updates the live site immediately.
      </p>

      <form action={saveContent}>
        {CONTENT_GROUPS.map((group) => (
          <fieldset key={group.key}>
            <legend>{group.title}</legend>
            {group.fields.map((f) => {
              const val = valueOf(f.path, f.kind);
              return (
                <div key={f.path}>
                  <label htmlFor={f.path}>{f.label}</label>
                  {f.kind === "rich" ? (
                    <RichField name={f.path} defaultValue={val} />
                  ) : f.kind === "image" ? (
                    <ImageField name={f.path} defaultValue={val} />
                  ) : f.kind === "textarea" || f.kind === "lines" ? (
                    <textarea
                      id={f.path}
                      name={f.path}
                      defaultValue={val}
                      rows={f.kind === "lines" ? 4 : 2}
                    />
                  ) : (
                    <input
                      id={f.path}
                      name={f.path}
                      type="text"
                      defaultValue={val}
                    />
                  )}
                </div>
              );
            })}
          </fieldset>
        ))}
        <button className="btn" type="submit">
          Save content
        </button>
      </form>
    </>
  );
}
