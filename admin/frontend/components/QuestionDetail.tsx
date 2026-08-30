import type { ReviewStatus } from "@/lib/api";

export function ReviewStatusBadge({
  status,
}: {
  status?: ReviewStatus | string | null;
}) {
  const value = (status || "PENDING").toUpperCase();
  const cls =
    value === "ACCEPTED"
      ? "status-badge accepted"
      : value === "REJECTED"
        ? "status-badge rejected"
        : "status-badge pending";
  return <span className={cls}>{value}</span>;
}
