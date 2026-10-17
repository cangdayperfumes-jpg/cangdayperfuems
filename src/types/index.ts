import type { CropMeta } from '@/lib/image-crop';

export interface Product {
  id: string;
  name_en: string;
  slug?: string | null;
  description_en: string | null;
  price: number;
  discount: number;
  category_id: string | null;
  brand_id: string | null;
  stock: boolean;
  images: string[];
  /** Optional override shown on mobile in place of images[0]; falls back to it when null. */
  mobile_image_url?: string | null;
  /** Non-destructive focal-point/zoom crop applied to the cover image (images[0] on desktop, mobile_image_url ?? images[0] on mobile). */
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
  is_active: boolean;
  target_audience: string; // 'Men', 'Women', 'Unisex'
  is_popular: boolean;
  created_at: string;
  has_variants: boolean;
  sales_count: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  discount: number;
  stock: boolean;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  description?: string | null;
  is_featured?: boolean;
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
  is_featured?: boolean;
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
}

export interface Address {
  line1: string;
  city: string;
  country: string;
  postal_code: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: Address | null; // JSONB stored as object
  total_amount: number;
  shipping_cost: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  variant_id?: string | null;
  variant_name?: string | null;
  product?: Product; // Joined
}

export interface ShippingZone {
  id: string;
  country: string;
  city: string | null;
  price: number;
  continent?: string | null;
  country_code?: string | null;
  shipping_details?: string | null;
}

export interface SeasonalCollection {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  season_type?: string | null;
  slug: string;
  seo_title?: string | null;
  seo_description?: string | null;
  banner_image_desktop?: string | null;
  banner_image_mobile?: string | null;
  background_pattern_image?: string | null;
  decorative_image?: string | null;
  background_color: string;
  text_color: string;
  overlay_opacity: number;
  image_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  section_height: 'sm' | 'md' | 'lg' | 'full';
  text_alignment: 'left' | 'center' | 'right';
  animation_style: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in' | 'none';
  button_text: string;
  button_color?: string | null;
  button_style: 'solid' | 'outline' | 'ghost';
  display_order: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HeroSlide {
  id: string;
  eyebrow: string;
  headline: string;
  headline_accent?: string | null;
  subheading?: string | null;
  image_url: string;
  image_position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
  button_text: string;
  button_link: string;
  secondary_button_text?: string | null;
  secondary_button_link?: string | null;
  /** Turkish copy shown on /tr — each falls back to its English column when null/blank. */
  eyebrow_tr?: string | null;
  headline_tr?: string | null;
  headline_accent_tr?: string | null;
  subheading_tr?: string | null;
  button_text_tr?: string | null;
  secondary_button_text_tr?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryTile {
  id: string;
  label: string;
  image_url: string;
  link_href: string;
  col_span: 1 | 2 | 3 | 4;
  row_span: 1 | 2;
  image_crop_desktop?: CropMeta | null;
  image_crop_mobile?: CropMeta | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoBanner {
  id: string;
  eyebrow: string;
  title: string;
  body?: string | null;
  button_text: string;
  link_href: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonalCollectionProductLink {
  collection_id: string;
  product_id: string;
  display_order: number;
  product?: Product; // Joined
}
