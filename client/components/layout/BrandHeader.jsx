import { BrandIcon } from "@/components/common/BrandIcon";
import { appConfig } from "@/config/app.config";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";

/**
 * G3Q mark left, title centered, matching-size slot on the right.
 * White bar on landing; `plain` sits on the aurora wash on Home / Profile.
 */
export function BrandHeader({ trailing = null, priority = false, plain = false }) {
  return (
    <header
      className={cn(
        "relative z-20 shrink-0 px-4 py-3",
        !plain && "bg-white shadow-[0_1px_0_rgb(15_23_42/0.08)]"
      )}
    >
      <div className="flex items-center gap-2">
        <BrandIcon
          src={BRAND_ICONS.logo}
          alt="G3Q 2.0"
          priority={priority}
          className="size-12 shrink-0"
        />
        <h1
          className={cn(
            "font-heading min-w-0 flex-1 text-center text-[1.7rem] leading-none font-bold tracking-tight",
            plain ? "text-white" : "text-primary-600"
          )}
        >
          {appConfig.name}
        </h1>
        {trailing ? (
          <div className="grid size-12 shrink-0 place-items-center">{trailing}</div>
        ) : (
          <span className="size-12 shrink-0" aria-hidden />
        )}
      </div>
    </header>
  );
}
