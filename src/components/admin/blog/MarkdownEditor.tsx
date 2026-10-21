'use client';

import { useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Table,
  Eye,
  PencilLine,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { uploadToProductsBucket, validateImageFile } from '@/lib/upload-image';
import { cn } from '@/lib/utils';
import { wordCount } from './seo-checks';

/**
 * Markdown writing area with a formatting toolbar, image upload and a live
 * preview. Stored as plain Markdown; the storefront renders it without any
 * script/HTML execution.
 */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useTranslations('blog');
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);

  /** Wraps/prefixes the current selection and restores the cursor. */
  const apply = (fn: (selected: string) => { text: string; select?: [number, number] }) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = value.slice(s, e);
    const { text, select } = fn(selected);
    const next = value.slice(0, s) + text + value.slice(e);
    onChange(next);
    // `select` is relative to the inserted text; default: caret after it.
    const [a, b] = select ? [s + select[0], s + select[1]] : [s + text.length, s + text.length];
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a, b);
    });
  };

  const wrap = (before: string, after = before, fallback = '') =>
    apply((sel) => {
      const inner = sel || fallback;
      return { text: before + inner + after, select: [before.length, before.length + inner.length] };
    });

  const linePrefix = (prefix: string, fallback: string, numbered = false) =>
    apply((sel) => {
      const lines = (sel || fallback).split('\n');
      const text = lines.map((l, i) => (numbered ? `${i + 1}. ` : prefix) + l).join('\n');
      const lead = needsNewline() ? '\n' : '';
      return { text: lead + text, select: [lead.length, lead.length + text.length] };
    });

  const needsNewline = () => {
    const s = ref.current?.selectionStart ?? 0;
    return s > 0 && value[s - 1] !== '\n';
  };

  const insertBlock = (block: string) =>
    apply(() => {
      const lead = needsNewline() ? '\n\n' : '';
      return { text: `${lead}${block}\n` };
    });

  const onImage = async (file: File) => {
    const check = validateImageFile(file);
    if (!check.valid) {
      toast.error(check.error);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToProductsBucket(createClient(), file, 'blog/');
      const alt = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ');
      insertBlock(`![${alt}](${url})`);
    } catch (e) {
      console.error(e);
      toast.error(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const html = useMemo(() => (mode === 'preview' ? (marked.parse(value, { async: false, gfm: true }) as string) : ''), [mode, value]);
  const words = wordCount(value);

  const tools = [
    { icon: Heading2, label: 'H2', run: () => linePrefix('## ', t('mdHeading')) },
    { icon: Heading3, label: 'H3', run: () => linePrefix('### ', t('mdSubheading')) },
    { icon: Bold, label: t('mdBold'), run: () => wrap('**', '**', t('mdBold')) },
    { icon: Italic, label: t('mdItalic'), run: () => wrap('_', '_', t('mdItalic')) },
    { icon: Link2, label: t('mdLink'), run: () => apply((sel) => ({ text: `[${sel || t('mdLinkText')}](/shop)`, select: [1, 1 + (sel || t('mdLinkText')).length] })) },
    { icon: List, label: t('mdBullets'), run: () => linePrefix('- ', t('mdItem')) },
    { icon: ListOrdered, label: t('mdNumbers'), run: () => linePrefix('', t('mdItem'), true) },
    { icon: Quote, label: t('mdQuote'), run: () => linePrefix('> ', t('mdQuoteText')) },
    { icon: Table, label: t('mdTable'), run: () => insertBlock(`| ${t('mdColumn')} 1 | ${t('mdColumn')} 2 |\n| --- | --- |\n| … | … |`) },
    { icon: Minus, label: t('mdDivider'), run: () => insertBlock('---') },
  ];

  return (
    <div className="overflow-hidden rounded-md border bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-slate-50 px-1.5 py-1">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            disabled={mode === 'preview'}
            onClick={tool.run}
            className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-black disabled:opacity-40"
          >
            <tool.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          title={t('mdImage')}
          aria-label={t('mdImage')}
          disabled={mode === 'preview' || uploading}
          onClick={() => fileRef.current?.click()}
          className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-black disabled:opacity-40"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onImage(f);
          }}
        />
        <div className="ml-auto flex rounded-md border bg-white p-0.5 text-xs font-medium">
          {(['write', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn('flex items-center gap-1 rounded px-2.5 py-1', mode === m ? 'bg-slate-900 text-white' : 'text-slate-600')}
            >
              {m === 'write' ? <PencilLine className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {t(m === 'write' ? 'mdWrite' : 'mdPreview')}
            </button>
          ))}
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={22}
          spellCheck
          className="block min-h-[420px] w-full resize-y p-4 font-mono text-sm leading-relaxed outline-none"
        />
      ) : (
        <div
          className="prose-preview min-h-[420px] p-6 text-[15px] leading-relaxed [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:my-4 [&_img]:rounded [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_table]:w-full [&_td]:border-b [&_td]:py-1.5 [&_th]:border-b [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5"
          // Admin-only preview of the admin's own text.
          dangerouslySetInnerHTML={{ __html: html || `<p class="text-slate-400">${t('mdNothing')}</p>` }}
        />
      )}

      <div className="flex items-center justify-between border-t bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
        <span>{t('mdHint')}</span>
        <span className="tabular-nums">{t('mdWords', { count: words })}</span>
      </div>
    </div>
  );
}
