'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy, Download, Loader2, Plus, Search, Shuffle, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { createCoupon, deleteCoupons, generateCoupons, setCouponActive, type CouponRules } from './actions';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  once_per_customer: boolean;
  expires_at: string | null;
  is_active: boolean;
  batch_id: string | null;
  note: string | null;
  created_at: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired' | 'used_up';

interface RulesDraft {
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  min_order: string;
  unlimited: boolean;
  max_uses: string;
  once_per_customer: boolean;
  expires_at: string; // datetime-local
  note: string;
}

const emptyRules = (maxUses: string): RulesDraft => ({
  discount_type: 'percent',
  discount_value: '10',
  min_order: '0',
  unlimited: false,
  max_uses: maxUses,
  once_per_customer: true,
  expires_at: '',
  note: '',
});

const selectClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

function draftToRules(d: RulesDraft): CouponRules {
  return {
    discount_type: d.discount_type,
    discount_value: Number(d.discount_value),
    min_order: Number(d.min_order || 0),
    max_uses: d.unlimited ? null : Number(d.max_uses),
    once_per_customer: d.once_per_customer,
    expires_at: d.expires_at ? new Date(d.expires_at).toISOString() : null,
    note: d.note,
  };
}

function couponState(c: Coupon): Exclude<StatusFilter, 'all'> {
  if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return 'expired';
  if (c.max_uses !== null && c.used_count >= c.max_uses) return 'used_up';
  return c.is_active ? 'active' : 'inactive';
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  // BOM so Excel opens Turkish characters correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function RulesFields({ draft, setDraft, t }: { draft: RulesDraft; setDraft: (d: RulesDraft) => void; t: ReturnType<typeof useTranslations> }) {
  const set = <K extends keyof RulesDraft>(k: K, v: RulesDraft[K]) => setDraft({ ...draft, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t('discountType')}</Label>
          <select className={`${selectClass} w-full`} value={draft.discount_type} onChange={(e) => set('discount_type', e.target.value as 'percent' | 'fixed')}>
            <option value="percent">{t('typePercent')}</option>
            <option value="fixed">{t('typeFixed')}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>{draft.discount_type === 'percent' ? t('valuePercent') : t('valueFixed')}</Label>
          <Input type="number" min={0} step="0.01" value={draft.discount_value} onChange={(e) => set('discount_value', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('minOrder')}</Label>
          <Input type="number" min={0} step="0.01" value={draft.min_order} onChange={(e) => set('min_order', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('usesPerCode')}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              disabled={draft.unlimited}
              value={draft.unlimited ? '' : draft.max_uses}
              placeholder="∞"
              onChange={(e) => set('max_uses', e.target.value)}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={draft.unlimited} onChange={(e) => set('unlimited', e.target.checked)} />
              {t('unlimited')}
            </label>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t('expiresAt')}</Label>
        <Input type="datetime-local" value={draft.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
        <p className="text-xs text-muted-foreground">{t('expiresAtHint')}</p>
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-medium">{t('oncePerCustomer')}</p>
          <p className="text-xs text-muted-foreground">{t('oncePerCustomerHint')}</p>
        </div>
        <Switch checked={draft.once_per_customer} onCheckedChange={(v) => set('once_per_customer', v)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t('note')}</Label>
        <Input value={draft.note} placeholder={t('notePlaceholder')} onChange={(e) => set('note', e.target.value)} />
      </div>
    </div>
  );
}

export default function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const t = useTranslations('coupons');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createDraft, setCreateDraft] = useState<RulesDraft>(emptyRules('100'));

  const [genOpen, setGenOpen] = useState(false);
  const [genCount, setGenCount] = useState('6');
  const [genPrefix, setGenPrefix] = useState('CANG');
  const [genDraft, setGenDraft] = useState<RulesDraft>(emptyRules('1'));
  const [generated, setGenerated] = useState<string[] | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return coupons.filter(
      (c) =>
        (status === 'all' || couponState(c) === status) &&
        (!q || c.code.toUpperCase().includes(q) || (c.note ?? '').toUpperCase().includes(q))
    );
  }, [coupons, search, status]);

  const describe = (c: Pick<Coupon, 'discount_type' | 'discount_value'>) =>
    c.discount_type === 'percent' ? `%${c.discount_value}` : formatCurrency(c.discount_value);

  const copy = async (text: string, msg = t('copied')) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok?: string, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.success) {
        toast.error(res.error || t('failed'));
        return;
      }
      if (ok) toast.success(ok);
      after?.();
      router.refresh();
    });

  const randomize = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setCreateCode(s);
  };

  const onCreate = () =>
    run(() => createCoupon(createCode, draftToRules(createDraft)), t('created'), () => {
      setCreateOpen(false);
      setCreateCode('');
      setCreateDraft(emptyRules('100'));
    });

  const onGenerate = () =>
    startTransition(async () => {
      const res = await generateCoupons(Number(genCount), genPrefix, draftToRules(genDraft));
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setGenerated(res.data ?? []);
      toast.success(t('generatedCount', { count: res.data?.length ?? 0 }));
      router.refresh();
    });

  const exportRows = (list: Coupon[]) => [
    [t('colCode'), t('colDiscount'), t('minOrder'), t('colUses'), t('oncePerCustomer'), t('colExpires'), t('colStatus'), t('note')],
    ...list.map((c) => [
      c.code,
      describe(c),
      c.min_order,
      `${c.used_count}/${c.max_uses ?? '∞'}`,
      c.once_per_customer ? t('yes') : t('no'),
      c.expires_at ? new Date(c.expires_at).toLocaleString() : '',
      t(`status_${couponState(c)}`),
      c.note ?? '',
    ]),
  ];

  const statusBadge = (c: Coupon) => {
    const s = couponState(c);
    const cls: Record<typeof s, string> = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      inactive: 'bg-slate-50 text-slate-600 border-slate-200',
      expired: 'bg-rose-50 text-rose-700 border-rose-200',
      used_up: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return <Badge variant="outline" className={cls[s]}>{t(`status_${s}`)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setGenerated(null); setGenOpen(true); }}>
            <Sparkles className="mr-2 h-4 w-4" /> {t('generate')}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t('newCoupon')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="bg-white pl-9" placeholder={t('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">{t('filterAll')}</option>
          <option value="active">{t('status_active')}</option>
          <option value="inactive">{t('status_inactive')}</option>
          <option value="expired">{t('status_expired')}</option>
          <option value="used_up">{t('status_used_up')}</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          disabled={filtered.length === 0}
          onClick={() => downloadCsv(`coupons-${new Date().toISOString().slice(0, 10)}.csv`, exportRows(filtered))}
        >
          <Download className="mr-2 h-4 w-4" /> {t('exportCsv')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('colCode')}</TableHead>
              <TableHead>{t('colDiscount')}</TableHead>
              <TableHead>{t('minOrder')}</TableHead>
              <TableHead>{t('colUses')}</TableHead>
              <TableHead>{t('colExpires')}</TableHead>
              <TableHead>{t('colStatus')}</TableHead>
              <TableHead>{t('colActive')}</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold">{c.code}</span>
                    <button type="button" aria-label={t('copy')} onClick={() => copy(c.code)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {c.note && <p className="text-xs text-muted-foreground">{c.note}</p>}
                </TableCell>
                <TableCell className="font-medium">{describe(c)}</TableCell>
                <TableCell>{c.min_order > 0 ? formatCurrency(c.min_order) : '—'}</TableCell>
                <TableCell className="tabular-nums">
                  {c.used_count} / {c.max_uses ?? '∞'}
                  {c.once_per_customer && <p className="text-[11px] text-muted-foreground">{t('oncePerCustomerShort')}</p>}
                </TableCell>
                <TableCell className="text-sm">{c.expires_at ? new Date(c.expires_at).toLocaleString() : '—'}</TableCell>
                <TableCell>{statusBadge(c)}</TableCell>
                <TableCell>
                  <Switch
                    checked={c.is_active}
                    disabled={pending}
                    onCheckedChange={(v) => run(() => setCouponActive([c.id], v))}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('delete')}
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(t('confirmDelete', { code: c.code }))) run(() => deleteCoupons([c.id]), t('deleted'));
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                  {coupons.length === 0 ? t('empty') : t('noMatches')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Create one coupon ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('newCoupon')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('code')}</Label>
              <div className="flex gap-2">
                <Input
                  value={createCode}
                  placeholder="RAMAZAN15"
                  className="font-mono uppercase"
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                />
                <Button type="button" variant="outline" onClick={randomize} aria-label={t('randomCode')}>
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <RulesFields draft={createDraft} setDraft={setCreateDraft} t={t} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('cancel')}</Button>
            <Button onClick={onCreate} disabled={pending || createCode.length < 3}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate a batch ── */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('generateTitle')}</DialogTitle>
          </DialogHeader>
          {generated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('generatedHint', { count: generated.length })}</p>
              <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border bg-slate-50 p-3">
                {generated.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => copy(code)}
                    className="rounded bg-white px-2 py-1.5 text-left font-mono text-sm font-semibold shadow-sm hover:bg-slate-100"
                  >
                    {code}
                  </button>
                ))}
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => copy(generated.join('\n'), t('copiedAll'))}>
                  <Copy className="mr-2 h-4 w-4" /> {t('copyAll')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadCsv(`coupons-${genPrefix || 'batch'}-${new Date().toISOString().slice(0, 10)}.csv`, [[t('colCode')], ...generated.map((c) => [c])])}
                >
                  <Download className="mr-2 h-4 w-4" /> {t('exportCsv')}
                </Button>
                <Button onClick={() => setGenOpen(false)}>{t('done')}</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>{t('howMany')}</Label>
                    <Input type="number" min={1} max={500} value={genCount} onChange={(e) => setGenCount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('prefix')}</Label>
                    <Input
                      value={genPrefix}
                      className="font-mono uppercase"
                      onChange={(e) => setGenPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('preview', { example: `${genPrefix ? genPrefix + '-' : ''}7KQ2XM` })}</p>
                <RulesFields draft={genDraft} setDraft={setGenDraft} t={t} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGenOpen(false)}>{t('cancel')}</Button>
                <Button onClick={onGenerate} disabled={pending || !(Number(genCount) >= 1)}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('generateN', { count: Number(genCount) || 0 })}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
