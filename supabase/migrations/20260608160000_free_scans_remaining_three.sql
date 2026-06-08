-- Free-tier users get 3 lifetime Career Scans (was 1)

begin;

alter table public.user_entitlements
  alter column free_scans_remaining set default 3;

-- Reset quota for existing free-tier users (no X-Ray / Radar purchase)
update public.user_entitlements
set free_scans_remaining = 3
where not has_career_xray
  and not has_radar;

commit;
