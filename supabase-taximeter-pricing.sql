-- =====================================================================
-- Taximeter: per-minute rate, vehicle classes, and a server-side fare
-- =====================================================================
--
-- WHAT THIS IS FOR
-- You asked to control taxi pricing from the admin panel: opening fee,
-- per-kilometre rate, per-minute rate, and a multiplier per vehicle class
-- (Small 1-4 = 1x, Large 4-8 = 1.5x). This adds the pieces the database
-- needs for that.
--
-- ─────────────────────────────────────────────────────────────────────
-- SAFE TO RUN NOW. Running this changes NOTHING about how the site
-- behaves today:
--   * price_per_minute defaults to 0, so the fare formula is unchanged.
--   * The new fare trigger only fires when a booking arrives WITH a
--     distance, and nothing currently sends one.
-- So you can run it before I write the app code, and the site keeps
-- working exactly as it does now. The new rules take effect once the
-- taxi panel starts sending distances.
-- ─────────────────────────────────────────────────────────────────────
--
-- SAFE TO RE-RUN: every statement is guarded.
--
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Per-minute rate
-- ---------------------------------------------------------------------
-- Default 0 on purpose: a Tromso transfer is priced by distance today,
-- and switching on time-based charging is a pricing decision, not a
-- migration. Set it in the admin panel when you want it.

alter table pricing_rules
  add column if not exists price_per_minute numeric not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pricing_rules_sane_check') then
    alter table pricing_rules add constraint pricing_rules_sane_check check (
      base_fee >= 0 and base_fee <= 100000
      and price_per_km >= 0 and price_per_km <= 10000
      and price_per_minute >= 0 and price_per_minute <= 10000
      and night_rate_multiplier >= 1 and night_rate_multiplier <= 10
      and min_price >= 0 and min_price <= 100000
    );
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Vehicle classes
-- ---------------------------------------------------------------------
-- These live in a table rather than as two more columns on pricing_rules
-- so you can rename them, change capacities, reorder them or add a third
-- class from the admin panel without another migration.
--
-- This also retires a real problem: the two classes are currently hard
-- coded in the website's code with flat prices (490 / 890 kr). That is the
-- same pattern that let the per-person tour price drift to 2,000 kr after
-- the real price had moved to 2,250 kr. Once this table is live, the
-- website reads from it and there is one place to change a number.

create table if not exists fleet_classes (
  id uuid primary key default gen_random_uuid(),
  -- Stable identifier used in code and stored on bookings. Do not rename
  -- an existing code -- change the label instead.
  code text unique not null,
  label text not null,
  capacity_hint text not null,
  multiplier numeric not null default 1 check (multiplier > 0 and multiplier <= 10),
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Seeded from what the site offers today. `on conflict do nothing` means
-- re-running never overwrites multipliers you have since edited.
insert into fleet_classes (code, label, capacity_hint, multiplier, sort_order)
values
  ('small', 'Small', '1-4', 1.0, 1),
  ('large', 'Large', '4-8', 1.5, 2)
on conflict (code) do nothing;

alter table fleet_classes enable row level security;

-- Anyone can read them: the booking form has to show the options and
-- price them before the guest has an account.
drop policy if exists "anyone can view active fleet classes" on fleet_classes;
create policy "anyone can view active fleet classes"
on fleet_classes for select
to anon, authenticated
using (true);

drop policy if exists "admins can manage fleet classes" on fleet_classes;
create policy "admins can manage fleet classes"
on fleet_classes for all
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));


-- ---------------------------------------------------------------------
-- 3. Route facts on the booking
-- ---------------------------------------------------------------------
-- Storing what the fare was calculated from, so a disputed price can be
-- explained later instead of argued about.

alter table bookings add column if not exists distance_km numeric;
alter table bookings add column if not exists duration_minutes integer;
alter table bookings add column if not exists fleet_class text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_route_facts_check') then
    alter table bookings add constraint bookings_route_facts_check check (
      (distance_km is null or (distance_km >= 0 and distance_km <= 2000))
      and (duration_minutes is null or (duration_minutes >= 0 and duration_minutes <= 2880))
    );
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 4. The fare formula, in one place
-- ---------------------------------------------------------------------
--   fare = (base_fee + km x price_per_km + min x price_per_minute)
--          x night_multiplier
--          x fleet_multiplier
--   total = max(min_price x fleet_multiplier, round(fare))
--
-- The minimum scales with the vehicle class too. Otherwise a two-minute
-- Large booking would cost exactly the same as a two-minute Small one,
-- which makes the 1.5x look arbitrary to the guest.
--
-- NIGHT / WEEKEND IS DECIDED IN TROMSO TIME, not the guest's. That is a
-- deliberate change from the browser-side calculation: a guest whose
-- phone is set to another timezone should not be able to miss the night
-- rate for a car that is driving here at 02:00.

create or replace function calculate_transfer_fare(
  p_distance_km numeric,
  p_duration_minutes numeric default 0,
  p_fleet_class text default null,
  p_at timestamptz default now()
) returns numeric
language plpgsql
stable
as $$
declare
  v_rules       pricing_rules%rowtype;
  v_fleet_mult  numeric := 1;
  v_local       timestamp;
  v_night       boolean;
  v_multiplier  numeric := 1;
  v_raw         numeric;
begin
  select * into v_rules from pricing_rules limit 1;
  if not found then
    return null;  -- no rules configured; caller decides what to do
  end if;

  if p_fleet_class is not null then
    select multiplier into v_fleet_mult
    from fleet_classes
    where code = p_fleet_class and active;
    if not found then
      v_fleet_mult := 1;
    end if;
  end if;

  v_local := p_at at time zone 'Europe/Oslo';
  v_night := extract(hour from v_local) >= 22
          or extract(hour from v_local) < 6
          or extract(isodow from v_local) in (6, 7);

  if v_night then
    v_multiplier := v_rules.night_rate_multiplier;
  end if;

  v_raw := (
    v_rules.base_fee
    + coalesce(p_distance_km, 0) * v_rules.price_per_km
    + coalesce(p_duration_minutes, 0) * v_rules.price_per_minute
  ) * v_multiplier * v_fleet_mult;

  return greatest(round(v_rules.min_price * v_fleet_mult), round(v_raw));
end $$;


-- ---------------------------------------------------------------------
-- 5. The browser does not get to decide the fare
-- ---------------------------------------------------------------------
-- Both the website and the app insert bookings with the public key, so a
-- total_price arriving from a browser is a suggestion, not a fact. When a
-- transfer arrives with a real distance, this recalculates the price from
-- YOUR admin settings and overwrites whatever was sent.
--
-- WHY THE NAME STARTS WITH trg_0_
-- Postgres fires BEFORE triggers in alphabetical order by trigger name.
-- Two others already run on this table:
--   trg_apply_loyalty_redemption  -- subtracts the guest's points discount
--   trg_resolve_booking_partner   -- computes the hotel's commission
-- Both operate on total_price, so the fare has to be settled before they
-- run. The leading 0 sorts this first. Renaming it will silently break
-- that order: points would be deducted and then overwritten.

create or replace function apply_transfer_fare()
returns trigger
language plpgsql
as $$
declare
  v_fare numeric;
begin
  -- Only priced routes. Tours, and taxi bookings without a calculated
  -- route, keep the price the app sent (still bounded by
  -- bookings_total_price_check).
  if new.booking_type not in ('transfer', 'taxi') or new.distance_km is null then
    return new;
  end if;

  v_fare := calculate_transfer_fare(
    new.distance_km,
    new.duration_minutes,
    new.fleet_class,
    coalesce(new.created_at, now())
  );

  if v_fare is not null then
    new.total_price := v_fare;
  end if;

  return new;
end $$;

drop trigger if exists trg_0_calculate_transfer_fare on bookings;
create trigger trg_0_calculate_transfer_fare
before insert on bookings
for each row
execute function apply_transfer_fare();


-- =====================================================================
-- VERIFY
-- =====================================================================
-- Run these after the script. Nothing here changes data.
--
-- a) Your current rates:
--
--   select base_fee, price_per_km, price_per_minute,
--          night_rate_multiplier, min_price
--   from pricing_rules;
--
-- b) Your vehicle classes:
--
--   select code, label, capacity_hint, multiplier, active
--   from fleet_classes order by sort_order;
--
-- c) Try the formula without creating a booking. A 12 km, 20 minute
--    trip, priced right now, for each class:
--
--   select code, label,
--          calculate_transfer_fare(12, 20, code) as fare_now
--   from fleet_classes order by sort_order;
--
-- d) Check the night rate is really applied in Tromso time. Compare a
--    Wednesday lunchtime with a Wednesday at 02:00:
--
--   select calculate_transfer_fare(12, 20, 'small', '2026-09-02 12:00+02') as day_fare,
--          calculate_transfer_fare(12, 20, 'small', '2026-09-02 02:00+02') as night_fare;
--
--    night_fare should be higher. If both are equal, night_rate_multiplier
--    is set to 1 -- check (a).
--
-- e) Confirm the trigger order is right (this one must be listed first):
--
--   select tgname from pg_trigger
--   where tgrelid = 'bookings'::regclass and not tgisinternal
--   order by tgname;
-- =====================================================================
