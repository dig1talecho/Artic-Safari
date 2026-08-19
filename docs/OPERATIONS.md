# Artic Safari — Operations Manual

For whoever is running the business day to day. No coding knowledge assumed.

Everything here is done from **articsafaritour.com/admin**, signed in with a
staff account, unless it says otherwise.

---

## Every day

### A booking comes in

New bookings arrive as **Awaiting confirmation**. They appear in the admin
panel by themselves — no refresh needed — and, for taxi jobs, on the drivers'
phones with a banner and a buzz.

1. Open **Transfers** (taxi) or **Tours & Activities**.
2. Check the date, the party size and the pickup address.
3. Use the **Move to…** dropdown on the row → **Confirmed**.

The dropdown only ever offers moves that are allowed from where the booking
currently is. If an option is missing, it is because that move is not legal —
not because the screen is broken.

### A driver takes a taxi job

Drivers do this themselves from the phone app. Tapping **Take this job** claims
it and moves the booking to **Driver assigned** in one step.

Two drivers tapping at the same second cannot both get it. The one who loses is
told so; nothing is silently overwritten.

### The trip happens

Move the booking to **On the way** when the driver sets off, then **Completed**
when it is done.

**Completed matters for the accounts.** The period report counts completed
trips as earned revenue and leaves everything else out, so a trip that never
gets marked completed never shows up as income.

### Somebody does not turn up

Move it to **No show**. Kept separate from both cancelled and completed on
purpose: whether you charge for it is your decision, and the accounting report
reports it on its own line rather than assuming.

---

## Cancellations and refunds

### A guest cancels

They can do it themselves from their account page. Before confirming, they are
shown exactly what they get back under your policy.

You will see the cancellation in the admin panel with the reason and the refund
owed, right under the price on that row.

### You cancel

Use the **Move to…** dropdown → **Cancelled**. The refund owed is calculated
from your policy and recorded automatically.

### Paying a refund back

1. Open **Finance & Payments**.
2. The **Refunds owed** panel lists everyone who cancelled, had already paid,
   and has not been paid back.
3. Send the money **by your normal method** — bank transfer, Vipps, however you
   normally do it.
4. Come back and press **Mark refunded**.

> **Mark refunded records that you sent it. It does not send it.**
> No payment system is connected to this site. The button is bookkeeping, not a
> transfer.

### Changing the cancellation policy

The current policy is in the database, not in the code. To change it, go to
Supabase → SQL Editor and run:

```sql
select min_hours_before, refund_percent, label
from cancellation_rules order by min_hours_before desc;
```

Then adjust a tier, for example making free cancellation 72 hours instead of 48:

```sql
update cancellation_rules
set min_hours_before = 72,
    label = 'Free cancellation up to 72 hours before departure'
where refund_percent = 100;
```

Ask before doing this if the booking terms have been published — the website
promises whatever these rows say.

---

## Prices and tours

### Change a taxi rate

**Admin → Taximeter.** Change any number and the table underneath immediately
shows what it does to real Tromsø routes, with the current live price struck
through next to the new one. Nothing changes on the website until you press
**Publish**.

Watch the warning about the minimum fare: if the minimum is high relative to the
per-kilometre rate, every short trip costs the same and the meter stops meaning
anything. The screen tells you the kilometre where that happens.

### Change a tour price, photo or description

**Admin → Tour Catalog.** Edits appear on the website immediately.

### Seats per tour

Also in **Tour Catalog**:

- **Seats per date** — how many people fit. Blank means unlimited.
- **Private** — tick it when one booking takes the whole night (a flat-rate
  private tour). Leave it off when seats are sold individually and different
  groups can share.

Once a number is set, the website will refuse a booking that would overfill the
night, and it does the counting in a way that two people booking at the same
second cannot both take the last seat.

Cancelling frees the seat again automatically.

### Change wording on the website

**Admin → Site Text.** Search for the sentence you want to change, edit it,
press Publish. Clearing a box puts the original wording back.

---

## Monthly, for the accountant

**Admin → Accounting.**

1. Pick the month, quarter or year.
2. Choose **Trip date** (revenue when the trip happened) or **Booking date**
   (when it was sold). Ask your accountant which one they want — it is their
   call, not the screen's.
3. Press **Export CSV** and send them the file.

The report separates four things and never adds them together for you:

| Section | Means |
|---|---|
| **Completed** | Trips that happened. Earned revenue. |
| **Committed** | Sold, not yet delivered. |
| **No-show** | Charge or write off — your accountant decides. |
| **Cancelled** | Never counted as revenue. |

The VAT box applies whatever percentage you type. **Confirm the rate with your
accountant** — Norwegian rates differ between passenger transport and other
services, and the site does not know which applies to you.

---

## When something is wrong

### The website is down

1. Check [vercel.com](https://vercel.com) → the project → Deployments. A failed
   deployment shows red.
2. Check [status.supabase.com](https://status.supabase.com) and
   [vercel-status.com](https://www.vercel-status.com).
3. If both are green and the site is still down, the last deployment probably
   broke it. In Vercel, open the previous working deployment and choose
   **Promote to Production** — that puts yesterday's version back while
   somebody looks at it.

### Bookings are not arriving

Test it yourself: make a booking on the site with your own email. Then check
Supabase → Table Editor → `bookings` for the row.

- **Row is there, admin panel is empty** → a display problem, bookings are safe.
- **No row** → check Supabase status first, then get a developer.

### Address search is not working

Address search uses a free outside service with no guarantee. If it stops, the
booking forms still work — guests can type an address by hand and it is still
saved and still opens in maps. Nothing is lost; it is just less convenient.

### A guest says a price is wrong

1. **Admin → Taximeter** to see the current rates.
2. Open the booking and check the recorded distance and vehicle class — the fare
   was calculated from those, by the database, not by the guest's browser.
3. **Finance & Payments** shows what was actually charged.

Prices cannot be changed by a guest. The website calculates a fare for display,
and the database recalculates it independently when the booking is saved.

### Somebody cancelled but the seat did not come back

It should be automatic. Check the tour still has a **Seats per date** number in
Tour Catalog — with capacity blank, nothing is counted at all.

---

## Accounts and where they live

Fill this in and keep a copy somewhere a trusted person could reach it if you
could not.

| What | Where | Who has access | Renews |
|---|---|---|---|
| Domain (articsafaritour.com) | | | Yearly |
| Vercel (hosts the website) | | | — |
| Supabase (database) | | | — |
| Apple Developer | | | Yearly, $99 |
| Google Play | | | One-time |
| Instagram | | | — |
| Business WhatsApp | +47 92 99 71 90 | | — |

---

## Yearly, so nothing expires quietly

| When | What | If skipped |
|---|---|---|
| Yearly | Rebuild the mobile app for new phone systems | Removed from the app stores |
| Yearly | Renew the domain | The website disappears |
| Yearly | Renew Apple Developer | The app disappears |
| Yearly | Check prices against competitors | Slowly falling behind |
| Quarterly | Test that a database backup restores | A backup nobody restored is a rumour |

---

## What this system does not do

Stated plainly so nobody is surprised:

- **It does not take payments.** Bookings are requests you confirm and collect
  for yourself.
- **It does not track drivers on a live map.** The screens exist; nothing sends
  a driver's position yet.
- **It does not notify a driver whose app is closed.** Alerts work while the app
  is open.
- **It does not email guests automatically.** Confirmations are sent by you.

---

*Last updated 19 August 2026. When something in this manual stops matching the
screens, the screens are right — fix the manual.*
