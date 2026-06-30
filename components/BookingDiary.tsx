"use client";

import { useEffect, useRef } from "react";
import { createBooking, fetchAvailability } from "@/lib/availability";

/**
 * StudioONE — booking diary, a faithful port of the calendar logic in
 * legacy/studioone.html. The shell is rendered statically (so SSR/CSR match and
 * there is no timezone hydration drift); all date-dependent building runs after
 * mount, exactly as the original boot() did. Behaviour and a11y mirror the
 * original: radiogroup calendar with roving tabindex, aria-checked days,
 * aria-pressed times/presets, the live region, and focus management. It reads
 * availability and writes bookings through lib/availability (a mock until
 * Phase 4 swaps in the real API).
 */
export type DiaryConfig = {
  openHour: number;
  closeHour: number;
  minHours: number;
  maxHours: number;
  resetHours: number;
  daysAhead: number;
  prices: Record<number, number>;
  bacs: {
    accountName: string;
    sortCode: string;
    accountNo: string;
    referencePrefix: string;
    demo: boolean;
  };
};

export default function BookingDiary({ config }: { config: DiaryConfig }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTH_NAMES = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const MONTH_FULL = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const START_HOUR = config.openHour,
      END_HOUR = config.closeHour;
    const HOURS_PER_DAY = END_HOUR - START_HOUR;
    const MIN_RUN = config.minHours,
      MAX_RUN = config.maxHours,
      RESET_HOURS = config.resetHours;
    const DAYS_AHEAD = config.daysAhead;
    const PRICE: Record<number, number> = config.prices;
    const priceFor = (h: number) =>
      PRICE[h] != null ? PRICE[h] : Math.round(h * (PRICE[1] ?? 45));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let BOOKINGS: Record<number, { s: string; e: string; label: string }[]> =
      {};

    const hhmmToMin = (s: string) => {
      const p = s.split(":");
      return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    };
    const clockOf = (i: number) => START_HOUR + i;
    const hourLabel = (i: number) =>
      String(clockOf(i)).padStart(2, "0") + ":00";
    const money = (v: number) => "£" + v.toFixed(0);
    const dur = (h: number) => (h === 1 ? "1 hour" : h + " hours");

    let daySlots: string[][] = [];
    const build = () => {
      daySlots = [];
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes(),
        reset = RESET_HOURS * 60;
      for (let d = 0; d < DAYS_AHEAD; d++) {
        const arr = new Array(HOURS_PER_DAY).fill("free"),
          list = BOOKINGS[d] || [];
        for (let b = 0; b < list.length; b++) {
          const bs = hhmmToMin(list[b].s),
            be = hhmmToMin(list[b].e);
          for (let h = 0; h < HOURS_PER_DAY; h++) {
            const blkS = (START_HOUR + h) * 60,
              blkE = blkS + 60;
            if (bs < blkE && be > blkS) {
              arr[h] = "booked";
            } else if (
              arr[h] === "free" &&
              ((blkS >= be && blkS < be + reset) ||
                (blkE > bs - reset && blkE <= bs))
            ) {
              arr[h] = "buffer";
            }
          }
        }
        if (d === 0) {
          for (let k = 0; k < HOURS_PER_DAY; k++) {
            if ((START_HOUR + k) * 60 < nowMin && arr[k] === "free")
              arr[k] = "past";
          }
        }
        daySlots.push(arr);
      }
    };

    const sel: {
      dayIdx: number | null;
      start: number | null;
      end: number | null;
    } = { dayIdx: null, start: null, end: null };

    const $ = (id: string) => document.getElementById(id);
    const summary = $("summary"),
      live = $("book-live"),
      clearBtn = $("clear"),
      confirmBtn = $("confirm"),
      msgBtn = $("message-host"),
      pickDays = $("pick-days"),
      pickTimes = $("pick-times"),
      pickPresets = $("pick-presets"),
      stepTime = $("step-time"),
      stepLength = $("step-length"),
      lenMinus = $("len-minus") as HTMLButtonElement | null,
      lenPlus = $("len-plus") as HTMLButtonElement | null,
      lenSpan = $("len-span"),
      lenMeta = $("len-meta"),
      lenNote = $("len-note");
    const stepPay = $("step-pay"),
      nameInput = $("bk-name") as HTMLInputElement | null,
      emailInput = $("bk-email") as HTMLInputElement | null,
      bacsRef = $("bacs-ref"),
      bacsAmt = $("bacs-amt"),
      payBtn = $("pay-confirm");

    const ac = new AbortController();
    const signal = ac.signal;

    const dateFor = (d: number) => {
      const x = new Date(today);
      x.setDate(today.getDate() + d);
      return x;
    };
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const isoOf = (d: number) => {
      const x = dateFor(d);
      return (
        x.getFullYear() + "-" + pad2(x.getMonth() + 1) + "-" + pad2(x.getDate())
      );
    };
    const ordinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"],
        v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    const dayLabel = (d: number) => {
      const x = dateFor(d);
      return (
        (d === 0 ? "Today" : DAY_NAMES[x.getDay()]) +
        " " +
        x.getDate() +
        " " +
        MONTH_NAMES[x.getMonth()]
      );
    };
    const dayLong = (d: number) => {
      const x = dateFor(d);
      const nm = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][x.getDay()];
      return (d === 0 ? "today, " + nm : nm) + " the " + ordinal(x.getDate());
    };
    const freeCount = (d: number) => {
      let n = 0;
      const a = daySlots[d];
      for (let i = 0; i < HOURS_PER_DAY; i++) if (a[i] === "free") n++;
      return n;
    };
    const reachEnd = (d: number, start: number, cand: number) => {
      const sl = daySlots[d];
      if (cand >= start) {
        let i = start;
        while (i <= cand && i < HOURS_PER_DAY && sl[i] === "free") i++;
        return i;
      } else {
        let j = start - 1;
        while (j >= cand && j >= 0 && sl[j] === "free") j--;
        return j + 1;
      }
    };
    const maxEnd = (d: number, start: number) =>
      Math.min(reachEnd(d, start, HOURS_PER_DAY - 1), start + MAX_RUN);
    const fitsMin = (d: number, i: number) =>
      reachEnd(d, i, i + MIN_RUN - 1) - i >= MIN_RUN;

    /* ════ step 1 · the calendar (four weeks out) ════ */
    const leadDays = () => (today.getDay() + 6) % 7;
    const calWeeks = () => Math.ceil((leadDays() + DAYS_AHEAD) / 7);
    const setMonthLabel = () => {
      const el = $("cal-month");
      if (!el) return;
      const lead = leadDays(),
        a = dateFor(-lead),
        b = dateFor(calWeeks() * 7 - 1 - lead);
      const ya = a.getFullYear(),
        yb = b.getFullYear();
      el.textContent =
        a.getMonth() === b.getMonth()
          ? MONTH_FULL[a.getMonth()] + " " + yb
          : MONTH_FULL[a.getMonth()] +
            (ya !== yb ? " " + ya : "") +
            " – " +
            MONTH_FULL[b.getMonth()] +
            " " +
            yb;
    };
    const buildDays = () => {
      if (!pickDays) return;
      pickDays.innerHTML = "";
      const lead = leadDays(),
        cells = calWeeks() * 7;
      let firstBookable: HTMLButtonElement | null = null;
      for (let i = 0; i < cells; i++) {
        const off = i - lead,
          x = dateFor(off);
        if (off < 0 || off >= DAYS_AHEAD) {
          const out = document.createElement("div");
          out.className = "cell out";
          out.setAttribute("aria-hidden", "true");
          out.innerHTML = '<span class="cd">' + x.getDate() + "</span>";
          pickDays.appendChild(out);
          continue;
        }
        const n = freeCount(off),
          ratio = Math.round((n / HOURS_PER_DAY) * 100);
        const lvl = n === 0 ? "full" : n <= 4 ? "some" : "open";
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cell day " + lvl + (off === 0 ? " today" : "");
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", "false");
        b.tabIndex = -1;
        b.dataset.day = String(off);
        b.setAttribute(
          "aria-label",
          dayLong(off) +
            " — " +
            (n ? n + (n === 1 ? " hour" : " hours") + " free" : "fully booked"),
        );
        b.innerHTML =
          '<span class="cd" aria-hidden="true">' +
          x.getDate() +
          "</span>" +
          (off === 0
            ? '<span class="ct" aria-hidden="true">Today</span>'
            : "") +
          '<span class="cmeter" aria-hidden="true"><i style="width:' +
          ratio +
          '%"></i></span>';
        b.addEventListener(
          "click",
          (ev) => chooseDay(+(ev.currentTarget as HTMLElement).dataset.day!),
          { signal },
        );
        b.addEventListener("keydown", onDayKey, { signal });
        if (firstBookable === null) firstBookable = b;
        pickDays.appendChild(b);
      }
      if (firstBookable) firstBookable.tabIndex = 0;
      setMonthLabel();
    };
    const onDayKey = (e: KeyboardEvent) => {
      const d = +(e.currentTarget as HTMLElement).dataset.day!;
      let nd = d;
      switch (e.key) {
        case "ArrowRight":
          nd = d + 1;
          break;
        case "ArrowLeft":
          nd = d - 1;
          break;
        case "ArrowDown":
          nd = d + 7;
          break;
        case "ArrowUp":
          nd = d - 7;
          break;
        case "Home":
          nd = 0;
          break;
        case "End":
          nd = DAYS_AHEAD - 1;
          break;
        default:
          return;
      }
      nd = Math.max(0, Math.min(DAYS_AHEAD - 1, nd));
      e.preventDefault();
      if (nd === d) return;
      const all = pickDays!.querySelectorAll<HTMLElement>(".day"),
        t = pickDays!.querySelector<HTMLElement>('.day[data-day="' + nd + '"]');
      if (t) {
        for (let k = 0; k < all.length; k++)
          all[k].tabIndex = all[k] === t ? 0 : -1;
        t.focus();
      }
    };
    const chooseDay = (d: number) => {
      closePay();
      sel.dayIdx = d;
      sel.start = null;
      sel.end = null;
      const days = pickDays!.querySelectorAll<HTMLElement>(".day");
      for (let k = 0; k < days.length; k++) {
        const on = +days[k].dataset.day! === d;
        days[k].setAttribute("aria-checked", on ? "true" : "false");
        days[k].tabIndex = on ? 0 : -1;
      }
      const free = freeCount(d);
      const kick = $("slot-kicker");
      if (kick) kick.textContent = free ? "Chosen day" : "Fully booked";
      const dh = $("slot-day");
      if (dh) {
        dh.textContent = dayLabel(d);
        dh.classList.remove("empty");
      }
      buildTimes(d);
      if (stepTime) (stepTime as HTMLElement).hidden = false;
      if (stepLength) (stepLength as HTMLElement).hidden = true;
      summarize();
    };

    /* ════ step 2 · choose a start (grouped by part of day) ════ */
    const partName = (i: number) => {
      const h = START_HOUR + i;
      return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
    };
    const buildTimes = (d: number) => {
      if (!pickTimes) return;
      pickTimes.innerHTML = "";
      const groups: [string, number[]][] = [
        ["Morning", []],
        ["Afternoon", []],
        ["Evening", []],
      ];
      const idx: Record<string, number> = {
        Morning: 0,
        Afternoon: 1,
        Evening: 2,
      };
      let any = false;
      for (let i = 0; i < HOURS_PER_DAY; i++) {
        if (daySlots[d][i] === "free" && fitsMin(d, i))
          groups[idx[partName(i)]][1].push(i);
      }
      for (let g = 0; g < groups.length; g++) {
        const name = groups[g][0],
          list = groups[g][1];
        if (!list.length) continue;
        any = true;
        const sec = document.createElement("div");
        sec.className = "tgroup";
        const h = document.createElement("div");
        h.className = "tgroup-h";
        h.textContent = name;
        sec.appendChild(h);
        const grid = document.createElement("div");
        grid.className = "tgrid";
        for (let j = 0; j < list.length; j++) {
          const s = list[j];
          const b = document.createElement("button");
          b.type = "button";
          b.className = "time";
          b.dataset.day = String(d);
          b.dataset.slot = String(s);
          b.setAttribute("aria-pressed", "false");
          b.setAttribute("aria-label", "Start at " + hourLabel(s));
          b.textContent = hourLabel(s);
          b.addEventListener(
            "click",
            (ev) =>
              chooseStart(
                +(ev.currentTarget as HTMLElement).dataset.day!,
                +(ev.currentTarget as HTMLElement).dataset.slot!,
              ),
            { signal },
          );
          grid.appendChild(b);
        }
        sec.appendChild(grid);
        pickTimes.appendChild(sec);
      }
      if (!any) {
        const p = document.createElement("p");
        p.className = "times-empty";
        p.textContent =
          "No openings long enough that day — try another day, or message the studio and we’ll sort something out.";
        pickTimes.appendChild(p);
      }
    };
    const chooseStart = (d: number, i: number) => {
      closePay();
      sel.dayIdx = d;
      sel.start = i;
      sel.end = Math.min(i + MIN_RUN, maxEnd(d, i));
      if (sel.end - sel.start < MIN_RUN) sel.end = sel.start + MIN_RUN;
      const btns = pickTimes!.querySelectorAll<HTMLElement>(".time");
      for (let k = 0; k < btns.length; k++)
        btns[k].setAttribute(
          "aria-pressed",
          +btns[k].dataset.slot! === i && +btns[k].dataset.day! === d
            ? "true"
            : "false",
        );
      buildPresets(d, i);
      if (stepLength) (stepLength as HTMLElement).hidden = false;
      updateLength();
      summarize();
    };

    /* ════ step 3 · how long (presets + hourly stepper) ════ */
    const buildPresets = (d: number, i: number) => {
      if (!pickPresets) return;
      pickPresets.innerHTML = "";
      const cap = maxEnd(d, i),
        defs: [string, number][] = [
          ["1 hour", 1],
          ["2 hours", 2],
          ["Half day", 4],
          ["Full day", 8],
        ];
      for (let p = 0; p < defs.length; p++) {
        const hours = defs[p][1];
        if (i + hours > cap) continue;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "preset";
        b.dataset.hours = String(hours);
        b.setAttribute("aria-pressed", "false");
        b.setAttribute(
          "aria-label",
          defs[p][0] + ", " + money(priceFor(hours)),
        );
        b.innerHTML =
          defs[p][0] +
          ' <span class="pp">' +
          money(priceFor(hours)) +
          "</span>";
        b.addEventListener(
          "click",
          (ev) => setLength(+(ev.currentTarget as HTMLElement).dataset.hours!),
          { signal },
        );
        pickPresets.appendChild(b);
      }
    };
    const setLength = (hours: number) => {
      if (sel.start === null) return;
      const cap = maxEnd(sel.dayIdx!, sel.start);
      sel.end = Math.min(Math.max(sel.start + hours, sel.start + MIN_RUN), cap);
      closePay();
      updateLength();
      summarize();
    };
    const stepLen = (dir: number) => {
      if (sel.start === null) return;
      const ne = sel.end! + dir;
      if (ne < sel.start + MIN_RUN || ne > maxEnd(sel.dayIdx!, sel.start))
        return;
      sel.end = ne;
      closePay();
      updateLength();
      summarize();
    };
    const updateLength = () => {
      if (sel.start === null) return;
      const hours = sel.end! - sel.start;
      if (lenSpan)
        lenSpan.textContent = hourLabel(sel.start) + "–" + hourLabel(sel.end!);
      if (lenMeta)
        lenMeta.textContent = dur(hours) + " · " + money(priceFor(hours));
      if (lenMinus) lenMinus.disabled = sel.end! <= sel.start + MIN_RUN;
      if (lenPlus)
        lenPlus.disabled = sel.end! >= maxEnd(sel.dayIdx!, sel.start);
      if (lenNote) (lenNote as HTMLElement).hidden = hours < MAX_RUN;
      if (pickPresets) {
        const ps = pickPresets.querySelectorAll<HTMLElement>(".preset");
        for (let k = 0; k < ps.length; k++)
          ps[k].setAttribute(
            "aria-pressed",
            +ps[k].dataset.hours! === hours ? "true" : "false",
          );
      }
    };
    if (lenMinus)
      lenMinus.addEventListener("click", () => stepLen(-1), { signal });
    if (lenPlus)
      lenPlus.addEventListener("click", () => stepLen(1), { signal });

    /* ════ shared output: summary, live announce, message link ════ */
    const summarize = () => {
      let canBook = false,
        vis = "",
        say = "";
      if (sel.dayIdx === null) {
        vis = '<span class="empty">Pick a day to begin.</span>';
      } else if (sel.start === null) {
        vis = '<span class="empty">Choose a start time above.</span>';
        say = dayLabel(sel.dayIdx) + " selected. Choose a start time.";
      } else {
        const hours = sel.end! - sel.start,
          price = priceFor(hours);
        vis =
          "<span>" +
          hourLabel(sel.start) +
          "–" +
          hourLabel(sel.end!) +
          " · " +
          dur(hours) +
          "</span><strong>" +
          money(price) +
          "</strong>";
        say =
          dayLong(sel.dayIdx) +
          ", " +
          hourLabel(sel.start) +
          " to " +
          hourLabel(sel.end!) +
          ", " +
          dur(hours) +
          ", " +
          money(price) +
          ". Ready to confirm.";
        canBook = true;
      }
      if (summary) summary.innerHTML = vis;
      if (live && say) live.textContent = say;
      if (confirmBtn) {
        if (canBook) confirmBtn.removeAttribute("aria-disabled");
        else confirmBtn.setAttribute("aria-disabled", "true");
      }
      if (clearBtn) {
        if (sel.start !== null) clearBtn.removeAttribute("aria-disabled");
        else clearBtn.setAttribute("aria-disabled", "true");
      }
      updateMessageHref();
    };

    const updateMessageHref = () => {
      if (!msgBtn) return;
      let subj = "Booking enquiry — StudioONE",
        body = "Hi there,%0D%0A%0D%0A";
      if (sel.start !== null) {
        const hours = sel.end! - sel.start;
        subj =
          "StudioONE — " +
          dayLabel(sel.dayIdx!) +
          " " +
          hourLabel(sel.start) +
          "–" +
          hourLabel(sel.end!);
        body +=
          "I'd like to ask about " +
          dayLong(sel.dayIdx!) +
          ", " +
          hourLabel(sel.start) +
          " to " +
          hourLabel(sel.end!) +
          " (" +
          dur(hours) +
          ", " +
          money(priceFor(hours)) +
          ").%0D%0A%0D%0A";
      } else if (sel.dayIdx !== null) {
        subj = "StudioONE — " + dayLabel(sel.dayIdx);
        body +=
          "I'd like to ask about " + dayLong(sel.dayIdx) + ".%0D%0A%0D%0A";
      } else {
        body += "I'd like to ask about availability.%0D%0A%0D%0A";
      }
      msgBtn.setAttribute(
        "href",
        "mailto:hello@studioone.room?subject=" +
          encodeURIComponent(subj) +
          "&body=" +
          body,
      );
    };

    const clearSel = () => {
      sel.start = null;
      sel.end = null;
      if (pickTimes) {
        const b = pickTimes.querySelectorAll<HTMLElement>(".time");
        for (let k = 0; k < b.length; k++)
          b[k].setAttribute("aria-pressed", "false");
      }
      if (stepLength) (stepLength as HTMLElement).hidden = true;
      closePay();
      if (confirmBtn)
        confirmBtn.innerHTML =
          'Continue to payment <span class="ar" aria-hidden="true">→</span>';
      summarize();
      if (live) live.textContent = "Time cleared.";
    };
    if (clearBtn)
      clearBtn.addEventListener(
        "click",
        () => {
          if (clearBtn.getAttribute("aria-disabled") === "true") return;
          clearSel();
        },
        { signal },
      );

    /* ── step 4: details + bank transfer ── */
    const reEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const payReady = () =>
      sel.start !== null &&
      !!nameInput &&
      !!emailInput &&
      nameInput.value.trim() !== "" &&
      reEmail(emailInput.value.trim());
    const refreshPay = () => {
      if (payBtn) {
        if (payReady()) payBtn.removeAttribute("aria-disabled");
        else payBtn.setAttribute("aria-disabled", "true");
      }
    };
    if (nameInput) nameInput.addEventListener("input", refreshPay, { signal });
    if (emailInput)
      emailInput.addEventListener("input", refreshPay, { signal });

    const openPay = () => {
      if (sel.start === null) return;
      if (bacsRef) bacsRef.textContent = "Assigned when you reserve";
      if (bacsAmt) bacsAmt.textContent = money(priceFor(sel.end! - sel.start));
      if (stepPay) (stepPay as HTMLElement).hidden = false;
      if (confirmBtn) (confirmBtn as HTMLElement).hidden = true;
      refreshPay();
      if (nameInput) nameInput.focus({ preventScroll: true });
      if (live)
        live.textContent =
          "Enter your name and email, then reserve the slot — your reference and bank details appear next.";
    };
    const closePay = () => {
      if (stepPay) (stepPay as HTMLElement).hidden = true;
      if (confirmBtn) (confirmBtn as HTMLElement).hidden = false;
    };

    if (confirmBtn)
      confirmBtn.addEventListener(
        "click",
        () => {
          if (
            confirmBtn.getAttribute("aria-disabled") === "true" ||
            sel.start === null
          )
            return;
          openPay();
        },
        { signal },
      );

    const esc = (v: string) =>
      String(v).replace(
        /[&<>"]/g,
        (c) =>
          (
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
            }) as Record<string, string>
          )[c],
      );
    const renderPending = (p: {
      name: string;
      email: string;
      reference: string;
      day: string;
      start: string;
      end: string;
      price: number;
    }) => {
      const box = rootRef.current;
      if (box) {
        box.innerHTML =
          '<div class="booked">' +
          '<span class="booked-k">Awaiting payment</span>' +
          "<h3>Thanks, " +
          esc(p.name) +
          ". <em>Almost there.</em></h3>" +
          "<p>We’ve let the studio know to look out for your transfer. The moment it clears — usually the same working day — your door code lands by email at <strong>" +
          esc(p.email) +
          "</strong>. Nothing’s confirmed until that email arrives.</p>" +
          '<dl class="booked-meta">' +
          "<div><dt>Slot</dt><dd>" +
          esc(p.day) +
          " · " +
          p.start +
          "–" +
          p.end +
          "</dd></div>" +
          '<div><dt>Reference</dt><dd class="mark">' +
          esc(p.reference) +
          "</dd></div>" +
          '<div><dt>Amount</dt><dd class="mark">' +
          money(p.price) +
          "</dd></div>" +
          "</dl>" +
          '<dl class="booked-meta">' +
          "<div><dt>Account name</dt><dd>" +
          esc(config.bacs.accountName) +
          "</dd></div>" +
          "<div><dt>Sort code</dt><dd>" +
          esc(config.bacs.sortCode) +
          "</dd></div>" +
          "<div><dt>Account no.</dt><dd>" +
          esc(config.bacs.accountNo) +
          "</dd></div>" +
          "</dl>" +
          '<p class="booked-fine">Transfer <strong>' +
          money(p.price) +
          "</strong> to the account above using reference <strong>" +
          esc(p.reference) +
          "</strong> so we can match it. Something to ask first? " +
          '<a href="mailto:hello@studioone.room?subject=' +
          encodeURIComponent("Booking " + p.reference + " — StudioONE") +
          '">Message the studio</a>.</p>' +
          "</div>";
      }
      if (summary)
        summary.innerHTML =
          '<span class="empty">Reserved — your code will be emailed once payment clears.</span>';
      if (live)
        live.textContent =
          "Reserved. Reference " +
          p.reference +
          ". Transfer " +
          money(p.price) +
          " to " +
          config.bacs.accountName +
          ". Your door code will be emailed to " +
          p.email +
          " once it clears.";
    };

    if (payBtn)
      payBtn.addEventListener(
        "click",
        () => {
          if (payBtn.getAttribute("aria-disabled") === "true" || !payReady())
            return;
          const hours = sel.end! - sel.start!;
          const payload = {
            name: nameInput!.value.trim(),
            email: emailInput!.value.trim(),
            dateISO: isoOf(sel.dayIdx!),
            startHour: clockOf(sel.start!),
            hours,
          };
          const dayIdx = sel.dayIdx!,
            startIdx = sel.start!,
            endIdx = sel.end!;
          payBtn.setAttribute("aria-disabled", "true");
          payBtn.innerHTML = "Reserving…";
          createBooking(payload).then((res) => {
            if (res.ok) {
              renderPending({
                name: payload.name,
                email: payload.email,
                reference: res.reference || "",
                day: dayLabel(dayIdx),
                start: hourLabel(startIdx),
                end: hourLabel(endIdx),
                price: (res.amountPence ?? priceFor(hours) * 100) / 100,
              });
            } else {
              payBtn.removeAttribute("aria-disabled");
              payBtn.innerHTML =
                'Reserve the room <span class="ar" aria-hidden="true">→</span>';
              if (live)
                live.textContent =
                  res.error === "unavailable"
                    ? "Sorry — that slot was just taken. Please pick another."
                    : "Something went wrong. Please try again.";
              if (res.error === "unavailable") {
                fetchAvailability().then((d) => {
                  BOOKINGS = d || {};
                  build();
                  buildDays();
                  chooseDay(dayIdx);
                });
              }
            }
          });
        },
        { signal },
      );

    /* ════ boot: one fetch feeds the picker ════ */
    fetchAvailability().then((data) => {
      BOOKINGS = data || {};
      build();
      buildDays();
      chooseDay(0);
    });

    return () => {
      ac.abort();
    };
  }, [config]);

  return (
    <>
      <div className="booking" id="booking" ref={rootRef}>
        <div className="booking-meta">
          <span id="cal-month">&nbsp;</span>
          <span className="r">Updated live</span>
        </div>

        <div className="diary">
          {/* step 1 — the calendar */}
          <div className="cal-col">
            <div className="cal-head" aria-hidden="true">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
            <div
              className="cal-grid"
              id="pick-days"
              role="radiogroup"
              aria-label="Pick a day, four weeks out"
              data-lenis-prevent=""
            ></div>
            <p className="cal-legend" aria-hidden="true">
              <span className="lg lg-open">Open</span>
              <span className="lg lg-some">Filling</span>
              <span className="lg lg-full">Booked</span>
            </p>
            <p className="bhint">
              Further than four weeks out, or a recurring slot?{" "}
              <a href="mailto:hello@studioone.room?subject=Date%20enquiry%20%E2%80%94%20StudioONE">
                Message the studio
              </a>{" "}
              and we&apos;ll sort it.
            </p>
          </div>

          {/* steps 2–4 — the slot panel */}
          <div className="slot-col">
            <div className="slot-head">
              <span className="slot-k" id="slot-kicker">
                The diary
              </span>
              <h2 className="slot-day empty" id="slot-day">
                Pick a day to begin.
              </h2>
            </div>

            <div className="slot-body">
              {/* step 2 — start time */}
              <fieldset className="sblock" id="step-time" hidden>
                <legend className="sblock-h">Start time</legend>
                <div
                  className="times"
                  id="pick-times"
                  aria-label="Available start times"
                ></div>
              </fieldset>

              {/* step 3 — length */}
              <fieldset className="sblock" id="step-length" hidden>
                <legend className="sblock-h">How long</legend>
                <div className="length">
                  <div
                    className="presets"
                    id="pick-presets"
                    role="group"
                    aria-label="Common lengths"
                  ></div>
                  <div className="stepper">
                    <button
                      type="button"
                      className="lstep"
                      id="len-minus"
                      aria-label="One hour shorter"
                    >
                      −
                    </button>
                    <div className="lread">
                      <span className="lspan" id="len-span">
                        —
                      </span>
                      <span className="lmeta" id="len-meta">
                        whole hours · one-hour minimum
                      </span>
                    </div>
                    <button
                      type="button"
                      className="lstep"
                      id="len-plus"
                      aria-label="One hour longer"
                    >
                      +
                    </button>
                  </div>
                  <p className="len-note" id="len-note" hidden>
                    Eight hours is the longest single booking. For a full
                    day-plus or a block booking,{" "}
                    <a href="mailto:hello@studioone.room?subject=Block%20booking%20%E2%80%94%20StudioONE">
                      message the studio
                    </a>
                    .
                  </p>
                </div>
              </fieldset>

              {/* step 4 — your details + bank transfer */}
              <fieldset className="sblock" id="step-pay" hidden>
                <legend className="sblock-h">Your details &amp; payment</legend>
                <div className="bfields">
                  <div className="bfield">
                    <label htmlFor="bk-name">Name</label>
                    <input
                      id="bk-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Who's the booking for?"
                      required
                    />
                  </div>
                  <div className="bfield">
                    <label htmlFor="bk-email">Email</label>
                    <input
                      id="bk-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="Where your code should land"
                      required
                    />
                  </div>
                </div>
                <div className="pay">
                  <dl className="bacs">
                    <div className="bacs-h">
                      <span>Pay by bank transfer</span>
                      {config.bacs.demo ? (
                        <span className="demo">Demo details</span>
                      ) : null}
                    </div>
                    <div className="bacs-row">
                      <dt>Account name</dt>
                      <dd>{config.bacs.accountName}</dd>
                    </div>
                    <div className="bacs-row">
                      <dt>Sort code</dt>
                      <dd>{config.bacs.sortCode}</dd>
                    </div>
                    <div className="bacs-row">
                      <dt>Account no.</dt>
                      <dd>{config.bacs.accountNo}</dd>
                    </div>
                    <div className="bacs-row ref">
                      <dt>Reference</dt>
                      <dd id="bacs-ref">—</dd>
                    </div>
                    <div className="bacs-row amt">
                      <dt>Amount</dt>
                      <dd id="bacs-amt">—</dd>
                    </div>
                  </dl>
                  <p className="pay-note">
                    Enter your name and email, then press reserve to hold the
                    slot. Your <strong>reference</strong> and these bank details
                    appear on the next screen — transfer the{" "}
                    <strong>exact amount</strong> with that reference, and the
                    door code is emailed once it clears.
                  </p>
                  <button
                    type="button"
                    className="btn pay-btn"
                    id="pay-confirm"
                    aria-disabled="true"
                  >
                    Reserve the room{" "}
                    <span className="ar" aria-hidden="true">
                      →
                    </span>
                  </button>
                </div>
              </fieldset>
            </div>

            <div className="bookbar">
              <div className="summary" id="summary">
                <span className="empty">Pick a day to begin.</span>
              </div>
              <div className="bact">
                <button
                  className="ghost"
                  type="button"
                  id="clear"
                  aria-disabled="true"
                >
                  Clear
                </button>
                <a
                  className="ghost"
                  id="message-host"
                  data-cur="Email"
                  href="mailto:hello@studioone.room?subject=Booking%20enquiry%20%E2%80%94%20StudioONE"
                >
                  Message
                </a>
                <button
                  className="btn"
                  type="button"
                  id="confirm"
                  aria-disabled="true"
                >
                  Continue to payment{" "}
                  <span className="ar" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="vh" id="book-live" role="status" aria-live="polite"></p>
    </>
  );
}
