-- Visual and written reports share one 768-d Gemini embedding.
-- Cosine similarity is blended into the existing keyword score.

create extension if not exists vector with schema extensions;

alter table public.found_items
  add column embedding extensions.vector(768);

alter table public.lost_reports
  add column embedding extensions.vector(768);

-- Clients can read the rest of the row, but not copy a vector onto their own report.
revoke select (embedding), insert (embedding), update (embedding)
  on public.found_items from public, anon, authenticated;
revoke select (embedding), insert (embedding), update (embedding)
  on public.lost_reports from public, anon, authenticated;

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
  image_sim double precision := null;
  same_category boolean := false;
  visual text;
begin
  same_category := lower(report.category) is not distinct from lower(item.category);

  if report.embedding is not null and item.embedding is not null then
    image_sim := 1 - (report.embedding operator(extensions.<=>) item.embedding);
  end if;

  -- A category miss still drops a weak match. A strong embedding can carry it.
  if not same_category and (image_sim is null or image_sim < 0.82) then
    confidence := 0;
    reasons := '[]'::jsonb;
    differences := jsonb_build_array('Different category');
    return next;
    return;
  end if;

  if same_category then
    score := score + 28;
    why := why || jsonb_build_array('Same category');

    if coalesce(report.subcategory, '') <> '' and lower(report.subcategory) = lower(coalesce(item.subcategory, '')) then
      score := score + 12;
      why := why || jsonb_build_array('Same subcategory');
    elsif coalesce(report.subcategory, '') <> '' and coalesce(item.subcategory, '') <> '' then
      score := greatest(score - 8, 0);
      diffs := diffs || jsonb_build_array('Different subcategory');
    end if;
  else
    diffs := diffs || jsonb_build_array('Different category');
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

  if image_sim is not null and image_sim >= 0.72 then
    if coalesce(report.image_path, '') <> '' and coalesce(item.image_path, '') <> '' then
      visual := 'Photos look alike';
    elsif coalesce(report.image_path, '') <> '' or coalesce(item.image_path, '') <> '' then
      visual := 'Photo matches the description';
    else
      visual := 'Descriptions are similar';
    end if;

    if image_sim >= 0.88 then
      score := score + 42;
    elsif image_sim >= 0.80 then
      score := score + 28;
    else
      score := score + 14;
    end if;
    why := why || jsonb_build_array(visual);
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

  if scored.confidence >= 60 and not exists (
    select 1 from public.notifications n
    where n.user_id = report.owner_id
      and n.type = 'match_alert'
      and n.related_item_id = item.id
      and n.related_report_id = report.id
  ) then
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

create or replace function public.attach_match_embedding(
  target_kind text,
  target_id uuid,
  embedding text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  parsed extensions.vector;
begin
  if caller is null then
    raise exception 'Sign in before saving a match embedding';
  end if;

  parsed := embedding::extensions.vector;
  if extensions.vector_dims(parsed) <> 768 then
    raise exception 'Expected a 768-dimension embedding';
  end if;

  if target_kind = 'found' then
    if not exists (
      select 1 from public.found_items f
      where f.id = target_id
        and (
          f.finder_id = caller
          or f.logged_by = caller
          or (select private.is_staff())
        )
    ) then
      raise exception 'Not allowed';
    end if;

    update public.found_items
      set embedding = parsed
      where id = target_id;
    perform private.refresh_item_matches(target_id);
  elsif target_kind = 'lost' then
    if not exists (
      select 1 from public.lost_reports r
      where r.id = target_id
        and (r.owner_id = caller or (select private.is_staff()))
    ) then
      raise exception 'Not allowed';
    end if;

    update public.lost_reports
      set embedding = parsed
      where id = target_id;
    perform private.refresh_report_matches(target_id);
  else
    raise exception 'Unknown match target';
  end if;
end;
$$;

revoke all on function public.attach_match_embedding(text, uuid, text) from public, anon;
grant execute on function public.attach_match_embedding(text, uuid, text) to authenticated;
