'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { updateShippingZone } from '../actions';
import { CountrySelector } from './CountrySelector';

export function EditZoneDialog({ zone }: { zone: any }) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleUpdate(formData: FormData) {
    setIsUpdating(true);
    const price = parseFloat(formData.get('price') as string);
    const continent = formData.get('continent') as string;
    const shipping_details = formData.get('shipping_details') as string;

    const countryData = formData.get('country_data') as string;
    let updatePayload: any = { 
        price,
        continent: continent || undefined,
        shipping_details: shipping_details || undefined
    };

    if (countryData) {
        const [country_code, country] = countryData.split('|');
        if (country && country_code) {
             updatePayload.country = country;
             updatePayload.country_code = country_code;
        }
    }

    try {
        await updateShippingZone(zone.id, updatePayload);
        setOpen(false);
    } catch (e) {
        console.error(e);
        alert('Failed to update');
    } finally {
        setIsUpdating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 border border-transparent">
            <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shipping Zone: {zone.country}</DialogTitle>
        </DialogHeader>
        <form action={handleUpdate} className="space-y-4 pt-4">
             <div className="space-y-2">
                <label className="text-sm font-medium">Continent</label>
                <select name="continent" defaultValue={zone.continent || ''} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
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
                <label className="text-sm font-medium">Country (Leave empty to keep "{zone.country}")</label>
                <CountrySelector />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Price ($)</label>
                <Input name="price" type="number" defaultValue={zone.price} placeholder="20.00" step="0.01" required />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Custom Shipping Details</label>
                <textarea 
                    name="shipping_details" 
                    defaultValue={zone.shipping_details || ''}
                    placeholder="e.g. Delivery within 3-5 days."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
            </div>
            <div className="flex justify-end gap-2 text-right pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save Changes'}</Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
