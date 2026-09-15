'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, ChevronDown, Loader2, SlidersHorizontal, Ban } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import InvoicePDF from './InvoicePDF';
import CustomizePDFModal from './CustomizePDFModal';
import ShippingCostDialog from './ShippingCostDialog';
import { Order, OrderItem } from '@/types';
import { EditableInvoiceItem } from '@/types/invoice';
import { createClient } from '@/utils/supabase/client';

interface DownloadInvoiceMenuProps {
  order: Order;
  items: OrderItem[];
  /** 'default' = large full-width button (customer success page), 'compact'
   *  = small inline button (admin order row). */
  variant?: 'default' | 'compact';
  /** When false (store-wide hide_prices is on), the "Default PDF" option is
   *  hidden and Customize PDF locks "Include Prices" off. Admin call sites
   *  omit this (always true) — staff always get full control. */
  showPricedOption?: boolean;
  /** Staff-only controls: editing the shipping fee before download and the
   *  full "Customize PDF" line-item editor. Customer-facing call sites omit
   *  this (default false) — customers only get one-click Default/No-Prices
   *  downloads built from the order's actual saved data. */
  isAdmin?: boolean;
}

async function generateAndDownload(document: React.ReactElement<any>, filename: string) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(document).toBlob();
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = filename;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DownloadInvoiceMenu({
  order,
  items,
  variant = 'default',
  showPricedOption = true,
  isAdmin = false,
}: DownloadInvoiceMenuProps) {
  const [isClient, setIsClient] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'default' | 'noprices' | null>(null);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  // Derived from the order's own saved total as a sane fallback until (or
  // if) a matching Shipping Zone rate is found for the destination country.
  const [perProductShippingRate, setPerProductShippingRate] = useState(
    totalQuantity > 0 ? (order.shipping_cost || 0) / totalQuantity : order.shipping_cost || 0
  );

  useEffect(() => {
    // Avoid SSR "document is not defined" issues from @react-pdf/renderer.
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only admin call sites offer shipping editing, so skip the lookup
    // entirely for customer-facing downloads.
    if (!isAdmin) return;
    const country = order.customer_address?.country;
    if (!country) return;
    const supabase = createClient();
    supabase
      .from('shipping_zones')
      .select('price')
      .eq('country', country)
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) setPerProductShippingRate(data[0].price);
      });
  }, [isAdmin, order.customer_address?.country]);

  const filename = `invoice-${order.id.slice(0, 8)}.pdf`;

  async function handleDirectGenerate(hidePrices: boolean) {
    setIsGenerating(true);
    try {
      await generateAndDownload(<InvoicePDF order={order} items={items} hidePrices={hidePrices} />, filename);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDefault() {
    setPendingAction('default');
    setShippingDialogOpen(true);
  }

  function handleNoPrices() {
    setPendingAction('noprices');
    setShippingDialogOpen(true);
  }

  async function handleShippingConfirm(shippingCost: number) {
    if (!pendingAction) return;
    setIsGenerating(true);
    try {
      await generateAndDownload(
        <InvoicePDF
          order={order}
          items={items}
          hidePrices={pendingAction === 'noprices'}
          shippingOverride={shippingCost}
        />,
        filename
      );
      setShippingDialogOpen(false);
      setPendingAction(null);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCustomConfirm(
    customItems: EditableInvoiceItem[],
    options: { includePrices: boolean; shippingCost: number }
  ) {
    setIsGenerating(true);
    try {
      await generateAndDownload(
        <InvoicePDF
          order={order}
          items={items}
          customItems={customItems}
          hidePrices={!options.includePrices}
          shippingOverride={options.shippingCost}
        />,
        filename
      );
      setCustomizeOpen(false);
    } finally {
      setIsGenerating(false);
    }
  }

  const isCompact = variant === 'compact';

  if (!isClient) {
    return (
      <Button
        variant="outline"
        size={isCompact ? 'sm' : 'lg'}
        disabled
        className={isCompact ? 'text-xs h-8 pl-2 pr-3' : 'w-full rounded-none'}
      >
        <Loader2 className={isCompact ? 'mr-1.5 h-3 w-3 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
        {isCompact ? 'Wait...' : 'Loading Options...'}
      </Button>
    );
  }

  // Customers get a single one-click download — no menu, no options. What
  // they get (priced or not) is decided entirely by the store-wide price
  // switch (showPricedOption), and shipping is always the order's real cost.
  if (!isAdmin) {
    return (
      <Button
        variant="outline"
        size={isCompact ? 'sm' : 'lg'}
        disabled={isGenerating}
        className={isCompact ? 'text-xs h-8 pl-2 pr-3' : 'w-full rounded-none'}
        onClick={() => handleDirectGenerate(!showPricedOption)}
      >
        {isGenerating ? (
          <Loader2 className={isCompact ? 'mr-1.5 h-3 w-3 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
        ) : isCompact ? (
          <FileText className="mr-1.5 h-3 w-3" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? 'Generating...' : isCompact ? 'PDF' : 'Download Invoice PDF'}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isCompact ? 'sm' : 'lg'}
            disabled={isGenerating}
            className={isCompact ? 'text-xs h-8 pl-2 pr-3' : 'w-full rounded-none'}
          >
            {isGenerating ? (
              <Loader2 className={isCompact ? 'mr-1.5 h-3 w-3 animate-spin' : 'mr-2 h-4 w-4 animate-spin'} />
            ) : isCompact ? (
              <FileText className="mr-1.5 h-3 w-3" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : isCompact ? 'PDF' : 'Download Invoice PDF'}
            <ChevronDown className={isCompact ? 'ml-1 h-3 w-3' : 'ml-2 h-4 w-4'} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showPricedOption && (
            <DropdownMenuItem onClick={handleDefault}>
              <FileText className="mr-2 h-4 w-4" />
              Default PDF
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleNoPrices}>
            <Ban className="mr-2 h-4 w-4" />
            PDF Without Prices
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCustomizeOpen(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Customize PDF…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CustomizePDFModal
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        items={items}
        defaultPerProductShippingRate={perProductShippingRate}
        showPricedOption={showPricedOption}
        isGenerating={isGenerating}
        onConfirm={handleCustomConfirm}
      />

      <ShippingCostDialog
        open={shippingDialogOpen}
        onOpenChange={(nextOpen) => {
          setShippingDialogOpen(nextOpen);
          if (!nextOpen) setPendingAction(null);
        }}
        defaultPerProductRate={perProductShippingRate}
        totalQuantity={totalQuantity}
        isGenerating={isGenerating}
        onConfirm={handleShippingConfirm}
      />
    </>
  );
}
