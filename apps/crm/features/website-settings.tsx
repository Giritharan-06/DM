'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Button } from '@zyroz/ui';
import type { WebsiteSettings as Settings } from '@zyroz/validation';
import { api } from '@/lib/api';
export function WebsiteSettings() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['website-settings'],
    queryFn: () => api<Settings>('settings/website'),
  });
  return (
    <Card style={{ margin: '24px 0' }}>
      <h3 style={{ fontSize: 22 }}>Public website & social links</h3>
      <p style={{ fontSize: 12 }}>
        Manage the website’s contact button, social profiles and appointment
        link. Leave a profile blank to hide its link.
      </p>
      {query.isPending ? (
        <p>Loading website settings…</p>
      ) : query.error ? (
        <p className="error" role="alert">
          {query.error.message}
        </p>
      ) : (
        <form
          key={query.dataUpdatedAt}
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError('');
            setMessage('');
            const form = new FormData(e.currentTarget);
            try {
              const value = await api<Settings>('settings/website', {
                method: 'PATCH',
                body: JSON.stringify({
                  ...Object.fromEntries(form),
                  whatsappEnabled: form.get('whatsappEnabled') === 'on',
                }),
              });
              client.setQueryData(['website-settings'], value);
              setMessage(
                'Website settings saved. Changes appear on the next website page load.',
              );
            } catch (error) {
              setError((error as Error).message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="form-grid">
            {(
              [
                ['email', 'Public email', 'email', 'hello@your-business.com'],
                ['phone', 'Public phone', 'tel', '+91 …'],
                [
                  'whatsapp',
                  'WhatsApp number with country code',
                  'tel',
                  '919876543210',
                ],
                ['bookingUrl', 'Appointment booking URL', 'url', 'https://…'],
                [
                  'instagram',
                  'Instagram profile',
                  'url',
                  'https://www.instagram.com/…',
                ],
                [
                  'facebook',
                  'Facebook page',
                  'url',
                  'https://www.facebook.com/…',
                ],
                [
                  'linkedin',
                  'LinkedIn page',
                  'url',
                  'https://www.linkedin.com/company/…',
                ],
                [
                  'youtube',
                  'YouTube channel',
                  'url',
                  'https://www.youtube.com/@…',
                ],
              ] as const
            ).map(([name, label, type, placeholder]) => (
              <label className="field" key={name}>
                {label}
                <input
                  name={name}
                  type={type}
                  placeholder={placeholder}
                  defaultValue={query.data?.[name] || ''}
                />
              </label>
            ))}
          </div>
          <label className="row" style={{ fontSize: 12 }}>
            <input
              name="whatsappEnabled"
              type="checkbox"
              defaultChecked={query.data?.whatsappEnabled}
            />
            Show the floating contact / WhatsApp button
          </label>
          <div>
            <Button disabled={saving}>
              {saving ? 'Saving…' : 'Save website settings'}
            </Button>
          </div>
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </Card>
  );
}
