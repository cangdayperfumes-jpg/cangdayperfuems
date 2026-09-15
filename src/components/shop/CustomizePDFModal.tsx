'use client';

import { useEffect, useMemo, useState } from 'react';
import { GripVertical, Copy, Trash2, Eye, EyeOff, RotateCcw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DragReorderList } from '@/components/shared/DragReorderList';
import { OrderItem } from '@/types';
import { EditableInvoiceItem, toEditableItems, duplicateEditableItem } from '@/types/invoice';

interface CustomizePDFModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OrderItem[];
  /** Suggested shipping rate per product for the order's destination country. */
  defaultPerProductShippingRate: number;
  showPricedOption?: boolean;
  isGenerating?: boolean;
  onConfirm: (
    items: EditableInvoiceItem[],
    options: { includePrices: boolean; shippingCost: number }
  ) => void;
}

function isRowValid(item: EditableInvoiceItem): boolean {
  return (
    item.name.trim().length > 0 &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0 &&
    Number.isFinite(item.totalPrice) &&
    item.totalPrice >= 0 &&
    Number.isFinite(item.shippingRate) &&
    item.shippingRate >= 0 &&
    Number.isFinite(item.shippingTotal) &&
    item.shippingTotal >= 0
  );
}

const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

export default function CustomizePDFModal({
  open,
  onOpenChange,
  items,
  defaultPerProductShippingRate,
  showPricedOption = true,
  isGenerating = false,
  onConfirm,
}: CustomizePDFModalProps) {
  const [editableItems, setEditableItems] = useState<EditableInvoiceItem[]>([]);
  const [includePrices, setIncludePrices] = useState(showPricedOption);

  // Fresh edit buffer every time the modal opens — never persists across
  // closes, and never touches the DB. Each item's shipping seeds from the
  // order's destination-country rate x its own quantity, then can be
  // edited per product below.
  useEffect(() => {
    if (open) {
      setEditableItems(toEditableItems(items, defaultPerProductShippingRate));
      setIncludePrices(showPricedOption);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const visibleItems = editableItems.filter((i) => !i.hidden);
  const visibleCount = visibleItems.length;
  const hiddenCount = editableItems.length - visibleCount;
  const totalShipping = visibleItems.reduce((sum, i) => sum + i.shippingTotal, 0);

  const allValid = useMemo(() => editableItems.every(isRowValid), [editableItems]);

  function updateItem(key: string, patch: Partial<EditableInvoiceItem>) {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const next = { ...item, ...patch };
        if ('quantity' in patch || 'unitPrice' in patch) {
          if (!next.totalPriceOverridden) {
            next.totalPrice = next.quantity * next.unitPrice;
          }
        }
        if ('totalPrice' in patch) {
          next.totalPriceOverridden = true;
        }
        if ('quantity' in patch || 'shippingRate' in patch) {
          if (!next.shippingTotalOverridden) {
            next.shippingTotal = next.quantity * next.shippingRate;
          }
        }
        if ('shippingTotal' in patch) {
          next.shippingTotalOverridden = true;
        }
        return next;
      })
    );
  }

  function resetTotal(key: string) {
    setEditableItems((prev) =>
      prev.map((item) =>
        item._key === key
          ? { ...item, totalPrice: item.quantity * item.unitPrice, totalPriceOverridden: false }
          : item
      )
    );
  }

  function resetShippingTotal(key: string) {
    setEditableItems((prev) =>
      prev.map((item) =>
        item._key === key
          ? { ...item, shippingTotal: item.quantity * item.shippingRate, shippingTotalOverridden: false }
          : item
      )
    );
  }

  function handleDuplicate(key: string) {
    setEditableItems((prev) => {
      const index = prev.findIndex((i) => i._key === key);
      if (index === -1) return prev;
      const copy = duplicateEditableItem(prev[index]);
      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  }

  function handleRemove(key: string) {
    setEditableItems((prev) => prev.filter((i) => i._key !== key));
  }

  function handleToggleHidden(key: string) {
    setEditableItems((prev) =>
      prev.map((i) => (i._key === key ? { ...i, hidden: !i.hidden } : i))
    );
  }

  function handleResetToOriginal() {
    setEditableItems(toEditableItems(items, defaultPerProductShippingRate));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize PDF</DialogTitle>
          <DialogDescription>
            Edits here are temporary and only affect the generated PDF — nothing is saved to the
            order, inventory, or products.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between border-b pb-3">
          <p className="text-sm text-muted-foreground">
            {visibleCount} item{visibleCount === 1 ? '' : 's'} visible
            {hiddenCount > 0 && ` · ${hiddenCount} hidden`}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={handleResetToOriginal}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to Original
          </Button>
        </div>

        <DragReorderList
          items={editableItems}
          getKey={(item) => item._key}
          onReorder={setEditableItems}
          className="flex flex-col gap-3"
          renderItem={(item, _index, dragControls) => {
            const valid = isRowValid(item);
            return (
              <div
                className={cn(
                  'rounded-lg border p-4 transition-opacity',
                  item.hidden && 'opacity-50 bg-muted/40',
                  !valid && 'border-destructive'
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onPointerDown={(e) => dragControls.start(e)}
                    className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item._key, { name: e.target.value })}
                        placeholder="Product name"
                        className="font-medium"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title={item.hidden ? 'Show in PDF' : 'Hide from PDF'}
                        onClick={() => handleToggleHidden(item._key)}
                      >
                        {item.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        title="Duplicate"
                        onClick={() => handleDuplicate(item._key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                        title="Remove"
                        onClick={() => handleRemove(item._key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item._key, { quantity: parseInt(e.target.value, 10) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Unit Price</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(item._key, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Total Price</Label>
                          {item.totalPriceOverridden && (
                            <button
                              type="button"
                              onClick={() => resetTotal(item._key)}
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
                          value={item.totalPrice}
                          onChange={(e) =>
                            updateItem(item._key, { totalPrice: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Shipping / Unit</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.shippingRate}
                          onChange={(e) =>
                            updateItem(item._key, { shippingRate: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Shipping Total</Label>
                          {item.shippingTotalOverridden && (
                            <button
                              type="button"
                              onClick={() => resetShippingTotal(item._key)}
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
                          value={item.shippingTotal}
                          onChange={(e) =>
                            updateItem(item._key, { shippingTotal: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Variant</Label>
                        <Input
                          value={item.variant}
                          onChange={(e) => updateItem(item._key, { variant: e.target.value })}
                          placeholder="—"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <Input
                          value={item.size}
                          onChange={(e) => updateItem(item._key, { size: e.target.value })}
                          placeholder="—"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Color</Label>
                        <Input
                          value={item.color}
                          onChange={(e) => updateItem(item._key, { color: e.target.value })}
                          placeholder="—"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <Textarea
                        value={item.notes}
                        onChange={(e) => updateItem(item._key, { notes: e.target.value })}
                        placeholder="Optional note for this item..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          }}
        />

        {editableItems.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            All items removed. Use &quot;Reset to Original&quot; to bring them back.
          </p>
        )}

        <DialogFooter className="flex-col items-stretch gap-4 border-t pt-4 sm:flex-col sm:items-stretch sm:justify-start">
          <div className="flex items-center gap-2">
            <Switch
              id="include-prices"
              checked={includePrices}
              disabled={!showPricedOption}
              onCheckedChange={setIncludePrices}
            />
            <Label htmlFor="include-prices" className="text-sm font-normal">
              Include prices
            </Label>
          </div>

          <div className="flex w-full max-w-sm items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Total Shipping (sum of products above)</span>
            <span className="font-medium">{formatMoney(totalShipping)}</span>
          </div>

          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!allValid || isGenerating}
              onClick={() => onConfirm(editableItems, { includePrices, shippingCost: totalShipping })}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate & Download PDF'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
