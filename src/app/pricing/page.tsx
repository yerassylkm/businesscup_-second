import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { PricingView } from "@/features/billing/pricing";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <ClientOnly>
      <PricingView />
    </ClientOnly>
  );
}
