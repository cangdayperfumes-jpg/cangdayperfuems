'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRIES } from '@/lib/countries';
import Image from 'next/image';

export function CountrySelector() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const selectedCountry = COUNTRIES.find((c) => c.code === value);

  return (
    <>
      {/* Hidden input to pass the selected value to the Server Action FormData */}
      {selectedCountry && (
        <input 
            type="hidden" 
            name="country_data" 
            value={`${selectedCountry.code}|${selectedCountry.name}`} 
        />
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal h-10 px-3 bg-background border-input"
          >
            <div className="flex items-center gap-2 truncate">
                {selectedCountry ? (
                <>
                    <Image 
                        src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                        width={20}
                        height={15}
                        alt={`${selectedCountry.name} flag`}
                        className="rounded-sm object-cover shadow-sm"
                        unoptimized
                    />
                    <span className="truncate">{selectedCountry.name}</span>
                </>
                ) : (
                <span className="text-muted-foreground">Search country...</span>
                )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country name or code..." />
            <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                {COUNTRIES.map((country) => (
                    <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.code}`}
                        onSelect={() => {
                            setValue(country.code);
                            setOpen(false);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                    <Check
                        className={cn(
                        'mr-2 h-4 w-4',
                        value === country.code ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    <Image 
                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                        width={20}
                        height={15}
                        alt={`${country.name} flag`}
                        className="rounded-sm object-cover shadow-sm"
                        unoptimized
                    />
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                        {country.code}
                    </span>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
