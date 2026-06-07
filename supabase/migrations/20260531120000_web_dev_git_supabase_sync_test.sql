-- Git → Supabase sync test (Web-Dev branch)
-- Verify after push:
--   select * from public.web_dev_git_sync_log order by created_at desc limit 5;

create table if not exists public.web_dev_git_sync_log (
  id serial primary key,
  source text not null,
  created_at timestamptz not null default now()
);

insert into public.web_dev_git_sync_log (source)
values ('github-web-dev-sync-' || to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
