'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import { Card, Button } from '@zyroz/ui';
export function Preferences() {
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const query = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () =>
      api<{ email: boolean; inApp: boolean }>('notifications/preferences'),
  });
  return (
    <Card style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 18 }}>Your notification preferences</h3>
      {query.data && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const f = new FormData(e.currentTarget);
              await api('notifications/preferences', {
                method: 'PATCH',
                body: JSON.stringify({
                  email: f.get('email') === 'on',
                  inApp: f.get('inApp') === 'on',
                }),
              });
              setSaved(true);
              query.refetch();
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <div
            className="row"
            style={{ flexWrap: 'wrap', gap: 25, marginBottom: 20 }}
          >
            <label className="row">
              <input
                type="checkbox"
                name="email"
                defaultChecked={query.data.email}
              />
              Email reminders
            </label>
            <label className="row">
              <input
                type="checkbox"
                name="inApp"
                defaultChecked={query.data.inApp}
              />
              In-app reminders
            </label>
          </div>
          <Button variant="secondary">Save preferences</Button>
          {saved && (
            <span role="status" style={{ marginLeft: 15, fontSize: 12 }}>
              Preferences saved.
            </span>
          )}
        </form>
      )}
      {(query.error || error) && (
        <p className="error">{query.error?.message || error}</p>
      )}
      <p style={{ fontSize: 11, margin: '15px 0 0' }}>
        Email reminders require your configured provider and scheduled worker.
      </p>
    </Card>
  );
}
