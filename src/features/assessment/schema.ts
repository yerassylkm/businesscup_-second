import { z } from "zod";
import { SKILL_IDS } from "@/lib/data/skills";
import { TASK_BY_ID } from "@/lib/data/tasks";
import type { AssessmentInput, SkillId } from "@/types";

/**
 * Validation for assessment answers. Used on every step of the form and again
 * before results are computed (and when loading saved state), so malformed
 * data never reaches the engine.
 */

const letters = /[a-z]/gi;

/** Reject empty, too-short, keyboard-mash or symbol-only free text. */
export function customTextProblem(raw: string, { min = 4, max = 120 } = {}): string | null {
  const text = raw.trim();
  if (text.length < min) return `Please write at least ${min} characters.`;
  if (text.length > max) return `Please keep it under ${max} characters.`;
  const letterCount = (text.match(letters) ?? []).length;
  if (letterCount < Math.ceil(text.length * 0.5)) return "Please describe it in words.";
  if (/(.)\1{4,}/i.test(text)) return "That doesn't look like a real description.";
  const words = text.split(/\s+/).filter((w) => /[a-z]{2,}/i.test(w));
  if (words.length < 2) return "Use at least two words, e.g. \"process refund requests\".";
  // Long runs of consonants usually mean keyboard mashing ("asdfghjkl").
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(text)) return "That doesn't look like a real description.";
  return null;
}

const customText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      const problem = customTextProblem(val, { min, max });
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    });

const skillLevel = z.number().int().min(0).max(4);

export const selfSkillsSchema = z.object(
  Object.fromEntries(SKILL_IDS.map((id) => [id, skillLevel])) as Record<SkillId, typeof skillLevel>,
);

export const assessmentSchema = z
  .object({
    roleChoice: z.enum(["customer_support_specialist", "custom"]),
    customRoleTitle: z.string().trim().optional(),
    experience: z.enum(["lt2", "2to5", "5to10", "10plus"]),
    taskIds: z.array(z.string()).refine((ids) => ids.every((id) => id in TASK_BY_ID), "Unknown task selected."),
    customTasks: z.array(customText(4, 120)).max(3, "Add up to 3 custom tasks."),
    concern: z.enum(["ai_changing_tasks", "skills_outdated", "adjacent_move", "new_field"]),
    selfSkills: selfSkillsSchema,
    goal: z.enum(["adapt", "pivot", "reinvent", "help_me_choose"]),
    weeklyTime: z.enum(["1to2", "3to5", "6to8", "9plus"]),
    budget: z.enum(["none", "under25", "under50", "over50", "unsure"]).optional(),
    incomePreference: z.enum(["keep_level", "open_to_dip", "prefer_not"]).optional(),
    isSample: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.roleChoice === "custom") {
      const problem = customTextProblem(val.customRoleTitle ?? "", { min: 3, max: 60 });
      if (problem) {
        // Single-word job titles ("Cashier") are fine; only enforce the other checks.
        const t = (val.customRoleTitle ?? "").trim();
        const singleWordOk = /^[a-z][a-z\s\-/&]{2,59}$/i.test(t) && !/[bcdfghjklmnpqrstvwxz]{6,}/i.test(t);
        if (!singleWordOk) ctx.addIssue({ code: "custom", path: ["customRoleTitle"], message: "Please enter your job title, e.g. \"Help Desk Technician\"." });
      }
    }
    if (val.taskIds.length + val.customTasks.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["taskIds"],
        message: "Pick at least 3 tasks you actually do in a typical week (custom tasks count).",
      });
    }
  });

export type AssessmentSchema = z.infer<typeof assessmentSchema>;

export function validateAssessment(input: unknown):
  | { ok: true; data: AssessmentInput }
  | { ok: false; errors: Record<string, string> } {
  const parsed = assessmentSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data as AssessmentInput };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.join(".") || "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
