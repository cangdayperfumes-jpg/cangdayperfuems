import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import HeroSlideForm from '@/components/admin/HeroSlideForm';

export default async function NewHeroSlidePage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'heroSlides');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('newTitle')}</h1>
      <HeroSlideForm />
    </div>
  );
}
