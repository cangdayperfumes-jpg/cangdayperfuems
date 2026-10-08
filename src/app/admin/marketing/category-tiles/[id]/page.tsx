import { notFound } from 'next/navigation';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import CategoryTileForm from '@/components/admin/CategoryTileForm';
import { getCategoryTileById } from '../actions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryTilePage(props: Props) {
  const params = await props.params;
  const tile = await getCategoryTileById(params.id);

  if (!tile) {
    notFound();
  }

  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'categoryTiles');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('editTitle')}</h1>
      <CategoryTileForm initialData={tile} />
    </div>
  );
}
