import Topbar from "@/components/sections/Topbar";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import Days from "@/components/sections/Days";
import RoomStatement from "@/components/sections/RoomStatement";
import How from "@/components/sections/How";
import DiarySection from "@/components/sections/DiarySection";
import Practical from "@/components/sections/Practical";
import CtaStrip from "@/components/sections/CtaStrip";
import Footer from "@/components/sections/Footer";
import SiteEffects from "@/components/SiteEffects";

// Rendered from the database at request time (content lives in Postgres now).
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      {/* custom cursor — enhanced by SiteEffects on fine pointers */}
      <div className="cur" id="cur"></div>
      <div className="cur-ring" id="cur-ring"></div>

      <Topbar />

      <main id="top">
        <Hero />
        <Manifesto />
        <Days />
        <RoomStatement />
        <How />
        <DiarySection />
        <Practical />
        <CtaStrip />
      </main>

      <Footer />

      <SiteEffects />
    </>
  );
}
