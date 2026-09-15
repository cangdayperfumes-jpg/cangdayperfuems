'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/utils/supabase/client';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { resolveUniqueProductSlug } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileSpreadsheet, Download, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BulkImport() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{created: number, updated: number, failed: number} | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const downloadTemplate = async () => {
    try {
        setLoading(true);
        const products = await fetchAllRows<any>((from, to) =>
            supabase
                .from('products')
                .select(`
                    *,
                    categories (name),
                    brands (name),
                    product_variants (*)
                `)
                .order('id', { ascending: true })
                .range(from, to)
        );

        // Map to Excel format
        const excelData = (products || []).map((p: any) => {
            // Format variants: "Name:Price:Stock|Name:Price:Stock"
            const variantsString = p.product_variants?.map((v: any) => 
                `${v.name}:${v.price}:${v.stock ? 'yes' : 'no'}`
            ).join('|');

            return {
                name_en: p.name_en,
                description_en: p.description_en,
                price: p.price,
                discount_price: p.discount,
                category: p.categories?.name || '',
                brand: p.brands?.name || '',
                target_audience: p.target_audience,
                in_stock: p.stock ? 'yes' : 'no',
                is_active: p.is_active ? 'yes' : 'no',
                has_variants: p.has_variants ? 'yes' : 'no',
                popular: p.is_popular ? 'yes' : 'no',
                variants: variantsString || ''
            };
        });

        if (excelData.length === 0) {
             excelData.push({
                name_en: 'Example Perfume',
                description_en: 'Description...',
                price: 150,
                discount_price: 0,
                category: 'Men',
                brand: 'Chanel',
                target_audience: 'Men',
                in_stock: 'yes',
                is_active: 'yes',
                has_variants: 'yes',
                popular: 'no',
                variants: '100ml:150:yes|200ml:280:yes'
             });
        }

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        XLSX.writeFile(wb, "products_export.xlsx");

    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export products');
    } finally {
        setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setProgress(0);
      setSummary(null);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];

      if (jsonData.length === 0) {
        alert('File is empty');
        return;
      }

      let created = 0;
      let updated = 0;
      let failed = 0;
      const total = jsonData.length;

      for (let i = 0; i < total; i++) {
        const row = jsonData[i];
        
        // Update progress
        setProgress(Math.round(((i + 1) / total) * 100));

        try {
            // 1. Resolve Category
            let categoryId = null;
            if (row.category) {
                const slug = row.category.toLowerCase().trim().replace(/\s+/g, '-');
                const { data: existingCat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', slug)
                    .maybeSingle();

                if (existingCat) {
                    categoryId = existingCat.id;
                } else {
                    const { data: newCat } = await supabase
                        .from('categories')
                        .insert([{ name: row.category.trim(), slug }])
                        .select('id')
                        .single();
                    if (newCat) categoryId = newCat.id;
                }
            }

            // 2. Resolve Brand
            let brandId = null;
            if (row.brand) {
                const slug = row.brand.toLowerCase().trim().replace(/\s+/g, '-');
                const { data: existingBrand } = await supabase
                    .from('brands')
                    .select('id')
                    .eq('slug', slug)
                    .maybeSingle();

                if (existingBrand) {
                    brandId = existingBrand.id;
                } else {
                    const { data: newBrand } = await supabase
                        .from('brands')
                        .insert([{ name: row.brand.trim(), slug }])
                        .select('id')
                        .single();
                    if (newBrand) brandId = newBrand.id;
                }
            }

            // 3. Prepare Data
            const parseBoolean = (val: any) => {
                if (val === undefined || val === null || val === '') return false; // Default false to be safe, except for stock maybe?
                const s = String(val).toLowerCase().trim();
                return s === 'true' || s === 'yes' || s === '1';
            };
            
            // Stock defaults to true if missing? or strict? Let's say true for backwards compat if empty
            const parseStock = (val: any) => {
                 if (val === undefined || val === null || val === '') return true;
                 const s = String(val).toLowerCase().trim();
                 return s === 'true' || s === 'yes' || s === '1';
            }

            const hasVariants = parseBoolean(row.has_variants);

            const productData: Record<string, any> = {
                name_en: row.name_en || row.name || 'Untitled',
                description_en: row.description_en || row.description || '',
                price: row.price || 0,
                discount: row.discount_price || 0,
                category_id: categoryId,
                brand_id: brandId,
                target_audience: row.target_audience || 'Unisex',
                stock: parseStock(row.in_stock), // Main stock
                is_active: parseBoolean(row.is_active || 'yes'), // Default active
                has_variants: hasVariants,
                is_popular: parseBoolean(row.popular)
            };

            // 4. Smart Upsert Logic
            let productId: string | null = null;

            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('name_en', productData.name_en)
                .maybeSingle();

            // Ensure every product ends up with a slug (never left null) so it gets a clean,
            // permanent /shop/<slug> URL instead of only being reachable by raw UUID.
            productData.slug = await resolveUniqueProductSlug(supabase, productData.name_en, existing?.id);

            if (existing) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', existing.id);
                if (error) throw error;
                productId = existing.id;
                updated++;
            } else {
                const { data: newProduct, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select('id')
                    .single();
                if (error) throw error;
                productId = newProduct.id;
                created++;
            }

            // 5. Handle Variants
            if (hasVariants && productId && row.variants) {
                // Parse variants string: "Name:Price:Stock|..."
                const variantsList = String(row.variants).split('|').map(vStr => {
                    const [name, price, stockStr] = vStr.split(':');
                    return {
                        product_id: productId,
                        name: name.trim(),
                        price: parseFloat(price) || 0,
                        stock: parseStock(stockStr), // derived from string
                        is_active: true
                    };
                }).filter(v => v.name); // basic validation

                if (variantsList.length > 0) {
                    // Replace existing variants (easiest way to sync)
                    // First delete old ones
                    await supabase.from('product_variants').delete().eq('product_id', productId);
                    
                    // Insert new ones
                    const { error: vError } = await supabase.from('product_variants').insert(variantsList);
                    if (vError) {
                        console.error('Variant insert error:', vError);
                        // Don't fail the whole row, but log it
                    }
                }
            }

        } catch (err) {
            console.error('Row failed:', row, err);
            failed++;
        }
      }

      setSummary({ created, updated, failed });
      router.refresh();

    } catch (error) {
      console.error('Import error:', error);
      alert('Critical error during import.');
    } finally {
      setLoading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
         <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Template
        </Button>
         <div className="relative">
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={loading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <Button disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                {loading ? `Importing ${progress}%` : 'Import Excel'}
            </Button>
         </div>
      </div>
      
      {loading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-black h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
      )}

      {summary && (
        <div className="p-4 bg-gray-50 border rounded-md flex justify-between items-center animate-in fade-in slide-in-from-top-2">
            <div>
                <p className="font-semibold text-gray-900">Import Finished</p>
                <p className="text-sm text-gray-600">
                    <span className="text-green-600 font-medium">{summary.created} Created</span>,{' '}
                    <span className="text-blue-600 font-medium">{summary.updated} Updated</span>,{' '}
                    <span className="text-red-600 font-medium">{summary.failed} Failed</span>
                </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSummary(null)}><X className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}
