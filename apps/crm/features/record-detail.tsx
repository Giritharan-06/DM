'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Badge } from '@zyroz/ui';
import { money } from '@zyroz/validation';
import { api } from '@/lib/api';
import { FileManager } from './files';
import { RecordForm } from './record-form';
import { ClientServices } from './client-services';
type Row = Record<string, string | number | null>;
export function RecordDetail({ module, id }: { module: string; id: string }) {
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const query = useQuery({
    queryKey: [module, id],
    queryFn: () => api<Record<string, Row | Row[]>>(`${module}/${id}`),
  });
  const singular =
    module === 'clients'
      ? 'client'
      : module === 'campaigns'
        ? 'campaign'
        : module === 'tasks'
          ? 'task'
          : module === 'invoices'
            ? 'invoice'
            : 'quotation';
  const row = query.data?.[singular] as Row | undefined;
  async function submit(
    e: React.FormEvent<HTMLFormElement>,
    action: string,
    transform?: (v: Record<string, unknown>) => Record<string, unknown>,
  ) {
    e.preventDefault();
    const values: Record<string, unknown> = Object.fromEntries(
      new FormData(e.currentTarget),
    );
    setError('');
    try {
      await api(`${module}/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(transform ? transform(values) : values),
      });
      query.refetch();
      e.currentTarget.reset();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (query.isLoading) return <div className="skeleton" />;
  if (query.error || !row)
    return (
      <p className="error">{query.error?.message || 'Record unavailable.'}</p>
    );
  const tabs =
    module === 'clients'
      ? [
          'overview',
          'contacts',
          'services',
          'campaigns',
          'tasks',
          'files',
          'quotations',
          'invoices',
          'payments',
          'activity',
        ]
      : module === 'campaigns'
        ? ['overview', 'metrics']
        : module === 'tasks'
          ? ['overview', 'comments', 'attachments']
          : ['overview'];
  const details = Object.entries(row).filter(
    ([key]) => !['id', 'leadId', 'portalUserId'].includes(key),
  );
  return (
    <>
      <Link href={`/${module}`} className="muted" style={{ fontSize: 11 }}>
        ← Back to {module}
      </Link>
      <div className="page-heading" style={{ marginTop: 20 }}>
        <div>
          <h1>
            {row.businessName ||
              row.name ||
              row.title ||
              row.number ||
              'Quotation'}
          </h1>
          <p>Record ID: {id}</p>
        </div>
        {row.status && <Badge>{row.status}</Badge>}
        {['invoices', 'quotations'].includes(module) && (
          <a
            className="button primary"
            href={`/api/documents/${module}/${id}`}
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </a>
        )}
      </div>
      {['clients', 'campaigns', 'tasks'].includes(module) && (
        <Button
          variant="secondary"
          style={{ marginBottom: 20 }}
          onClick={() => setEditing(true)}
        >
          Edit {singular}
        </Button>
      )}
      {editing && (
        <RecordForm
          module={module}
          recordId={id}
          defaults={Object.fromEntries(
            Object.entries(row)
              .filter(([, value]) => value !== null)
              .map(([key, value]) => [
                key,
                ['monthlyRetainer', 'budget'].includes(key)
                  ? String(Number(value) / 100)
                  : [
                        'startDate',
                        'endDate',
                        'contractStart',
                        'renewalDate',
                        'deadline',
                      ].includes(key)
                    ? new Date(
                        new Date(String(value)).getTime() -
                          new Date(String(value)).getTimezoneOffset() * 60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    : String(value),
              ]),
          )}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            query.refetch();
          }}
        />
      )}
      {module === 'quotations' && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18 }}>Quotation workflow</h3>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <label className="field">
              Approval status
              <select
                value={String(row.status)}
                onChange={async (e) => {
                  try {
                    await api(`quotations/${id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    query.refetch();
                  } catch (error) {
                    setError((error as Error).message);
                  }
                }}
              >
                {['draft', 'sent', 'approved', 'rejected'].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            {row.invoiceId ? (
              <Link
                className="button secondary"
                href={`/invoices/${row.invoiceId}`}
              >
                View invoice
              </Link>
            ) : (
              <form
                className="row"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    !confirm('Create an invoice from this approved quotation?')
                  )
                    return;
                  try {
                    const f = new FormData(e.currentTarget);
                    await api(`quotations/${id}/convert`, {
                      method: 'POST',
                      body: JSON.stringify({
                        dueDate: new Date(
                          String(f.get('dueDate')),
                        ).toISOString(),
                      }),
                    });
                    query.refetch();
                  } catch (error) {
                    setError((error as Error).message);
                  }
                }}
              >
                <label className="field">
                  Invoice due date
                  <input name="dueDate" type="datetime-local" required />
                </label>
                <Button variant="secondary">Create invoice</Button>
              </form>
            )}
          </div>
          <p style={{ fontSize: 11, margin: '15px 0 0' }}>
            Approval and invoice creation require the owner or finance manager.
            Convert a Won lead to a client before invoicing.
          </p>
        </Card>
      )}
      {module === 'invoices' &&
        row.status !== 'cancelled' &&
        Number(row.paid) === 0 && (
          <Button
            variant="ghost"
            onClick={async () => {
              if (
                !confirm(
                  'Cancel this unpaid invoice? Its number remains reserved.',
                )
              )
                return;
              try {
                await api(`invoices/${id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ status: 'cancelled' }),
                });
                query.refetch();
              } catch (error) {
                setError((error as Error).message);
              }
            }}
          >
            Cancel invoice
          </Button>
        )}
      <div className="inline-tabs" style={{ overflowX: 'auto' }}>
        {tabs.map((v) => (
          <button
            key={v}
            className={tab === v ? 'active' : ''}
            onClick={() => setTab(v)}
          >
            {v[0].toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {tab === 'overview' && (
        <Card>
          <dl className="detail-list">
            {details.map(([key, value]) => (
              <div key={key}>
                <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                <dd>
                  {[
                    'monthlyRetainer',
                    'total',
                    'paid',
                    'budget',
                    'discount',
                  ].includes(key) && typeof value === 'number'
                    ? money(value)
                    : (value ?? '—')}
                </dd>
              </div>
            ))}
          </dl>
          {query.data?.items && (
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {(query.data.items as Row[]).map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{money(Number(item.rate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
      {tab === 'contacts' && (
        <div className="detail-grid">
          <Card>
            <h3 style={{ fontSize: 20 }}>Client contacts</h3>
            {(query.data?.contacts as Row[])?.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '15px 0',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <strong>{c.name}</strong>
                <p style={{ fontSize: 12, margin: 0 }}>
                  {c.email} · {c.phone}
                </p>
              </div>
            ))}
          </Card>
          <Card>
            <h3 style={{ fontSize: 20 }}>Add contact</h3>
            <form className="stack" onSubmit={(e) => submit(e, 'contacts')}>
              {['name', 'email', 'phone'].map((key) => (
                <label className="field" key={key}>
                  {key}
                  <input
                    name={key}
                    type={key === 'email' ? 'email' : 'text'}
                    required={key !== 'phone'}
                  />
                </label>
              ))}
              <Button>Add contact</Button>
            </form>
          </Card>
        </div>
      )}
      {tab === 'metrics' && (
        <div className="detail-grid">
          <Card>
            <h3 style={{ fontSize: 20 }}>Performance · manually entered</h3>
            {(query.data?.metrics as Row[])?.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '17px 0',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <p style={{ fontSize: 12 }}>
                  {String(m.date).slice(0, 10)} · {m.source}
                </p>
                <div className="stat-grid">
                  {[
                    [
                      'CPC',
                      Number(m.clicks)
                        ? money(Number(m.spend) / Number(m.clicks))
                        : '—',
                    ],
                    [
                      'CPL',
                      Number(m.leads)
                        ? money(Number(m.spend) / Number(m.leads))
                        : '—',
                    ],
                    [
                      'ROAS',
                      Number(m.spend)
                        ? (Number(m.revenue) / Number(m.spend)).toFixed(2) + '×'
                        : '—',
                    ],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <p style={{ fontSize: 10 }}>{key}</p>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 11 }}>
              No live advertising provider is connected. Zero denominators
              display no metric.
            </p>
          </Card>
          <Card>
            <h3 style={{ fontSize: 20 }}>Add performance entry</h3>
            <form
              className="form-grid"
              onSubmit={(e) =>
                submit(e, 'metrics', (v) => ({
                  ...Object.fromEntries(
                    Object.entries(v).map(([key, value]) => [
                      key,
                      key === 'date'
                        ? new Date(String(value)).toISOString()
                        : Math.round(
                            Number(value) *
                              (['spend', 'revenue'].includes(key) ? 100 : 1),
                          ),
                    ]),
                  ),
                }))
              }
            >
              <label className="field span-2">
                Date
                <input type="datetime-local" name="date" required />
              </label>
              {[
                'impressions',
                'reach',
                'clicks',
                'leads',
                'conversions',
                'spend',
                'revenue',
              ].map((key) => (
                <label className="field" key={key}>
                  {key}
                  {['spend', 'revenue'].includes(key) ? ' (₹)' : ''}
                  <input
                    name={key}
                    type="number"
                    min={0}
                    step={['spend', 'revenue'].includes(key) ? '.01' : '1'}
                    defaultValue={0}
                    required
                  />
                </label>
              ))}
              <Button className="span-2">Save manual metrics</Button>
            </form>
          </Card>
        </div>
      )}
      {tab === 'comments' && (
        <div className="detail-grid">
          <Card>
            <h3 style={{ fontSize: 20 }}>Task discussion</h3>
            {(query.data?.comments as Row[])?.map((c) => (
              <p
                key={c.id}
                style={{
                  padding: '15px 0',
                  borderBottom: '1px solid var(--line)',
                  fontSize: 13,
                }}
              >
                {c.body}
                <small style={{ display: 'block' }}>
                  {new Date(String(c.createdAt)).toLocaleString('en-IN')}
                </small>
              </p>
            ))}
          </Card>
          <Card>
            <form className="stack" onSubmit={(e) => submit(e, 'comments')}>
              <label className="field">
                Comment
                <textarea name="body" required maxLength={5000} />
              </label>
              <Button>Add comment</Button>
            </form>
          </Card>
        </div>
      )}
      {![
        'overview',
        'contacts',
        'comments',
        'metrics',
        'files',
        'attachments',
        'services',
      ].includes(tab) && <Related module={module} id={id} tab={tab} />}
      {tab === 'services' && module === 'clients' && <ClientServices id={id} />}
      {(tab === 'files' || tab === 'attachments') && (
        <FileManager
          entity={module === 'clients' ? 'client' : 'task'}
          id={id}
        />
      )}
    </>
  );
}
function Related({
  module,
  id,
  tab,
}: {
  module: string;
  id: string;
  tab: string;
}) {
  const query = useQuery({
    queryKey: ['related', module, id, tab],
    queryFn: () => api<{ rows: Row[] }>(`${module}/${id}/${tab}`),
  });
  return (
    <Card>
      {query.error ? (
        <p className="error">{query.error.message}</p>
      ) : query.data?.rows.length ? (
        query.data.rows.map((row) => (
          <div
            key={String(row.id)}
            style={{ padding: 16, borderBottom: '1px solid var(--line)' }}
          >
            {Object.entries(row)
              .filter(([key]) => !key.endsWith('Id'))
              .map(([key, value]) => (
                <p key={key} style={{ fontSize: 12, margin: 0 }}>
                  <strong>{key}:</strong> {String(value ?? '—')}
                </p>
              ))}
          </div>
        ))
      ) : (
        <p className="muted">
          No {tab} records available for this{' '}
          {module === 'clients' ? 'client' : 'task'}.
        </p>
      )}
    </Card>
  );
}
