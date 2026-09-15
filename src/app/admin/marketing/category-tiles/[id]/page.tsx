import { notFound } from 'next/navigation';
import CategoryTileForm from '@/components/admin/CategoryTileForm';
import { getCategoryTileById } from '../actions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryTilePage(props: Props) {
  const params = await props.params;
  const tile = await getCategoryTileById(params.id);

  if (!tile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Edit Category Tile</h1>
      <CategoryTileForm initialData={tile} />
    </div>
  );
}
