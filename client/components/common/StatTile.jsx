import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary-50 text-primary-800",
  success: "bg-success/10 text-success",
  error: "bg-error/10 text-error",
  warning: "bg-warning/10 text-[#8a5a04]",
  neutral: "bg-muted text-foreground",
  saffron: "bg-saffron/15 text-[#9a4f00]",
};

export function StatTile({ icon: Icon, label, value, tone = "neutral", className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl px-3 py-3 text-center sm:px-4 sm:py-4",
        TONES[tone] ?? TONES.neutral,
        className
      )}
    >
      {Icon ? <Icon className="mx-auto size-4 opacity-80" /> : null}
      <span className="font-heading text-lg leading-none font-bold">{value}</span>
      <span className="text-[11px] leading-tight opacity-80">{label}</span>
    </div>
  );
}
