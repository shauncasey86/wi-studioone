import { getSiteData } from "@/lib/site-data";
import { saveSettings } from "@/lib/admin/actions";
import { requireCapability } from "@/lib/session";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireCapability("settings");
  const { settings, bacs, contact, map } = await getSiteData();

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title={
          <>
            The <em>details.</em>
          </>
        }
        lede="Payment details, door code, map pin, contact and alert recipients."
      />

      <form action={saveSettings}>
        <fieldset>
          <legend>BACS (bank transfer)</legend>
          <label htmlFor="bacs.accountName">Account name</label>
          <input
            id="bacs.accountName"
            name="bacs.accountName"
            type="text"
            defaultValue={bacs.accountName}
          />
          <label htmlFor="bacs.sortCode">Sort code</label>
          <input
            id="bacs.sortCode"
            name="bacs.sortCode"
            type="text"
            defaultValue={bacs.sortCode}
          />
          <label htmlFor="bacs.accountNo">Account no.</label>
          <input
            id="bacs.accountNo"
            name="bacs.accountNo"
            type="text"
            defaultValue={bacs.accountNo}
          />
          <label htmlFor="bacs.referencePrefix">Reference prefix</label>
          <input
            id="bacs.referencePrefix"
            name="bacs.referencePrefix"
            type="text"
            defaultValue={bacs.referencePrefix}
          />
          <label className="row" style={{ marginTop: "0.9rem" }}>
            <input
              name="bacs.demo"
              type="checkbox"
              defaultChecked={bacs.demo}
            />
            <span>
              Show “Demo details” flag (clear once real details are entered)
            </span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Door code &amp; alerts</legend>
          <label htmlFor="doorCode">Current door code</label>
          <input
            id="doorCode"
            name="doorCode"
            type="text"
            defaultValue={settings.doorCode}
          />
          <label htmlFor="doorCodeNote">Door code note</label>
          <input
            id="doorCodeNote"
            name="doorCodeNote"
            type="text"
            defaultValue={settings.doorCodeNote ?? ""}
          />
          <label htmlFor="fromEmail">From email</label>
          <input
            id="fromEmail"
            name="fromEmail"
            type="email"
            defaultValue={settings.fromEmail}
          />
          <label htmlFor="studioEmails">
            Studio alert recipients (comma or newline separated)
          </label>
          <textarea
            id="studioEmails"
            name="studioEmails"
            rows={2}
            defaultValue={settings.studioEmails.join("\n")}
          />
          <p className="hint">
            The door code is never shown publicly or in the studio alert.
          </p>
        </fieldset>

        <fieldset>
          <legend>Contact</legend>
          <label htmlFor="contact.email">Email</label>
          <input
            id="contact.email"
            name="contact.email"
            type="text"
            defaultValue={contact.email}
          />
          <label htmlFor="contact.phone">Phone</label>
          <input
            id="contact.phone"
            name="contact.phone"
            type="text"
            defaultValue={contact.phone}
          />
          <label htmlFor="contact.replies">Replies line</label>
          <input
            id="contact.replies"
            name="contact.replies"
            type="text"
            defaultValue={contact.replies}
          />
        </fieldset>

        <fieldset>
          <legend>Map pin</legend>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label htmlFor="map.lat">Latitude</label>
              <input
                id="map.lat"
                name="map.lat"
                type="text"
                defaultValue={String(map.lat)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="map.lng">Longitude</label>
              <input
                id="map.lng"
                name="map.lng"
                type="text"
                defaultValue={String(map.lng)}
              />
            </div>
            <div style={{ width: 90 }}>
              <label htmlFor="map.zoom">Zoom</label>
              <input
                id="map.zoom"
                name="map.zoom"
                type="text"
                defaultValue={String(map.zoom)}
              />
            </div>
          </div>
          <label htmlFor="map.tagLabel">Tag label</label>
          <input
            id="map.tagLabel"
            name="map.tagLabel"
            type="text"
            defaultValue={map.tagLabel}
          />
          <label htmlFor="map.coordsText">Coords text</label>
          <input
            id="map.coordsText"
            name="map.coordsText"
            type="text"
            defaultValue={map.coordsText}
          />
          <label htmlFor="map.openMapsUrl">Open-in-maps URL</label>
          <input
            id="map.openMapsUrl"
            name="map.openMapsUrl"
            type="text"
            defaultValue={map.openMapsUrl}
          />
          <label htmlFor="map.embedSrc">OSM embed src</label>
          <textarea
            id="map.embedSrc"
            name="map.embedSrc"
            rows={2}
            defaultValue={map.embedSrc}
          />
        </fieldset>

        <button className="btn" type="submit">
          Save settings
        </button>
      </form>
    </>
  );
}
