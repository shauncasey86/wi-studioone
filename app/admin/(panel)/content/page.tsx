import { getSiteData } from "@/lib/site-data";
import { saveContent } from "@/lib/admin/actions";
import { resetContentSection } from "@/lib/admin/reset";
import { requireCapability } from "@/lib/session";
import { CONTENT_GROUPS, getPath } from "@/lib/admin/content-fields";
import RichField from "@/components/admin/RichField";
import ImageField from "@/components/admin/ImageField";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await requireCapability("content");
  const { content } = await getSiteData();

  const valueOf = (path: string, kind: string): string => {
    const v = getPath(content, path);
    if (kind === "lines") return Array.isArray(v) ? v.join("\n") : "";
    return v == null ? "" : String(v);
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title={
          <>
            The <em>copy.</em>
          </>
        }
        lede="Every word the public site renders, by section. Saving updates the live site immediately."
      />

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
            <div className="ops">
              <button
                className="ghost"
                type="submit"
                formAction={resetContentSection.bind(null, group.key)}
              >
                Reset this section to defaults
              </button>
            </div>
          </fieldset>
        ))}
        <button className="btn" type="submit">
          Save content
        </button>
      </form>
    </>
  );
}
