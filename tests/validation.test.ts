import { describe, it, expect } from 'vitest';
import {
  enquirySchema,
  totals,
  financeSchema,
  paymentSchema,
} from '@zyroz/validation';
import {
  canAccess,
  scoped,
  type Role,
  type Module,
} from '@zyroz/auth/permissions';
const enquiry = {
  name: 'Test Contact',
  businessName: 'Demo business',
  phone: '+919876543210',
  email: 'CONTACT@example.com',
  industry: 'Other',
  service: 'Website Development',
  budget: 'Let’s discuss',
  goal: 'Improve our website visibility',
  consent: true,
};
describe('Public enquiry boundary', () => {
  it('accepts an enquiry and normalizes email', () =>
    expect(enquirySchema.parse(enquiry).email).toBe('contact@example.com'));
  it.each([
    { ...enquiry, consent: false },
    { ...enquiry, email: 'invalid' },
    { ...enquiry, phone: 'abc' },
    { ...enquiry, website: 'spam' },
    { ...enquiry, goal: 'no' },
  ])('rejects invalid or automated submission %#', (value) =>
    expect(enquirySchema.safeParse(value).success).toBe(false),
  );
});
describe('Finance uses integer paise', () => {
  it('applies discount before tax and rounds to paise', () =>
    expect(totals([{ quantity: 3, rate: 10001 }], 1000, 1800)).toEqual({
      subtotal: 30003,
      discount: 1000,
      tax: 5221,
      total: 34224,
    }));
  it('supports zero-tax invoices', () =>
    expect(totals([{ quantity: 2, rate: 150000 }], 0, 0).total).toBe(300000));
  it('rejects a discount larger than the subtotal', () =>
    expect(() => totals([{ quantity: 1, rate: 100 }], 101, 0)).toThrow());
  it('rejects fractional quantities and negative rates', () =>
    expect(
      financeSchema.safeParse({
        clientId: crypto.randomUUID(),
        items: [{ description: 'Service', quantity: 1.5, rate: -1 }],
        dueDate: new Date().toISOString(),
      }).success,
    ).toBe(false));
  it('requires a positive payment', () =>
    expect(
      paymentSchema.safeParse({
        invoiceId: crypto.randomUUID(),
        amount: 0,
        reference: 'payment-1',
        method: 'upi',
        receivedAt: new Date().toISOString(),
      }).success,
    ).toBe(false));
});
describe('Server permission matrix', () => {
  it.each(['invoices', 'payments', 'reports', 'team', 'settings'] as Module[])(
    'sales cannot access %s',
    (module) => expect(canAccess('sales', module)).toBe(false),
  );
  it.each(['leads', 'pipeline', 'quotations', 'payments'] as Module[])(
    'marketing cannot access %s',
    (module) => expect(canAccess('marketing', module)).toBe(false),
  );
  it.each(['owner', 'sales', 'marketing', 'finance', 'client'] as Role[])(
    'only the owner manages roles (%s)',
    (role) => expect(canAccess(role, 'team')).toBe(role === 'owner'),
  );
  it('keeps the future client portal disabled', () =>
    expect(canAccess('client', 'clients')).toBe(false));
  it('scopes sales and marketing to assigned records', () => {
    expect(scoped('sales')).toBe(true);
    expect(scoped('marketing')).toBe(true);
    expect(scoped('finance')).toBe(false);
  });
});
