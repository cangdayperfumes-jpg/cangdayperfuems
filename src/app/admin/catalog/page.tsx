'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { normalizeImageForPdf } from '@/lib/normalize-image-for-pdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Product, Category, Brand } from '@/types';
import { Loader2, Printer, Download, GripVertical, Plus, Trash2 } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import ColorInput from '@/components/admin/ColorInput';
import { DragReorderList } from '@/components/shared/DragReorderList';
import CatalogProductPicker from '@/components/admin/catalog/CatalogProductPicker';
import CatalogHTMLPreview from '@/components/admin/catalog/CatalogHTMLPreview';
import { buildCatalogModel } from '@/components/admin/catalog/buildCatalogModel';
import { prepareCatalogImages } from '@/components/admin/catalog/prepareCatalogImages';
import {
  CatalogConfig,
  CatalogModel,
  CatalogBanner,
  UNCATEGORIZED_GROUP_KEY,
  UNBRANDED_GROUP_KEY,
  OTHER_BRANDS_THRESHOLD,
  defaultCatalogConfig,
} from '@/components/admin/catalog/types';

interface GroupOption {
  id: string;
  name: string;
}

export default function CatalogGeneratorPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [config, setConfig] = useState<CatalogConfig>(defaultCatalogConfig());
  const [previewMode, setPreviewMode] = useState(false);
  const [model, setModel] = useState<CatalogModel | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: catData }, { data: brandData }, prodData] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        fetchAllRows<Product>((from, to) =>
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .range(from, to)
        ),
      ]);

      if (catData) setCategories(catData);
      if (brandData) setBrands(brandData);
      setProducts(prodData);
      setLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const brandNameById = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);

  const candidateGroups: GroupOption[] = useMemo(() => {
    if (config.groupBy === 'brand') {
      const brandProductCounts = new Map<string, number>();
      products.forEach((p) => {
        if (p.brand_id) brandProductCounts.set(p.brand_id, (brandProductCounts.get(p.brand_id) ?? 0) + 1);
      });
      // Mirror buildCatalogModel's merge of small brands into "Other Brands"
      // so the drag-order list matches the sections the catalog actually renders.
      const bigBrands = brands.filter((b) => (brandProductCounts.get(b.id) ?? 0) > OTHER_BRANDS_THRESHOLD);
      return [...bigBrands.map((b) => ({ id: b.id, name: b.name })), { id: UNBRANDED_GROUP_KEY, name: 'Other Brands' }];
    }
    return [
      ...categories.map((c) => ({ id: c.id, name: c.name })),
      { id: UNCATEGORIZED_GROUP_KEY, name: 'Uncategorized' },
    ];
  }, [config.groupBy, categories, brands, products]);

  const orderedGroupList: GroupOption[] = useMemo(() => {
    const byId = new Map(candidateGroups.map((g) => [g.id, g]));
    const ordered: GroupOption[] = [];
    const seen = new Set<string>();
    config.groupOrder.forEach((id) => {
      const g = byId.get(id);
      if (g && !seen.has(id)) {
        ordered.push(g);
        seen.add(id);
      }
    });
    candidateGroups.forEach((g) => {
      if (!seen.has(g.id)) {
        ordered.push(g);
        seen.add(g.id);
      }
    });
    return ordered;
  }, [candidateGroups, config.groupOrder]);

  function updateConfig(patch: Partial<CatalogConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  function updateCover(patch: Partial<CatalogConfig['cover']>) {
    setConfig((prev) => ({ ...prev, cover: { ...prev.cover, ...patch } }));
  }

  // Company/contact fields are entered once and mirrored onto both the
  // cover page and the running header/footer — there's no realistic case
  // where a merchant wants a different phone number on the cover vs. the
  // footer of the same catalog.
  function updateCompanyInfo(patch: {
    companyName?: string;
    phone?: string;
    email?: string;
    website?: string;
    social?: string;
    address?: string;
  }) {
    setConfig((prev) => ({
      ...prev,
      cover: { ...prev.cover, ...patch },
      headerFooter: {
        ...prev.headerFooter,
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.website !== undefined ? { website: patch.website } : {}),
        ...(patch.social !== undefined ? { social: patch.social } : {}),
      },
    }));
  }

  function updateLogo(url: string | null) {
    setConfig((prev) => ({
      ...prev,
      cover: { ...prev.cover, logoUrl: url || '' },
      headerFooter: { ...prev.headerFooter, logoUrl: url || '' },
    }));
  }

  function updateVisibleField(key: keyof CatalogConfig['visibleFields'], value: boolean) {
    setConfig((prev) => ({ ...prev, visibleFields: { ...prev.visibleFields, [key]: value } }));
  }

  function updateWatermarkLine(id: string, patch: Partial<CatalogConfig['watermarkLines'][number]>) {
    setConfig((prev) => ({
      ...prev,
      watermarkLines: prev.watermarkLines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  }

  function updateImageWatermark(patch: Partial<CatalogConfig['imageWatermark']>) {
    setConfig((prev) => ({ ...prev, imageWatermark: { ...prev.imageWatermark, ...patch } }));
  }

  function toggleFilterCategory(id: string, checked: boolean) {
    setConfig((prev) => ({
      ...prev,
      filterCategoryIds: checked ? [...prev.filterCategoryIds, id] : prev.filterCategoryIds.filter((c) => c !== id),
    }));
  }

  function handleGroupReorder(next: GroupOption[]) {
    updateConfig({ groupOrder: next.map((g) => g.id) });
  }

  function addBanner() {
    const banner: CatalogBanner = {
      id: crypto.randomUUID(),
      afterGroupId: null,
      title: '',
      subtitle: '',
      imageUrl: '',
      backgroundColor: '#F5F5F5',
    };
    updateConfig({ banners: [...config.banners, banner] });
  }

  function updateBanner(id: string, patch: Partial<CatalogBanner>) {
    updateConfig({ banners: config.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }

  function removeBanner(id: string) {
    updateConfig({ banners: config.banners.filter((b) => b.id !== id) });
  }

  function handleResetSelection() {
    updateConfig({
      includeProductIds: [],
      excludeProductIds: [],
      filterCategoryIds: [],
      filterPopular: 'all',
      filterStock: 'all',
      manualSelectionOnly: false,
      groupOrder: [],
      productOrderByGroup: {},
    });
  }

  function handleGenerate() {
    setGenerating(true);
    const built = buildCatalogModel(products, categories, brands, config);
    setModel(built);
    setPreviewMode(true);
    setGenerating(false);
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    if (!model) return;
    setDownloadingPdf(true);
    const toastId = toast.loading('Generating PDF... large catalogs can take a little while.');

    try {
      const allProducts = model.groups.flatMap((g) => g.products);
      const wantsLogoWatermark = model.imageWatermark.mode === 'logo' && !!model.imageWatermark.logoUrl;
      const [
        imagesByProductId,
        normalizedCoverLogo,
        normalizedCoverImage,
        normalizedHeaderLogo,
        bannerEntries,
        normalizedImageWatermarkLogo,
      ] = await Promise.all([
        prepareCatalogImages(allProducts),
        normalizeImageForPdf(model.cover.logoUrl),
        model.cover.coverImageUrl ? normalizeImageForPdf(model.cover.coverImageUrl) : Promise.resolve(''),
        normalizeImageForPdf(model.headerFooter.logoUrl),
        Promise.all(
          config.banners.map(async (b) => [b.id, b.imageUrl ? await normalizeImageForPdf(b.imageUrl) : ''] as const)
        ),
        wantsLogoWatermark ? normalizeImageForPdf(model.imageWatermark.logoUrl) : Promise.resolve(''),
      ]);

      const bannerImagesById = new Map(bannerEntries.filter(([, src]) => src));

      const finalModel: CatalogModel = {
        ...model,
        cover: { ...model.cover, logoUrl: normalizedCoverLogo, coverImageUrl: normalizedCoverImage },
        headerFooter: { ...model.headerFooter, logoUrl: normalizedHeaderLogo },
      };

      const [{ pdf }, { default: CatalogPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/admin/catalog/CatalogPDF'),
      ]);

      const blob = await pdf(
        <CatalogPDF
          model={finalModel}
          imagesByProductId={imagesByProductId}
          bannerImagesById={bannerImagesById}
          categoryNameById={categoryNameById}
          brandNameById={brandNameById}
          imageWatermarkLogoSrc={normalizedImageWatermarkLogo}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-catalog-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Catalog PDF downloaded.', { id: toastId });
    } catch (error) {
      console.error('Catalog PDF generation error:', error);
      toast.error('Failed to generate the PDF. Please try again.', { id: toastId });
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (previewMode && model) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mb-8 flex flex-col gap-3 border-b bg-gray-100 p-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">Catalog Preview</h2>
            <p className="text-sm text-gray-500">{model.totalProductCount} products included</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <Button variant="outline" size="sm" className="sm:h-10 sm:px-4 sm:text-base" onClick={() => setPreviewMode(false)}>
              Back to Editor
            </Button>
            <Button variant="outline" size="sm" className="sm:h-10 sm:px-4 sm:text-base" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button size="sm" className="sm:h-10 sm:px-4 sm:text-base" onClick={handleDownloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-hidden">
          <CatalogHTMLPreview model={model} categoryNameById={categoryNameById} brandNameById={brandNameById} />
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            @media print {
                @page { margin: 15mm; size: A4; }
                body { background: white; }
                nav, footer, aside, .print\\:hidden { display: none !important; }
                main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
            }
        `,
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold">Catalog Generator</h1>
        <p className="mt-2 text-gray-500">Generate a custom printable PDF catalog from your existing products.</p>
      </div>

      <div className="space-y-8 rounded-lg border bg-white p-6 shadow-sm">
        {/* 1. Branding & Layout */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">1. Branding & Layout</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ImageUploadField
              label="Catalog Logo"
              value={config.cover.logoUrl || null}
              onChange={updateLogo}
              uploadPrefix="catalog/"
              aspectClassName="h-24"
              hint="Shown on the cover and repeated in every page's header/footer."
            />
            <ImageUploadField
              label="Cover Image (Optional)"
              value={config.cover.coverImageUrl || null}
              onChange={(url) => updateCover({ coverImageUrl: url || '' })}
              uploadPrefix="catalog-covers/"
              aspectClassName="h-24"
              hint="A wide banner photo across the top of the cover page."
            />
            <div className="grid gap-2">
              <Label>Group Products By</Label>
              <Select value={config.groupBy} onValueChange={(val: 'category' | 'brand') => updateConfig({ groupBy: val })}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Products Per Row</Label>
              <Select
                value={String(config.productsPerRow)}
                onValueChange={(val) => updateConfig({ productsPerRow: val === '3' ? 3 : 4 })}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select columns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Per Row (larger images)</SelectItem>
                  <SelectItem value="4">4 Per Row (more compact)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 2. Cover Page */}
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">2. Cover Page</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Catalog Title</Label>
              <Input
                value={config.cover.title}
                onChange={(e) => updateCover({ title: e.target.value })}
                placeholder="Product Catalog"
              />
            </div>
            <div className="grid gap-2">
              <Label>Subtitle</Label>
              <Input
                value={config.cover.subtitle}
                onChange={(e) => updateCover({ subtitle: e.target.value })}
                placeholder="Luxury Fragrances"
              />
            </div>
            <div className="grid gap-2">
              <Label>Season / Collection Name (Optional)</Label>
              <Input
                value={config.cover.seasonName}
                onChange={(e) => updateCover({ seasonName: e.target.value })}
                placeholder="Summer Collection 2026"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={config.cover.description}
                onChange={(e) => updateCover({ description: e.target.value })}
                placeholder="A short line about this catalog..."
                className="min-h-[70px]"
              />
            </div>
          </div>
        </div>

        {/* 3. Company & Contact Info */}
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">3. Company & Contact Info</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Shown on the cover page and repeated in the footer of every page.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Company Name</Label>
              <Input
                value={config.cover.companyName}
                onChange={(e) => updateCompanyInfo({ companyName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input value={config.cover.phone} onChange={(e) => updateCompanyInfo({ phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={config.cover.email} onChange={(e) => updateCompanyInfo({ email: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Website</Label>
              <Input value={config.cover.website} onChange={(e) => updateCompanyInfo({ website: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Social (Optional)</Label>
              <Input
                value={config.cover.social}
                onChange={(e) => updateCompanyInfo({ social: e.target.value })}
                placeholder="@royalperfumes"
              />
            </div>
            <div className="grid gap-2">
              <Label>Address (Optional)</Label>
              <Input value={config.cover.address} onChange={(e) => updateCompanyInfo({ address: e.target.value })} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Footer Copyright Text</Label>
              <Input
                value={config.headerFooter.copyrightText}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, headerFooter: { ...prev.headerFooter, copyrightText: e.target.value } }))
                }
              />
            </div>
          </div>
        </div>

        {/* 4. Select Products */}
        <div className="border-t pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">4. Select Products</h3>
            <Button type="button" variant="ghost" size="sm" onClick={handleResetSelection}>
              Reset Filters & Order
            </Button>
          </div>
          <div className="mb-6 flex items-center space-x-2 rounded-md border bg-muted/30 p-3">
            <Checkbox
              id="manualSelectionOnly"
              checked={config.manualSelectionOnly}
              onCheckedChange={(checked) => updateConfig({ manualSelectionOnly: !!checked })}
            />
            <Label htmlFor="manualSelectionOnly" className="cursor-pointer text-sm font-normal">
              Only include hand-picked products (ignore the filters below — use Force Include only)
            </Label>
          </div>

          <div
            className={config.manualSelectionOnly ? 'pointer-events-none grid grid-cols-1 gap-6 opacity-40 md:grid-cols-2' : 'grid grid-cols-1 gap-6 md:grid-cols-2'}
          >
            <div className="space-y-3">
              <Label>Filter by Categories</Label>
              <div className="grid max-h-48 grid-cols-2 gap-3 overflow-y-auto rounded-md border p-4">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${c.id}`}
                      checked={config.filterCategoryIds.includes(c.id)}
                      onCheckedChange={(checked) => toggleFilterCategory(c.id, !!checked)}
                    />
                    <Label htmlFor={`cat-${c.id}`} className="cursor-pointer text-sm font-normal">
                      {c.name}
                    </Label>
                  </div>
                ))}
                {categories.length === 0 && <span className="text-sm text-gray-500">No categories found</span>}
              </div>
              <p className="text-xs text-muted-foreground">Leave all unchecked to show all categories.</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Filter by Popular</Label>
                <Select
                  value={config.filterPopular}
                  onValueChange={(val: CatalogConfig['filterPopular']) => updateConfig({ filterPopular: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="popular">Popular Only</SelectItem>
                    <SelectItem value="not-popular">Not Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStockOnly"
                  checked={config.filterStock === 'in-stock'}
                  onCheckedChange={(checked) => updateConfig({ filterStock: checked ? 'in-stock' : 'all' })}
                />
                <Label htmlFor="inStockOnly" className="cursor-pointer text-sm font-normal">
                  In Stock Only
                </Label>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Force Include Specific Products</Label>
              <p className="text-xs text-muted-foreground">
                {config.manualSelectionOnly
                  ? 'These are the only products that will appear in the catalog.'
                  : "Always shown, even if they don't match the filters above."}
              </p>
              <CatalogProductPicker
                label="Search & add products…"
                placeholder="Search products by name..."
                value={config.includeProductIds}
                onChange={(ids) => updateConfig({ includeProductIds: ids })}
                excludeFromSearch={config.excludeProductIds}
              />
            </div>
            <div className="space-y-2">
              <Label>Force Exclude Specific Products</Label>
              <p className="text-xs text-muted-foreground">Never shown, even if they match the filters above.</p>
              <CatalogProductPicker
                label="Search & add products…"
                placeholder="Search products by name..."
                value={config.excludeProductIds}
                onChange={(ids) => updateConfig({ excludeProductIds: ids })}
                excludeFromSearch={config.includeProductIds}
              />
            </div>
          </div>
        </div>

        {/* 5. Visible Fields */}
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">5. Visible Fields</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {(
              [
                ['price', 'Price'],
                ['discount', 'Discount (strikethrough)'],
                ['description', 'Description'],
                ['category', 'Category / Brand Tag'],
                ['popular', 'Popular Badge'],
                ['stock', 'Out of Stock Badge'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${key}`}
                  checked={config.visibleFields[key]}
                  onCheckedChange={(checked) => updateVisibleField(key, !!checked)}
                />
                <Label htmlFor={`field-${key}`} className="cursor-pointer text-sm font-normal">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Group Order */}
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">
            6. {config.groupBy === 'brand' ? 'Brand' : 'Category'} Order
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Drag to reorder the sections as they&apos;ll appear in the catalog. Empty groups are simply skipped.
          </p>
          <DragReorderList
            items={orderedGroupList}
            getKey={(g) => g.id}
            onReorder={handleGroupReorder}
            className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md border p-3"
            renderItem={(group, _index, dragControls) => (
              <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                <button
                  type="button"
                  onPointerDown={(e) => dragControls.start(e)}
                  className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                  aria-label="Drag to reorder"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="text-sm">{group.name}</span>
              </div>
            )}
          />
        </div>

        {/* 7. Promotional Banners */}
        <div className="border-t pt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">7. Promotional Banners</h3>
            <Button type="button" variant="outline" size="sm" onClick={addBanner}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Banner
            </Button>
          </div>
          <div className="space-y-4">
            {config.banners.map((banner) => (
              <div key={banner.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label>Insert Position</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeBanner(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={banner.afterGroupId ?? 'start'}
                  onValueChange={(val) => updateBanner(banner.id, { afterGroupId: val === 'start' ? null : val })}
                >
                  <SelectTrigger className="max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Before first section</SelectItem>
                    {orderedGroupList.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        After &quot;{g.name}&quot;
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input value={banner.title} onChange={(e) => updateBanner(banner.id, { title: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={banner.subtitle}
                      onChange={(e) => updateBanner(banner.id, { subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ImageUploadField
                    label="Banner Image (Optional)"
                    value={banner.imageUrl || null}
                    onChange={(url) => updateBanner(banner.id, { imageUrl: url || '' })}
                    uploadPrefix="catalog-banners/"
                    aspectClassName="h-24"
                  />
                  <ColorInput
                    label="Background Color"
                    value={banner.backgroundColor}
                    onChange={(val) => updateBanner(banner.id, { backgroundColor: val })}
                  />
                </div>
              </div>
            ))}
            {config.banners.length === 0 && (
              <p className="text-sm text-muted-foreground">No banners added yet.</p>
            )}
          </div>
        </div>

        {/* 8. Watermark */}
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">8. Page Watermark</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Faint diagonal text repeated across every catalog page. Leave a line&apos;s text blank to repeat your
            company name; turn on more lines for a denser watermark.
          </p>
          <div className="space-y-3">
            {config.watermarkLines.map((line, index) => (
              <div key={line.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center">
                <div className="flex items-center gap-2 md:w-28 md:shrink-0">
                  <Checkbox
                    id={`wm-${line.id}`}
                    checked={line.enabled}
                    onCheckedChange={(checked) => updateWatermarkLine(line.id, { enabled: !!checked })}
                  />
                  <Label htmlFor={`wm-${line.id}`} className="cursor-pointer text-sm font-normal">
                    Line {index + 1}
                  </Label>
                </div>
                <Input
                  className="md:flex-1"
                  value={line.text}
                  onChange={(e) => updateWatermarkLine(line.id, { text: e.target.value })}
                  placeholder={config.cover.companyName || 'ROYAL PERFUMES'}
                  disabled={!line.enabled}
                />
                <div className="flex items-center gap-3 md:w-60 md:shrink-0">
                  <Label className="whitespace-nowrap text-xs text-muted-foreground">Opacity</Label>
                  <Slider
                    value={[Math.round(line.opacity * 100)]}
                    onValueChange={([val]) => updateWatermarkLine(line.id, { opacity: val / 100 })}
                    min={1}
                    max={50}
                    step={1}
                    disabled={!line.enabled}
                    className="flex-1"
                  />
                  <span className="w-9 text-right text-xs text-muted-foreground">
                    {Math.round(line.opacity * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 9. Photo Watermark */}
        <div className="border-t pt-8">
          <h3 className="mb-4 text-lg font-semibold">9. Photo Watermark</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            A small stamp overlaid on every individual product photo — separate from the page-wide watermark above.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={config.imageWatermark.mode}
                onValueChange={(val: CatalogConfig['imageWatermark']['mode']) => updateImageWatermark({ mode: val })}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="logo">Logo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label className="w-16 shrink-0 whitespace-nowrap text-xs text-muted-foreground">Opacity</Label>
              <Slider
                value={[Math.round(config.imageWatermark.opacity * 100)]}
                onValueChange={([val]) => updateImageWatermark({ opacity: val / 100 })}
                min={1}
                max={80}
                step={1}
                disabled={config.imageWatermark.mode === 'none'}
                className="flex-1"
              />
              <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">
                {Math.round(config.imageWatermark.opacity * 100)}%
              </span>
            </div>
          </div>

          {config.imageWatermark.mode === 'text' && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Watermark Text</Label>
                <Input
                  value={config.imageWatermark.text}
                  onChange={(e) => updateImageWatermark({ text: e.target.value })}
                  placeholder={config.cover.companyName || 'ROYAL PERFUMES'}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Text Size</Label>
                  <span className="text-xs text-muted-foreground">{config.imageWatermark.fontSize}pt</span>
                </div>
                <Slider
                  value={[config.imageWatermark.fontSize]}
                  onValueChange={([val]) => updateImageWatermark({ fontSize: val })}
                  min={6}
                  max={24}
                  step={1}
                />
              </div>
              <ColorInput
                label="Outline Color"
                value={config.imageWatermark.strokeColor}
                onChange={(val) => updateImageWatermark({ strokeColor: val })}
              />
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Outline Width</Label>
                  <span className="text-xs text-muted-foreground">
                    {config.imageWatermark.strokeWidth === 0 ? 'None' : `${config.imageWatermark.strokeWidth}pt`}
                  </span>
                </div>
                <Slider
                  value={[config.imageWatermark.strokeWidth]}
                  onValueChange={([val]) => updateImageWatermark({ strokeWidth: val })}
                  min={0}
                  max={3}
                  step={0.5}
                />
              </div>
            </div>
          )}

          {config.imageWatermark.mode === 'logo' && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ImageUploadField
                label="Watermark Logo"
                value={config.imageWatermark.logoUrl || null}
                onChange={(url) => updateImageWatermark({ logoUrl: url || '' })}
                uploadPrefix="catalog-watermarks/"
                aspectClassName="h-24"
              />
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Logo Size</Label>
                  <span className="text-xs text-muted-foreground">{config.imageWatermark.logoSize}% of photo width</span>
                </div>
                <Slider
                  value={[config.imageWatermark.logoSize]}
                  onValueChange={([val]) => updateImageWatermark({ logoSize: val })}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Button onClick={handleGenerate} disabled={generating} size="lg">
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Catalog
          </Button>
        </div>
      </div>
    </div>
  );
}
