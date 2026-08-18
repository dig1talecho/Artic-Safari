-- =====================================================================
-- Site content: editable copy and images, without touching code
-- =====================================================================
--
-- HOW THIS IS SHAPED, AND WHY
-- This table stores OVERRIDES ONLY. It does not hold the site's text.
--
-- The code still declares every string in lib/site-content.ts as its
-- default. A row here says "use this instead of what the code says". A
-- key with no row simply renders the code's version.
--
-- That choice matters more than it looks:
--
--   * An empty table is a working site. Run this file on a fresh
--     database and nothing changes visually -- there is no window where
--     the homepage renders blank because content has not been entered.
--   * Adding a string in code makes it appear in the admin panel by
--     itself, already filled in with its current wording.
--   * "Reset to default" is a DELETE, not retyping the original text
--     from memory.
--   * A typo in a key name shows the default rather than an empty gap.
--
-- The alternative -- a table that must be fully populated before the site
-- works -- fails all four.
--
-- SAFE TO RE-RUN.
-- =====================================================================

create table if not exists site_content (
  -- Dotted path, e.g. 'hero.headline' or 'trust.card1.title'. The code
  -- defines which keys exist; this is deliberately free text so a new
  -- string needs no migration.
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now(),
  -- Who last changed it. Reads from staff_profiles so an edit can be
  -- traced without a separate audit table.
  updated_by text
);

create index if not exists site_content_updated_at_idx on site_content (updated_at desc);

alter table site_content enable row level security;

-- Public read: the homepage is server-rendered for anonymous visitors,
-- so the anon role has to be able to read overrides.
drop policy if exists "anyone can read site content" on site_content;
create policy "anyone can read site content"
on site_content for select
to anon, authenticated
using (true);

-- Only admins write. Drivers have no business editing marketing copy.
drop policy if exists "admins can write site content" on site_content;
create policy "admins can write site content"
on site_content for all
to authenticated
using (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from staff_profiles where id = auth.uid() and role = 'admin'));

-- Stamps the editor's name server-side. Sent from the browser it would be
-- a claim; taken from the JWT it is a fact.
create or replace function stamp_site_content_editor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := (select display_name from staff_profiles where id = auth.uid());
  return new;
end $$;

drop trigger if exists trg_stamp_site_content_editor on site_content;
create trigger trg_stamp_site_content_editor
before insert or update on site_content
for each row
execute function stamp_site_content_editor();

-- =====================================================================
-- VERIFY
--   select key, left(value, 60) as value, updated_by, updated_at
--   from site_content order by key;
--
-- An empty result is the correct state before you have edited anything.
-- =====================================================================
