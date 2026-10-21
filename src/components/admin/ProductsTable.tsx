'use client';

import { useState, useMemo, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { MoreHorizontal, ArrowUpDown, ChevronDown, Filter, ImageOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, Pencil } from 'lucide-react';
import { Product, Category, Brand } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { deleteProduct, bulkUpdatePrice, updateProductFields } from '@/app/admin/actions';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import dynamic from 'next/dynamic';

function ProductFormLoading() {
  const t = useTranslations('products');
  return <div className="p-8 text-center text-muted-foreground">{t('loadingForm')}</div>;
}

const ProductForm = dynamic(() => import('./ProductForm'), {
  loading: () => <ProductFormLoading />,
  ssr: false,
});

// Extend Product type locally to include category and brand name
type ProductWithDetails = Product & { category?: string; brand?: string };

export function ProductsTable({
  data,
  categories,
  brands,
  initialFilters = [],
}: {
  data: ProductWithDetails[];
  categories: Category[];
  brands: Brand[];
  /** e.g. from ?stock=false — lets dashboard links open the list pre-filtered. */
  initialFilters?: ColumnFiltersState;
}) {
  const router = useRouter();
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Edit State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const openEditSheet = (product: Product) => {
    setEditingProduct(product);
    setIsEditSheetOpen(true);
  };

  // Bulk Price Edit State
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [isBulkSaving, startBulkSaving] = useTransition();

  // Open Mode: inline editing directly in the table
  const [isOpenMode, setIsOpenMode] = useState(false);

  const columns: ColumnDef<ProductWithDetails>[] = useMemo(() => [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label={t('selectAll')}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={t('selectRow')}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'image',
        header: tc('image'),
        cell: ({ row }) => {
            const images = row.original.images;
            const mainImage = images && images.length > 0 ? images[0] : null;

            return (
                <div className="h-10 w-10 relative rounded overflow-hidden border bg-gray-50 flex items-center justify-center">
                    {mainImage ? (
                        <ImageWithFallback
                            src={mainImage}
                            alt={row.original.name_en}
                            fill
                            className="object-cover"
                            sizes="40px"
                        />
                    ) : (
                        <ImageOff className="h-4 w-4 text-gray-400" />
                    )}
                </div>
            )
        }
    },
    {
      accessorKey: 'name_en',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {t('nameEn')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        if (isOpenMode) {
            return <EditableTextCell productId={row.original.id} field="name_en" initialValue={row.getValue('name_en') as string} />;
        }
        return <div className="lowercase font-medium">{row.getValue('name_en')}</div>;
      },
      filterFn: (row, id, value) => {
          const name = row.getValue(id) as string;
          const sku = row.original.id; // Using ID as proxy for SKU since SKU field isn't in type
          return name.toLowerCase().includes(value.toLowerCase()) || sku.includes(value);
      }
    },
    {
      accessorKey: 'brand',
      header: t('brand'),
      cell: ({ row }) => <div className="font-medium">{row.getValue('brand') || '-'}</div>,
      filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'category',
      header: t('category'),
      cell: ({ row }) => <div>{row.getValue('category') || t('uncategorized')}</div>,
      filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'price',
      header: t('price'),
      cell: ({ row }) => {
        if (isOpenMode) {
            return <EditableTextCell productId={row.original.id} field="price" type="number" initialValue={row.getValue('price') as number} />;
        }
        const amount = parseFloat(row.getValue('price'));
        return <div className="font-medium">{formatCurrency(amount)}</div>;
      },
    },
    {
        accessorKey: 'stock',
        header: t('stockStatus'),
        cell: ({ row }) => {
            const inStock = row.getValue('stock') as boolean;
            if (isOpenMode) {
                return <ToggleCell productId={row.original.id} field="stock" initialValue={inStock} trueLabel={t('inStock')} falseLabel={t('outOfStock')} />;
            }
            return (
                <Badge variant={inStock ? 'default' : 'destructive'}>
                    {inStock ? t('inStock') : t('outOfStock')}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            // value is array of strings: ["true"] or ["false"]
            const stockVal = String(row.getValue(id));
            return value.includes(stockVal);
        }
    },
    {
        accessorKey: 'is_active',
        header: tc('status'),
        cell: ({ row }) => {
            const isActive = row.getValue('is_active') as boolean;
            if (isOpenMode) {
                return <ToggleCell productId={row.original.id} field="is_active" initialValue={isActive} trueLabel={tc('active')} falseLabel={tc('inactive')} />;
            }
            return (
                <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? tc('active') : tc('inactive')}
                </Badge>
            );
        },
        filterFn: (row, id, value) => {
            const activeVal = String(row.getValue(id));
            return value.includes(activeVal);
        }
    },
    {
        accessorKey: 'is_popular',
        header: t('popular'),
        cell: ({ row }) => {
            const isPopular = row.getValue('is_popular') as boolean;
            if (isOpenMode) {
                return <ToggleCell productId={row.original.id} field="is_popular" initialValue={isPopular} trueLabel={t('popular')} falseLabel={tc('no')} />;
            }
            return isPopular ? (
                <Badge className="bg-black text-white gap-1">
                    <img src="/fire.svg" alt="" className="h-3 w-3" />
                    {t('popular')}
                </Badge>
            ) : (
                <Badge variant="secondary">{tc('no')}</Badge>
            );
        },
        filterFn: (row, id, value) => {
            const popularVal = String(row.getValue(id));
            return value.includes(popularVal);
        }
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return <ProductActions product={product} onEdit={() => openEditSheet(product)} />;
      },
    },
  ], [isOpenMode, t, tc]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Unique categories for filter options
  const uniqueCategories = Array.from(new Set(data.map(p => p.category || t('uncategorized'))))
    .filter(Boolean)
    .map(cat => ({
        label: cat,
        value: cat,
    }));

  // Unique brands for filter options
  const uniqueBrands = Array.from(new Set(data.map(p => p.brand || t('noBrand'))))
    .filter(Boolean)
    .map(b => ({
        label: b,
        value: b,
    }));

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <Input
          placeholder={t('filterPlaceholder')}
          value={(table.getColumn('name_en')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name_en')?.setFilterValue(event.target.value)
          }
          className="w-full sm:max-w-sm"
        />
        
        <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter using DataTableFacetedFilter */}
            {table.getColumn('category') && (
                <DataTableFacetedFilter
                    column={table.getColumn('category')}
                    title={t('category')}
                    options={uniqueCategories}
                />
            )}

             {/* Brand Filter */}
            {table.getColumn('brand') && (
                <DataTableFacetedFilter
                    column={table.getColumn('brand')}
                    title={t('brand')}
                    options={uniqueBrands}
                />
            )}

             {/* Stock Filter using DataTableFacetedFilter */}
             {table.getColumn('stock') && (
                 <DataTableFacetedFilter
                    column={table.getColumn('stock')}
                    title={t('stock')}
                    options={[
                        { label: t('inStock'), value: 'true' },
                        { label: t('outOfStock'), value: 'false' }
                    ]}
                 />
             )}

             {/* Active Status Filter using DataTableFacetedFilter */}
             {table.getColumn('is_active') && (
                 <DataTableFacetedFilter
                    column={table.getColumn('is_active')}
                    title={tc('status')}
                    options={[
                        { label: tc('active'), value: 'true' },
                        { label: tc('inactive'), value: 'false' }
                    ]}
                 />
             )}

             {/* Popular Filter using DataTableFacetedFilter */}
             {table.getColumn('is_popular') && (
                 <DataTableFacetedFilter
                    column={table.getColumn('is_popular')}
                    title={t('popular')}
                    options={[
                        { label: t('popular'), value: 'true' },
                        { label: t('notPopular'), value: 'false' }
                    ]}
                 />
             )}

            <Button
                variant={isOpenMode ? 'default' : 'outline'}
                onClick={() => setIsOpenMode((v) => !v)}
                className="gap-2"
            >
                <Pencil className="h-4 w-4" />
                {isOpenMode ? t('openModeOn') : t('openMode')}
            </Button>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                {t('columns')} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      {isOpenMode && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {t('openModeBanner')}
        </div>
      )}
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-md border bg-slate-50 px-4 py-2">
          <span className="text-sm font-medium text-slate-700">
            {t('selectedCount', { count: table.getSelectedRowModel().rows.length })}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkPriceOpen(true)}>
              {t('editPrice')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              {t('clear')}
            </Button>
          </div>
        </div>
      )}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {tc('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4 px-2">
        <div className="text-sm text-muted-foreground">
          {t('pageOf', { page: table.getState().pagination.pageIndex + 1, total: table.getPageCount() === 0 ? 1 : table.getPageCount() })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t('goToFirstPage')}</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t('goToPreviousPage')}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t('goToNextPage')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t('goToLastPage')}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto overflow-x-hidden sm:max-w-3xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <SheetHeader>
                <SheetTitle>{t('editProduct')}</SheetTitle>
                <SheetDescription>
                    {t('editProductDescription')}
                </SheetDescription>
            </SheetHeader>
            <div className="mt-2">
                {editingProduct && (
                    <ProductForm
                        initialData={editingProduct}
                        categories={categories}
                        brands={brands}
                        onSuccess={() => setIsEditSheetOpen(false)}
                        onCancel={() => setIsEditSheetOpen(false)}
                    />
                )}
            </div>
        </SheetContent>
      </Sheet>

      {/* Bulk Price Edit Dialog */}
      <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editPriceForCount', { count: table.getSelectedRowModel().rows.length })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">{t('newPrice')}</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder={t('pricePlaceholderExample')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkPriceOpen(false)} disabled={isBulkSaving}>
              {tc('cancel')}
            </Button>
            <Button
              disabled={isBulkSaving || bulkPrice === '' || isNaN(Number(bulkPrice)) || Number(bulkPrice) < 0}
              onClick={() => {
                const price = Number(bulkPrice);
                const productIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
                startBulkSaving(async () => {
                  try {
                    await bulkUpdatePrice(productIds, price);
                    toast.success(t('updatedPriceForCount', { count: productIds.length }));
                    table.resetRowSelection();
                    setIsBulkPriceOpen(false);
                    setBulkPrice('');
                    router.refresh();
                  } catch (error) {
                    toast.error(t('failedToUpdatePrices'));
                  }
                });
              }}
            >
              {isBulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductActions({ product, onEdit }: { product: Product, onEdit: () => void }) {
  const router = useRouter();
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(t('confirmDeleteProduct'))) {
      startTransition(async () => {
        try {
          await deleteProduct(product.id);
          toast.success(t('productDeletedSuccessfully'));
          router.refresh();
        } catch (error) {
          toast.error(t('failedToDeleteProduct'));
        }
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">{t('openMenu')}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{tc('actions')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id)}>
          {t('copyProductId')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          {t('editProduct')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 font-medium focus:text-red-700">
          {t('deleteProduct')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditableTextCell({
  productId,
  field,
  initialValue,
  type = 'text',
}: {
  productId: string;
  field: string;
  initialValue: string | number;
  type?: 'text' | 'number';
}) {
  const router = useRouter();
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const [value, setValue] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (type === 'number') {
      const parsed = Number(value);
      if (value.trim() === '' || isNaN(parsed) || parsed < 0) {
        toast.error(t('invalidPrice'));
        setValue(String(initialValue));
        return;
      }
      if (parsed === Number(initialValue)) return;

      setSaving(true);
      try {
        await updateProductFields(productId, { [field]: parsed });
        toast.success(t('saved'));
        router.refresh();
      } catch {
        toast.error(tc('failedToSave'));
        setValue(String(initialValue));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (value.trim() === '') {
      toast.error(t('valueCannotBeEmpty'));
      setValue(String(initialValue));
      return;
    }
    if (value === String(initialValue)) return;

    setSaving(true);
    try {
      await updateProductFields(productId, { [field]: value });
      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(tc('failedToSave'));
      setValue(String(initialValue));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Input
      type={type}
      step={type === 'number' ? '0.01' : undefined}
      min={type === 'number' ? '0' : undefined}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      disabled={saving}
      className="h-8 min-w-[100px] text-sm"
    />
  );
}

function ToggleCell({
  productId,
  field,
  initialValue,
  trueLabel,
  falseLabel,
}: {
  productId: string;
  field: string;
  initialValue: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  const router = useRouter();
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleChange = async (checked: boolean) => {
    const previous = value;
    setValue(checked);
    setSaving(true);
    try {
      await updateProductFields(productId, { [field]: checked });
      toast.success(t('saved'));
      router.refresh();
    } catch {
      toast.error(tc('failedToSave'));
      setValue(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch checked={value} onCheckedChange={handleChange} disabled={saving} />
      <span className="text-xs text-muted-foreground">{value ? trueLabel : falseLabel}</span>
    </div>
  );
}
