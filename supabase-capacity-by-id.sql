-- =====================================================================
-- Capacity: match on the tour's id, not on its name
-- =====================================================================
--
-- WHY THIS IS NEEDED
-- Capacity currently finds a tour by comparing strings:
--
--   where t.title = new.item_title or new.item_title like t.title || '%'
--
-- That works until the two strings drift, and they already have. The
-- catalogue holds:
--
--   'Northern Lights Tour – Private Group'      (en dash)
--
-- while real bookings in the table carry:
--
--   'Northern Lights (Private Group)'           (parentheses)
--
-- Neither test matches, so those bookings were silently exempt from the
-- seat limit. Nothing errored -- capacity just quietly did not apply,
-- which is the worst way for a safety check to fail.
--
-- The fix is to stop guessing. The booking form already knows the tour's
-- id (it uses it to attach add-ons), so the booking can simply carry it.
--
-- The title match is kept as a fallback for rows created before this, and
-- for the taxi console, which books fleet classes rather than catalogue
-- tours. It is no longer the primary path.
--
-- SAFE TO RUN. Existing rows get a null tour_id and keep behaving exactly
-- as they do today.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. The link
-- ---------------------------------------------------------------------
-- on delete set null, not cascade: deleting a tour from the catalogue
-- must never delete the bookings people made for it.

alter table bookings add column if not exists tour_id uuid references tours(id) on delete set null;

create index if not exists bookings_tour_date_idx
  on bookings (tour_id, booking_date)
  where status in ('pending', 'confirmed', 'assigned', 'in_progress', 'completed');


-- ---------------------------------------------------------------------
-- 2. Count seats by id when we have one
-- ---------------------------------------------------------------------

create or replace function seats_taken_for_tour(
  p_tour_id uuid,
  p_item_title text,
  p_date date,
  p_exclude_id uuid default null
)
returns integer
language sql
stable
as $fn$
  select coalesce(sum(party_size), 0)::int
  from bookings b
  where b.booking_date = p_date
    and booking_occupies_seat(b.status)
    and (p_exclude_id is null or b.id <> p_exclude_id)
    and (
      -- Preferred: both rows name the same tour by id.
      (p_tour_id is not null and b.tour_id = p_tour_id)
      -- Fallback for rows written before tour_id existed. Scoped to rows
      -- that have no id of their own, so a booking with a *different*
      -- tour_id can never be counted against this tour by name collision.
      or (b.tour_id is null and p_item_title is not null and b.item_title = p_item_title)
    );
$fn$;


-- ---------------------------------------------------------------------
-- 3. Enforcement, now id-first
-- ---------------------------------------------------------------------

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
  v_lock_key  text;
begin
  if not booking_occupies_seat(new.status) then
    return new;
  end if;

  if new.tour_id is not null then
    select capacity, exclusive into v_capacity, v_exclusive
    from tours where id = new.tour_id;
    v_lock_key := new.tour_id::text;
  else
    -- Legacy path: name matching, kept only for callers that cannot
    -- supply an id (older forms, and the taxi console, which books fleet
    -- classes rather than catalogue tours).
    select capacity, exclusive into v_capacity, v_exclusive
    from tours
    where title = new.item_title or new.item_title like title || '%'
    limit 1;
    v_lock_key := coalesce(new.item_title, '');
  end if;

  -- Unknown tour, or capacity not configured: nothing to enforce.
  if v_capacity is null then
    return new;
  end if;

  -- Serialise everyone competing for this tour on this date, and only
  -- them. Keyed on the id when there is one, so two spellings of the same
  -- tour can no longer take two different locks and both pass.
  perform pg_advisory_xact_lock(hashtext(v_lock_key || '|' || new.booking_date::text));

  v_taken := seats_taken_for_tour(new.tour_id, new.item_title, new.booking_date, new.id);

  if v_exclusive then
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

drop trigger if exists trg_enforce_booking_capacity on bookings;
create trigger trg_enforce_booking_capacity
before insert or update of status, booking_date, party_size, item_title, tour_id on bookings
for each row
execute function enforce_booking_capacity();


-- ---------------------------------------------------------------------
-- 4. Availability by id, for the booking form
-- ---------------------------------------------------------------------

create or replace function tour_availability_by_id(p_tour_id uuid, p_date date)
returns table (capacity integer, taken integer, free integer, is_exclusive boolean)
language sql
stable
as $fn$
  select t.capacity,
         seats_taken_for_tour(t.id, t.title, p_date) as taken,
         case when t.capacity is null then null
              else greatest(t.capacity - seats_taken_for_tour(t.id, t.title, p_date), 0) end as free,
         t.exclusive
  from tours t
  where t.id = p_tour_id;
$fn$;


-- =====================================================================
-- OPTIONAL: attach existing bookings to their tour
-- =====================================================================
-- Only run these if the mapping looks right to you. Check first:
--
--   select item_title, count(*) from bookings
--   where tour_id is null group by 1 order by 2 desc;
--
-- Then, for the ones you recognise:
--
--   update bookings b set tour_id = t.id from tours t
--   where b.tour_id is null and t.slug = 'northern-lights-private-group'
--     and b.item_title = 'Northern Lights (Private Group)';
--
--   update bookings b set tour_id = t.id from tours t
--   where b.tour_id is null and t.slug = 'sommaroya-tour'
--     and b.item_title like 'Sommarøya Tour%';
--
--   update bookings b set tour_id = t.id from tours t
--   where b.tour_id is null and t.slug = 'northern-lights-per-person'
--     and b.item_title = t.title;
--
-- Taxi bookings ('Small Fleet', 'Large Fleet', 'Small Transfer') are not
-- catalogue tours and should keep a null tour_id.
--
-- =====================================================================
-- VERIFY
-- =====================================================================
--   select t.slug, t.capacity, t.exclusive,
--          a.taken, a.free
--   from tours t
--   cross join lateral tour_availability_by_id(t.id, current_date + 7) a
--   order by t.slug;
--
-- Then prove it refuses an overfill on a tour with a small capacity.
-- =====================================================================
