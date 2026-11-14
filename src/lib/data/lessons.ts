/**
 * Micro-lesson for the flagship Pivot challenge (Customer Support → Customer
 * Success). Authored content; about 3 minutes of reading. The worked example
 * uses its own mini-portfolio so it does not give away the transfer scenario.
 */
export interface LessonSection {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
}

export interface QuickCheck {
  id: string;
  question: string;
  options: { id: string; label: string; correct: boolean; explanation: string }[];
}

export const CS_LESSON = {
  id: "cs-health-lesson",
  title: "Customer Success in 3 minutes: from reacting to anticipating",
  minutes: 3,
  sections: [
    {
      id: "proactive",
      title: "1. Support reacts. Success anticipates.",
      body: [
        "In support, work arrives as tickets. In customer success, the most important work never arrives: the account that quietly stops using the product rarely files a ticket before it cancels.",
        "That's why a quiet account can be riskier than a loud one. Your job is to read signals and act before the customer asks.",
      ],
    },
    {
      id: "signals",
      title: "2. Read five health signals together",
      body: [
        "No single number tells you an account is at risk. Look for several independent signals pointing the same way, then weigh them by how much is at stake (contract value).",
      ],
      bullets: [
        "Usage trend: a drop of 15% or more in 30 days is worth investigating; 30%+ is serious.",
        "Renewal timing: inside 60 days, you are running out of time to fix root causes.",
        "Sponsor change: if the person who bought the product leaves, nobody may defend the renewal.",
        "Sentiment: negative tickets and low NPS (0–6) show frustration, but volume alone is noise.",
        "Seat utilization: under 60% of paid seats active means the customer is paying for value it isn't getting.",
      ],
    },
    {
      id: "example",
      title: "3. Worked example",
      body: [
        "Account X: 25 open tickets, renewal in 9 months, usage stable. Account Y: 1 ticket, renewal in 7 weeks, usage down 35%, its champion just changed jobs, and it pays 3× more.",
        "Account X is louder. Account Y is in more danger: four independent signals plus higher stakes. Contact Y first; route X's tickets to support with an internal escalation.",
      ],
    },
    {
      id: "action",
      title: "4. Match the action to the root cause",
      body: ["A good save fixes the reason the customer might leave. Use this map:"],
      bullets: [
        "Adoption decline → usage review and a 30-day adoption plan with the team.",
        "Lost sponsor → find the new decision-maker and re-establish goals and a success plan.",
        "Service frustration → own the fix internally and give a concrete resolution timeline.",
        "Healthy and growing → only then talk about expansion.",
      ],
    },
    {
      id: "message",
      title: "5. Write the follow-up that gets a reply",
      body: [
        "Weak: \"Just checking in! Your renewal is coming up. Let me know if you want a discount to renew early.\"",
        "Strong: \"Hi Jordan, I noticed weekly logins on your team dropped by about a third this month. I'd like to make sure Taskloom still supports your goals for Q1. Could we take 20 minutes on Thursday to review how your team is using it and agree on a plan?\"",
        "The strong version cites evidence, connects to the customer's goals, proposes a specific short next step, and doesn't lead with price.",
      ],
    },
    {
      id: "mistakes",
      title: "6. Mistakes to avoid",
      bullets: [
        "Prioritizing whoever has the most tickets.",
        "Triaging only by renewal date. A healthy account renewing soon needs paperwork, not rescue.",
        "Leading with a discount. It trains customers to threaten churn and doesn't fix adoption.",
        "Sending 'just checking in' messages with no evidence and no next step.",
      ],
      body: [],
    },
  ] satisfies LessonSection[],
  quickCheck: {
    id: "qc-1",
    question:
      "An account renews in 3 weeks, usage is up 10%, NPS is 9 and the champion is active. What does it most likely need?",
    options: [
      {
        id: "rescue",
        label: "A rescue call with a discount offer",
        correct: false,
        explanation: "There's no risk signal here. A discount gives away value for nothing.",
      },
      {
        id: "routine",
        label: "A routine renewal touchpoint, and maybe an expansion conversation",
        correct: true,
        explanation: "Right. Renewal timing alone isn't risk. Healthy accounts need a smooth process.",
      },
      {
        id: "escalate",
        label: "An urgent executive escalation",
        correct: false,
        explanation: "Escalations are for real risk. Using them on healthy accounts wastes goodwill.",
      },
    ],
  } satisfies QuickCheck,
};
