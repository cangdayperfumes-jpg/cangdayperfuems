'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  BookOpen,
  ChevronDown,
  Download,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Loader2,
  Megaphone,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Stamp,
  Trash2,
  Wand2,
} from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import ColorInput from '@/components/admin/ColorInput';
import { DragReorderList } from '@/components/shared/DragReorderList';
import CatalogProductPicker from '@/components/admin/catalog/CatalogProductPicker';
import CatalogHTMLPreview from '@/components/admin/catalog/CatalogHTMLPreview';
import { buildCatalogModel } from '@/components/admin/catalog/buildCatalogModel';
import { prepareCatalogImages } from '@/components/admin/catalog/prepareCatalogImages';
import { IMAGE_SPECS } from '@/lib/image-specs';
import { cn } from '@/lib/utils';
import {
  CatalogConfig,
  CatalogModel,
  CatalogBanner,
  CatalogLanguage,
  UNCATEGORIZED_GROUP_KEY,
  UNBRANDED_GROUP_KEY,
  OTHER_BRANDS_THRESHOLD,
  coverCopy,
  defaultCatalogConfig,
} from '@/components/admin/catalog/types';

interface GroupOption {
  id: string;
  name: string;
}

// Settings are remembered per browser so a catalog never has to be set up twice.
const STORAGE_KEY = 'cangday-catalog-config-v2';

function loadSavedConfig(): CatalogConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<CatalogConfig>;
    const base = defaultCatalogConfig(saved.language ?? 'tr');
    return {
      ...base,
      ...saved,
      cover: { ...base.cover, ...saved.cover },
      headerFooter: { ...base.headerFooter, ...saved.headerFooter },
      visibleFields: { ...base.visibleFields, ...saved.visibleFields },
      watermarkLines: saved.watermarkLines?.length ? saved.watermarkLines : base.watermarkLines,
    };
  } catch {
    return null;
  }
}

/** Rough page count: rows of cards per A4 page plus cover, contents and back cover. */
function estimatePages(model: CatalogModel | null): number {
  if (!model || model.totalProductCount === 0) return 0;
  const rowH = model.productsPerRow === 3 ? 312 : 200;
  const usable = 842 - 76 - 58;
  let height = 0;
  model.groups.forEach((g) => {
    height += 64 + Math.ceil(g.products.length / model.productsPerRow) * rowH;
  });
  height += model.bannersByGroupId.size ? Array.from(model.bannersByGroupId.values()).flat().length * 140 : 0;
  return Math.max(1, Math.ceil(height / usable)) + (model.groups.length > 1 ? 3 : 2);
}

/** Small segmented control used for the layout choices. */
function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border bg-slate-50 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'h-8 rounded-[5px] px-3 text-xs font-semibold transition-colors',
            o.value === value ? 'bg-ink text-ivory shadow-sm' : 'text-slate-600 hover:text-ink'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-gold">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold leading-tight">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CatalogGeneratorPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [config, setConfig] = useState<CatalogConfig>(() => defaultCatalogConfig());
  const [previewMode, setPreviewMode] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    const saved = loadSavedConfig();
    // One-time restore from localStorage after mount (not during render, so SSR markup matches).
    if (saved) setConfig(saved);
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch {
        // storage full / blocked — settings just won't be remembered
      }
    }, 400);
    return () => clearTimeout(id);
  }, [config]);

  useEffect(() => {
    async function fetchData() {
      const [{ data: catData }, { data: brandData }, prodData] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('brands').select('*').order('name'),
        fetchAllRows<Product>((from, to) => supabase.from('products').select('*, product_variants(*)').eq('is_active', true).range(from, to)),
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

  // Live model — drives the summary panel, the preview and the PDF.
  const model = useMemo(
    () => (loading ? null : buildCatalogModel(products, categories, brands, config)),
    [loading, products, categories, brands, config]
  );
  const pageEstimate = estimatePages(model);

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
    return [...categories.map((c) => ({ id: c.id, name: c.name })), { id: UNCATEGORIZED_GROUP_KEY, name: 'Uncategorized' }];
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

  /** Switching language also swaps any cover text still at the other language's suggestion. */
  function setLanguage(language: CatalogLanguage) {
    setConfig((prev) => {
      if (prev.language === language) return prev;
      const from = coverCopy(prev.language);
      const to = coverCopy(language);
      const cover = { ...prev.cover };
      (Object.keys(from) as (keyof typeof from)[]).forEach((k) => {
        if (!cover[k] || cover[k] === from[k]) cover[k] = to[k];
      });
      return { ...prev, language, cover };
    });
  }

  function fillSuggestedCopy() {
    updateCover(coverCopy(config.language));
    toast.success(config.language === 'tr' ? 'Önerilen metin eklendi.' : 'Suggested text added.');
  }

  // Company/contact fields are entered once and mirrored onto both the
  // cover page and the running header/footer.
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
      backgroundColor: '#120D0A',
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
      filterStock: 'in-stock',
      manualSelectionOnly: false,
      groupOrder: [],
      productOrderByGroup: {},
    });
  }

  function handleResetAll() {
    if (!confirm('Reset every catalog setting to the suggested defaults?')) return;
    setConfig(defaultCatalogConfig(config.language));
    toast.success('Catalog settings reset.');
  }

  async function handleDownloadPdf() {
    if (!model || model.totalProductCount === 0) {
      toast.error('No products match these settings yet.');
      return;
    }
    setDownloadingPdf(true);
    const total = model.totalProductCount;
    const toastId = toast.loading(`Preparing photos… 0 / ${total}`);

    try {
      const allProducts = model.groups.flatMap((g) => g.products);
      const logoOpts = { format: 'png' as const, maxDimension: 900 };
      const photoOpts = { maxDimension: 1600 };
      const [
        imagesByProductId,
        normalizedCoverLogo,
        normalizedCoverImage,
        normalizedHeaderLogo,
        bannerEntries,
      ] = await Promise.all([
        prepareCatalogImages(allProducts, (done) => {
          if (done % 5 === 0 || done === total) toast.loading(`Preparing photos… ${done} / ${total}`, { id: toastId });
        }),
        model.cover.logoUrl ? normalizeImageForPdf(model.cover.logoUrl, logoOpts) : Promise.resolve(''),
        model.cover.coverImageUrl ? normalizeImageForPdf(model.cover.coverImageUrl, photoOpts) : Promise.resolve(''),
        model.headerFooter.logoUrl ? normalizeImageForPdf(model.headerFooter.logoUrl, logoOpts) : Promise.resolve(''),
        Promise.all(
          config.banners.map(async (b) => [b.id, b.imageUrl ? await normalizeImageForPdf(b.imageUrl, photoOpts) : ''] as const)
        ),
      ]);

      const bannerImagesById = new Map(bannerEntries.filter(([, src]) => src));

      const finalModel: CatalogModel = {
        ...model,
        cover: { ...model.cover, logoUrl: normalizedCoverLogo, coverImageUrl: normalizedCoverImage },
        headerFooter: { ...model.headerFooter, logoUrl: normalizedHeaderLogo },
      };

      toast.loading(`Building the PDF (${total} products)…`, { id: toastId });
      // Let the toast paint before the (blocking) PDF layout starts.
      await new Promise((resolve) => setTimeout(resolve, 50));
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
        />
      ).toBlob();

      const slug = (model.cover.title || 'catalog').toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-').replace(/^-|-$/g, '');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cangday-${slug || 'catalog'}-${new Date().toISOString().slice(0, 10)}.pdf`;
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

  const downloadButton = (
    <Button onClick={handleDownloadPdf} disabled={downloadingPdf || !model?.totalProductCount}>
      {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {downloadingPdf ? 'Generating…' : 'Download PDF'}
    </Button>
  );

  if (previewMode && model) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-30 mb-6 flex flex-col gap-3 rounded-lg border bg-white/95 p-4 shadow-sm backdrop-blur print:hidden sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">Catalog preview</h2>
            <p className="text-sm text-muted-foreground">
              {model.totalProductCount} products · {model.groups.length} sections · about {pageEstimate} pages
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              Back to editor
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            {downloadButton}
          </div>
        </div>

        <div className="overflow-x-hidden rounded-lg border bg-white">
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

  const tr = config.language === 'tr';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Catalog Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A printable PDF catalog of your products, in the Cangday look. Everything is pre-filled — change only what
            you need. Your settings are saved automatically.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleResetAll} className="self-start sm:self-auto">
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reset to defaults
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {/* 1. Layout */}
          <Section icon={LayoutGrid} title="Language & layout" description="How the catalog is organised and what each product card shows.">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Catalog language</Label>
                <div>
                  <Segmented<CatalogLanguage>
                    value={config.language}
                    onChange={setLanguage}
                    options={[
                      { value: 'tr', label: 'Türkçe' },
                      { value: 'en', label: 'English' },
                    ]}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Labels and product descriptions.</p>
              </div>
              <div className="space-y-2">
                <Label>Group products by</Label>
                <div>
                  <Segmented<'category' | 'brand'>
                    value={config.groupBy}
                    onChange={(v) => updateConfig({ groupBy: v })}
                    options={[
                      { value: 'category', label: 'Category' },
                      { value: 'brand', label: 'Brand' },
                    ]}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Products per row</Label>
                <div>
                  <Segmented<3 | 4>
                    value={config.productsPerRow}
                    onChange={(v) => updateConfig({ productsPerRow: v })}
                    options={[
                      { value: 3, label: '3 · larger' },
                      { value: 4, label: '4 · compact' },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 border-t pt-5">
              <Label>Show on each product</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ['price', 'Price'],
                    ['discount', 'Old price (if discounted)'],
                    ['description', 'Description'],
                    ['category', config.groupBy === 'category' ? 'Brand name' : 'Category name'],
                    ['popular', 'Popular badge'],
                    ['stock', 'Out-of-stock badge'],
                  ] as const
                ).map(([key, label]) => {
                  const on = config.visibleFields[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateVisibleField(key, !on)}
                      aria-pressed={on}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        on ? 'border-ink bg-ink text-ivory' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* 2. Cover */}
          <Section
            icon={BookOpen}
            title="Cover"
            description="The dark first page. The Cangday logo is used automatically unless you upload another."
            action={
              <Button type="button" variant="outline" size="sm" onClick={fillSuggestedCopy}>
                <Wand2 className="mr-1.5 h-3.5 w-3.5" /> {tr ? 'Önerilen metin' : 'Suggested text'}
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input value={config.cover.title} onChange={(e) => updateCover({ title: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Subtitle</Label>
                <Input value={config.cover.subtitle} onChange={(e) => updateCover({ subtitle: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Season / collection</Label>
                <Input value={config.cover.seasonName} onChange={(e) => updateCover({ seasonName: e.target.value })} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Short description</Label>
                <Textarea
                  value={config.cover.description}
                  onChange={(e) => updateCover({ description: e.target.value })}
                  className="min-h-[72px]"
                />
                <p className="text-[11px] text-muted-foreground">Shown on the cover when there is no cover photo.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2">
              <ImageUploadField
                label="Logo (optional)"
                value={config.cover.logoUrl || null}
                onChange={updateLogo}
                uploadPrefix="catalog/"
                aspectClassName="h-24"
                spec={IMAGE_SPECS.brand}
                hint="Leave empty to use the gold Cangday logo. A transparent PNG works best."
              />
              <ImageUploadField
                label="Cover photo (optional)"
                value={config.cover.coverImageUrl || null}
                onChange={(url) => updateCover({ coverImageUrl: url || '' })}
                uploadPrefix="catalog-covers/"
                aspectClassName="h-24"
                spec={{ key: 'catalog', width: 1600, height: 1160 }}
                hint="Fills the top half of the cover."
              />
            </div>
          </Section>

          {/* 3. Contact */}
          <Section icon={Phone} title="Contact details" description="On the cover, the back cover and the footer of every page.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Company name</Label>
                <Input value={config.cover.companyName} onChange={(e) => updateCompanyInfo({ companyName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Website</Label>
                <Input value={config.cover.website} onChange={(e) => updateCompanyInfo({ website: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={config.cover.email} onChange={(e) => updateCompanyInfo({ email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Phone / WhatsApp</Label>
                <Input
                  value={config.cover.phone}
                  onChange={(e) => updateCompanyInfo({ phone: e.target.value })}
                  placeholder="+90 5xx xxx xx xx"
                />
              </div>
              <div className="grid gap-2">
                <Label>Instagram / social</Label>
                <Input value={config.cover.social} onChange={(e) => updateCompanyInfo({ social: e.target.value })} placeholder="@cangday" />
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={config.cover.address} onChange={(e) => updateCompanyInfo({ address: e.target.value })} placeholder="İstanbul, Türkiye" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Footer text</Label>
                <Input
                  value={config.headerFooter.copyrightText}
                  onChange={(e) => setConfig((prev) => ({ ...prev, headerFooter: { ...prev.headerFooter, copyrightText: e.target.value } }))}
                />
              </div>
            </div>
          </Section>

          {/* 4. Products */}
          <Section
            icon={Layers}
            title="Products"
            description="Which products go in. By default: every active product that is in stock."
            action={
              <Button type="button" variant="ghost" size="sm" onClick={handleResetSelection}>
                Reset
              </Button>
            }
          >
            <label className="mb-5 flex cursor-pointer items-start gap-2.5 rounded-md border bg-slate-50 p-3">
              <Checkbox
                id="manualSelectionOnly"
                checked={config.manualSelectionOnly}
                onCheckedChange={(checked) => updateConfig({ manualSelectionOnly: !!checked })}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="font-medium">Hand-picked only</span>
                <span className="block text-xs text-muted-foreground">Ignore the filters and use only the products added under “Always include”.</span>
              </span>
            </label>

            <div className={cn('grid gap-6 md:grid-cols-2', config.manualSelectionOnly && 'pointer-events-none opacity-40')}>
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid max-h-52 grid-cols-1 gap-2.5 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
                  {categories.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={config.filterCategoryIds.includes(c.id)}
                        onCheckedChange={(checked) => toggleFilterCategory(c.id, !!checked)}
                      />
                      {c.name}
                    </label>
                  ))}
                  {categories.length === 0 && <span className="text-sm text-gray-500">No categories found</span>}
                </div>
                <p className="text-[11px] text-muted-foreground">None ticked = all categories.</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Popular products</Label>
                  <Select value={config.filterPopular} onValueChange={(val: CatalogConfig['filterPopular']) => updateConfig({ filterPopular: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All products</SelectItem>
                      <SelectItem value="popular">Popular only</SelectItem>
                      <SelectItem value="not-popular">Exclude popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={config.filterStock === 'in-stock'}
                    onCheckedChange={(checked) => updateConfig({ filterStock: checked ? 'in-stock' : 'all' })}
                  />
                  In-stock products only
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-6 border-t pt-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Always include</Label>
                <p className="text-[11px] text-muted-foreground">
                  {config.manualSelectionOnly ? 'The only products in the catalog.' : 'Added even if they don’t match the filters.'}
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
                <Label>Never include</Label>
                <p className="text-[11px] text-muted-foreground">Left out even if they match the filters.</p>
                <CatalogProductPicker
                  label="Search & add products…"
                  placeholder="Search products by name..."
                  value={config.excludeProductIds}
                  onChange={(ids) => updateConfig({ excludeProductIds: ids })}
                  excludeFromSearch={config.includeProductIds}
                />
              </div>
            </div>
          </Section>

          {/* 5. Section order */}
          <Section
            icon={Sparkles}
            title={`${config.groupBy === 'brand' ? 'Brand' : 'Category'} order`}
            description="Drag to set the order of the sections. Empty ones are skipped."
          >
            <DragReorderList
              items={orderedGroupList}
              getKey={(g) => g.id}
              onReorder={handleGroupReorder}
              className="flex max-h-72 flex-col gap-1.5 overflow-y-auto rounded-md border bg-slate-50 p-2"
              renderItem={(group, index, dragControls) => (
                <div className="flex items-center gap-2 rounded-md border bg-white px-2.5 py-2">
                  <button
                    type="button"
                    onPointerDown={(e) => dragControls.start(e)}
                    className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <span className="w-6 font-heading text-xs text-gold-deep">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-sm">{group.name}</span>
                </div>
              )}
            />
          </Section>

          {/* 6. Banners */}
          <Section
            icon={Megaphone}
            title="Promotional banners"
            description="Optional full-width banners between sections — e.g. a discount code or a new collection."
            action={
              <Button type="button" variant="outline" size="sm" onClick={addBanner}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add banner
              </Button>
            }
          >
            <div className="space-y-4">
              {config.banners.map((banner) => (
                <div key={banner.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Select
                      value={banner.afterGroupId ?? 'start'}
                      onValueChange={(val) => updateBanner(banner.id, { afterGroupId: val === 'start' ? null : val })}
                    >
                      <SelectTrigger className="max-w-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Before the first section</SelectItem>
                        {orderedGroupList.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            After “{g.name}”
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBanner(banner.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Title</Label>
                      <Input value={banner.title} onChange={(e) => updateBanner(banner.id, { title: e.target.value })} placeholder={tr ? '%10 İndirim' : '10% Off'} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Subtitle</Label>
                      <Input
                        value={banner.subtitle}
                        onChange={(e) => updateBanner(banner.id, { subtitle: e.target.value })}
                        placeholder={tr ? '3 parfüm ₺5.999' : '3 perfumes for ₺5,999'}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ImageUploadField
                      label="Banner image (optional)"
                      value={banner.imageUrl || null}
                      onChange={(url) => updateBanner(banner.id, { imageUrl: url || '' })}
                      uploadPrefix="catalog-banners/"
                      aspectClassName="h-24"
                      spec={{ key: 'catalog', width: 1600, height: 480 }}
                    />
                    <ColorInput label="Background colour" value={banner.backgroundColor} onChange={(val) => updateBanner(banner.id, { backgroundColor: val })} />
                  </div>
                </div>
              ))}
              {config.banners.length === 0 && <p className="text-sm text-muted-foreground">No banners — the catalog is just products.</p>}
            </div>
          </Section>

          {/* 7. Watermarks (advanced) */}
          <details className="group rounded-lg border bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6">
              <span className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-gold">
                  <Stamp className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-heading text-lg font-semibold leading-tight">Watermarks</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Photos always carry the “CANGDAY” stamp · optional page text.
                  </span>
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>

            <div className="space-y-6 border-t p-5 sm:p-6">
              <p className="rounded-md bg-secondary/60 px-3 py-2 text-xs text-ink/80">
                Every product photo always carries the “CANGDAY” stamp.
              </p>

              <div>
                <h3 className="mb-1 text-sm font-semibold">Page watermark</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Faint diagonal text across every page. Leave the text blank to use the company name.
                </p>
                <div className="space-y-2.5">
                  {config.watermarkLines.map((line, index) => (
                    <div key={line.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center">
                      <label className="flex cursor-pointer items-center gap-2 text-sm md:w-24 md:shrink-0">
                        <Checkbox checked={line.enabled} onCheckedChange={(checked) => updateWatermarkLine(line.id, { enabled: !!checked })} />
                        Line {index + 1}
                      </label>
                      <Input
                        className="md:flex-1"
                        value={line.text}
                        onChange={(e) => updateWatermarkLine(line.id, { text: e.target.value })}
                        placeholder={config.cover.companyName || 'CANGDAY'}
                        disabled={!line.enabled}
                      />
                      <div className="flex items-center gap-3 md:w-56 md:shrink-0">
                        <Slider
                          value={[Math.round(line.opacity * 100)]}
                          onValueChange={([val]) => updateWatermarkLine(line.id, { opacity: val / 100 })}
                          min={1}
                          max={50}
                          step={1}
                          disabled={!line.enabled}
                          className="flex-1"
                        />
                        <span className="w-9 text-right text-xs text-muted-foreground">{Math.round(line.opacity * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* Summary + actions */}
        <aside className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-lg border border-ink bg-ink text-ivory shadow-lg">
            <div className="border-b border-ivory/10 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">{config.cover.seasonName || 'Catalog'}</p>
              <p className="mt-2 font-heading text-xl leading-tight">{config.cover.title || 'Catalog'}</p>
              <p className="mt-1 text-xs text-ivory/60">{config.cover.subtitle}</p>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-ivory/10 border-b border-ivory/10 text-center">
              {[
                ['Products', model?.totalProductCount ?? 0],
                ['Sections', model?.groups.length ?? 0],
                ['Pages', pageEstimate ? `~${pageEstimate}` : 0],
              ].map(([label, value]) => (
                <div key={label as string} className="px-2 py-4">
                  <dd className="font-heading text-2xl tabular-nums text-ivory">{value}</dd>
                  <dt className="mt-0.5 text-[10px] uppercase tracking-wider text-ivory/50">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="space-y-2 p-4">
              <Button
                variant="outline"
                className="w-full border-ivory/20 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"
                onClick={() => setPreviewMode(true)}
                disabled={!model?.totalProductCount}
              >
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
              <Button className="w-full bg-gold text-ink hover:bg-gold-soft" onClick={handleDownloadPdf} disabled={downloadingPdf || !model?.totalProductCount}>
                {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {downloadingPdf ? 'Generating…' : 'Download PDF'}
              </Button>
              {model && model.totalProductCount === 0 && (
                <p className="pt-1 text-center text-xs text-rose-300">No products match these settings.</p>
              )}
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 px-1 text-[11px] text-muted-foreground">
            <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Photos are converted for print automatically — transparent bottle photos get a clean white background.
          </p>
        </aside>
      </div>
    </div>
  );
}
