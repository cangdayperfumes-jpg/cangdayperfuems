'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { refreshStorefrontSettings } from '@/app/admin/settings/actions';
import { WhatsAppIcon } from '@/components/shared/WhatsAppButton';
import { isValidWhatsAppNumber, normalizeWhatsAppNumber, whatsAppLink } from '@/lib/whatsapp';

/**
 * Settings → WhatsApp: the floating chat button on every storefront page.
 * The on/off switch saves at once; the number saves with its button.
 */
export default function WhatsAppSettings({ initial }: { initial: { enabled: boolean; number: string } }) {
  const t = useTranslations('settings');
  const [enabled, setEnabled] = useState(initial.enabled);
  const [number, setNumber] = useState(initial.number ? `+${initial.number}` : '');
  const [saving, setSaving] = useState(false);

  const digits = normalizeWhatsAppNumber(number);
  const valid = isValidWhatsAppNumber(digits);
  const invalid = !!number.trim() && !valid;

  const save = async (nextEnabled: boolean) => {
    if (nextEnabled && !valid) {
      toast.error(t('waNeedNumber'));
      return false;
    }
    setSaving(true);
    try {
      const { error } = await createClient()
        .from('system_settings')
        .update({ whatsapp_enabled: nextEnabled, whatsapp_number: digits || null })
        .eq('id', 'global');
      if (error) throw error;
      await refreshStorefrontSettings().catch((e) => console.error('Storefront refresh failed:', e));
      if (digits) setNumber(`+${digits}`);
      toast.success(t('waSaved'));
      return true;
    } catch (e) {
      console.error('Error saving WhatsApp settings:', e);
      toast.error(t('waFailed'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (v: boolean) => {
    const before = enabled;
    setEnabled(v);
    if (!(await save(v))) setEnabled(before);
  };

  return (
    <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
          <WhatsAppIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{t('waTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('waDescription')}</p>
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('waShow')}
          <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} />
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wa-number">{t('waNumber')}</Label>
        <div className="flex gap-2">
          <Input
            id="wa-number"
            type="tel"
            inputMode="tel"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+90 532 123 45 67"
            className="h-10"
          />
          <Button onClick={() => save(enabled)} disabled={saving || invalid} className="shrink-0">
            {t('waSave')}
          </Button>
        </div>
        <p className={invalid ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
          {invalid ? t('waInvalid') : t('waNumberHint')}
        </p>
        {valid && (
          <a
            href={whatsAppLink(digits)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
          >
            {t('waTest')} (wa.me/{digits}) <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
