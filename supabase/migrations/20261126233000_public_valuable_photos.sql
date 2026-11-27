-- Every found-item photo is public, including keys, WatCards, electronics, and wallets.

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

update storage.buckets
set public = true
where id in ('public-photos', 'private-photos');

drop policy if exists private_photo_read on storage.objects;
create policy private_photo_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'private-photos');
