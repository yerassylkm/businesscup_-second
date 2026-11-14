import { describe, expect, it } from "vitest";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { RADAR_BY_PATH, RADAR_SIGNALS } from "@/lib/data/radar";
import { ROLE_BY_ID } from "@/lib/data/roles";
import { evaluatePath } from "@/lib/engine/paths";
import { computeSkillProfile } from "@/lib/engine/profile";
import { buildRadar } from "@/lib/engine/radar";
import type { PathId } from "@/types";

const PATHS: PathId[] = ["adapt", "pivot", "reinvent"];
// Real routes in the app that radar CTAs may point to.
const ROUTES = /^\/(challenge\/(cs-portfolio|cs-sprint|ai-draft-review|ops-volume)|path\/(adapt|pivot|reinvent))$/;

function radarFor(pathId: PathId, input = SAMPLE_ASSESSMENT) {
  const ev = evaluatePath(input, computeSkillProfile(input), pathId);
  return { ev, items: buildRadar(pathId, ev, Object.keys(ROLE_BY_ID[ev.roleId].requirements)) };
}

describe("Career Radar data", () => {
  it("has only editorial statements: no numbers, percentages or currency", () => {
    for (const s of Object.values(RADAR_SIGNALS)) {
      for (const text of [s.title, s.whatsChanging, s.whatItMeans]) {
        expect(text, `${s.id}: "${text}"`).not.toMatch(/[0-9%$]/);
      }
      expect(s.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("lists 4–5 known signals per path", () => {
    for (const p of PATHS) {
      expect(RADAR_BY_PATH[p].length).toBeGreaterThanOrEqual(4);
      expect(RADAR_BY_PATH[p].length).toBeLessThanOrEqual(5);
      for (const id of RADAR_BY_PATH[p]) expect(RADAR_SIGNALS[id]).toBeDefined();
    }
  });
});

describe("buildRadar", () => {
  it("gives free users one signal and puts the rest behind Plus", () => {
    for (const p of PATHS) {
      const { items } = radarFor(p);
      expect(items[0].access).toBe("free");
      expect(items.slice(1).every((i) => i.access === "plus")).toBe(true);
    }
  });

  it("resolves every CTA to a real page, with the user's path filled in", () => {
    for (const p of PATHS) {
      for (const i of radarFor(p).items) {
        expect(i.ctaHref).toMatch(ROUTES);
        expect(i.ctaHref).not.toContain("{path}");
      }
    }
    expect(radarFor("adapt").items.find((i) => i.cta.href.includes("{path}"))!.ctaHref).toBe("/path/adapt");
  });

  it("links each signal to the user's computed gap for that skill", () => {
    const { ev, items } = radarFor("pivot");
    for (const i of items) {
      const gap = ev.gaps.find((g) => g.skill === i.skill);
      if (gap) expect(i.planLink).toEqual({ kind: "gap", current: gap.current, required: gap.required, gap: gap.gap });
      else expect(i.planLink.kind).not.toBe("gap");
    }
  });

  it("changes with the user's skills", () => {
    const strong = { ...SAMPLE_ASSESSMENT, selfSkills: { ...SAMPLE_ASSESSMENT.selfSkills, customer_health_analysis: 4 } };
    const before = radarFor("pivot").items.find((i) => i.skill === "customer_health_analysis")!.planLink;
    const after = radarFor("pivot", strong).items.find((i) => i.skill === "customer_health_analysis")!.planLink;
    expect(before.kind).toBe("gap");
    expect(after).not.toEqual(before);
  });
});
