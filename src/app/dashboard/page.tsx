import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { Dashboard } from "@/features/dashboard/dashboard";

export const metadata: Metadata = { title: "My plan" };

export default function DashboardPage() {
  return (
    <ClientOnly>
      <Dashboard />
    </ClientOnly>
  );
}
