'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Card, Empty } from '@zyroz/ui';
export function FileManager({
  entity,
  id,
}: {
  entity: 'client' | 'task';
  id: string;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ['files', entity, id],
    queryFn: () =>
      api<{ rows: { id: string; name: string; size: number }[] }>(
        `${entity === 'client' ? 'clients' : 'tasks'}/${id}/${entity === 'client' ? 'files' : 'attachments'}`,
      ),
  });
  return (
    <Card>
      <h3 style={{ fontSize: 20 }}>Files & attachments</h3>
      <p style={{ fontSize: 12 }}>
        Private files stored in your agency’s R2 bucket. PDF, text and images up
        to 10 MB.
      </p>
      <label className="field">
        Upload a file
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError('');
            try {
              const values = {
                entity,
                entityId: id,
                name: file.name,
                mimeType: file.type,
                size: file.size,
              };
              const response = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
              });
              const intent = await response.json();
              if (!response.ok) throw new Error(intent.error);
              const result = await fetch(intent.url, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
              });
              if (!result.ok) throw new Error('Upload failed.');
              const confirmation = await fetch('/api/files', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...values,
                  objectKey: intent.objectKey,
                }),
              });
              const confirmed = await confirmation.json();
              if (!confirmation.ok) throw new Error(confirmed.error);
              query.refetch();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {busy && <p role="status">Uploading…</p>}
      {(error || query.error) && (
        <p className="error" role="alert">
          {error || query.error?.message}
        </p>
      )}
      {query.data?.rows.length ? (
        query.data.rows.map((file) => (
          <div
            key={file.id}
            className="row between"
            style={{ padding: '15px 0', borderBottom: '1px solid var(--line)' }}
          >
            <span>
              {file.name}{' '}
              <small className="muted">
                {(file.size / 1024).toFixed(0)} KB
              </small>
            </span>
            <a className="button secondary" href={`/api/files?id=${file.id}`}>
              Download
            </a>
          </div>
        ))
      ) : (
        <Empty
          title="A home for your shared files"
          description="Upload a contract, creative asset or project document."
        />
      )}
      <Button variant="ghost" onClick={() => query.refetch()}>
        Refresh files
      </Button>
    </Card>
  );
}
