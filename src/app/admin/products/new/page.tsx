import { getCachedAdminCategories, getCachedAdminBrands } from '@/lib/admin-data';
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    getCachedAdminCategories(),
    getCachedAdminBrands(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">Add New Product</h1>
      <ProductForm categories={categories} brands={brands} />
    </div>
  );
}
