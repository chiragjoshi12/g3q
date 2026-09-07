import { BRAND_ICONS } from "@/lib/brand-icons";
import { ROUTES } from "@/config/routes";

/** Floating bottom nav on Home / Profile (not the landing tray). */
export function getBottomNavItems(t) {
  return [
    { id: "home", label: t("home"), href: ROUTES.home, iconSrc: BRAND_ICONS.navHome, tint: true },
    {
      id: "profile",
      label: t("profile"),
      href: ROUTES.profile,
      iconSrc: BRAND_ICONS.navProfile,
      tint: true,
    },
    {
      id: "g3q-ai",
      label: "G3Q AI",
      href: ROUTES.g3qAi,
      iconSrc: BRAND_ICONS.navG3qAi,
      tint: false,
    },
  ];
}
