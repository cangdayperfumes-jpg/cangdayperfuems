import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export interface SiteTheme {
  gold: string;
  goldDeep: string;
  ink: string;
  ivory: string;
}

// Matches the --brand-* defaults in globals.css — used whenever
// system_settings has no row yet (fresh/unconfigured database).
const DEFAULT_THEME: SiteTheme = {
  gold: '#C9A24B',
  goldDeep: '#8A6A2F',
  ink: '#120D0A',
  ivory: '#F5EFE6',
};

export const getSiteTheme = unstable_cache(
  async (): Promise<SiteTheme> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('system_settings')
      .select('theme_gold, theme_gold_deep, theme_ink, theme_ivory')
      .eq('id', 'global')
      .single();

    if (!data) return DEFAULT_THEME;

    return {
      gold: data.theme_gold || DEFAULT_THEME.gold,
      goldDeep: data.theme_gold_deep || DEFAULT_THEME.goldDeep,
      ink: data.theme_ink || DEFAULT_THEME.ink,
      ivory: data.theme_ivory || DEFAULT_THEME.ivory,
    };
  },
  ['site-theme'],
  { revalidate: 60 }
);

/** "#C9A24B" -> "201 162 75" — the space-separated form the --brand-* CSS
 *  variables need so Tailwind's rgb(var(--x) / <alpha-value>) pattern (and
 *  therefore every bg-gold/50-style opacity modifier) keeps working. */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return '0 0 0';
  return `${r} ${g} ${b}`;
}
