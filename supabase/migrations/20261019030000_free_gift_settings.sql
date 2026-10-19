-- Free mini gift promotion, editable from Settings: on/off and the order
-- amount that unlocks it (was hard-coded to ₺750).
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS gift_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gift_threshold numeric NOT NULL DEFAULT 750 CHECK (gift_threshold > 0);
