-- Matcher subscription expiration on profiles + SQL verification helper

begin;

alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

comment on column public.profiles.subscription_expires_at is
  'UTC timestamp when web_tier pro access ends. Required for active $7.99/mo matcher subscription.';

create or replace function public.profile_matcher_subscription_active(
  p_web_tier text,
  p_subscription_expires_at timestamptz
)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(p_web_tier, 'free') = 'pro'
    and p_subscription_expires_at is not null
    and p_subscription_expires_at > timezone('utc', now());
$$;

comment on function public.profile_matcher_subscription_active(text, timestamptz) is
  'True when profiles.web_tier is pro and subscription_expires_at is in the future (UTC).';

-- Optional maintenance: call from a scheduled job to align web_tier after lapse.
create or replace function public.downgrade_expired_matcher_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.profiles
  set
    web_tier = 'free',
    is_premium = false
  where web_tier = 'pro'
    and subscription_expires_at is not null
    and subscription_expires_at <= timezone('utc', now());

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

commit;
