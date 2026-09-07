"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

function NavGlyph({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "questions") {
    return (
      <svg {...common}>
        <path d="M8 4.5h7.2A2.3 2.3 0 0 1 17.5 6.8v12.4A1.8 1.8 0 0 1 15.7 21H8.3A2.3 2.3 0 0 1 6 18.7V6.8A2.3 2.3 0 0 1 8.3 4.5Z" />
        <path d="M9.2 9h6.2M9.2 12.5h6.2M9.2 16h4.2" />
      </svg>
    );
  }
  if (name === "admins") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.4" />
        <circle cx="16" cy="9" r="2" />
        <path d="M4.6 18.5c.7-2.7 2.6-4.1 4.4-4.1s3.7 1.4 4.4 4.1" />
        <path d="M13.4 14.8c1.4-.4 3-.1 3.9 1.1.7.9 1.1 2 1.3 2.6" />
      </svg>
    );
  }
  if (name === "allocation") {
    return (
      <svg {...common}>
        <rect x="4.5" y="5" width="15" height="14.5" rx="2" />
        <path d="M8 3.8v2.6M16 3.8v2.6M4.5 10h15" />
      </svg>
    );
  }
  if (name === "work") {
    return (
      <svg {...common}>
        <path d="M8.2 7V5.8A1.8 1.8 0 0 1 10 4h4a1.8 1.8 0 0 1 1.8 1.8V7" />
        <rect x="4.5" y="7" width="15" height="13" rx="2" />
        <path d="M9 13.2 11 15.2 15.2 11" />
      </svg>
    );
  }
  if (name === "person") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8.2" r="3.1" />
        <path d="M5.4 19.2c1.1-3.1 3.5-4.7 6.6-4.7s5.5 1.6 6.6 4.7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M9 5v14" />
    </svg>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMaster = role === "master";

  const nav = useMemo(() => {
    if (isMaster) {
      return [
        { href: "/questions", label: "Question Bank", icon: "questions" },
        { href: "/admins", label: "Admins", icon: "admins" },
        { href: "/dashboard", label: "Questions Allocation", icon: "allocation" },
      ];
    }
    return [
      { href: "/questions", label: "Question Bank", icon: "questions" },
      { href: "/dashboard", label: "My work", icon: "work" },
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
        if (profile.role !== "master" && pathname.startsWith("/admins")) {
          router.replace("/questions");
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

  function onSidebarArrow() {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setMobileOpen(false);
      return;
    }
    toggleCollapsed();
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        event.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function logout() {
    clearAuth();
    router.replace("/login");
  }

  const displayName = fullName || username;
  const roleLabel = isMaster ? "Master Admin" : "Sub Admin";
  const onAccount = pathname === "/account" || pathname.startsWith("/account/");

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
        </div>
        <nav className="sidebar-nav" aria-label="Main">
          {nav.map((item) => {
            const active =
              item.href === "/questions"
                ? pathname === "/questions" || pathname.startsWith("/questions/")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "nav-link active" : "nav-link"}
                onClick={() => setMobileOpen(false)}
                title={item.label}
              >
                <span className="nav-icon" aria-hidden>
                  <NavGlyph name={item.icon} />
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="profile-menu-wrap" ref={menuRef}>
            {menuOpen ? (
              <div className="profile-menu" role="menu">
                <Link
                  href="/account"
                  role="menuitem"
                  className={onAccount ? "profile-menu-item active" : "profile-menu-item"}
                  onClick={() => {
                    setMenuOpen(false);
                    setMobileOpen(false);
                  }}
                >
                  <span className="profile-menu-icon" aria-hidden>
                    <NavGlyph name="person" />
                  </span>
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="profile-menu-item logout"
                  onClick={logout}
                >
                  <span className="profile-menu-icon" aria-hidden>
                    <svg viewBox="0 0 24 24">
                      <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
                      <path d="M15 12H8" />
                      <path d="M13 8.5 16.5 12 13 15.5" />
                    </svg>
                  </span>
                  Logout
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className={`profile-btn${menuOpen ? " open" : ""}${onAccount ? " active" : ""}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Account menu"
            >
              <span className="profile-avatar" aria-hidden>
                <NavGlyph name="person" />
              </span>
              <span className="profile-copy">
                <strong>{displayName}</strong>
                <em>{roleLabel}</em>
              </span>
              <span className="profile-chevron" aria-hidden>
                <svg viewBox="0 0 16 16">
                  <path d="M4 6.25 8 10.25 12 6.25" />
                </svg>
              </span>
            </button>
          </div>
          <button
            type="button"
            className="sidebar-collapse"
            onClick={onSidebarArrow}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="nav-icon" aria-hidden>
              <NavGlyph name="collapse" />
            </span>
            <span className="nav-label">{collapsed ? "Expand" : "Collapse"}</span>
            <span className="sidebar-shortcut">Ctrl+B</span>
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
