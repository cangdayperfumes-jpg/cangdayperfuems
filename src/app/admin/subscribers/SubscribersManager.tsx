'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Copy, Download, Loader2, Mail, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteSubscribers } from './actions';

export interface Subscriber {
  id: string;
  email: string;
  locale: string | null;
  created_at: string;
}

const DAY = 24 * 60 * 60 * 1000;

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

export default function SubscribersManager({ subscribers }: { subscribers: Subscriber[] }) {
  const t = useTranslations('subscribers');
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? subscribers.filter((s) => s.email.toLowerCase().includes(q)) : subscribers;
  }, [subscribers, search]);

  const [now] = useState(() => Date.now());
  const since = (days: number) => subscribers.filter((s) => now - new Date(s.created_at).getTime() < days * DAY).length;

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((s) => s.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Copies the selection, or everything shown, ready to paste into Bcc.
  const copyEmails = async () => {
    const list = (selected.size ? filtered.filter((s) => selected.has(s.id)) : filtered).map((s) => s.email);
    try {
      await navigator.clipboard.writeText(list.join(', '));
      toast.success(t('copied', { count: list.length }));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const remove = (ids: string[]) => {
    if (!ids.length || !confirm(t('confirmDelete', { count: ids.length }))) return;
    startTransition(async () => {
      const res = await deleteSubscribers(ids);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(t('deleted', { count: ids.length }));
      setSelected(new Set());
      router.refresh();
    });
  };

  const exportCsv = () =>
    downloadCsv(`subscribers-${new Date().toISOString().slice(0, 10)}.csv`, [
      [t('colEmail'), t('colLanguage'), t('colDate')],
      ...filtered.map((s) => [s.email, s.locale ?? '', new Date(s.created_at).toLocaleString()]),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('statTotal'), value: subscribers.length },
          { label: t('stat7'), value: since(7) },
          { label: t('stat30'), value: since(30) },
        ].map((s) => (
          <div key={s.label} className="rounded-md border bg-white p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="bg-white pl-9" placeholder={t('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {selected.size > 0 && (
            <Button variant="outline" size="sm" disabled={pending} onClick={() => remove([...selected])} className="text-rose-600 hover:text-rose-700">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {t('deleteSelected', { count: selected.size })}
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={filtered.length === 0} onClick={copyEmails}>
            <Copy className="mr-2 h-4 w-4" /> {selected.size ? t('copySelected') : t('copyAll')}
          </Button>
          <Button variant="outline" size="sm" disabled={filtered.length === 0} onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> {t('exportCsv')}
          </Button>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="rounded-md border bg-white p-10 text-center">
          <Mail className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 font-medium">{t('emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" aria-label={t('selectAll')} checked={allSelected} onChange={toggleAll} />
                </TableHead>
                <TableHead>{t('colEmail')}</TableHead>
                <TableHead>{t('colLanguage')}</TableHead>
                <TableHead>{t('colDate')}</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <input type="checkbox" aria-label={s.email} checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  </TableCell>
                  <TableCell>
                    <a href={`mailto:${s.email}`} className="font-medium hover:underline">{s.email}</a>
                  </TableCell>
                  <TableCell>
                    {s.locale ? <Badge variant="outline" className="uppercase">{s.locale}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{new Date(s.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      aria-label={t('delete')}
                      disabled={pending}
                      onClick={() => remove([s.id])}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">{t('noMatches')}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
