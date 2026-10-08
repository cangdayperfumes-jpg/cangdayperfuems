-- Indexes for frequently filtered/sorted/joined columns that had none
-- (only product_variants.product_id and products.slug were indexed before).

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON public.products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON public.products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Matches the most common storefront query shape: filter by active, optionally by category.
CREATE INDEX IF NOT EXISTS idx_products_active_category ON public.products(is_active, category_id);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
