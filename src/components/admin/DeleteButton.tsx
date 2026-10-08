'use client';

import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface DeleteButtonProps {
  id: string;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  itemName?: string;
}

export default function DeleteButton({ id, onDelete, itemName }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('deleteButton');
  const tc = useTranslations('common');
  const resolvedItemName = itemName || t('defaultItemName');

  const handleDelete = () => {
    if (!confirm(t('confirmMessage', { itemName: resolvedItemName }))) {
        return;
    }

    startTransition(async () => {
      const result = await onDelete(id);
      if (result && !result.success) {
        toast.error(result.error || t('failedToDelete', { itemName: resolvedItemName }));
      } else {
        // Success
        toast.success(t('deletedSuccessfully', { itemName: resolvedItemName }));
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
      <span className="sr-only">{tc('delete')}</span>
    </Button>
  );
}
