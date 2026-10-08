import BrandForm from '@/components/admin/BrandForm';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

export default async function NewBrandPage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'brands');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t('newTitle')}</h1>
      <BrandForm />
    </div>
  );
}
