import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { authorize } from '@/lib/server';
import type { Module } from '@zyroz/auth/permissions';
import { Operations } from '@/features/operations';
import { Reports } from '@/features/reports';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ module: string }>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const { module } = await params;
  const query=await searchParams;
  if (
    ![
      'clients',
      'campaigns',
      'tasks',
      'follow-ups',
      'quotations',
      'invoices',
      'payments',
      'reports',
      'team',
      'notifications',
      'settings',
    ].includes(module)
  )
    notFound();
  let actor;
  try {
    actor = await authorize(await headers(), module as Module);
  } catch {}
  if (!actor)
    return (
      <div className="card">
        <h2 style={{ fontSize: 25 }}>Access unavailable</h2>
        <p>
          Your account cannot access this module, or the database is
          unavailable.
        </p>
      </div>
    );
  return module === 'reports' ? (
    <Reports />
  ) : (
    <Operations module={module} actorId={actor.id} initialStatus={typeof query.status==='string'?query.status:''}/>
  );
}
