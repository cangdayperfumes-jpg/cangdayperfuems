import { getCategoryById } from '../actions';
import CategoryForm from '@/components/admin/CategoryForm';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage(props: Props) {
  const params = await props.params;
  const category = await getCategoryById(params.id);

  if (!category) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Edit Category</h1>
      <CategoryForm category={category} />
    </div>
  );
}
