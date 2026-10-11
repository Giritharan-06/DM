import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { Dashboard, type DashboardData } from "@/features/dashboard";
import { Operations } from "@/features/operations";
import { previewRecords } from "@/lib/preview-records";
import { Card, Badge } from "@zyroz/ui";
export default async function Preview({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { path = [] } = await params;
  const section = path[0] || "dashboard";
  const modules = [
    "dashboard",
    "leads",
    "pipeline",
    "follow-ups",
    "clients",
    "campaigns",
    "tasks",
    "quotations",
    "invoices",
    "payments",
    "reports",
    "team",
    "notifications",
    "settings",
  ];
  if (!modules.includes(section)) notFound();
  const data: DashboardData = {
    kpis: {
      totalLeads: 128,
      newLeads: 24,
      qualifiedLeads: 18,
      activeClients: 18,
      revenue: 24800000,
      pendingPayments: 7600000,
      conversionRate: 14.1,
      upcomingFollowUps: 4,
    },
    leads: previewRecords("leads") as unknown as DashboardData["leads"],
    openTasks: previewRecords("tasks") as unknown as DashboardData["openTasks"],
    updates: previewRecords(
      "notifications",
    ) as unknown as DashboardData["updates"],
    campaignResults: [
      { name: "Sample discovery", value: 42 },
      { name: "Sample launch", value: 24 },
      { name: "Sample appointments", value: 36 },
    ],
    followUps: previewRecords(
      "follow-ups",
    ) as unknown as DashboardData["followUps"],
    growth: [
      { name: "Mon", value: 8 },
      { name: "Tue", value: 14 },
      { name: "Wed", value: 11 },
      { name: "Thu", value: 22 },
      { name: "Fri", value: 18 },
      { name: "Sat", value: 26 },
    ],
    sources: [
      { name: "Website", value: 42 },
      { name: "Instagram", value: 24 },
      { name: "Google Ads", value: 18 },
      { name: "Referral", value: 10 },
    ],
    funnel: [
      { name: "New", value: 24 },
      { name: "Contacted", value: 36 },
      { name: "Qualified", value: 18 },
      { name: "Proposal", value: 12 },
      { name: "Won", value: 18 },
    ],
    financial: true,
    monthlyRevenue: [
      { name: "Jul", value: 154000 },
      { name: "Aug", value: 182000 },
      { name: "Sep", value: 215000 },
      { name: "Oct", value: 248000 },
    ],
  };
  return (
    <Shell
      user={{ id: "preview-owner", name: "Preview owner", role: "owner" }}
      basePath="/preview"
      preview
    >
      {path.length > 1 ? (
        <Card>
          <h1>Illustrative record</h1>
          <p>
            Customer details and editing are available after connecting the
            database. Preview records are never saved.
          </p>
          <Link href={`/preview/${section}`} className="button secondary">
            Back to {section}
          </Link>
        </Card>
      ) : section === "dashboard" ? (
        <Dashboard previewData={data} basePath="/preview" />
      ) : section === "pipeline" ? (
        <>
          <div className="page-heading">
            <div>
              <h1>Sales pipeline</h1>
              <p>
                A shared view of every opportunity. Preview changes are
                disabled.
              </p>
            </div>
          </div>
          <div className="preview-pipeline">
            {["New", "Contacted", "Qualified", "Proposal", "Won"].map(
              (stage, i) => (
                <Card key={stage}>
                  <h2>
                    {stage} <Badge>{i + 1}</Badge>
                  </h2>
                  <article>
                    <strong>
                      {previewRecords("clients")[i % 4].businessName}
                    </strong>
                    <p>Illustrative opportunity</p>
                    <p>₹25,000 · Sample employee</p>
                  </article>
                </Card>
              ),
            )}
          </div>
        </>
      ) : section === "leads" || section === "reports" ? (
        <>
          <div className="page-heading">
            <div>
              <h1>{section === "leads" ? "Leads" : "Reports & analytics"}</h1>
              <p>
                Review the client and dashboard views below. Live enquiries and
                reports load from your connected database.
              </p>
            </div>
          </div>
          {section === "reports" ? (
            <Dashboard previewData={data} basePath="/preview" />
          ) : (
            <Operations
              module="leads"
              actorId="preview-owner"
              previewRows={previewRecords("leads")}
              basePath="/preview"
            />
          )}
        </>
      ) : (
        <Operations
          key={section}
          module={section}
          actorId="preview-owner"
          previewRows={previewRecords(section)}
          basePath="/preview"
        />
      )}
    </Shell>
  );
}
