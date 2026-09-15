import { getBrandById } from '../actions';
import BrandForm from '@/components/admin/BrandForm';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBrandPage(props: Props) {
  const params = await props.params;
  const brand = await getBrandById(params.id);

  if (!brand) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Edit Brand</h1>
      <BrandForm brand={brand} />
    </div>
  );
}
