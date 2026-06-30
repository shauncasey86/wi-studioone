import BookingDiary from "@/components/BookingDiary";
import SiteEffects from "@/components/SiteEffects";

// Phase 1: the full site ported from legacy/studioone.html with hardcoded
// content. Sections are server-rendered; <SiteEffects/> and <BookingDiary/> are
// the only client components. Phase 2 makes every section DB-driven.
export default function Home() {
  return (
    <>
      {/* custom cursor — enhanced by SiteEffects on fine pointers */}
      <div className="cur" id="cur"></div>
      <div className="cur-ring" id="cur-ring"></div>

      {/* ───────── topbar ───────── */}
      <header className="bar" role="banner">
        <div className="frame">
          <a className="mark" href="#top" aria-label="StudioONE — home">
            Studio<span className="hr">ONE</span>
          </a>
          <nav aria-label="Primary">
            <a href="#days" data-cur="Read">
              The day
            </a>
            <a href="#room" data-cur="Look">
              The room
            </a>
            <a href="#care" data-cur="Upkeep">
              Upkeep
            </a>
            <a href="#book" data-cur="Book">
              Book
            </a>
          </nav>
          <span className="status">
            <span id="status">Open · 07:00–22:00</span>
          </span>
        </div>
      </header>

      <main id="top">
        {/* ───────── HERO ───────── */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-inner">
            <div className="frame">
              <div className="hero-grid">
                <div>
                  <div className="hero-eyebrow eyebrow r-fade">
                    <span>Sutton Village · Hull</span>
                    <span className="ln"></span>
                    <span>One room</span>
                    <span className="ln"></span>
                    <span>Est. 2026</span>
                  </div>
                  <h1 className="hero-title" id="hero-title">
                    <span className="row">
                      <span>A room</span>
                    </span>
                    <span className="row">
                      <span>kept by</span>
                    </span>
                    <span className="row">
                      <span>
                        the <em>hour.</em>
                      </span>
                    </span>
                  </h1>
                  <p className="hero-sub r-fade">
                    Forty square metres, bare and daylit. Booked by the hour, up
                    to eight at a time. Pay by transfer; the door code lands by
                    email once it clears.
                  </p>
                  <div className="hero-foot r-fade">
                    <div className="price">
                      <div className="n">
                        £45<span className="u">first hour</span>
                      </div>
                      <div className="fine">
                        Less for each after · no account
                      </div>
                    </div>
                    <a href="#book" className="hero-cta" data-cur="Book">
                      See the diary <span className="ar">→</span>
                    </a>
                  </div>
                </div>

                {/* the day-arc — skeleton; SiteEffects draws it */}
                <div className="arc-wrap r-fade">
                  <svg
                    id="arc"
                    viewBox="0 0 880 510"
                    role="img"
                    aria-labelledby="arc-title"
                  >
                    <title id="arc-title">
                      Today&apos;s open hours, 07:00 to 22:00, with the current
                      time marked
                    </title>
                    <line
                      className="arc-base"
                      x1="60"
                      y1="470"
                      x2="820"
                      y2="470"
                    ></line>
                    <g id="arc-ticks"></g>
                    <path id="arc-track" className="arc-track"></path>
                    <g id="arc-booked-g"></g>
                    <path id="arc-elapsed" className="arc-elapsed"></path>
                    <g id="arc-sun"></g>
                    <text className="arc-lab" x="60" y="494" textAnchor="start">
                      07:00
                    </text>
                    <text className="arc-lab" x="820" y="494" textAnchor="end">
                      22:00
                    </text>
                  </svg>
                  <span className="arc-cap" id="arc-cap">
                    the day, open to close
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── §01 manifesto ───────── */}
        <section className="manifesto" aria-labelledby="m-title">
          <div className="frame man-frame">
            <div className="chead">
              <span className="cnum">01 — One room, on purpose</span>
              <p className="clede">
                A class at seven in the morning. A birthday dinner that night.
                Same plaster, same floor, same room. Pay by transfer; the code
                arrives by email once it clears.
              </p>
            </div>

            <h2 className="pull" id="m-title">
              <span className="w">One</span> <span className="w">room.</span>{" "}
              <span className="w">Plain</span> <span className="w">enough</span>{" "}
              <span className="w">to</span> <span className="w">shoot</span>{" "}
              <span className="w">in.</span> <span className="w">Quiet</span>{" "}
              <span className="w">enough</span> <span className="w">to</span>{" "}
              <span className="w">teach</span> <span className="w">in.</span>{" "}
              <span className="w">Big</span> <span className="w">enough</span>{" "}
              <span className="w">to</span>{" "}
              <span className="w">
                <em>sit ten for dinner.</em>
              </span>
            </h2>

            <dl className="man-foot">
              <div>
                <dt>Where</dt>
                <dd>
                  Sutton Village, Hull. Ground floor, step-free. Free street
                  parking. Twelve minutes from the centre.
                </dd>
              </div>
              <div>
                <dt>When</dt>
                <dd>
                  Daily, 07:00–22:00. Whole hours, one-hour minimum. An
                  hour&apos;s reset between guests.
                </dd>
              </div>
              <div>
                <dt>How</dt>
                <dd>
                  Pick a day, a start and how long. Pay by transfer; the code
                  lands by email once it clears. Walk in. That&apos;s the whole
                  of it.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ───────── §02 one room, many days ───────── */}
        <section
          className="days chapter"
          id="days"
          aria-labelledby="days-title"
        >
          <div className="frame">
            <div className="chead">
              <span className="cnum">02 — One room, many days</span>
              <div>
                <h2 className="ctitle" id="days-title">
                  Five kinds <em>of day.</em>
                </h2>
                <p className="clede">
                  Some weeks all five. Some weeks the same one, every Tuesday.
                </p>
              </div>
            </div>

            <ul className="kinds">
              <li className="kind">
                <span className="kind-k">Dinners</span>
                <p className="kind-l">
                  A long table for ten — candles, takeaway from up the road, the
                  kettle on as you <em>arrive.</em>
                </p>
                <span className="kind-t">Fri · evening</span>
              </li>
              <li className="kind">
                <span className="kind-k">Classes</span>
                <p className="kind-l">
                  Twelve mats, two hours, morning light through the two tall{" "}
                  <em>sashes.</em>
                </p>
                <span className="kind-t">Tue · 07:00</span>
              </li>
              <li className="kind">
                <span className="kind-k">Shoots</span>
                <p className="kind-l">
                  North-east light, and nothing in the frame to{" "}
                  <em>edit out.</em>
                </p>
                <span className="kind-t">Wed · daytime</span>
              </li>
              <li className="kind">
                <span className="kind-k">Quiet days</span>
                <p className="kind-l">
                  A laptop, the kettle, the door shut — warmer than the{" "}
                  <em>library.</em>
                </p>
                <span className="kind-t">Thu · 09:00</span>
              </li>
              <li className="kind">
                <span className="kind-k">Workshops</span>
                <p className="kind-l">
                  Eight wheels, plenty of clay, a big sink, then a clean{" "}
                  <em>reset.</em>
                </p>
                <span className="kind-t">Sat · daytime</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ───────── §03 the room — a statement band ───────── */}
        <section className="roomhero" id="room" aria-labelledby="room-title">
          <div className="frame">
            <h2 className="roomhero-title" id="room-title">
              Bare. Daylit. <em>Looked after.</em>
            </h2>
          </div>
        </section>

        {/* ───────── §04 how it works ───────── */}
        <section className="how chapter" aria-labelledby="how-title">
          <div className="frame">
            <div className="chead">
              <span className="cnum">03 — How it works</span>
              <div>
                <h2 className="ctitle" id="how-title">
                  Three steps. <em>That&apos;s it.</em>
                </h2>
                <p className="clede">
                  Pick a time. Get a code. Walk in. No account, no subscription,
                  no surprise at the door.
                </p>
              </div>
            </div>

            <div className="steps">
              <article className="step r-up">
                <span className="num">Step 01</span>
                <h3>
                  Pick <em>your time.</em>
                </h3>
                <p>
                  Choose a day, a start time and how long you need. £45 the
                  first hour and less for each after, one-hour minimum up to
                  eight-hour days, booked in whole hours. Nothing to set up.
                </p>
              </article>
              <article className="step r-up">
                <span className="num">Step 02</span>
                <h3>
                  Get <em>the code.</em>
                </h3>
                <p>
                  Pay by bank transfer with the reference shown at checkout.
                  Once it clears, your door code arrives by email — usually the
                  same working day.
                </p>
              </article>
              <article className="step r-up">
                <span className="num">Step 03</span>
                <h3>
                  Find <em>it ready.</em>
                </h3>
                <p>
                  Reset between every guest. Cleaned, restocked, looked after.
                  The room you booked is the room you walk into.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ───────── §05 diary ───────── */}
        <section
          className="book chapter"
          id="book"
          aria-labelledby="book-title"
        >
          <div className="frame">
            <div className="chead">
              <span className="cnum">04 — The diary</span>
              <div>
                <h2 className="ctitle" id="book-title">
                  Four weeks <em>out.</em>
                </h2>
                <p className="clede">
                  Live availability, four weeks out. Choose a day on the
                  calendar and its open hours appear beside it.
                </p>
              </div>
            </div>

            <BookingDiary />
          </div>
        </section>

        {/* ───────── §05 the practical part — changeover + fine print + map ───────── */}
        <section
          className="practical chapter"
          id="terms"
          aria-labelledby="prac-title"
        >
          <div className="frame">
            <div className="chead">
              <span className="cnum">05 — Before you book</span>
              <div>
                <h2 className="ctitle" id="prac-title">
                  The practical part, <em>kept short.</em>
                </h2>
                <p className="clede">
                  What the room is, how it&apos;s kept between bookings, what it
                  costs — and where to find it.
                </p>
              </div>
            </div>

            <div className="prac">
              <ul className="room-facts" aria-label="The room">
                <li>
                  <b>~40&nbsp;m²</b> ground floor
                </li>
                <li>
                  <b>Oak</b> boards, sealed
                </li>
                <li>
                  <b>North-east</b> light, two tall sashes
                </li>
                <li>
                  <b>Step-free</b> wide door
                </li>
                <li>
                  <b>Kettle</b>, fridge, sink
                </li>
                <li>
                  <b>250&nbsp;Mbps</b> fibre
                </li>
                <li>
                  <b>14</b> seated
                </li>
                <li>
                  <b>Free</b> on-street parking
                </li>
              </ul>

              <aside
                className="docket"
                id="care"
                aria-label="What's done between every booking"
              >
                <div className="docket-h">
                  <span className="t">Changeover record</span>
                  <span className="st">Ready</span>
                </div>
                <ul className="docket-list">
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Floors swept &amp; mopped
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Surfaces wiped down
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Chairs reset &amp; squared
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Windows aired, blinds set
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Kettle filled, mugs washed
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Bins fresh, WC restocked
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Heating &amp; lights set
                  </li>
                  <li>
                    <span className="tick" aria-hidden="true">
                      ✓
                    </span>{" "}
                    Door code rolled over
                  </li>
                </ul>
                <div className="docket-foot">
                  <span id="reset-stamp">Last reset 09:18 · Hull</span>
                  <span className="sign">
                    Self-access, start to finish — left ready for you
                  </span>
                </div>
              </aside>

              <div className="rates-strip">
                <span className="rates-h">By the hour, kinder by the day</span>
                <ul className="rates">
                  <li>
                    1h <b>£45</b>
                  </li>
                  <li>
                    2h <b>£80</b>
                  </li>
                  <li>
                    3h <b>£110</b>
                  </li>
                  <li>
                    4h <b>£140</b>
                  </li>
                  <li>
                    5h <b>£170</b>
                  </li>
                  <li>
                    6h <b>£200</b>
                  </li>
                  <li>
                    7h <b>£225</b>
                  </li>
                  <li>
                    8h <b>£250</b>
                  </li>
                </ul>
                <p className="rates-note">
                  Every hour in between is priced to match; eight hours is the
                  longest single booking, and you pay by bank transfer at
                  checkout. Need a full day-plus or a block of dates?{" "}
                  <a href="mailto:hello@studioone.room?subject=Block%20booking%20%E2%80%94%20StudioONE">
                    Message the studio
                  </a>{" "}
                  and we&apos;ll set a rate.
                </p>
              </div>

              <div className="policy-grid">
                <div className="pol">
                  <span className="k">Cancellation</span>
                  <p>
                    Cancel or move a booking up to <strong>24 hours</strong>{" "}
                    before the start and you&apos;re refunded in full. Inside 24
                    hours, the first hour is kept and the rest comes back.
                  </p>
                </div>
                <div className="pol">
                  <span className="k">Refunds</span>
                  <p>
                    Back to the account you paid from within{" "}
                    <strong>5–10 working days</strong>. If the room is ever
                    unavailable on our side — a leak, a power cut — you&apos;re
                    refunded in full and offered the next free slot.
                  </p>
                </div>
                <div className="pol">
                  <span className="k">Terms</span>
                  <p>
                    Daily 07:00–22:00, whole hours, one-hour minimum, an
                    hour&apos;s reset between guests. Leave it as you found it.
                    Over-18s book; under-18s welcome with a booking adult
                    present.
                  </p>
                </div>
              </div>

              <div className="mapband">
                <div className="map-frame">
                  <span className="map-tag">Sutton Village · Hull</span>
                  <iframe
                    title="Map showing StudioONE in Sutton Village, Hull"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-0.3323%2C53.7703%2C-0.3083%2C53.7843&layer=mapnik&marker=53.7773%2C-0.3203"
                  ></iframe>
                </div>
                <div className="map-foot">
                  <span>53.7773° N · 0.3203° W · HU7</span>
                  <a
                    href="https://www.openstreetmap.org/?mlat=53.7773&mlon=-0.3203#map=15/53.7773/-0.3203"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── CTA ───────── */}
        <section className="cta" aria-labelledby="cta-title">
          <div className="frame">
            <h2 id="cta-title">
              An hour <em>is plenty.</em>
            </h2>
            <a href="#book" className="big" data-cur="Book">
              Reserve the room <span className="ar">→</span>
            </a>
          </div>
        </section>
      </main>

      {/* ───────── footer ───────── */}
      <footer className="foot">
        <div className="frame">
          <div className="foot-grid">
            <div>
              <a className="mark" href="#top">
                Studio<span className="hr">ONE</span>
              </a>
              <p className="lede">
                A ground-floor room in Sutton Village, Hull. Let by the hour,
                every day.
              </p>
            </div>
            <dl className="fcol">
              <dt>Address</dt>
              <dd>Sutton Village</dd>
              <dd>Hull HU7</dd>
              <dd>United Kingdom</dd>
            </dl>
            <dl className="fcol">
              <dt>Hours</dt>
              <dd>Daily, 07:00–22:00</dd>
              <dd>Reset between guests</dd>
              <dd>Code by email</dd>
            </dl>
            <dl className="fcol">
              <dt>Contact</dt>
              <dd>
                <a href="mailto:hello@studioone.room">hello@studioone.room</a>
              </dd>
              <dd>
                <a href="tel:+447700900482">07700 900 482</a>
              </dd>
              <dd>Replies within the hour</dd>
            </dl>
            <dl className="fcol">
              <dt>The fine print</dt>
              <dd>
                <a href="#terms">Cancellation</a>
              </dd>
              <dd>
                <a href="#terms">Refunds</a>
              </dd>
              <dd>
                <a href="#terms">Terms &amp; map</a>
              </dd>
            </dl>
          </div>
          <div className="foot-mark" aria-hidden="true">
            Studio<em>ONE</em>
          </div>
          <div className="foot-bottom">
            <span>StudioONE · HU7 · 2026</span>
            <span>Built for the room, not the brief</span>
          </div>
        </div>
      </footer>

      <SiteEffects />
    </>
  );
}
