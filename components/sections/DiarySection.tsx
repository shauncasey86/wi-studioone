import BookingDiary from "@/components/BookingDiary";
import { getSiteData } from "@/lib/site-data";
import { rich } from "@/lib/richtext";

export default async function DiarySection() {
  const { content } = await getSiteData();
  const { diary } = content;

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

        <BookingDiary />
      </div>
    </section>
  );
}
