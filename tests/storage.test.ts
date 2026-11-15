import { describe, expect, it } from "vitest";
import { SAMPLE_ASSESSMENT } from "@/lib/data/presets";
import { CURRENT_VERSION, defaultState, deserializeState, migrateState, serializeState } from "@/lib/storage/schema";

describe("storage serialization & migration", () => {
  it("round-trips a full state", () => {
    const s = { ...defaultState(1000), assessment: SAMPLE_ASSESSMENT, selectedPathId: "pivot" as const, demoPreview: true };
    const { state, reset } = deserializeState(serializeState(s));
    expect(reset).toBe(false);
    expect(state).toEqual(s);
  });

  it("returns a fresh state when nothing is stored", () => {
    const { state, reset } = deserializeState(null, 5);
    expect(reset).toBe(false);
    expect(state.createdAt).toBe(5);
    expect(state.assessment).toBeNull();
  });

  it("recovers from corrupted JSON", () => {
    const { state, reset } = deserializeState("{not json", 7);
    expect(reset).toBe(true);
    expect(state.version).toBe(CURRENT_VERSION);
  });

  it("fills defaults for fields missing from an older save of the same version", () => {
    const { state, reset } = migrateState({ version: 1, createdAt: 42 });
    expect(reset).toBe(false);
    expect(state.attempts).toEqual([]);
    expect(state.demoDayOffset).toBe(0);
  });

  it("does not trust data from an unknown future version", () => {
    const { reset } = migrateState({ version: CURRENT_VERSION + 1, createdAt: 1 });
    expect(reset).toBe(true);
  });

  it("rejects invalid assessment data instead of crashing", () => {
    const { state, reset } = migrateState({ version: 1, createdAt: 1, assessment: { roleChoice: "x" } });
    expect(reset).toBe(true);
    expect(state.assessment).toBeNull();
  });

  it("migrates plans saved with the old 'blueprint' tier name to 'journey'", () => {
    const item = { id: "x", day: 2, week: 1, kind: "module", title: "t", outcome: "o", minutes: 30, access: "blueprint" };
    const { state, reset } = migrateState({ version: 1, createdAt: 1, plan: { pathId: "pivot", generatedAt: 1, items: [item] } });
    expect(reset).toBe(false);
    expect(state.plan!.items[0].access).toBe("journey");
  });
});
