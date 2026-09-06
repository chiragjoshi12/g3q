import { DashboardClient } from "@/components/dashboard-client";
import { buildStateDashboard } from "@/lib/g3q-data";

export default function Home() {
  return <DashboardClient entity={buildStateDashboard()} />;
}
