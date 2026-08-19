-- =====================================================================
-- Cancellation: who cancelled, why, and what they are owed
-- =====================================================================
--
-- Step 7 of the pre-payment plan. Built now, deliberately, because the
-- booking half can be finished without a payment provider -- and when one
-- arrives it should find a refund entitlement already calculated rather
-- than have to invent the rules on the way past.
--
-- WHAT THIS DOES NOT DECIDE
-- The policy itself. How many hours before departure a guest gets a full
-- refund, and what they get after that, is a commercial and legal
-- decision -- Norwegian consumer law has a view, and so will the booking
-- terms the owner signs off. So the policy lives in a table you edit, not
-- in code, and it ships with a conservative default that is easy to change
-- and impossible to mistake for advice.
--
-- NO MONEY MOVES HERE. The entitlement is recorded; paying it out is a
-- separate act, and while no processor is connected that act is manual.
-- Recording an amount is not the same as refunding it, and the two are
-- kept visibly apart so nobody assumes a guest has been paid.
--
-- SAFE TO RUN.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. The record
-- ---------------------------------------------------------------------

alter table bookings add column if not exists cancelled_at timestamptz;
alter table bookings add column if not exists cancelled_by text;
alter table bookings add column if not exists cancellation_reason text;
-- What the policy said they were owed at the moment of cancelling.
-- Frozen on purpose: if the policy changes next season, an old
-- cancellation must not silently change what it promised.
alter table bookings add column if not exists refund_due numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_refund_due_check') then
    alter table bookings add constraint bookings_refund_due_check
      check (refund_due is null or refund_due >= 0);
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. The policy, as data
-- ---------------------------------------------------------------------
-- Read as: "cancelling at least N hours before departure returns P% of
-- what was paid." The most generous matching tier wins, so ordering the
-- rows wrongly cannot quietly cost a guest money.

create table if not exists cancellation_rules (
  id uuid primary key default gen_random_uuid(),
  min_hours_before integer not null check (min_hours_before >= 0),
  refund_percent numeric not null check (refund_percent >= 0 and refund_percent <= 100),
  -- Shown to the guest before they confirm.
  label text not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists cancellation_rules_hours_key
  on cancellation_rules (min_hours_before);

-- A conservative starting point, not a recommendation. Change these to
-- whatever the signed booking terms say.
insert into cancellation_rules (min_hours_before, refund_percent, label) values
  (48, 100, 'Free cancellation up to 48 hours before departure'),
  (24, 50,  'Cancel 24-48 hours before departure for a 50% refund'),
  (0,  0,   'No refund within 24 hours of departure')
on conflict (min_hours_before) do nothing;

alter table cancellation_rules enable row level security;

-- Public read: the guest has to be shown the policy before cancelling,
-- and prospective guests should be able to read it before booking.
drop policy if exists "anyone can read cancellation rules" on cancellation_rules;
create policy "anyone can read cancellation rules"
on cancellation_rules for select
to anon, authenticated
using (true);

drop policy if exists "admins can manage cancellation rules" on cancellation_rules;
create policy "admins can manage cancellation rules"
on cancellation_rules for all
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));


-- ---------------------------------------------------------------------
-- 3. What a given booking would get back, right now
-- ---------------------------------------------------------------------
-- Departure is the booking date plus its scheduled time when one exists.
-- A tour with no time is treated as departing at the end of that day,
-- which is the reading that favours the guest -- and for a Northern
-- Lights chase it also happens to be true.

create or replace function refund_entitlement(p_booking_id uuid, p_at timestamptz default now())
returns table (refund numeric, percent numeric, label text, hours_before numeric)
language plpgsql
stable
as $fn$
declare
  v_price     numeric;
  v_date      date;
  v_time      time;
  v_departure timestamptz;
  v_hours     numeric;
begin
  select total_price, booking_date, scheduled_time
    into v_price, v_date, v_time
  from bookings
  where id = p_booking_id;

  if v_price is null then
    return;
  end if;

  v_departure := ((v_date + coalesce(v_time, time '23:59')) at time zone 'Europe/Oslo');
  v_hours := extract(epoch from (v_departure - p_at)) / 3600;

  -- Already departed: no tier applies, and nothing is owed by policy.
  if v_hours < 0 then
    v_hours := 0;
  end if;

  return query
    select round(v_price * r.refund_percent / 100, 2),
           r.refund_percent,
           r.label,
           v_hours
    from cancellation_rules r
    where r.min_hours_before <= v_hours
    -- Most generous matching tier, so row order cannot cost a guest money.
    order by r.refund_percent desc
    limit 1;
end $fn$;


-- ---------------------------------------------------------------------
-- 4. Stamp it when it happens
-- ---------------------------------------------------------------------
-- Runs after the lifecycle trigger has already decided the move is legal.
-- Named to sort after trg_enforce_booking_status_transition so it never
-- records a cancellation that was then rejected.

create or replace function stamp_booking_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor  text;
  v_refund numeric;
begin
  if new.status <> 'cancelled' or old.status = 'cancelled' then
    return new;
  end if;

  select display_name into v_actor from staff_profiles where id = auth.uid();
  new.cancelled_by := coalesce(v_actor, auth.jwt() ->> 'email', 'guest');
  new.cancelled_at := now();

  -- Frozen at cancellation time. A later policy change must not rewrite
  -- what an old cancellation promised.
  if new.refund_due is null then
    select refund into v_refund from refund_entitlement(new.id) limit 1;
    new.refund_due := coalesce(v_refund, 0);
  end if;

  return new;
end $fn$;

drop trigger if exists trg_z_stamp_booking_cancellation on bookings;
create trigger trg_z_stamp_booking_cancellation
before update of status on bookings
for each row
execute function stamp_booking_cancellation();


-- ---------------------------------------------------------------------
-- 5. A guest may cancel their own booking
-- ---------------------------------------------------------------------
-- The lifecycle trigger already restricts a non-staff caller to the
-- cancelled state. This is the RLS half: which rows they may touch at all.
-- Without it a guest can read their booking but not act on it.

drop policy if exists "customers can cancel their own bookings" on bookings;
create policy "customers can cancel their own bookings"
on bookings for update
to authenticated
using (auth.jwt() ->> 'email' = customer_email)
with check (auth.jwt() ->> 'email' = customer_email);


-- =====================================================================
-- VERIFY
-- =====================================================================
-- a) The policy as a guest would read it:
--      select min_hours_before, refund_percent, label
--      from cancellation_rules order by min_hours_before desc;
--
-- b) What a real booking would get back if cancelled now:
--      select b.item_title, b.booking_date, b.total_price, e.*
--      from bookings b
--      cross join lateral refund_entitlement(b.id) e
--      where b.status in ('pending','confirmed','assigned')
--      order by b.booking_date limit 10;
--
-- c) Cancel one and confirm it was stamped:
--      update bookings set status = 'cancelled',
--             cancellation_reason = 'testing'
--      where id = (select id from bookings where status = 'confirmed' limit 1);
--
--      select cancelled_at, cancelled_by, cancellation_reason, refund_due
--      from bookings where status = 'cancelled'
--      order by cancelled_at desc limit 1;
--
-- d) Confirm the seat came back -- capacity counts only open statuses, so
--    a cancelled booking should no longer appear here:
--      select item_title, booking_date, sum(party_size)
--      from bookings where booking_occupies_seat(status)
--      group by 1,2 order by 2 desc limit 5;
-- =====================================================================
