import { notFound } from 'next/navigation';
import SeasonalCollectionForm from '@/components/admin/SeasonalCollectionForm';
import { getSeasonalCollectionById } from '../actions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSeasonalCollectionPage(props: Props) {
  const params = await props.params;
  const result = await getSeasonalCollectionById(params.id);

  if (!result) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Edit Seasonal Collection</h1>
      <SeasonalCollectionForm initialData={result.collection} initialProducts={result.products} />
    </div>
  );
}
