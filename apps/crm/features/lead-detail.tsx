'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Badge, Button } from '@zyroz/ui';
import { stages, money } from '@zyroz/validation';
import { api } from '@/lib/api';
import type { Lead } from '@/lib/types';
import { RecordForm } from './record-form';
export function LeadDetail({ id }: { id: string }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [follow, setFollow] = useState(false);
  const [clientId, setClientId] = useState('');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['lead', id],
    queryFn: () =>
      api<{
        lead: Lead;
        activities: { id: string; description: string; createdAt: string }[];
      }>(`leads/${id}`),
  });
  const l = query.data?.lead;
  async function patch(value: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      await api(`leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(value),
      });
      await client.invalidateQueries({ queryKey: ['lead', id] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (query.isLoading) return <div className="skeleton" />;
  if (query.error || !l)
    return (
      <p className="error">{query.error?.message || 'Lead unavailable.'}</p>
    );
  return (
    <>
      <Link href="/leads" className="muted" style={{ fontSize: 11 }}>
        ← Back to leads
      </Link>
      <div className="page-heading" style={{ marginTop: 20 }}>
        <div>
          <h1>{l.businessName}</h1>
          <p>
            {l.name} · Received{' '}
            {new Date(l.createdAt).toLocaleDateString('en-IN')}
          </p>
        </div>
        <Badge className={l.stage}>{l.stage.replaceAll('_', ' ')}</Badge>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {clientId && (
        <p className="success">
          Converted to a client.{' '}
          <Link href={`/clients/${clientId}`}>View client →</Link>
        </p>
      )}
      <div className="detail-grid">
        <Card>
          <h3>Business & contact</h3>
          <dl className="detail-list">
            {[
              ['Contact', l.name],
              ['Email', l.email],
              ['Phone', l.phone],
              ['Industry', l.industry],
              ['Interested service', l.service],
              ['Budget range', l.budget],
              ['Deal value', money(l.dealValue)],
              ['Assigned employee ID', l.assignedTo || 'Unassigned'],
            ].map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h3 style={{ fontSize: 15 }}>Business goal</h3>
          <p style={{ fontSize: 13 }}>{l.goal}</p>
          {l.message && <p style={{ fontSize: 13 }}>{l.message}</p>}
          <div className="row" style={{ flexWrap: 'wrap', marginTop: 25 }}>
            <a className="button secondary" href={`tel:${l.phone}`}>
              Call lead
            </a>
            <a className="button secondary" href={`mailto:${l.email}`}>
              Open email
            </a>
            <a
              className="button secondary"
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${l.phone.replace(/\D/g, '')}`}
            >
              Open WhatsApp ↗
            </a>
          </div>
          <p style={{ fontSize: 10, marginTop: 15 }}>
            These links open your communication app. No message delivery is
            recorded.
          </p>
        </Card>
        <Card>
          <h3 style={{ fontSize: 18 }}>Move the conversation forward</h3>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await patch({
                stage: form.get('stage'),
                priority: form.get('priority'),
                notes: form.get('notes'),
                dealValue: Math.round(Number(form.get('value')) * 100),
                nextFollowUp: form.get('next')
                  ? new Date(String(form.get('next'))).toISOString()
                  : null,
              });
            }}
          >
            <div className="form-grid">
              <label className="field">
                Pipeline stage
                <select name="stage" defaultValue={l.stage}>
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Priority
                <select name="priority" defaultValue={l.priority}>
                  {['low', 'medium', 'high'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Estimated deal value (₹)
                <input
                  type="number"
                  name="value"
                  min="0"
                  step="0.01"
                  defaultValue={l.dealValue / 100}
                />
              </label>
              <label className="field">
                Next follow-up
                <input
                  type="datetime-local"
                  name="next"
                  defaultValue={
                    l.nextFollowUp ? l.nextFollowUp.slice(0, 16) : ''
                  }
                />
              </label>
            </div>
            <label className="field">
              Notes
              <textarea name="notes" defaultValue={l.notes || ''} />
            </label>
            <Button disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
          </form>
          <div className="row" style={{ marginTop: 20, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setFollow(true)}>
              Schedule follow-up
            </Button>
            {l.stage === 'won' && (
              <Button
                disabled={busy}
                onClick={async () => {
                  if (!confirm('Convert this Won lead into a client?')) return;
                  setBusy(true);
                  try {
                    const row = await api<{ id: string }>(
                      `leads/${id}/convert`,
                      { method: 'POST', body: '{}' },
                    );
                    setClientId(row.id);
                    query.refetch();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Convert to client
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  confirm(
                    'Archive this lead? It will disappear from active leads.',
                  )
                )
                  patch({ archive: true });
              }}
            >
              Archive
            </Button>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 18 }}>Activity history</h3>
          <ul className="timeline">
            {query.data?.activities.map((a) => (
              <li key={a.id}>
                {a.description}
                <small>{new Date(a.createdAt).toLocaleString('en-IN')}</small>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 style={{ fontSize: 18 }}>Assign an employee</h3>
          <p style={{ fontSize: 12 }}>
            Owners can assign an existing sales employee by their account ID,
            available in Team.
          </p>
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              patch({ assignedTo: String(f.get('assignee')) || null });
            }}
          >
            <label className="field">
              Employee ID
              <input name="assignee" defaultValue={l.assignedTo || ''} />
            </label>
            <Button variant="secondary" disabled={busy}>
              Update assignment
            </Button>
          </form>
        </Card>
      </div>
      {follow && (
        <RecordForm
          module="follow-ups"
          defaults={{ leadId: id, assignedTo: l.assignedTo || '' }}
          onClose={() => setFollow(false)}
          onSaved={() => {
            setFollow(false);
            query.refetch();
          }}
        />
      )}
    </>
  );
}
