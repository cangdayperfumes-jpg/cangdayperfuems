'use client';

import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeleteButtonProps {
  id: string;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  itemName?: string;
}

export default function DeleteButton({ id, onDelete, itemName = 'item' }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete this ${itemName}?`)) {
        return;
    }

    startTransition(async () => {
      const result = await onDelete(id);
      if (result && !result.success) {
        toast.error(result.error || `Failed to delete ${itemName}`);
      } else {
        // Success
        toast.success(`${itemName} deleted successfully`);
        router.refresh();
      }
    });
  };

  return (
    <Button 
        variant="ghost" 
        size="icon" 
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleDelete}
        disabled={isPending}
    >
      <Trash className="h-4 w-4" />
      <span className="sr-only">Delete</span>
    </Button>
  );
}
