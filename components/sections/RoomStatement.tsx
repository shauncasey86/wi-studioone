import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function RoomStatement() {
  const { content } = await getSiteData();

  return (
    <section className="roomhero" id="room" aria-labelledby="room-title">
      <div className="frame">
        <h2 className="roomhero-title" id="room-title">
          {rich(content.roomStatement.line)}
        </h2>
      </div>
    </section>
  );
}
