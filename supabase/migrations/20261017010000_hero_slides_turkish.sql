-- Turkish copy for the homepage hero slides. Every text column gets a
-- nullable *_tr twin; the storefront shows it on /tr and falls back to the
-- English column whenever it's NULL or blank, so slides keep rendering
-- unchanged until an admin fills the Turkish fields in.

ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS eyebrow_tr text,
  ADD COLUMN IF NOT EXISTS headline_tr text,
  ADD COLUMN IF NOT EXISTS headline_accent_tr text,
  ADD COLUMN IF NOT EXISTS subheading_tr text,
  ADD COLUMN IF NOT EXISTS button_text_tr text,
  ADD COLUMN IF NOT EXISTS secondary_button_text_tr text;

-- Backfill translations for the slides that exist today, matched on their
-- English copy (not ids) so this is safe on any environment. Only fills
-- columns that are still empty — never overwrites admin-entered Turkish.

-- "Wear what lingers." (seeded default slide and its variants)
UPDATE public.hero_slides SET
  eyebrow_tr               = COALESCE(NULLIF(eyebrow_tr, ''), 'Modern Parfümeri'),
  headline_tr              = COALESCE(NULLIF(headline_tr, ''), 'İz bırakan'),
  headline_accent_tr       = COALESCE(NULLIF(headline_accent_tr, ''), 'kokuyu taşıyın.'),
  subheading_tr            = COALESCE(NULLIF(subheading_tr, ''), 'Fark etmeyi bıraktıktan saatler sonra bile hissettirdikleri için seçilmiş tasarımcı ve niş parfümlerden oluşan özel bir koleksiyon.'),
  button_text_tr           = COALESCE(NULLIF(button_text_tr, ''), 'Koleksiyonu Keşfet'),
  secondary_button_text_tr = CASE
    WHEN secondary_button_text = 'Our Story' THEN COALESCE(NULLIF(secondary_button_text_tr, ''), 'Hikayemiz')
    ELSE secondary_button_text_tr
  END
WHERE headline = 'Wear what' AND headline_accent = 'lingers.';

-- "Scent has no gender."
UPDATE public.hero_slides SET
  eyebrow_tr               = COALESCE(NULLIF(eyebrow_tr, ''), 'Sınırların Ötesinde'),
  headline_tr              = COALESCE(NULLIF(headline_tr, ''), 'Kokunun'),
  headline_accent_tr       = COALESCE(NULLIF(headline_accent_tr, ''), 'cinsiyeti yoktur.'),
  subheading_tr            = COALESCE(NULLIF(subheading_tr, ''), 'Etiketlerin ötesine geçen; her ruh hâline, her ana ve her bireye göre tasarlanmış büyüleyici kokuları keşfedin.'),
  button_text_tr           = COALESCE(NULLIF(button_text_tr, ''), 'Unisex Kokuları Keşfet'),
  secondary_button_text_tr = CASE
    WHEN secondary_button_text = 'Discover All Fragrances' THEN COALESCE(NULLIF(secondary_button_text_tr, ''), 'Tüm Kokuları Keşfet')
    ELSE secondary_button_text_tr
  END
WHERE headline = 'Scent has' AND headline_accent = 'no gender.';
