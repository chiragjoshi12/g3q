"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { getDesktopNavItems } from "@/config/navigation";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ACTIVE = "#2d689d";
const INACTIVE = "#111111";

/**
 * Desktop left rail — Home / G3Q AI / Leaderboard / Profile.
 * Hidden below `lg` so the mobile bottom nav is untouched.
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = getDesktopNavItems(t);

  return (
    <aside className="relative z-20 hidden h-full w-[14rem] shrink-0 flex-col bg-white px-7 pt-6 pb-8 lg:flex">
      <BrandIcon
        src={BRAND_ICONS.logo}
        alt="G3Q 3.0"
        priority
        className="size-18 shrink-0"
      />

      <nav aria-label={t("mainNav")} className="mt-12 flex flex-col gap-9">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.aliases ?? []).some(
              (alias) => pathname === alias || pathname.startsWith(`${alias}/`)
            );
          const color = active ? ACTIVE : INACTIVE;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-4 outline-none",
                active ? "font-bold" : "font-medium"
              )}
              style={{ color }}
            >
              {item.tint ? (
                <BrandGlyph
                  src={item.iconSrc}
                  color={color}
                  className={
                    item.id === "leaderboard" ? "size-[1.9rem]" : "size-[1.7rem]"
                  }
                />
              ) : (
                <BrandIcon src={item.iconSrc} alt="" className="size-[1.9rem]" />
              )}
              <span
                className={cn(
                  "text-[15px] leading-none tracking-wide",
                  active ? "font-bold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
