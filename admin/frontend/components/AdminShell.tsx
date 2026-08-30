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

const BASE_NAV = [
  { href: "/analytics", label: "Analytics", short: "AN" },
  { href: "/questions", label: "Question Bank", short: "QB" },
  { href: "/account", label: "Account", short: "AC" },
];

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

  const nav = useMemo(() => {
    if (role === "master") {
      return [
        BASE_NAV[0],
        BASE_NAV[1],
        { href: "/admins", label: "Admins", short: "AD" },
        ...BASE_NAV.slice(2),
      ];
    }
    return BASE_NAV;
  }, [role]);

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
      })
      .catch(() => {
        /* 401 handled by api helper */
      });
  }, [router]);

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

  const roleLabel = role === "master" ? "Master Admin" : "Admin";

  return (
    <div className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">G3Q</span>
          <div className="sidebar-brand-text">
            <strong>G3Q Admin</strong>
            <p>Intelligence Layer</p>
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
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          {nav.map((item) => {
            const active =
              item.href === "/questions"
                ? pathname === "/questions" || pathname.startsWith("/questions/")
                : item.href === "/analytics"
                  ? pathname === "/analytics" || pathname.startsWith("/analytics/")
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
            aria-label="Open navigation"
          >
            Menu
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
          <div>
            <h1>{title}</h1>
          </div>
        </header>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
