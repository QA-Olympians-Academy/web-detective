# Workshop Solutions Reference

Worked solutions for every hands-on task in each chapter.
Use this as a reference after attempting the tasks yourself.

> **Local LLM setup.** Every LLM-backed chapter (Ch4, Ch4.1, Ch5, Ch7) now talks
> to a model running locally through **Ollama** — no API key, no per-token cost.
> The default model is **DeepSeek-R1** (`deepseek-r1:8b`); override it per run with
> `WORKSHOP_MODEL` (e.g. `WORKSHOP_MODEL=qwen2.5-coder:7b`). Before running any of
> those examples you need a local Ollama server with the model pulled:
> `ollama pull deepseek-r1:8b` then `ollama serve` (see `setup/local-llm-setup.md`).
> DeepSeek-R1 is a reasoning model that emits `<think>…</think>` chain-of-thought;
> the shared client (`examples/shared/ollama.ts`) strips it automatically and
> exposes `chat()`, `complete()`, `extractJson()`, and `checkOllama()`.
> All examples run with `npx tsx`.

---

## Chapter 1 — Foundations of Agentic Automation

### Task 1 — Fix `brittle-test.spec.ts`

Replace every anti-pattern with ARIA-first Playwright APIs.

```typescript
// examples/ch1-foundations/brittle-test.spec.ts  — FIXED VERSION
import { test, expect } from '@playwright/test'

test('login with valid credentials', async ({ page }) => {
  await page.goto('http://localhost:5173/login')

  // ✓ ARIA label instead of structural CSS
  await page.getByLabel('Email address').fill('admin@shop.com')
  await page.getByLabel('Password').fill('password123')

  // ✓ Role + accessible name instead of CSS class
  await page.getByRole('button', { name: 'Sign In' }).click()

  // ✓ waitFor instead of waitForTimeout
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor()
  await expect(page).toHaveURL(/\/dashboard/)
})

test('shows error for wrong password', async ({ page }) => {
  await page.goto('http://localhost:5173/login')
  await page.getByLabel('Email address').fill('admin@shop.com')
  await page.getByLabel('Password').fill('wrongpassword')
  await page.getByRole('button', { name: 'Sign In' }).click()

  // ✓ getByText instead of $eval on a CSS class
  await expect(page.getByText('Invalid credentials')).toBeVisible()
})
```

### Task 2 — Add `logoutTask` to the task graph

```typescript
// examples/ch1-foundations/task-graph.ts  — add to loginTaskGraph
{
  id: 'logoutTask',
  goal: 'Click the Logout button and verify the session is cleared',
  preconditions: ['verifyDashboardLoaded'],
  action: async (page) => {
    await page.getByRole('button', { name: 'Logout' }).click()
  },
  verify: async (page) => {
    await page.getByRole('heading', { name: 'Sign In' }).waitFor()
    return page.url().includes('/login')
  },
  onFailure: 'stop',
},
```

### Task 3 — Extend `ActionType` with `hover` and `wait_for_selector`

```typescript
// In task-graph.ts, extend the ActionType union:
export type ActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'assert'
  | 'hover'             // ← new
  | 'wait_for_selector' // ← new

// Example task using hover:
{
  id: 'hoverNavMenu',
  goal: 'Hover over the Products nav item to reveal a sub-menu',
  preconditions: ['verifyDashboardLoaded'],
  action: async (page) => {
    await page.getByRole('link', { name: 'Products' }).hover()
    // wait for any dropdown to appear
    await page.locator('[data-nav-dropdown]').waitFor({ state: 'visible' })
  },
  verify: async (page) => {
    return page.locator('[data-nav-dropdown]').isVisible()
  },
}
```

---

## Chapter 2 — Browser as Execution Layer

### Task 1 — Add `hover()` to `ActionWrapper`

```typescript
// examples/ch2-execution-layer/action-wrapper.ts
async hover(selector: string, description: string): Promise<ActionResult> {
  const start = Date.now()
  try {
    await this.page.locator(selector).hover({ timeout: 5000 })
    const result: ActionResult = {
      ok: true,
      action: 'hover',
      selector,
      description,
      durationMs: Date.now() - start,
    }
    this.log.push(result)
    return result
  } catch (error) {
    const result: ActionResult = {
      ok: false,
      action: 'hover',
      selector,
      description,
      durationMs: Date.now() - start,
      error: String(error),
    }
    this.log.push(result)
    return result
  }
}
```

### Task 2 — Extend `navigateWithRetry` with error type distinction

```typescript
// examples/ch2-execution-layer/browser-session.ts
async navigateWithRetry(url: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10_000 })
      return
    } catch (err) {
      const message = String(err)

      // Distinguish error types for LLM reasoning context
      if (message.includes('net::ERR') || message.includes('ECONNREFUSED')) {
        this.errorEvents.push({ type: 'navigate_network_error', url, attempt, message })
      } else if (message.includes('Timeout') || message.includes('timeout')) {
        this.errorEvents.push({ type: 'navigate_timeout', url, attempt, message })
      } else {
        this.errorEvents.push({ type: 'navigate_unknown_error', url, attempt, message })
      }

      if (attempt === maxRetries) throw err

      // Exponential back-off with 10 s cap
      const delay = Math.min(this.retryDelayMs * 2 ** (attempt - 1), 10_000)
      await new Promise(r => setTimeout(r, delay))
    }
  }
}
```

---

## Chapter 3 — Build Your Own MCP Server

### Task A — Add `browser_evaluate` tool

```typescript
// examples/ch3-mcp/server.ts — add to the tool list

server.tool(
  'browser_evaluate',
  {
    description: 'Run a JavaScript expression in the page context and return the result.',
    inputSchema: z.object({
      script: z.string().describe('JavaScript expression to evaluate'),
    }),
  },
  async ({ script }) => {
    const result = await page.evaluate(script)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }
)
```

### Task B — Token comparison: snapshot vs vision

Run both and compare the token counts (observational — no code change):

```
Snapshot (ariaSnapshot):   ~800–1 500 input tokens
Vision  (screenshot PNG):  ~3 000–8 000 input tokens

For a products-table row count:
  Snapshot wins — the a11y tree exposes row count directly as text.
  Vision is needed only for chart/canvas assertions on /dashboard.
```

### Task C — Catch a silent JS error via `browser_get_console_logs`

```tsx
// src/pages/Dashboard.tsx — add to a useEffect
useEffect(() => {
  console.error('chart render failed')
}, [])
```

Then prompt the agent:
```
Navigate to the dashboard and check for any console errors.
```
The agent will call `browser_get_console_logs` and surface the error without a test assertion.

---

## Chapter 4 — Self-Healing Selectors

> Requires a local Ollama server with `deepseek-r1:8b` pulled (see
> `setup/local-llm-setup.md`) — no API key. The healer calls `complete()` +
> `extractJson()` from `../shared/ollama` to rank replacement selectors.

### Task A — Add `confidence` field to `LocatorEntry`

```typescript
// examples/ch4-self-healing/locator-store.ts

export interface LocatorEntry {
  key:          string
  selector:     string
  fallbacks:    string[]
  healCount:    number
  confidence:   number   // ← new: 1.0 = verified, decreases on each heal
  lastVerified: string
  lastHealed?:  string
}

// In register():
this.store.set(key, {
  key, selector, fallbacks: [], healCount: 0,
  confidence: 1.0,    // ← start at full confidence
  lastVerified: new Date().toISOString(),
})

// In heal():
entry.confidence = Math.max(0, entry.confidence - 0.2)   // ← decrease on heal
entry.healCount += 1

// In printReport():
console.log(
  `  ${entry.key.padEnd(30)} ${entry.selector.padEnd(50)} ` +
  `heals=${entry.healCount}  confidence=${entry.confidence.toFixed(1)}` +
  (entry.healCount >= 2 ? '  ⚠ NEEDS REVIEW' : '')
)
```

### Task B — Rename CSS class and trigger healing

```bash
# 1. In src/pages/Login.tsx rename className="login-card" → "auth-card"
# 2. npm run build  (or keep dev server running)
# 3. Make sure Ollama is running with deepseek-r1:8b pulled (no API key needed).
# 4. Run the healer — the constructor takes only the store:
npx tsx -e "
import { chromium } from 'playwright'
import { LocatorStore, WEB_DETECTIVE_LOCATORS } from './examples/ch4-self-healing/locator-store.ts'
import { SelfHealingAgent } from './examples/ch4-self-healing/self-healer.ts'

const store = new LocatorStore('./locator-memory.json')
for (const [k, v] of WEB_DETECTIVE_LOCATORS) store.register(k, v)

const browser = await chromium.launch({ headless: true })
const page = await (await browser.newContext()).newPage()
await page.goto('http://localhost:5173/login')

const healer = new SelfHealingAgent(store)
const selector = await healer.findElement(page, 'login.emailInput')
console.log('Healed to:', selector)   // expect ARIA-based replacement
store.printReport()
await browser.close()
"
```

The healer snapshots the DOM (`ariaSnapshot`), asks the local model (DeepSeek-R1
via Ollama) for 3–5 ranked candidates, validates each with `isVisible()`, and
persists the first working one.

Expected healed selector: `getByLabel('Email address')` or `input[type='email']` — **not** `.auth-card input`.

### Task C — Extend `printReport` with NEEDS REVIEW

```typescript
printReport(): void {
  console.log('\n── LocatorStore report ──────────────────────────────')
  for (const entry of this.store.values()) {
    const needsReview = entry.healCount >= 2 ? '  ⚠  NEEDS REVIEW' : ''
    console.log(
      `  ${entry.key.padEnd(30)} heals=${entry.healCount}` +
      `  selector=${entry.selector}` + needsReview
    )
  }
  console.log('─────────────────────────────────────────────────────\n')
}
```

### Task D — Add `toCsv()` method

```typescript
// examples/ch4-self-healing/locator-store.ts
toCsv(): string {
  const header = 'key,selector,healCount,lastVerified'
  const rows = [...this.store.values()].map(e =>
    [e.key, `"${e.selector}"`, e.healCount, e.lastVerified].join(',')
  )
  return [header, ...rows].join('\n')
}

// Usage:
// import * as fs from 'fs'
// fs.writeFileSync('locators.csv', store.toCsv())
```

---

## Chapter 4.1 — Playwright Agents: Planner, Generator, Healer

> Requires a local Ollama server with `deepseek-r1:8b` pulled (see
> `setup/local-llm-setup.md`) — no API key. The Planner, Generator, and Healer
> all use `complete()` from `../shared/ollama`. Their constructors take no
> arguments: `new TestPlannerAgent()`, `new TestGeneratorAgent()`,
> `new TestHealerAgent()`.

### Task A — Run the full pipeline

```bash
npm run dev &
# Ollama running with deepseek-r1:8b pulled (no API key).
npx tsx examples/ch4.1-playwright-agents/planner.ts
# Outputs: specs/web-detective.md  +  tests/generated/web-detective.spec.ts
npx playwright test tests/generated/web-detective.spec.ts
```

### Task B — Break a test and heal it

```typescript
// In tests/generated/web-detective.spec.ts, change one selector:
// BEFORE:
await page.getByRole('button', { name: 'Sign In' }).click()
// AFTER (broken):
await page.locator('.gone-selector').click()
```

```bash
# Run the healer — observe the multi-round repair loop
npx tsx examples/ch4.1-playwright-agents/healer.ts
```

The healer extracts the failing `test()` block, sends it to the local model
(DeepSeek-R1 via Ollama) together with the live `ariaSnapshot`, receives a
patched block (with `<think>…</think>` stripped by the shared client), writes it
back, and re-runs. Watch the console for the `── Heal round 1/3 ──` /
`── Heal round 2/3 ──` … log lines.

### Task C — Compare Ch4 vs Ch4.1 healing

```
CH4 SelfHealingAgent:
  ✓ Targets one selector string  →  surgical, low blast radius
  ✓ Persists to locatorStore     →  fix survives the next run
  ✗ Can't fix multi-step logic errors in test blocks

CH4.1 TestHealerAgent:
  ✓ Rewrites the whole test()    →  fixes selector + logic errors together
  ✓ Zero setup, works on any .spec.ts
  ✗ Rewrites more code           →  larger diff to review
  ✗ Does not update locatorStore →  re-heals from scratch next time

Rule of thumb:
  Use Ch4 for stable page-object selectors.
  Use Ch4.1 for freshly generated or migrated test files.
```

### Task D — Guard against infinite heal loops

```typescript
// examples/ch4.1-playwright-agents/healer.ts — track seen errors in heal()
// (MAX_ROUNDS is a module-level const; heal() returns HealRound[])
async heal(testFile: string, baseUrl: string): Promise<HealRound[]> {
  const rounds: HealRound[] = []
  const seenErrors = new Set<string>()

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const { passed, failures } = this.runTests(testFile)
    if (passed) {
      rounds.push({ round, failures: [], patched: [], allPassed: true })
      break
    }

    // Guard: if this round's errors are identical to a previous round, stop —
    // the model is not making progress and we'd loop forever.
    const errorKey = failures.map(f => f.error).sort().join('|')
    if (seenErrors.has(errorKey)) {
      console.warn(`[healer] identical error on round ${round} — stopping to prevent loop`)
      break
    }
    seenErrors.add(errorKey)

    // ... existing repair logic (liveSnapshot → repairTest → applyPatch)
  }
  return rounds
}
```

---

## Chapter 5 — Building Your Own Custom AI Agent

> Requires a local Ollama server with `deepseek-r1:8b` pulled (see
> `setup/local-llm-setup.md`) — no API key. `WebTestAgent` takes no constructor
> arguments (`new WebTestAgent()`). DeepSeek-R1 has no native tool-calling, so
> the agent uses a **JSON action protocol**: each turn the model replies with a
> single `{ "tool", "input" }` object, which `extractJson()` parses. Tools are
> declared as plain `ToolSpec` objects (`{ name, description, params[] }`) and
> rendered into the system prompt by `renderToolCatalog()` — there are no
> provider-specific JSON-schema tool definitions.

### Task A — Add `logout` task prompt (`prompts.ts`)

```typescript
// examples/ch5-custom-agent/prompts.ts — add to the tasks object
logout: () => `
Goal: Log out of the app and confirm the session is cleared.

Pre-condition: Logged in as ${ctx.credentials!.email}

Steps to verify:
1. Click the Logout button (visible in the navbar)
2. Assert URL contains "/login"
3. Assert the login form is visible
`,
```

### Task B — Harden system prompt against hallucinated selectors

```typescript
// examples/ch5-custom-agent/prompts.ts — add to SYSTEM_PROMPT
## Recovery from locator errors

If fill() or click() returns an error containing "locator" or "not found":
  1. Immediately call snapshot() to capture the current page state.
  2. Do NOT retry the same selector.
  3. Re-plan using ONLY selectors that appear in the new snapshot output.
  4. Prefer getByRole > getByLabel > getByText > getByPlaceholder.
```

### Task C — Machine-readable `done()` summary

```typescript
// examples/ch5-custom-agent/prompts.ts — update the 'done' summary format section
## 'done' summary format

When calling 'done', the summary MUST be valid JSON with this exact shape:
{
  "assertions": [
    { "name": "string", "expected": "string", "actual": "string", "passed": boolean }
  ],
  "passed": boolean
}
Do not add any text outside the JSON object.
```

```typescript
// examples/ch5-custom-agent/agent.ts — parse the JSON summary in the 'done' branch
// of loop(). extractJson tolerates DeepSeek's <think>…</think> and stray prose.
if (action.tool === 'done') {
  const summary = String(input.summary ?? '')
  const parsed = extractJson<{
    assertions: Array<{ name: string; expected: string; actual: string; passed: boolean }>
    passed: boolean
  }>(summary)

  if (parsed) {
    for (const a of parsed.assertions) {
      const icon = a.passed ? '✓' : '✗'
      console.log(`  ${icon}  ${a.name}: expected="${a.expected}" actual="${a.actual}"`)
    }
    return { goal, passed: parsed.passed, summary, toolCalls: turn + 1 }
  }
  // Fallback if the model didn't produce valid JSON
  return { goal, passed: input.passed === true, summary, toolCalls: turn + 1 }
}
```

### Task D — Measure local model latency / warm-up

There is no prompt caching with local inference. Instead, measure Ollama's
warm-up cost: the first turn is slow while Ollama loads `deepseek-r1:8b` into
memory; subsequent turns (and subsequent runs in the same process) are faster
once the model is warm.

```typescript
// examples/ch5-custom-agent/agent.ts — run() already records durationMs.
// Run three tasks back-to-back in the same process and log each run's duration:
const agent = new WebTestAgent()
for (const task of [tasks.authRedirect(), tasks.loginFlow(), tasks.productSearch('TV', 2)]) {
  const result = await agent.run(task)
  console.log(`  duration: ${result.durationMs}ms  (${result.toolCalls} tool calls)`)
}
```

The per-turn log already emitted by `loop()` shows Ollama's token counts
(`prompt_eval_count` / `eval_count`) so you can watch the prompt grow as
snapshots and results accumulate:

```typescript
// (already present in loop(), after chat())
console.log(`  tokens — prompt:${promptTokens} out:${outputTokens} (${MODEL})`)
```

```
// Expected: run 1 is cold (model load), runs 2–3 are warm.
// run 1 (cold — Ollama loads deepseek-r1:8b):  duration: ~48000ms
// run 2 (warm):                                duration: ~15000ms
// run 3 (warm):                                duration: ~13000ms
```

### Task A — Add `get_text` tool (`tools.ts` + `agent.ts`)

```typescript
// examples/ch5-custom-agent/tools.ts — add to ToolName and AGENT_TOOLS
export type ToolName =
  | 'navigate' | 'click' | 'fill' | 'assert_url' | 'assert_visible'
  | 'assert_text' | 'snapshot' | 'screenshot' | 'done'
  | 'get_text'  // ← new

// Add to the AGENT_TOOLS array (ToolSpec shape — plain params, no JSON schema):
{
  name: 'get_text',
  description: 'Read the visible text content of an element. Use to capture values for later assertions.',
  params: [
    { name: 'selector', description: 'Playwright selector', required: true },
    { name: 'description', description: 'What you are reading', required: true },
  ],
},
```

```typescript
// examples/ch5-custom-agent/agent.ts — add a case to execute()
case 'get_text': {
  result = await p.locator(input.selector as string).innerText({ timeout: 5000 })
  break
}
```

### Task B — Add `wait_for_visible` tool

```typescript
// tools.ts — add to ToolName:
| 'wait_for_visible'

// Add to AGENT_TOOLS (optional param → required: false):
{
  name: 'wait_for_visible',
  description: 'Wait until an element becomes visible. Use instead of screenshot() when waiting for UI updates.',
  params: [
    { name: 'selector', description: 'Playwright selector', required: true },
    { name: 'timeout_ms', description: 'Max wait in milliseconds (default 5000)', required: false },
  ],
},
```

```typescript
// agent.ts execute():
case 'wait_for_visible': {
  await p.locator(input.selector as string).waitFor({
    state: 'visible',
    timeout: (input.timeout_ms as number) ?? 5000,
  })
  result = `Visible: ${input.selector}`
  break
}
```

Add to `SYSTEM_PROMPT`:
```
Never use screenshot() to wait for page updates — use wait_for_visible instead.
```

### Task C — Extend `assert_text` with negation flag

```typescript
// tools.ts — update the assert_text spec (add an optional 'not' param):
{
  name: 'assert_text',
  description: 'Verify an element contains (or does NOT contain) the expected text.',
  params: [
    { name: 'selector', description: 'Playwright selector', required: true },
    { name: 'expected', description: 'Text the element must contain', required: true },
    { name: 'not', description: 'If true, assert the text is ABSENT', required: false },
  ],
},
```

```typescript
// agent.ts execute():
case 'assert_text': {
  const text = await p.locator(input.selector as string).innerText({ timeout: 5000 })
  const contains = text.includes(input.expected as string)
  const matches = input.not ? !contains : contains
  result = matches
    ? `✓ "${input.expected}" ${input.not ? 'is absent' : 'is present'}`
    : `✗ Element text is "${text}" — assertion failed`
  ok = matches
  break
}
```

### Task D — Tool call frequency breakdown

```typescript
// examples/ch5-custom-agent/agent.ts — in run(), after the loop resolves
const freq = this.steps.reduce<Record<string, number>>((acc, s) => {
  acc[s.tool] = (acc[s.tool] ?? 0) + 1
  return acc
}, {})
console.log('\n── Tool call breakdown ───────────────────────────────')
for (const [tool, count] of Object.entries(freq).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${tool.padEnd(20)} ${count}`)
}
```

---

## Chapter 6 — Creating Effective Testing Skills

### Task 1 — `/pw-coverage` skill

```markdown
<!-- .claude/skills/pw-coverage/SKILL.md -->
---
name: pw-coverage
description: Run the full Playwright suite and print a pass-rate breakdown grouped by page object.
argument-hint: "[optional grep pattern]"
allowed-tools: Bash(npx playwright *)
---

## Steps

1. Run: `npx playwright test $ARGUMENTS --reporter=json 2>&1`
2. Parse the JSON output — group results by the page object prefix of the test title
   (login / dashboard / products / other).
3. For each group print:
   - Group name
   - X passed / Y failed
   - Pass rate %
4. Print a totals line: overall X/Y passed (Z%).
5. If any test failed, quote the first error message for each group.

Never modify any test file.
```

### Task 2 — Extend `/pw-debug` to capture console errors

```markdown
<!-- .claude/skills/pw-debug/SKILL.md — update Steps section -->

## Steps

1. Run the test with trace and console capture:
   `npx playwright test "$ARGUMENTS" --headed --trace=on --reporter=json 2>&1`
2. Parse JSON output for failures.
3. For each failure:
   a. Quote the test title and error message.
   b. Check if any console error lines appear near the failure timestamp.
   c. If a JS console error correlates with the failure, surface it:
      "Console error: <message> — likely caused by <test action>"
4. Offer: "Run `npx playwright show-trace <path>` to inspect the full trace?"

Do not run npm install or modify any source file.
```

### Task 3 — Guard `/pw-new-test` against duplicate titles

```markdown
<!-- .claude/skills/pw-new-test/SKILL.md — add to Steps -->

## Pre-check (run before generating anything)

1. Read all existing `*.spec.ts` files under `tests/`.
2. Extract every `test('...')` and `test.describe('...')` title.
3. If $ARGUMENTS matches an existing title (case-insensitive), respond:
   "A test named '$ARGUMENTS' already exists in <file>. Did you mean to
    extend it, or should I generate a different scenario?"
   Stop — do not generate.

allowed-tools: Bash(npx playwright *) Read Write Edit
```

---

## Chapter 7 — Implementing an Agent & Running on CI

> Requires a local Ollama server with `deepseek-r1:8b` pulled (see
> `setup/local-llm-setup.md`) — no API key. `agent-runner.ts` calls
> `checkOllama()` on startup and exits with code 2 if the server or model is
> missing. It constructs the agent with `new WebTestAgent()` (no API key).

### Task A — Add `logout-flow` scenario (`scenarios.ts`)

First add the task prompt (see Ch5 Task A), then:

```typescript
// examples/ch7-agent-ci/scenarios.ts
export const SCENARIOS: Scenario[] = [
  { name: 'auth-redirect',  task: tasks.authRedirect(),           critical: true  },
  { name: 'login-flow',     task: tasks.loginFlow(),              critical: true  },
  { name: 'product-search', task: tasks.productSearch('Electronics', 6), critical: true  },
  { name: 'full-ecommerce', task: tasks.fullEcommerce(),          critical: true  },
  { name: 'logout-flow',    task: tasks.logout(),                 critical: false }, // ← new
]
```

```bash
# Verify exit code is 0 even if logout-flow fails (no API key needed)
npx tsx examples/ch7-agent-ci/agent-runner.ts --all
echo "Exit: $?"   # should be 0
```

### Task B — Add `total_duration_ms` job output (`reporter.ts`)

```typescript
// examples/ch7-agent-ci/reporter.ts — inside setOutputs()
setOutputs(): void {
  const passed         = this.results.every(r => !r.critical || r.passed)
  const criticalFailed = this.results.filter(r => r.critical && !r.passed).map(r => r.name)
  const totalDuration  = this.results.reduce((s, r) => s + r.durationMs, 0)  // ← new

  this.setOutput('passed',            String(passed))
  this.setOutput('critical_failed',   criticalFailed.join(','))
  this.setOutput('total_scenarios',   String(this.results.length))
  this.setOutput('passed_count',      String(this.results.filter(r => r.passed).length))
  this.setOutput('total_duration_ms', String(totalDuration))  // ← new
}
```

GitHub Actions step to gate on duration:

```yaml
- name: Check total duration
  run: |
    if [ "${{ steps.agent.outputs.total_duration_ms }}" -gt "120000" ]; then
      echo "::error title=Duration exceeded::Agent scenarios took >120s"
      exit 1
    fi
```

### Task C — Add `writeSlackPayload()` (`reporter.ts`)

```typescript
// examples/ch7-agent-ci/reporter.ts
writeSlackPayload(outPath: string): void {
  const passed         = this.results.every(r => !r.critical || r.passed)
  const criticalFailed = this.results.filter(r => r.critical && !r.passed)
  const statusText     = passed ? '✅ All agent scenarios passed' : `❌ ${criticalFailed.length} critical scenario(s) failed`

  const blocks: object[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: statusText, emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Passed:* ${this.results.filter(r => r.passed).length}/${this.results.length}` },
        { type: 'mrkdwn', text: `*Duration:* ${this.results.reduce((s, r) => s + r.durationMs, 0)}ms` },
      ],
    },
  ]

  if (criticalFailed.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Critical failures:*\n' + criticalFailed.map(r => `• \`${r.name}\``).join('\n'),
      },
    })
  }

  fs.writeFileSync(outPath, JSON.stringify({ blocks }, null, 2))
  console.log(`\nSlack payload written → ${outPath}`)
}
```

### Task D — Prefix matching in `findScenario()` (`scenarios.ts`)

```typescript
// examples/ch7-agent-ci/scenarios.ts
export function findScenario(name: string): Scenario {
  // 1. Exact match first
  const exact = SCENARIOS.find(s => s.name === name)
  if (exact) return exact

  // 2. Prefix match
  const matches = SCENARIOS.filter(s => s.name.startsWith(name))
  if (matches.length === 1) return matches[0]

  if (matches.length > 1) {
    const names = matches.map(s => s.name).join(', ')
    throw new Error(
      `Ambiguous prefix "${name}" matches multiple scenarios: ${names}. ` +
      `Be more specific.`
    )
  }

  const valid = SCENARIOS.map(s => s.name).join(', ')
  throw new Error(`Unknown scenario "${name}". Valid values: ${valid}`)
}
```

```bash
# Verify prefix resolution works
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login
# resolves to: login-flow ✓

npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario auth
# resolves to: auth-redirect ✓

npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario l
# Error: Ambiguous prefix "l" matches: login-flow, logout-flow ✓
```

---

## Quick reference — running solutions

```bash
# Prerequisite for all LLM-backed chapters (Ch4, Ch4.1, Ch5, Ch7):
#   ollama pull deepseek-r1:8b     # one time (~5 GB)
#   ollama serve                    # if not already running (port 11434)
# No API key required. Override the model with WORKSHOP_MODEL.

# Type-check all examples after editing
npx tsc --noEmit -p tsconfig.examples.json

# Run a single chapter's agent scenario
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow

# Run all scenarios and check exit code
npx tsx examples/ch7-agent-ci/agent-runner.ts --all
echo "Exit: $?"

# Run generated tests after Ch4.1 pipeline
npx playwright test tests/generated/ --reporter=list
```
