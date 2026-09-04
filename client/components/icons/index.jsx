import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  Sparkles as SparklesSrc,
  Home as HomeSrc,
  RotateCcw as RotateCcwSrc,
  ArrowLeft as ArrowLeftSrc,
  Send as SendSrc,
  History as HistorySrc,
  Trophy as TrophySrc,
  Clock as ClockSrc,
  QuizIcon,
  Play as PlaySrc,
  Signal as SignalSrc,
  AlertCircle as AlertCircleSrc,
  ArrowRight as ArrowRightSrc,
  ShieldCheck as ShieldCheckSrc,
  CheckCircle as CheckCircleSrc,
  ChevronDown as ChevronDownSrc,
  Timer as TimerSrc,
  XCircle as XCircleSrc,
  MessageLockIcon,
  Pause as PauseSrc,
  X as XSrc,
  ChevronUp as ChevronUpSrc,
  Check as CheckSrc,
  GripVertical as GripVerticalSrc,
  Lightbulb as LightbulbSrc,
  Award01Icon,
  InformationCircleIcon,
  Call02Icon,
  BadgeCheck as BadgeCheckSrc,
  Building2 as Building2Src,
  GraduationCap as GraduationCapSrc,
  MapPin as MapPinSrc,
  MousePointerClick as MousePointerClickSrc,
  Link2 as Link2Src,
  Inbox as InboxSrc,
  User as UserSrc,
  CalendarDays as CalendarDaysSrc,
  ChevronLeft as ChevronLeftSrc,
  LogOut as LogOutSrc,
  Percent as PercentSrc,
  Target as TargetSrc,
  Trash2 as Trash2Src,
  SmartPhone01Icon,
  Download04Icon,
} from "@hugeicons/core-free-icons";

/**
 * Lucide → Hugeicons adapter.
 *
 * Every icon used across the app is wrapped here once, so screens keep
 * importing a plain named component (`<Home className="size-5" />`) instead
 * of the `<HugeiconsIcon icon={...} />` shape. Swapping the underlying icon
 * set again only ever means editing this file.
 */
function createIcon(icon, displayName) {
  function Icon(props) {
    return <HugeiconsIcon icon={icon} {...props} />;
  }
  Icon.displayName = displayName;
  return Icon;
}

export const Loader2 = createIcon(Loading03Icon, "Loader2");
export const Sparkles = createIcon(SparklesSrc, "Sparkles");
export const Home = createIcon(HomeSrc, "Home");
export const RotateCcw = createIcon(RotateCcwSrc, "RotateCcw");
export const ArrowLeft = createIcon(ArrowLeftSrc, "ArrowLeft");
export const Send = createIcon(SendSrc, "Send");
export const History = createIcon(HistorySrc, "History");
export const Trophy = createIcon(TrophySrc, "Trophy");
export const Clock = createIcon(ClockSrc, "Clock");
export const FileQuestion = createIcon(QuizIcon, "FileQuestion");
export const Play = createIcon(PlaySrc, "Play");
export const Signal = createIcon(SignalSrc, "Signal");
export const AlertCircle = createIcon(AlertCircleSrc, "AlertCircle");
export const ArrowRight = createIcon(ArrowRightSrc, "ArrowRight");
export const ShieldCheck = createIcon(ShieldCheckSrc, "ShieldCheck");
export const CheckCircle2 = createIcon(CheckCircleSrc, "CheckCircle2");
export const ChevronDown = createIcon(ChevronDownSrc, "ChevronDown");
export const Timer = createIcon(TimerSrc, "Timer");
export const XCircle = createIcon(XCircleSrc, "XCircle");
export const MessageSquareLock = createIcon(MessageLockIcon, "MessageSquareLock");
export const Pause = createIcon(PauseSrc, "Pause");
export const X = createIcon(XSrc, "X");
export const ChevronUp = createIcon(ChevronUpSrc, "ChevronUp");
export const Check = createIcon(CheckSrc, "Check");
export const GripVertical = createIcon(GripVerticalSrc, "GripVertical");
export const Lightbulb = createIcon(LightbulbSrc, "Lightbulb");
export const Award = createIcon(Award01Icon, "Award");
export const Info = createIcon(InformationCircleIcon, "Info");
export const Phone = createIcon(Call02Icon, "Phone");
export const BadgeCheck = createIcon(BadgeCheckSrc, "BadgeCheck");
export const Building2 = createIcon(Building2Src, "Building2");
export const GraduationCap = createIcon(GraduationCapSrc, "GraduationCap");
export const MapPin = createIcon(MapPinSrc, "MapPin");
export const MousePointerClick = createIcon(MousePointerClickSrc, "MousePointerClick");
export const Link2 = createIcon(Link2Src, "Link2");
export const Inbox = createIcon(InboxSrc, "Inbox");
export const User = createIcon(UserSrc, "User");
export const CalendarDays = createIcon(CalendarDaysSrc, "CalendarDays");
export const ChevronLeft = createIcon(ChevronLeftSrc, "ChevronLeft");
export const LogOut = createIcon(LogOutSrc, "LogOut");
export const Percent = createIcon(PercentSrc, "Percent");
export const Target = createIcon(TargetSrc, "Target");
export const Trash2 = createIcon(Trash2Src, "Trash2");
export const Smartphone = createIcon(SmartPhone01Icon, "Smartphone");
export const Download = createIcon(Download04Icon, "Download");

/** Straight `>` chevron for list rows. Not the back-button icon. */
export function LineArrowRight({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M9 5l9 7-9 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** Larger straight `<` chevron for back — no shaft, bigger than the row arrow. */
export function BackArrow({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M15 5l-9 7 9 7"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
