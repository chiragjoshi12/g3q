"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  { label: "Main analytics", status: "live" },
  { label: "Visuals", status: "Soon" },
  { label: "Detailed data", status: "Soon" },
  { label: "Action", status: "Soon" },
] as const;

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
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);

  const storedSessionUser = isClient ? window.localStorage.getItem("g3q-session-user") : null;
  const effectiveSessionUser = sessionUser ?? storedSessionUser;
  const effectiveSidebarOpen =
    sidebarOpen ?? (isClient ? window.localStorage.getItem("g3q-sidebar-open") !== "false" : true);

  useEffect(() => {
    if (isClient && sidebarOpen !== null) {
      window.localStorage.setItem("g3q-sidebar-open", String(sidebarOpen));
    }
  }, [isClient, sidebarOpen]);

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

  if (!effectiveSessionUser) {
    return (
      <LoginScreen
        mobileNumber={mobileNumber}
        password={password}
        setMobileNumber={setMobileNumber}
        setPassword={setPassword}
        onSubmit={() => {
          const cleanMobile = mobileNumber.trim();
          if (!cleanMobile || !password.trim()) {
            return;
          }
          window.localStorage.setItem("g3q-session-user", cleanMobile);
          setSessionUser(cleanMobile);
        }}
      />
    );
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <Sidebar
          open={effectiveSidebarOpen}
          userId={effectiveSessionUser}
          onToggle={() => setSidebarOpen((current) => !(current ?? effectiveSidebarOpen))}
          onLogout={() => {
            window.localStorage.removeItem("g3q-session-user");
            setSessionUser(null);
            setPassword("");
            setMobileNumber("");
          }}
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
  setMobileNumber,
  setPassword,
  onSubmit,
}: {
  mobileNumber: string;
  password: string;
  setMobileNumber: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit: () => void;
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
              type="tel"
              inputMode="numeric"
              placeholder="Mobile number"
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
            className="mt-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-base font-semibold text-white"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

function Sidebar({
  open,
  userId,
  onToggle,
  onLogout,
}: {
  open: boolean;
  userId: string;
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
            className={`flex items-center ${open ? "justify-between px-4" : "justify-center px-2"} rounded-2xl py-3 text-left ${
              section.status === "live"
                ? "bg-white font-semibold text-[var(--foreground)] shadow-[0_8px_24px_rgba(24,49,83,0.06)]"
                : "text-[var(--ink-soft)]"
            }`}
          >
            <span className={open ? "" : "sr-only"}>{section.label}</span>
            {!open ? (
              <span className="text-sm font-semibold">
                {section.label.charAt(0)}
              </span>
            ) : section.status === "live" ? null : (
              <span className="rounded-full bg-[rgba(24,49,83,0.06)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                {section.status}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className={`border-t border-[rgba(24,49,83,0.1)] ${open ? "px-4 py-4" : "px-2 py-4"}`}>
        <ProfileMenu userId={userId} onLogout={onLogout} expanded={open} />
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
      aria-label={open ? "Close menu" : "Open menu"}
      className="rounded-xl p-2 text-[var(--foreground)] hover:bg-[rgba(24,49,83,0.05)]"
    >
      <span className="relative block h-5 w-5">
        <span className="absolute left-0 top-0 h-5 w-[3px] rounded-full bg-[var(--foreground)] opacity-70" />
        <span className="absolute right-0 top-[3px] h-[2px] w-3 rounded-full bg-[var(--foreground)]" />
        <span className="absolute right-0 top-[9px] h-[2px] w-3 rounded-full bg-[var(--foreground)]" />
        <span className="absolute right-0 top-[15px] h-[2px] w-3 rounded-full bg-[var(--foreground)]" />
      </span>
    </button>
  );
}

function ProfileMenu({
  userId,
  onLogout,
  expanded,
}: {
  userId: string;
  onLogout: () => void;
  expanded: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useDismissableLayer<HTMLDivElement>(() => setMenuOpen(false), menuOpen);
  const shortId = userId.length > 4 ? userId.slice(-4) : userId;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        className={`flex items-center gap-3 rounded-2xl text-left ${expanded ? "w-full px-3 py-2 hover:bg-[rgba(24,49,83,0.05)]" : "w-full justify-center px-0 py-2"}`}
        aria-expanded={menuOpen}
        aria-label="Open profile menu"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(45,106,163,0.12)] text-sm font-bold text-[var(--foreground)]">
          {shortId}
        </div>
        {expanded ? (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[var(--foreground)]">{userId}</div>
            <div className="text-xs text-[var(--muted)]">Profile</div>
          </div>
        ) : null}
      </button>
      {menuOpen ? (
        <div className={`absolute ${expanded ? "left-0" : "left-full ml-2"} bottom-full mb-2 w-52 rounded-[20px] border border-[var(--line)] bg-white p-2 shadow-[0_18px_34px_rgba(24,49,83,0.12)]`}>
          <div className="rounded-2xl px-3 py-2 text-sm font-semibold text-[var(--foreground)]">
            {userId}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            className="block w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[rgba(24,49,83,0.05)]"
          >
            Log out
          </button>
        </div>
      ) : null}
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
