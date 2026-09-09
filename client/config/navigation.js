import { BRAND_ICONS } from "@/lib/brand-icons";
import { FEATURED_QUIZ_ID, ROUTES } from "@/config/routes";

/** Floating bottom nav on Home / Profile (not the landing tray). */
export function getBottomNavItems(t) {
  return [
    { id: "home", label: t("home"), href: ROUTES.home, iconSrc: BRAND_ICONS.navHome, tint: true },
    {
      id: "practice",
      label: t("practice"),
      href: ROUTES.quiz(FEATURED_QUIZ_ID, { practice: true }),
      iconSrc: BRAND_ICONS.navPractice,
      tint: false,
    },
    {
      id: "g3q-ai",
      label: "G3Q AI",
      href: ROUTES.g3qAi,
      iconSrc: BRAND_ICONS.navG3qAi,
      tint: false,
    },
    {
      id: "profile",
      label: t("profile"),
      href: ROUTES.profile,
      iconSrc: BRAND_ICONS.navProfile,
      tint: true,
    },
  ];
}

/** Left rail on the desktop Home / Profile shell. */
export function getDesktopNavItems(t) {
  return [
    { id: "home", label: t("home"), href: ROUTES.home, iconSrc: BRAND_ICONS.navHome, tint: true },
    {
      id: "g3q-ai",
      label: "G3Q AI",
      href: ROUTES.g3qAi,
      iconSrc: BRAND_ICONS.navG3qAi,
      tint: false,
    },
    {
      id: "leaderboard",
      label: t("leaderboard"),
      href: ROUTES.leaderboard,
      iconSrc: BRAND_ICONS.leaderboard,
      tint: true,
    },
    {
      id: "profile",
      label: t("profile"),
      href: ROUTES.profile,
      iconSrc: BRAND_ICONS.navProfile,
      tint: true,
      aliases: [ROUTES.quizAttempts, ROUTES.certificates, ROUTES.abhiyan],
    },
  ];
}
