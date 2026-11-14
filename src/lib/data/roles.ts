import type { RoleDef } from "@/types";

/**
 * Role skill profiles (v1, Nov 2026).
 *
 * Rubric used to author these profiles:
 *   level      — the 0–4 level a solid entry-to-mid practitioner applies weekly.
 *   importance — 3 = core (the role fails without it), 2 = important,
 *                1 = nice to have.
 * These are PIVOTREADY editorial profiles written for planning, not an
 * official occupational standard. They are intentionally kept small so the
 * matching math stays explainable.
 */
export const ROLES: RoleDef[] = [
  {
    id: "customer_support_specialist",
    title: "Customer Support Specialist",
    summary: "Resolves customer questions and problems across chat, email and phone.",
    requirements: {
      customer_communication: { level: 3, importance: 3 },
      conflict_resolution: { level: 3, importance: 2 },
      crm_hygiene: { level: 2, importance: 2 },
      prioritization: { level: 2, importance: 2 },
      ai_output_verification: { level: 1, importance: 1 },
      data_interpretation: { level: 1, importance: 1 },
      stakeholder_communication: { level: 2, importance: 1 },
    },
  },
  {
    id: "ai_augmented_support_specialist",
    title: "AI-Augmented Support Specialist",
    summary:
      "Same profession, upgraded: owns complex cases, supervises AI-drafted answers and improves the workflows that automation runs on.",
    requirements: {
      customer_communication: { level: 3, importance: 3 },
      ai_output_verification: { level: 3, importance: 3 },
      conflict_resolution: { level: 3, importance: 2 },
      process_automation: { level: 2, importance: 2 },
      data_interpretation: { level: 2, importance: 2 },
      prioritization: { level: 3, importance: 2 },
      crm_hygiene: { level: 2, importance: 1 },
      stakeholder_communication: { level: 2, importance: 1 },
    },
  },
  {
    id: "customer_success_specialist",
    title: "Customer Success Specialist",
    summary:
      "Owns a portfolio of accounts after the sale: monitors health, drives adoption and prevents churn before customers ask for help.",
    requirements: {
      customer_health_analysis: { level: 3, importance: 3 },
      churn_prevention: { level: 3, importance: 3 },
      stakeholder_communication: { level: 3, importance: 3 },
      prioritization: { level: 3, importance: 2 },
      customer_communication: { level: 3, importance: 2 },
      data_interpretation: { level: 2, importance: 2 },
      crm_hygiene: { level: 2, importance: 2 },
      conflict_resolution: { level: 2, importance: 1 },
      ai_output_verification: { level: 1, importance: 1 },
    },
  },
  {
    id: "operations_coordinator",
    title: "Support Operations Coordinator",
    summary:
      "Keeps the support machine running: tooling, workflows, reporting and process changes. A common stepping stone toward analysis roles.",
    requirements: {
      process_automation: { level: 3, importance: 3 },
      data_interpretation: { level: 2, importance: 2 },
      crm_hygiene: { level: 3, importance: 2 },
      prioritization: { level: 3, importance: 2 },
      stakeholder_communication: { level: 3, importance: 2 },
      ai_output_verification: { level: 2, importance: 1 },
      customer_communication: { level: 2, importance: 1 },
    },
  },
  {
    id: "operations_analyst",
    title: "Operations Analyst (exploratory)",
    summary:
      "Analyzes operational data to find bottlenecks and quantify improvements. A bigger switch that usually needs a portfolio of analysis work.",
    requirements: {
      data_interpretation: { level: 4, importance: 3 },
      process_automation: { level: 3, importance: 3 },
      stakeholder_communication: { level: 3, importance: 2 },
      ai_output_verification: { level: 3, importance: 2 },
      prioritization: { level: 3, importance: 1 },
      crm_hygiene: { level: 2, importance: 1 },
      customer_health_analysis: { level: 2, importance: 1 },
    },
  },
];

export const ROLE_BY_ID: Record<string, RoleDef> = Object.fromEntries(ROLES.map((r) => [r.id, r]));
