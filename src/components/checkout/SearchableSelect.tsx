'use client';

import { useId, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/**
 * Accent- and Turkish-case-insensitive match, so "istanbul" finds
 * "İstanbul", "canakkale" finds "Çanakkale" and "almanya" finds "Almanya".
 */
function normalize(s: string) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Compact searchable dropdown for long lists (81 provinces, ~195 countries).
 * Opens as a fixed-height panel directly under the field — unlike the Radix
 * Select's default item-aligned mode, which grew to the full viewport height
 * and covered the page for lists this long.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  pinned,
  pinnedLabel,
  restLabel,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  /** Shown first, above a divider (e.g. Turkey above international countries). */
  pinned?: SearchableOption[];
  pinnedLabel?: string;
  restLabel?: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const all = [...(pinned ?? []), ...options];
  const selected = all.find((o) => o.value === value);

  const renderItem = (o: SearchableOption) => (
    <CommandItem
      key={o.value}
      // cmdk filters on `value`; include the label so searching by name works.
      value={`${o.label} ${o.value}`}
      onSelect={() => {
        onChange(o.value);
        setOpen(false);
      }}
      className="flex items-center gap-2 py-2 cursor-pointer data-[selected=true]:bg-gold/15 data-[selected=true]:text-ink"
    >
      {o.icon}
      <span className="flex-1 truncate">{o.label}</span>
      <Check className={cn('h-4 w-4 text-gold-deep', o.value === value ? 'opacity-100' : 'opacity-0')} />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 text-left text-sm shadow-xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
            invalid && 'border-destructive'
          )}
        >
          <span className={cn('flex min-w-0 items-center gap-2', !selected && 'text-muted-foreground')}>
            {selected?.icon}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={listId}
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0 bg-ivory"
      >
        <Command filter={(itemValue, search) => (normalize(itemValue).includes(normalize(search)) ? 1 : 0)}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-10 border-0 shadow-none outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
          />
          <CommandList className="max-h-[260px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            {pinned && pinned.length > 0 && (
              <>
                <CommandGroup heading={pinnedLabel}>{pinned.map(renderItem)}</CommandGroup>
                {options.length > 0 && <CommandSeparator />}
              </>
            )}
            {options.length > 0 && <CommandGroup heading={restLabel}>{options.map(renderItem)}</CommandGroup>}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
