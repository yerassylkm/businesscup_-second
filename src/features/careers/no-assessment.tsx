"use client";

import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { Button, ButtonLink, Card, Container } from "@/components/ui";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { saveAssessment } from "@/lib/storage/actions";
import { track } from "@/lib/storage/store";

export function NoAssessment({ title = "Start with your free career check" }: { title?: string }) {
  const router = useRouter();
  return (
    <Container className="py-20">
      <Card className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-muted">
          Answer 7 short questions (about 2 minutes) and we&apos;ll compute your task map, three career paths and a personal plan.
          Or load the fictional sample to see the full journey.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/assessment">Take the career check</ButtonLink>
          <Button
            variant="secondary"
            onClick={() => {
              track("assessment_started", { sample: true });
              saveAssessment(SAMPLE_ASSESSMENT);
              router.push("/results");
            }}
          >
            <PlayCircle className="size-4 text-lavender" aria-hidden /> Try a sample journey
          </Button>
        </div>
      </Card>
    </Container>
  );
}
