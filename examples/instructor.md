# Instructor Answer Key — Discussion Questions

Model answers to the per-chapter **Discussion Questions** in
`web-detective-workshop.pptx`. These are teaching notes for the facilitator —
there's rarely one "correct" answer, so use them to steer the conversation, not
to shut it down. Each chapter's hands-on **Workshop Tasks** are separate (see the
deck); this file covers the discussion slides only.

Chapter accent colors match the deck: Ch1 purple · Ch2 blue · Ch3 green ·
Ch4 orange · Ch4.1 amber · Ch5 mint · Ch6 purple · Ch7 blue.

---

## Chapter 1 — Foundations of Agentic Automation

**Q1. `await page.waitForTimeout(2000)` — what does it mask, and what should replace it?**
It masks *not knowing what you're actually waiting for*. A fixed sleep either
flakes (too short under load) or wastes time (too long), and hides the real
condition the test depends on. Replace it with Playwright's web-first
auto-waiting: `await expect(locator).toBeVisible()` / `toHaveURL(...)` /
`toBeEnabled()`, and `getByRole` / `getByLabel` locators that auto-wait for
actionability. You assert the *state*, not a duration.

**Q2. Which of observe / plan / act / verify / learn is absent from a traditional test, and why does it matter at scale?**
**`learn`** (and `observe` is only static — hard-coded selectors, no runtime
perception). A scripted test never adapts from what it saw, so every UI change
forces a manual edit. At scale, maintenance cost grows with *tests × UI churn*;
without a learn/heal phase there's no way to absorb change automatically.

**Q3. `submitCredentials` runs before `navigateToLogin` completes — what happens, and how does the task graph prevent it?**
You act on a form that hasn't rendered → element-not-found or an action on the
wrong page. The task graph prevents it with **preconditions**: `submitCredentials`
declares `navigateToLogin` as a dependency, so the DAG's topological ordering
won't schedule it until the precondition task has completed.

---

## Chapter 2 — Browser as Execution Layer

**Q1. `snapshot()` returns both the a11y tree and a screenshot — when is each needed?**
The **a11y tree** suffices for anything semantic: text, roles, form fields, table
cells, assertions on named elements — cheap and reliable. The **screenshot** is
needed only for visual-only concerns the tree can't express: layout/rendering
bugs, canvas/chart/image content, CSS visual state (color, overlap, z-index), or
elements lacking an accessible name. Vision costs more tokens — reach for it
deliberately.

**Q2. Is `retryDelayMs * attempt` true exponential back-off? What would genuine look like, and when prefer it?**
No — that's **linear** back-off (d, 2d, 3d…). Genuine exponential is
`retryDelayMs * 2^(attempt-1)` (d, 2d, 4d, 8d…). Prefer exponential — ideally
with jitter and a max-delay cap — when the failure is a contended or recovering
resource (server overload, rate limits): it backs off aggressively to let the
system recover and avoids a thundering-herd of synchronized retries.

**Q3. Two concrete ways an agent could use `durationMs`.**
(1) **Adaptive waits / anomaly detection** — learn typical action latency and flag
outliers (a click taking 10× normal signals a problem). (2) **Perf-regression
tracking / plan optimization** — mark slow steps as regressions, cache slow
navigations, or pick a cheaper strategy (a11y tree vs screenshot) to stay inside
a latency budget.

---

## Chapter 3 — Build Your Own MCP Server

**Q1. A single shared `AgentBrowserSession` across all tool calls — what breaks with two clients, and how do you fix it?**
Both clients drive **one browser/page**, so their actions interleave and corrupt
each other's state (client A navigates while B is mid-assertion). Fix with
**per-session isolation**: a session map keyed by connection/client id, each with
its own Playwright **browser context** (cheap, isolated) — or a context pool.

**Q2. For a products-table assertion (count rows, read cells), which is faster/cheaper — snapshot or screenshot?**
**`browser_snapshot` (a11y tree).** The row and cell data is already structured
text in the tree, so you parse it directly. A PNG forces the model to do
vision/OCR — many more tokens, slower, and unreliable for exact counts and values.

**Q3. `selector` is required for `browser_click`. What error does the server return if the LLM omits it, and where is that validated?**
A **schema-validation error** ("invalid params / missing required field
'selector'"), returned *before* the handler body runs. Validation happens in the
**MCP SDK / `registerTool` input-schema layer** (the zod/JSON-schema definition),
not inside the tool implementation.

---

## Chapter 4 — Self-Healing Selectors

**Q1. `heal()` promotes a new primary and demotes the old to fallbacks. When should the healer try fallbacks before calling the LLM?**
**Always try the stored fallbacks first.** They're free — no model call, no
latency, no cost — and historically known-good. Only when every fallback fails to
resolve do you spend an LLM call to generate new candidates. Cheap deterministic
path before the expensive probabilistic one.

**Q2. What makes a selector stable, and how could you score stability without running the tests?**
Stability tracks **semantic, intrinsic** attributes: role + accessible name,
label, `data-testid`, ARIA — things unlikely to change. Unstable: positional
CSS/XPath, `nth-child`, auto-generated hashed classes, easily-reworded text. Score
statically — reward `getByRole`/`getByLabel`/`testid`, penalize deep descendant
chains, indices, and hashed classes — a lint of the selector string, no run needed.

**Q3. At what `healCount` would you flag a locator for manual review instead of auto-healing again?**
A small threshold — **2–3**. Repeated healing means the element is genuinely
churning or the healer is chasing a moving target; auto-healing yet again risks
locking onto the wrong element. The repeated heal is a smell that wants a human.

---

## Chapter 4.1 — Playwright Agents (Planner · Generator · Healer)

**Q1. The Planner runs a seed test first — what does it bootstrap, and what happens without it?**
The seed test bootstraps **authenticated / storage state** (log in once, save the
session). Without it, navigating to `http://localhost:5173` lands on the **login
wall** — the Planner would only see and plan the login page, never the app behind
auth.

**Q2. Why is imperfect generation (leaving errors for the Healer) preferable to first-try-perfect generation?**
**Separation of concerns + speed.** The Generator lacks runtime feedback, so
demanding perfect output makes it slow and brittle. Emitting plausible-but-flawed
tests fast, then letting the **Healer** repair them against the *running* app
(which it can actually observe), is a more robust generate-then-repair loop — each
agent does the job it has the right information for.

**Q3. A button is renamed 'Submit' → 'Save' after generation. Ch4 SelfHealingAgent vs Ch4.1 TestHealerAgent — which, and why can't the other help?**
**Ch4 SelfHealingAgent.** It's a broken *selector*, and Ch4 heals individual
locator strings in the `LocatorStore`, so every test using that locator recovers
at once. Ch4.1's TestHealer rewrites whole failing *generated `test()` blocks* —
the wrong layer here; it can't repair a shared page-object selector.

---

## Chapter 5 — Custom AI Agent (Reasoning Loop)

**Q1. "Always call `snapshot()` first — never guess selectors." What does this guard against, and what would you see in the log if ignored?**
It guards against the LLM **hallucinating selectors** from memory/assumption that
don't exist in the current DOM. In the tool-call log you'd see a `click`/`fill`
targeting a selector with no grounding in any prior `snapshot()` — followed by an
element-not-found failure.

**Q2. `done()` is a regular tool, not a hard loop exit. What's the advantage, and what breaks if you replace it with a `return` inside `loop()`?**
As a tool, `done()` lets the model **explicitly signal completion** as a
deliberate, inspectable action that can carry a result/summary payload and be
verified before exit — and every tool flows through one dispatch path. A bare
`return` loses the final-answer/verification hook, makes the exit implicit and
harder to instrument, and special-cases the loop.

**Q3. Failure modes of a prompt-based JSON action protocol, and how to make the loop robust.**
Failure modes: malformed/invalid JSON, prose wrapped around the object,
`<think>…</think>` leakage (DeepSeek-R1), hallucinated tool names or wrong arg
shapes, multiple actions in one turn. Robustness: strip `<think>`, extract JSON
defensively (balanced-brace/regex), **validate against a schema and reprompt** on
failure, whitelist tool names, cap retries — exactly what
`examples/shared/ollama.ts` does.

---

## Chapter 6 — Creating Effective Testing Skills

**Q1. `/pw-debug` injects live test output via the shell before the LLM sees the prompt. Why does that beat pasting output manually?**
The skill injects **fresh, complete, correctly-formatted** output — exit codes,
full stack/trace — with no human truncation or staleness. The diagnosis is
grounded in the actual current run rather than a partial paste, so root-cause is
more reliable and reproducible.

**Q2. Security/correctness argument for limiting `/pw-new-test` to Read, Edit, Write, Bash.**
**Least privilege.** The skill only needs to read source, write specs/POMs, and
run tests; denying everything else prevents accidental or malicious side effects
(network exfiltration, editing unrelated files) and keeps behavior predictable and
auditable. A narrower toolset also keeps the agent on-task.

**Q3. A skill works without `argument-hint`. What's its purpose, and who benefits?**
It documents the expected argument (shown in the UI/autocomplete). It's a
**UX/discoverability aid for the human invoker** — and teammates reading the
skill — not a functional requirement; the skill still runs without it.

---

## Chapter 7 — Agent & CI/CD Pipeline

**Q1. The agentic matrix uses `fail-fast: false`. When would you switch to `true`, and at what cost?**
Switch to `true` to abort the whole matrix on the first failure — saving runner
minutes and giving a fast signal — when the jobs are redundant or you only care
*that* something broke. Cost: you **lose visibility** into whether the other
scenarios also fail; a single flake cancels the rest, so you can't see the full
picture in one run. Independent, occasionally-flaky agent scenarios usually want
`false`.

**Q2. Reporter emits `::error` (critical) and `::warning` (non-critical). Why is `::notice` a poor choice for a broken selector?**
`::notice` renders as informational and is easy to miss — it under-signals
severity. A broken selector is an actionable defect: `::warning` (non-critical) or
`::error` (critical, blocks) makes it stand out inline in the PR diff and signals
it must be fixed.

**Q3. Agentic matrix on `main` only, standard tests on every push/PR — what's the tradeoff, and what's a middle ground?**
Agents are slow, costly, and nondeterministic, so main-only keeps PR CI fast and
cheap — but you get **late feedback**: agentic regressions surface after merge,
not on the PR. Middle ground: run agents on **PRs targeting `main` only** (not
every push), or a **critical-only subset** on PRs with the full suite on `main`,
or a nightly scheduled full run.
