/**
 * Single-stage skill checks for the Adapt and Reinvent paths.
 * (The full baseline → lesson → transfer cycle is implemented for Pivot.)
 * Fictional content; correct answers are defined explicitly per item and the
 * scoring logic lives in lib/engine/exercises.ts.
 */

export const AI_DRAFT_REVIEW = {
  id: "ai-draft-review",
  title: "Review an AI-drafted reply before it reaches a customer",
  ticket: {
    from: "Dana M.",
    subject: "Charged twice + switch to monthly?",
    body: "Hi, I was charged twice for my annual plan renewal on Nov 3. I need the duplicate charge refunded. Also, can I switch to monthly billing instead?",
  },
  policy: [
    "Duplicate charges are refunded in full to the original payment method within 5–7 business days after the billing team confirms the duplicate.",
    "Agents must not say a refund has been issued before billing confirms. Say it has been submitted for review.",
    "Switching from annual to monthly billing takes effect at the next renewal date.",
    "There are no partial refunds for the remaining months of an annual term.",
  ],
  sentences: [
    { id: "s1", text: "Hi Dana, I'm sorry about the duplicate charge. That's frustrating, and thank you for flagging it.", isError: false, why: "Empathetic and accurate." },
    {
      id: "s2",
      text: "I've refunded the duplicate charge and you'll see it back on your card within 24 hours.",
      isError: true,
      why: "Promises a refund before billing confirms, and the timeframe is wrong (5–7 business days).",
    },
    {
      id: "s3",
      text: "I've also switched your account to monthly billing, effective today.",
      isError: true,
      why: "Policy says the switch takes effect at the next renewal date, not today.",
    },
    {
      id: "s4",
      text: "You'll receive a prorated refund for the unused part of your annual plan.",
      isError: true,
      why: "Invented policy: there are no partial refunds for an annual term. A classic confident AI mistake.",
    },
    { id: "s5", text: "Your reference number is #48213 if you need to follow up.", isError: false, why: "Useful and accurate." },
    { id: "s6", text: "Let me know if there's anything else I can help with!", isError: false, why: "Fine closing line." },
  ],
  decisionOptions: [
    { id: "send", label: "Send it as-is. The AI is usually right.", points: 0 },
    { id: "edit", label: "Fix the incorrect sentences, then send.", points: 20 },
    { id: "escalate", label: "Don't reply; escalate the whole ticket to billing.", points: 6 },
  ],
  replacementOptions: [
    {
      id: "r1",
      label:
        "I've submitted the duplicate charge to our billing team. Once they confirm it, the refund goes back to your original card within 5–7 business days.",
      points: 30,
    },
    { id: "r2", label: "Refunds usually take about 24 hours, so you should see it soon.", points: 0 },
    { id: "r3", label: "Unfortunately we're unable to refund duplicate charges.", points: 0 },
  ],
} as const;

export const OPS_VOLUME = {
  id: "ops-volume",
  title: "Find the process worth automating first",
  context:
    "You're helping your support operations lead decide where to invest. Here is one typical week of ticket data. 'Standard steps' is the share of tickets resolved by following the same documented steps.",
  categories: [
    { id: "password", name: "Password resets", weeklyVolume: 420, minutesPerTicket: 3, standardShare: 0.95 },
    { id: "order_status", name: "Order status questions", weeklyVolume: 300, minutesPerTicket: 5, standardShare: 0.9 },
    { id: "damage_claims", name: "Shipping damage claims", weeklyVolume: 150, minutesPerTicket: 14, standardShare: 0.8 },
    { id: "billing", name: "Billing disputes", weeklyVolume: 85, minutesPerTicket: 18, standardShare: 0.3 },
    { id: "integration", name: "Integration bugs", weeklyVolume: 60, minutesPerTicket: 35, standardShare: 0.1 },
    { id: "cancellations", name: "Account cancellations", weeklyVolume: 70, minutesPerTicket: 12, standardShare: 0.4 },
  ],
  metricOptions: [
    { id: "hours", label: "Agent hours spent on that category per week, before vs. after", points: 20 },
    { id: "csat_only", label: "Customer satisfaction (CSAT) only", points: 8 },
    { id: "ticket_count", label: "Total tickets across all categories", points: 0 },
    { id: "macros", label: "Number of macros created", points: 0 },
  ],
  caveatOptions: [
    { id: "measured", label: "Check whether the 'standard steps' share was measured or just guessed", points: 15 },
    { id: "popular", label: "Check which category agents enjoy least", points: 0 },
    { id: "none", label: "Nothing. The numbers are enough to decide.", points: 0 },
  ],
} as const;
