import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { CareerProofPage } from "@/features/challenges/proof-page";

export const metadata: Metadata = { title: "Career Proof" };

export default function ProofPage() {
  return (
    <ClientOnly>
      <CareerProofPage />
    </ClientOnly>
  );
}
