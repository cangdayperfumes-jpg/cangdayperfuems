'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Gift, Layers, Loader2, Percent, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { refreshStorefrontSettings } from '@/app/admin/settings/actions';
import { applyOffers, type OffersConfig } from '@/lib/offers';
import { formatPromoAmount } from '@/lib/promotions';

interface Initial {
  offers: OffersConfig;
  gift: { enabled: boolean; threshold: number };
}

function OfferCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
  example,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  example?: string;
  children: ReactNode;
}) {
  const t = useTranslations('offers');
  return (
    <section className={cn('rounded-lg border bg-white p-5 shadow-sm transition-opacity', !enabled && 'opacity-70')}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-gold">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-black">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {enabled ? t('on') : t('off')}
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </label>
      </div>
      <div className={cn('mt-4 grid gap-4 sm:grid-cols-2', !enabled && 'pointer-events-none')}>{children}</div>
      {example && enabled && (
        <p className="mt-4 rounded-md bg-secondary/60 px-3 py-2 text-xs text-ink/80">
          <span className="font-semibold">{t('example')}:</span> {example}
        </p>
      )}
    </section>
  );
}

function NumberField({ label, value, onChange, min = 0, max }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step="1"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        className="h-10"
      />
    </div>
  );
}

export default function OffersForm({ initial, ready }: { initial: Initial; ready: boolean }) {
  const t = useTranslations('offers');
  const [offers, setOffers] = useState<OffersConfig>(initial.offers);
  const [gift, setGift] = useState(initial.gift);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof OffersConfig>(key: K, patch: Partial<OffersConfig[K]>) =>
    setOffers((o) => ({ ...o, [key]: { ...o[key], ...patch } }));

  const money = (n: number) => formatPromoAmount(Math.max(0, Math.round(n * 100) / 100));
  // Live examples use the offer's own limit as the bottle price.
  const solo = (key: keyof OffersConfig): OffersConfig => ({
    pair: { ...offers.pair, enabled: key === 'pair' },
    trio: { ...offers.trio, enabled: key === 'trio' },
    premium: { ...offers.premium, enabled: key === 'premium' },
  });
  const pairSave = applyOffers([{ price: offers.pair.maxPrice, quantity: 2 }], solo('pair')).discount;
  const trioSave = applyOffers([{ price: offers.trio.maxPrice, quantity: offers.trio.count }], solo('trio')).discount;
  const premiumPrice = Math.round(offers.premium.minPrice * 1.2);
  const premiumSave = applyOffers([{ price: premiumPrice, quantity: 1 }], solo('premium')).discount;

  const invalid =
    [offers.pair.maxPrice, offers.pair.percent, offers.trio.maxPrice, offers.trio.count, offers.trio.price, offers.premium.minPrice, offers.premium.percent, gift.threshold].some(
      (n) => !Number.isFinite(n) || n < 0
    ) ||
    offers.pair.percent > 100 ||
    offers.premium.percent > 100 ||
    offers.trio.count < 2 ||
    gift.threshold <= 0;

  const save = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('system_settings')
        .update({ offers, gift_enabled: gift.enabled, gift_threshold: gift.threshold })
        .eq('id', 'global');
      if (error) throw error;
      await refreshStorefrontSettings().catch((e) => console.error('Storefront refresh failed:', e));
      toast.success(t('saved'));
    } catch (e) {
      console.error('Error saving offers:', e);
      toast.error(t('failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-playfair font-bold">{t('title')}</h1>
        <p className="mt-2 max-w-3xl text-gray-500">{t('description')}</p>
      </div>

      {!ready && (
        <p className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('notReady')}</p>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <OfferCard
          icon={<Percent className="h-4 w-4" />}
          title={t('pairTitle')}
          description={t('pairDesc')}
          enabled={offers.pair.enabled}
          onToggle={(v) => set('pair', { enabled: v })}
          example={t('exPair', { price: money(offers.pair.maxPrice), save: money(pairSave) })}
        >
          <NumberField label={t('pairMax')} value={offers.pair.maxPrice} onChange={(n) => set('pair', { maxPrice: n })} />
          <NumberField label={t('pairPercent')} value={offers.pair.percent} max={100} onChange={(n) => set('pair', { percent: n })} />
        </OfferCard>

        <OfferCard
          icon={<Layers className="h-4 w-4" />}
          title={t('trioTitle')}
          description={t('trioDesc')}
          enabled={offers.trio.enabled}
          onToggle={(v) => set('trio', { enabled: v })}
          example={t('exTrio', { count: offers.trio.count, price: money(offers.trio.maxPrice), set: money(offers.trio.price), save: money(trioSave) })}
        >
          <NumberField label={t('trioMax')} value={offers.trio.maxPrice} onChange={(n) => set('trio', { maxPrice: n })} />
          <NumberField label={t('trioCount')} value={offers.trio.count} min={2} onChange={(n) => set('trio', { count: n })} />
          <NumberField label={t('trioPrice')} value={offers.trio.price} onChange={(n) => set('trio', { price: n })} />
        </OfferCard>

        <OfferCard
          icon={<Sparkles className="h-4 w-4" />}
          title={t('premiumTitle')}
          description={t('premiumDesc')}
          enabled={offers.premium.enabled}
          onToggle={(v) => set('premium', { enabled: v })}
          example={t('exPremium', { price: money(premiumPrice), after: money(premiumPrice - premiumSave) })}
        >
          <NumberField label={t('premiumMin')} value={offers.premium.minPrice} onChange={(n) => set('premium', { minPrice: n })} />
          <NumberField label={t('premiumPercent')} value={offers.premium.percent} max={100} onChange={(n) => set('premium', { percent: n })} />
        </OfferCard>

        <OfferCard
          icon={<Gift className="h-4 w-4" />}
          title={t('giftTitle')}
          description={t('giftDesc')}
          enabled={gift.enabled}
          onToggle={(v) => setGift((g) => ({ ...g, enabled: v }))}
        >
          <NumberField label={t('giftThreshold')} value={gift.threshold} min={1} onChange={(n) => setGift((g) => ({ ...g, threshold: n }))} />
        </OfferCard>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-white/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border">
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || invalid || !ready} className="min-w-[180px]">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
