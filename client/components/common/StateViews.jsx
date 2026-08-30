import { AlertCircle, Inbox, Loader2 } from "@/components/icons";

import { cn } from "@/lib/utils";

export function LoadingState({ label = "લોડ થઈ રહ્યું છે…", className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary-600" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-error/10">
        <AlertCircle className="size-6 text-error" />
      </div>
      <p className="max-w-[16rem] text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
        >
          ફરી પ્રયાસ કરો
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-14 text-center",
        className
      )}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-heading text-base font-semibold">{title}</p>
      {description ? (
        <p className="max-w-[18rem] text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
