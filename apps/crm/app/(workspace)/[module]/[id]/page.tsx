import { notFound } from 'next/navigation';
import { RecordDetail } from '@/features/record-detail';
export default async function Page({
  params,
}: {
  params: Promise<{ module: string; id: string }>;
}) {
  const { module, id } = await params;
  if (
    !['clients', 'campaigns', 'tasks', 'quotations', 'invoices'].includes(
      module,
    )
  )
    notFound();
  return <RecordDetail module={module} id={id} />;
}
