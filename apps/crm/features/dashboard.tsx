"use client";
import { useState, useContext } from "react";
import { WorkspaceUser } from "@/lib/workspace-user";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  UserPlus,
  BadgeCheck,
  Building2,
  IndianRupee,
  Wallet,
  TrendingUp,
  CalendarDays,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { Card, Badge, Empty, Button } from "@zyroz/ui";
import { money } from "@zyroz/validation";
import { api } from "@/lib/api";
import type { Lead } from "@/lib/types";
import { canAccess, type Module } from "@zyroz/auth/permissions";
import { localDate } from "@/lib/calendar";
type Datum = { name: string; value: number };
export type DashboardData = {
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    activeClients: number;
    revenue: number | null;
    pendingPayments: number | null;
    conversionRate: number;
    upcomingFollowUps: number;
  };
  leads: Lead[];
  followUps: {
    id: string;
    type: string;
    notes: string | null;
    dueAt: string;
  }[];
  growth: Datum[];
  sources: Datum[];
  funnel: Datum[];
  financial: boolean;
  monthlyRevenue: Datum[];
  openTasks?: {
    id: string;
    title: string;
    status: string;
    deadline: string;
    priority: string;
  }[];
  campaignResults?: Datum[];
  updates?: { id: string; title: string; body: string; href: string | null }[];
};
export function Dashboard({
  previewData,
  basePath = "",
}: {
  previewData?: DashboardData;
  basePath?: string;
}) {
  const user = useContext(WorkspaceUser);
  const today = localDate(new Date());
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const query = useQuery({
    queryKey: ["dashboard", from, to],
    queryFn: () => api<DashboardData>(`dashboard?from=${from}&to=${to}`),
    enabled: !previewData && !!from && !!to && from <= to,
  });
  const d = previewData || query.data;
  const k = d?.kpis;
  const stats = [
    ["Total leads", k?.totalLeads, Users, "leads"],
    ["New leads", k?.newLeads, UserPlus, "leads?stage=new"],
    ["Qualified leads", k?.qualifiedLeads, BadgeCheck, "leads?stage=qualified"],
    ["Active clients", k?.activeClients, Building2, "clients"],
    [
      "Revenue received",
      k?.revenue === null
        ? "Restricted"
        : k?.revenue !== undefined
          ? money(k.revenue)
          : undefined,
      IndianRupee,
      "payments",
    ],
    [
      "Pending payments",
      k?.pendingPayments === null
        ? "Restricted"
        : k?.pendingPayments !== undefined
          ? money(k.pendingPayments)
          : undefined,
      Wallet,
      "invoices",
    ],
    [
      "Conversion rate",
      k ? `${k.conversionRate.toFixed(1)}%` : undefined,
      TrendingUp,
      "pipeline",
    ],
    ["Open follow-ups", k?.upcomingFollowUps, CalendarDays, "follow-ups"],
  ] as const;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow" style={{ fontSize: 9, marginBottom: 9 }}>
            Your agency at a glance
          </div>
          <h1>
            Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}!{" "}
            <span aria-hidden="true">👋</span>
          </h1>
          <p>Here’s what’s happening with your agency today.</p>
        </div>
        <div className="period-control">
          <CalendarDays size={14} />
          <label className="sr-only" htmlFor="from">
            Start date
          </label>
          <input
            id="from"
            type="date"
            disabled={!!previewData}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span>—</span>
          <label className="sr-only" htmlFor="to">
            End date
          </label>
          <input
            id="to"
            type="date"
            disabled={!!previewData}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>
      {query.error && (
        <p className="error" role="alert">
          {query.error.message}{" "}
          <Button variant="ghost" onClick={() => query.refetch()}>
            Retry
          </Button>
        </p>
      )}
      <div className="kpi-grid">
        {stats.map(([title, value, Icon, href]) => (
          <Link
            href={
              user && canAccess(user.role, href.split("?")[0] as Module)
                ? `${basePath}/${href}`
                : `${basePath}/`
            }
            key={title}
          >
            <Card className="kpi">
              <div className="kpi-title">
                {title}
                <span className="kpi-icon">
                  <Icon size={14} />
                </span>
              </div>
              <div
                className="kpi-value"
                style={value === "Restricted" ? { fontSize: 18 } : undefined}
              >
                {value ?? "—"}
              </div>
              <div className="kpi-note">
                {title === "Pending payments" ||
                title === "Active clients" ||
                title === "Open follow-ups"
                  ? "Current workspace total"
                  : "Selected date range"}
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <div className="dashboard-charts">
        <Card>
          <div className="panel-title">
            <h2>Lead growth</h2>
            <small>Enquiries over time</small>
          </div>
          {d?.growth.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={d.growth}>
                <defs>
                  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ed704b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ed704b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                  <CartesianGrid vertical={false} stroke="#e3e0d4" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="value"
                  stroke="#c3492d"
                  fill="url(#area)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <BarChart3 size={29} strokeWidth={1} />
              <span>Your lead growth will appear here</span>
            </div>
          )}
        </Card>
        <Card>
          <div className="panel-title">
            <h2>Sales funnel</h2>
            {user && canAccess(user.role, "pipeline") && (
              <Link href={`${basePath}/pipeline`}>View pipeline ↗</Link>
            )}
          </div>
          {d?.funnel.some((v) => v.value) ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={d.funnel} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar isAnimationActive={false} dataKey="value" fill="#347c82" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <TrendingUp size={29} strokeWidth={1} />
              <span>A home for your next opportunity</span>
            </div>
          )}
        </Card>
      </div>
      <div className="dashboard-charts">
        <Card>
          <div className="panel-title">
            <h2>Lead sources</h2>
            <small>Where conversations begin</small>
          </div>
          {d?.sources.length ? (
            <div className="source-chart">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Tooltip />
                  <Pie
                    isAnimationActive={false}
                    data={d.sources}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {d.sources.map((source, i) => (
                      <Cell
                        key={source.name}
                        fill={
                          [
                            "#c3492d",
                            "#347c82",
                            "#458064",
                            "#c88d40",
                            "#8c6b58",
                          ][i % 5]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <ul>
                {d.sources.map((source, i) => (
                  <li key={source.name}>
                    <span
                      style={{
                        background: [
                          "#c3492d",
                          "#347c82",
                          "#458064",
                          "#c88d40",
                          "#8c6b58",
                        ][i % 5],
                      }}
                    />
                    {source.name}
                    <strong>{source.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Empty
              title="Find your strongest channels"
              description="Lead sources appear as enquiries arrive."
            />
          )}
        </Card>
        {d?.financial && (
          <Card>
            <div className="panel-title">
              <h2>Revenue received</h2>
              <small>Recorded payments · INR</small>
            </div>
            {d.monthlyRevenue.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={d.monthlyRevenue}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar isAnimationActive={false} dataKey="value" fill="#458064" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty
                title="A clear view of your revenue"
                description="Record payments to see the monthly trend."
              />
            )}
          </Card>
        )}
      </div>
      <div className="dashboard-bottom">
        {user && canAccess(user.role, "leads") && (
          <>
            <Card>
              <div className="panel-title">
                <h2>Recent enquiries</h2>
                <Link href={`${basePath}/leads`}>
                  View all{" "}
                  <ArrowUpRight size={11} style={{ display: "inline" }} />
                </Link>
              </div>
              {d?.leads.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Business</th>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.leads.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <Link href={`${basePath}/leads/${l.id}`}>
                              <strong>{l.businessName}</strong>
                              <small>{l.name}</small>
                            </Link>
                          </td>
                          <td>{l.service}</td>
                          <td>
                            <Badge className={l.stage}>
                              {l.stage.replaceAll("_", " ")}
                            </Badge>
                          </td>
                          <td>
                            {new Date(l.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Your next conversation starts here"
                  description="New website enquiries will automatically arrive in your workspace."
                />
              )}
            </Card>
            <Card>
              <div className="panel-title">
                <h2>Upcoming follow-ups</h2>
                <Link href={`${basePath}/follow-ups`}>View all ↗</Link>
              </div>
              {d?.followUps.length ? (
                d.followUps.map((f) => (
                  <div className="follow-item" key={f.id}>
                    <span className="follow-date">
                      {new Date(f.dueAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <div>
                      <strong>{f.type.replaceAll("_", " ")}</strong>
                      <p>{f.notes || "Follow up with your lead"}</p>
                      <p>
                        {new Date(f.dueAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <Empty
                  title="A little breathing room"
                  description="No open follow-ups. Schedule your next conversation from a lead."
                />
              )}
            </Card>
          </>
        )}
      </div>
      <div className="dashboard-bottom">
        <Card>
          <div className="panel-title">
            <h2>Tasks needing attention</h2>
            <Link href={`${basePath}/tasks`}>View all ↗</Link>
          </div>
          {d?.openTasks?.length ? (
            d.openTasks.map((task) => (
              <div className="follow-item" key={task.id}>
                <span className="follow-date">
                  {new Date(task.deadline) < new Date()
                    ? "Overdue"
                    : new Date(task.deadline).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                </span>
                <div>
                  <Link href={`${basePath}/tasks/${task.id}`}>
                    <strong>{task.title}</strong>
                  </Link>
                  <p>
                    {task.status.replaceAll("_", " ")} · {task.priority}{" "}
                    priority
                  </p>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Keep your next steps together"
              description="Open assigned tasks appear here, ordered by deadline."
            />
          )}
        </Card>
        <Card>
          <div className="panel-title">
            <h2>Recent notifications</h2>
            <Link href={`${basePath}/notifications`}>View all ↗</Link>
          </div>
          {d?.updates?.length ? (
            d.updates.map((update) => (
              <div className="follow-item" key={update.id}>
                <div>
                  <Link href={`${basePath}${update.href || "/notifications"}`}>
                    <strong>{update.title}</strong>
                  </Link>
                  <p>{update.body}</p>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="A quieter workspace"
              description="Your recent workspace updates will appear here."
            />
          )}
        </Card>
      </div>
      {user && canAccess(user.role, "campaigns") && (
        <Card style={{ marginTop: 20 }}>
          <div className="panel-title">
            <h2>Campaign enquiries</h2>
            <Link href={`${basePath}/campaigns`}>View campaigns ↗</Link>
          </div>
          {d?.campaignResults?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.campaignResults}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar isAnimationActive={false} dataKey="value" fill="#c3492d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty
              title="Track the work behind your results"
              description="Add campaign metrics manually to compare recorded enquiries."
            />
          )}
        </Card>
      )}
      <div style={{ marginTop: 22, fontSize: 10, color: "var(--muted)" }}>
        Conversion = Won leads ÷ leads created in the selected period. Revenue =
        recorded payments received in the period. No advertising results are
        simulated.
      </div>
    </>
  );
}
