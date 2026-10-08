import { createClient } from '@/utils/supabase/server';
import { getCachedAdminCategories, getCachedAdminBrands } from '@/lib/admin-data';
import ProductForm from "@/components/admin/ProductForm";
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'products');
  const supabase = await createClient();
  const [{ data: product, error }, categories, brands] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    getCachedAdminCategories(),
    getCachedAdminBrands(),
  ]);

  if (error || !product) {
    console.error('Error fetching product:', error);
    return (
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
            <h3 className="font-bold">{t('errorLoadingProduct')}</h3>
            <p>{t('idLabel', { id })}</p>
            <p>{t('messageLabel', { message: error?.message || t('productNotFound') })}</p>
            <p>{t('detailsLabel', { details: error?.details || '' })}</p>
            <p>{t('hintLabel', { hint: error?.hint || '' })}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">{t('editProduct')}</h1>
      <ProductForm initialData={product} categories={categories} brands={brands} />
    </div>
  );
}
