'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * CSV / PDF export with a visible "working" state — a plain link gave no
 * feedback while the server built the report (several seconds for a PDF),
 * which invited repeat clicks.
 */
export default function ExportButtons({ csvHref, pdfHref }: { csvHref: string; pdfHref: string }) {
  const t = useTranslations('orders');
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);

  const download = async (format: 'csv' | 'pdf') => {
    setBusy(format);
    try {
      const res = await fetch(format === 'csv' ? csvHref : pdfHref, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const name =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ?? `cangday-orders.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      toast.error(t('exportFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => download('csv')} aria-busy={busy === 'csv'}>
        {busy === 'csv' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
        {busy === 'csv' ? t('exportPreparing') : t('exportCsv')}
      </Button>
      <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => download('pdf')} aria-busy={busy === 'pdf'}>
        {busy === 'pdf' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        {busy === 'pdf' ? t('exportPreparing') : t('exportPdf')}
      </Button>
    </div>
  );
}
