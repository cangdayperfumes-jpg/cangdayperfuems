-- Floating WhatsApp button (Admin → Settings → WhatsApp).
-- Off until the admin turns it on and enters a number.
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_number text;
