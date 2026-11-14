import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/client-only";
import { PathRoadmap } from "@/features/careers/path-roadmap";
import { PATH_BY_ID, PATH_IDS, isPathId } from "@/lib/data/paths";

export function generateStaticParams() {
  return PATH_IDS.map((pathId) => ({ pathId }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ pathId: string }> }): Promise<Metadata> {
  const { pathId } = await params;
  return { title: isPathId(pathId) ? `${PATH_BY_ID[pathId].name} path` : "Path" };
}

export default async function PathPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  if (!isPathId(pathId)) notFound();
  return (
    <ClientOnly>
      <PathRoadmap pathId={pathId} />
    </ClientOnly>
  );
}
