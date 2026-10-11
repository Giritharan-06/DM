'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Card } from '@zyroz/ui';
import { stages, money } from '@zyroz/validation';
import { api } from '@/lib/api';
import type { Lead } from '@/lib/types';
import { LeadFilters } from './lead-filters';
type Leads = { rows: Lead[]; total: number };
export function Pipeline() {
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const client = useQueryClient();
  const key = ['pipeline', search, page, filters];
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      api<Leads>(
        `leads?limit=100&page=${page}&q=${encodeURIComponent(search)}&${new URLSearchParams(filters)}`,
      ),
  });
  const mutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Lead['stage'] }) =>
      api(`leads/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      }),
    onMutate: async (variables) => {
      setError('');
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<Leads>(key);
      client.setQueryData<Leads>(key, (old) =>
        old
          ? {
              ...old,
              rows: old.rows.map((l) =>
                l.id === variables.id ? { ...l, stage: variables.stage } : l,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (e, _v, ctx) => {
      client.setQueryData(key, ctx?.previous);
      setError(e.message);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: ['pipeline'] });
      client.invalidateQueries({ queryKey: ['leads'] });
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Sales pipeline</h1>
          <p>Turn promising conversations into lasting partnerships.</p>
        </div>
        <span className="muted" style={{ fontSize: 11 }}>
          Drag a card or use its stage selector
        </span>
      </div>
      <div className="toolbar">
        <input
          className="search"
          aria-label="Search pipeline"
          placeholder="Search opportunities…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <span className="muted" style={{ fontSize: 11 }}>
          Showing page {page} · {query.data?.total || 0} total opportunities
        </span>
        <button
          className="button secondary"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="button secondary"
          disabled={page * 100 >= (query.data?.total || 0)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
      {(error || query.error) && (
        <p className="error" role="alert">
          {error || query.error?.message}
        </p>
      )}
      <LeadFilters
        filters={filters}
        includeStage
        onChange={(values) => {
          setFilters(values);
          setPage(1);
        }}
      />
      <div className="pipeline-board">
        {stages.map((stage) => {
          const rows = query.data?.rows.filter((l) => l.stage === stage) || [];
          return (
            <section
              key={stage}
              className="pipeline-column"
              aria-label={`${stage} stage`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (query.data?.rows.some((l) => l.id === id))
                  mutation.mutate({ id, stage });
              }}
            >
              <div className="pipeline-column-title">
                {stage.replaceAll('_', ' ')}
                <span>{rows.length}</span>
              </div>
              {rows.map((l) => (
                <Card
                  key={l.id}
                  className="deal-card"
                  draggable={!mutation.isPending}
                  onDragStart={(e) =>
                    e.dataTransfer.setData('text/plain', l.id)
                  }
                >
                  <Badge className={l.priority}>{l.priority}</Badge>
                  <Link href={`/leads/${l.id}`}>
                    <h3>{l.businessName}</h3>
                  </Link>
                  <p>{l.service}</p>
                  <div className="deal-value">{money(l.dealValue)}</div>
                  <p style={{ marginTop: 10 }}>
                    {l.nextFollowUp
                      ? `Follow up ${new Date(l.nextFollowUp).toLocaleDateString('en-IN')}`
                      : 'No follow-up scheduled'}
                  </p>
                  <label>
                    <span className="sr-only">Stage for {l.businessName}</span>
                    <select
                      value={l.stage}
                      disabled={mutation.isPending}
                      onChange={(e) =>
                        mutation.mutate({
                          id: l.id,
                          stage: e.target.value as Lead['stage'],
                        })
                      }
                    >
                      {stages.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                </Card>
              ))}
              {!rows.length && (
                <p style={{ fontSize: 10, textAlign: 'center', padding: 25 }}>
                  No opportunities in this stage
                </p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
