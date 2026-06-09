-- Compliance note: snapshot writes for paid/generated should also be allowed via service role (BFF/webhook).
-- Client may update paid -> generated when calling generate API after payment confirmation.
begin;

comment on table public.career_xray_snapshots is
  'One row per Career X-Ray one-time purchase. Not a permanent user entitlement.';

commit;
