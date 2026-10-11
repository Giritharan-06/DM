'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Badge } from '@zyroz/ui';
import { api } from '@/lib/api';
export function Catalog() {
  const [error, setError] = useState('');
  const query = useQuery({
    queryKey: ['catalog'],
    queryFn: () =>
      api<{
        services: {
          id: string;
          name: string;
          description: string | null;
          active: boolean;
        }[];
        sources: { id: string; name: string }[];
      }>('settings/catalog'),
  });
  async function add(e: React.FormEvent<HTMLFormElement>, kind: string) {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      await api('settings/catalog', {
        method: 'POST',
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(form)),
          kind,
        }),
      });
      form.reset();
      query.refetch();
    } catch (error) {
      setError((error as Error).message);
    }
  }
  return (
    <div className="settings-grid" style={{ marginTop: 24 }}>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Card>
        <h3 style={{ fontSize: 20 }}>Service catalog</h3>
        {query.data?.services.map((service) => (
          <div
            className="row between"
            key={service.id}
            style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}
          >
            <div>
              <strong style={{ fontSize: 12 }}>{service.name}</strong>
              <p style={{ fontSize: 11, margin: 0 }}>{service.description}</p>
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await api('settings/catalog', {
                    method: 'PATCH',
                    body: JSON.stringify({
                      id: service.id,
                      active: !service.active,
                    }),
                  });
                  query.refetch();
                } catch (error) {
                  setError((error as Error).message);
                }
              }}
            >
              {service.active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        ))}
        <form
          className="stack"
          style={{ marginTop: 20 }}
          onSubmit={(e) => add(e, 'service')}
        >
          <label className="field">
            Service name
            <input name="name" required minLength={2} />
          </label>
          <label className="field">
            Description
            <textarea name="description" />
          </label>
          <Button>Add service</Button>
        </form>
      </Card>
      <Card>
        <h3 style={{ fontSize: 20 }}>Lead sources</h3>
        <div className="row" style={{ flexWrap: 'wrap', marginBottom: 25 }}>
          {query.data?.sources.map((source) => (
            <Badge key={source.id}>{source.name}</Badge>
          ))}
        </div>
        <form className="stack" onSubmit={(e) => add(e, 'source')}>
          <label className="field">
            Source name
            <input name="name" required minLength={2} />
          </label>
          <Button>Add source</Button>
        </form>
        <p style={{ fontSize: 11, marginTop: 20 }}>
          Website enquiries retain their captured source and UTM attribution.
        </p>
      </Card>
    </div>
  );
}
