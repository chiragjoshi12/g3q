"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  type Category,
  type ChildRow,
  type DashboardEntity,
  type MetricBundle,
  formatCompactNumber,
  formatPercent,
  institutionRowsForCategory,
  metricsForRow,
} from "@/lib/g3q-data";

type Order = "desc" | "asc";
type AnalyticsSession = {
  username: string;
  role: string;
  access_scope?: string | null;
  full_name?: string | null;
  university?: string | null;
  mobile_number?: string | null;
};

const ANALYTICS_TOKEN_KEY = "g3q-analytics-token";
const ANALYTICS_USER_KEY = "g3q-analytics-user";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "school", label: "School" },
  { value: "college", label: "College" },
  { value: "citizen", label: "Citizen" },
];

const ORDER_OPTIONS: { value: Order; label: string }[] = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" },
];

const WEEKS = Array.from({ length: 8 }, (_, index) => index + 1);
const RATE_COPY = { registration: "Registration", activation: "Activation", reach: "Reach" } as const;
const PORTAL_SECTIONS = [
  { label: "Main analytics", status: "live", icon: "analytics" },
  { label: "Visuals", status: "Soon", icon: "visuals" },
  { label: "Detailed data", status: "Soon", icon: "data" },
  { label: "Action", status: "Soon", icon: "action" },
] as const;

type PortalIconName = (typeof PORTAL_SECTIONS)[number]["icon"];

function sessionFromPayload(payload: AnalyticsSession): AnalyticsSession {
  return {
    username: payload.username,
    role: payload.role,
    access_scope: payload.access_scope ?? null,
    full_name: payload.full_name ?? null,
    university: payload.university ?? null,
    mobile_number: payload.mobile_number ?? null,
  };
}

function roleLabel(session: AnalyticsSession) {
  if (session.role === "master") return "Master admin";
  if (session.role === "sub_admin" || session.access_scope === "analytics") {
    return "Analytics admin";
  }
  return "Admin";
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M5.4 19.2c1.1-3.1 3.5-4.7 6.6-4.7s5.5 1.6 6.6 4.7" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
      <path d="M15 12H8" />
      <path d="M13 8.5 16.5 12 13 15.5" />
    </svg>
  );
}

function SidebarIcon({
  name,
  className,
}: {
  name: PortalIconName;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  if (name === "analytics") {
    return (
      <svg {...common}>
        <path d="M4 19.5h16" />
        <path d="M7 16.5v-5" />
        <path d="M12 16.5V7.5" />
        <path d="M17 16.5v-8" />
      </svg>
    );
  }

  if (name === "visuals") {
    return (
      <svg {...common}>
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <circle cx="9" cy="10.5" r="1.3" />
        <path d="M4.8 16.2 9.2 12.6l3.1 2.7 3.3-4.2 3.6 5.1" />
      </svg>
    );
  }

  if (name === "data") {
    return (
      <svg {...common}>
        <rect x="4.5" y="5" width="15" height="14" rx="1.8" />
        <path d="M4.5 9.5h15" />
        <path d="M9.5 9.5v9.5" />
        <path d="M14.5 9.5v9.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M13 4 6.8 13.2h4.4L11 20l6.2-9.2h-4.4z" />
    </svg>
  );
}

function ChevronIcon({
  direction,
  className,
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {direction === "left" ? (
        <path d="M14.5 5.5 8.5 12l6 6.5" />
      ) : (
        <path d="M9.5 5.5 15.5 12l-6 6.5" />
      )}
    </svg>
  );
}

async function analyticsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || "Unable to sign in.");
  }
  return payload as T;
}

export function DashboardClient({ entity }: { entity: DashboardEntity }) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [category, setCategory] = useState<Category>("all");
  const [week, setWeek] = useState<number | null>(null);
  const [order, setOrder] = useState<Order>("desc");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [sessionUser, setSessionUser] = useState<AnalyticsSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const effectiveSessionUser = sessionUser;
  const effectiveSidebarOpen =
    sidebarOpen ?? (isClient ? window.localStorage.getItem("g3q-sidebar-open") !== "false" : true);

  useEffect(() => {
    if (isClient && sidebarOpen !== null) {
      window.localStorage.setItem("g3q-sidebar-open", String(sidebarOpen));
    }
  }, [isClient, sidebarOpen]);

  useEffect(() => {
    if (!isClient) return;
    const token = window.localStorage.getItem(ANALYTICS_TOKEN_KEY);
    const storedUser = window.localStorage.getItem(ANALYTICS_USER_KEY);

    if (storedUser) {
      try {
        setSessionUser(JSON.parse(storedUser) as AnalyticsSession);
      } catch {
        window.localStorage.removeItem(ANALYTICS_USER_KEY);
      }
    }

    if (!token) {
      setAuthReady(true);
      return;
    }

    analyticsRequest<AnalyticsSession>("/api/v1/analytics/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((profile) => {
        const next = sessionFromPayload(profile);
        window.localStorage.setItem(ANALYTICS_USER_KEY, JSON.stringify(next));
        setSessionUser(next);
      })
      .catch(() => {
        window.localStorage.removeItem(ANALYTICS_TOKEN_KEY);
        window.localStorage.removeItem(ANALYTICS_USER_KEY);
        setSessionUser(null);
      })
      .finally(() => setAuthReady(true));
  }, [isClient]);

  const listRows = useMemo(() => {
    const rows =
      entity.kind === "taluka"
        ? institutionRowsForCategory(entity.children, category)
        : entity.children;

    const computed = rows
      .map((row) => ({
        row,
        metrics: metricsForRow(row, category, week),
      }))
      .filter((entry) => {
        if (entity.kind !== "taluka") {
          return true;
        }
        if (category === "citizen") {
          return false;
        }
        if (category === "all") {
          return true;
        }
        return entry.row.category === category;
      });

    computed.sort((left, right) =>
      order === "desc"
        ? right.metrics.played - left.metrics.played
        : left.metrics.played - right.metrics.played,
    );

    return computed;
  }, [category, entity.children, entity.kind, order, week]);

  if (!isClient) {
    return <div className="dashboard-shell min-h-screen" />;
  }

  if (!authReady) {
    return <div className="dashboard-shell min-h-screen" />;
  }

  if (!effectiveSessionUser) {
    return (
      <LoginScreen
        mobileNumber={mobileNumber}
        password={password}
        loading={authLoading}
        setMobileNumber={setMobileNumber}
        setPassword={setPassword}
        error={authError}
        onSubmit={async () => {
          const cleanMobile = mobileNumber.trim();
          if (!cleanMobile || !password.trim()) {
            return;
          }
          setAuthLoading(true);
          setAuthError("");
          try {
            const result = await analyticsRequest<AnalyticsSession & { access_token: string }>(
              "/api/v1/analytics/login",
              {
                method: "POST",
                body: JSON.stringify({
                  username: cleanMobile,
                  password,
                }),
              }
            );
            const profile = sessionFromPayload(result);
            window.localStorage.setItem(ANALYTICS_TOKEN_KEY, result.access_token);
            window.localStorage.setItem(ANALYTICS_USER_KEY, JSON.stringify(profile));
            setSessionUser(profile);
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Unable to sign in.");
          } finally {
            setAuthLoading(false);
          }
        }}
      />
    );
  }

  function handleLogout() {
    window.localStorage.removeItem(ANALYTICS_TOKEN_KEY);
    window.localStorage.removeItem(ANALYTICS_USER_KEY);
    setSessionUser(null);
    setPassword("");
    setMobileNumber("");
    setAuthError("");
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <Sidebar
          open={effectiveSidebarOpen}
          session={effectiveSessionUser}
          onToggle={() => setSidebarOpen((current) => !(current ?? effectiveSidebarOpen))}
          onLogout={handleLogout}
        />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <HeroSection
          entity={entity}
          category={category}
          setCategory={setCategory}
          week={week}
          setWeek={setWeek}
        />
        <section className="border-t border-[rgba(24,49,83,0.12)] pt-8 sm:pt-10">
          <FilterBar order={order} setOrder={setOrder} />
          {entity.kind === "taluka" && category === "citizen" ? (
            <CitizenEmptyState entity={entity} />
          ) : (
            <div className="mt-8 sm:mt-10">
              <div className="mb-6 sm:mb-7">
                <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[var(--foreground)]">
                  {entity.kind === "state"
                    ? "District performance"
                    : entity.kind === "district"
                      ? "Taluka performance"
                      : "Institution performance"}
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {listRows.map(({ row, metrics }, index) => (
                  <ScanRow
                    key={row.id}
                    row={row}
                    metrics={metrics}
                    rank={index + 1}
                    week={week}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function LoginScreen({
  mobileNumber,
  password,
  loading,
  error,
  setMobileNumber,
  setPassword,
  onSubmit,
}: {
  mobileNumber: string;
  password: string;
  loading: boolean;
  error: string;
  setMobileNumber: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <div className="dashboard-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-[0_24px_60px_rgba(24,49,83,0.12)] sm:p-8">
        <div className="mb-8">
          <div className="text-sm font-semibold text-[var(--muted)]">G3Q Analytics</div>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.05em] text-[var(--foreground)]">
            Sign in
          </h1>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">User ID</span>
            <input
              type="text"
              placeholder="Username"
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Password</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-base font-semibold text-white"
          >
            {loading ? "Please wait..." : "Continue"}
          </button>
          {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

function Sidebar({
  open,
  session,
  onToggle,
  onLogout,
}: {
  open: boolean;
  session: AnalyticsSession;
  onToggle: () => void;
  onLogout: () => void;
}) {
  return (
    <aside
      className={`hidden h-screen shrink-0 border-r border-[rgba(24,49,83,0.1)] overflow-visible transition-all duration-200 lg:sticky lg:top-0 lg:flex lg:flex-col ${
        open ? "w-[280px]" : "w-[74px]"
      }`}
    >
      <div className={`border-b border-[rgba(24,49,83,0.1)] ${open ? "px-4 py-5" : "px-3 py-4"}`}>
        <div className={`flex ${open ? "items-start justify-between gap-3" : "justify-center"}`}>
          {open ? (
            <div>
              <div className="text-sm font-semibold text-[var(--muted)]">G3Q</div>
              <div className="mt-1 text-2xl font-extrabold tracking-[-0.04em] text-[var(--foreground)]">
                Analytics Portal
              </div>
            </div>
          ) : null}
          <MenuToggleButton open={open} onClick={onToggle} />
        </div>
      </div>
      <nav className={`flex min-h-0 flex-1 flex-col gap-2 ${open ? "px-4 py-5" : "px-2 py-4"}`}>
        {PORTAL_SECTIONS.map((section) => (
          <button
            key={section.label}
            type="button"
            title={section.label}
            className={`flex items-center ${open ? "gap-3 px-4" : "justify-center px-2"} rounded-2xl py-3 text-left ${
              section.status === "live"
                ? "bg-white font-semibold text-[var(--foreground)] shadow-[0_8px_24px_rgba(24,49,83,0.06)]"
                : "text-[var(--ink-soft)]"
            }`}
          >
            <SidebarIcon name={section.icon} className="h-5 w-5 shrink-0" />
            <span className={open ? "min-w-0 flex-1 truncate" : "sr-only"}>{section.label}</span>
            {open && section.status !== "live" ? (
              <span className="rounded-full bg-[rgba(24,49,83,0.06)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                {section.status}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      <div className={`border-t border-[rgba(24,49,83,0.1)] ${open ? "px-3 py-4" : "px-2 py-4"}`}>
        <ProfileMenu session={session} onLogout={onLogout} expanded={open} />
      </div>
    </aside>
  );
}

function MenuToggleButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Collapse menu" : "Expand menu"}
      className="rounded-xl p-2 text-[var(--foreground)] hover:bg-[rgba(24,49,83,0.05)]"
    >
      <ChevronIcon direction={open ? "left" : "right"} className="h-5 w-5" />
    </button>
  );
}

function ProfileMenu({
  session,
  onLogout,
  expanded,
}: {
  session: AnalyticsSession;
  onLogout: () => void;
  expanded: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useDismissableLayer<HTMLDivElement>(() => setMenuOpen(false), menuOpen);
  const displayName = session.full_name?.trim() || session.username;

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className={`flex items-center gap-3 rounded-2xl text-left hover:bg-[rgba(24,49,83,0.05)] ${
            expanded ? "w-full px-3 py-2" : "w-full justify-center px-0 py-2"
          } ${menuOpen ? "bg-[rgba(24,49,83,0.05)]" : ""}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Open profile menu"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(45,106,163,0.12)] text-[var(--civic-blue)]">
            <PersonIcon className="h-5 w-5" />
          </span>
          {expanded ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[var(--foreground)]">
                  {displayName}
                </span>
                <span className="block text-xs text-[var(--muted)]">{roleLabel(session)}</span>
              </span>
              <span
                className={`text-[var(--muted)] transition-transform ${menuOpen ? "rotate-180" : ""}`}
                aria-hidden
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6.25 8 10.25 12 6.25" />
                </svg>
              </span>
            </>
          ) : null}
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className={`profile-pop absolute z-50 w-56 rounded-[22px] border border-[var(--line)] bg-[var(--surface-strong)] p-2 shadow-[0_18px_34px_rgba(24,49,83,0.14)] ${
              expanded ? "bottom-full left-0 mb-2" : "bottom-0 left-full ml-2"
            }`}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setProfileOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[rgba(45,106,163,0.08)]"
            >
              <PersonIcon className="h-5 w-5 text-[var(--civic-blue)]" />
              Profile
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-[var(--rose-clay)] hover:bg-[rgba(201,108,95,0.1)]"
            >
              <LogoutIcon className="h-5 w-5" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
      {profileOpen
        ? createPortal(
            <ProfileDialog session={session} onClose={() => setProfileOpen(false)} />,
            document.body,
          )
        : null}
    </>
  );
}

function ProfileDialog({
  session,
  onClose,
}: {
  session: AnalyticsSession;
  onClose: () => void;
}) {
  const displayName = session.full_name?.trim() || session.username;
  const fields = [
    { label: "Name", value: displayName },
    { label: "Username", value: session.username },
    { label: "Role", value: roleLabel(session) },
    { label: "University", value: session.university },
    { label: "Mobile", value: session.mobile_number },
  ].filter((field) => field.value);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(24,49,83,0.32)]"
        aria-label="Close profile"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-profile-title"
        className="profile-pop relative w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-[0_24px_60px_rgba(24,49,83,0.18)] sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Account</p>
            <h2
              id="analytics-profile-title"
              className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-[var(--foreground)]"
            >
              Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-[var(--foreground)] hover:bg-[rgba(24,49,83,0.05)]"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4 12 12M12 4 4 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(45,106,163,0.12)] text-[var(--civic-blue)]">
            <PersonIcon className="h-7 w-7" />
          </span>
          <div>
            <div className="text-lg font-bold text-[var(--foreground)]">{displayName}</div>
            <div className="text-sm text-[var(--muted)]">{roleLabel(session)}</div>
          </div>
        </div>
        <dl className="grid gap-3">
          {fields.map((field) => (
            <div
              key={field.label}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--foreground)]">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function HeroSection({
  entity,
  category,
  setCategory,
  week,
  setWeek,
}: {
  entity: DashboardEntity;
  category: Category;
  setCategory: (category: Category) => void;
  week: number | null;
  setWeek: (week: number | null) => void;
}) {
  const selectedBundle = entity.headerBundles[category] ?? entity.headerBundles.all;
  const activeBundle = useMemo(() => bundleForWeek(selectedBundle, week), [selectedBundle, week]);
  const registrationRate =
    selectedBundle?.total && selectedBundle.total > 0
      ? selectedBundle.registered / selectedBundle.total
      : null;
  const activationRate =
    selectedBundle && selectedBundle.registered > 0
      ? activeBundle.played / selectedBundle.registered
      : null;
  const reachRate =
    selectedBundle?.total && selectedBundle.total > 0
      ? activeBundle.played / selectedBundle.total
      : null;

  return (
    <section className="pt-6 pb-8 sm:pt-8 sm:pb-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <Link href="/" className="rounded-full px-3 py-1.5 hover:bg-[rgba(45,106,163,0.08)]">
          Gujarat
        </Link>
        {entity.parentName ? <span>/</span> : null}
        {entity.parentName && entity.kind === "taluka" ? (
          <Link
            href={`/district/${entity.parentName.toLowerCase().replace(/\s+/g, "-")}`}
            className="rounded-full px-3 py-1.5 hover:bg-[rgba(45,106,163,0.08)]"
          >
            {entity.parentName}
          </Link>
        ) : entity.parentName ? (
          <span className="rounded-full bg-[rgba(45,106,163,0.08)] px-3 py-1.5 text-[var(--ink-soft)]">
            {entity.parentName}
          </span>
        ) : null}
        {entity.parentName ? <span>/</span> : null}
        <span className="rounded-full bg-[rgba(47,141,138,0.12)] px-3 py-1.5 font-medium text-[var(--foreground)]">
          {entity.name}
        </span>
      </div>
      <div className="mt-10 flex flex-col gap-14 sm:mt-12 sm:gap-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-6xl font-extrabold tracking-[-0.07em] text-[var(--foreground)] sm:text-7xl">
              {entity.name}
            </h1>
            {entity.switcherOptions.length > 0 ? (
              <InlineSwitcher
                label={entity.kind === "district" ? "Change district" : "Change taluka"}
                options={entity.switcherOptions}
              />
            ) : null}
          </div>
          {entity.kind !== "taluka" ? (
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <ConnectedCategoryToggle value={category} onChange={setCategory} compact />
              <WeekMenu value={week} onChange={setWeek} />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <WeekMenu value={week} onChange={setWeek} />
            </div>
          )}
        </div>
        {entity.kind === "taluka" ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ConnectedCategoryToggle value={category} onChange={setCategory} />
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.1fr_1.1fr_0.95fr]">
          <HeroMetric
            title="Total"
            value={entity.header.total}
            rateLabel={RATE_COPY.registration}
            rateValue={registrationRate}
            accent="var(--civic-blue)"
          />
          <HeroMetric
            title="Registered"
            value={selectedBundle?.registered ?? entity.header.registered}
            rateLabel={RATE_COPY.activation}
            rateValue={activationRate}
            accent="var(--saffron)"
          />
          <HeroMetric
            title={week === null ? "Played" : `Played in Week ${week}`}
            value={activeBundle.played}
            rateLabel={RATE_COPY.reach}
            rateValue={reachRate}
            accent="var(--teal)"
            isWeekSensitive={week !== null}
          />
          <HeroMetric
            title={week === null ? "Total Plays" : `Plays in Week ${week}`}
            value={activeBundle.totalPlays}
            rateLabel="Repeat play intensity"
            rateValue={activeBundle.played > 0 ? activeBundle.totalPlays / activeBundle.played : null}
            accent="var(--leaf)"
            isWeekSensitive={week !== null}
            isPlays
          />
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  title,
  value,
  rateLabel,
  rateValue,
  accent,
  isWeekSensitive,
  isPlays,
}: {
  title: string;
  value: number | null;
  rateLabel: string;
  rateValue: number | null;
  accent: string;
  isWeekSensitive?: boolean;
  isPlays?: boolean;
}) {
  const showRatio = isPlays;
  return (
    <article
      className={`rounded-[22px] bg-transparent py-3 ${
        isWeekSensitive ? "metric-flash" : ""
      }`}
    >
      <div
        className="mb-4 h-1.5 w-18 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <p className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
        {title}
      </p>
      <div className="py-3 text-5xl font-extrabold tracking-[-0.07em] text-[var(--foreground)] sm:py-4 sm:text-6xl">
        {formatCompactNumber(value)}
      </div>
      <div className="mt-2 text-sm">
        <div className="text-[var(--muted)]">{rateLabel}</div>
        <div className="mt-1 text-base font-semibold text-[var(--foreground)]">
          {showRatio && rateValue !== null ? `${rateValue.toFixed(2)} plays per participant` : formatPercent(rateValue)}
        </div>
      </div>
    </article>
  );
}

function InlineSwitcher({
  label,
  options,
}: {
  label: string;
  options: DashboardEntity["switcherOptions"];
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissableLayer<HTMLDivElement>(() => setOpen(false), open);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_6px_18px_rgba(24,49,83,0.05)]"
        aria-expanded={open}
      >
        {label}
        <span className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}>v</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-10 mt-2 min-w-44 rounded-[20px] border border-[var(--line)] bg-white p-2 shadow-[0_18px_34px_rgba(24,49,83,0.12)]">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              onClick={() => setOpen(false)}
              className={`block rounded-2xl px-3 py-2.5 text-sm ${
                option.selected
                  ? "bg-[rgba(45,106,163,0.1)] font-semibold text-[var(--foreground)]"
                  : "text-[var(--ink-soft)] hover:bg-[rgba(24,49,83,0.05)] hover:text-[var(--foreground)]"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ConnectedCategoryToggle({
  value,
  onChange,
  compact,
}: {
  value: Category;
  onChange: (category: Category) => void;
  compact?: boolean;
}) {
  return (
    <div className="inline-flex flex-wrap overflow-hidden rounded-full border border-[var(--line)] bg-white p-1 shadow-[0_6px_18px_rgba(24,49,83,0.05)]">
      {CATEGORY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-2 text-sm ${
            compact ? "sm:px-4" : "sm:px-5"
          } ${
            value === option.value
              ? "bg-[rgba(47,141,138,0.14)] font-bold text-[var(--foreground)]"
              : "font-medium text-[var(--ink-soft)] hover:text-[var(--foreground)]"
          }`}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FilterBar({
  order,
  setOrder,
}: {
  order: Order;
  setOrder: (order: Order) => void;
}) {
  return (
    <section>
      <div className="max-w-sm">
        <CompactControl
          label="Order"
          options={ORDER_OPTIONS}
          selected={order}
          onChange={(value) => setOrder(value as Order)}
        />
      </div>
    </section>
  );
}

function CompactControl({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2">
        <span className="text-sm font-semibold text-[var(--muted)]">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              selected === option.value
                ? "border-[var(--teal)] bg-[rgba(47,141,138,0.12)] text-[var(--foreground)]"
                : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--teal)] hover:text-[var(--foreground)]"
            }`}
            aria-pressed={selected === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekMenu({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (week: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissableLayer<HTMLDivElement>(() => setOpen(false), open);
  const activeLabel = value === null ? "Week: All" : `Week: ${value}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-w-28 items-center justify-between gap-3 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_6px_18px_rgba(24,49,83,0.05)]"
        aria-expanded={open}
      >
        <span>{activeLabel}</span>
        <span className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}>v</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-36 rounded-[20px] border border-[var(--line)] bg-white p-2 shadow-[0_18px_34px_rgba(24,49,83,0.12)]">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={`mb-1 block w-full rounded-2xl px-3 py-2.5 text-left text-sm ${
              value === null
                ? "bg-[rgba(216,141,47,0.14)] font-semibold text-[var(--foreground)]"
                : "text-[var(--ink-soft)] hover:bg-[rgba(24,49,83,0.05)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {WEEKS.map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => {
                onChange(week);
                setOpen(false);
              }}
              className={`mb-1 block w-full rounded-2xl px-3 py-2.5 text-left text-sm last:mb-0 ${
                value === week
                  ? "bg-[rgba(216,141,47,0.14)] font-semibold text-[var(--foreground)]"
                  : "text-[var(--ink-soft)] hover:bg-[rgba(24,49,83,0.05)] hover:text-[var(--foreground)]"
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CitizenEmptyState({ entity }: { entity: DashboardEntity }) {
  return (
    <section className="border border-dashed border-[var(--line)] px-2 py-10 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          {entity.citizenEmptyState?.title}
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--muted)]">
          {entity.citizenEmptyState?.description}
        </p>
      </div>
    </section>
  );
}

function ScanRow({
  row,
  metrics,
  rank,
  week,
}: {
  row: ChildRow;
  metrics: ReturnType<typeof metricsForRow>;
  rank: number;
  week: number | null;
}) {
  const content = (
    <div className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 shadow-[0_4px_14px_rgba(24,49,83,0.04)] sm:px-5 lg:grid-cols-[0.9fr_2fr_2.2fr] lg:items-center">
      <div className="flex items-start gap-4">
        <div className="min-w-11 rounded-2xl bg-[rgba(45,106,163,0.1)] px-3 py-2 text-center text-sm font-semibold text-[var(--civic-blue)]">
          {rank}
        </div>
        <div>
          <div className="text-lg font-semibold text-[var(--foreground)]">{row.name}</div>
          <div className="mt-1 text-sm text-[var(--muted)]">{row.categoryLabel}</div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <MetricChip label="Total" value={formatCompactNumber(metrics.total)} />
        <MetricChip
          label="Registered"
          value={formatCompactNumber(metrics.registered)}
          note={formatPercent(metrics.registrationRate)}
        />
        <MetricChip
          label={week === null ? "Played" : "Played this week"}
          value={formatCompactNumber(metrics.played)}
          note={formatPercent(metrics.activationRate)}
          active={week !== null}
        />
        <MetricChip
          label={week === null ? "Total Plays" : "Plays this week"}
          value={formatCompactNumber(metrics.totalPlays)}
          active={week !== null}
        />
      </div>
      <div className="grid gap-3">
        <RateLane label={RATE_COPY.registration} value={metrics.registrationRate} color="var(--civic-blue)" />
        <RateLane label={RATE_COPY.activation} value={metrics.activationRate} color="var(--saffron)" />
        <RateLane label={RATE_COPY.reach} value={metrics.reachRate} color="var(--teal)" />
      </div>
    </div>
  );

  if (row.kind === "institution") {
    return (
      <details className="group">
        <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
          {content}
        </summary>
        <div className="rounded-b-[24px] border-x border-b border-[var(--line)] bg-[rgba(24,49,83,0.03)] px-5 py-4">
          <div className="mb-3 text-sm font-semibold text-[var(--muted)]">Weekly breakdown</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {row.weekly.map((entry, index) => (
              <div key={index} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <div className="text-sm font-semibold text-[var(--foreground)]">Week {index + 1}</div>
                <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                  <span>Played: {formatCompactNumber(entry.played)}</span>
                  <span>Total Plays: {formatCompactNumber(entry.totalPlays)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>
    );
  }

  if (row.href) {
    return (
      <Link href={row.href} className="block rounded-[24px] focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

function MetricChip({
  label,
  value,
  note,
  active,
}: {
  label: string;
  value: string;
  note?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-3 ${
        active
          ? "border-[rgba(47,141,138,0.28)] bg-[rgba(47,141,138,0.08)]"
          : "border-[rgba(24,49,83,0.08)] bg-[rgba(24,49,83,0.03)]"
      }`}
    >
      <div className="text-xs font-medium text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-lg font-bold tracking-[-0.03em] text-[var(--foreground)]">{value}</div>
      {note ? <div className="mt-1 text-xs text-[var(--ink-soft)]">{note}</div> : null}
    </div>
  );
}

function RateLane({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-[var(--muted)]">{label}</span>
        <span className="font-semibold text-[var(--foreground)]">{formatPercent(value)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[rgba(24,49,83,0.08)]">
        {value !== null ? (
          <div
            className="h-2.5 rounded-full"
            style={{
              width: `${Math.max(6, Math.min(100, value * 100))}%`,
              backgroundColor: color,
            }}
          />
        ) : (
          <div className="h-2.5 rounded-full border border-dashed border-[var(--line)]" />
        )}
      </div>
    </div>
  );
}

function bundleForWeek(bundle: MetricBundle | undefined, week: number | null): MetricBundle {
  if (!bundle) {
    return {
      total: null,
      registered: 0,
      played: 0,
      totalPlays: 0,
      weekly: Array.from({ length: 8 }, () => ({ played: 0, totalPlays: 0 })),
    };
  }

  if (week === null) {
    return bundle;
  }

  const weekly = bundle.weekly[week - 1];
  return {
    ...bundle,
    played: weekly.played,
    totalPlays: weekly.totalPlays,
  };
}

function useDismissableLayer<T extends HTMLElement>(onDismiss: () => void, active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onDismiss();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [active, onDismiss]);

  return ref;
}
