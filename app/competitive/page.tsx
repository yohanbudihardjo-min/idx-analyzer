import { getAllCompetitiveData } from "@/lib/sectors";
import { CompetitiveClient } from "./competitive-client";

export const metadata = { title: "Bain Competitive Analysis | IDX Analyzer" };

export default async function CompetitivePage() {
  const sectors = await getAllCompetitiveData();
  return <CompetitiveClient sectors={sectors} />;
}
