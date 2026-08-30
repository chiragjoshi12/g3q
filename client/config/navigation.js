import { Home, User } from "@/components/icons";
import { ROUTES } from "@/config/routes";

/** Bottom navigation destinations. Home and Profile only, per spec. */
export const BOTTOM_NAV_ITEMS = [
  { id: "home", label: "Home", href: ROUTES.home, icon: Home },
  { id: "profile", label: "Profile", href: ROUTES.profile, icon: User },
];
