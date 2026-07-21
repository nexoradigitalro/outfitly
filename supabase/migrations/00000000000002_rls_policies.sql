-- Row Level Security for all user-owned tables.
-- Rule (docs/ARCHITECTURE.md §9): every user-owned table gets RLS, no
-- exceptions. Anonymous (guest) sessions have a real auth.uid() just like
-- signed-in users, so these policies cover both without special-casing.

alter table profiles enable row level security;
alter table consent_events enable row level security;
alter table body_photos enable row level security;
alter table closet_items enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;
alter table worn_log enable row level security;
alter table collections enable row level security;
alter table collection_items enable row level security;
alter table subscriptions enable row level security;
alter table ai_generation_logs enable row level security;
alter table categories enable row level security;
alter table plans enable row level security;

-- profiles: a user can only read/update their own row. Insert happens only
-- via the handle_new_user() trigger (security definer), never directly.
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- consent_events: append-only from the client's perspective — insert your
-- own events, read your own history, never update/delete (audit trail).
create policy "consent_events_select_own" on consent_events for select using (auth.uid() = profile_id);
create policy "consent_events_insert_own" on consent_events for insert with check (auth.uid() = profile_id);

create policy "body_photos_all_own" on body_photos for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "closet_items_all_own" on closet_items for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "outfits_all_own" on outfits for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- outfit_items has no profile_id column directly — ownership is derived
-- through the parent outfit.
create policy "outfit_items_all_own" on outfit_items for all
  using (exists (select 1 from outfits o where o.id = outfit_id and o.profile_id = auth.uid()))
  with check (exists (select 1 from outfits o where o.id = outfit_id and o.profile_id = auth.uid()));

create policy "worn_log_all_own" on worn_log for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "collections_all_own" on collections for all
  using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "collection_items_all_own" on collection_items for all
  using (exists (select 1 from collections c where c.id = collection_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from collections c where c.id = collection_id and c.profile_id = auth.uid()));

-- subscriptions: readable by the owner; writes only via service-role
-- (Stripe webhook / Edge Function), never directly from the client — so
-- no insert/update policy is granted to authenticated users at all.
create policy "subscriptions_select_own" on subscriptions for select using (auth.uid() = profile_id);

-- ai_generation_logs: written only by Edge Functions (service role,
-- bypasses RLS); the owner can read their own history for transparency.
create policy "ai_generation_logs_select_own" on ai_generation_logs for select using (auth.uid() = profile_id);

-- categories / plans: shared reference data, readable by any authenticated
-- (including anonymous/guest) user, writable by nobody from the client.
create policy "categories_select_all" on categories for select using (auth.role() = 'authenticated');
create policy "plans_select_all" on plans for select using (auth.role() = 'authenticated');
