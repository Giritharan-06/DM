'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@zyroz/ui';
export function TeamForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Dialog.Root open onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content
          className="modal-panel"
          style={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 81,
            width: 'min(500px,calc(100vw - 30px))',
          }}
        >
          <Dialog.Title>Add a team member</Dialog.Title>
          <Dialog.Description style={{ fontSize: 12, color: 'var(--muted)' }}>
            Create an individual agency account. Share the temporary password
            through your secure internal channel.
          </Dialog.Description>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                await api('team', {
                  method: 'POST',
                  body: JSON.stringify(
                    Object.fromEntries(new FormData(e.currentTarget)),
                  ),
                });
                onSaved();
              } catch (error) {
                setError((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              Full name
              <input name="name" required minLength={2} />
            </label>
            <label className="field">
              Email address
              <input type="email" name="email" required />
            </label>
            <label className="field">
              Role
              <select name="role">
                <option value="sales">Sales executive</option>
                <option value="marketing">Marketing specialist</option>
                <option value="finance">Finance manager</option>
              </select>
            </label>
            <label className="field">
              Temporary password
              <input
                name="password"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={busy}>
                {busy ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
