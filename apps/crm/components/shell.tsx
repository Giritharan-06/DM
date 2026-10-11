"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CalendarDays,
  Building2,
  Megaphone,
  CheckSquare,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  UserRound,
  Bell,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { canAccess, type Module, type Role } from "@zyroz/auth/permissions";
import { useUI } from "@/lib/ui-store";
import { createAuthClient } from "better-auth/react";
import { WorkspaceUser } from "@/lib/workspace-user";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
const nav: [Module, string, typeof Users][] = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["leads", "Leads", Users],
  ["pipeline", "Sales pipeline", KanbanSquare],
  ["follow-ups", "Follow-ups", CalendarDays],
  ["clients", "Clients", Building2],
  ["campaigns", "Campaigns", Megaphone],
  ["tasks", "Tasks", CheckSquare],
  ["quotations", "Quotations", FileText],
  ["invoices", "Invoices", Receipt],
  ["payments", "Payments", CreditCard],
  ["reports", "Reports", BarChart3],
  ["team", "Team", UserRound],
  ["notifications", "Notifications", Bell],
  ["settings", "Settings", Settings],
];
export function Shell({
  children,
  user,
  basePath = "",
  preview = false,
}: {
  children: React.ReactNode;
  user: { id: string; name: string; role: Role };
  basePath?: string;
  preview?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const { menu, setMenu } = useUI();
  const relativePath = path.slice(basePath.length) || "/";
  const active =
    relativePath === "/" ? "dashboard" : relativePath.split("/")[1];
  const profile = useQuery({
    queryKey: ["agency-profile"],
    queryFn: () =>
      api<{ profile: { name: string; brandColor: string } }>("settings/agency"),
    enabled: !preview && user.role === "owner",
  });
  return (
    <WorkspaceUser.Provider value={user}>
      <div
        className="crm-shell"
        style={
          profile.data
            ? ({
                "--brand": profile.data.profile.brandColor,
              } as React.CSSProperties)
            : undefined
        }
      >
        <a className="skip-link" href="#workspace-main">
          Skip to workspace
        </a>
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <div className="sidebar-brand">
            <Link href={`${basePath}/`} className="logo">
              <span className="logo-mark">z</span>zyroz.
            </Link>
            <span className="workspace-label">AGENCY WORKSPACE</span>
            <button
              className="mobile-close button ghost"
              onClick={() => setMenu(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>
          <div className="workspace-picker">
            <span className="workspace-avatar">Z</span>
            <div>
              <strong>{profile.data?.profile.name || "ZYROZ Agency"}</strong>
              <small>
                {preview
                  ? "Read-only design preview"
                  : "Your connected workspace"}
              </small>
            </div>
          </div>
          <div className="nav-group-label">WORKSPACE</div>
          <nav aria-label="Workspace navigation">
            {nav
              .filter(([module]) => canAccess(user.role, module))
              .map(([module, label, Icon], i) => (
                <Link
                  key={module}
                  href={`${basePath}${module === "dashboard" ? "/" : `/${module}`}`}
                  className={`sidebar-link ${active === module ? "active" : ""} ${i === 7 ? "group-break" : ""}`}
                  onClick={() => setMenu(false)}
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{label}</span>
                  {active === module && <span className="nav-dot" />}
                </Link>
              ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="workspace-promo" aria-hidden="true">
              <span className="promo-orb" />
              <span className="promo-star">✦</span>
              <strong>
                A little clarity.
                <br />A lot of possibility.
              </strong>
              <span className="promo-brand">✦ ZYROZ</span>
            </div>
            <a
              href={
                process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"
              }
              className="website-link"
              target="_blank"
              rel="noreferrer"
            >
              View ZYROZ website <ArrowUpRight size={15} />
            </a>
            <div className="user-profile">
              <span className="avatar">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{user.name}</strong>
                <small>
                  {user.role === "owner" ? "Agency owner" : user.role}
                </small>
              </div>
              <button
                className="button ghost"
                aria-label="Sign out"
                disabled={preview}
                onClick={async () => {
                  await createAuthClient().signOut();
                  router.push("/sign-in");
                  router.refresh();
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>
        {menu && (
          <button
            className="sidebar-overlay"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          />
        )}
        <div className="workspace-content">
          <header className="topbar">
            <div className="row">
              <button
                className="mobile-menu button ghost"
                onClick={() => setMenu(true)}
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
              {canAccess(user.role, "leads") && (
                <form action={`${basePath}/leads`} className="topbar-search">
                  <Search size={14} />
                  <input
                    name="q"
                    aria-label="Search leads"
                    placeholder="Search your leads…"
                  />
                  <kbd>↵</kbd>
                </form>
              )}
              <span className="breadcrumb">
                Workspace <span>/</span>{" "}
                <strong>
                  {nav.find(([module]) => module === active)?.[1] ||
                    "Lead details"}
                </strong>
              </span>
            </div>
            <div className="row topbar-actions">
              {canAccess(user.role, "leads") && (
                <Link
                  className="button primary quick-add"
                  href={`${basePath}/leads`}
                >
                  + Leads
                </Link>
              )}
              <Link
                href={`${basePath}/notifications`}
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              <span className="topbar-divider" />
              <span className="avatar small">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="topbar-user">
                <strong>{user.name}</strong>
                <small>{user.role === "owner" ? "Admin" : user.role}</small>
              </div>
            </div>
          </header>
          <main id="workspace-main" className="workspace-main">
            {preview && (
              <div className="preview-banner">
                Development preview · Illustrative records only · Changes are
                disabled <Link href="/">Connect your workspace →</Link>
              </div>
            )}
            {children}
          </main>
          <footer className="crm-footer">
            ZYROZ Workspace <span>A little clarity. A lot of possibility.</span>
          </footer>
        </div>
      </div>
    </WorkspaceUser.Provider>
  );
}
