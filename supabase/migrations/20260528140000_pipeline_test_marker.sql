-- Visible pipeline test: query with
--   select * from public.app_metadata where key = 'dev_pipeline_test';

insert into public.app_metadata (key, value, updated_at)
values (
  'dev_pipeline_test',
  'connected-via-github-dev-branch',
  now()
)
on conflict (key) do update
  set
    value = excluded.value,
    updated_at = excluded.updated_at;

-- Ensure prior migration column exists (idempotent)
alter table public.plans
  add column if not exists description text;

update public.plans
set description = tagline
where description is null;
