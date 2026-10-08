import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import CategoryTileForm from '@/components/admin/CategoryTileForm';

export default async function NewCategoryTilePage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'categoryTiles');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('newTitle')}</h1>
      <CategoryTileForm />
    </div>
  );
}
