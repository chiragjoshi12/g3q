"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BOTTOM_NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * Home / Profile bar. Same two-tab layout on every breakpoint, including
 * the desktop device frame.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-20 shrink-0 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgb(15_23_42/0.04)]">
      <ul className="mx-auto flex max-w-md items-stretch">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-1 py-2.5 outline-none"
              >
                <Icon
                  className={cn(
                    "size-[1.35rem] transition-colors",
                    active ? "text-[#111]" : "text-[#8B919A]"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span
                  className={cn(
                    "text-[11px] leading-none tracking-wide transition-colors",
                    active ? "font-medium text-[#111]" : "font-medium text-[#8B919A]"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
