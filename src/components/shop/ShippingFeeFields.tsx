'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShippingFeeFieldsProps {
  /** Suggested shipping rate per product for the order's destination
   *  country (from Shipping Zones), used to seed the total. */
  defaultPerProductRate: number;
  /** Number of items the shipping applies to — total = rate × quantity,
   *  unless the total is edited directly. */
  totalQuantity: number;
  /** Re-seed both fields from the defaults above (e.g. when a dialog opens). */
  resetSignal: boolean;
  onTotalChange: (total: number) => void;
}

/** Paired "per product" / "total" shipping inputs: editing the per-product
 *  rate recalculates the total automatically; editing the total directly
 *  overrides that link (with a one-click "auto" reset), mirroring the
 *  unit-price/total-price pattern already used for line items in the
 *  Customize PDF modal. */
export default function ShippingFeeFields({
  defaultPerProductRate,
  totalQuantity,
  resetSignal,
  onTotalChange,
}: ShippingFeeFieldsProps) {
  const [perProductRate, setPerProductRate] = useState(defaultPerProductRate);
  const [total, setTotal] = useState(defaultPerProductRate * totalQuantity);
  const [totalOverridden, setTotalOverridden] = useState(false);

  useEffect(() => {
    setPerProductRate(defaultPerProductRate);
    setTotal(defaultPerProductRate * totalQuantity);
    setTotalOverridden(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    onTotalChange(total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  function handlePerProductChange(value: number) {
    setPerProductRate(value);
    if (!totalOverridden) setTotal(value * totalQuantity);
  }

  function handleTotalChange(value: number) {
    setTotal(value);
    setTotalOverridden(true);
  }

  function resetTotal() {
    setTotal(perProductRate * totalQuantity);
    setTotalOverridden(false);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground whitespace-nowrap">
          Shipping / Product
        </Label>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={perProductRate}
          onChange={(e) => handlePerProductChange(parseFloat(e.target.value) || 0)}
        />
        <p className="text-[10px] text-muted-foreground">
          × {totalQuantity} {totalQuantity === 1 ? 'product' : 'products'}
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Total Shipping</Label>
          {totalOverridden && (
            <button
              type="button"
              onClick={resetTotal}
              className="text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              auto
            </button>
          )}
        </div>
        <Input
          type="number"
          min={0}
          step={0.01}
          value={total}
          onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}
