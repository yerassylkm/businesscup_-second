import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { AssessmentWizard } from "@/features/assessment/wizard";

export const metadata: Metadata = { title: "Free career check" };

export default function AssessmentPage() {
  return (
    <ClientOnly>
      <AssessmentWizard />
    </ClientOnly>
  );
}
