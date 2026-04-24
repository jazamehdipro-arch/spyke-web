-- Additional analytics views: grouped page views + top pages

-- Page views by day and by group (blog + 3 SEO pages devis/facture/contrat)
create or replace view public.analytics_page_views_daily_grouped as
select
  date_trunc('day', created_at)::date as day,
  case
    when path like '/blog/%' then 'blog'
    when path = '/devis-freelance' then 'seo_devis'
    when path = '/facture-auto-entrepreneur' then 'seo_facture'
    when path = '/contrat-freelance' then 'seo_contrat'
    else 'other'
  end as page_group,
  count(*) as page_views
from public.analytics_events
where event_name = 'page_view'
  and path is not null
group by 1, 2
order by 1 desc, 2;

-- Top pages in the last 7 days (focus on blog + the 3 SEO pages)
create or replace view public.analytics_top_pages_7d as
select
  path,
  count(*) as page_views
from public.analytics_events
where event_name = 'page_view'
  and path is not null
  and created_at >= now() - interval '7 days'
  and (
    path like '/blog/%'
    or path in ('/devis-freelance', '/facture-auto-entrepreneur', '/contrat-freelance')
  )
group by 1
order by 2 desc, 1 asc;
