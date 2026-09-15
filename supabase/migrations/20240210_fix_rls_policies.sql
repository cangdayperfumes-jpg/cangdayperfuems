-- Allow authenticated users (Admins) to manage categories
drop policy if exists "Enable insert for authenticated users only" on public.categories;
create policy "Enable insert for authenticated users only" on public.categories for insert to authenticated with check (true);

drop policy if exists "Enable update for authenticated users only" on public.categories;
create policy "Enable update for authenticated users only" on public.categories for update to authenticated using (true);

drop policy if exists "Enable delete for authenticated users only" on public.categories;
create policy "Enable delete for authenticated users only" on public.categories for delete to authenticated using (true);

-- Allow authenticated users (Admins) to manage products
drop policy if exists "Enable insert for authenticated users only" on public.products;
create policy "Enable insert for authenticated users only" on public.products for insert to authenticated with check (true);

drop policy if exists "Enable update for authenticated users only" on public.products;
create policy "Enable update for authenticated users only" on public.products for update to authenticated using (true);

drop policy if exists "Enable delete for authenticated users only" on public.products;
create policy "Enable delete for authenticated users only" on public.products for delete to authenticated using (true);

-- Allow authenticated users (Admins) to manage shipping zones
drop policy if exists "Enable all for authenticated users only" on public.shipping_zones;
create policy "Enable all for authenticated users only" on public.shipping_zones for all to authenticated using (true);

-- Allow authenticated users (Admins) to view and manage orders
drop policy if exists "Enable read for authenticated users only" on public.orders;
create policy "Enable read for authenticated users only" on public.orders for select to authenticated using (true);

drop policy if exists "Enable update for authenticated users only" on public.orders;
create policy "Enable update for authenticated users only" on public.orders for update to authenticated using (true);

-- Allow public read access to products (was restricted to is_active=true, keeping that property for public match, but admin needs to see all)
drop policy if exists "Enable read access for authenticated users" on public.products;
create policy "Enable read access for authenticated users" on public.products for select to authenticated using (true);
