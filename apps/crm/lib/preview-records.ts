import type { RecordRow } from "./types";
const date = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
};
const businesses = [
  "Sample restaurant",
  "Sample boutique",
  "Sample dental clinic",
  "Sample fitness studio",
];
export function previewRecords(module: string): RecordRow[] {
  return businesses.map((name, i) => ({
    id: `sample-${i}`,
    businessName: name,
    name:
      module === "campaigns"
        ? [
            "Local discovery",
            "Season launch",
            "Appointment enquiries",
            "Membership drive",
          ][i]
        : `Sample employee ${i + 1}`,
    contactPerson: `Sample contact ${i + 1}`,
    service: ["Social media", "Google Ads", "Website", "Branding"][i],
    source: ["Website", "Instagram", "Referral", "Google"][i],
    stage: ["new", "contacted", "qualified", "won"][i],
    dealValue: 2500000,
    email: `sample${i + 1}@example.com`,
    industry: ["Restaurant", "Retail", "Healthcare", "Fitness"][i],
    status:
      module === "tasks"
        ? ["to_do", "in_progress", "review", "completed"][i]
        : module === "invoices"
          ? ["unpaid", "partially_paid", "paid", "unpaid"][i]
          : module === "quotations"
            ? ["draft", "sent", "approved", "draft"][i]
            : "active",
    monthlyRetainer: 2500000,
    assignedTo: "preview-owner",
    accountManager: "preview-owner",
    assignedName: "Sample employee",
    clientName: name,
    leadName: name,
    leadId: `sample-${i}`,
    title: [
      "Prepare campaign creative",
      "Review landing page",
      "Send performance report",
      "Publish weekly content",
    ][i],
    description: "Illustrative activity for reviewing the workspace layout.",
    priority: ["high", "medium", "low", "high"][i],
    deadline: date(i - 1),
    dueAt: date(i),
    type: ["call", "meeting", "whatsapp", "email"][i],
    notes: "Illustrative follow-up; this is not a real customer.",
    completedAt: null,
    platform: ["Instagram", "Google Ads", "Meta Ads", "Organic"][i],
    budget: 3000000,
    startDate: date(-8),
    createdAt: date(-i),
    total: 2950000,
    paid: i === 2 ? 2950000 : 0,
    date: date(-5),
    dueDate: date(i - 1),
    number: `PREVIEW-${i + 1}`,
    reference: `SAMPLE-${i + 1}`,
    invoiceNumber: `PREVIEW-${i + 1}`,
    amount: 2500000,
    method: "bank_transfer",
    receivedAt: date(-i),
    validUntil: date(14),
    role: ["sales", "marketing", "finance", "marketing"][i],
    openTasks: i + 2,
    overdueTasks: i === 0 ? 1 : 0,
    body: "This is an illustrative notification for the design preview.",
    readAt: i === 0 ? null : date(-1),
    href: "/tasks",
  }));
}
