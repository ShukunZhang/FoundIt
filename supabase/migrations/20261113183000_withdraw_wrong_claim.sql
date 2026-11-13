-- A student at pickup can cancel their own claim. The found item stays
-- logged, and this does not close or delete their lost report.

alter table public.claims drop constraint claims_status_check;
alter table public.claims add constraint claims_status_check
  check (status in ('pending', 'approved', 'rejected', 'completed', 'contested', 'withdrawn'));

create policy claims_withdraw on public.claims
  for update to authenticated
  using (
    claimant_id = (select auth.uid())
    and status in ('pending', 'approved', 'contested')
  )
  with check (
    claimant_id = (select auth.uid())
    and status = 'withdrawn'
  );

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
  if (select auth.uid()) = old.claimant_id and not (select private.is_staff()) then
    if old.status not in ('pending', 'approved', 'contested') or new.status is distinct from 'withdrawn' then
      raise exception 'You can only cancel your own open claim';
    end if;
    new.item_id := old.item_id;
    new.claimant_id := old.claimant_id;
    new.pickup_code := old.pickup_code;
    new.hold_expires_at := old.hold_expires_at;
    new.verification_answer := old.verification_answer;
    new.distinguishing_detail := old.distinguishing_detail;
    new.staff_notes := old.staff_notes;
    new.is_contested := old.is_contested;
    new.created_at := old.created_at;
    new.status := 'withdrawn';
    return new;
  end if;

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
  elsif new.status = 'withdrawn' then
    select count(*) into still_active
    from public.claims
    where item_id = new.item_id and id <> new.id and status in ('pending', 'approved', 'contested');
    if still_active = 0 and item.status in ('reserved', 'under-review', 'ready-pickup') then
      update public.found_items set status = 'available' where id = new.item_id;
    end if;
    perform private.notify(
      new.claimant_id,
      'claim_rejected',
      'Claim cancelled',
      'You cancelled this claim. The item stays at the desk, and your lost report is still active.',
      new.item_id,
      null,
      null
    );
    perform private.add_timeline(
      new.item_id,
      null,
      'wrong-claim',
      'Student said this is not their item. The claim was cancelled and the item stayed at the desk.',
      'public'
    );
  end if;
  return new;
end;
$$;
