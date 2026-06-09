-- Allow dev checkout to unlock Radar / AI Career Transition without service role.
-- Flow: register_radar_checkout(session_id) on checkout start → fulfill_radar_checkout(session_id) after Stripe confirms payment.

begin;

create or replace function public.register_radar_checkout(p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_stripe_session_id is null or length(trim(p_stripe_session_id)) = 0 then
    raise exception 'session id required';
  end if;

  insert into public.purchases (
    user_id,
    product_id,
    status,
    amount_cents,
    stripe_checkout_session_id
  )
  values (uid, 'radar', 'pending', 999, trim(p_stripe_session_id))
  on conflict (stripe_checkout_session_id) do nothing;
end;
$$;

create or replace function public.fulfill_radar_checkout(p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  purchase_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  if p_stripe_session_id is null or length(trim(p_stripe_session_id)) = 0 then
    raise exception 'session id required';
  end if;

  select id into purchase_id
  from public.purchases
  where stripe_checkout_session_id = trim(p_stripe_session_id)
    and user_id = uid
    and product_id = 'radar'
  limit 1;

  if purchase_id is null then
    raise exception 'checkout session not found';
  end if;

  update public.purchases
  set status = 'completed', updated_at = now()
  where id = purchase_id
    and status <> 'completed';

  insert into public.user_entitlements (user_id, has_radar, subscription_expires_at)
  values (uid, true, now() + interval '1 month')
  on conflict (user_id) do update
  set has_radar = true,
      subscription_expires_at = excluded.subscription_expires_at,
      updated_at = now();
end;
$$;

revoke all on function public.register_radar_checkout(text) from public;
revoke all on function public.fulfill_radar_checkout(text) from public;
grant execute on function public.register_radar_checkout(text) to authenticated;
grant execute on function public.fulfill_radar_checkout(text) to authenticated;

commit;
