-- FoundIt: campus lost-and-found schema, storage, and role rules.
-- Authorization lives in public.profiles, never in user-editable JWT metadata.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, anon, authenticated;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table public.desks (
  id text primary key,
  name text not null unique,
  building text not null,
  room text not null,
  hours text not null,
  description text not null,
  phone text not null,
  map_x numeric not null,
  map_y numeric not null
);

create table public.buildings (
  id text primary key,
  name text not null,
  short_name text not null,
  map_x numeric not null,
  map_y numeric not null,
  desk_id text references public.desks (id)
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  student_id text,
  role text not null default 'student' check (role in ('student', 'staff', 'admin')),
  desk_id text references public.desks (id),
  claims_used_this_week integer not null default 0 check (claims_used_this_week >= 0),
  claims_week_start date not null default (timezone('America/Toronto', now()))::date,
  created_at timestamptz not null default now()
);

create table private.staff_invites (
  code text primary key,
  role text not null check (role in ('staff', 'admin')),
  desk_id text,
  active boolean not null default true
);

create table public.staff_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Inventory, claims, reports, tags
-- ---------------------------------------------------------------------------

create table public.found_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  subcategory text,
  colour text not null,
  brand text,
  public_description text not null,
  distinctive_features text,
  desk_id text not null references public.desks (id),
  logged_at timestamptz not null default now(),
  status text not null default 'available' check (status in (
    'available', 'in-transit', 'reserved', 'under-review',
    'ready-pickup', 'picked-up', 'moved-storage', 'donated'
  )),
  valuable boolean not null default false,
  storage_spot text,
  location_found text,
  drop_off_code text unique,
  image_path text,
  image_bucket text check (image_bucket in ('public-photos', 'private-photos')),
  logged_by uuid references public.profiles (id),
  finder_id uuid references public.profiles (id),
  override_note text,
  created_at timestamptz not null default now()
);

create table public.found_item_secrets (
  item_id uuid primary key references public.found_items (id) on delete cascade,
  detailed_description text,
  watcard_name text,
  private_notes text
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.found_items (id) on delete cascade,
  claimant_id uuid not null references public.profiles (id),
  status text not null check (status in ('pending', 'approved', 'rejected', 'completed', 'contested')),
  pickup_code text unique,
  hold_expires_at timestamptz,
  verification_answer text,
  distinguishing_detail text,
  staff_notes text,
  is_contested boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.lost_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  category text not null,
  subcategory text,
  colour text not null,
  brand text,
  description text not null,
  distinctive_features text,
  private_details text,
  building text not null,
  location_detail text,
  lost_at timestamptz not null,
  image_path text,
  status text not null default 'active' check (status in ('active', 'matched', 'resolved', 'closed')),
  created_at timestamptz not null default now()
);

create table public.item_matches (
  id uuid primary key default gen_random_uuid(),
  lost_report_id uuid not null references public.lost_reports (id) on delete cascade,
  found_item_id uuid not null references public.found_items (id) on delete cascade,
  confidence integer not null check (confidence between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  differences jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  unique (lost_report_id, found_item_id)
);

create table public.return_tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  code text not null unique,
  label text not null,
  category text not null,
  colour text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tag_scans (
  id uuid primary key default gen_random_uuid(),
  scanner_id uuid references public.profiles (id),
  code text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  related_item_id uuid,
  related_report_id uuid,
  pickup_code text,
  created_at timestamptz not null default now()
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.found_items (id) on delete cascade,
  report_id uuid references public.lost_reports (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  event_type text not null,
  message text not null,
  visibility text not null default 'public' check (visibility in ('public', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes used by filters and row-level policies
-- ---------------------------------------------------------------------------

create index profiles_name_lower_idx on public.profiles (lower(full_name));
create index profiles_role_idx on public.profiles (role);
create index found_items_desk_idx on public.found_items (desk_id);
create index found_items_category_idx on public.found_items (category);
create index found_items_status_idx on public.found_items (status);
create index found_items_logged_idx on public.found_items (logged_at desc);
create index claims_item_idx on public.claims (item_id);
create index claims_claimant_idx on public.claims (claimant_id);
create index claims_pickup_idx on public.claims (pickup_code);
create index lost_reports_owner_idx on public.lost_reports (owner_id);
create index lost_reports_category_idx on public.lost_reports (category, status);
create index item_matches_report_idx on public.item_matches (lost_report_id);
create index item_matches_item_idx on public.item_matches (found_item_id);
create index return_tags_owner_idx on public.return_tags (owner_id);
create index return_tags_code_idx on public.return_tags (code);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index timeline_item_idx on public.timeline_events (item_id, created_at);
create index timeline_report_idx on public.timeline_events (report_id, created_at);
create index staff_redemptions_user_idx on public.staff_redemptions (user_id);

-- ---------------------------------------------------------------------------
-- Private helpers. Not exposed through the Data API.
-- ---------------------------------------------------------------------------

create or replace function private.make_code(prefix text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  body text := '';
  i integer;
begin
  for i in 1..4 loop
    body := body || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  end loop;
  return prefix || '-' || body;
end;
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('staff', 'admin')
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.staff_desk()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select desk_id from public.profiles where id = (select auth.uid());
$$;

create or replace function private.can_manage_item(target_desk text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_admin())
    or (
      (select private.is_staff())
      and (
        (select private.staff_desk()) is null
        or (select private.staff_desk()) = target_desk
      )
    );
$$;

create or replace function private.notify(
  uid uuid,
  ntype text,
  ntitle text,
  nmessage text,
  item uuid,
  report uuid,
  code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if uid is null then
    return;
  end if;
  if exists (
    select 1 from public.notifications
    where user_id = uid
      and type = ntype
      and title = ntitle
      and related_item_id is not distinct from item
      and created_at > now() - interval '1 day'
  ) then
    return;
  end if;
  insert into public.notifications (
    user_id, type, title, message, related_item_id, related_report_id, pickup_code
  ) values (
    uid, ntype, ntitle, nmessage, item, report, code
  );
end;
$$;

create or replace function private.add_timeline(
  item uuid,
  report uuid,
  event_type text,
  message text,
  visibility text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.timeline_events (item_id, report_id, actor_id, event_type, message, visibility)
  values (item, report, (select auth.uid()), event_type, message, visibility);
end;
$$;

create or replace function private.feature_tokens(input text)
returns text[]
language sql
immutable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct tok), '{}'::text[])
  from (
    select lower(token) as tok
    from regexp_split_to_table(coalesce(input, ''), '[^a-zA-Z0-9]+') as token
    where length(token) >= 3
      and lower(token) not in (
        'the', 'and', 'with', 'for', 'from', 'this', 'that', 'item', 'lost', 'found',
        'black', 'white', 'grey', 'gray', 'blue', 'navy', 'red', 'green', 'yellow',
        'brown', 'pink', 'purple', 'gold', 'small', 'large', 'size'
      )
  ) tokens;
$$;

create or replace function private.compute_score(
  report public.lost_reports,
  item public.found_items
)
returns table (confidence integer, reasons jsonb, differences jsonb)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  score integer := 0;
  why jsonb := '[]'::jsonb;
  diffs jsonb := '[]'::jsonb;
  report_tokens text[];
  item_tokens text[];
  shared integer := 0;
  desk_building text;
  desk_name text;
begin
  if lower(report.category) is distinct from lower(item.category) then
    confidence := 0;
    reasons := '[]'::jsonb;
    differences := jsonb_build_array('Different category');
    return next;
    return;
  end if;

  score := score + 28;
  why := why || jsonb_build_array('Same category');

  if coalesce(report.subcategory, '') <> '' and lower(report.subcategory) = lower(coalesce(item.subcategory, '')) then
    score := score + 12;
    why := why || jsonb_build_array('Same subcategory');
  elsif coalesce(report.subcategory, '') <> '' and coalesce(item.subcategory, '') <> '' then
    score := greatest(score - 8, 0);
    diffs := diffs || jsonb_build_array('Different subcategory');
  end if;

  if lower(report.colour) = lower(item.colour) then
    score := score + 18;
    why := why || jsonb_build_array('Same colour');
  elsif position(lower(report.colour) in lower(item.colour)) > 0
     or position(lower(item.colour) in lower(report.colour)) > 0 then
    score := score + 8;
    why := why || jsonb_build_array('Similar colour');
  else
    diffs := diffs || jsonb_build_array('Different colour');
  end if;

  if coalesce(report.brand, '') <> '' and coalesce(item.brand, '') <> '' then
    if lower(report.brand) = lower(item.brand)
       or position(lower(report.brand) in lower(item.brand)) > 0
       or position(lower(item.brand) in lower(report.brand)) > 0 then
      score := score + 18;
      why := why || jsonb_build_array('Brand matches');
    else
      score := greatest(score - 6, 0);
      diffs := diffs || jsonb_build_array('Different brand');
    end if;
  end if;

  report_tokens := private.feature_tokens(
    coalesce(report.distinctive_features, '') || ' ' || coalesce(report.description, '')
  );
  item_tokens := private.feature_tokens(
    coalesce(item.distinctive_features, '') || ' ' || coalesce(item.public_description, '') || ' ' || coalesce(item.title, '')
  );
  select count(*) into shared
  from unnest(report_tokens) as token
  where token = any(item_tokens);
  if shared > 0 then
    score := score + least(24, shared * 12);
    why := why || jsonb_build_array(
      shared::text || ' distinctive detail' || case when shared = 1 then '' else 's' end || ' match'
    );
  end if;

  select d.building, d.name into desk_building, desk_name
  from public.desks d
  where d.id = item.desk_id;

  if coalesce(report.building, '') <> '' and (
    position(lower(report.building) in lower(coalesce(item.location_found, ''))) > 0
    or position(lower(report.building) in lower(coalesce(desk_building, ''))) > 0
    or position(lower(report.building) in lower(coalesce(desk_name, ''))) > 0
    or position(lower(coalesce(desk_name, '')) in lower(report.building)) > 0
  ) then
    score := score + 8;
    why := why || jsonb_build_array('Nearby location');
  end if;

  if report.lost_at is not null and abs(extract(epoch from (report.lost_at - item.logged_at))) <= 14 * 86400 then
    score := score + 8;
    why := why || jsonb_build_array('Dates are close');
  end if;

  confidence := least(100, greatest(0, score));
  reasons := why;
  differences := diffs;
  return next;
end;
$$;

create or replace function private.remember_match(
  report public.lost_reports,
  item public.found_items
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  scored record;
  desk_name text;
begin
  select * into scored from private.compute_score(report, item);
  if scored.confidence < 50 then
    return;
  end if;

  insert into public.item_matches (lost_report_id, found_item_id, confidence, reasons, differences)
  values (report.id, item.id, scored.confidence, scored.reasons, scored.differences)
  on conflict (lost_report_id, found_item_id) do update
    set confidence = excluded.confidence,
        reasons = excluded.reasons,
        differences = excluded.differences
    where public.item_matches.status = 'pending';

  select name into desk_name from public.desks where id = item.desk_id;

  if scored.confidence >= 60 then
    perform private.notify(
      report.owner_id,
      'match_alert',
      'Is this yours?',
      'A ' || item.colour || ' ' || item.category || ' at ' || coalesce(desk_name, 'a campus desk')
        || ' matches your report (' || scored.confidence::text || '% ).',
      item.id,
      report.id,
      null
    );
  end if;
end;
$$;

create or replace function private.refresh_item_matches(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.found_items;
  report public.lost_reports;
begin
  select * into item from public.found_items where id = target;
  if not found then
    return;
  end if;
  for report in select * from public.lost_reports where status in ('active', 'matched') loop
    perform private.remember_match(report, item);
  end loop;
end;
$$;

create or replace function private.refresh_report_matches(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.found_items;
  report public.lost_reports;
begin
  select * into report from public.lost_reports where id = target;
  if not found then
    return;
  end if;
  for item in
    select * from public.found_items
    where status not in ('picked-up', 'donated')
  loop
    perform private.remember_match(report, item);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, student_id)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data->>'student_id', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.apply_staff_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_role text;
  invite_desk text;
begin
  if new.user_id is distinct from (select auth.uid()) then
    raise exception 'You can only redeem a staff code for your own account';
  end if;

  select role, desk_id into invite_role, invite_desk
  from private.staff_invites
  where code = new.code and active;

  if invite_role is null then
    raise exception 'That staff code is not valid';
  end if;

  update public.profiles
  set role = invite_role,
      desk_id = invite_desk
  where id = new.user_id;

  return new;
end;
$$;

create trigger staff_redemptions_apply
  before insert on public.staff_redemptions
  for each row execute function private.apply_staff_code();

create or replace function private.prepare_found_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before logging an item';
  end if;

  if new.valuable and new.image_bucket = 'public-photos' then
    raise exception 'Photos of valuable items stay in private storage';
  end if;

  if (select private.is_admin()) then
    new.logged_by := (select auth.uid());
  elsif (select private.is_staff()) then
    if (select private.staff_desk()) is not null
       and (select private.staff_desk()) is distinct from new.desk_id then
      raise exception 'You can only log items for your assigned desk';
    end if;
    new.logged_by := (select auth.uid());
    if new.status is null or new.status = 'in-transit' then
      new.status := 'available';
    end if;
  else
    new.status := 'in-transit';
    new.finder_id := (select auth.uid());
    new.logged_by := (select auth.uid());
    new.storage_spot := null;
    new.drop_off_code := null;
    for attempt in 1..5 loop
      new.drop_off_code := private.make_code('DROP');
      exit when not exists (
        select 1 from public.found_items where drop_off_code = new.drop_off_code
      );
    end loop;
  end if;

  if new.logged_at is null then
    new.logged_at := now();
  end if;
  return new;
end;
$$;

create trigger found_items_prepare
  before insert on public.found_items
  for each row execute function private.prepare_found_item();

create or replace function private.after_found_item_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desk_name text;
begin
  select name into desk_name from public.desks where id = new.desk_id;
  if new.status = 'in-transit' then
    perform private.add_timeline(
      new.id, null, 'reported',
      'A student reported this item in transit to ' || coalesce(desk_name, 'a desk') || '.',
      'public'
    );
  else
    perform private.add_timeline(
      new.id, null, 'logged',
      'Staff logged this item at ' || coalesce(desk_name, 'a desk') || '.',
      'public'
    );
  end if;
  perform private.refresh_item_matches(new.id);
  return new;
end;
$$;

create trigger found_items_after_insert
  after insert on public.found_items
  for each row execute function private.after_found_item_insert();

create or replace function private.guard_item_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  age_days integer;
begin
  -- Direct edits are already limited to desk staff by row level security.
  -- This trigger also runs when a claim workflow updates the row, so it only
  -- enforces holding periods.
  age_days := floor(extract(epoch from (now() - old.logged_at)) / 86400)::integer;

  if new.status = 'donated' and old.status is distinct from 'donated' then
    if old.valuable and age_days < 60 and coalesce(new.override_note, '') = '' then
      raise exception 'Valuable items must be held for 60 days';
    end if;
    if age_days < 30 and coalesce(new.override_note, '') = '' then
      raise exception 'Items cannot be donated before 30 days';
    end if;
  end if;

  if new.status = 'moved-storage' and old.status is distinct from 'moved-storage' then
    if age_days < 14 and coalesce(new.override_note, '') = '' then
      raise exception 'Items stay at the desk for 14 days unless a supervisor records an override';
    end if;
  end if;

  return new;
end;
$$;

create trigger found_items_guard_update
  before update on public.found_items
  for each row execute function private.guard_item_update();

create or replace function private.after_found_item_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claim_row public.claims;
  desk_name text;
begin
  if new.status is not distinct from old.status
     and new.storage_spot is not distinct from old.storage_spot then
    return new;
  end if;

  select name into desk_name from public.desks where id = new.desk_id;

  if new.status = 'picked-up' and old.status is distinct from 'picked-up' then
    update public.claims
    set status = 'completed'
    where item_id = new.id and status in ('approved', 'pending', 'contested');

    for claim_row in
      select * from public.claims where item_id = new.id and status = 'completed'
    loop
      perform private.notify(
        claim_row.claimant_id,
        'claim_approved',
        'Pickup completed',
        'Your item was handed over at ' || coalesce(desk_name, 'the desk') || '.',
        new.id, null, claim_row.pickup_code
      );
    end loop;

    if new.finder_id is not null then
      perform private.notify(
        new.finder_id,
        'dropoff_thanks',
        'The owner picked it up',
        'The ' || new.colour || ' ' || new.category || ' you turned in was returned. Thank you.',
        new.id, null, null
      );
    end if;

    perform private.add_timeline(new.id, null, 'picked-up', 'Item returned to the owner.', 'public');
  elsif new.status = 'available' and old.status = 'in-transit' then
    perform private.add_timeline(
      new.id, null, 'intake',
      'Desk accepted the drop-off' || coalesce(' into ' || new.storage_spot, '') || '.',
      'public'
    );
  elsif new.status = 'moved-storage' and old.status is distinct from 'moved-storage' then
    perform private.add_timeline(new.id, null, 'moved', 'Moved to long-term storage.', 'staff');
  elsif new.status = 'donated' and old.status is distinct from 'donated' then
    perform private.add_timeline(new.id, null, 'donated', 'Released from lost and found.', 'staff');
  end if;

  return new;
end;
$$;

create trigger found_items_after_update
  after update on public.found_items
  for each row execute function private.after_found_item_update();

create or replace function private.after_secret_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.found_items;
  owner public.profiles;
  desk_name text;
begin
  if coalesce(new.watcard_name, '') = '' then
    return new;
  end if;

  select * into item from public.found_items where id = new.item_id;
  select name into desk_name from public.desks where id = item.desk_id;

  for owner in
    select * from public.profiles
    where lower(full_name) = lower(new.watcard_name)
  loop
    perform private.notify(
      owner.id,
      'watcard_found',
      'Your WatCard was turned in',
      'A WatCard with your name is at ' || coalesce(desk_name, 'a campus desk') || '. Sign in to claim it.',
      item.id, null, null
    );
  end loop;

  perform private.add_timeline(
    item.id, null, 'watcard-name',
    'Staff recorded the name on a WatCard. The name is hidden from public listings.',
    'staff'
  );
  return new;
end;
$$;

create trigger secrets_after_insert
  after insert on public.found_item_secrets
  for each row execute function private.after_secret_insert();

create or replace function private.prepare_claim()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.found_items;
  active_count integer;
  week_start date;
  used integer;
  attempt integer;
begin
  new.claimant_id := (select auth.uid());
  if new.claimant_id is null then
    raise exception 'Sign in before claiming an item';
  end if;

  select * into item from public.found_items where id = new.item_id;
  if not found then
    raise exception 'Item not found';
  end if;
  if item.status in ('picked-up', 'donated') then
    raise exception 'This item is no longer available';
  end if;

  select count(*) into active_count
  from public.claims
  where item_id = new.item_id
    and status in ('pending', 'approved', 'contested');

  if item.valuable or item.status in ('reserved', 'under-review', 'ready-pickup') or active_count > 0 then
    new.status := 'pending';
    new.is_contested := active_count > 0 or item.status in ('reserved', 'ready-pickup');
    new.pickup_code := null;
    update public.found_items set status = 'under-review' where id = item.id;
    if new.is_contested then
      update public.claims
      set is_contested = true,
          status = case when status = 'approved' then 'contested' else status end
      where item_id = item.id
        and status in ('pending', 'approved');
    end if;
  else
    select claims_week_start, claims_used_this_week
      into week_start, used
    from public.profiles
    where id = new.claimant_id;

    if week_start < (date_trunc('week', timezone('America/Toronto', now())))::date then
      used := 0;
      update public.profiles
      set claims_used_this_week = 0,
          claims_week_start = (date_trunc('week', timezone('America/Toronto', now())))::date
      where id = new.claimant_id;
    end if;

    if used >= 3 then
      raise exception 'Weekly instant claim limit reached';
    end if;

    new.status := 'approved';
    new.is_contested := false;
    new.hold_expires_at := now() + interval '7 days';
    for attempt in 1..5 loop
      new.pickup_code := private.make_code('WLO');
      exit when not exists (select 1 from public.claims where pickup_code = new.pickup_code);
    end loop;

    update public.profiles
    set claims_used_this_week = used + 1
    where id = new.claimant_id;

    update public.found_items set status = 'reserved' where id = item.id;
  end if;

  return new;
end;
$$;

create trigger claims_prepare
  before insert on public.claims
  for each row execute function private.prepare_claim();

create or replace function private.after_claim_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.found_items;
  desk_name text;
begin
  select * into item from public.found_items where id = new.item_id;
  select name into desk_name from public.desks where id = item.desk_id;

  if new.status = 'approved' then
    perform private.notify(
      new.claimant_id, 'claim_approved', 'Instant claim confirmed',
      'Reserved at ' || coalesce(desk_name, 'the desk') || '. Pickup code ' || coalesce(new.pickup_code, '') || '.',
      new.item_id, null, new.pickup_code
    );
    perform private.add_timeline(new.item_id, null, 'claimed', 'Student claimed this item and received a pickup code.', 'public');
  else
    perform private.notify(
      new.claimant_id, 'claim_approved', 'Claim sent for review',
      'Staff at ' || coalesce(desk_name, 'the desk') || ' will check your ownership details.',
      new.item_id, null, null
    );
    perform private.add_timeline(
      new.item_id, null, 'claim-review',
      case when new.is_contested then 'A second student contested this item.' else 'Valuable-item claim sent to staff.' end,
      'staff'
    );
  end if;
  return new;
end;
$$;

create trigger claims_after_insert
  after insert on public.claims
  for each row execute function private.after_claim_insert();

create or replace function private.prepare_claim_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  desk text;
  attempt integer;
begin
  select desk_id into desk from public.found_items where id = old.item_id;
  if desk is null then
    raise exception 'Claim is missing its item';
  end if;

  if new.status = 'approved' and old.status in ('pending', 'contested') then
    if new.pickup_code is null then
      for attempt in 1..5 loop
        new.pickup_code := private.make_code('WLO');
        exit when not exists (select 1 from public.claims where pickup_code = new.pickup_code);
      end loop;
    end if;
    new.hold_expires_at := coalesce(new.hold_expires_at, now() + interval '7 days');
  end if;
  return new;
end;
$$;

create trigger claims_prepare_update
  before update on public.claims
  for each row execute function private.prepare_claim_update();

create or replace function private.after_claim_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item public.found_items;
  desk_name text;
  still_active integer;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select * into item from public.found_items where id = new.item_id;
  select name into desk_name from public.desks where id = item.desk_id;

  if new.status = 'approved' then
    update public.found_items set status = 'ready-pickup' where id = new.item_id;
    perform private.notify(
      new.claimant_id, 'claim_approved', 'Claim approved',
      'Pickup code ' || coalesce(new.pickup_code, '') || ' at ' || coalesce(desk_name, 'the desk') || '.',
      new.item_id, null, new.pickup_code
    );
    perform private.add_timeline(new.item_id, null, 'approved', 'Staff approved the claim.', 'public');
  elsif new.status = 'rejected' then
    select count(*) into still_active
    from public.claims
    where item_id = new.item_id and id <> new.id and status in ('pending', 'approved', 'contested');
    if still_active = 0 then
      update public.found_items set status = 'available' where id = new.item_id;
    end if;
    perform private.notify(
      new.claimant_id, 'claim_rejected', 'Claim not approved',
      coalesce(new.staff_notes, 'Staff could not confirm ownership.') || ' You can visit the desk with photo ID.',
      new.item_id, null, null
    );
    perform private.add_timeline(new.item_id, null, 'rejected', 'Staff rejected a claim.', 'staff');
  end if;
  return new;
end;
$$;

create trigger claims_after_update
  after update on public.claims
  for each row execute function private.after_claim_update();

create or replace function private.prepare_lost_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before saving a lost report';
  end if;
  new.owner_id := (select auth.uid());
  if new.status is null then
    new.status := 'active';
  end if;
  return new;
end;
$$;

create trigger lost_reports_prepare
  before insert on public.lost_reports
  for each row execute function private.prepare_lost_report();

create or replace function private.after_lost_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.add_timeline(null, new.id, 'lost-reported', 'Student reported this item as lost.', 'public');
  perform private.refresh_report_matches(new.id);
  return new;
end;
$$;

create trigger lost_reports_after_insert
  after insert on public.lost_reports
  for each row execute function private.after_lost_report();

create or replace function private.guard_match_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  if new.status is not distinct from old.status then
    new.confidence := old.confidence;
    new.reasons := old.reasons;
    new.differences := old.differences;
    return new;
  end if;

  if new.status not in ('confirmed', 'rejected') then
    raise exception 'Invalid match status';
  end if;

  select owner_id into owner from public.lost_reports where id = old.lost_report_id;
  if owner is distinct from (select auth.uid()) and not (select private.is_staff()) then
    raise exception 'Only the owner can confirm or reject a match';
  end if;

  new.confidence := old.confidence;
  new.reasons := old.reasons;
  new.differences := old.differences;
  new.lost_report_id := old.lost_report_id;
  new.found_item_id := old.found_item_id;
  return new;
end;
$$;

create trigger matches_guard
  before update on public.item_matches
  for each row execute function private.guard_match_update();

create or replace function private.prepare_return_tag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before creating a return tag';
  end if;
  new.owner_id := (select auth.uid());
  if coalesce(new.code, '') = '' then
    for attempt in 1..5 loop
      new.code := private.make_code('WAT');
      exit when not exists (select 1 from public.return_tags where code = new.code);
    end loop;
  end if;
  return new;
end;
$$;

create trigger return_tags_prepare
  before insert on public.return_tags
  for each row execute function private.prepare_return_tag();

create or replace function private.prepare_tag_scan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in before scanning a return tag';
  end if;
  if not exists (select 1 from public.return_tags where code = new.code and active) then
    raise exception 'Unknown return tag';
  end if;
  new.scanner_id := (select auth.uid());
  return new;
end;
$$;

create trigger tag_scans_prepare
  before insert on public.tag_scans
  for each row execute function private.prepare_tag_scan();

create or replace function private.after_tag_scan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  tag public.return_tags;
begin
  select * into tag from public.return_tags where code = new.code and active;
  perform private.notify(
    tag.owner_id,
    'match_alert',
    'Someone scanned your return tag',
    'A finder scanned ' || tag.code || ' for your ' || tag.label || '. Your contact details stayed private.',
    null, null, tag.code
  );
  return new;
end;
$$;

create trigger tag_scans_after
  after insert on public.tag_scans
  for each row execute function private.after_tag_scan();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.desks enable row level security;
alter table public.buildings enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_redemptions enable row level security;
alter table public.found_items enable row level security;
alter table public.found_item_secrets enable row level security;
alter table public.claims enable row level security;
alter table public.lost_reports enable row level security;
alter table public.item_matches enable row level security;
alter table public.return_tags enable row level security;
alter table public.tag_scans enable row level security;
alter table public.notifications enable row level security;
alter table public.timeline_events enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.desks, public.buildings to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, student_id) on public.profiles to authenticated;

grant select on public.found_items to anon, authenticated;
grant insert on public.found_items to authenticated;
grant update on public.found_items to authenticated;

grant select, insert on public.found_item_secrets to authenticated;

grant select, insert on public.claims to authenticated;
grant update (status, staff_notes) on public.claims to authenticated;

grant select, insert, update on public.lost_reports to authenticated;

grant select on public.item_matches to authenticated;
grant update (status) on public.item_matches to authenticated;

grant select, insert, update on public.return_tags to authenticated;

grant insert on public.tag_scans to authenticated;
grant select on public.tag_scans to authenticated;

grant select, insert on public.staff_redemptions to authenticated;

grant select on public.notifications to authenticated;
grant update (read) on public.notifications to authenticated;

grant select on public.timeline_events to anon, authenticated;

create policy desks_read on public.desks for select to anon, authenticated using (true);
create policy buildings_read on public.buildings for select to anon, authenticated using (true);

create policy profiles_read on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_staff())
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy staff_redemptions_insert on public.staff_redemptions
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy staff_redemptions_read on public.staff_redemptions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy found_items_read on public.found_items
  for select to anon, authenticated
  using (true);

create policy found_items_insert on public.found_items
  for insert to authenticated
  with check ((select auth.uid()) is not null);

create policy found_items_update on public.found_items
  for update to authenticated
  using ((select private.can_manage_item(desk_id)))
  with check ((select private.can_manage_item(desk_id)));

create policy secrets_read on public.found_item_secrets
  for select to authenticated
  using (
    (select private.can_manage_item((
      select f.desk_id from public.found_items f where f.id = item_id
    )))
  );

create policy secrets_insert on public.found_item_secrets
  for insert to authenticated
  with check (
    (select private.is_staff())
    or exists (
      select 1 from public.found_items f
      where f.id = item_id and f.finder_id = (select auth.uid())
    )
  );

create policy claims_read on public.claims
  for select to authenticated
  using (
    claimant_id = (select auth.uid())
    or (select private.can_manage_item((
      select f.desk_id from public.found_items f where f.id = item_id
    )))
  );

create policy claims_insert on public.claims
  for insert to authenticated
  with check (claimant_id = (select auth.uid()));

create policy claims_update on public.claims
  for update to authenticated
  using (
    (select private.can_manage_item((
      select f.desk_id from public.found_items f where f.id = item_id
    )))
  )
  with check (
    (select private.can_manage_item((
      select f.desk_id from public.found_items f where f.id = item_id
    )))
  );

create policy reports_read on public.lost_reports
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_staff()));

create policy reports_insert on public.lost_reports
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy reports_update on public.lost_reports
  for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_staff()))
  with check (owner_id = (select auth.uid()) or (select private.is_staff()));

create policy matches_read on public.item_matches
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.lost_reports r
      where r.id = lost_report_id and r.owner_id = (select auth.uid())
    )
  );

create policy matches_update on public.item_matches
  for update to authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.lost_reports r
      where r.id = lost_report_id and r.owner_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_staff())
    or exists (
      select 1 from public.lost_reports r
      where r.id = lost_report_id and r.owner_id = (select auth.uid())
    )
  );

create policy tags_read on public.return_tags
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_staff()));

create policy tags_insert on public.return_tags
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy tags_update on public.return_tags
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy scans_insert on public.tag_scans
  for insert to authenticated
  with check (scanner_id = (select auth.uid()));

create policy scans_read on public.tag_scans
  for select to authenticated
  using (
    scanner_id = (select auth.uid())
    or (select private.is_staff())
    or exists (
      select 1 from public.return_tags t
      where t.code = tag_scans.code and t.owner_id = (select auth.uid())
    )
  );

create policy notifications_read on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy timeline_read on public.timeline_events
  for select to anon, authenticated
  using (
    visibility = 'public'
    or (select private.is_staff())
    or actor_id = (select auth.uid())
    or exists (
      select 1 from public.lost_reports r
      where r.id = report_id and r.owner_id = (select auth.uid())
    )
  );

revoke all on function private.make_code(text) from public, anon, authenticated;
revoke all on function private.notify(uuid, text, text, text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function private.add_timeline(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function private.feature_tokens(text) from public, anon, authenticated;
revoke all on function private.compute_score(public.lost_reports, public.found_items) from public, anon, authenticated;
revoke all on function private.remember_match(public.lost_reports, public.found_items) from public, anon, authenticated;
revoke all on function private.refresh_item_matches(uuid) from public, anon, authenticated;
revoke all on function private.refresh_report_matches(uuid) from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.apply_staff_code() from public, anon, authenticated;
revoke all on function private.prepare_found_item() from public, anon, authenticated;
revoke all on function private.after_found_item_insert() from public, anon, authenticated;
revoke all on function private.guard_item_update() from public, anon, authenticated;
revoke all on function private.after_found_item_update() from public, anon, authenticated;
revoke all on function private.after_secret_insert() from public, anon, authenticated;
revoke all on function private.prepare_claim() from public, anon, authenticated;
revoke all on function private.after_claim_insert() from public, anon, authenticated;
revoke all on function private.prepare_claim_update() from public, anon, authenticated;
revoke all on function private.after_claim_update() from public, anon, authenticated;
revoke all on function private.prepare_lost_report() from public, anon, authenticated;
revoke all on function private.after_lost_report() from public, anon, authenticated;
revoke all on function private.guard_match_update() from public, anon, authenticated;
revoke all on function private.prepare_return_tag() from public, anon, authenticated;
revoke all on function private.prepare_tag_scan() from public, anon, authenticated;
revoke all on function private.after_tag_scan() from public, anon, authenticated;

grant execute on function private.is_staff() to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.staff_desk() to anon, authenticated;
grant execute on function private.can_manage_item(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public photos for ordinary items, private photos for valuables
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-photos', 'public-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('private-photos', 'private-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy public_photo_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'public-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy private_photo_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'private-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy private_photo_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'private-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or owner_id = (select auth.uid())::text
      or (select private.is_staff())
    )
  );

-- ---------------------------------------------------------------------------
-- Campus desks and staff invite codes
-- ---------------------------------------------------------------------------

insert into public.desks (id, name, building, room, hours, description, phone, map_x, map_y) values
  ('slc', 'SLC Front Desk', 'Student Life Centre (SLC)', 'Level 1, Main Concourse', 'Open 24 hours / 7 days a week', 'Central campus hub, next to Campus Police.', '519-888-4567 ext. 33145', 48, 46),
  ('dc', 'DC Library', 'William G. Davis Centre (DC)', 'Information Desk, Ground Floor', 'Mon–Sun: 8:00 AM – 11:00 PM', 'STEM and engineering library desk.', '519-888-4567 ext. 32647', 62, 38),
  ('dp', 'Dana Porter Library', 'Dana Porter Library (DP)', 'Main Circulation Desk, 1st Floor', 'Mon–Sun: 8:00 AM – 11:00 PM', 'Arts and humanities library desk.', '519-888-4567 ext. 32281', 30, 42),
  ('pac', 'PAC Equipment Desk', 'Physical Activities Complex (PAC)', 'Athletics Service Hub', 'Mon–Fri: 6:30 AM – 10:30 PM', 'Gym and recreation lost and found.', '519-888-4567 ext. 33582', 70, 62),
  ('rev', 'REV Front Desk', 'Ron Eydt Village (REV)', 'Main Residence Reception', 'Open 24 hours / 7 days a week', 'Residence lost and found.', '519-888-4567 ext. 32412', 18, 70);

insert into public.buildings (id, name, short_name, map_x, map_y, desk_id) values
  ('slc', 'Student Life Centre', 'SLC', 48, 46, 'slc'),
  ('dc', 'Davis Centre Library', 'DC', 62, 38, 'dc'),
  ('dp', 'Dana Porter Library', 'DP', 30, 42, 'dp'),
  ('pac', 'Physical Activities Complex', 'PAC', 70, 62, 'pac'),
  ('rev', 'Ron Eydt Village', 'REV', 18, 70, 'rev'),
  ('e7', 'Engineering 7', 'E7', 74, 28, 'dc'),
  ('mc', 'Mathematics & Computer', 'MC', 56, 30, 'dc');

insert into private.staff_invites (code, role, desk_id) values
  ('SLC-STAFF-2026', 'staff', 'slc'),
  ('DC-STAFF-2026', 'staff', 'dc'),
  ('DP-STAFF-2026', 'staff', 'dp'),
  ('PAC-STAFF-2026', 'staff', 'pac'),
  ('REV-STAFF-2026', 'staff', 'rev'),
  ('CAMPUS-ADMIN-2026', 'admin', null);
