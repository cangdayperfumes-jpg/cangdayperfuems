-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. categories table
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. products table
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  discount numeric default 0 check (discount >= 0),
  category_id uuid references public.categories(id) on delete set null,
  stock boolean default true, -- simple in/out of stock
  images text[], -- array of image URLs
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. shipping_zones table
create table public.shipping_zones (
  id uuid primary key default uuid_generate_v4(),
  country text not null,
  city text, -- nullable, if null applies to entire country
  price numeric not null check (price >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. orders table
create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text, -- optional contact
  customer_phone text not null,
  customer_address jsonb not null, -- { line1, city, country, postal_code }
  total_amount numeric not null check (total_amount >= 0),
  shipping_cost numeric default 0 check (shipping_cost >= 0),
  status text default 'pending' check (status in ('pending', 'shipped', 'delivered', 'cancelled')),
  is_verified boolean default false, -- Ghost Order strategy: default false until confirmed via WhatsApp
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. order_items table
create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0), -- Snapshot of price at purchase
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic Setup - Open for Public Read, Admin Write)
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public can read products/categories/shipping
create policy "Public can view categories" on public.categories for select using (true);
create policy "Public can view active products" on public.products for select using (is_active = true);
create policy "Public can view shipping zones" on public.shipping_zones for select using (true);

-- Public can create orders (Guest Checkout)
create policy "Public can create orders" on public.orders for insert with check (true);
create policy "Public can create order items" on public.order_items for insert with check (true);

-- TODO: Add Admin policies for full access (assuming admin works via Supabase dashboard or authenticated client)
