import { COUNTRIES } from '@/lib/countries';

export const DOMESTIC_COUNTRY_CODE = 'TR';

export interface ShippingZone {
  id: string;
  country: string;
  country_code: string | null;
  /** NULL = whole country. For Turkey, a province name = per-province override. */
  city: string | null;
  price: number;
  continent: string | null;
  shipping_details: string | null;
  is_enabled: boolean;
}

export type ShippingQuote =
  | { available: true; price: number; details: string | null }
  | { available: false };

/** Country-level rows that are switched on — the destinations offered at checkout. */
export function getEnabledCountryZones(zones: ShippingZone[]): ShippingZone[] {
  return zones.filter((z) => z.is_enabled && !z.city && z.country_code);
}

/**
 * Shipping price for one order (charged once, not per item).
 * Turkey: a matching enabled province override wins, otherwise the
 * national Turkey price. Other countries: that country's price. A
 * disabled/missing country is not shippable.
 */
export function quoteShipping(
  zones: ShippingZone[],
  countryCode: string | null | undefined,
  province?: string | null
): ShippingQuote {
  if (!countryCode) return { available: false };
  const countryZone = zones.find((z) => z.country_code === countryCode && !z.city);
  if (!countryZone || !countryZone.is_enabled) return { available: false };

  if (countryCode === DOMESTIC_COUNTRY_CODE && province) {
    const override = zones.find(
      (z) => z.country_code === DOMESTIC_COUNTRY_CODE && z.city === province && z.is_enabled
    );
    if (override) {
      return { available: true, price: Number(override.price), details: override.shipping_details ?? countryZone.shipping_details };
    }
  }
  return { available: true, price: Number(countryZone.price), details: countryZone.shipping_details };
}

/** Localized country name (e.g. "Almanya" on /tr), falling back to the stored English name. */
export function countryDisplayName(code: string, locale: string, fallback?: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'region' }).of(code);
    if (name && name !== code) return name;
  } catch {
    // Intl.DisplayNames unsupported — fall through.
  }
  return fallback ?? COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function flagUrl(code: string, width: 20 | 40 = 20): string {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}
