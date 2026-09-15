'use client';

import DownloadInvoiceMenu from '@/components/shop/DownloadInvoiceMenu';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Order, OrderItem } from '@/types';
import { cancelOrder, deleteOrder } from '@/app/admin/actions';

interface AdminOrderActionsProps {
  order: Order;
  items: OrderItem[];
}

export default function AdminOrderActions({ order, items }: AdminOrderActionsProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleAcceptOrder = async () => {
    try {
      setIsAccepting(true);

      // 1. Update Database Status to 'shipped' (maps to 'accepted' logic but respects DB constraints natively)
      const { error: dbError } = await supabase
        .from('orders')
        .update({ status: 'shipped' })
        .eq('id', order.id);

      if (dbError) throw dbError;

      // 2. Fetch API to send Acceptance Email
      if (order.customer_email) {
        const response = await fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'accepted',
            email: order.customer_email,
            orderId: order.id,
            customerName: order.customer_name,
          }),
        });

        if (!response.ok) {
           console.error('Failed to dispatch acceptance email via Resend API');
           toast.error('Order accepted, but failed to send email.');
        } else {
           toast.success('Order accepted & customer notified!');
        }
      } else {
        toast.success('Order accepted! (No email available to notify customer)');
      }

      router.refresh();
    } catch (error: any) {
      console.error('Accept Order Error:', error);
      toast.error('Failed to accept order.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCancelOrder = () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    startTransition(async () => {
      try {
        await cancelOrder(order.id);
        toast.success('Order cancelled successfully.');
      } catch (error: any) {
        console.error('Cancel Order Error:', error);
        toast.error(error.message || 'Failed to cancel order.');
      }
    });
  };

  const handleDeleteOrder = () => {
    if (!confirm('WARNING: This will permanently delete the order and all its items. This action cannot be undone. Are you sure?')) return;
    
    startTransition(async () => {
      try {
        await deleteOrder(order.id);
        toast.success('Order permanently deleted.');
      } catch (error: any) {
        console.error('Delete Order Error:', error);
        toast.error(error.message || 'Failed to delete order.');
      }
    });
  };

  const isAccepted = order.status === 'shipped' || order.status === 'delivered';

  return (
    <div className="flex items-center gap-2 mt-2">
      {/* 1. PDF Download */}
      <DownloadInvoiceMenu order={order} items={items} variant="compact" isAdmin />

      {/* 2. Accept Order Button */}
      <Button
        variant={isAccepted ? "secondary" : "default"}
        size="sm"
        className="text-xs h-8 pl-2 pr-3"
        disabled={isAccepted || isAccepting}
        onClick={handleAcceptOrder}
      >
        {isAccepting ? (
          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle className="mr-1.5 h-3 w-3" />
        )}
        {isAccepted ? 'Accepted' : 'Accept'}
      </Button>

      {/* 3. Cancel Order Button */}
      {order.status !== 'cancelled' && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 pl-2 pr-2 text-rose-600 border-rose-200 hover:bg-rose-50"
          disabled={isPending || isAccepting}
          onClick={handleCancelOrder}
          title="Cancel Order"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}

      {/* 4. Delete Order Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-8 pl-2 pr-2 text-slate-400 hover:text-red-600 hover:bg-red-50"
        disabled={isPending}
        onClick={handleDeleteOrder}
        title="Permanently Delete Order"
      >
         {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
