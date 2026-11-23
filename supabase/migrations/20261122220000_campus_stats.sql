-- Embeddings compare a logged item with a student's structured description.
-- Public totals only. Individual reports and owners stay private.

create extension if not exists vector with schema extensions;

alter table public.found_items
  add column if not exists embedding extensions.vector(768);

alter table public.lost_reports
  add column if not exists embedding extensions.vector(768);

revoke select (embedding), insert (embedding), update (embedding)
  on public.found_items from public, anon, authenticated;
revoke select (embedding), insert (embedding), update (embedding)
  on public.lost_reports from public, anon, authenticated;

create or replace function public.campus_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with recent as (
    select category, count(*)::integer as n
    from public.lost_reports
    where created_at >= now() - interval '7 days'
    group by category
  ),
  top_row as (
    select category, n
    from recent
    order by n desc, category
    limit 1
  )
  select jsonb_build_object(
    'top_category', (select category from top_row),
    'top_count', coalesce((select n from top_row), 0),
    'lost_last_week', coalesce((select sum(n) from recent), 0),
    'returned_total', (
      select count(*)::integer
      from public.found_items
      where archived_at is not null or status = 'picked-up'
    ),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('category', category, 'count', n) order by n desc, category)
      from recent
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.campus_stats() from public;
grant execute on function public.campus_stats() to anon, authenticated;

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

-- Show the embedding similarity percent next to the structured-field reasons.
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
  report_colour text := btrim(coalesce(report.colour, ''));
  item_colour text := btrim(coalesce(item.colour, ''));
  similar_pct text;
begin
  same_category := lower(report.category) is not distinct from lower(item.category);

  if report.embedding is not null and item.embedding is not null then
    image_sim := 1 - (report.embedding operator(extensions.<=>) item.embedding);
    similar_pct := round(image_sim * 100)::text || '% similar';
  end if;

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

  if report_colour <> '' and item_colour <> '' then
    if lower(report_colour) = lower(item_colour) then
      score := score + 18;
      why := why || jsonb_build_array('Same colour');
    elsif position(lower(report_colour) in lower(item_colour)) > 0
       or position(lower(item_colour) in lower(report_colour)) > 0 then
      score := score + 8;
      why := why || jsonb_build_array('Similar colour');
    else
      diffs := diffs || jsonb_build_array('Different colour');
    end if;
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

  if image_sim is not null and image_sim >= 0.60 then
    if coalesce(report.image_path, '') <> '' and coalesce(item.image_path, '') <> '' then
      visual := 'Photos look alike';
    elsif coalesce(report.image_path, '') <> '' or coalesce(item.image_path, '') <> '' then
      visual := 'Photo matches the description';
    else
      visual := 'Structured details are similar';
    end if;

    if image_sim >= 0.88 then
      score := score + 42;
    elsif image_sim >= 0.80 then
      score := score + 28;
    elsif image_sim >= 0.72 then
      score := score + 14;
    else
      score := score + 8;
    end if;
    why := why || jsonb_build_array(visual || ' (' || similar_pct || ')');
  end if;

  confidence := least(100, greatest(0, score));
  reasons := why;
  differences := diffs;
  return next;
end;
$$;
