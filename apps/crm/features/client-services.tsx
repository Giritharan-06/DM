'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Card, Button, Badge } from '@zyroz/ui';
export function ClientServices({ id }: { id: string }) {
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['client-services', id],
    queryFn: () =>
      api<{
        rows: { id: string; name: string }[];
        catalog: { id: string; name: string }[];
        contracts: {
          id: string;
          startsAt: string;
          endsAt: string | null;
          terms: string;
        }[];
      }>(`clients/${id}/services`),
  });
  return (
    <div className="detail-grid">
      <Card>
        <h3 style={{ fontSize: 20 }}>Services purchased</h3>
        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 25 }}>
          {query.data?.rows.map((service) => (
            <Badge key={service.id}>{service.name}</Badge>
          ))}
        </div>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api(`clients/${id}/services`, {
                method: 'POST',
                body: JSON.stringify({
                  kind: 'service',
                  serviceId: new FormData(e.currentTarget).get('serviceId'),
                }),
              });
              query.refetch();
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <label className="field">
            Link a service
            <select name="serviceId" required defaultValue="">
              <option value="" disabled>
                Select an active service
              </option>
              {query.data?.catalog.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <Button variant="secondary">Add client service</Button>
        </form>
        <p style={{ fontSize: 11, marginTop: 15 }}>
          Service and contract changes require the owner or finance manager.
        </p>
        {(error || query.error) && (
          <p className="error" role="alert">
            {error || query.error?.message}
          </p>
        )}
      </Card>
      <Card>
        <h3 style={{ fontSize: 20 }}>Contracts</h3>
        {query.data?.contracts.map((contract) => (
          <div
            key={contract.id}
            style={{ padding: '15px 0', borderBottom: '1px solid var(--line)' }}
          >
            <Badge>
              {contract.startsAt.slice(0, 10)} →{' '}
              {contract.endsAt?.slice(0, 10) || 'Open-ended'}
            </Badge>
            <p style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginTop: 10 }}>
              {contract.terms}
            </p>
          </div>
        ))}
        <form
          className="stack"
          style={{ marginTop: 20 }}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const f = new FormData(e.currentTarget);
              await api(`clients/${id}/services`, {
                method: 'POST',
                body: JSON.stringify({
                  kind: 'contract',
                  startsAt: new Date(String(f.get('startsAt'))).toISOString(),
                  ...(f.get('endsAt')
                    ? {
                        endsAt: new Date(String(f.get('endsAt'))).toISOString(),
                      }
                    : {}),
                  terms: f.get('terms'),
                }),
              });
              query.refetch();
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <label className="field">
            Start date
            <input type="datetime-local" name="startsAt" required />
          </label>
          <label className="field">
            End date (optional)
            <input type="datetime-local" name="endsAt" />
          </label>
          <label className="field">
            Agreed terms
            <textarea name="terms" required />
          </label>
          <Button>Add contract</Button>
        </form>
      </Card>
    </div>
  );
}
