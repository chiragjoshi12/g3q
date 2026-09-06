import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { buildDistrictDashboard } from "@/lib/g3q-data";

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ district: string }>;
}) {
  const { district } = await params;
  const entity = buildDistrictDashboard(district);

  if (!entity) {
    notFound();
  }

  return <DashboardClient entity={entity} />;
}
