import { getCategories, deleteCategory } from './actions';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import DeleteButton from '@/components/admin/DeleteButton';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

export const revalidate = 0; // Dynamic

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'categories');
  const tc = await getAdminT(locale, 'common');
  // ... rest of setup
  const query = params.q || '';
  const page = Number(params.page) || 1;
  const limit = 10;

  const { data: categories, totalPages, totalCount } = await getCategories({ query, page, limit });

  return (
    <div className="space-y-6">
      {/* ... header ... */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-heading font-bold">{t('title')}</h1>
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {t('totalCount', { count: totalCount })}
            </span>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('addCategory')}
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="max-w-sm">
         <form className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
                 name="q"
                 defaultValue={query}
                 placeholder={t('searchPlaceholder')}
                 className="pl-9"
             />
         </form>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
             <thead>
               <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{tc('image')}</th>
                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{tc('name')}</th>
                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('slug')}</th>
                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('featured')}</th>
                 <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">{t('description')}</th>
                 <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">{tc('actions')}</th>
               </tr>
             </thead>
             <tbody>
                {categories.length === 0 ? (
                  <tr>
                     <td colSpan={5} className="p-4 text-center text-muted-foreground">
                         {t('noCategoriesFound')}
                     </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                       <td className="p-4 align-middle">
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100">
                             {category.image_url ? (
                                <Image
                                   src={category.image_url}
                                   alt={category.name}
                                   fill
                                   sizes="48px"
                                   className="object-cover"
                                />
                             ) : (
                                <div className="flex items-center justify-center h-full w-full text-xs text-gray-400">No Img</div>
                             )}
                          </div>
                       </td>
                       <td className="p-4 align-middle font-medium">{category.name}</td>
                       <td className="p-4 align-middle text-muted-foreground">{category.slug}</td>
                       <td className="p-4 align-middle">
                           {category.is_featured && (
                               <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                   Featured
                               </span>
                           )}
                       </td>
                       <td className="p-4 align-middle hidden md:table-cell max-w-xs truncate">
                           {category.description || '-'}
                       </td>
                       <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Link href={`/admin/categories/${category.id}`}>
                                <Button variant="ghost" size="icon">
                                   <Pencil className="h-4 w-4" />
                                   <span className="sr-only">{tc('edit')}</span>
                                </Button>
                             </Link>
                             <DeleteButton id={category.id} onDelete={deleteCategory} itemName={t('itemName')} />
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
            <Link href={`/admin/categories?q=${query}&page=${Math.max(1, page - 1)}`} className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" /> {t('previous')}
                </Button>
            </Link>
            <span className="text-sm font-medium">
                {t('pageOf', { page, totalPages })}
            </span>
            <Link href={`/admin/categories?q=${query}&page=${Math.min(totalPages, page + 1)}`} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    {t('next')} <ChevronRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
      )}
    </div>
  );
}
