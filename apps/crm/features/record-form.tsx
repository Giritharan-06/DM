'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Button } from '@zyroz/ui';
import { api } from '@/lib/api';
import { industries, serviceNames } from '@zyroz/validation';
import { RelationshipField } from '@/components/relationship-field';
import { useQuery } from '@tanstack/react-query';
type Field = {
  name: string;
  label: string;
  type?: string;
  options?: readonly string[];
  required?: boolean;
  money?: boolean;
  value?: string;
};
const specs: Record<string, Field[]> = {
  leads: [
    { name: 'name', label: 'Contact name' },
    { name: 'businessName', label: 'Business name' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'industry', label: 'Industry', options: industries },
    { name: 'service', label: 'Interested service', options: serviceNames },
    {
      name: 'budget',
      label: 'Budget range',
      options: [
        'Under ₹15,000',
        '₹15,000–₹30,000',
        '₹30,000–₹75,000',
        '₹75,000+',
        'Let’s discuss',
      ],
    },
    { name: 'goal', label: 'Business goal', type: 'textarea' },
    {
      name: 'message',
      label: 'Additional message',
      type: 'textarea',
      required: false,
    },
  ],
  clients: [
    { name: 'businessName', label: 'Business name' },
    { name: 'contactPerson', label: 'Contact person' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'industry', label: 'Industry', options: industries },
    { name: 'address', label: 'Address', required: false },
    { name: 'website', label: 'Website URL', type: 'url', required: false },
    {
      name: 'monthlyRetainer',
      label: 'Monthly retainer (₹)',
      type: 'number',
      money: true,
    },
    { name: 'accountManager', label: 'Account manager ID', required: false },
    {
      name: 'status',
      label: 'Status',
      options: ['active', 'paused', 'closed'],
    },
    {
      name: 'contractStart',
      label: 'Contract start',
      type: 'datetime-local',
      required: false,
    },
    {
      name: 'renewalDate',
      label: 'Renewal date',
      type: 'datetime-local',
      required: false,
    },
  ],
  campaigns: [
    { name: 'name', label: 'Campaign name' },
    { name: 'clientId', label: 'Client ID' },
    { name: 'service', label: 'Service', options: serviceNames },
    {
      name: 'platform',
      label: 'Platform',
      options: ['Meta', 'Google', 'Organic', 'Email', 'Other'],
    },
    { name: 'startDate', label: 'Start date', type: 'datetime-local' },
    {
      name: 'endDate',
      label: 'End date',
      type: 'datetime-local',
      required: false,
    },
    { name: 'budget', label: 'Budget (₹)', type: 'number', money: true },
    { name: 'assignedTo', label: 'Employee ID', required: false },
    {
      name: 'status',
      label: 'Status',
      options: ['planned', 'active', 'paused', 'completed'],
    },
    { name: 'goals', label: 'Campaign goals', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea', required: false },
  ],
  tasks: [
    { name: 'title', label: 'Task title' },
    { name: 'assignedTo', label: 'Assigned employee ID' },
    { name: 'clientId', label: 'Client ID', required: false },
    { name: 'campaignId', label: 'Campaign ID', required: false },
    { name: 'priority', label: 'Priority', options: ['medium', 'high', 'low'] },
    {
      name: 'status',
      label: 'Status',
      options: ['to_do', 'in_progress', 'review', 'completed', 'blocked'],
    },
    { name: 'deadline', label: 'Deadline', type: 'datetime-local' },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'recurrenceDays',
      label: 'Repeat every (days)',
      type: 'number',
      required: false,
    },
  ],
  'follow-ups': [
    { name: 'leadId', label: 'Lead ID' },
    { name: 'assignedTo', label: 'Assigned employee ID' },
    {
      name: 'type',
      label: 'Follow-up type',
      options: ['call', 'meeting', 'email', 'whatsapp'],
    },
    { name: 'dueAt', label: 'Due at', type: 'datetime-local' },
    { name: 'notes', label: 'Notes', type: 'textarea', required: false },
  ],
  quotations: [
    { name: 'clientId', label: 'Client', required: false },
    { name: 'leadId', label: 'Lead', required: false },
    { name: 'dueDate', label: 'Valid until', type: 'datetime-local' },
    { name: 'discount', label: 'Discount (₹)', type: 'number', money: true },
    { name: 'taxBps', label: 'Tax rate (%)', type: 'number' },
    { name: 'gstin', label: 'GSTIN (optional)', required: false },
  ],
  invoices: [
    { name: 'clientId', label: 'Client ID' },
    { name: 'dueDate', label: 'Due date', type: 'datetime-local' },
    { name: 'discount', label: 'Discount (₹)', type: 'number', money: true },
    { name: 'taxBps', label: 'Tax rate (%)', type: 'number' },
    { name: 'gstin', label: 'GSTIN (optional)', required: false },
  ],
  payments: [
    { name: 'invoiceId', label: 'Invoice ID' },
    {
      name: 'amount',
      label: 'Amount received (₹)',
      type: 'number',
      money: true,
    },
    { name: 'reference', label: 'Unique payment reference' },
    {
      name: 'method',
      label: 'Payment method',
      options: ['bank_transfer', 'upi', 'cash', 'other'],
    },
    { name: 'receivedAt', label: 'Received at', type: 'datetime-local' },
  ],
};
export function RecordForm({
  module,
  onClose,
  onSaved,
  defaults = {},
  recordId,
}: {
  module: string;
  onClose: () => void;
  onSaved: () => void;
  defaults?: Record<string, string>;
  recordId?: string;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0 },
  ]);
  const finance = ['invoices', 'quotations'].includes(module);
  const directory = useQuery({
    queryKey: ['lookup', 'directory'],
    queryFn: () => api<{ role: string; rows: unknown[] }>('directory'),
  });
  const fields = (specs[module] || [])
    .filter(
      (field) =>
        field.name !== 'monthlyRetainer' ||
        ['owner', 'finance'].includes(directory.data?.role || ''),
    )
    .filter(
      (field) =>
        field.name !== 'accountManager' || directory.data?.role === 'owner',
    );
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-backdrop" />
        <Dialog.Content
          className="modal-panel"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 81,
            width: 'min(650px,calc(100vw - 30px))',
          }}
        >
          <Dialog.Title>
            {recordId ? 'Edit' : 'Add'}{' '}
            {module === 'follow-ups' ? 'follow-up' : module.replace(/s$/, '')}
          </Dialog.Title>
          <Dialog.Description
            style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 25 }}
          >
            Create a record in your agency workspace. Amounts are entered in
            Indian rupees.
          </Dialog.Description>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                const data = new FormData(e.currentTarget);
                const value: Record<string, unknown> = {};
                for (const field of fields) {
                  if (!data.has(field.name)) continue;
                  const raw = String(data.get(field.name) || '');
                  if (!raw && field.required === false) continue;
                  value[field.name] =
                    field.type === 'datetime-local'
                      ? new Date(raw).toISOString()
                      : field.type === 'number'
                        ? Math.round(
                            Number(raw) *
                              (field.money
                                ? 100
                                : field.name === 'taxBps'
                                  ? 100
                                  : 1),
                          )
                        : raw;
                }
                if (module === 'leads')
                  value.consent = data.get('consent') === 'on';
                if (finance)
                  value.items = items.map((i) => ({
                    ...i,
                    rate: Math.round(i.rate * 100),
                  }));
                await api(recordId ? `${module}/${recordId}` : module, {
                  method: recordId ? 'PATCH' : 'POST',
                  body: JSON.stringify(value),
                });
                onSaved();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="form-grid">
              {fields.map((field) => (
                <label
                  className={`field ${field.type === 'textarea' ? 'span-2' : ''}`}
                  key={field.name}
                >
                  {field.label
                    .replace(/ ID$/, '')
                    .replace('Assigned employee', 'Assigned employee')}
                  {field.required === false && (
                    <span className="muted">Optional</span>
                  )}
                  {[
                    'clientId',
                    'leadId',
                    'campaignId',
                    'invoiceId',
                    'assignedTo',
                    'accountManager',
                  ].includes(field.name) ? (
                    <RelationshipField
                      name={field.name}
                      required={field.required !== false}
                      defaultValue={defaults[field.name]}
                      role={
                        module === 'follow-ups' && field.name === 'assignedTo'
                          ? 'sales'
                          : module === 'campaigns' &&
                              field.name === 'assignedTo'
                            ? 'marketing'
                            : undefined
                      }
                    />
                  ) : field.options ? (
                    <select
                      name={field.name}
                      defaultValue={defaults[field.name] || field.options[0]}
                    >
                      {field.options.map((o) => (
                        <option key={o} value={o}>
                          {o.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      name={field.name}
                      defaultValue={defaults[field.name]}
                      required={field.required !== false}
                      maxLength={5000}
                    />
                  ) : (
                    <input
                      name={field.name}
                      type={field.type || 'text'}
                      required={field.required !== false}
                      defaultValue={
                        defaults[field.name] ||
                        (field.type === 'number' && field.required !== false
                          ? 0
                          : undefined)
                      }
                      min={field.type === 'number' ? 0 : undefined}
                      step={field.type === 'number' ? '0.01' : undefined}
                    />
                  )}
                </label>
              ))}
            </div>
            {module === 'leads' && (
              <label className="consent">
                <input type="checkbox" name="consent" required />
                Confirm the contact has consented to your agency storing and
                following up on this enquiry.
              </label>
            )}
            {finance && (
              <div style={{ marginTop: 25 }}>
                <h3 style={{ fontSize: 16 }}>Service items</h3>
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="form-grid"
                    style={{ marginBottom: 15 }}
                  >
                    <label className="field span-2">
                      Description
                      <input
                        value={item.description}
                        required
                        minLength={2}
                        onChange={(e) =>
                          setItems(
                            items.map((v, n) =>
                              n === i
                                ? { ...v, description: e.target.value }
                                : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      Quantity
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setItems(
                            items.map((v, n) =>
                              n === i
                                ? { ...v, quantity: Number(e.target.value) }
                                : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      Rate (₹)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          setItems(
                            items.map((v, n) =>
                              n === i
                                ? { ...v, rate: Number(e.target.value) }
                                : v,
                            ),
                          )
                        }
                      />
                    </label>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setItems(items.filter((_v, n) => n !== i))
                        }
                      >
                        Remove item
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setItems([
                      ...items,
                      { description: '', quantity: 1, rate: 0 },
                    ])
                  }
                >
                  Add service item
                </Button>
                <p style={{ fontSize: 11, marginTop: 15 }}>
                  Tax is configurable and calculated on the discounted subtotal.
                  Confirm the applicable treatment before issuing.
                </p>
              </div>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={busy}>
                {busy ? 'Saving…' : 'Create record'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
