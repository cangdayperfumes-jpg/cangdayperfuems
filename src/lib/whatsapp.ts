/** WhatsApp button settings (system_settings.whatsapp_enabled / whatsapp_number). */
export interface WhatsAppSettings {
  enabled: boolean;
  /** International number, digits only (e.g. 905321234567). */
  number: string;
}

export const DEFAULT_WHATSAPP: WhatsAppSettings = { enabled: false, number: '' };

/**
 * Digits only, in international form. A Turkish mobile typed the local way
 * ("0532 …" or "532 …") gets the 90 country code added.
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('05')) d = '90' + d.slice(1);
  else if (d.length === 10 && d.startsWith('5')) d = '90' + d;
  return d;
}

/** A plausible international number: 8–15 digits (E.164). */
export const isValidWhatsAppNumber = (digits: string) => /^\d{8,15}$/.test(digits);

export function whatsAppLink(number: string, text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number}${q}`;
}
