import { BRAND_ICONS } from "@/lib/brand-icons";
import { ROUTES } from "@/config/routes";

/** Bottom navigation destinations. Home and Profile only, per spec. */
export const BOTTOM_NAV_ITEMS = [
  { id: "home", label: "Home", href: ROUTES.home, iconSrc: BRAND_ICONS.navHome },
  { id: "profile", label: "Profile", href: ROUTES.profile, iconSrc: BRAND_ICONS.navProfile },
];
