"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { getBottomNavItems } from "@/config/navigation";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ACTIVE = "#2d689d";
const INACTIVE = "#000000";

/**
 * Floating Home / Profile / G3Q AI pill — used only under `(main)` layout.
 * Landing page keeps `LandingActionNav` separately.
 */
export function BottomNav({ className }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = getBottomNavItems(t);

  return (
    <nav
      aria-label={t("mainNav")}
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-transparent px-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:hidden",
        className
      )}
    >
      <ul
        className="pointer-events-auto mx-auto flex w-full max-w-[26.5rem] items-stretch rounded-[2rem] bg-white px-3 py-2.5"
        style={{
          boxShadow:
            "0 14px 40px rgb(15 23 42 / 0.18), 0 4px 14px rgb(15 23 42 / 0.10), 0 0 0 1px rgb(15 23 42 / 0.04)",
        }}
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const color = active ? ACTIVE : INACTIVE;

          return (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-col items-center gap-2.5 rounded-full px-2 py-1.5 outline-none transition-colors"
                style={{ color }}
              >
                <span className="grid h-7 place-items-center">
                  {item.tint ? (
                    <BrandGlyph
                      src={item.iconSrc}
                      color={color}
                      className={item.id === "home" || item.id === "profile" ? "size-[1.45rem]" : "size-[1.7rem]"}
                    />
                  ) : (
                    <BrandIcon src={item.iconSrc} alt="" className="size-[1.55rem]" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[13px] leading-none tracking-wide transition-colors",
                    active ? "font-semibold" : "font-medium"
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
