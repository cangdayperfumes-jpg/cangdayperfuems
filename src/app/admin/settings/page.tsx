import { createClient } from '@/utils/supabase/server';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('hide_prices, popup_enabled, popup_title, popup_message, popup_button_text, popup_button_link, popup_image_url, popup_show_on, seasonal_collections_multi_active, seasonal_section_position')
    .eq('id', 'global')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching settings:', error);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold">Store Settings</h1>
        <p className="text-gray-500 mt-2">Manage global configuration for your store.</p>
      </div>

      <SettingsForm initialData={data} />
    </div>
  );
}
