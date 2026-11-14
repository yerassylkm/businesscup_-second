import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { ResultsView } from "@/features/careers/results-view";

export const metadata: Metadata = { title: "Your career map" };

export default function ResultsPage() {
  return (
    <ClientOnly>
      <ResultsView />
    </ClientOnly>
  );
}
