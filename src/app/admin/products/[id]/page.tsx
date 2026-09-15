import { createClient } from '@/utils/supabase/server';
import { getCachedAdminCategories, getCachedAdminBrands } from '@/lib/admin-data';
import ProductForm from "@/components/admin/ProductForm";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
            <h3 className="font-bold">Error loading product</h3>
            <p>ID: {id}</p>
            <p>Message: {error?.message || 'Product not found'}</p>
            <p>Details: {error?.details}</p>
            <p>Hint: {error?.hint}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">Edit Product</h1>
      <ProductForm initialData={product} categories={categories} brands={brands} />
    </div>
  );
}
