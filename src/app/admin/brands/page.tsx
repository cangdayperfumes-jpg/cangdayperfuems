import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBrands, deleteBrand } from './actions';
import { redirect } from 'next/navigation';
import DeleteButton from '@/components/admin/DeleteButton';

export const revalidate = 0;

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const query = params.q || '';
  const page = Number(params.page) || 1;
  const limit = 10;

  const { data: brands, totalPages } = await getBrands({ query, page, limit });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold font-playfair">Brands</h1>
        <Link href="/admin/brands/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="max-w-sm">
        <form className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             {/* Using name="q" automatically puts it in searchParams on submit */}
             <Input 
                name="q" 
                defaultValue={query} 
                placeholder="Search brands..." 
                className="pl-9" 
             />
        </form>
      </div>

      <div className="rounded-md border bg-white">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Logo
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Name
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Slug
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Featured
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-4 text-center text-muted-foreground">No brands found.</td>
                </tr>
              ) : (
                brands.map((brand) => (
                    <tr
                    key={brand.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                    <td className="p-4 align-middle">
                        <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-gray-50">
                        {brand.image_url ? (
                            <Image
                                src={brand.image_url}
                                alt={brand.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No Logo
                            </div>
                        )}
                        </div>
                    </td>
                    <td className="p-4 align-middle font-medium">{brand.name}</td>
                    <td className="p-4 align-middle">{brand.slug}</td>
                    <td className="p-4 align-middle">
                        {brand.is_featured ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                Featured
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                -
                            </span>
                        )}
                    </td>
                    <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                            <Link href={`/admin/brands/${brand.id}`}>
                                <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                                </Button>
                            </Link>
                            <DeleteButton id={brand.id} onDelete={deleteBrand} itemName="brand" />
                        </div>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Pagination */}
       {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
            <Link href={`/admin/brands?q=${query}&page=${Math.max(1, page - 1)}`} className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
            </Link>
            <span className="text-sm font-medium">
                Page {page} of {totalPages}
            </span>
            <Link href={`/admin/brands?q=${query}&page=${Math.min(totalPages, page + 1)}`} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    Next <ChevronRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
      )}
    </div>
  );
}
