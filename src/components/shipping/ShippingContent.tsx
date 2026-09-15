'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';
import Image from "next/image";
import { useSettings } from '@/components/providers/SettingsProvider';
import ShippingMap from './ShippingMap';

interface ShippingContentProps {
  groupedZones: Record<string, any[]>;
  allZones: any[]; // Flat list of zones for the map
}

export default function ShippingContent({ groupedZones, allZones }: ShippingContentProps) {
  const { hidePrices } = useSettings();
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filteredGroupedZones = useMemo(() => {
    if (!search.trim()) return groupedZones || {};
    const q = search.trim().toLowerCase();
    const result: Record<string, any[]> = {};
    Object.entries(groupedZones || {}).forEach(([continent, zones]) => {
      const matches = (zones as any[]).filter((z) => z.country.toLowerCase().includes(q));
      if (matches.length) result[continent] = matches;
    });
    return result;
  }, [groupedZones, search]);

  const continents = Object.entries(filteredGroupedZones);

  return (
    <div className="space-y-12">
      <ShippingMap validZones={allZones} />

      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-medium">Regional Shipping Rates</h2>
            <span className="text-xs uppercase tracking-widest text-gray-400">Updated Live</span>
        </div>

        <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search a country or region..."
                className="pl-9"
            />
        </div>

        <div className="space-y-6">
            {groupedZones && Object.keys(groupedZones).length > 0 ? (
                continents.length > 0 ? continents.map(([continent, continentZones]: [string, any]) => {
                    const isCollapsed = collapsed[continent];
                    return (
                    <div key={continent} className="border rounded-sm overflow-hidden bg-white">
                        <button
                            type="button"
                            onClick={() => setCollapsed((prev) => ({ ...prev, [continent]: !prev[continent] }))}
                            className="w-full flex items-center justify-between bg-gray-100/50 px-4 py-3 border-b border-gray-200 text-left"
                        >
                            <span className="flex items-baseline gap-2">
                                <h3 className="font-heading font-semibold text-lg">{continent}</h3>
                                <span className="text-xs text-gray-400 font-light">{continentZones.length} {continentZones.length === 1 ? 'country' : 'countries'}</span>
                            </span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>
                        {!isCollapsed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                                {continentZones.map((zone: any) => (
                                    <div key={zone.id} className="bg-white p-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {zone.country_code && (
                                                    <div className="flex-shrink-0">
                                                        <Image
                                                            src={`https://flagcdn.com/w20/${zone.country_code.toLowerCase()}.png`}
                                                            width={22}
                                                            height={16}
                                                            alt={`${zone.country} flag`}
                                                            className="rounded-[2px] object-cover shadow-sm block"
                                                            unoptimized
                                                        />
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-800 truncate">{zone.country}</span>
                                            </div>
                                            {!hidePrices && (
                                                <span className="text-black font-semibold text-sm whitespace-nowrap">
                                                    ${zone.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {zone.shipping_details && (
                                            <Accordion type="single" collapsible className="w-full mt-1">
                                                <AccordionItem value="details" className="border-none">
                                                <AccordionTrigger className="py-1 text-xs text-gray-500 hover:text-black hover:no-underline font-light flex justify-start gap-1">
                                                    View Shipment Details
                                                </AccordionTrigger>
                                                <AccordionContent className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md mt-2 border border-gray-100 whitespace-pre-wrap break-words">
                                                    {zone.shipping_details}
                                                </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}) : (
                    <div className="border rounded-sm overflow-hidden text-center py-12 text-muted-foreground bg-gray-50">
                        No countries match &quot;{search}&quot;.
                    </div>
                )
            ) : (
                <div className="border rounded-sm overflow-hidden text-center py-12 text-muted-foreground bg-gray-50">
                    Loading latest rates...
                </div>
            )}
        </div>
        <p className="text-sm text-gray-400 italic">
            * If your country is not listed, please calculate your order at checkout or contact us for a quote.
        </p>
      </section>
    </div>
  );
}
