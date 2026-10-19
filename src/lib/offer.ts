import type { PopupSettings } from '@/components/providers/SettingsProvider';

/** Pop-up copy in the visitor's language, falling back to English per field. */
export function localizeOffer(s: PopupSettings, locale: string) {
  const tr = locale === 'tr';
  return {
    title: (tr && s.popup_title_tr) || s.popup_title,
    message: (tr && s.popup_message_tr) || s.popup_message,
    buttonText: (tr && s.popup_button_text_tr) || s.popup_button_text,
    buttonLink: s.popup_button_link || '/shop',
  };
}

/** An offer with an end time in the past is over — hide it everywhere. */
export function isOfferExpired(s: PopupSettings | null) {
  if (!s?.popup_ends_at) return false;
  const end = new Date(s.popup_ends_at).getTime();
  return Number.isFinite(end) && end <= Date.now();
}

/**
 * Identifies one specific offer, so dismissing last week's pop-up doesn't
 * also hide a brand-new offer the admin just published.
 */
export function offerSignature(s: PopupSettings) {
  return `${s.popup_title}|${s.popup_ends_at ?? ''}`;
}
