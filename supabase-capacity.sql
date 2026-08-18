-- =====================================================================
-- Capacity: stop the same night being sold twice
-- =====================================================================
--
-- Step 2 of the pre-payment plan. It comes before payment deliberately:
-- today a double booking costs an apologetic phone call, but once money
-- is moving it costs a refund and a review.
--
-- WHAT WAS MISSING
-- Nothing anywhere counted seats. `bookings` did not even record how many
-- people were coming, so "is this tour full?" was not a question the data
-- could answer.
--
-- TWO SALES MODELS, ONE MECHANISM
-- The catalogue sells both ways:
--   per-person   2,250 kr each  -- seats shared, 2+3+3 across bookings
--   private      15,000 kr flat -- one booking takes the whole night
-- A single rule cannot express both, so tours carry a seat count AND an
-- `exclusive` flag. Exclusive tours are simply ones where the first
-- booking consumes every seat.
--
-- SAFE TO RUN. Existing bookings get party_size = 1 and every tour starts
-- with capacity NULL, which means "unlimited" -- so nothing is rejected
-- until you set a real number in the Tour Catalog.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. How many people, and how many fit
-- ---------------------------------------------------------------------

alter table bookings add column if not exists party_size integer not null default 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_party_size_check') then
    alter table bookings add constraint bookings_party_size_check
      check (party_size >= 1 and party_size <= 60);
  end if;
end $$;

-- NULL capacity means unlimited. That is the safe default for a table
-- that already has rows: nothing starts being rejected the moment this
-- script runs, and you opt each tour in when you know its real number.
alter table tours add column if not exists capacity integer;
alter table tours add column if not exists exclusive boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tours_capacity_check') then
    alter table tours add constraint tours_capacity_check
      check (capacity is null or (capacity >= 1 and capacity <= 200));
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Which bookings occupy a seat
-- ---------------------------------------------------------------------
-- Cancelled and no-show release their seats. That is the whole
-- cancellation-frees-capacity requirement -- it needs no separate job,
-- because the count is derived rather than stored. A stored counter would
-- need every path that changes a status to remember to decrement it, and
-- one that forgets is a seat lost forever.

create or replace function booking_occupies_seat(p_status text)
returns boolean
language sql
immutable
as $fn$
  select p_status in ('pending', 'confirmed', 'assigned', 'in_progress', 'completed');
$fn$;

create or replace function seats_taken(p_item_title text, p_date date, p_exclude_id uuid default null)
returns integer
language sql
stable
as $fn$
  select coalesce(sum(party_size), 0)::int
  from bookings
  where item_title = p_item_title
    and booking_date = p_date
    and booking_occupies_seat(status)
    and (p_exclude_id is null or id <> p_exclude_id);
$fn$;

-- Bookings reference a tour by its title, not by id -- that is how the
-- existing insert paths work. Matching on title keeps this migration from
-- rewriting every booking form at the same time as adding capacity.
create index if not exists bookings_capacity_lookup_idx
  on bookings (item_title, booking_date)
  where status in ('pending', 'confirmed', 'assigned', 'in_progress', 'completed');


-- ---------------------------------------------------------------------
-- 3. Enforce it, safely under concurrency
-- ---------------------------------------------------------------------
-- The naive version -- count, compare, insert -- is a race. Two guests
-- clicking at the same moment both read "1 seat left" and both get it.
--
-- pg_advisory_xact_lock serialises inserts for the same tour on the same
-- date, and only those: two different tours, or the same tour on two
-- dates, never wait for each other. The lock releases when the
-- transaction ends, whether it commits or rolls back.

create or replace function enforce_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_capacity  integer;
  v_exclusive boolean;
  v_taken     integer;
  v_free      integer;
begin
  -- A booking that is not taking a seat cannot overfill anything.
  if not booking_occupies_seat(new.status) then
    return new;
  end if;

  select capacity, exclusive
    into v_capacity, v_exclusive
  from tours
  where title = new.item_title
     or new.item_title like title || '%';

  -- Unknown tour, or capacity not configured: nothing to enforce. Taxi
  -- transfers land here too, and they are limited by drivers rather than
  -- by seats -- that is a separate problem, deliberately not solved here.
  if v_capacity is null then
    return new;
  end if;

  -- Serialise everyone competing for this tour on this date.
  perform pg_advisory_xact_lock(hashtext(new.item_title || '|' || new.booking_date::text));

  v_taken := seats_taken(new.item_title, new.booking_date, new.id);

  if v_exclusive then
    -- One booking owns the night. Any existing seat blocks a second one.
    if v_taken > 0 then
      raise exception 'This tour is already booked for %', new.booking_date
        using errcode = 'check_violation';
    end if;
    if new.party_size > v_capacity then
      raise exception 'This tour takes up to % guests', v_capacity
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  v_free := v_capacity - v_taken;
  if new.party_size > v_free then
    if v_free <= 0 then
      raise exception 'This tour is fully booked for %', new.booking_date
        using errcode = 'check_violation';
    end if;
    raise exception 'Only % seat(s) left for %', v_free, new.booking_date
      using errcode = 'check_violation';
  end if;

  return new;
end $fn$;

-- Fires on insert, and on the updates that could newly consume seats:
-- reviving a cancelled booking, moving it to another date, or growing the
-- party. Status changes that release seats need no check.
drop trigger if exists trg_enforce_booking_capacity on bookings;
create trigger trg_enforce_booking_capacity
before insert or update of status, booking_date, party_size, item_title on bookings
for each row
execute function enforce_booking_capacity();


-- ---------------------------------------------------------------------
-- 4. Reading availability from the app
-- ---------------------------------------------------------------------
-- So the booking form can grey out a full date instead of letting a guest
-- fill everything in and then be refused.

create or replace function tour_availability(p_item_title text, p_date date)
returns table (capacity integer, taken integer, free integer, is_exclusive boolean)
language sql
stable
as $fn$
  select t.capacity,
         seats_taken(p_item_title, p_date) as taken,
         case when t.capacity is null then null
              else greatest(t.capacity - seats_taken(p_item_title, p_date), 0) end as free,
         t.exclusive
  from tours t
  where t.title = p_item_title or p_item_title like t.title || '%'
  limit 1;
$fn$;


-- =====================================================================
-- SET YOUR CAPACITIES
-- =====================================================================
-- Nothing is enforced until you do this. Adjust the numbers to the real
-- vehicles, then run:
--
--   update tours set capacity = 8,  exclusive = true
--     where slug = 'northern-lights-private-group';
--
--   update tours set capacity = 4,  exclusive = true
--     where slug = 'northern-lights-small-group';
--
--   update tours set capacity = 16, exclusive = false
--     where slug = 'northern-lights-per-person';
--
--   update tours set capacity = 16, exclusive = false
--     where slug = 'sommaroya-tour';
--
-- =====================================================================
-- VERIFY
-- =====================================================================
-- a) What is configured:
--      select slug, title, capacity, exclusive from tours order by slug;
--
-- b) Seats used on a given night:
--      select item_title, booking_date, sum(party_size) as seats
--      from bookings
--      where booking_occupies_seat(status)
--      group by 1, 2 order by 2 desc, 1;
--
-- c) Availability as the app will see it:
--      select * from tour_availability('Northern Lights (Per Person)', current_date + 7);
--
-- d) Prove it refuses an overfill. Pick a tour with a small capacity and
--    insert more than it holds -- this SHOULD fail with
--    "Only N seat(s) left" or "fully booked".
--
-- e) Prove cancelling frees the seat: cancel a booking, then re-run (b)
--    and confirm the count dropped.
-- =====================================================================
