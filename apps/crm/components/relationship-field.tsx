'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
const endpoints: Record<string, string> = {
  clientId: 'clients',
  leadId: 'leads',
  campaignId: 'campaigns',
  invoiceId: 'invoices',
  assignedTo: 'directory',
  accountManager: 'directory',
};
type Row = {
  id: string;
  name?: string;
  businessName?: string;
  number?: string;
  role?: string;
};
export function RelationshipField({
  name,
  required,
  defaultValue,
  role,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  role?: string;
}) {
  const endpoint = endpoints[name];
  const query = useQuery({
    queryKey: ['lookup', endpoint],
    queryFn: () => api<{ rows: Row[] }>(`${endpoint}?limit=100`),
    enabled: !!endpoint,
  });
  const rows = role
    ? query.data?.rows.filter((row) => row.role === role)
    : query.data?.rows;
  return (
    <>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue || ''}
        aria-busy={query.isLoading}
      >
        <option value="">
          {query.isLoading ? 'Loading…' : required ? 'Select a record' : 'None'}
        </option>
        {defaultValue && !rows?.some((row) => row.id === defaultValue) && (
          <option value={defaultValue}>Selected record</option>
        )}
        {rows?.map((row) => (
          <option value={row.id} key={row.id}>
            {row.businessName || row.name || row.number || row.id}
            {row.role ? ` · ${row.role}` : ''}
          </option>
        ))}
      </select>
      {query.error && (
        <span className="error" role="alert">
          {query.error.message}
        </span>
      )}
      <span style={{ fontSize: 9, color: 'var(--muted)' }}>
        Shows up to 100 accessible records.
      </span>
    </>
  );
}
