import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { BlueprintReport } from "@/features/careers/report";

export const metadata: Metadata = { title: "Blueprint report" };

export default function ReportPage() {
  return (
    <ClientOnly>
      <BlueprintReport />
    </ClientOnly>
  );
}
