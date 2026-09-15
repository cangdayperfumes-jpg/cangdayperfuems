-- 1. Create the 'products' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. Allow Public Read Access
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'products' );

-- 3. Allow Authenticated Users (Admins) to Upload
drop policy if exists "Admin Upload" on storage.objects;
create policy "Admin Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'products' );

-- 4. Allow Authenticated Users (Admins) to Update/Delete (Optional but good)
drop policy if exists "Admin Update" on storage.objects;
create policy "Admin Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'products' );

drop policy if exists "Admin Delete" on storage.objects;
create policy "Admin Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'products' );
