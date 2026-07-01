# Testing StudioONE — a walk-through

**Who this is for:** you, the studio owner. No technical knowledge needed.
Just follow the steps in order and tick each box.

**What this does:** it takes you through *every* part of the site — booking a
room, taking payment details, confirming bookings, editing your content,
opening hours, prices and settings — using **Testing mode**, a safe sandbox.
Anything you do while Testing mode is on gets **wiped clean** when you turn it
off, so you can't break anything or leave a fake booking in your real diary.

---

## The one thing to understand first

StudioONE has a built-in **Testing mode**. Think of it as a rehearsal room:

- **When it's ON:** the public site works exactly as normal, but a strip
  appears along the bottom of every page saying *"Testing mode — bookings &
  edits here are not live and will be reset."* Any bookings you make or content
  you change are temporary.
- **When you turn it OFF:** the site puts everything back exactly how it was
  before you started, and **deletes every booking you made during the test**.
  Your real content, prices and settings are untouched.

Two things are **not** wiped, on purpose:

1. **Emails still send.** This is deliberate — it's the only way to check the
   guest and studio emails actually arrive and read correctly. Use your own
   email address(es) when testing so you receive them.
2. **Your login and any photos you uploaded** stay put.

> ⚠️ **Golden rule:** only test while Testing mode is ON. You'll always see the
> bottom strip on the public site and a **"● Testing mode is live"** note in the
> admin sidebar. If you don't see those, you're on the *real* site — stop and
> turn Testing mode on first.

---

## Before you start — what you'll need

- [ ] The web address of your site (the public page) and the admin address,
      which is that same address with **`/admin`** on the end.
- [ ] Your **owner** email and password (the ones used to set the site up).
      Testing mode is owner-only — a sub-admin can't see it.
- [ ] Access to an email inbox you can check — ideally the same address you'll
      type in as the "guest" so you can read the booking emails.
- [ ] **Two windows open side by side** makes this much easier:
  - one on the **public site** (where you act as a customer), and
  - one on **`/admin`** (where you act as the studio).
  - Tip: in the admin sidebar there's a **"View site ↗"** link that opens the
    public site in a new tab.
- [ ] Set aside about **20–30 minutes** to go through it all once.

---

## Step 1 — Turn Testing mode ON

1. Go to your admin address (**`/admin`**) and sign in as the owner.
2. You'll land on the dashboard ("The front desk").
3. Scroll down to the **Testing mode** box.
4. Click **"Turn on testing mode."**

**✅ What you should see:**
- [ ] The box now says **"Testing mode is ON"** with the date/time it started.
- [ ] The admin sidebar shows a **"● Testing mode is live"** note near the top.
- [ ] Open the public site — a dark strip sits along the **bottom** of the page
      reading *"Testing mode — bookings & edits here are not live and will be
      reset."*

If you can see all three, you're safely in the sandbox. Everything from here is
pretend.

---

## Step 2 — Book a room as a customer (the main event)

Do this on the **public site**. Scroll down to the booking diary (the calendar).

### 2a. Pick a day
- [ ] The calendar shows roughly four weeks ahead. Each day has a little bar
      showing how full it is (**Open / Filling / Booked**).
- [ ] Click any open day. The panel on the right updates to that day.

### 2b. Pick a start time
- [ ] Start times appear grouped into **Morning / Afternoon / Evening**.
- [ ] Click a start time. A **"How long"** section appears.

### 2c. Choose how long
- [ ] Try the quick buttons — **1 hour, 2 hours, Half day, Full day** — and
      watch the price update.
- [ ] Try the **–** and **+** buttons to nudge the length by an hour.
- [ ] Check the price shown matches your rate card (you can adjust rates later
      in Step 6).

### 2d. Enter guest details
- [ ] Click **"Continue to payment."**
- [ ] Enter a **name** and **an email address you can check** (use your own).
- [ ] Notice the bank-transfer (BACS) panel and the amount.
- [ ] Click **"Reserve the room."**

**✅ What you should see:**
- [ ] A confirmation pop-up: *"Thanks, [name]. Almost there."*
- [ ] A **reference** (like `SO-AB12CD`), the **slot**, the **amount**, and your
      **bank details** (account name, sort code, account number).
- [ ] The calendar behind the pop-up now shows that slot as taken.

**✅ Check your email (the studio alert):**
- [ ] The studio alert address receives a *"new booking"* email with the guest's
      details and reference.
- [ ] **Important:** this studio email must **not** contain the door code.
      Confirm it doesn't.

> If no emails arrive at all, that usually means email sending isn't switched on
> yet (no email key configured). Note it down — it's a setup item, not a fault
> in the site. See the troubleshooting notes at the end.

---

## Step 3 — Confirm the booking as the studio

Now switch to the **admin** window. Go to **Bookings** in the sidebar.

- [ ] Your test booking appears with status **Pending**.
- [ ] Click the **Pending** filter chip at the top — the booking shows there,
      and the count matches.

**Confirm it (this is what you'd do once a real transfer lands):**
- [ ] Click **"Confirm & email code."**

**✅ What you should see:**
- [ ] The booking's status changes to **Confirmed**, and it's now marked
      *"code sent."*
- [ ] The **guest** email address receives the **door code** email. Open it and
      check the code and wording read correctly.
- [ ] Back on the dashboard, the **"In today" / "Next 7 days" / "Upcoming"**
      counts reflect the confirmed booking (if the date falls in those windows).

**Try the other buttons (all safe in testing):**
- [ ] **"Resend code"** on a confirmed booking — the guest gets the door-code
      email again.
- [ ] **"Cancel"** on a booking — its status becomes **Cancelled** and the slot
      is freed up again (check the public calendar shows it open once more).

---

## Step 4 — Blocks and Holds (closing time off)

These let you close the studio for one-offs (**Blocks**) or every week
(**Holds**) — for cleaning, your own sessions, days off, etc.

### Blocks (a one-off closure)
- [ ] Go to **Blocks & holds** → add a **Block** for a specific date and time.
- [ ] Check the public calendar: those hours now show as unavailable.

### Holds (a weekly recurring closure)
- [ ] Add a **Hold** for, say, every Monday morning.
- [ ] Check the public calendar: Monday mornings show unavailable across the
      weeks shown.

- [ ] Delete the block and hold again and confirm the slots reopen.

---

## Step 5 — Opening hours & booking rules

Go to **Opening hours** in the sidebar.

- [ ] Change the **open** and/or **close** time, save, then check the public
      calendar only offers slots inside those hours.
- [ ] Try the booking-window rules and see the effect on the public diary:
  - **Minimum / maximum** booking length (shortest and longest a guest can
    book).
  - **Changeover buffer** (a gap kept between bookings).
  - **Days ahead** (how far in advance guests can book).
  - **Hold expiry** (how long an unpaid booking is held before it lapses).
- [ ] Put anything you changed back to how you'd want it live (or don't worry —
      Step 8 resets it all anyway).

---

## Step 6 — Prices

Go to **Pricing** in the sidebar.

- [ ] Change a rate (for example the 1-hour or full-day price) and save.
- [ ] Go back to the public booking diary and confirm the new price shows when
      you pick that length.

---

## Step 7 — Content, Lists, Settings (the words and details)

This is where you edit everything the public site says.

### Content & Lists
- [ ] Go to **Content** and change some visible text (a heading or paragraph).
      Save, then refresh the public site and confirm the new wording shows.
- [ ] Go to **Lists** and try adding, removing, and reordering an item in one of
      the lists. Check the public site reflects it.

### Settings
- [ ] Go to **Settings** and review:
  - **Bank (BACS) details** — the account guests pay into. If it's marked as
    **"Demo details,"** that's the placeholder; you'll enter the real account
    and uncheck the demo flag when you go live.
  - **Door code** — the code emailed to confirmed guests.
  - **Studio alert email(s)** — where new-booking alerts are sent.
  - **Contact details and map.**
- [ ] Make a small change, save, and check it shows where expected (e.g. the
      BACS details in the booking pop-up).

### Team (optional)
- [ ] If you'll have helpers, go to **Team** and add a **sub-admin**. Note that a
      sub-admin can manage the diary (bookings, blocks, holds, hours, prices) but
      **cannot** see content, settings, the team, or Testing mode. You can remove
      them again here.

---

## Step 8 — Turn Testing mode OFF and confirm the clean-up

This is the important safety check — proving the reset really works.

Before you turn it off, jot down what you changed so you can verify it reverts:
- a booking you made (note its reference),
- a piece of content you edited,
- a price or opening hour you changed.

Now:
1. Go back to the **admin dashboard**.
2. In the **Testing mode** box (now showing "Testing mode is ON"), click
   **"Turn off & reset."**

**✅ What you should see:**
- [ ] The bottom strip disappears from the public site.
- [ ] The **"● Testing mode is live"** note is gone from the admin sidebar.
- [ ] The **content, lists, opening hours, blocks and holds** you changed are
      back exactly as they were before Step 1.
- [ ] Go to **Bookings** — the test booking(s) you made are **gone** (the counts
      are back to normal).

If all of those check out, Testing mode is doing its job: you rehearsed the
whole thing and left no trace.

> **Note:** the "Reset to defaults" box on the dashboard is a *different* tool —
> it restores the original site *wording and lists* to the starting copy. It
> does **not** touch bookings, prices or settings. You don't need it for this
> walk-through.

---

## Quick reference — what gets wiped vs. kept

| When you turn Testing mode OFF… | What happens |
| --- | --- |
| Bookings made during the test | **Deleted** |
| Content / lists you edited | **Restored** to how they were before |
| Opening hours, blocks, holds | **Restored** to how they were before |
| Prices / BACS / settings changed during the test | **Restored** to how they were before |
| Emails that were sent during the test | Already sent (can't be unsent) |
| Your login | **Kept** |
| Photos you uploaded | **Kept** |

---

## If something doesn't look right

- **No emails arriving.** Email sending needs an email service key configured in
  the site's setup. Without it, emails are logged rather than sent — the booking
  still works, you just won't receive the messages. This is a go-live setup item.
- **"Demo details" on the bank panel.** That's expected until you enter your real
  bank account in **Settings** and uncheck the demo flag.
- **A day shows fully booked unexpectedly.** Check **Blocks & holds** and
  **Opening hours** — a block, a weekly hold, or narrow opening hours can remove
  slots.
- **You can't see Testing mode.** You're probably signed in as a sub-admin.
  Testing mode is owner-only — sign in with the owner account.
- **You're not sure whether you're testing or live.** Look for the bottom strip
  on the public site and the "Testing mode is live" note in the admin sidebar.
  No strip = you're on the real site.

---

*Work through this once and you'll have seen every part of the site end to end.
Anything you're unsure about after that is worth a note back to whoever set the
site up.*
