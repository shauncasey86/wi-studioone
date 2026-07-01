import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function RoomStatement() {
  const { content, roomPhotos } = await getSiteData();

  return (
    <section className="roomhero" id="room" aria-labelledby="room-title">
      <div className="frame">
        <h2 className="roomhero-title" id="room-title">
          {rich(content.roomStatement.line)}
        </h2>

        {roomPhotos.length > 0 && (
          <div className="room-gallery" aria-label="Photos of the room">
            {roomPhotos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                className="room-shot"
                src={p.url}
                alt={p.alt || ""}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
