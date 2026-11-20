-- Staff log every found item. The database assigns an item code.
-- A desk handoff archives the item. Archived rows older than 4 months are deleted.
-- Students no longer insert items, claims, holds, or pickup statuses.

alter table public.found_items
  add column if not exists item_code text,
  add column if not exists archived_at timestamptz,
  add column if not exists returned_watid text;

-- Existing rows need a code before the column can be required.
do $$
declare
  row record;
  attempt integer;
  next_code text;
begin
  for row in select id from public.found_items where item_code is null loop
    next_code := null;
    for attempt in 1..8 loop
      next_code := private.make_code('ITM');
      exit when not exists (select 1 from public.found_items where item_code = next_code);
    end loop;
    update public.found_items set item_code = next_code where id = row.id;
  end loop;
end $$;

-- Closed rows leave the active desk list. This runs before the new update guard.
update public.found_items
set archived_at = coalesce(archived_at, now())
where archived_at is null
  and status in ('picked-up', 'donated', 'moved-storage');

alter table public.found_items alter column item_code set not null;

create unique index if not exists found_items_item_code_idx on public.found_items (item_code);
create index if not exists found_items_archived_idx on public.found_items (archived_at);

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
  if not (select private.is_staff()) then
    raise exception 'Only staff can log a found item';
  end if;
  if not (select private.is_admin())
     and (select private.staff_desk()) is not null
     and (select private.staff_desk()) is distinct from new.desk_id then
    raise exception 'You can only log items for your assigned desk';
  end if;
  if new.valuable and new.image_bucket = 'public-photos' then
    raise exception 'Photos of valuable items stay in private storage';
  end if;

  new.logged_by := (select auth.uid());
  new.finder_id := null;
  new.status := 'available';
  new.archived_at := null;
  new.returned_watid := null;
  new.drop_off_code := null;
  new.logged_at := now();

  if coalesce(new.item_code, '') = '' then
    for attempt in 1..8 loop
      new.item_code := private.make_code('ITM');
      exit when not exists (
        select 1 from public.found_items where item_code = new.item_code
      );
    end loop;
  end if;

  if coalesce(new.item_code, '') = '' then
    raise exception 'Could not assign an item code';
  end if;

  return new;
end;
$$;

create or replace function private.guard_item_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.item_code := old.item_code;
  new.logged_at := old.logged_at;
  new.logged_by := old.logged_by;

  if old.archived_at is not null then
    raise exception 'Archived items cannot be changed';
  end if;

  if new.archived_at is not null then
    if coalesce(btrim(new.returned_watid), '') = '' then
      raise exception 'Enter the WATID you checked on the ID';
    end if;
    new.returned_watid := btrim(new.returned_watid);
    new.status := 'picked-up';
  end if;

  return new;
end;
$$;

drop policy if exists found_items_insert on public.found_items;
create policy found_items_insert on public.found_items
  for insert to authenticated
  with check ((select private.is_staff()));

create or replace function private.purge_old_archive()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed integer;
begin
  if not (select private.is_staff()) then
    raise exception 'Only staff can clean the archive';
  end if;

  delete from public.found_items
  where archived_at is not null
    and archived_at < now() - interval '4 months';

  get diagnostics removed = row_count;
  return removed;
end;
$$;

create or replace function public.purge_old_archive()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return private.purge_old_archive();
end;
$$;

revoke all on function private.purge_old_archive() from public, anon;
grant execute on function private.purge_old_archive() to authenticated;
grant execute on function public.purge_old_archive() to authenticated;
revoke all on function public.purge_old_archive() from anon;

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
      'A WatCard with your name is at ' || coalesce(desk_name, 'a campus desk')
        || '. Go there with item code ' || coalesce(item.item_code, '') || ' and your WATID.',
      item.id, null, null
    );
  end loop;

  return new;
end;
$$;
