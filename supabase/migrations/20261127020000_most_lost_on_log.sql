-- Most lost last week counts items staff log, not handoffs or student reports.

create or replace function public.campus_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with recent as (
    select category, count(*)::integer as n
    from public.found_items
    where logged_at >= now() - interval '7 days'
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
