import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import SeasonalCollectionForm from '@/components/admin/SeasonalCollectionForm';

export default async function NewSeasonalCollectionPage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'seasonalCollections');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('newTitle')}</h1>
      <SeasonalCollectionForm />
    </div>
  );
}
