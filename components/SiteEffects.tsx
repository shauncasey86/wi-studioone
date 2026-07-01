"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { fetchAvailability } from "@/lib/availability";
import { getSunTimes } from "@/lib/suntimes";

/**
 * StudioONE — motion & interaction, ported from the inline script in
 * legacy/studioone.html: Lenis smooth scroll, topbar pin, the custom cursor,
 * the hero day-arc, the live status clock, the changeover reset stamp, and the
 * GSAP/ScrollTrigger reveals. It enhances the server-rendered DOM by id/class,
 * exactly as the original did. prefers-reduced-motion is honoured throughout.
 */
export default function SiteEffects({
  lat = 53.7773,
  lng = -0.3203,
}: {
  lat?: number;
  lng?: number;
}) {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ac = new AbortController();
    const signal = ac.signal;
    const rafIds: number[] = [];
    let killed = false;
    let lenis: Lenis | null = null;
    let statusTimer: ReturnType<typeof setInterval> | null = null;
    const tickerFns: ((t: number) => void)[] = [];

    /* ───────── Lenis ───────── */
    if (!reduce) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });
      const lenisRef = lenis;
      const raf = (t: number) => {
        if (killed) return;
        lenisRef.raf(t);
        rafIds.push(requestAnimationFrame(raf));
      };
      rafIds.push(requestAnimationFrame(raf));

      lenis.on("scroll", () => ScrollTrigger.update());
      const tick = (t: number) => lenisRef.raf(t * 1000);
      gsap.ticker.add(tick);
      tickerFns.push(tick);
      gsap.ticker.lagSmoothing(0);

      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener(
          "click",
          (e) => {
            const id = a.getAttribute("href");
            if (id && id.length > 1) {
              const t = document.querySelector(id);
              if (t) {
                e.preventDefault();
                lenisRef.scrollTo(t as HTMLElement, {
                  offset: -20,
                  duration: 1.4,
                });
              }
            }
          },
          { signal },
        );
      });
    }

    /* ───────── topbar pin ───────── */
    const bar = document.querySelector<HTMLElement>(".bar");
    const hero = document.querySelector<HTMLElement>(".hero");
    const upBar = () => {
      if (!bar || !hero) return;
      const th = hero.offsetHeight * 0.6;
      const y = window.scrollY || document.documentElement.scrollTop;
      bar.classList.toggle("pin", y > th);
    };
    upBar();
    window.addEventListener("scroll", upBar, { passive: true, signal });
    if (lenis) lenis.on("scroll", upBar);

    /* ───────── mobile menu ───────── */
    const toggle = document.getElementById("bar-toggle");
    const closeMenu = () => {
      if (!bar) return;
      bar.classList.remove("menu-open");
      toggle?.setAttribute("aria-expanded", "false");
      toggle?.setAttribute("aria-label", "Open menu");
    };
    if (toggle && bar) {
      toggle.addEventListener(
        "click",
        () => {
          const open = bar.classList.toggle("menu-open");
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
          toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        },
        { signal },
      );
      // close on nav link click and on Escape
      bar
        .querySelectorAll("nav a")
        .forEach((a) => a.addEventListener("click", closeMenu, { signal }));
      window.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") closeMenu();
        },
        { signal },
      );
    }

    /* ───────── custom cursor ───────── */
    const cur = document.getElementById("cur");
    const ring = document.getElementById("cur-ring");
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    if (cur && ring && fine && !reduce) {
      let mx = innerWidth / 2,
        my = innerHeight / 2,
        rx = mx,
        ry = my,
        curLive = false;
      addEventListener(
        "mousemove",
        (e) => {
          if (!curLive) {
            curLive = true;
            document.documentElement.classList.add("cur-live");
          }
          mx = e.clientX;
          my = e.clientY;
          cur.style.transform =
            "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
        },
        { signal },
      );
      addEventListener(
        "pointerdown",
        (e) => {
          if (e.pointerType && e.pointerType !== "mouse") {
            curLive = false;
            document.documentElement.classList.remove("cur-live");
          }
        },
        { signal },
      );
      const ringTick = () => {
        if (killed) return;
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform =
          "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
        rafIds.push(requestAnimationFrame(ringTick));
      };
      ringTick();
      document.querySelectorAll("a,button,[data-cur]").forEach((el) => {
        const node = el as HTMLElement;
        el.addEventListener(
          "mouseenter",
          () => {
            const l =
              node.dataset.cur || (node.tagName === "BUTTON" ? "Tap" : "Open");
            cur.setAttribute("data-label", l);
            cur.classList.add("on");
            ring.classList.add("on");
          },
          { signal },
        );
        el.addEventListener(
          "mouseleave",
          () => {
            cur.classList.remove("on");
            ring.classList.remove("on");
          },
          { signal },
        );
      });
    }

    /* ════ DAY-ARC — sundial of the open day (07:00 → 22:00) ════ */
    const OPEN = 7,
      CLOSE = 22,
      SPAN = CLOSE - OPEN;
    const ARC = { cx: 440, cy: 470, r: 360 };
    const pol = (cx: number, cy: number, r: number, deg: number) => {
      const a = (deg * Math.PI) / 180;
      return { x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) };
    };
    const timeToDeg = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - OPEN) / SPAN));
      return 180 - 180 * p;
    };
    const arcD = (
      cx: number,
      cy: number,
      r: number,
      d0: number,
      d1: number,
      steps?: number,
    ) => {
      steps = steps || 90;
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const dg = d0 + ((d1 - d0) * i) / steps;
        const p = pol(cx, cy, r, dg);
        d += (i ? "L" : "M") + p.x.toFixed(2) + " " + p.y.toFixed(2);
      }
      return d;
    };
    const hhmmToFloat = (s: string) => {
      const p = s.split(":");
      return parseInt(p[0], 10) + parseInt(p[1], 10) / 60;
    };

    const buildArc = (todayBookings: { s: string; e: string }[]) => {
      const svg = document.getElementById("arc");
      if (!svg) return;
      const track = document.getElementById("arc-track")!;
      const ticksG = document.getElementById("arc-ticks")!;
      const bookedG = document.getElementById("arc-booked-g")!;
      const elapsed = document.getElementById("arc-elapsed")!;
      const sunG = document.getElementById("arc-sun")!;
      const daylight = document.getElementById("arc-daylight");
      const sunTimesG = document.getElementById("arc-suntimes");
      const cap = document.getElementById("arc-cap");
      const NS = "http://www.w3.org/2000/svg";

      // idempotent: clear any prior draw (StrictMode re-runs the effect)
      ticksG.innerHTML = "";
      bookedG.innerHTML = "";
      sunG.innerHTML = "";
      if (sunTimesG) sunTimesG.innerHTML = "";
      if (daylight) daylight.setAttribute("d", "");

      track.setAttribute("d", arcD(ARC.cx, ARC.cy, ARC.r, 180, 0, 120));

      for (let h = OPEN; h <= CLOSE; h++) {
        const dg = timeToDeg(h),
          maj = h === OPEN || h === CLOSE || h % 4 === 0;
        const inP = pol(ARC.cx, ARC.cy, ARC.r - (maj ? 16 : 9), dg);
        const outP = pol(ARC.cx, ARC.cy, ARC.r + (maj ? 14 : 8), dg);
        const ln = document.createElementNS(NS, "line");
        ln.setAttribute("x1", inP.x.toFixed(2));
        ln.setAttribute("y1", inP.y.toFixed(2));
        ln.setAttribute("x2", outP.x.toFixed(2));
        ln.setAttribute("y2", outP.y.toFixed(2));
        ln.setAttribute("class", "arc-tick" + (maj ? " maj" : ""));
        ticksG.appendChild(ln);
      }
      [12, 17].forEach((h) => {
        const p = pol(ARC.cx, ARC.cy, ARC.r + 40, timeToDeg(h));
        const tx = document.createElementNS(NS, "text");
        tx.setAttribute("x", p.x.toFixed(1));
        tx.setAttribute("y", p.y.toFixed(1));
        tx.setAttribute("text-anchor", "middle");
        tx.setAttribute("class", "arc-lab");
        tx.textContent = (h < 10 ? "0" : "") + h + ":00";
        ticksG.appendChild(tx);
      });

      // ── live daylight: today's sunrise → sunset for this location ──
      const p2 = (n: number) => (n < 10 ? "0" : "") + n;
      const hhmmOf = (d: Date) => p2(d.getHours()) + ":" + p2(d.getMinutes());
      const localF = (d: Date) => d.getHours() + d.getMinutes() / 60;
      const sun = getSunTimes(new Date(), lat, lng);
      let sunHint = "";
      if (sun) {
        const srF = localF(sun.sunrise),
          ssF = localF(sun.sunset);
        const bandS = Math.max(OPEN, Math.min(CLOSE, srF)),
          bandE = Math.max(OPEN, Math.min(CLOSE, ssF));
        if (daylight && bandE > bandS) {
          daylight.setAttribute(
            "d",
            arcD(ARC.cx, ARC.cy, ARC.r, timeToDeg(bandS), timeToDeg(bandE), 60),
          );
        }
        // sunrise / sunset ticks + labels, only when they fall in open hours
        const mark = (d: Date, glyph: string) => {
          const t = localF(d);
          if (!sunTimesG || t < OPEN || t > CLOSE) return;
          const dg = timeToDeg(t);
          const inP = pol(ARC.cx, ARC.cy, ARC.r - 22, dg),
            outP = pol(ARC.cx, ARC.cy, ARC.r + 18, dg);
          const ln = document.createElementNS(NS, "line");
          ln.setAttribute("x1", inP.x.toFixed(2));
          ln.setAttribute("y1", inP.y.toFixed(2));
          ln.setAttribute("x2", outP.x.toFixed(2));
          ln.setAttribute("y2", outP.y.toFixed(2));
          ln.setAttribute("class", "arc-suntick");
          sunTimesG.appendChild(ln);
          const lp = pol(ARC.cx, ARC.cy, ARC.r + 60, dg);
          const tx = document.createElementNS(NS, "text");
          tx.setAttribute("x", lp.x.toFixed(1));
          tx.setAttribute("y", lp.y.toFixed(1));
          tx.setAttribute("text-anchor", "middle");
          tx.setAttribute("class", "arc-sunlab");
          tx.textContent = glyph + " " + hhmmOf(d);
          sunTimesG.appendChild(tx);
        };
        mark(sun.sunrise, "↑");
        mark(sun.sunset, "↓");
        const nowF2 = new Date().getHours() + new Date().getMinutes() / 60;
        sunHint =
          nowF2 < srF
            ? "sunrise " + hhmmOf(sun.sunrise)
            : nowF2 > ssF
              ? "after dark"
              : "light till " + hhmmOf(sun.sunset);
      }

      todayBookings.forEach((b) => {
        const d0 = timeToDeg(hhmmToFloat(b.s)),
          d1 = timeToDeg(hhmmToFloat(b.e));
        const pth = document.createElementNS(NS, "path");
        pth.setAttribute("d", arcD(ARC.cx, ARC.cy, ARC.r, d0, d1, 24));
        pth.setAttribute("class", "arc-booked");
        bookedG.appendChild(pth);
      });

      const halo = document.createElementNS(NS, "circle");
      halo.setAttribute("r", "18");
      halo.setAttribute("class", "arc-sun-halo");
      const core = document.createElementNS(NS, "circle");
      core.setAttribute("r", "7");
      core.setAttribute("class", "arc-sun-core");
      const lab = document.createElementNS(NS, "text");
      lab.setAttribute("class", "arc-sun-lab");
      lab.setAttribute("text-anchor", "middle");
      sunG.appendChild(halo);
      sunG.appendChild(core);
      sunG.appendChild(lab);

      const now = new Date();
      const nowF = now.getHours() + now.getMinutes() / 60;
      const open = nowF >= OPEN && nowF <= CLOSE;
      const hh = String(now.getHours()).padStart(2, "0"),
        mm = String(now.getMinutes()).padStart(2, "0");

      const placeSun = (t: number) => {
        const dg = timeToDeg(t),
          p = pol(ARC.cx, ARC.cy, ARC.r, dg);
        sunG.setAttribute(
          "transform",
          "translate(" + p.x.toFixed(2) + "," + p.y.toFixed(2) + ")",
        );
        lab.setAttribute("y", (-26).toString());
        lab.setAttribute("x", (dg > 120 ? 14 : dg < 60 ? -14 : 0).toString());
      };
      const setElapsed = (t: number) => {
        elapsed.setAttribute(
          "d",
          arcD(ARC.cx, ARC.cy, ARC.r, 180, timeToDeg(t), 120),
        );
      };

      if (!open) {
        const endT = nowF < OPEN ? OPEN : CLOSE;
        placeSun(endT);
        setElapsed(endT);
        (core as SVGElement).style.opacity = ".5";
        (halo as SVGElement).style.opacity = ".08";
        lab.textContent = "Closed";
        if (cap)
          cap.textContent =
            (nowF < OPEN ? "opens 07:00" : "closed for the day") +
            (sunHint ? " · " + sunHint : "");
        return;
      }

      lab.textContent = hh + ":" + mm;
      if (cap)
        cap.textContent =
          "now · " + hh + ":" + mm + (sunHint ? " · " + sunHint : " · Hull");

      if (reduce) {
        placeSun(nowF);
        setElapsed(nowF);
      } else {
        const st = { t: OPEN };
        gsap.to(st, {
          t: nowF,
          duration: 1.7,
          delay: 0.5,
          ease: "power2.out",
          onUpdate: () => {
            placeSun(st.t);
            setElapsed(st.t);
          },
        });
        gsap.to(halo, {
          attr: { r: 24 },
          opacity: 0.12,
          duration: 2.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 2.2,
        });
      }
    };

    /* ───────── live status ───────── */
    const status = () => {
      const d = new Date(),
        h = d.getHours(),
        m = String(d.getMinutes()).padStart(2, "0");
      const open = h >= 7 && h < 22;
      const s = document.getElementById("status");
      if (s)
        s.textContent =
          (open ? "Open" : "Closed") +
          " · " +
          String(h).padStart(2, "0") +
          ":" +
          m +
          " · Hull";
    };
    status();
    statusTimer = setInterval(status, 60000);

    /* between-bookings docket — a recent, live-feeling reset time */
    (() => {
      const el = document.getElementById("reset-stamp");
      if (!el) return;
      const ago = 25 + Math.floor(Math.random() * 30);
      const d = new Date(Date.now() - ago * 60000);
      const p2 = (n: number) => (n < 10 ? "0" : "") + n;
      el.textContent =
        "Last reset " + p2(d.getHours()) + ":" + p2(d.getMinutes()) + " · Hull";
    })();

    /* ════ GSAP cinematic reveals ════ */
    if (!reduce) {
      gsap.registerPlugin(ScrollTrigger);

      const heroTl = gsap.timeline({ delay: 0.15 });
      heroTl
        .to(
          ".hero-eyebrow",
          { opacity: 1, duration: 0.9, ease: "power2.out" },
          0,
        )
        .to(
          ".hero-title .row > span",
          { y: "0%", duration: 1.4, ease: "expo.out", stagger: 0.12 },
          0.1,
        )
        .to(".hero-sub", { opacity: 1, duration: 1, ease: "power2.out" }, 0.8)
        .to(".hero-foot", { opacity: 1, duration: 1, ease: "power2.out" }, 0.95)
        .to(
          ".arc-wrap",
          { opacity: 1, duration: 1.1, ease: "power2.out" },
          0.5,
        );

      const words = document.querySelectorAll<HTMLElement>(".pull .w");
      if (words.length) {
        ScrollTrigger.create({
          trigger: ".manifesto",
          start: "top 65%",
          end: "center 30%",
          scrub: 0.4,
          onUpdate: (st) => {
            const n = Math.floor(st.progress * words.length * 1.15);
            words.forEach((w, i) => w.classList.toggle("on", i <= n));
          },
        });
      }

      gsap.utils.toArray<HTMLElement>(".ctitle").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 50, opacity: 0, clipPath: "inset(-20% 0 100% 0)" },
          {
            y: 0,
            opacity: 1,
            clipPath: "inset(-20% -10% -20% -10%)",
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>(".clede").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            delay: 0.15,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>(".cnum").forEach((el) => {
        gsap.fromTo(
          el,
          { x: -20, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>(".step.r-up").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: "expo.out",
            delay: i * 0.08,
            scrollTrigger: { trigger: el, start: "top 85%" },
          },
        );
      });
      gsap.fromTo(
        ".foot-mark",
        { letterSpacing: "-0.03em" },
        {
          letterSpacing: "-0.06em",
          ease: "none",
          scrollTrigger: {
            trigger: ".foot",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 1,
          },
        },
      );

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    } else {
      document
        .querySelectorAll<HTMLElement>(".hero-title .row > span")
        .forEach((s) => (s.style.transform = "none"));
      document.querySelectorAll<HTMLElement>(".r-fade,.r-up").forEach((s) => {
        s.style.opacity = "1";
        s.style.transform = "none";
      });
      document
        .querySelectorAll<HTMLElement>(".pull .w")
        .forEach((w) => w.classList.add("on"));
    }

    /* ════ one fetch feeds the day-arc (the diary fetches its own copy) ════ */
    fetchAvailability()
      .then((data) => {
        const todayBookings = data && data[0] ? data[0] : [];
        try {
          buildArc(todayBookings);
        } catch {
          /* arc is decorative; never block the page */
        }
      })
      .catch(() => {});

    /* ───────── teardown ───────── */
    return () => {
      killed = true;
      ac.abort();
      rafIds.forEach((id) => cancelAnimationFrame(id));
      if (statusTimer) clearInterval(statusTimer);
      tickerFns.forEach((fn) => gsap.ticker.remove(fn));
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.killTweensOf("*");
      if (lenis) lenis.destroy();
      document.documentElement.classList.remove("cur-live");
    };
  }, [lat, lng]);

  return null;
}
