import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteShippingZone, createShippingZone } from '../actions';
import { redirect } from 'next/navigation';
import { COUNTRIES } from '@/lib/countries';
import { CountrySelector } from './CountrySelector';
import { EditZoneDialog } from './EditZoneDialog';

export const dynamic = 'force-dynamic';

export default async function ShippingPage() {
  const supabase = await createClient();
  
  const { data: zones, error } = await supabase
    .from('shipping_zones')
    .select('*')
    .order('country', { ascending: true });

  async function addZone(formData: FormData) {
    'use server';
    const countryData = formData.get('country_data') as string;
    const price = parseFloat(formData.get('price') as string);
    const continent = formData.get('continent') as string;
    const shipping_details = formData.get('shipping_details') as string;

    if (!countryData || isNaN(price)) return;
    
    // countryData is in format "CODE|NAME"
    const [country_code, country] = countryData.split('|');

    await createShippingZone({ 
        country, 
        price,
        continent: continent || undefined,
        country_code: country_code || undefined,
        shipping_details: shipping_details || undefined
    });
  }

  async function deleteZone(formData: FormData) {
      'use server';
      const id = formData.get('id') as string;
      await deleteShippingZone(id);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-heading">Shipping Zones</h1>

      {/* Simple Add Form */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-medium mb-4">Add New Zone</h2>
        <form action={addZone} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Continent</label>
                    <select name="continent" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <option value="">Select Continent</option>
                        <option value="Africa">Africa</option>
                        <option value="Asia">Asia</option>
                        <option value="Europe">Europe</option>
                        <option value="North America">North America</option>
                        <option value="Oceania">Oceania</option>
                        <option value="South America">South America</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <CountrySelector />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Price ($)</label>
                    <Input name="price" type="number" placeholder="20.00" step="0.01" required />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Custom Shipping Details (Optional)</label>
                <textarea 
                    name="shipping_details" 
                    placeholder="e.g. Delivery within 3-5 days. Customs duties may apply."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                </Button>
            </div>
        </form>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Continent</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones?.map((zone: any) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        {zone.country_code && (
                             <Image
                                src={`https://flagcdn.com/w20/${zone.country_code.toLowerCase()}.png`}
                                width={20}
                                height={15}
                                alt={`${zone.country} flag`}
                                className="rounded-sm object-cover shadow-sm"
                                style={{ width: '20px', height: '15px' }}
                                unoptimized
                            />
                        )}
                        {zone.country}
                    </div>
                </TableCell>
                <TableCell>{zone.continent || '-'}</TableCell>
                <TableCell>${zone.price}</TableCell>
                <TableCell>
                    {zone.shipping_details ? (
                        <span className="text-xs text-gray-500 line-clamp-1 max-w-[200px]" title={zone.shipping_details}>
                            {zone.shipping_details}
                        </span>
                    ) : '-'}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                        <EditZoneDialog zone={zone} />
                        <form action={deleteZone}>
                            <input type="hidden" name="id" value={zone.id} />
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </TableCell>
              </TableRow>
            ))}
            {(!zones || zones.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                  No shipping zones configured.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
