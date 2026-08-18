-- =====================================================================
-- Booking lifecycle: a real state machine
-- =====================================================================
--
-- WHY THIS ONE FIRST
-- Payment introduces states (awaiting payment, paid, failed, refunded).
-- Cancellation introduces more. Driver assignment introduces another. If
-- those get built before the lifecycle is defined, each invents its own
-- vocabulary and the second feature rewrites the first.
--
-- Today `status` is free text with a three-value CHECK, and both apps
-- assume 'pending' | 'confirmed' | 'cancelled' by convention. Nothing
-- stops a typo, and nothing stops a completed trip going back to pending.
--
-- TWO AXES, NOT ONE
-- Payment and fulfilment are independent timelines, so they get a column
-- each. Merged into one, only one of them is observable at a time:
--
--   paid, then the trip happens   -> 'completed' loses that it was paid
--   trip happened, then refunded  -> 'refunded' loses that it happened
--   cancelled before vs after payment -> indistinguishable
--   paid and a driver assigned    -> which one does the column hold?
--
-- That last case breaks the driver queue outright: it asks "is this
-- assigned?" and a payment value cannot answer.
--
-- Both columns are state machines here. Together they express the full
-- vocabulary -- pending, confirmed, payment_pending, paid,
-- driver_assigned, in_progress, completed, cancelled, refunded,
-- payment_failed -- without either one lying.
--
-- SAFE TO RUN. Every existing row already holds one of the three original
-- values, all of which remain valid. Nothing is rewritten.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. The vocabulary
-- ---------------------------------------------------------------------
--   pending      request received, not yet accepted by us
--   confirmed    accepted; the guest has a booking
--   assigned     a driver has taken it (transfers)
--   in_progress  driver en route, or the trip has started
--   completed    finished
--   cancelled    called off, by either side
--   no_show      guest did not appear
--
-- Deliberately small. Every extra state is another branch in every screen
-- that renders a badge, and another row in this file's rule table.

alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check check (
  status in ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'no_show')
);


-- ---------------------------------------------------------------------
-- 2. Which moves are legal
-- ---------------------------------------------------------------------
-- A table rather than a CASE block inside a function, so the rules can be
-- read, queried and changed without editing a function body -- and so the
-- admin panel can ask the database which buttons to show.

create table if not exists booking_status_transitions (
  from_status text not null,
  to_status   text not null,
  -- Some corrections are legitimate but should not be routine, so they
  -- are restricted to admins rather than forbidden outright.
  admin_only  boolean not null default false,
  primary key (from_status, to_status)
);

insert into booking_status_transitions (from_status, to_status, admin_only) values
  ('pending',     'confirmed',   false),
  ('pending',     'cancelled',   false),
  ('confirmed',   'assigned',    false),
  ('confirmed',   'in_progress', false),
  ('confirmed',   'completed',   false),
  ('confirmed',   'cancelled',   false),
  ('confirmed',   'no_show',     false),
  ('assigned',    'in_progress', false),
  ('assigned',    'confirmed',   false),
  ('assigned',    'cancelled',   false),
  ('assigned',    'no_show',     false),
  ('in_progress', 'completed',   false),
  ('in_progress', 'cancelled',   false),
  -- Terminal states. An admin can still correct a mistake, and the audit
  -- log records that they did.
  ('completed',   'confirmed',   true),
  ('completed',   'cancelled',   true),
  ('cancelled',   'pending',     true),
  ('cancelled',   'confirmed',   true),
  ('no_show',     'confirmed',   true),
  ('no_show',     'completed',   true)
on conflict (from_status, to_status) do nothing;

alter table booking_status_transitions enable row level security;

drop policy if exists "anyone can read transitions" on booking_status_transitions;
create policy "anyone can read transitions"
on booking_status_transitions for select
to anon, authenticated
using (true);


-- ---------------------------------------------------------------------
-- 3. Enforce it, and record it
-- ---------------------------------------------------------------------
-- One trigger does both jobs. Splitting them would allow a transition to
-- be logged that never happened, or to happen without being logged.

create or replace function enforce_booking_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor      text;
  v_is_admin   boolean;
  v_admin_only boolean;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select display_name, role = 'admin'
    into v_actor, v_is_admin
  from staff_profiles
  where id = auth.uid();

  -- No staff row means a guest or an anonymous caller. RLS already decides
  -- which rows they can touch at all; the only status change they may make
  -- is cancelling their own booking.
  if v_actor is null then
    if new.status <> 'cancelled' then
      raise exception 'Only staff can move a booking to %', new.status
        using errcode = 'check_violation';
    end if;
    v_actor := coalesce(auth.jwt() ->> 'email', 'guest');
    v_is_admin := false;
  end if;

  select admin_only into v_admin_only
  from booking_status_transitions
  where from_status = old.status and to_status = new.status;

  if v_admin_only is null then
    raise exception 'Cannot move a booking from % to %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  if v_admin_only and not coalesce(v_is_admin, false) then
    raise exception 'Only an admin can move a booking from % to %', old.status, new.status
      using errcode = 'insufficient_privilege';
  end if;

  insert into booking_audit_log (booking_id, changed_by, change_type, old_value, new_value)
  values (new.id, v_actor, 'status', old.status, new.status);

  return new;
end $fn$;

drop trigger if exists trg_enforce_booking_status_transition on bookings;
create trigger trg_enforce_booking_status_transition
before update of status on bookings
for each row
execute function enforce_booking_status_transition();


-- ---------------------------------------------------------------------
-- 4. The payment axis
-- ---------------------------------------------------------------------
-- Same treatment, second column. 'failed' is new: without it a declined
-- card is indistinguishable from one that was never attempted, and the
-- guest gets chased for money they already tried to pay.

alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check check (
  payment_status in ('pending', 'processing', 'paid', 'failed', 'refunded')
);

create table if not exists booking_payment_transitions (
  from_status text not null,
  to_status   text not null,
  admin_only  boolean not null default false,
  primary key (from_status, to_status)
);

insert into booking_payment_transitions (from_status, to_status, admin_only) values
  ('pending',    'processing', false),
  ('pending',    'paid',       false),   -- cash or bank transfer, marked by staff
  ('processing', 'paid',       false),
  ('processing', 'failed',     false),
  ('failed',     'processing', false),   -- guest tries again
  ('failed',     'paid',       false),
  ('paid',       'refunded',   false),
  -- Corrections only.
  ('refunded',   'paid',       true),
  ('paid',       'pending',    true)
on conflict (from_status, to_status) do nothing;

alter table booking_payment_transitions enable row level security;

drop policy if exists "anyone can read payment transitions" on booking_payment_transitions;
create policy "anyone can read payment transitions"
on booking_payment_transitions for select
to anon, authenticated
using (true);

create or replace function enforce_booking_payment_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_actor      text;
  v_is_admin   boolean;
  v_admin_only boolean;
begin
  if new.payment_status is not distinct from old.payment_status then
    return new;
  end if;

  select display_name, role = 'admin'
    into v_actor, v_is_admin
  from staff_profiles
  where id = auth.uid();

  -- A guest may never move money themselves. When a payment provider is
  -- connected, its webhook will run as a trusted server role -- not as
  -- the browser that just clicked Pay.
  if v_actor is null then
    raise exception 'Only staff or a payment provider may change payment status'
      using errcode = 'insufficient_privilege';
  end if;

  select admin_only into v_admin_only
  from booking_payment_transitions
  where from_status = coalesce(old.payment_status, 'pending')
    and to_status = new.payment_status;

  if v_admin_only is null then
    raise exception 'Cannot move payment from % to %',
      coalesce(old.payment_status, 'pending'), new.payment_status
      using errcode = 'check_violation';
  end if;

  if v_admin_only and not coalesce(v_is_admin, false) then
    raise exception 'Only an admin can move payment from % to %',
      old.payment_status, new.payment_status
      using errcode = 'insufficient_privilege';
  end if;

  insert into booking_audit_log (booking_id, changed_by, change_type, old_value, new_value)
  values (new.id, v_actor, 'payment_status', old.payment_status, new.payment_status);

  return new;
end $fn$;

drop trigger if exists trg_enforce_booking_payment_transition on bookings;
create trigger trg_enforce_booking_payment_transition
before update of payment_status on bookings
for each row
execute function enforce_booking_payment_transition();


-- =====================================================================
-- VERIFY
-- =====================================================================
-- a) Existing data. Every value must already be in the new list, or the
--    constraint in step 1 would have refused to apply:
--
--      select status, count(*) from bookings group by 1 order by 2 desc;
--
-- b) The rules, as a readable matrix:
--
--      select from_status,
--             string_agg(to_status || case when admin_only then ' (admin)' else '' end,
--                        ', ' order by to_status) as can_become
--      from booking_status_transitions group by 1 order by 1;
--
-- c) Prove it refuses a bad move. This SHOULD fail:
--
--      update bookings set status = 'completed'
--      where id = (select id from bookings where status = 'pending' limit 1);
--
--    Expected: "Cannot move a booking from pending to completed".
--
-- d) The payment rules:
--
--      select from_status,
--             string_agg(to_status || case when admin_only then ' (admin)' else '' end,
--                        ', ' order by to_status) as can_become
--      from booking_payment_transitions group by 1 order by 1;
--
-- e) After a real change, the trail -- both axes land in the same log,
--    separated by change_type:
--
--      select booking_id, changed_by, old_value, new_value, created_at
--      from booking_audit_log where change_type = 'status'
--      order by created_at desc limit 10;
-- =====================================================================
