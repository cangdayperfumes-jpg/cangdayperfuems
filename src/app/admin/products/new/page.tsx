import { getCachedAdminCategories, getCachedAdminBrands } from '@/lib/admin-data';
import ProductForm from "@/components/admin/ProductForm";
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

export default async function NewProductPage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'products');
  const [categories, brands] = await Promise.all([
    getCachedAdminCategories(),
    getCachedAdminBrands(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">{t('addNewProduct')}</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
