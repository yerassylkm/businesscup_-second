import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientOnly } from "@/components/client-only";
import { CustomerSuccessChallenge } from "@/features/challenges/cs-challenge";
import { DraftReviewChallenge, OpsChallenge, SprintChallenge } from "@/features/challenges/other-challenges";

const CHALLENGES = {
  "cs-portfolio": { title: "Customer Success challenge", Component: CustomerSuccessChallenge },
  "cs-sprint": { title: "Week 2 Skill Sprint", Component: SprintChallenge },
  "ai-draft-review": { title: "AI draft review", Component: DraftReviewChallenge },
  "ops-volume": { title: "Ops analysis challenge", Component: OpsChallenge },
} as const;
type ChallengeId = keyof typeof CHALLENGES;

const isChallengeId = (id: string): id is ChallengeId => id in CHALLENGES;

export function generateStaticParams() {
  return Object.keys(CHALLENGES).map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: isChallengeId(id) ? CHALLENGES[id].title : "Challenge" };
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isChallengeId(id)) notFound();
  const { Component } = CHALLENGES[id];
  return (
    <ClientOnly>
      <Component />
    </ClientOnly>
  );
}
