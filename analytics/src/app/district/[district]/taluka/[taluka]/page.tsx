import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { buildTalukaDashboard } from "@/lib/g3q-data";

export default async function TalukaPage({
  params,
}: {
  params: Promise<{ district: string; taluka: string }>;
}) {
  const { district, taluka } = await params;
  const entity = buildTalukaDashboard(district, taluka);

  if (!entity) {
    notFound();
  }

  return <DashboardClient entity={entity} />;
}
