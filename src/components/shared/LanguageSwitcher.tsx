'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  linkClassName?: string;
}

/**
 * Swaps locale while staying on the exact same page — including dynamic
 * segments (e.g. /shop/[slug]) and the current query string (e.g. a
 * /shop?category=... filter), since usePathname here is next-intl's
 * locale-stripped variant and useRouter re-adds the target locale itself.
 */
export default function LanguageSwitcher({ className, linkClassName }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.toString();

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium uppercase tracking-widest', className)}>
      {routing.locales.map((l, index) => (
        <span key={l} className="flex items-center gap-1">
          {index > 0 && <span aria-hidden="true" className="opacity-40">/</span>}
          <button
            type="button"
            onClick={() => router.replace({ pathname, query: Object.fromEntries(searchParams) }, { locale: l })}
            aria-current={l === locale}
            className={cn(
              'transition-colors',
              l === locale ? 'text-gold' : 'opacity-60 hover:opacity-100',
              linkClassName
            )}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
