'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Native color swatch + synced hex text field — no new dependency needed. */
export default function ColorInput({ label, value, onChange }: ColorInputProps) {
  const swatchValue = HEX_PATTERN.test(value) ? value : '#000000';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded border border-input bg-background p-1"
          aria-label={`${label} swatch`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono uppercase"
        />
      </div>
    </div>
  );
}
