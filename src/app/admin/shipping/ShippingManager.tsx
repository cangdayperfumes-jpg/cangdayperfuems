'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn, formatCurrency } from '@/lib/utils';
import { CONTINENTS } from '@/lib/countries';
import { TURKEY_PROVINCES } from '@/lib/turkey-provinces';
import { DOMESTIC_COUNTRY_CODE, flagUrl, type ShippingZone } from '@/lib/shipping';
import {
  bulkUpdateInternational,
  removeProvinceOverride,
  saveZoneChanges,
  upsertProvinceOverride,
} from './actions';

type Draft = { price: string; is_enabled: boolean };
type StatusFilter = 'all' | 'enabled' | 'disabled';

const CONTINENT_KEY: Record<string, string> = {
  Africa: 'continentAfrica',
  Asia: 'continentAsia',
  Europe: 'continentEurope',
  'North America': 'continentNorthAmerica',
  Oceania: 'continentOceania',
  'South America': 'continentSouthAmerica',
};

const selectClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function ShippingManager({ zones }: { zones: ShippingZone[] }) {
  const t = useTranslations('shipping');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const turkey = zones.find((z) => z.country_code === DOMESTIC_COUNTRY_CODE && !z.city);
  const provinceOverrides = zones
    .filter((z) => z.country_code === DOMESTIC_COUNTRY_CODE && z.city)
    .sort((a, b) => (a.city ?? '').localeCompare(b.city ?? '', 'tr'));
  const international = useMemo(
    () =>
      zones
        .filter((z) => z.country_code !== DOMESTIC_COUNTRY_CODE && !z.city)
        .sort((a, b) => a.country.localeCompare(b.country)),
    [zones]
  );

  // Unsaved edits, keyed by zone id. Rows only appear here once touched.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftFor = (z: ShippingZone): Draft => drafts[z.id] ?? { price: String(z.price), is_enabled: z.is_enabled };
  const setDraft = (z: ShippingZone, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [z.id]: { ...draftFor(z), ...patch } }));
  const dirtyIds = Object.keys(drafts).filter((id) => {
    const zone = zones.find((z) => z.id === id);
    const d = drafts[id];
    return zone && (Number(d.price) !== Number(zone.price) || d.is_enabled !== zone.is_enabled);
  });

  const [search, setSearch] = useState('');
  const [continentFilter, setContinentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [bulkContinent, setBulkContinent] = useState('all');
  const [bulkPrice, setBulkPrice] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [newProvincePrice, setNewProvincePrice] = useState('');

  const visible = international.filter((z) => {
    const d = draftFor(z);
    if (continentFilter !== 'all' && z.continent !== continentFilter) return false;
    if (statusFilter === 'enabled' && !d.is_enabled) return false;
    if (statusFilter === 'disabled' && d.is_enabled) return false;
    const q = search.trim().toLowerCase();
    return !q || z.country.toLowerCase().includes(q) || z.country_code?.toLowerCase() === q;
  });
  const enabledCount = international.filter((z) => draftFor(z).is_enabled).length;

  const run = (action: () => Promise<{ success: boolean; error?: string }>, onDone?: () => void) => {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error || t('saveFailed'));
        return;
      }
      toast.success(t('saved'));
      onDone?.();
      router.refresh();
    });
  };

  const saveAll = () => {
    const changes = dirtyIds.map((id) => ({
      id,
      price: Number(drafts[id].price),
      is_enabled: drafts[id].is_enabled,
    }));
    if (changes.some((c) => !Number.isFinite(c.price) || c.price < 0)) {
      toast.error(t('invalidPrice'));
      return;
    }
    run(() => saveZoneChanges(changes), () => setDrafts({}));
  };

  const applyBulk = (patch: { price?: number; is_enabled?: boolean }) => {
    run(() => bulkUpdateInternational(bulkContinent, patch), () => {
      setDrafts({});
      setBulkPrice('');
    });
  };

  const continentLabel = (c: string | null) => (c && CONTINENT_KEY[c] ? t(CONTINENT_KEY[c]) : c ?? '—');
  const availableProvinces = TURKEY_PROVINCES.filter((p) => !provinceOverrides.some((o) => o.city === p));

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* ── Turkey (domestic) ── */}
      <section className="rounded-lg border bg-white p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Image src={flagUrl('TR', 40)} width={28} height={20} alt="" className="rounded-sm shadow-sm" unoptimized />
          <div>
            <h2 className="font-heading text-lg">{t('domesticTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('domesticHint')}</p>
          </div>
        </div>

        {turkey ? (
          <div className="flex flex-wrap items-end gap-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium">{t('nationalPrice')}</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="w-40"
                value={draftFor(turkey).price}
                onChange={(e) => setDraft(turkey, { price: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 h-9">
              <Switch checked={draftFor(turkey).is_enabled} onCheckedChange={(v) => setDraft(turkey, { is_enabled: v })} />
              <span className="text-sm">{t('shipsHere')}</span>
            </label>
            <p className="text-xs text-muted-foreground h-9 flex items-center">
              {Number(draftFor(turkey).price) === 0 ? t('freeShipping') : formatCurrency(Number(draftFor(turkey).price) || 0)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-destructive">{t('turkeyMissing')}</p>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t('provinceOverrides')}</h3>
          <p className="text-xs text-muted-foreground -mt-2">{t('provinceOverridesHint')}</p>

          {provinceOverrides.length > 0 && (
            <div className="divide-y rounded-md border">
              {provinceOverrides.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 text-sm font-medium">{o.city}</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-32 h-8"
                    value={draftFor(o).price}
                    onChange={(e) => setDraft(o, { price: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={isPending}
                    onClick={() => run(() => removeProvinceOverride(o.id))}
                    aria-label={t('removeOverride', { province: o.city ?? '' })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <select className={cn(selectClass, 'min-w-[180px]')} value={newProvince} onChange={(e) => setNewProvince(e.target.value)}>
              <option value="">{t('selectProvince')}</option>
              {availableProvinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder={t('pricePlaceholder')}
              className="w-32 h-9"
              value={newProvincePrice}
              onChange={(e) => setNewProvincePrice(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!newProvince || newProvincePrice === '' || isPending}
              onClick={() =>
                run(() => upsertProvinceOverride(newProvince, Number(newProvincePrice)), () => {
                  setNewProvince('');
                  setNewProvincePrice('');
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('addOverride')}
            </Button>
          </div>
        </div>
      </section>

      {/* ── International ── */}
      <section className="rounded-lg border bg-white p-6 space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg">{t('internationalTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('internationalHint')}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('enabledCount', { enabled: enabledCount, total: international.length })}
          </span>
        </div>

        {/* Bulk actions */}
        <div className="rounded-md bg-muted/50 p-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium mr-1">{t('bulkApplyTo')}</span>
          <select className={selectClass} value={bulkContinent} onChange={(e) => setBulkContinent(e.target.value)}>
            <option value="all">{t('allInternational')}</option>
            {CONTINENTS.map((c) => (
              <option key={c} value={c}>{continentLabel(c)}</option>
            ))}
          </select>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder={t('pricePlaceholder')}
            className="w-28 h-9 bg-background"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
          />
          <Button size="sm" disabled={bulkPrice === '' || isPending} onClick={() => applyBulk({ price: Number(bulkPrice), is_enabled: true })}>
            {t('setPriceAndEnable')}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => applyBulk({ is_enabled: true })}>
            {t('enableAll')}
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => applyBulk({ is_enabled: false })}>
            {t('disableAll')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchCountryNameOrCode')}
              className="pl-8 h-9 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={selectClass} value={continentFilter} onChange={(e) => setContinentFilter(e.target.value)}>
            <option value="all">{t('allContinents')}</option>
            {CONTINENTS.map((c) => (
              <option key={c} value={c}>{continentLabel(c)}</option>
            ))}
          </select>
          <div className="flex rounded-md border overflow-hidden text-sm">
            {(['all', 'enabled', 'disabled'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn('px-3 h-9', statusFilter === s ? 'bg-ink text-ivory' : 'bg-background hover:bg-muted')}
              >
                {t(`status_${s}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border divide-y max-h-[560px] overflow-y-auto">
          {visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t('noCountryFound')}</p>}
          {visible.map((z) => {
            const d = draftFor(z);
            return (
              <div key={z.id} className={cn('flex items-center gap-3 px-3 py-2', !d.is_enabled && 'opacity-60')}>
                {z.country_code && (
                  <Image src={flagUrl(z.country_code)} width={20} height={15} alt="" className="rounded-sm shadow-sm" unoptimized />
                )}
                <span className="flex-1 min-w-0 truncate text-sm font-medium">{z.country}</span>
                <span className="hidden sm:block w-32 text-xs text-muted-foreground">{continentLabel(z.continent)}</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-28 h-8"
                  value={d.price}
                  onChange={(e) => setDraft(z, { price: e.target.value })}
                  aria-label={t('priceFor', { country: z.country })}
                />
                <Switch
                  checked={d.is_enabled}
                  onCheckedChange={(v) => setDraft(z, { is_enabled: v })}
                  aria-label={t('enableFor', { country: z.country })}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Sticky save bar — appears only when there are unsaved edits. */}
      {dirtyIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border bg-white px-4 py-2 shadow-lg">
          <span className="text-sm">{t('unsavedChanges', { count: dirtyIds.length })}</span>
          <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setDrafts({})}>
            {t('discard')}
          </Button>
          <Button size="sm" disabled={isPending} onClick={saveAll}>
            {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {t('saveChanges')}
          </Button>
        </div>
      )}
    </div>
  );
}
