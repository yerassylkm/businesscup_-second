import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { JourneyReport } from "@/features/careers/report";

export const metadata: Metadata = { title: "Skill Journey report" };

export default function ReportPage() {
  return (
    <ClientOnly>
      <JourneyReport />
    </ClientOnly>
  );
}
