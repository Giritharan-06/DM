'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, ArrowUpRight } from 'lucide-react';
import { Badge, Button, Empty } from '@zyroz/ui';
import { stages, money } from '@zyroz/validation';
import { api } from '@/lib/api';
import type { Lead } from '@/lib/types';
import { RecordForm } from '@/features/record-form';
import { LeadFilters } from './lead-filters';
import { RelationshipField } from '@/components/relationship-field';
export function Leads({ initialSearch = '' }: { initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [stage, setStage] = useState('');
  const [page, setPage] = useState(1);
  const [add, setAdd] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['leads', search, stage, page, filters],
    queryFn: () =>
      api<{ rows: Lead[]; total: number }>(
        `leads?q=${encodeURIComponent(search)}&stage=${stage}&page=${page}&${new URLSearchParams(filters)}`,
      ),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Leads</h1>
          <p>Every great partnership starts with a conversation.</p>
        </div>
        <div className="row">
          <a
            className="button secondary"
            href={`/api/crm/leads/export?q=${encodeURIComponent(search)}&stage=${stage}&${new URLSearchParams(filters)}`}
          >
            <Download size={14} />
            Export filtered leads
          </a>
          <Button onClick={() => setAdd(true)}>
            <Plus size={15} /> Add lead
          </Button>
        </div>
      </div>
      <div className="toolbar">
        <label className="sr-only" htmlFor="lead-search">
          Search leads
        </label>
        <input
          id="lead-search"
          className="search"
          placeholder="Search name, business or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <label className="field">
          <span className="sr-only">Filter by stage</span>
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        {selected.length > 0 && (
          <Button
            variant="secondary"
            onClick={async () => {
              if (!confirm(`Archive ${selected.length} selected leads?`))
                return;
              try {
                await api('leads/bulk', {
                  method: 'PATCH',
                  body: JSON.stringify({ ids: selected, action: 'archive' }),
                });
                setSelected([]);
                client.invalidateQueries({ queryKey: ['leads'] });
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Archive {selected.length} selected
          </Button>
        )}
      </div>
      <LeadFilters
        filters={filters}
        includeSort
        onChange={(values) => {
          setFilters(values);
          setPage(1);
          setSelected([]);
        }}
      />
      {selected.length > 0 && (
        <form
          className="toolbar"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const f = new FormData(e.currentTarget);
              await api('leads/bulk', {
                method: 'PATCH',
                body: JSON.stringify({
                  ids: selected,
                  action: 'assign',
                  assignedTo: f.get('assignedTo'),
                }),
              });
              setSelected([]);
              client.invalidateQueries({ queryKey: ['leads'] });
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <label className="field">
            Assign selected leads (owner only)
            <RelationshipField name="assignedTo" required role="sales" />
          </label>
          <Button variant="secondary">Assign selected</Button>
        </form>
      )}
      {(query.error || error) && (
        <p className="error" role="alert">
          {query.error?.message || error}
        </p>
      )}
      <div className="card module-card">
        {query.isLoading ? (
          <div className="skeleton" />
        ) : query.data?.rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all leads on this page"
                      checked={selected.length === query.data.rows.length}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? query.data!.rows.map((l) => l.id)
                            : [],
                        )
                      }
                    />
                  </th>
                  <th>Business / contact</th>
                  <th>Service</th>
                  <th>Stage</th>
                  <th>Priority</th>
                  <th>Deal value</th>
                  <th>Received</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {query.data.rows.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${l.businessName}`}
                        checked={selected.includes(l.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, l.id]
                              : selected.filter((id) => id !== l.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <Link href={`/leads/${l.id}`}>
                        <strong>{l.businessName}</strong>
                        <small>
                          {l.name} · {l.email}
                        </small>
                      </Link>
                    </td>
                    <td>{l.service}</td>
                    <td>
                      <Badge className={l.stage}>
                        {l.stage.replaceAll('_', ' ')}
                      </Badge>
                    </td>
                    <td>
                      <Badge className={l.priority}>{l.priority}</Badge>
                    </td>
                    <td>{money(l.dealValue)}</td>
                    <td>{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <Link
                        href={`/leads/${l.id}`}
                        aria-label={`Open ${l.businessName}`}
                      >
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              search || stage
                ? 'No matching leads'
                : 'Ready for your first enquiry'
            }
            description="Consultation submissions arrive here automatically. You can also add a lead manually."
          />
        )}
        <div className="pagination">
          <span>
            {query.data?.total || 0} leads · Page {page}
          </span>
          <div className="row">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page * 25 >= (query.data?.total || 0)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {add && (
        <RecordForm
          module="leads"
          onClose={() => setAdd(false)}
          onSaved={() => {
            setAdd(false);
            client.invalidateQueries({ queryKey: ['leads'] });
          }}
        />
      )}
    </>
  );
}
