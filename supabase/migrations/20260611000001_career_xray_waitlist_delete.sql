-- Allow waitlist removal from Delete Data flow (Phase 1 — email-based, no auth)
create policy "career_xray_waitlist_delete_anon"
  on public.career_xray_waitlist
  for delete
  to anon, authenticated
  using (true);
