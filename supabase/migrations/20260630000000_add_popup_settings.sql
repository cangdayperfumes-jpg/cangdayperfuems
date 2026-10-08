-- Add popup settings to system_settings table
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS popup_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS popup_title text DEFAULT '',
ADD COLUMN IF NOT EXISTS popup_message text DEFAULT '',
ADD COLUMN IF NOT EXISTS popup_button_text text DEFAULT 'Shop Now',
ADD COLUMN IF NOT EXISTS popup_button_link text DEFAULT '/shop',
ADD COLUMN IF NOT EXISTS popup_image_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS popup_show_on text DEFAULT 'all'; -- 'all', 'shop', 'home'
