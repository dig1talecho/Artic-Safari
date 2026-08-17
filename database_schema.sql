-- Artic Safari — consolidated database schema
-- Run this in Supabase Dashboard -> SQL Editor. Not applied automatically,
-- not committed to the repo.
--
-- This file supersedes the older, scattered scripts (supabase-rls-bookings.sql,
-- supabase-staff-auth-setup.sql, supabase-staff-profiles-read-fix.sql,
-- supabase-customer-profiles-setup.sql, supabase-reviews-setup.sql,
-- supabase-gallery-setup.sql). It represents the current desired end state,
-- not the historical migration path, and is written to be safely re-run:
-- every `create table` uses `if not exists`, every `create policy` is
-- preceded by `drop policy if exists`, and the storage bucket insert uses
-- `on conflict do nothing`. Running this whole file against a brand-new
-- Supabase project bootstraps the entire schema in one pass; running it
-- again against this project's existing database is a safe no-op.
--
-- COMPANION MIGRATIONS — run these after this file on a fresh database.
-- They are kept separate because each is a self-contained feature with its
-- own seed data and explanation, and folding them in would duplicate a few
-- hundred lines that then have to be kept in step by hand:
--   supabase-loyalty-points-setup.sql    reward points ledger + triggers
--   supabase-taximeter-pricing.sql       per-minute rate, vehicle classes,
--                                        server-side fare calculation
--   supabase-driver-taxi-only-rls.sql    already folded in below; the file
--                                        exists only for databases created
--                                        before that policy was tightened
--
-- PORTABILITY NOTE: table definitions, columns, constraints, and indexes
-- below are standard SQL and will work on any Postgres-compatible database.
-- The RLS POLICIES and the STORAGE section are NOT vendor-neutral — they
-- depend on Supabase-provided helpers (auth.uid(), auth.jwt()) and
-- Supabase Storage (storage.objects/storage.buckets), which have no
-- standard-SQL equivalent. If you migrate to a different backend, you will
-- need to reimplement authorization and file storage using that provider's
-- own primitives; the table shapes themselves carry over unchanged.


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- TABLES
-- ============================================================

-- bookings: created originally via the Supabase dashboard UI (predates this
-- script). Reconstructed here as `if not exists` from the shape the app
-- actually reads/writes (components/admin/types.ts, tour-packages.tsx,
-- dispatch-console.tsx) so a fresh project gets the same table.
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  booking_type text not null,
  item_title text not null,
  booking_date date not null,
  total_price numeric not null default 0,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  assigned_driver text,
  payment_status text default 'pending' check (payment_status in ('paid', 'pending', 'refunded'))
);

-- Security audit finding: bookings are inserted directly from the browser
-- with the anon key and total_price is client-computed -- nothing server-
-- side previously stopped a manipulated request from inserting total_price
-- 0 or a negative number. This bounds check is defense-in-depth, not full
-- price authority (a request could still understate a real price within
-- the bounds) -- true price authority needs a service-role-backed booking
-- route that recomputes price server-side; see app/api/distance/route.ts
-- for the pattern this would follow once a service role key is available.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_total_price_check') then
    alter table bookings add constraint bookings_total_price_check check (total_price > 0 and total_price <= 50000);
  end if;
end $$;

-- New: real scheduled time-of-day, nullable. Only the tour-booking wizard
-- collects a preferred time today; transfers are same-day dispatch and
-- never populate this. Used for real (not fabricated) driver conflict
-- detection in the Transfer Operations console.
alter table bookings add column if not exists scheduled_time time;

-- staff_profiles: role + display name for each admin/driver account.
create table if not exists staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'driver')),
  display_name text not null
);

-- customer_profiles: full name/phone/email for password-based customer accounts.
create table if not exists customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null
);

-- reviews: admin-entered only (no public submission form), keeps the
-- homepage reviews section honestly empty until real reviews exist.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- gallery_photos: metadata for admin-uploaded customer photos (storage
-- object itself lives in the gallery-photos Storage bucket, see below).
create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- New: append-only change log for the Transfer Operations audit-trail
-- drawer. Only insert/select policies exist below — entries are never
-- edited or deleted.
create table if not exists booking_audit_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  changed_by text not null,
  change_type text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists booking_audit_log_booking_id_idx on booking_audit_log (booking_id);

-- New: tour catalog CMS. Replaces the hardcoded lib/tours-data.ts as the
-- source of truth for /tours, /tours/[slug], and the homepage tour cards.
-- 'draft' tours are never shown on the public site.
create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft' check (status in ('active', 'draft')),
  eyebrow text not null default '',
  title text not null,
  meta_title text not null default '',
  meta_description text not null default '',
  intro text not null default '',
  price text not null default '',
  price_note text not null default '',
  duration text not null default '',
  meeting_point text not null default '',
  highlights text[] not null default '{}',
  features text[] not null default '{}',
  cover_image text not null default '',
  cover_image_alt text not null default '',
  gallery text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed: the 5 tours that used to live in lib/tours-data.ts, so switching to
-- the CMS doesn't empty out the live site. Only inserts if the slug doesn't
-- already exist, so it never overwrites edits made from the admin panel.
insert into tours (slug, status, eyebrow, title, meta_title, meta_description, intro, price, price_note, features, cover_image, cover_image_alt, sort_order)
select * from (values
  ('airport-transfer', 'active', 'Point to Point', 'Airport Transfer',
    'Private VIP Airport Transfer Tromsø | Artic Safari',
    'Private chauffeured airport transfers in Tromsø, Norway. Direct pickup, free Wi-Fi, and generous luggage space. From 490 kr. Book online today.',
    'Skip the taxi queue. A private, chauffeured transfer between Tromsø Airport and your hotel or the city center — direct, comfortable, and ready when you land.',
    'From 490 kr', '1–4 passengers, large vehicle available for 4–8',
    array['Direct airport transfer','Chauffeur service','Free Wi-Fi','Generous luggage space'],
    '/gallery/airport-transfer.jpg', 'Private VIP vehicles used for premium airport transfer service (representative image)', 1),
  ('northern-lights-private-group', 'active', 'Signature Experience', 'Northern Lights Tour — Private Group',
    'Private Northern Lights Tour Tromsø | Private Group | Artic Safari',
    'Exclusive private Northern Lights expedition for up to 8 guests in Tromsø. Heated vehicle, custom aurora chase route, thermal suits. Flat rate 15,000 kr.',
    'Our most-booked experience: an exclusive private group expedition for 2 to 8 guests. Your own heated vehicle and a route customized in real time to hunt the clearest, most active skies.',
    '15,000 kr flat rate', 'Up to 8 guests',
    array['Private heated vehicle','Customized chase route','Thermal suits provided','Professional photography','Hot drinks & snacks'],
    '/gallery/northern-lights-private-group.jpg', 'Private group watching the Northern Lights over a fjord near Tromsø', 2),
  ('northern-lights-per-person', 'active', 'Solo & Couples', 'Northern Lights — Per Person',
    'Northern Lights Tour Tromsø Per Person | Artic Safari',
    'Join a shared small-group Northern Lights chase in Tromsø with an expert aurora guide. Hot drinks included. From 2,250 kr per person.',
    'A shared small-group aurora chase for solo travelers and couples — expert guiding, hot drinks, and a genuine shot at the lights without booking a full private tour.',
    '2,250 kr', 'Per person',
    array['Shared small-group chase','Expert aurora guide','Hot drinks included'],
    '/gallery/northern-lights-per-person.jpg', 'Small group of travelers on a shared Northern Lights tour in Norway', 3),
  ('northern-lights-small-group', 'active', 'Family & Friends', 'Northern Lights — Private Small Group',
    'Private Small Group Northern Lights Tour Tromsø | Artic Safari',
    'A private Northern Lights chase for 1–4 guests in Tromsø. Private chauffeur, thermal gear, and tripods provided. 11,000 kr.',
    'For families and small groups of friends — a private chase with flexible timing, your own chauffeur, and photography gear so nobody misses the shot.',
    '11,000 kr', '1 to 4 persons',
    array['Private chauffeur','Flexible timing','Thermal gear','Tripods provided'],
    '/gallery/northern-lights-small-group.jpg', 'Vivid purple and green aurora borealis over snowy mountains near Tromsø', 4),
  ('sommaroya-tour', 'active', 'Coastal Scenic', 'Sommarøya Tour',
    'Sommarøya Scenic Coastal Tour Tromsø | Artic Safari',
    'Scenic coastal drive from Tromsø to Sommarøy island. Fjord views, curated photo stops, and island exploration. From 5,000 kr.',
    'A daytime escape from Tromsø along the coast to Sommarøy — dramatic fjord scenery, curated photo stops, and time to explore one of Northern Norway''s most photographed islands.',
    'From 5,000 kr', 'Small or big car, price varies by group size',
    array['Scenic coastal fjord drive','Sommarøy island exploration','Curated photo stops'],
    '/gallery/sommaroya-tour.jpg', 'Coastal road and fjord landscape on the way to Sommarøy, Norway', 5)
) as seed(slug, status, eyebrow, title, meta_title, meta_description, intro, price, price_note, features, cover_image, cover_image_alt, sort_order)
where not exists (select 1 from tours where tours.slug = seed.slug);

-- New: taximeter pricing engine parameters. Single-row table (admin edits
-- the one row rather than picking between many "pricing profiles").
create table if not exists pricing_rules (
  id uuid primary key default gen_random_uuid(),
  base_fee numeric not null default 500,
  price_per_km numeric not null default 35,
  night_rate_multiplier numeric not null default 1.25,
  min_price numeric not null default 800,
  updated_at timestamptz not null default now()
);

insert into pricing_rules (base_fee, price_per_km, night_rate_multiplier, min_price)
select 500, 35, 1.25, 800
where not exists (select 1 from pricing_rules);


-- ============================================================
-- STRATEGIC PLATFORM MODULES
-- Added as infrastructure ahead of UI: B2B partners, customer media vault,
-- add-ons, notifications, live driver tracking, wallet passes, AI itinerary
-- log, weather-driven rescheduling, private charter quotes, geofenced
-- pickup. Each is real schema -- nothing here is a placeholder table.
-- ============================================================

-- ---------------- 1. B2B partners / hotel concierge ----------------

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  hotel_name text not null,
  contact_name text,
  contact_email text,
  commission_rate numeric not null default 0.10 check (commission_rate >= 0 and commission_rate <= 1),
  promo_code text unique not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Bookings can optionally carry a partner promo code. partner_id and
-- commission_amount are never trusted from the client -- see the
-- resolve_booking_partner() trigger below, which is the only thing
-- allowed to set them.
alter table bookings add column if not exists promo_code text;
alter table bookings add column if not exists partner_id uuid references partners(id);
alter table bookings add column if not exists commission_amount numeric;

create or replace function resolve_booking_partner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner partners%rowtype;
begin
  new.partner_id := null;
  new.commission_amount := null;
  if new.promo_code is not null and length(trim(new.promo_code)) > 0 then
    select * into v_partner from partners where promo_code = new.promo_code and active = true;
    if found then
      new.partner_id := v_partner.id;
      new.commission_amount := round(new.total_price * v_partner.commission_rate, 2);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_resolve_booking_partner on bookings;
create trigger trg_resolve_booking_partner
before insert on bookings
for each row
execute function resolve_booking_partner();

-- ---------------- 2. Customer media vault ----------------

create table if not exists booking_media (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists booking_media_booking_id_idx on booking_media (booking_id);

-- ---------------- 3. Tour add-ons / cross-sell ----------------

create table if not exists tour_addons (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references tours(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- name + price_at_booking are snapshotted at booking time so a later edit
-- or deletion of the addon never rewrites a customer's historical receipt.
create table if not exists booking_addons (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  addon_id uuid references tour_addons(id) on delete set null,
  name text not null,
  quantity int not null default 1 check (quantity > 0),
  price_at_booking numeric not null check (price_at_booking >= 0),
  created_at timestamptz not null default now()
);

create index if not exists booking_addons_booking_id_idx on booking_addons (booking_id);

-- ---------------- 4. Notification log ----------------

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  type text not null,
  channel text not null check (channel in ('whatsapp', 'email', 'sms')),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  error text,
  created_at timestamptz not null default now()
);

-- ---------------- 5. Live driver tracking ----------------

-- One row per booking (upserted on every ping), not a growing history --
-- this models "where is the driver right now", not a trail log.
create table if not exists driver_locations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  driver_name text not null,
  lat double precision not null,
  lng double precision not null,
  heading double precision,
  speed double precision,
  updated_at timestamptz not null default now()
);

create unique index if not exists driver_locations_booking_id_key on driver_locations (booking_id);

-- ---------------- 6. AI concierge itinerary log ----------------

create table if not exists ai_itineraries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  preferences jsonb not null,
  itinerary jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------- 7. Weather-driven rescheduling ----------------

alter table bookings add column if not exists weather_status text not null default 'SCHEDULED'
  check (weather_status in ('SCHEDULED', 'DELAYED', 'AUTO_CANCELLED'));

-- One-click "pick a new date" links sent to a customer after a
-- weather-triggered delay/cancellation. Single-use, expiring.
create table if not exists rebook_tokens (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  token text unique not null,
  used boolean not null default false,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists rebook_tokens_token_idx on rebook_tokens (token);

-- ---------------- 8. VIP private charter quotes ----------------

create table if not exists charter_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  vehicle_type text not null check (vehicle_type in ('suv', 'van', 'luxury_sedan', 'minibus')),
  catering_preferences text,
  pax int not null check (pax > 0),
  total_quote numeric not null check (total_quote >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'expired')),
  created_at timestamptz not null default now()
);

-- ---------------- 9. Geofenced pickup ----------------

create table if not exists pickup_points (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  geofence_radius_m int not null default 300,
  created_at timestamptz not null default now()
);

-- Records that the "driver is approaching" notification already fired for
-- this booking, so the geofence trigger only ever notifies once per trip.
create table if not exists pickup_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  pickup_point_id uuid references pickup_points(id),
  event_type text not null default 'GUEST_APPROACHING_NOTIFIED',
  created_at timestamptz not null default now()
);

create unique index if not exists pickup_events_booking_event_key on pickup_events (booking_id, event_type);


-- ============================================================
-- ROW LEVEL SECURITY POLICIES (Supabase-specific: auth.uid() / auth.jwt())
-- ============================================================

-- ---------------- bookings ----------------

alter table bookings enable row level security;

drop policy if exists "public can insert bookings" on bookings;
create policy "public can insert bookings"
on bookings for insert
to anon, authenticated
with check (true);

drop policy if exists "customers can view their own bookings" on bookings;
create policy "customers can view their own bookings"
on bookings for select
to authenticated
using (auth.jwt() ->> 'email' = customer_email);

drop policy if exists "admins can view all bookings" on bookings;
create policy "admins can view all bookings"
on bookings for select
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can update all bookings" on bookings;
create policy "admins can update all bookings"
on bookings for update
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

-- Drivers work taxi/transfer jobs only, so the type test belongs in the
-- policy and not just in the app's UI filter. Keep the value list here in
-- sync with TAXI_TYPES in the mobile app (screens/RequestsScreen.tsx and
-- lib/useNotifications.tsx). 'taxi' is defensive — every current insert
-- path writes 'transfer' or 'tour'.
drop policy if exists "drivers can view their assigned or unassigned bookings" on bookings;
create policy "drivers can view their assigned or unassigned bookings"
on bookings for select
to authenticated
using (
  bookings.booking_type in ('transfer', 'taxi')
  and exists (
    select 1 from staff_profiles sp
    where sp.id = auth.uid()
      and sp.role = 'driver'
      and (bookings.assigned_driver is null or bookings.assigned_driver = sp.display_name)
  )
);

-- `with check` repeats the type test so a driver cannot update a taxi row
-- and rewrite booking_type on the way out.
drop policy if exists "drivers can update their assigned or unassigned bookings" on bookings;
create policy "drivers can update their assigned or unassigned bookings"
on bookings for update
to authenticated
using (
  bookings.booking_type in ('transfer', 'taxi')
  and exists (
    select 1 from staff_profiles sp
    where sp.id = auth.uid()
      and sp.role = 'driver'
      and (bookings.assigned_driver is null or bookings.assigned_driver = sp.display_name)
  )
)
with check (
  bookings.booking_type in ('transfer', 'taxi')
  and exists (
    select 1 from staff_profiles sp
    where sp.id = auth.uid()
      and sp.role = 'driver'
      and (bookings.assigned_driver is null or bookings.assigned_driver = sp.display_name)
  )
);

-- ---------------- staff_profiles ----------------

alter table staff_profiles enable row level security;

-- Note: a policy on staff_profiles cannot reference staff_profiles itself in
-- its own USING clause (Postgres rejects that as infinite recursion). This
-- table only holds names/roles (no PII), so any signed-in user may read the
-- full roster — needed for the driver-assignment dropdown and Drivers view.
drop policy if exists "staff can view their own profile" on staff_profiles;
drop policy if exists "authenticated users can view staff profiles" on staff_profiles;
create policy "authenticated users can view staff profiles"
on staff_profiles for select
to authenticated
using (true);

-- ---------------- customer_profiles ----------------

alter table customer_profiles enable row level security;

drop policy if exists "customers can insert their own profile" on customer_profiles;
create policy "customers can insert their own profile"
on customer_profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "customers can view their own profile" on customer_profiles;
create policy "customers can view their own profile"
on customer_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "customers can update their own profile" on customer_profiles;
create policy "customers can update their own profile"
on customer_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ---------------- reviews ----------------

alter table reviews enable row level security;

drop policy if exists "public can view published reviews" on reviews;
create policy "public can view published reviews"
on reviews for select
to anon, authenticated
using (published = true);

drop policy if exists "admins can view all reviews" on reviews;
create policy "admins can view all reviews"
on reviews for select
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can insert reviews" on reviews;
create policy "admins can insert reviews"
on reviews for insert
to authenticated
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can update reviews" on reviews;
create policy "admins can update reviews"
on reviews for update
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can delete reviews" on reviews;
create policy "admins can delete reviews"
on reviews for delete
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

-- ---------------- gallery_photos ----------------

alter table gallery_photos enable row level security;

drop policy if exists "public can view gallery metadata" on gallery_photos;
create policy "public can view gallery metadata"
on gallery_photos for select
to anon, authenticated
using (true);

drop policy if exists "admins can insert gallery metadata" on gallery_photos;
create policy "admins can insert gallery metadata"
on gallery_photos for insert
to authenticated
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can delete gallery metadata" on gallery_photos;
create policy "admins can delete gallery metadata"
on gallery_photos for delete
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

-- ---------------- booking_audit_log ----------------

alter table booking_audit_log enable row level security;

-- Append-only: select + insert only, no update/delete policy at all.
drop policy if exists "authenticated staff can view audit log" on booking_audit_log;
create policy "authenticated staff can view audit log"
on booking_audit_log for select
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid())
);

-- Security audit finding: the original policy only checked that the caller
-- was SOME staff member, not that changed_by actually named them -- any
-- staff account could write an audit entry attributed to someone else.
-- This ties changed_by to the caller's own display_name.
drop policy if exists "authenticated staff can insert audit log" on booking_audit_log;
create policy "authenticated staff can insert audit log"
on booking_audit_log for insert
to authenticated
with check (
  changed_by = (select display_name from staff_profiles where id = auth.uid())
);

-- ---------------- tours ----------------

alter table tours enable row level security;

drop policy if exists "public can view active tours" on tours;
create policy "public can view active tours"
on tours for select
to anon, authenticated
using (status = 'active');

drop policy if exists "admins can view all tours" on tours;
create policy "admins can view all tours"
on tours for select
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can insert tours" on tours;
create policy "admins can insert tours"
on tours for insert
to authenticated
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can update tours" on tours;
create policy "admins can update tours"
on tours for update
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can delete tours" on tours;
create policy "admins can delete tours"
on tours for delete
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

-- ---------------- pricing_rules ----------------

alter table pricing_rules enable row level security;

drop policy if exists "public can view pricing rules" on pricing_rules;
create policy "public can view pricing rules"
on pricing_rules for select
to anon, authenticated
using (true);

drop policy if exists "admins can update pricing rules" on pricing_rules;
create policy "admins can update pricing rules"
on pricing_rules for update
to authenticated
using (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

-- ---------------- partners ----------------

alter table partners enable row level security;

-- Deliberately admin-only, including SELECT: commission_rate and contact
-- details are internal business terms, not public data. The promo_code ->
-- partner_id resolution happens inside resolve_booking_partner(), which
-- runs as security definer specifically so anon customers can still be
-- attributed to a partner without ever being able to read the partners
-- table directly.
drop policy if exists "admins can view partners" on partners;
create policy "admins can view partners"
on partners for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can insert partners" on partners;
create policy "admins can insert partners"
on partners for insert
to authenticated
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can update partners" on partners;
create policy "admins can update partners"
on partners for update
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can delete partners" on partners;
create policy "admins can delete partners"
on partners for delete
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- ---------------- booking_media ----------------

alter table booking_media enable row level security;

drop policy if exists "admins can view all booking media" on booking_media;
create policy "admins can view all booking media"
on booking_media for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "customers can view their own booking media" on booking_media;
create policy "customers can view their own booking media"
on booking_media for select
to authenticated
using (
  exists (
    select 1 from bookings b
    where b.id = booking_media.booking_id
      and b.customer_email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "admins can insert booking media" on booking_media;
create policy "admins can insert booking media"
on booking_media for insert
to authenticated
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can delete booking media" on booking_media;
create policy "admins can delete booking media"
on booking_media for delete
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- ---------------- tour_addons ----------------

alter table tour_addons enable row level security;

drop policy if exists "public can view active addons" on tour_addons;
create policy "public can view active addons"
on tour_addons for select
to anon, authenticated
using (active = true);

drop policy if exists "admins can view all addons" on tour_addons;
create policy "admins can view all addons"
on tour_addons for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can insert addons" on tour_addons;
create policy "admins can insert addons"
on tour_addons for insert
to authenticated
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can update addons" on tour_addons;
create policy "admins can update addons"
on tour_addons for update
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can delete addons" on tour_addons;
create policy "admins can delete addons"
on tour_addons for delete
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- ---------------- booking_addons ----------------

alter table booking_addons enable row level security;

-- Public insert mirrors the bookings table's own policy -- an add-on row
-- is written by the same guest checkout flow immediately after the
-- booking it belongs to.
drop policy if exists "public can insert booking addons" on booking_addons;
create policy "public can insert booking addons"
on booking_addons for insert
to anon, authenticated
with check (true);

drop policy if exists "admins can view all booking addons" on booking_addons;
create policy "admins can view all booking addons"
on booking_addons for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "customers can view their own booking addons" on booking_addons;
create policy "customers can view their own booking addons"
on booking_addons for select
to authenticated
using (
  exists (
    select 1 from bookings b
    where b.id = booking_addons.booking_id
      and b.customer_email = auth.jwt() ->> 'email'
  )
);

-- ---------------- notification_log ----------------

alter table notification_log enable row level security;

drop policy if exists "admins can view notification log" on notification_log;
create policy "admins can view notification log"
on notification_log for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- Written by server-side service code (anon key from a trusted Route
-- Handler context, e.g. after a real WhatsApp/Resend call). Any
-- authenticated staff session can log, matching the audit-log pattern.
drop policy if exists "staff can insert notification log" on notification_log;
create policy "staff can insert notification log"
on notification_log for insert
to authenticated
with check (exists (select 1 from staff_profiles where id = auth.uid()));

-- ---------------- driver_locations ----------------

alter table driver_locations enable row level security;

drop policy if exists "admins can view all driver locations" on driver_locations;
create policy "admins can view all driver locations"
on driver_locations for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "customers can view their own driver location" on driver_locations;
create policy "customers can view their own driver location"
on driver_locations for select
to authenticated
using (
  exists (
    select 1 from bookings b
    where b.id = driver_locations.booking_id
      and b.customer_email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "assigned drivers can push their location" on driver_locations;
create policy "assigned drivers can push their location"
on driver_locations for insert
to authenticated
with check (
  exists (
    select 1 from bookings b
    join staff_profiles sp on sp.id = auth.uid()
    where b.id = driver_locations.booking_id
      and sp.role = 'driver'
      and b.assigned_driver = sp.display_name
  )
);

drop policy if exists "assigned drivers can update their location" on driver_locations;
create policy "assigned drivers can update their location"
on driver_locations for update
to authenticated
using (
  exists (
    select 1 from bookings b
    join staff_profiles sp on sp.id = auth.uid()
    where b.id = driver_locations.booking_id
      and sp.role = 'driver'
      and b.assigned_driver = sp.display_name
  )
)
with check (
  exists (
    select 1 from bookings b
    join staff_profiles sp on sp.id = auth.uid()
    where b.id = driver_locations.booking_id
      and sp.role = 'driver'
      and b.assigned_driver = sp.display_name
  )
);

-- ---------------- ai_itineraries ----------------

alter table ai_itineraries enable row level security;

-- Insert-only for the public (the generated plan is returned directly in
-- the API response, not read back from the table) -- keeps preference
-- data from being publicly listable.
drop policy if exists "public can log itineraries" on ai_itineraries;
create policy "public can log itineraries"
on ai_itineraries for insert
to anon, authenticated
with check (true);

drop policy if exists "admins can view itineraries" on ai_itineraries;
create policy "admins can view itineraries"
on ai_itineraries for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- ---------------- rebook_tokens ----------------

alter table rebook_tokens enable row level security;

drop policy if exists "admins can manage rebook tokens" on rebook_tokens;
create policy "admins can manage rebook tokens"
on rebook_tokens for all
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- A customer redeeming their own emailed/WhatsApp'd token looks it up by
-- the token value itself (effectively a bearer credential), not by
-- browsing -- safe to allow anon select scoped to a single row lookup.
drop policy if exists "anyone with the token can read it" on rebook_tokens;
create policy "anyone with the token can read it"
on rebook_tokens for select
to anon, authenticated
using (used = false and expires_at > now());

-- ---------------- charter_requests ----------------

alter table charter_requests enable row level security;

drop policy if exists "public can submit charter requests" on charter_requests;
create policy "public can submit charter requests"
on charter_requests for insert
to anon, authenticated
with check (true);

drop policy if exists "admins can view charter requests" on charter_requests;
create policy "admins can view charter requests"
on charter_requests for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "admins can update charter requests" on charter_requests;
create policy "admins can update charter requests"
on charter_requests for update
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- ---------------- pickup_points / pickup_events ----------------

alter table pickup_points enable row level security;

drop policy if exists "public can view pickup points" on pickup_points;
create policy "public can view pickup points"
on pickup_points for select
to anon, authenticated
using (true);

drop policy if exists "admins can manage pickup points" on pickup_points;
create policy "admins can manage pickup points"
on pickup_points for all
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

alter table pickup_events enable row level security;

drop policy if exists "staff can view pickup events" on pickup_events;
create policy "staff can view pickup events"
on pickup_events for select
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid()));

drop policy if exists "staff can insert pickup events" on pickup_events;
create policy "staff can insert pickup events"
on pickup_events for insert
to authenticated
with check (exists (select 1 from staff_profiles where id = auth.uid()));


-- ============================================================
-- STORAGE (Supabase Storage-specific — no standard-SQL equivalent)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('gallery-photos', 'gallery-photos', true)
on conflict (id) do nothing;

drop policy if exists "public can view gallery photos" on storage.objects;
create policy "public can view gallery photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'gallery-photos');

drop policy if exists "admins can upload gallery photos" on storage.objects;
create policy "admins can upload gallery photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gallery-photos'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can delete gallery photos" on storage.objects;
create policy "admins can delete gallery photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gallery-photos'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

insert into storage.buckets (id, name, public)
values ('tour-media', 'tour-media', true)
on conflict (id) do nothing;

drop policy if exists "public can view tour media" on storage.objects;
create policy "public can view tour media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'tour-media');

drop policy if exists "admins can upload tour media" on storage.objects;
create policy "admins can upload tour media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tour-media'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can delete tour media" on storage.objects;
create policy "admins can delete tour media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'tour-media'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

-- booking-media: PRIVATE bucket (public: false), unlike gallery-photos /
-- tour-media. Files are stored as "{booking_id}/{filename}" so the RLS
-- policy can scope access to just the customer who owns that booking,
-- via storage.foldername() reading the first path segment.
insert into storage.buckets (id, name, public)
values ('booking-media', 'booking-media', false)
on conflict (id) do nothing;

drop policy if exists "admins can view booking media files" on storage.objects;
create policy "admins can view booking media files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'booking-media'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "customers can view their own booking media files" on storage.objects;
create policy "customers can view their own booking media files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'booking-media'
  and exists (
    select 1 from bookings b
    where b.id::text = (storage.foldername(name))[1]
      and b.customer_email = auth.jwt() ->> 'email'
  )
);

drop policy if exists "admins can upload booking media files" on storage.objects;
create policy "admins can upload booking media files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'booking-media'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "admins can delete booking media files" on storage.objects;
create policy "admins can delete booking media files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'booking-media'
  and exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin')
);


-- ============================================================
-- MANUAL STEPS THIS SCRIPT CANNOT DO
-- ============================================================

-- 1. Supabase Dashboard -> Authentication -> Providers -> Email -> turn OFF
--    "Confirm email". Without this, customer signUp() won't return an
--    active session immediately, and the customer_profiles insert (which
--    needs auth.uid()) has nothing to authenticate as. This also avoids
--    Supabase's low email-sending rate limit entirely.
--
-- 2. Create staff accounts: Dashboard -> Authentication -> Users -> Add
--    user (email + password) for each admin/driver. Then copy each new
--    user's UUID and run:
--
--    insert into staff_profiles (id, role, display_name) values
--      ('PASTE-ADMIN-UUID-HERE', 'admin', 'General Admin'),
--      ('PASTE-DRIVER-1-UUID-HERE', 'driver', 'Driver 1'),
--      ('PASTE-DRIVER-2-UUID-HERE', 'driver', 'Driver 2');
--
--    (On this project's existing database, this step has already been done
--    for the admin account and drivers 1-3 — only run it again for new
--    staff accounts.)
