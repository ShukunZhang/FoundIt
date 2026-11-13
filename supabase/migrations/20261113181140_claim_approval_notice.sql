-- Staff approval already writes a pickup code. Make that notice explicit,
-- and publish it so a signed-in student receives it without reloading.

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
  code text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select * into item from public.found_items where id = new.item_id;
  select name into desk_name from public.desks where id = item.desk_id;

  if new.status = 'approved' then
    code := nullif(new.pickup_code, '');
    update public.found_items set status = 'ready-pickup' where id = new.item_id;
    perform private.notify(
      new.claimant_id,
      'claim_approved',
      'Your claim was approved',
      'Show pickup code ' || coalesce(code, '') || ' at ' || coalesce(desk_name, 'the desk') || '.',
      new.item_id,
      null,
      code
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

alter table public.notifications replica identity full;
alter table public.claims replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'claims'
    ) then
      alter publication supabase_realtime add table public.claims;
    end if;
  end if;
end $$;
