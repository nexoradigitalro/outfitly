-- Storage buckets (docs/ARCHITECTURE.md §9). Path convention for every
-- private bucket: "{profile_id}/{filename}" — RLS checks the first path
-- segment against auth.uid(), so ownership is enforced at the storage layer
-- itself, not just in application code.

insert into storage.buckets (id, name, public) values
  ('closet-original', 'closet-original', false),
  ('closet-processed', 'closet-processed', false),
  ('body-photos', 'body-photos', false),
  ('avatars', 'avatars', false),
  ('outfit-renders', 'outfit-renders', false),
  ('public-shares', 'public-shares', true);

-- Private, owner-only buckets: read/write/delete only within your own folder.
create policy "closet_original_owner_all" on storage.objects for all
  using (bucket_id = 'closet-original' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'closet-original' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "closet_processed_owner_all" on storage.objects for all
  using (bucket_id = 'closet-processed' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'closet-processed' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "body_photos_owner_all" on storage.objects for all
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_all" on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "outfit_renders_owner_all" on storage.objects for all
  using (bucket_id = 'outfit-renders' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'outfit-renders' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public bucket: anyone can read (that's the point of a share link); only
-- the owner can write/delete their own shared copy. Writes in practice go
-- through a server-side function, but the policy still scopes by folder.
create policy "public_shares_read_all" on storage.objects for select
  using (bucket_id = 'public-shares');

create policy "public_shares_owner_write" on storage.objects for insert
  with check (bucket_id = 'public-shares' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public_shares_owner_delete" on storage.objects for delete
  using (bucket_id = 'public-shares' and (storage.foldername(name))[1] = auth.uid()::text);
