"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Badge, Empty } from "@zyroz/ui";
import {
  Download,
  Plus,
  ArrowUpRight,
  Search,
  List,
  KanbanSquare,
  CalendarDays,
  RotateCw,
} from "lucide-react";
import { money } from "@zyroz/validation";
import { api, csv } from "@/lib/api";
import { WorkspaceUser } from "@/lib/workspace-user";
import { calendarRange, localDateTime } from "@/lib/calendar";
import type { RecordRow } from "@/lib/types";
import { RecordForm } from "./record-form";
import { TeamForm } from "./team-form";
import { Preferences } from "./preferences";
import { WorkCalendar } from "./work-calendar";
import { TaskBoard, taskStatuses } from "./task-board";
import { SettingsWorkspace } from "./settings-workspace";
const descriptions: Record<string, string> = {
  leads: "Your enquiries, their needs and the next conversation.",
  clients: "Your clients, their projects and the relationships behind them.",
  campaigns: "Plan campaigns, coordinate delivery and review performance.",
  tasks: "Bring every brief, deadline and next step into focus.",
  "follow-ups": "Stay close to every opportunity with timely conversations.",
  quotations: "Turn the next conversation into a considered proposal.",
  invoices: "Clear billing and a confident view of your outstanding balance.",
  payments: "An accurate record of every payment received.",
  team: "Your people, their responsibilities and shared momentum.",
  notifications: "Stay close to the updates that matter.",
};
const columns: Record<string, string[]> = {
  leads: [
    "businessName",
    "name",
    "service",
    "source",
    "stage",
    "dealValue",
    "assignedName",
  ],
  clients: [
    "businessName",
    "contactPerson",
    "industry",
    "status",
    "monthlyRetainer",
    "assignedName",
  ],
  campaigns: [
    "name",
    "clientName",
    "platform",
    "status",
    "budget",
    "assignedName",
  ],
  tasks: [
    "title",
    "clientName",
    "assignedName",
    "priority",
    "status",
    "deadline",
  ],
  "follow-ups": ["leadName", "type", "assignedName", "dueAt", "completedAt"],
  quotations: ["clientName", "status", "total", "validUntil"],
  invoices: ["number", "clientName", "total", "paid", "status", "dueDate"],
  payments: ["reference", "invoiceNumber", "amount", "method", "receivedAt"],
  team: ["name", "email", "role", "openTasks", "overdueTasks"],
};
const statuses: Record<string, readonly string[]> = {
  clients: ["active", "paused", "closed"],
  campaigns: ["planned", "active", "paused", "completed"],
  tasks: [...taskStatuses, "overdue"],
  "follow-ups": ["open", "completed", "overdue"],
  invoices: ["unpaid", "partially_paid", "paid", "overdue", "cancelled"],
  quotations: ["draft", "sent", "approved", "rejected"],
  notifications: ["unread"],
};
const human = (text: string) =>
  text
    .replace(/([A-Z])/g, " $1")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/^./, (c) => c.toUpperCase());
const headings: Record<string, string> = {
  assignedName: "Assigned to",
  clientName: "Client",
  leadName: "Business",
  monthlyRetainer: "Monthly value",
  completedAt: "Completed",
  dueAt: "Scheduled",
  invoiceNumber: "Invoice",
};
type ListData = {
  rows: RecordRow[];
  total: number;
  page: number;
  limit: number;
};
export function Operations({
  module,
  actorId,
  previewRows,
  basePath = "",
  initialStatus = "",
}: {
  module: string;
  actorId: string;
  previewRows?: RecordRow[];
  basePath?: string;
  initialStatus?: string;
}) {
  const [add, setAdd] = useState(false),
    [defaults, setDefaults] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [appliedSearch, setAppliedSearch] = useState(""),
    [status, setStatus] = useState(initialStatus),
    [priority, setPriority] = useState(""),
    [mine, setMine] = useState(false),
    [view, setView] = useState("table"),
    [month, setMonth] = useState(() => new Date()),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const actor = useContext(WorkspaceUser);
  const readOnly = previewRows !== undefined,
    client = useQueryClient(),
    limit = view === "table" ? 25 : 100;
  const range = view === "calendar" ? calendarRange(month) : { from, to };
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (appliedSearch) params.set("q", appliedSearch);
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (mine) params.set("assignee", actorId);
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  const key = [module, "records", params.toString()];
  const query = useQuery({
    queryKey: key,
    queryFn: () => api<ListData>(`${module}?${params}`),
    enabled: !readOnly && module !== "settings",
  });
  let demoRows = previewRows || [];
  if (readOnly) {
    demoRows = demoRows
      .filter(
        (row) =>
          !appliedSearch ||
          Object.values(row).some((v) =>
            String(v).toLowerCase().includes(appliedSearch.toLowerCase()),
          ),
      )
      .filter(
        (row) =>
          !status ||
          (status === "overdue"
            ? new Date(String(row.deadline || row.dueAt || row.dueDate)) <
                new Date() &&
              !["completed", "paid", "cancelled"].includes(
                String(row.status),
              ) &&
              !row.completedAt
            : module === "follow-ups"
              ? status === "completed"
                ? !!row.completedAt
                : !row.completedAt
              : module === "notifications"
                ? !row.readAt
                : row.status === status),
      )
      .filter((row) => !priority || row.priority === priority)
      .filter(
        (row) =>
          !mine || row.assignedTo === actorId || row.accountManager === actorId,
      );
    if (range.from || range.to) {
      const field =
        module === "tasks"
          ? "deadline"
          : module === "follow-ups"
            ? "dueAt"
            : module === "campaigns"
              ? "startDate"
              : module === "invoices"
                ? "date"
                : module === "payments"
                  ? "receivedAt"
                  : "createdAt";
      demoRows = demoRows.filter((row) => {
        const time = new Date(String(row[field])).getTime();
        return (
          (!range.from || time >= new Date(range.from).getTime()) &&
          (!range.to ||
            time <=
              new Date(
                range.to.length === 10 ? range.to + "T23:59:59.999Z" : range.to,
              ).getTime())
        );
      });
    }
  }
  const data = readOnly
    ? {
        rows: demoRows.slice((page - 1) * limit, page * limit),
        total: demoRows.length,
        page,
        limit,
      }
    : query.data;
  const rows = data?.rows || [],
    cols = columns[module] || [];
  const mutation = useMutation({
    mutationFn: ({
      id,
      value,
    }: {
      id: string;
      value: Record<string, unknown>;
    }) => {
      if (readOnly) throw new Error("Preview changes are disabled.");
      return api(`${module}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(value),
      });
    },
    onMutate: async ({ id, value }) => {
      setError("");
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ListData>(key);
      client.setQueryData<ListData>(key, (old) =>
        old
          ? {
              ...old,
              rows: old.rows.map((row) =>
                row.id === id
                  ? ({
                      ...row,
                      ...value,
                      ...(module === "follow-ups" && "completed" in value
                        ? {
                            completedAt: value.completed
                              ? new Date().toISOString()
                              : null,
                          }
                        : {}),
                    } as RecordRow)
                  : row,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (e, _v, ctx) => {
      client.setQueryData(key, ctx?.previous);
      setError(e.message);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: [module] });
      client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  const patch = (id: string, value: Record<string, unknown>) =>
    mutation.mutate({ id, value });
  const reset = (callback: () => void) => {
    callback();
    setPage(1);
  };
  const setMode = (mode: string) => reset(() => setView(mode));
  const href = (row: RecordRow) =>
    `${basePath}/${module === "follow-ups" ? "leads" : module}/${module === "follow-ups" ? row.leadId : row.id}`;
  function display(col: string, row: RecordRow) {
    let value = row[col];
    if (col === "clientName") value = value || row.leadName;
    if (value === null || value === undefined) return "—";
    if (
      [
        "total",
        "paid",
        "amount",
        "budget",
        "monthlyRetainer",
        "dealValue",
      ].includes(col) &&
      typeof value === "number"
    )
      return money(value);
    if (
      col === "status" &&
      module === "invoices" &&
      value !== "paid" &&
      value !== "cancelled" &&
      new Date(String(row.dueDate)) < new Date()
    )
      value = "overdue";
    if (["status", "priority", "role"].includes(col))
      return <Badge className={String(value)}>{human(String(value))}</Badge>;
    if (/Date$|At$|deadline|validUntil/.test(col)) {
      const date = new Date(String(value));
      return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
    }
    return String(value);
  }
  if (module === "settings")
    return <SettingsWorkspace readOnly={readOnly} basePath={basePath} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AGENCY WORKSPACE</span>
          <h1>{human(module)}</h1>
          <p>{descriptions[module]}</p>
        </div>
        <div className="row">
          <Button
            variant="secondary"
            disabled={!rows.length || readOnly}
            onClick={() => csv(rows, "zyroz-" + module + "-page")}
          >
            <Download size={14} />
            Export page
          </Button>
          {module !== "notifications" && (
            <Button
              disabled={readOnly}
              onClick={() => {
                setDefaults({});
                setAdd(true);
              }}
            >
              <Plus size={15} />
              Add{" "}
              {module === "follow-ups"
                ? "follow-up"
                : module === "team"
                  ? "employee"
                  : module.replace(/s$/, "")}
            </Button>
          )}
        </div>
      </div>
      {statuses[module] && (
        <div className="status-tabs" aria-label={`${module} status filters`}>
          <button
            aria-pressed={!status}
            onClick={() => reset(() => setStatus(""))}
          >
            All {module}
          </button>
          {statuses[module].map((value) => (
            <button
              aria-pressed={status === value}
              onClick={() => reset(() => setStatus(value))}
              key={value}
            >
              {human(value)}
            </button>
          ))}
        </div>
      )}
      <Card className="records-surface">
        <div className="record-toolbar">
          <form
            className="record-search"
            onSubmit={(event) => {
              event.preventDefault();
              reset(() => setAppliedSearch(search.trim()));
            }}
          >
            <Search size={16} />
            <input
              aria-label={`Search ${module}`}
              placeholder={`Search ${module}…`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button variant="ghost" type="submit">
              Search
            </Button>
          </form>
          <div className="row">
            {module === "tasks" && (
              <select
                className="search"
                aria-label="Task priority filter"
                value={priority}
                onChange={(event) =>
                  reset(() => setPriority(event.target.value))
                }
              >
                <option value="">All priorities</option>
                {["high", "medium", "low"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
            {["tasks", "follow-ups", "campaigns", "clients"].includes(
              module,
            ) && (
              <label className="my-records">
                <input
                  type="checkbox"
                  checked={mine}
                  onChange={(event) =>
                    reset(() => setMine(event.target.checked))
                  }
                />
                Assigned to me
              </label>
            )}
            {["tasks", "follow-ups"].includes(module) && (
              <div className="view-switch" aria-label="Record view">
                {[
                  ["table", List],
                  ...(module === "tasks" ? [["kanban", KanbanSquare]] : []),
                  ["calendar", CalendarDays],
                ].map(([value, Icon]) => {
                  const I = Icon as typeof List;
                  return (
                    <button
                      key={String(value)}
                      aria-pressed={view === value}
                      aria-label={`${human(String(value))} view`}
                      onClick={() => setMode(String(value))}
                    >
                      <I size={16} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {view !== "calendar" && !["team", "notifications"].includes(module) && (
          <div className="record-filters">
            <label>
              From
              <input
                type="date"
                value={from}
                onChange={(event) => reset(() => setFrom(event.target.value))}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={to}
                onChange={(event) => reset(() => setTo(event.target.value))}
              />
            </label>
            <span>
              {data?.total ?? "—"} accessible records{" "}
              {readOnly ? "· example data" : ""}
            </span>
            {(status || appliedSearch || from || to || mine || priority) && (
              <button
                className="button ghost"
                onClick={() => {
                  setStatus("");
                  setAppliedSearch("");
                  setSearch("");
                  setFrom("");
                  setTo("");
                  setPriority("");
                  setMine(false);
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
        {(query.error || error) && (
          <p className="error record-error" role="alert">
            {query.error?.message || error}
            <Button variant="ghost" onClick={() => query.refetch()}>
              <RotateCw size={13} />
              Retry
            </Button>
          </p>
        )}
        {query.isLoading && !readOnly ? (
          <div
            className="skeleton"
            role="status"
            aria-label="Loading records"
          />
        ) : view === "kanban" ? (
          <TaskBoard
            rows={rows}
            busy={mutation.isPending}
            readOnly={readOnly}
            basePath={basePath}
            onChange={(id, status) => patch(id, { status })}
          />
        ) : view === "calendar" ? (
          <WorkCalendar
            module={module}
            rows={rows}
            month={month}
            readOnly={readOnly}
            basePath={basePath}
            onMonthChange={(date) => reset(() => setMonth(date))}
            onCreate={(date) => {
              setDefaults({
                [module === "tasks" ? "deadline" : "dueAt"]:
                  localDateTime(date),
              });
              setAdd(true);
            }}
          />
        ) : module === "notifications" ? (
          <div className="notification-list">
            {rows.length ? (
              rows.map((row) => (
                <article
                  className={`notification-item ${row.readAt ? "read" : "unread"}`}
                  key={row.id}
                >
                  <div>
                    <Link href={`${basePath}${row.href || "/"}`}>
                      <h3>{row.title}</h3>
                    </Link>
                    <p>{row.body}</p>
                    <small>
                      {new Date(String(row.createdAt)).toLocaleString("en-IN")}
                    </small>
                  </div>
                  {!row.readAt && (
                    <Button
                      variant="secondary"
                      disabled={readOnly || mutation.isPending}
                      onClick={() => patch(String(row.id), {})}
                    >
                      Mark read
                    </Button>
                  )}
                </article>
              ))
            ) : (
              <Empty
                title="You’re all caught up"
                description="New enquiries and workspace updates will appear here."
              />
            )}
          </div>
        ) : rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {cols.map((col) => (
                    <th key={col}>{headings[col] || human(col)}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}>
                    <td className="row-number">{(page - 1) * limit + i + 1}</td>
                    {cols.map((col, index) => (
                      <td key={col}>
                        {index === 0 &&
                        module !== "payments" &&
                        module !== "team" ? (
                          <Link className="record-name" href={href(row)}>
                            <strong>{display(col, row)}</strong>
                            {module === "clients" && <small>{row.email}</small>}
                          </Link>
                        ) : (
                          display(col, row)
                        )}
                      </td>
                    ))}
                    <td>
                      <div className="row">
                        {!["payments", "team"].includes(module) && (
                          <Link
                            href={href(row)}
                            className="record-open"
                            aria-label={`Open ${row.title || row.businessName || row.name || row.number || row.leadName || "record"}`}
                          >
                            <ArrowUpRight size={16} />
                          </Link>
                        )}
                        {module === "follow-ups" && (
                          <Button
                            variant="ghost"
                            disabled={readOnly || mutation.isPending}
                            onClick={() =>
                              patch(String(row.id), {
                                completed: !row.completedAt,
                              })
                            }
                          >
                            {row.completedAt ? "Reopen" : "Complete"}
                          </Button>
                        )}
                        {module === "tasks" && (
                          <select
                            aria-label={`Status for ${row.title}`}
                            value={String(row.status)}
                            disabled={readOnly || mutation.isPending}
                            onChange={(event) =>
                              patch(String(row.id), {
                                status: event.target.value,
                              })
                            }
                          >
                            {taskStatuses.map((value) => (
                              <option value={value} key={value}>
                                {human(value)}
                              </option>
                            ))}
                          </select>
                        )}
                        {module === "team" &&
                          row.role !== "owner" &&
                          actor?.role === "owner" && (
                            <select
                              aria-label={`Role for ${row.name}`}
                              value={String(row.role)}
                              disabled={readOnly || mutation.isPending}
                              onChange={(event) => {
                                if (
                                  confirm(
                                    `Change ${row.name} to ${event.target.value}?`,
                                  )
                                )
                                  patch(String(row.id), {
                                    role: event.target.value,
                                  });
                              }}
                            >
                              {["sales", "marketing", "finance"].map(
                                (value) => (
                                  <option key={value}>{value}</option>
                                ),
                              )}
                            </select>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              status || appliedSearch
                ? "No matching records"
                : `A fresh start for your ${module}`
            }
            description="Create your first record, or adjust the filters to find what you need."
          />
        )}
        <div className="pagination">
          <span>
            {data?.total || 0} records · Page {page}
            {view === "calendar" && data && data.total > limit
              ? " · Use the page controls to see all events in this month"
              : ""}
          </span>
          <div className="row">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page * limit >= (data?.total || 0)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      {module === "notifications" && !readOnly && <Preferences />}
      {add &&
        !readOnly &&
        (module === "team" ? (
          <TeamForm
            onClose={() => setAdd(false)}
            onSaved={() => {
              setAdd(false);
              client.invalidateQueries({ queryKey: ["team"] });
            }}
          />
        ) : (
          <RecordForm
            module={module}
            defaults={defaults}
            onClose={() => setAdd(false)}
            onSaved={() => {
              setAdd(false);
              client.invalidateQueries({ queryKey: [module] });
              client.invalidateQueries({ queryKey: ["dashboard"] });
            }}
          />
        ))}
    </>
  );
}
