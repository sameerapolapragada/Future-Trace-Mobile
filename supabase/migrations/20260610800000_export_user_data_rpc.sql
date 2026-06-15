-- GDPR data portability: authenticated users can export their own data bundle.
begin;

create or replace function public.export_user_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  bundle jsonb;
begin
  if actor is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'user_id', actor,
    'profile', (
      select to_jsonb(p)
      from public.profiles p
      where p.id = actor
    ),
    'user_entitlements', (
      select to_jsonb(ue)
      from public.user_entitlements ue
      where ue.user_id = actor
    ),
    'subscriptions', coalesce(
      (
        select jsonb_agg(to_jsonb(s) order by s.created_at desc)
        from public.subscriptions s
        where s.user_id = actor
      ),
      '[]'::jsonb
    ),
    'career_scans', coalesce(
      (
        select jsonb_agg(
          to_jsonb(cs) || jsonb_build_object(
            'scan_inputs',
            (
              select to_jsonb(si)
              from public.scan_inputs si
              where si.scan_id = cs.id
            )
          )
          order by cs.created_at desc
        )
        from public.career_scans cs
        where cs.user_id = actor
      ),
      '[]'::jsonb
    ),
    'career_xrays', coalesce(
      (
        select jsonb_agg(to_jsonb(cx) order by cx.created_at desc)
        from public.career_xrays cx
        where cx.user_id = actor
      ),
      '[]'::jsonb
    ),
    'career_goals', coalesce(
      (
        select jsonb_agg(to_jsonb(cg) order by cg.created_at desc)
        from public.career_goals cg
        where cg.user_id = actor
      ),
      '[]'::jsonb
    ),
    'weekly_milestones', coalesce(
      (
        select jsonb_agg(to_jsonb(wm) order by wm.start_date asc)
        from public.weekly_milestones wm
        where wm.user_id = actor
      ),
      '[]'::jsonb
    ),
    'milestone_tasks', coalesce(
      (
        select jsonb_agg(to_jsonb(mt) order by mt.created_at asc)
        from public.milestone_tasks mt
        where mt.user_id = actor
      ),
      '[]'::jsonb
    ),
    'transition_notifications', coalesce(
      (
        select jsonb_agg(to_jsonb(tn) order by tn.created_at desc)
        from public.transition_notifications tn
        where tn.user_id = actor
      ),
      '[]'::jsonb
    ),
    'user_consents', coalesce(
      (
        select jsonb_agg(to_jsonb(uc) order by uc.granted_at desc)
        from public.user_consents uc
        where uc.user_id = actor
      ),
      '[]'::jsonb
    )
  )
  into bundle;

  perform public.log_compliance_event('DATA_EXPORT');

  return bundle;
end;
$$;

revoke all on function public.export_user_data() from public;
grant execute on function public.export_user_data() to authenticated;

commit;
