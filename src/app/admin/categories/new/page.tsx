import CategoryForm from '@/components/admin/CategoryForm';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

export default async function NewCategoryPage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'categories');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('newTitle')}</h1>
      <CategoryForm />
    </div>
  );
}
