'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import ShippingFeeFields from './ShippingFeeFields';

interface ShippingCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Suggested shipping rate per product for the order's destination country. */
  defaultPerProductRate: number;
  totalQuantity: number;
  isGenerating?: boolean;
  onConfirm: (shippingCost: number) => void;
}

export default function ShippingCostDialog({
  open,
  onOpenChange,
  defaultPerProductRate,
  totalQuantity,
  isGenerating = false,
  onConfirm,
}: ShippingCostDialogProps) {
  const [shippingCost, setShippingCost] = useState(defaultPerProductRate * totalQuantity);

  const valid = Number.isFinite(shippingCost) && shippingCost >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Shipping Fee</DialogTitle>
          <DialogDescription>
            Suggested from the order&apos;s destination country. Edit the per-product rate or the
            total directly — this only affects the downloaded invoice, the order&apos;s saved
            shipping cost is unchanged.
          </DialogDescription>
        </DialogHeader>

        <ShippingFeeFields
          defaultPerProductRate={defaultPerProductRate}
          totalQuantity={totalQuantity}
          resetSignal={open}
          onTotalChange={setShippingCost}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!valid || isGenerating}
            onClick={() => onConfirm(shippingCost)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              'Generate & Download PDF'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
