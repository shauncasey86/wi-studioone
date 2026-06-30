import BookingDiary from "@/components/BookingDiary";
import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function DiarySection() {
  const { content, settings, bacs, rateTiers } = await getSiteData();
  const { diary } = content;

  const config = {
    openHour: settings.openHour,
    closeHour: settings.closeHour,
    minHours: settings.minHours,
    maxHours: settings.maxHours,
    resetHours: settings.resetHours,
    daysAhead: settings.daysAhead,
    prices: Object.fromEntries(rateTiers.map((t) => [t.hours, t.price])),
    bacs,
  };

  return (
    <section className="book chapter" id="book" aria-labelledby="book-title">
      <div className="frame">
        <div className="chead">
          <span className="cnum">{diary.cnum}</span>
          <div>
            <h2 className="ctitle" id="book-title">
              {rich(diary.title)}
            </h2>
            <p className="clede">{diary.lede}</p>
          </div>
        </div>

        <BookingDiary config={config} />
      </div>
    </section>
  );
}
