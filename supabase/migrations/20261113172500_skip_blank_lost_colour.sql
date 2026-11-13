-- A lost report can omit colour. An empty colour used to match every item,
-- because position('' in text) is 1. Treat a blank colour as "not provided".

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
  report_colour text := btrim(coalesce(report.colour, ''));
  item_colour text := btrim(coalesce(item.colour, ''));
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

  confidence := least(100, greatest(0, score));
  reasons := why;
  differences := diffs;
  return next;
end;
$$;
