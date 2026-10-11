'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { serviceNames, stages } from '@zyroz/validation';
export function LeadFilters({
  filters,
  onChange,
  includeStage = false,
  includeSort = false,
}: {
  filters: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  includeStage?: boolean;
  includeSort?: boolean;
}) {
  const directory = useQuery({
    queryKey: ['lookup', 'directory'],
    queryFn: () =>
      api<{ rows: { id: string; name: string; role: string }[]; role: string }>(
        'directory',
      ),
  });
  const set = (key: string, value: string) =>
    onChange({ ...filters, [key]: value });
  return (
    <div className="toolbar" style={{ flexWrap: 'wrap' }}>
      {includeStage && (
        <label className="field">
          Stage
          <select
            value={filters.stage || ''}
            onChange={(e) => set('stage', e.target.value)}
          >
            <option value="">All stages</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        Service
        <select
          value={filters.service || ''}
          onChange={(e) => set('service', e.target.value)}
        >
          <option value="">All services</option>
          {serviceNames.map((service) => (
            <option key={service}>{service}</option>
          ))}
        </select>
      </label>
      {directory.data?.role === 'owner' && (
        <label className="field">
          Employee
          <select
            value={filters.assignee || ''}
            onChange={(e) => set('assignee', e.target.value)}
          >
            <option value="">All employees</option>
            {directory.data.rows
              .filter((u) => u.role === 'sales')
              .map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
          </select>
        </label>
      )}
      <label className="field">
        Created from
        <input
          type="date"
          value={filters.from || ''}
          onChange={(e) => set('from', e.target.value)}
        />
      </label>
      <label className="field">
        Created to
        <input
          type="date"
          value={filters.to || ''}
          onChange={(e) => set('to', e.target.value)}
        />
      </label>
      {includeSort && (
        <label className="field">
          Sort by
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => set('sort', e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="business">Business name</option>
            <option value="value">Deal value</option>
          </select>
        </label>
      )}
    </div>
  );
}
