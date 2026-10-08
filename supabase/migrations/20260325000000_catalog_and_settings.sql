-- Add type field to products for Designer/Niche categorization
ALTER TABLE products ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('Designer', 'Niche'));

-- Create system settings table for global config like hide_prices
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  hide_prices BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default global settings row
INSERT INTO system_settings (id, hide_prices) VALUES ('global', false) ON CONFLICT (id) DO NOTHING;

-- RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read system settings" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update system settings" ON system_settings FOR UPDATE USING (auth.role() = 'authenticated');
