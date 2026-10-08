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
    <div className={cn('flex items-center gap-1.5 px-4', collapsed ? 'justify-center px-0' : '')}>
      {!collapsed && (
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mr-1">{t('language')}</span>
      )}
      {ADMIN_LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-current={l === locale}
          className={cn(
            'px-2 py-1 text-xs font-semibold uppercase rounded-md transition-colors',
            l === locale ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
