import { z } from "zod";
import { assessmentSchema } from "@/features/assessment/schema";

/**
 * Versioned guest state persisted in localStorage.
 * Only raw inputs, choices, attempts and progress are stored. Results pages
 * are recomputed from these inputs by the engine every time.
 */
export const STORAGE_KEY = "shifto:state";
/** Keys used by earlier builds (product was renamed); migrated on first load. */
export const LEGACY_STORAGE_KEYS = ["pivotready:state"];
export const CURRENT_VERSION = 1;
export const MAX_EVENTS = 300;

export const EVENT_NAMES = [
  "landing_view",
  "assessment_started",
  "assessment_completed",
  "path_selected",
  "baseline_completed",
  "lesson_completed",
  "transfer_completed",
  "exercise_completed",
  "plan_item_completed",
  "paywall_viewed",
  "demo_plus_preview",
  "demo_week_advanced",
  "return_visit",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

const pathIdSchema = z.enum(["adapt", "pivot", "reinvent"]);

const planItemSchema = z.object({
  id: z.string(),
  day: z.number().int().min(1).max(14),
  week: z.union([z.literal(1), z.literal(2)]),
  kind: z.enum(["challenge", "module", "review", "sprint"]),
  title: z.string(),
  outcome: z.string(),
  minutes: z.number(),
  skill: z.string().optional(),
  moduleId: z.string().optional(),
  href: z.string().optional(),
  access: z.enum(["free", "blueprint", "plus"]),
});

const attemptSchema = z.object({
  id: z.string(),
  challengeId: z.string(),
  scenarioId: z.string(),
  stage: z.enum(["baseline", "transfer", "single"]),
  pathId: pathIdSchema,
  at: z.number(),
  total: z.number(),
  max: z.number(),
  dimensions: z.array(z.object({ id: z.string(), label: z.string(), points: z.number(), max: z.number() })),
  skillEvidence: z.record(z.string(), z.number()),
  answer: z.unknown(),
});

const eventSchema = z.object({
  name: z.enum(EVENT_NAMES),
  at: z.number(),
  props: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const appStateSchema = z.object({
  version: z.literal(CURRENT_VERSION),
  createdAt: z.number(),
  assessment: assessmentSchema.nullable().default(null),
  assessedAt: z.number().nullable().default(null),
  /** Unfinished assessment answers, saved as the user goes. */
  assessmentDraft: z
    .object({ step: z.number().int().min(0).max(20), values: z.record(z.string(), z.unknown()) })
    .nullable()
    .default(null),
  selectedPathId: pathIdSchema.nullable().default(null),
  plan: z
    .object({ pathId: pathIdSchema, generatedAt: z.number(), items: z.array(planItemSchema) })
    .nullable()
    .default(null),
  completedItems: z.record(z.string(), z.object({ at: z.number(), note: z.string().max(1000).optional() })).default({}),
  attempts: z.array(attemptSchema).default([]),
  lessonsCompleted: z.record(z.string(), z.number()).default({}),
  demoDayOffset: z.number().int().min(0).max(365).default(0),
  demoPreview: z.boolean().default(false),
  events: z.array(eventSchema).default([]),
  lastVisitAt: z.number().nullable().default(null),
});

export type AppState = z.infer<typeof appStateSchema>;
export type StoredEvent = z.infer<typeof eventSchema>;

export function defaultState(now = Date.now()): AppState {
  return appStateSchema.parse({ version: CURRENT_VERSION, createdAt: now });
}

/**
 * Turn whatever is in storage into a valid current-version state.
 *   - missing / unparsable / not an object → fresh state
 *   - version newer than this build        → fresh state (can't trust shape)
 *   - current version                      → validated; missing optional
 *                                            fields are filled with defaults;
 *                                            invalid data → fresh state
 * Future migrations (v1 → v2, ...) go in MIGRATIONS and run in order.
 */
const MIGRATIONS: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  // e.g. 1: (s) => ({ ...s, version: 2, newField: defaultValue }),
};

export function migrateState(raw: unknown, now = Date.now()): { state: AppState; reset: boolean } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { state: defaultState(now), reset: raw != null };
  let obj = raw as Record<string, unknown>;
  let version = typeof obj.version === "number" ? obj.version : NaN;
  if (!Number.isInteger(version) || version < 1 || version > CURRENT_VERSION) {
    return { state: defaultState(now), reset: true };
  }
  while (version < CURRENT_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return { state: defaultState(now), reset: true };
    obj = step(obj);
    version = obj.version as number;
  }
  const parsed = appStateSchema.safeParse(obj);
  if (!parsed.success) return { state: defaultState(now), reset: true };
  return { state: parsed.data, reset: false };
}

export function serializeState(state: AppState): string {
  return JSON.stringify(state);
}

export function deserializeState(text: string | null, now = Date.now()) {
  if (text == null) return { state: defaultState(now), reset: false };
  try {
    return migrateState(JSON.parse(text), now);
  } catch {
    return { state: defaultState(now), reset: true };
  }
}
