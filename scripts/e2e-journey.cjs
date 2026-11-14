// End-to-end walk-through of the acceptance tests against a running server.
// Usage: npm run build && npm start, then: BASE=http://localhost:3000 node scripts/e2e-journey.cjs
// Requires Playwright with Chromium available (not a project dependency).
/* eslint-disable @typescript-eslint/no-require-imports -- plain Node script */
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3000";
const SHOTS = process.env.SHOTS || require("node:os").tmpdir();
const log = (...a) => console.log("•", ...a);
const errors = [];

async function overflow(page, label) {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o > 1) errors.push(`horizontal overflow ${o}px on ${label}`);
}

async function scoreText(page) {
  return (await page.locator("svg + div .font-display").first().textContent())?.trim();
}

async function fillPortfolio(page, { account, signals, risk, action, message }) {
  await page.getByRole("radio", { name: `Contact ${account} first` }).first().check({ force: true });
  for (const s of signals) await page.getByText(s, { exact: true }).click();
  await page.getByText(risk, { exact: true }).click();
  await page.getByText(action, { exact: true }).click();
  await page.locator("textarea").fill(message);
  await page.getByRole("button", { name: /Submit/ }).click();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

  // 1. Landing
  await page.goto(BASE + "/");
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.screenshot({ path: `${SHOTS}/01-landing.png` });
  await page.getByRole("tab", { name: "Reinvent" }).click();
  log("landing ok; preview tab switch:", await page.locator("#path-preview-panel .font-display").first().textContent());

  // 2. Sample journey
  await page.getByRole("button", { name: "Try a sample journey" }).click();
  await page.waitForURL("**/results");
  await page.getByText("Recommended for you").waitFor();
  const rec = await page.locator("text=Recommended for you >> xpath=following-sibling::p[1]").textContent();
  log("sample recommended:", rec);
  await page.screenshot({ path: `${SHOTS}/02-results.png`, fullPage: true });

  // 4. Path switch on results skill comparison changes gaps
  // Choose Pivot
  await page.getByRole("button", { name: /Choose Pivot/ }).click();
  await page.waitForURL("**/path/pivot");
  await page.getByText("Your 14-day plan").waitFor();
  const pivotItems = await page.locator("ol li p.font-semibold").allTextContents();
  log("pivot plan items:", pivotItems.length, pivotItems.slice(0, 4));
  await page.screenshot({ path: `${SHOTS}/03-path-pivot.png`, fullPage: true });
  await page.getByRole("link", { name: /^Reinvent/ }).click();
  await page.waitForURL("**/path/reinvent");
  await page.getByText("Your 14-day plan").waitFor();
  const reinventItems = await page.locator("ol li p.font-semibold").allTextContents();
  log("reinvent preview items:", reinventItems.slice(0, 4));
  if (JSON.stringify(pivotItems) === JSON.stringify(reinventItems)) errors.push("pivot and reinvent plans identical");
  await page.getByRole("link", { name: /^Pivot/ }).click();
  await page.waitForURL("**/path/pivot");

  // 5. Flagship challenge
  await page.getByRole("link", { name: /Start/ }).first().click();
  await page.waitForURL("**/challenge/cs-portfolio");
  await page.getByRole("button", { name: /Start the baseline/ }).click();
  // empty submit → inline errors
  await page.getByRole("button", { name: /Submit my decision/ }).click();
  await page.getByText("Pick the account you'd contact first.").waitFor();
  log("empty submit shows inline errors");
  await fillPortfolio(page, {
    account: "Pinecrest Logistics",
    signals: ["Has the most open tickets", "Recent ticket sentiment is negative"],
    risk: "Service frustration",
    action: "Offer a 20% discount if they renew early",
    message: "Hi, your renewal is coming up and we can offer a discount if you renew now.",
  });
  await page.getByText("Baseline · Portfolio A").waitFor();
  const base1 = await scoreText(page);
  log("baseline #1 (loud account, discount):", base1);
  await page.screenshot({ path: `${SHOTS}/04-baseline-score.png`, fullPage: true });

  // 6. Redo with a different choice → different score
  await page.getByRole("button", { name: /Redo the baseline/ }).click();
  await fillPortfolio(page, {
    account: "Lakeside Clinics",
    signals: ["Usage dropped 15% or more in 30 days", "Renewal is within 60 days", "Last NPS response was 6 or lower"],
    risk: "Adoption decline",
    action: "Run a usage review with the team and agree on a 30-day adoption plan (training, workflow setup)",
    message: "Hi Dana, I noticed usage on your team dropped this month. Could we book 20 minutes this week to review your goals and agree on a plan?",
  });
  await page.getByText("Baseline · Portfolio A").waitFor();
  const base2 = await scoreText(page);
  log("baseline #2 (2nd-priority account, adoption plan):", base2);
  if (base1 === base2) errors.push("baseline score did not change with different answers");

  // Lesson
  await page.getByRole("button", { name: /Start the micro-lesson/ }).click();
  await page.getByText("Quick check", { exact: true }).waitFor();
  await page.getByText("A rescue call with a discount offer").click();
  const disabled = await page.getByRole("button", { name: /Answer the quick check/ }).isDisabled();
  log("wrong quick-check keeps continue disabled:", disabled);
  await page.getByText("A routine renewal touchpoint, and maybe an expansion conversation").click();
  await page.screenshot({ path: `${SHOTS}/05-lesson.png`, fullPage: true });
  await page.getByRole("button", { name: /Start the new challenge/ }).click();

  // Transfer
  await page.getByText("New portfolio, same skill").waitFor();
  await fillPortfolio(page, {
    account: "Redwood Credit Union",
    signals: ["Usage dropped 15% or more in 30 days", "Recent ticket sentiment is negative", "Fewer than 60% of paid seats are active", "Last NPS response was 6 or lower", "One of the two largest contracts in the portfolio"],
    risk: "Adoption decline",
    action: "Run a usage review with the team and agree on a 30-day adoption plan (training, workflow setup)",
    message: "Hi Morgan, I noticed two branches stopped using scheduling and weekly usage dropped 35%. I'd like to make sure Fieldnote supports your goals. Could we book 30 minutes on Thursday to review and agree on a plan?",
  });
  await page.getByText("Before → After").waitFor();
  const headline = await page.locator("h2").first().textContent();
  log("comparison headline:", headline);
  await page.screenshot({ path: `${SHOTS}/06-comparison.png`, fullPage: true });

  // 7. Refresh persists
  await page.reload();
  await page.getByText("Before → After").waitFor();
  log("refresh keeps comparison");

  // Sprint is paywalled
  await page.goto(BASE + "/challenge/cs-sprint");
  await page.getByText("Included in PIVOTREADY Plus").waitFor();
  log("sprint paywalled for free user");

  // Dashboard + return loop
  await page.goto(BASE + "/dashboard");
  await page.getByText("Week 1 mission").waitFor();
  await page.screenshot({ path: `${SHOTS}/07-dashboard.png`, fullPage: true });
  await page.getByRole("button", { name: /Demo: advance to next week/ }).click();
  await page.getByText("Week 2 mission").waitFor();
  log("demo advance → week 2 mission shown; badge:", await page.getByText(/Demo time \+/).textContent());

  // 8. Pricing & preview
  await page.goto(BASE + "/pricing");
  await page.screenshot({ path: `${SHOTS}/08-pricing.png`, fullPage: true });
  await page.getByRole("button", { name: /Preview full program \(judge demo\)/ }).click();
  await page.getByText("DEMO PREVIEW", { exact: true }).waitFor();
  log("demo preview banner shown");
  await page.goto(BASE + "/challenge/cs-sprint");
  await page.getByText("1. Which account do you contact first?").waitFor();
  log("sprint unlocked in week 2 with preview");
  await page.goto(BASE + "/report");
  await page.getByRole("button", { name: /Print/ }).waitFor();
  log("report accessible with preview");
  await page.screenshot({ path: `${SHOTS}/09-report.png`, fullPage: true });

  // Adapt & reinvent exercises
  await page.goto(BASE + "/challenge/ai-draft-review");
  await page.getByText("I've refunded the duplicate charge", { exact: false }).click();
  await page.getByText("Fix the incorrect sentences, then send.").click();
  await page.getByText(/^I've submitted the duplicate charge/).click();
  await page.getByRole("button", { name: /Submit my review/ }).click();
  await page.getByText("Saved to your skill evidence").waitFor();
  log("ai draft review score:", await scoreText(page));
  await page.goto(BASE + "/challenge/ops-volume");
  await page.getByRole("radio", { name: "Automate Shipping damage claims first" }).check();
  await page.locator("#hours").fill("28");
  await page.getByText("Agent hours spent on that category per week, before vs. after").click();
  await page.getByText("Check whether the 'standard steps' share was measured or just guessed").click();
  await page.getByRole("button", { name: /Submit my analysis/ }).click();
  await page.getByText("Saved to your skill evidence").waitFor();
  log("ops score:", await scoreText(page));

  // 3. Custom answers produce different results
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  p2.on("pageerror", (e) => errors.push("pageerror(custom): " + e.message));
  await p2.goto(BASE + "/assessment");
  await p2.getByText("Another role").click();
  await p2.locator("#customRole").fill("asdfghjkl");
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByText("That doesn't look like a job title.").waitFor();
  await p2.locator("#customRole").fill("Help Desk Technician");
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByText("10+ years").click();
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByText(/Pick at least 3 tasks/).waitFor();
  await p2.getByText("Monitor queue, SLA or CSAT metrics").click();
  await p2.getByText("Spot recurring issues and report trends to product teams").click();
  await p2.locator("#customTask").fill("Build the weekly SLA dashboard in Excel");
  await p2.getByRole("button", { name: "Add custom task" }).click();
  await p2.locator("#customTask").fill("water the office plants");
  await p2.getByRole("button", { name: "Add custom task" }).click();
  await p2.screenshot({ path: `${SHOTS}/10-assessment-tasks.png`, fullPage: true });
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByText("I want to explore a different field").click();
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByRole("radiogroup", { name: "Data interpretation" }).getByRole("radio", { name: "Strong" }).click();
  await p2.getByRole("radiogroup", { name: "Process automation" }).getByRole("radio", { name: "Strong" }).click();
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.getByText("Reinvent", { exact: true }).click();
  await p2.getByRole("button", { name: "Continue" }).click();
  // refresh mid-way keeps the draft
  await p2.reload();
  await p2.getByText("How much time can you invest?").waitFor();
  log("assessment draft survives refresh at step 7");
  await p2.getByText("9+ hours / week").click();
  await p2.getByRole("button", { name: "See my career map" }).click();
  await p2.waitForURL("**/results");
  await p2.getByText("Recommended for you").waitFor();
  const rec2 = await p2.locator("text=Recommended for you >> xpath=following-sibling::p[1]").textContent();
  log("custom recommended:", rec2, "| sample was:", rec);
  if (rec2 === rec) errors.push("custom result same as sample");
  log("custom notice:", await p2.getByText("Limited analysis for custom roles").count());
  await p2.screenshot({ path: `${SHOTS}/11-results-custom.png`, fullPage: true });

  // 10. Mobile
  const m = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  const mp = await m.newPage();
  mp.on("pageerror", (e) => errors.push("pageerror(mobile): " + e.message));
  for (const [path, name] of [["/", "m-landing"], ["/assessment", "m-assessment"], ["/pricing", "m-pricing"], ["/method", "m-method"]]) {
    await mp.goto(BASE + path);
    await mp.waitForTimeout(400);
    await overflow(mp, path);
    await mp.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  }
  await mp.goto(BASE + "/");
  await mp.getByRole("button", { name: "Try a sample journey" }).click();
  await mp.waitForURL("**/results");
  await mp.getByText("Recommended for you").waitFor();
  await overflow(mp, "/results");
  await mp.screenshot({ path: `${SHOTS}/m-results.png`, fullPage: true });
  await mp.getByRole("button", { name: /Choose Pivot/ }).click();
  await mp.waitForURL("**/path/pivot");
  await overflow(mp, "/path/pivot");
  await mp.goto(BASE + "/challenge/cs-portfolio");
  await mp.getByRole("button", { name: /Start the baseline/ }).click();
  await mp.waitForTimeout(300);
  await overflow(mp, "/challenge baseline");
  await mp.screenshot({ path: `${SHOTS}/m-challenge.png`, fullPage: true });
  await mp.goto(BASE + "/dashboard");
  await mp.waitForTimeout(300);
  await overflow(mp, "/dashboard");
  await mp.screenshot({ path: `${SHOTS}/m-dashboard.png`, fullPage: true });
  await mp.getByRole("button", { name: "Open menu" }).click();
  await mp.getByRole("navigation", { name: "Mobile" }).waitFor();
  log("mobile menu opens");

  // Reset
  await mp.goto(BASE + "/dashboard#data");
  await mp.getByRole("button", { name: /Reset my demo data/ }).click();
  await mp.getByRole("button", { name: "Yes, reset" }).click();
  await mp.getByText("Your plan starts with a free career check").waitFor();
  log("reset works");

  await browser.close();
  console.log("\nERRORS:", errors.length ? errors : "none");
})().catch((e) => {
  console.error("FAILED:", e.message);
  console.log("ERRORS so far:", errors);
  process.exit(1);
});
