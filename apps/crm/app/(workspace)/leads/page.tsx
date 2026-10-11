import { Leads } from '@/features/leads';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <Leads initialSearch={typeof q === 'string' ? q : ''} />;
}
