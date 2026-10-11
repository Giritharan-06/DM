'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Button } from '@zyroz/ui';
import { api, csv } from '@/lib/api';
import { money } from '@zyroz/validation';
type Report = {
  key: string;
  title: string;
  definition: string;
  restricted?: boolean;
  rows: Record<string, string | number | null>[];
};
export function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today.slice(0, 8) + '01');
  const [to, setTo] = useState(today);
  const [selected, setSelected] = useState('sources');
  const query = useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => api<{ reports: Report[] }>(`reports?from=${from}&to=${to}`),
  });
  const report = query.data?.reports.find((r) => r.key === selected);
  const columns = Object.keys(report?.rows[0] || {});
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Reports</h1>
          <p>A clearer picture, grounded in your actual agency records.</p>
        </div>
        <div className="period-control">
          <label>
            From{' '}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            To{' '}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
      </div>
      {query.error && (
        <p className="error" role="alert">
          {query.error.message}
        </p>
      )}
      <div className="toolbar">
        <label className="field">
          Report
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {query.data?.reports.map((r) => (
              <option key={r.key} value={r.key}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          disabled={!report?.rows.length || report.restricted}
          onClick={() => csv(report!.rows, 'zyroz-' + selected)}
        >
          Export report
        </Button>
      </div>
      {query.isLoading ? (
        <div className="skeleton" />
      ) : (
        report && (
          <Card>
            <h2 style={{ fontSize: 22 }}>{report.title}</h2>
            <p style={{ fontSize: 12 }}>{report.definition}</p>
            {report.restricted ? (
              <Empty
                title="Owner report"
                description="Your role does not include these agency sales records."
              />
            ) : report.rows.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {columns.map((key) => (
                        <th key={key}>
                          {key
                            .replace(/([A-Z])/g, ' $1')
                            .replace('Paise', '(₹)')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row, i) => (
                      <tr key={i}>
                        {columns.map((key) => (
                          <td key={key}>
                            {row[key] === null
                              ? '—'
                              : key.endsWith('Paise')
                                ? money(Number(row[key]))
                                : String(row[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="No records for this report"
                description="Try a different period or add the underlying agency records."
              />
            )}
          </Card>
        )
      )}
      <p style={{ fontSize: 11, marginTop: 20 }}>
        Small samples and incomplete manually entered metrics may not indicate a
        trend. Current snapshots are labeled separately from period totals.
      </p>
    </>
  );
}
