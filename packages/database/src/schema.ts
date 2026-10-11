import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  bigint,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
const id = () => uuid('id').primaryKey().defaultRandom();
const created = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () =>
  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
export const roleEnum = pgEnum('role', [
  'owner',
  'sales',
  'marketing',
  'finance',
  'client',
]);
export const stageEnum = pgEnum('lead_stage', [
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
]);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: created(),
  updatedAt: updated(),
});
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: created(),
  updatedAt: updated(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: created(),
  updatedAt: updated(),
});
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: created(),
  updatedAt: updated(),
});
export const roles = pgTable('roles', {
  name: roleEnum('name').primaryKey(),
  description: text('description').notNull(),
});
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
});
export const userRoles = pgTable('user_roles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: roleEnum('role').notNull(),
});
export const rolePermissions = pgTable(
  'role_permissions',
  {
    role: roleEnum('role').notNull(),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id),
  },
  (t) => [primaryKey({ columns: [t.role, t.permissionId] })],
);
export const services = pgTable('services', {
  id: id(),
  name: text('name').notNull().unique(),
  description: text('description'),
  active: boolean('active').notNull().default(true),
});
export const leadSources = pgTable('lead_sources', {
  id: id(),
  name: text('name').notNull().unique(),
});
export const leads = pgTable(
  'leads',
  {
    id: id(),
    name: text('name').notNull(),
    businessName: text('business_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    industry: text('industry').notNull(),
    service: text('service').notNull(),
    budget: text('budget').notNull(),
    goal: text('goal').notNull(),
    message: text('message'),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    source: text('source').notNull().default('website'),
    utm: jsonb('utm').$type<Record<string, string>>().notNull().default({}),
    stage: stageEnum('stage').notNull().default('new'),
    priority: priorityEnum('priority').notNull().default('medium'),
    assignedTo: text('assigned_to').references(() => users.id),
    dealValue: bigint('deal_value', { mode: 'number' }).notNull().default(0),
    lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
    nextFollowUp: timestamp('next_follow_up', { withTimezone: true }),
    notes: text('notes'),
    dedupeKey: text('dedupe_key').notNull().unique(),
    createdAt: created(),
    updatedAt: updated(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [
    index('leads_assignee_idx').on(t.assignedTo),
    index('leads_stage_created_idx').on(t.stage, t.createdAt),
  ],
);
export const leadActivities = pgTable('lead_activities', {
  id: id(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id),
  actorId: text('actor_id').references(() => users.id),
  type: text('type').notNull(),
  description: text('description').notNull(),
  createdAt: created(),
});
export const leadAssignments = pgTable('lead_assignments', {
  id: id(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: created(),
});
export const leadStageHistory = pgTable('lead_stage_history', {
  id: id(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id),
  fromStage: stageEnum('from_stage').notNull(),
  toStage: stageEnum('to_stage').notNull(),
  actorId: text('actor_id')
    .notNull()
    .references(() => users.id),
  createdAt: created(),
});
export const clients = pgTable('clients', {
  id: id(),
  leadId: uuid('lead_id')
    .unique()
    .references(() => leads.id),
  businessName: text('business_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  industry: text('industry').notNull(),
  address: text('address'),
  website: text('website'),
  monthlyRetainer: bigint('monthly_retainer', { mode: 'number' })
    .notNull()
    .default(0),
  accountManager: text('account_manager').references(() => users.id),
  portalUserId: text('portal_user_id')
    .unique()
    .references(() => users.id),
  status: text('status').notNull().default('active'),
  contractStart: timestamp('contract_start', { withTimezone: true }),
  renewalDate: timestamp('renewal_date', { withTimezone: true }),
  createdAt: created(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
});
export const clientContacts = pgTable('client_contacts', {
  id: id(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
});
export const clientServices = pgTable(
  'client_services',
  {
    id: id(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
  },
  (t) => [uniqueIndex('client_service_unique').on(t.clientId, t.serviceId)],
);
export const contracts = pgTable('contracts', {
  id: id(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at'),
  terms: text('terms').notNull(),
  createdAt: created(),
});
export const followUps = pgTable('follow_ups', {
  id: id(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id),
  assignedTo: text('assigned_to')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: created(),
});
export const campaigns = pgTable('campaigns', {
  id: id(),
  name: text('name').notNull(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  service: text('service').notNull(),
  platform: text('platform').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  budget: bigint('budget', { mode: 'number' }).notNull().default(0),
  assignedTo: text('assigned_to').references(() => users.id),
  status: text('status').notNull().default('planned'),
  goals: text('goals').notNull(),
  notes: text('notes'),
  createdAt: created(),
});
export const campaignMetrics = pgTable('campaign_metrics', {
  id: id(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  date: timestamp('date', { withTimezone: true }).notNull(),
  impressions: integer('impressions').notNull().default(0),
  reach: integer('reach').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  leads: integer('leads').notNull().default(0),
  conversions: integer('conversions').notNull().default(0),
  spend: bigint('spend', { mode: 'number' }).notNull().default(0),
  revenue: bigint('revenue', { mode: 'number' }).notNull().default(0),
  source: text('source').notNull().default('manual'),
});
export const tasks = pgTable('tasks', {
  id: id(),
  title: text('title').notNull(),
  clientId: uuid('client_id').references(() => clients.id),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  assignedTo: text('assigned_to')
    .notNull()
    .references(() => users.id),
  priority: priorityEnum('priority').notNull().default('medium'),
  status: text('status').notNull().default('to_do'),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  description: text('description'),
  recurrenceDays: integer('recurrence_days'),
  createdAt: created(),
});
export const taskComments = pgTable('task_comments', {
  id: id(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  body: text('body').notNull(),
  createdAt: created(),
});
export const taskAssignments = pgTable(
  'task_assignments',
  {
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.userId] })],
);
export const quotations = pgTable('quotations', {
  id: id(),
  invoiceId: uuid('invoice_id')
    .unique()
    .references(() => invoices.id),
  gstin: text('gstin'),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  clientId: uuid('client_id').references(() => clients.id),
  leadId: uuid('lead_id').references(() => leads.id),
  status: text('status').notNull().default('draft'),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  discount: bigint('discount', { mode: 'number' }).notNull().default(0),
  taxBps: integer('tax_bps').notNull().default(0),
  total: bigint('total', { mode: 'number' }).notNull(),
  createdAt: created(),
});
export const quotationItems = pgTable('quotation_items', {
  id: id(),
  quotationId: uuid('quotation_id')
    .notNull()
    .references(() => quotations.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  rate: bigint('rate', { mode: 'number' }).notNull(),
});
export const invoiceCounters = pgTable('invoice_counters', {
  year: integer('year').primaryKey(),
  value: integer('value').notNull(),
});
export const invoices = pgTable(
  'invoices',
  {
    id: id(),
    number: text('number').notNull().unique(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    date: timestamp('date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    discount: bigint('discount', { mode: 'number' }).notNull().default(0),
    taxBps: integer('tax_bps').notNull().default(0),
    gstin: text('gstin'),
    total: bigint('total', { mode: 'number' }).notNull(),
    paid: bigint('paid', { mode: 'number' }).notNull().default(0),
    status: text('status').notNull().default('unpaid'),
    createdAt: created(),
  },
  (t) => [
    check(
      'invoice_paid_valid',
      sql`${t.paid} >= 0 AND ${t.paid} <= ${t.total}`,
    ),
  ],
);
export const invoiceItems = pgTable('invoice_items', {
  id: id(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  rate: bigint('rate', { mode: 'number' }).notNull(),
});
export const payments = pgTable('payments', {
  id: id(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  reference: text('reference').notNull().unique(),
  method: text('method').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  recordedBy: text('recorded_by')
    .notNull()
    .references(() => users.id),
  createdAt: created(),
});
export const notifications = pgTable('notifications', {
  id: id(),
  dedupeKey: text('dedupe_key').unique(),
  userId: text('user_id').references(() => users.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  href: text('href').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: created(),
});
export const notificationPreferences = pgTable('notification_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  email: boolean('email').notNull().default(false),
  inApp: boolean('in_app').notNull().default(true),
});
export const emailDeliveryLogs = pgTable('email_delivery_logs', {
  id: id(),
  dedupeKey: text('dedupe_key').unique(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('queued'),
  attempts: integer('attempts').notNull().default(0),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  providerId: text('provider_id'),
  error: text('error'),
  createdAt: created(),
});
export const files = pgTable('files', {
  id: id(),
  clientId: uuid('client_id').references(() => clients.id),
  taskId: uuid('task_id').references(() => tasks.id),
  name: text('name').notNull(),
  objectKey: text('object_key').notNull().unique(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: created(),
});
export const campaignAssets = pgTable(
  'campaign_assets',
  {
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id),
  },
  (t) => [primaryKey({ columns: [t.campaignId, t.fileId] })],
);
export const auditLogs = pgTable('audit_logs', {
  id: id(),
  actorId: text('actor_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: jsonb('metadata')
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  createdAt: created(),
});
export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: updated(),
});
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const authRateLimits = pgTable('auth_rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
