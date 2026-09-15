'use client';

import { useState, useMemo, useTransition } from 'react';
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

const ProductForm = dynamic(() => import('./ProductForm'), {
  loading: () => <div className="p-8 text-center text-muted-foreground">Loading form...</div>,
  ssr: false,
});

// Extend Product type locally to include category and brand name
type ProductWithDetails = Product & { category?: string; brand?: string };

export function ProductsTable({ data, categories, brands }: { data: ProductWithDetails[]; categories: Category[]; brands: Brand[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'image',
        header: 'Image',
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
            Name (EN)
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
      header: 'Brand',
      cell: ({ row }) => <div className="font-medium">{row.getValue('brand') || '-'}</div>,
      filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <div>{row.getValue('category') || 'Uncategorized'}</div>,
      filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
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
        header: 'Stock Status',
        cell: ({ row }) => {
            const inStock = row.getValue('stock') as boolean;
            if (isOpenMode) {
                return <ToggleCell productId={row.original.id} field="stock" initialValue={inStock} trueLabel="In Stock" falseLabel="Out of Stock" />;
            }
            return (
                <Badge variant={inStock ? 'default' : 'destructive'}>
                    {inStock ? 'In Stock' : 'Out of Stock'}
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
        header: 'Status',
        cell: ({ row }) => {
            const isActive = row.getValue('is_active') as boolean;
            if (isOpenMode) {
                return <ToggleCell productId={row.original.id} field="is_active" initialValue={isActive} trueLabel="Active" falseLabel="Inactive" />;
            }
            return (
                <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Inactive'}
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
        header: 'Popular',
        cell: ({ row }) => {
            const isPopular = row.getValue('is_popular') as boolean;
            if (isOpenMode) {
                return <ToggleCell productId={row.original.id} field="is_popular" initialValue={isPopular} trueLabel="Popular" falseLabel="No" />;
            }
            return isPopular ? (
                <Badge className="bg-black text-white gap-1">
                    <img src="/fire.svg" alt="" className="h-3 w-3" />
                    Popular
                </Badge>
            ) : (
                <Badge variant="secondary">No</Badge>
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
  ], [isOpenMode]);

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
  const uniqueCategories = Array.from(new Set(data.map(p => p.category || 'Uncategorized')))
    .filter(Boolean)
    .map(cat => ({
        label: cat,
        value: cat,
    }));

  // Unique brands for filter options
  const uniqueBrands = Array.from(new Set(data.map(p => p.brand || 'No Brand')))
    .filter(Boolean)
    .map(b => ({
        label: b,
        value: b,
    }));

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <Input
          placeholder="Filter by name (EN) or ID..."
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
                    title="Category"
                    options={uniqueCategories}
                />
            )}

             {/* Brand Filter */}
            {table.getColumn('brand') && (
                <DataTableFacetedFilter
                    column={table.getColumn('brand')}
                    title="Brand"
                    options={uniqueBrands}
                />
            )}

             {/* Stock Filter using DataTableFacetedFilter */}
             {table.getColumn('stock') && (
                 <DataTableFacetedFilter
                    column={table.getColumn('stock')}
                    title="Stock"
                    options={[
                        { label: 'In Stock', value: 'true' },
                        { label: 'Out of Stock', value: 'false' }
                    ]}
                 />
             )}

             {/* Active Status Filter using DataTableFacetedFilter */}
             {table.getColumn('is_active') && (
                 <DataTableFacetedFilter
                    column={table.getColumn('is_active')}
                    title="Status"
                    options={[
                        { label: 'Active', value: 'true' },
                        { label: 'Inactive', value: 'false' }
                    ]}
                 />
             )}

             {/* Popular Filter using DataTableFacetedFilter */}
             {table.getColumn('is_popular') && (
                 <DataTableFacetedFilter
                    column={table.getColumn('is_popular')}
                    title="Popular"
                    options={[
                        { label: 'Popular', value: 'true' },
                        { label: 'Not Popular', value: 'false' }
                    ]}
                 />
             )}

            <Button
                variant={isOpenMode ? 'default' : 'outline'}
                onClick={() => setIsOpenMode((v) => !v)}
                className="gap-2"
            >
                <Pencil className="h-4 w-4" />
                {isOpenMode ? 'Open Mode: ON' : 'Open Mode'}
            </Button>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
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
          Open Mode is on — edit Name, Price, Stock, Status, and Popular directly in the table below. Changes save automatically. Use "Edit Product" for brand, category, images, or description.
        </div>
      )}
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-md border bg-slate-50 px-4 py-2">
          <span className="text-sm font-medium text-slate-700">
            {table.getSelectedRowModel().rows.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkPriceOpen(true)}>
              Edit Price
            </Button>
            <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              Clear
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4 px-2">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() === 0 ? 1 : table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto w-full">
            <SheetHeader>
                <SheetTitle>Edit Product</SheetTitle>
                <SheetDescription>
                    Make changes to your product here. Click save when you're done.
                </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
                {editingProduct && (
                    <ProductForm
                        initialData={editingProduct}
                        categories={categories}
                        brands={brands}
                        onSuccess={() => setIsEditSheetOpen(false)}
                    />
                )}
            </div>
        </SheetContent>
      </Sheet>

      {/* Bulk Price Edit Dialog */}
      <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Price for {table.getSelectedRowModel().rows.length} Products</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">New Price ($)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="e.g. 25.00"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkPriceOpen(false)} disabled={isBulkSaving}>
              Cancel
            </Button>
            <Button
              disabled={isBulkSaving || bulkPrice === '' || isNaN(Number(bulkPrice)) || Number(bulkPrice) < 0}
              onClick={() => {
                const price = Number(bulkPrice);
                const productIds = table.getSelectedRowModel().rows.map((row) => row.original.id);
                startBulkSaving(async () => {
                  try {
                    await bulkUpdatePrice(productIds, price);
                    toast.success(`Updated price for ${productIds.length} products`);
                    table.resetRowSelection();
                    setIsBulkPriceOpen(false);
                    setBulkPrice('');
                    router.refresh();
                  } catch (error) {
                    toast.error('Failed to update prices');
                  }
                });
              }}
            >
              {isBulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductActions({ product, onEdit }: { product: Product, onEdit: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this product?')) {
      startTransition(async () => {
        try {
          await deleteProduct(product.id);
          toast.success('Product deleted successfully');
          router.refresh();
        } catch (error) {
          toast.error('Failed to delete product');
        }
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id)}>
          Copy Product ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          Edit Product
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600 font-medium focus:text-red-700">
          Delete Product
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
  const [value, setValue] = useState(String(initialValue));
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (type === 'number') {
      const parsed = Number(value);
      if (value.trim() === '' || isNaN(parsed) || parsed < 0) {
        toast.error('Invalid price');
        setValue(String(initialValue));
        return;
      }
      if (parsed === Number(initialValue)) return;

      setSaving(true);
      try {
        await updateProductFields(productId, { [field]: parsed });
        toast.success('Saved');
        router.refresh();
      } catch {
        toast.error('Failed to save');
        setValue(String(initialValue));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (value.trim() === '') {
      toast.error('Value cannot be empty');
      setValue(String(initialValue));
      return;
    }
    if (value === String(initialValue)) return;

    setSaving(true);
    try {
      await updateProductFields(productId, { [field]: value });
      toast.success('Saved');
      router.refresh();
    } catch {
      toast.error('Failed to save');
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
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleChange = async (checked: boolean) => {
    const previous = value;
    setValue(checked);
    setSaving(true);
    try {
      await updateProductFields(productId, { [field]: checked });
      toast.success('Saved');
      router.refresh();
    } catch {
      toast.error('Failed to save');
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
