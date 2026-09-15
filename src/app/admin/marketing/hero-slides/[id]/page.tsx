import { notFound } from 'next/navigation';
import HeroSlideForm from '@/components/admin/HeroSlideForm';
import { getHeroSlideById } from '../actions';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditHeroSlidePage(props: Props) {
  const params = await props.params;
  const slide = await getHeroSlideById(params.id);

  if (!slide) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Edit Hero Slide</h1>
      <HeroSlideForm initialData={slide} />
    </div>
  );
}
