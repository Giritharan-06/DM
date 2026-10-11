import { z } from 'zod';
export {
  websiteSettingsSchema,
  publicWebsiteSettings,
  type WebsiteSettings,
} from './website';
export const stages = [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
] as const;
export const industries = [
  'Restaurant',
  'Clothing Store',
  'Salon',
  'Gym',
  'Real Estate',
  'Education',
  'Healthcare',
  'Other',
] as const;
export const serviceNames = [
  'Social Media Marketing',
  'Meta Ads',
  'Google Ads',
  'Search Engine Optimization',
  'Website Development',
  'Branding & Graphic Design',
  'Content Creation',
  'Lead Generation',
] as const;
const line = z.string().trim().min(2).max(200);
export const enquirySchema = z.object({
  name: line,
  businessName: line,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number'),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  industry: z.enum(industries),
  service: z.enum(serviceNames),
  budget: z.enum([
    'Under ₹15,000',
    '₹15,000–₹30,000',
    '₹30,000–₹75,000',
    '₹75,000+',
    'Let’s discuss',
  ]),
  goal: z.string().trim().min(5).max(2000),
  message: z.string().trim().max(3000).optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
  turnstileToken: z.string().max(2048).optional(),
  utm: z.record(z.string().max(50), z.string().max(200)).optional(),
});
export const leadPatchSchema = z
  .object({
    name: line.optional(),
    businessName: line.optional(),
    phone: z
      .string()
      .regex(/^\+?[\d\s()-]{7,20}$/)
      .optional(),
    email: z.email().optional(),
    stage: z.enum(stages).optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    assignedTo: z.string().min(1).nullable().optional(),
    notes: z.string().max(5000).optional(),
    dealValue: z.number().int().min(0).max(1e12).optional(),
    nextFollowUp: z.iso.datetime().nullable().optional(),
    archive: z.boolean().optional(),
  })
  .strict();
export const clientSchema = z.object({
  businessName: line,
  contactPerson: line,
  phone: z.string().min(7).max(20),
  email: z.email(),
  industry: line,
  address: z.string().max(2000).optional(),
  website: z.url().optional(),
  monthlyRetainer: z.number().int().min(0).max(1e12).default(0),
  accountManager: z.string().optional(),
  status: z.enum(['active', 'paused', 'closed']).default('active'),
  contractStart: z.iso.datetime().optional(),
  renewalDate: z.iso.datetime().optional(),
});
export const campaignSchema = z.object({
  name: line,
  clientId: z.uuid(),
  service: line,
  platform: line,
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime().optional(),
  budget: z.number().int().min(0).max(1e12),
  assignedTo: z.string().optional(),
  status: z.enum(['planned', 'active', 'paused', 'completed']),
  goals: z.string().min(2).max(3000),
  notes: z.string().max(5000).optional(),
});
export const taskSchema = z.object({
  title: line,
  clientId: z.uuid().optional(),
  campaignId: z.uuid().optional(),
  assignedTo: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['to_do', 'in_progress', 'review', 'completed', 'blocked']),
  deadline: z.iso.datetime(),
  description: z.string().max(5000).optional(),
  recurrenceDays: z.number().int().min(1).max(365).optional(),
});
export const followUpSchema = z.object({
  leadId: z.uuid(),
  assignedTo: z.string().min(1),
  type: z.enum(['call', 'meeting', 'email', 'whatsapp']),
  dueAt: z.iso.datetime(),
  notes: z.string().max(5000).optional(),
});
export const itemSchema = z.object({
  description: line,
  quantity: z.number().int().min(1).max(10000),
  rate: z.number().int().min(0).max(1e10),
});
export const financeSchema = z.object({
  clientId: z.uuid(),
  items: z.array(itemSchema).min(1).max(100),
  discount: z.number().int().min(0).max(1e12).default(0),
  taxBps: z.number().int().min(0).max(10000).default(0),
  dueDate: z.iso.datetime(),
  gstin: z.string().max(30).optional(),
});
export function totals(
  items: { quantity: number; rate: number }[],
  discount: number,
  taxBps: number,
) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  if (discount > subtotal) throw new Error('Discount exceeds subtotal');
  const net = subtotal - discount;
  const tax = Math.round((net * taxBps) / 10000);
  return { subtotal, discount, tax, total: net + tax };
}
export const paymentSchema = z.object({
  invoiceId: z.uuid(),
  amount: z.number().int().positive().max(1e12),
  reference: line,
  method: z.enum(['bank_transfer', 'cash', 'upi', 'other']),
  receivedAt: z.iso.datetime(),
});
export const quotationSchema = financeSchema
  .extend({ clientId: z.uuid().optional(), leadId: z.uuid().optional() })
  .refine(
    (value) => !!value.clientId !== !!value.leadId,
    'Choose exactly one client or lead.',
  );
export const money = (paise: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(paise / 100);
export * from './agency';
