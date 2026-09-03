"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  AdminProfile,
  api,
  clearAuth,
  getRole,
  getToken,
  getUsername,
  setAuth,
} from "@/lib/api";

const SIDEBAR_KEY = "g3q_sidebar_collapsed";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("admin");
  const [fullName, setFullName] = useState<string | null>(null);
  const [role, setRole] = useState("admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isMaster = role === "master";

  const nav = useMemo(() => {
    if (isMaster) {
      return [
        { href: "/dashboard", label: "Questions Allocation", short: "QA" },
        { href: "/questions", label: "Question Bank", short: "QB" },
        { href: "/analytics", label: "Analytics", short: "AN" },
        { href: "/account", label: "Account", short: "AC" },
      ];
    }
    return [
      { href: "/dashboard", label: "My work", short: "MW" },
      { href: "/questions", label: "Review questions", short: "RQ" },
    ];
  }, [isMaster]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setUsername(getUsername() || "admin");
    setRole(getRole() || "admin");
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === "1") setCollapsed(true);
    api<AdminProfile>("/api/v1/admin/me")
      .then((profile) => {
        setUsername(profile.username);
        setFullName(profile.full_name);
        setRole(profile.role);
        setAuth(token, profile.username, profile.role);
        if (profile.role !== "master") {
          if (pathname.startsWith("/analytics") || pathname.startsWith("/account") || pathname.startsWith("/admins")) {
            router.replace("/dashboard");
          }
        }
      })
      .catch(() => {
        /* 401 handled by api helper */
      });
  }, [pathname, router]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  const roleLabel = isMaster ? "Master Admin" : "Sub Admin";

  return (
    <div
      className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""} ${
        isMaster ? "" : "has-mobile-tabs"
      }`}
    >
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">G3Q</span>
          <div className="sidebar-brand-text">
            <strong>G3Q Admin</strong>
            <p>{isMaster ? "Master console" : "Question review"}</p>
          </div>
          <button
            type="button"
            className="ghost compact sidebar-toggle desktop-only"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
          <button
            type="button"
            className="ghost compact sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            Close
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          {nav.map((item) => {
            const active =
              item.href === "/questions"
                ? pathname === "/questions" || pathname.startsWith("/questions/")
                : item.href === "/analytics"
                  ? pathname === "/analytics" || pathname.startsWith("/analytics/")
                  : item.href === "/dashboard"
                    ? pathname === "/dashboard" || pathname.startsWith("/admins")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav-link active" : "nav-link"}
                onClick={() => setMobileOpen(false)}
                title={item.label}
              >
                <span className="nav-label">{item.label}</span>
                <span className="nav-short">{item.short}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-user">
            <strong className="sidebar-user-name">
              {fullName || username}
            </strong>
            <span className="role-chip">{roleLabel}</span>
          </div>
          <button type="button" className="ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="admin-content">
        <header className="content-topbar">
          <button
            type="button"
            className="ghost menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <span className="menu-icon" aria-hidden>
              <i />
              <i />
              <i />
            </span>
          </button>
          {collapsed ? (
            <button
              type="button"
              className="ghost compact sidebar-rail-btn desktop-only"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
            >
              Show menu
            </button>
          ) : null}
          <div className="topbar-title">
            <h1>{title}</h1>
          </div>
        </header>
        <div className="admin-main">{children}</div>
      </div>

      {!isMaster ? (
        <nav className="mobile-tabbar" aria-label="Reviewer shortcuts">
          {nav.map((item) => {
            const active =
              item.href === "/questions"
                ? pathname === "/questions" || pathname.startsWith("/questions/")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "tab-link active" : "tab-link"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
