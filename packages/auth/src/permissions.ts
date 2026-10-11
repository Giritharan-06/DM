export type Role = 'owner' | 'sales' | 'marketing' | 'finance' | 'client';
export type Module =
  | 'dashboard'
  | 'leads'
  | 'pipeline'
  | 'follow-ups'
  | 'clients'
  | 'campaigns'
  | 'tasks'
  | 'quotations'
  | 'invoices'
  | 'payments'
  | 'reports'
  | 'team'
  | 'notifications'
  | 'settings';
const grants: Record<Role, readonly Module[]> = {
  owner: [
    'dashboard',
    'leads',
    'pipeline',
    'follow-ups',
    'clients',
    'campaigns',
    'tasks',
    'quotations',
    'invoices',
    'payments',
    'reports',
    'team',
    'notifications',
    'settings',
  ],
  sales: [
    'dashboard',
    'leads',
    'pipeline',
    'follow-ups',
    'clients',
    'quotations',
    'tasks',
    'notifications',
  ],
  marketing: ['dashboard', 'clients', 'campaigns', 'tasks', 'notifications'],
  finance: [
    'dashboard',
    'clients',
    'quotations',
    'invoices',
    'payments',
    'reports',
    'tasks',
    'notifications',
  ],
  client: [],
};
export function canAccess(role: Role, module: Module) {
  return grants[role].includes(module);
}
export function scoped(role: Role) {
  return role === 'sales' || role === 'marketing';
}
