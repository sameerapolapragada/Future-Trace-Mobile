-- Reference data: plans (safe to re-run with ON CONFLICT)
insert into public.plans (id, label, tagline, price_cents, price_interval, sort_order)
values
  ('free', 'Free', 'Explore AI history and check your exposure score.', 0, 'month', 0),
  ('pro', 'Pro', 'Deeper insights and priority updates as AI shifts accelerate.', 1200, 'month', 1)
on conflict (id) do update set
  label = excluded.label,
  tagline = excluded.tagline,
  price_cents = excluded.price_cents,
  price_interval = excluded.price_interval,
  sort_order = excluded.sort_order;

delete from public.plan_features where plan_id in ('free', 'pro');

insert into public.plan_features (plan_id, feature_text, sort_order)
values
  ('free', 'AI evolution timeline (all milestones)', 0),
  ('free', 'AI job exposure score', 1),
  ('free', 'Search milestones & topics', 2),
  ('pro', 'Everything in Free', 0),
  ('pro', 'Personalized risk breakdowns', 1),
  ('pro', 'Industry-specific score context', 2),
  ('pro', 'Early access to new milestones', 3),
  ('pro', 'Export & share score reports', 4),
  ('pro', 'Priority model refresh alerts', 5);

insert into public.app_metadata (key, value, updated_at)
values ('timeline_last_updated', 'Last updated May 2026', now())
on conflict (key) do update set
  value = excluded.value,
  updated_at = excluded.updated_at;
