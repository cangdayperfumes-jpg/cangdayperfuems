import { createClient } from '@/utils/supabase/server';
import SettingsForm from '@/components/admin/SettingsForm';
import TelegramSettings from '@/components/admin/TelegramSettings';
import { getTelegramStatus } from './telegram-actions';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';

export default async function SettingsPage() {
  const supabase = await createClient();
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'settings');
  const { data, error } = await supabase
    .from('system_settings')
    .select('hide_prices, popup_enabled, popup_title, popup_message, popup_button_text, popup_button_link, popup_image_url, popup_show_on, popup_ends_at, popup_show_bar, popup_title_tr, popup_message_tr, popup_button_text_tr, new_badge_days, gift_enabled, gift_threshold, ga_measurement_id, gsc_verification, seasonal_collections_multi_active, seasonal_section_position')
    .eq('id', 'global')
    .single();

  const telegramStatus = await getTelegramStatus().catch(() => ({ configured: false, botUsername: null, recipients: [] }));

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching settings:', error);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold">{t('pageTitle')}</h1>
        <p className="text-gray-500 mt-2">{t('pageDescription')}</p>
      </div>

      <div className="xl:columns-2 xl:gap-6">
        <TelegramSettings status={telegramStatus} />
        <SettingsForm initialData={data} />
      </div>
    </div>
  );
}
