import { AbhiyanScreen } from "@/components/abhiyan/AbhiyanScreen";
import { ABHIYAN } from "@/data/abhiyan";

export const metadata = {
  title: `G3Q 2026 અભિયાન · ${ABHIYAN.title}`,
  description: ABHIYAN.purpose,
};

export default function AbhiyanPage() {
  return <AbhiyanScreen />;
}
