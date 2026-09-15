import SeasonalCollectionForm from '@/components/admin/SeasonalCollectionForm';

export default function NewSeasonalCollectionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">New Seasonal Collection</h1>
      <SeasonalCollectionForm />
    </div>
  );
}
