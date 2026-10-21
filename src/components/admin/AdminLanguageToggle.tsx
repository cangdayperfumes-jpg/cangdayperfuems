'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_LOCALE_COOKIE, ADMIN_LOCALES } from '@/i18n/admin-locale-constants';

interface AdminLanguageToggleProps {
  collapsed?: boolean;
}

export default function AdminLanguageToggle({ collapsed }: AdminLanguageToggleProps) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const router = useRouter();

  function setLocale(next: string) {
    // 1-year cookie, readable by the server layout on the next request.
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 px-3', collapsed && 'md:justify-center md:px-0')}>
      <span className={cn('text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory/35', collapsed && 'md:hidden')}>
        {t('language')}
      </span>
      {/* Segmented control */}
      <div role="group" aria-label={t('language')} className="flex rounded-md border border-ivory/10 bg-ivory/[0.03] p-0.5">
        {ADMIN_LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={l === locale}
            className={cn(
              'h-6 min-w-[30px] rounded-[4px] px-1.5 text-[10.5px] font-bold uppercase tracking-wider transition-colors',
              l === locale ? 'bg-gold text-ink' : 'text-ivory/50 hover:text-ivory'
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
