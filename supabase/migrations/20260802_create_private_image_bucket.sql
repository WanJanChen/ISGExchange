insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('support-images', 'support-images', false, 2097152, array['image/jpeg'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read own support images" on storage.objects;
drop policy if exists "Users can upload own support images" on storage.objects;
drop policy if exists "Users can update own support images" on storage.objects;
drop policy if exists "Users can delete own support images" on storage.objects;

create policy "Users can read own support images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'support-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own support images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'support-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own support images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'support-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'support-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own support images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'support-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
