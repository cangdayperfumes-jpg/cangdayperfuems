import { createClient } from '@/utils/supabase/server';
import { getCachedAdminCategories, getCachedAdminBrands } from '@/lib/admin-data';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { ProductsTable } from '@/components/admin/ProductsTable';
import BulkImport from '@/components/admin/BulkImport';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Product } from '@/types';

type ProductRow = Product & { categories?: { name: string } | null; brands?: { name: string } | null };

export default async function ProductsPage() {
    const supabase = await createClient();

    const [products, categories, brands] = await Promise.all([
        fetchAllRows<ProductRow>((from, to) =>
            supabase
                .from('products')
                .select('*, categories(name), brands(name)')
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .range(from, to)
        ),
        getCachedAdminCategories(),
        getCachedAdminBrands(),
    ]);

    // Flatten category and brand name for table
    const formattedProducts = (products || []).map(p => ({
        ...p,
        category: p.categories?.name,
        brand: p.brands?.name
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-3xl font-bold font-playfair">Products</h1>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {formattedProducts.length} total
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/products/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                    <BulkImport />
                </div>
            </div>
            <ProductsTable data={formattedProducts} categories={categories} brands={brands} />
        </div>
    );
}
