export type Lead = {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  industry: string;
  service: string;
  budget: string;
  goal: string;
  message: string | null;
  stage:
    | 'new'
    | 'contacted'
    | 'qualified'
    | 'proposal_sent'
    | 'negotiation'
    | 'won'
    | 'lost';
  priority: 'low' | 'medium' | 'high';
  dealValue: number;
  assignedTo: string | null;
  notes: string | null;
  nextFollowUp: string | null;
  createdAt: string;
};
export type RecordRow = Record<string, string | number | null>;
