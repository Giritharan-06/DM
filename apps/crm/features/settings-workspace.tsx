"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Empty } from "@zyroz/ui";
import {
  Building2,
  Globe,
  ShieldCheck,
  Bell,
  Boxes,
  History,
  Check,
  UserRound,
} from "lucide-react";
import { agencyProfileSchema, type AgencyProfile } from "@zyroz/validation";
import { canAccess, type Role, type Module } from "@zyroz/auth/permissions";
import { api } from "@/lib/api";
import { Catalog } from "./catalog";
import { WebsiteSettings } from "./website-settings";
import { Preferences } from "./preferences";
import type { RecordRow } from "@/lib/types";
const tabs = [
  ["agency", "Agency profile", Building2],
  ["website", "Website & contact", Globe],
  ["catalog", "Service catalog", Boxes],
  ["roles", "Roles & access", ShieldCheck],
  ["notifications", "Preferences", Bell],
  ["audit", "Audit history", History],
] as const;
function AgencyForm({ profile }: { profile: AgencyProfile }) {
  const [value, setValue] = useState(profile),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const client = useQueryClient();
  return (
    <Card className="settings-panel">
      <div className="panel-title">
        <div>
          <h2>Agency profile</h2>
          <p>Used in your workspace and billing documents.</p>
        </div>
        <Building2 size={22} />
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setMessage("");
          const parsed = agencyProfileSchema.safeParse(value);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            return;
          }
          setBusy(true);
          try {
            await api("settings/agency", {
              method: "PATCH",
              body: JSON.stringify(parsed.data),
            });
            await client.invalidateQueries({ queryKey: ["agency-profile"] });
            await client.invalidateQueries({ queryKey: ["settings"] });
            setMessage("Agency profile saved. Workspace branding is updated.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          {(
            [
              "name",
              "email",
              "phone",
              "gstin",
              "address",
              "brandColor",
            ] as const
          ).map((name) => (
            <label
              className={`field ${name === "address" ? "span-2" : ""}`}
              key={name}
            >
              {
                {
                  name: "Agency name",
                  email: "Business email",
                  phone: "Business phone",
                  gstin: "Agency GSTIN (optional)",
                  address: "Business address",
                  brandColor: "Primary brand color",
                }[name]
              }
              {name === "address" ? (
                <textarea
                  value={value[name]}
                  maxLength={600}
                  onChange={(event) =>
                    setValue({ ...value, [name]: event.target.value })
                  }
                />
              ) : (
                <input
                  type={
                    name === "email"
                      ? "email"
                      : name === "brandColor"
                        ? "color"
                        : "text"
                  }
                  value={value[name]}
                  required={name === "name"}
                  onChange={(event) =>
                    setValue({ ...value, [name]: event.target.value })
                  }
                />
              )}
            </label>
          ))}
        </div>
        <div className="settings-save">
          <Button disabled={busy}>
            {busy ? "Saving…" : "Save agency profile"}
          </Button>
          {message && (
            <span className="save-success" role="status">
              <Check size={14} />
              {message}
            </span>
          )}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
export function SettingsWorkspace({
  readOnly = false,
  basePath = "",
}: {
  readOnly?: boolean;
  basePath?: string;
}) {
  const [tab, setTab] = useState("agency");
  const profile = useQuery({
    queryKey: ["agency-profile"],
    queryFn: () =>
      api<{ profile: AgencyProfile; updatedAt: string | null }>(
        "settings/agency",
      ),
    enabled: !readOnly,
    refetchOnWindowFocus: false,
  });
  const audit = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<{ audit: RecordRow[] }>("settings"),
    enabled: !readOnly && tab === "audit",
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Workspace settings</h1>
          <p>
            Your agency identity, public contact details and workspace controls.
          </p>
        </div>
      </div>
      <div
        className="settings-navigation"
        role="tablist"
        aria-label="Settings sections"
      >
        {tabs.map(([id, label, Icon]) => (
          <button
            role="tab"
            aria-selected={tab === id}
            aria-controls="settings-content"
            id={`settings-tab-${id}`}
            onClick={() => setTab(id)}
            key={id}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <div
        id="settings-content"
        role="tabpanel"
        aria-labelledby={`settings-tab-${tab}`}
      >
        {readOnly && tab !== "roles" ? (
          <Card className="settings-panel">
            <h2>{tabs.find(([id]) => id === tab)?.[1]}</h2>
            <p>
              Settings are edited in the connected workspace. This development
              preview is read-only.
            </p>
            <Link className="button primary" href="/">
              Open connected workspace
            </Link>
          </Card>
        ) : tab === "agency" ? (
          profile.isPending ? (
            <div className="skeleton" />
          ) : profile.error ? (
            <p className="error" role="alert">
              {profile.error.message}
            </p>
          ) : (
            profile.data && (
              <AgencyForm
                profile={profile.data.profile}
                key={profile.data.updatedAt || "new"}
              />
            )
          )
        ) : tab === "website" ? (
          <WebsiteSettings />
        ) : tab === "catalog" ? (
          <Catalog />
        ) : tab === "notifications" ? (
          <Preferences />
        ) : tab === "roles" ? (
          <Card className="settings-panel">
            <div className="panel-title">
              <div>
                <h2>Roles & access</h2>
                <p>
                  Module access is enforced by the server. Employee records are
                  scoped to assignments.
                </p>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="table-wrap">
              <table className="permission-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    {["owner", "sales", "marketing", "finance"].map((role) => (
                      <th key={role}>{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
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
                      "settings",
                    ] as Module[]
                  ).map((module) => (
                    <tr key={module}>
                      <th scope="row">{module.replaceAll("-", " ")}</th>
                      {(
                        ["owner", "sales", "marketing", "finance"] as Role[]
                      ).map((role) => (
                        <td key={role}>
                          {canAccess(role, module) ? (
                            <span
                              className="permission-check"
                              aria-label="Access allowed"
                            >
                              <Check size={15} />
                            </span>
                          ) : (
                            <span className="muted" aria-label="No access">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link className="button secondary" href={`${basePath}/team`}>
              <UserRound size={15} />
              Manage employee roles
            </Link>
          </Card>
        ) : (
          <Card className="settings-panel">
            <h2>Audit history</h2>
            {audit.error ? (
              <p className="error" role="alert">
                {audit.error.message}
              </p>
            ) : audit.isPending ? (
              <div className="skeleton" />
            ) : audit.data?.audit.length ? (
              <ul className="timeline">
                {audit.data.audit.map((row) => (
                  <li key={row.id}>
                    <strong>{String(row.action).replaceAll("_", " ")}</strong>
                    <p>
                      {row.entity} · {row.entityId}
                    </p>
                    <small>
                      {new Date(String(row.createdAt)).toLocaleString("en-IN")}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                title="A clear trail of changes"
                description="Important workspace changes appear here."
              />
            )}
          </Card>
        )}
      </div>
    </>
  );
}
