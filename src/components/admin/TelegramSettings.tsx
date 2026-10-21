'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExternalLink, Loader2, Send, Trash2, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createTelegramLink,
  removeTelegramRecipient,
  sendTelegramTest,
  type TelegramStatus,
} from '@/app/admin/settings/telegram-actions';

/** Settings → Telegram: who receives new-order alerts and the 21:00 daily summary. */
export default function TelegramSettings({ status }: { status: TelegramStatus }) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<'link' | 'test' | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [links, setLinks] = useState<{ personal: string; group: string } | null>(null);
  const [, startTransition] = useTransition();

  const connect = async () => {
    setBusy('link');
    try {
      const res = await createTelegramLink(locale === 'en' ? 'en' : 'tr');
      if (!res.success) {
        toast.error(t(res.error === 'bad_token' ? 'tgBadToken' : res.error === 'webhook' ? 'tgWebhookFailed' : 'tgFailed'));
        return;
      }
      setLinks({ personal: res.personal, group: res.group });
      window.open(res.personal, '_blank', 'noopener');
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      const res = await sendTelegramTest();
      if (res.success) toast.success(t('tgTestSent', { count: res.sent }));
      else toast.error(t('tgTestFailed'));
    } finally {
      setBusy(null);
    }
  };

  const remove = (id: string) => {
    if (!window.confirm(t('tgConfirmRemove'))) return;
    setRemoving(id);
    startTransition(async () => {
      const res = await removeTelegramRecipient(id);
      setRemoving(null);
      if (!res.success) toast.error(t('tgFailed'));
      router.refresh();
    });
  };

  return (
    <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('tgTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('tgDescription')}</p>
        </div>
        {status.botUsername && (
          <a
            href={`https://t.me/${status.botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
          >
            @{status.botUsername} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {!status.configured ? (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">{t('tgNotConfigured')}</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t('tgStep1')}</li>
            <li>{t('tgStep2')}</li>
            <li>{t('tgStep3')}</li>
          </ol>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            {status.recipients.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{t('tgNoRecipients')}</p>
            ) : (
              <ul className="divide-y">
                {status.recipients.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                      {r.chat_id < 0 ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.name || r.chat_id}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.chat_id < 0 ? t('tgGroup') : t('tgPerson')} · {r.lang.toUpperCase()}
                      </span>
                    </span>
                    <Button variant="ghost" size="icon" aria-label={t('tgRemove')} disabled={removing === r.id} onClick={() => remove(r.id)}>
                      {removing === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-rose-600" />}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={connect} disabled={busy !== null}>
              {busy === 'link' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {t('tgConnect')}
            </Button>
            <Button type="button" variant="outline" onClick={test} disabled={busy !== null || status.recipients.length === 0}>
              {busy === 'test' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('tgSendTest')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.refresh()} disabled={busy !== null}>
              {t('tgRefresh')}
            </Button>
          </div>

          {links && (
            <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
              <p>{t('tgLinkHint')}</p>
              <div className="flex flex-wrap gap-2">
                <a href={links.personal} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-sky-700 underline">
                  <User className="h-3.5 w-3.5" /> {t('tgOpenPersonal')}
                </a>
                <a href={links.group} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-sky-700 underline">
                  <Users className="h-3.5 w-3.5" /> {t('tgOpenGroup')}
                </a>
              </div>
              <p className="text-xs text-muted-foreground">{t('tgLinkExpiry')}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">{t('tgWhatYouGet')}</p>
        </div>
      )}
    </div>
  );
}
