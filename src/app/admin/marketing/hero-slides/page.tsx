import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import HeroSlidesTable from '@/components/admin/HeroSlidesTable';
import { getHeroSlides } from './actions';

export const revalidate = 0;

export default async function HeroSlidesPage() {
  const { data: slides, totalCount } = await getHeroSlides();
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'heroSlides');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-heading font-bold">{t('title')}</h1>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {t('totalCount', { count: totalCount })}
          </span>
        </div>
        <Link href="/admin/marketing/hero-slides/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('createNew')}
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">{t('reorderHint')}</p>

      <HeroSlidesTable slides={slides} />
    </div>
  );
}
