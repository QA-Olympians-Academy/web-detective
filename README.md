# web-detective

A React + TypeScript ecommerce app used as the target application for the
**"Rise of the Web Agents"** workshop — an 8-hour tutorial on agentic test automation.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and log in with:

| Field    | Value          |
|----------|----------------|
| Email    | admin@shop.com |
| Password | password123    |

---

## App Pages

| Route        | Description                                             |
|--------------|---------------------------------------------------------|
| `/login`     | Login form — redirects to dashboard when authenticated  |
| `/dashboard` | Stat cards, monthly sales bar chart, revenue line chart |
| `/products`  | Product list with live search and stock status badges   |

## Scripts

| Command           | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start dev server on port 5173      |
| `npm run build`   | Type-check + production build      |
| `npm run preview` | Serve the production build locally |

---

## Workshop Chapters

Each chapter has runnable examples under `examples/`, run with `npx tsx` (the repo is an ESM package, so use `tsx` rather than `ts-node`). Start the dev server first:

```bash
npm run dev
```

---

### Ch1 — Foundations of Agentic Automation

**Files:** [examples/ch1-foundations/](examples/ch1-foundations/)

Run the brittle test to see it pass, then intentionally break a selector to see it fail for the wrong reason:

```bash
# Run the anti-pattern test
npx playwright test examples/ch1-foundations/brittle-test.spec.ts --headed

# Inspect the typed task graph structure
npx tsx -e "import { describeGraph, loginTaskGraph } from './examples/ch1-foundations/task-graph.ts'; describeGraph(loginTaskGraph)"
```

**Exercises**

1. Open [examples/ch1-foundations/brittle-test.spec.ts](examples/ch1-foundations/brittle-test.spec.ts) and fix every anti-pattern: replace arbitrary waits with `waitFor` conditions, replace CSS path selectors with ARIA-based ones, and eliminate the hardcoded sleep.
2. Add a `logoutTask` to `loginTaskGraph` in [examples/ch1-foundations/task-graph.ts](examples/ch1-foundations/task-graph.ts) with `verifyDashboardLoaded` as its precondition and `url === '/login'` as its success criterion.
3. Extend the `ActionType` enum with `hover` and `wait_for_selector`, then add a `hoverNavMenu` action to the task graph that uses `hover` before clicking a dropdown.

---

### Ch2 — Playwright as the Execution Layer

**Files:** [examples/ch2-execution-layer/](examples/ch2-execution-layer/)

```bash
# Annotated CLI cheatsheet — read and follow along
cat examples/ch2-execution-layer/cli-examples.sh

# Launch Playwright Codegen against the app
npx playwright codegen http://localhost:5173

# Run the full suite in interactive UI mode
npx playwright test --ui

# Step through a failing test with the Inspector
PWDEBUG=1 npx playwright test tests/auth.spec.ts --project=chromium

# Open the last HTML report
npx playwright show-report
```

The `ActionWrapper` and `BrowserSession` classes are imported by later chapters — explore them directly:

```bash
npx tsx examples/ch2-execution-layer/action-wrapper.ts
npx tsx examples/ch2-execution-layer/browser-session.ts
```

**Exercises**

1. Add a `hover(selector: string): Promise<ActionResult>` method to `ActionWrapper` in [examples/ch2-execution-layer/action-wrapper.ts](examples/ch2-execution-layer/action-wrapper.ts) that follows the same try/catch logging pattern as `click()`.
2. Extend `navigateWithRetry` in [examples/ch2-execution-layer/browser-session.ts](examples/ch2-execution-layer/browser-session.ts) to distinguish network errors (log `navigate_network_error`) from timeout errors (log `navigate_timeout`) so the LLM can reason about failure causes differently.
3. Run `npx playwright codegen http://localhost:5173` and record a login flow. Compare the selectors `codegen` chose against the ones in `ActionWrapper.resolveSelector()` — note which are more resilient and why.

---

### Ch3 — Build Your Own MCP Server

**Files:** [examples/ch3-mcp/](examples/ch3-mcp/)

**Option A — Custom MCP server** (built from scratch in the workshop):

```bash
# Install the MCP SDK
npm install @modelcontextprotocol/sdk

# Start the server (communicates over stdio)
npx tsx examples/ch3-mcp/server.ts
```

Register it in Claude Code (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "web-detective": {
      "command": "npx",
      "args": ["tsx", "examples/ch3-mcp/server.ts"]
    }
  }
}
```

**Option B — Official `@playwright/mcp`** (zero config):

```bash
npx @playwright/mcp@latest
```

Register in Claude Code:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Then prompt your AI client:
> "Log in to http://localhost:5173 with admin@shop.com / password123 and confirm the dashboard loads."

See [examples/ch3-mcp/playwright-mcp-client.ts](examples/ch3-mcp/playwright-mcp-client.ts) for the full tool surface and snapshot vs vision mode comparison.

**Exercises**

1. Add a `browser_evaluate` tool to [examples/ch3-mcp/server.ts](examples/ch3-mcp/server.ts) that accepts a `script: string` parameter, runs it via `page.evaluate()`, and returns the serialised result. Add the JSON schema and register it in the tool list.
2. Register the custom server in `.claude/settings.json`, start it, then prompt your AI client: "Count the number of product rows visible on the products page." Verify the count matches what you see in the browser.
3. Call `browser_snapshot` and `browser_screenshot` on the same page state. Compare token count vs. information density for a table-reading task and document which mode you'd choose for the products page and why.

---

### Ch4 — Self-Healing Selectors

**Files:** [examples/ch4-self-healing/](examples/ch4-self-healing/)

```bash
# Seed the locator store with the app's default selectors
npx tsx -e "
import { LocatorStore, WEB_DETECTIVE_LOCATORS } from './examples/ch4-self-healing/locator-store.ts'
const store = new LocatorStore('./locator-memory.json')
for (const [key, selector] of WEB_DETECTIVE_LOCATORS) store.register(key, selector)
store.printReport()
"
```

To trigger healing, break a selector and run the healer:

```bash
# 1. Edit src/pages/Login.tsx — rename className="login-card" to "auth-card"
# 2. Rebuild
npm run build

# 3. Run the self-healer (requires a running Ollama server — see setup/local-llm-setup.md)
#    It asks the local model (DeepSeek-R1) for alternatives — no API key needed.
npx tsx -e "
import { chromium } from 'playwright'
import { LocatorStore } from './examples/ch4-self-healing/locator-store.ts'
import { SelfHealingAgent } from './examples/ch4-self-healing/self-healer.ts'

const store = new LocatorStore('./locator-memory.json')
const healer = new SelfHealingAgent(store)
const browser = await chromium.launch({ headless: true })
const page = await (await browser.newContext({ baseURL: 'http://localhost:5173' })).newPage()
await page.goto('/login')
const selector = await healer.findElement(page, 'login.emailInput')
console.log('Healed selector:', selector)
store.printReport()
await browser.close()
"
```

Use the `/pw-self-heal` skill inside Claude Code for an interactive healing session.

**Exercises**

1. Add a `confidence` field (number, 0–1) to `LocatorEntry` in [examples/ch4-self-healing/locator-store.ts](examples/ch4-self-healing/locator-store.ts). Set it to `1.0` on `register()`, decrease it by `0.2` on each `heal()`, and display it in `printReport()`.
2. Rename the CSS class `login-card` to `auth-card` in [src/pages/Login.tsx](src/pages/Login.tsx), rebuild (`npm run build`), then run the self-healer and confirm it proposes an ARIA-based replacement that doesn't depend on the class name.
3. Extend `printReport()` to print a `NEEDS REVIEW` warning next to any locator whose `healCount` is 2 or more, so engineers know which selectors are chronically unstable.

---

### Ch4.1 — Playwright Agents: Planner, Generator, Healer

**Files:** [examples/ch4.1-playwright-agents/](examples/ch4.1-playwright-agents/)

This chapter covers Playwright's three built-in AI agents that form an end-to-end test generation and healing pipeline. The agents work at the **test-block level** (vs Ch4 which heals individual selectors).

```bash
# One-time initialisation (generates agent definitions in .github/)
npx playwright init-agents --loop=claude

# Run the full Planner → Generator pipeline
npx tsx examples/ch4.1-playwright-agents/planner.ts
# → writes specs/web-detective.md
# → writes tests/generated/web-detective.spec.ts

# Run the TestHealerAgent on a failing generated test
npx tsx examples/ch4.1-playwright-agents/healer.ts
# → reruns failing tests, rewrites broken test() blocks, re-runs (max 3 rounds)
```

> These agents run against a local model — start Ollama first (see [setup/local-llm-setup.md](setup/local-llm-setup.md)). No API key needed.

**Healing levels comparison:**

| Aspect | Ch4 — Selector Healer | Ch4.1 — Test Block Healer |
|---|---|---|
| Scope | Single selector string | Entire `test()` function |
| Trigger | `locator()` throws | `npx playwright test` fails |
| Output | Updated `locators.json` | Patched `.spec.ts` file |
| Best for | Ongoing maintenance | AI-generated test cleanup |

Use the `/pw-plan` skill to run the full pipeline from Claude Code:

```
/pw-plan web-detective
```

**Exercises**

1. Run the full pipeline and inspect `specs/web-detective.md` — does the plan cover login, dashboard, and products? Add a missing route and re-run the Generator only.
2. In `tests/generated/web-detective.spec.ts`, change one `getByRole` call to `locator('.gone')`. Run `TestHealerAgent` and observe the multi-round repair loop in the console.
3. Compare the Ch4 `SelfHealingAgent` and the Ch4.1 `TestHealerAgent` on the same broken selector — which produces a more stable fix and why?
4. Use `/pw-plan` skill and compare the skill-generated tests with the programmatic planner output.

---

### Ch5 — Building Your Own Custom AI Agent

**Files:** [examples/ch5-custom-agent/](examples/ch5-custom-agent/)

Requires a running Ollama server with `deepseek-r1:8b` pulled — see [setup/local-llm-setup.md](setup/local-llm-setup.md). Runs locally and free, no API key:

```bash
# Run the full e-commerce verification agent
npx tsx examples/ch5-custom-agent/agent.ts
```

Because DeepSeek-R1 is a local reasoning model with no native tool calling, the agent drives its tools via a prompt-based JSON action protocol — the model returns one `{ "tool", "input" }` object per turn.

The agent will:
1. Navigate to the app
2. Log in with demo credentials
3. Verify the dashboard and all stat cards
4. Navigate to Products, search, and clear search
5. Log out
6. Print a structured pass/fail summary

To run a specific task instead of the full flow, edit the last lines of `agent.ts`:

```typescript
// Single task examples:
agent.run(tasks.loginFlow())
agent.run(tasks.authRedirect())
agent.run(tasks.productSearch('Electronics', 6))
```

**Exercises**

1. Add a `noResultsSearch` task to [examples/ch5-custom-agent/prompts.ts](examples/ch5-custom-agent/prompts.ts) that searches for `"zzz_nonexistent"` and asserts the products table shows zero rows. Run it with `agent.run(tasks.noResultsSearch())`.
2. Lower `MAX_TURNS` from `15` to `6` in [examples/ch5-custom-agent/agent.ts](examples/ch5-custom-agent/agent.ts) and run `fullEcommerce()`. Observe how the agent handles running out of turns mid-flow — then raise it back and document the minimum turns needed.
3. Add a `scroll_into_view` tool to the registry in [examples/ch5-custom-agent/tools.ts](examples/ch5-custom-agent/tools.ts) with a `selector` input, wire it to `page.locator(selector).scrollIntoViewIfNeeded()` in `agent.ts`, and update the system prompt to use it before clicking elements that may be off-screen.

---

### Ch6 — Creating Effective Testing Skills

Skills live in [.claude/skills/](/.claude/skills/) and are invoked inside Claude Code:

| Skill | Command | What it does |
|-------|---------|--------------|
| Run tests | `/pw-run` | Full suite or filtered subset with failure diagnosis |
| Run tests (filtered) | `/pw-run auth` | Filter by file name or test title |
| Debug a failure | `/pw-debug "logs out"` | Headed run + trace + root cause analysis |
| Scaffold new spec | `/pw-new-test checkout flow` | Creates spec + page object, runs until green |
| Generate page object | `/pw-page-object Checkout /checkout` | Reads React source, generates typed PO |
| Heal broken locators | `/pw-self-heal` | Detects broken selectors, proposes LLM-ranked replacements (Ch4 selector-level) |
| Plan + generate tests | `/pw-plan web-detective` | Runs Ch4.1 Planner → Generator pipeline for a feature area |
| Run CI scenario | `/agent-run login-flow` | Runs a Ch7 scenario locally and shows the reporter output |

**Exercises**

1. Write a `/pw-coverage` skill in [.claude/skills/](.claude/skills/) that runs the full test suite and prints a pass-rate breakdown grouped by page object (login, dashboard, products). Use context injection to pull `npx playwright test --reporter=json` output before the LLM summarises it.
2. Extend the `/pw-debug` skill to also capture browser console errors: inject `` !`npx playwright test "$ARGUMENTS" --reporter=json 2>&1` `` and ask the LLM to correlate JS console errors with test failures.
3. Add a guard rail to `/pw-new-test` that reads the existing spec files first and refuses to scaffold a test whose `test()` title already exists elsewhere in the suite. Document the `allowed-tools` list your skill needs for this check.

---

### Ch7 — Implementing an Agent & Running on CI

**Files:** [examples/ch7-agent-ci/](examples/ch7-agent-ci/)  
**Workflow:** [.github/workflows/agentic-tests.yml](.github/workflows/agentic-tests.yml)

#### List available scenarios

```bash
npx tsx examples/ch7-agent-ci/agent-runner.ts --list
```

#### Run a single scenario locally

Requires a running Ollama server (see [setup/local-llm-setup.md](setup/local-llm-setup.md)) — no API key.

```bash
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario auth-redirect
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario product-search
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario full-ecommerce
```

#### Run all scenarios sequentially

```bash
npx tsx examples/ch7-agent-ci/agent-runner.ts --all
```

Each run produces:
- Console output with per-scenario pass/fail and step count
- `agent-report.json` — structured JSON report for artifact upload
- GitHub Actions annotations (`::error` / `::warning`) when run in CI
- A Markdown step summary table in the Actions UI

#### GitHub Actions workflows

Each chapter has its own workflow file, scoped to its `paths`:

| Workflow | Trigger | What it checks |
|---|---|---|
| [ch1-foundations.yml](.github/workflows/ch1-foundations.yml) | `examples/ch1-foundations/**` | Type-check, run brittle test, verify task-graph exports |
| [ch2-execution-layer.yml](.github/workflows/ch2-execution-layer.yml) | `examples/ch2-execution-layer/**` | Type-check, ActionWrapper live login smoke test |
| [ch3-mcp.yml](.github/workflows/ch3-mcp.yml) | `examples/ch3-mcp/**` | Type-check, MCP server boot, tool schema count |
| [ch4-self-healing.yml](.github/workflows/ch4-self-healing.yml) | `examples/ch4-self-healing/**`, `src/**` | Type-check, seed locator store, probe all selectors against live app |
| [ch4.1-playwright-agents.yml](.github/workflows/ch4.1-playwright-agents.yml) | `examples/ch4.1-playwright-agents/**`, `src/**` | Type-check, plan validation (>100 chars, 3 snapshots), generator output, optional E2E on `main` |
| [ch5-custom-agent.yml](.github/workflows/ch5-custom-agent.yml) | `examples/ch5-custom-agent/**` | Type-check, tool registry validation, agent run on `main` |
| [ch6-skills.yml](.github/workflows/ch6-skills.yml) | `.claude/skills/**` | Frontmatter validation, `argument-hint` presence check |
| [ch7-agent-ci.yml](.github/workflows/ch7-agent-ci.yml) | Every push/PR | Full pipeline: Playwright + agentic matrix + locator health |

#### Running the agentic jobs (Ch5 + Ch7) in CI

The agentic examples talk to a local Ollama server — no secret required. The
workflows install and start Ollama on the runner automatically via the shared
composite action [.github/actions/setup-ollama](.github/actions/setup-ollama/action.yml),
then pull the model. Because GitHub-hosted runners are CPU-only, CI uses a smaller
model (`deepseek-r1:1.5b`, set via `WORKSHOP_MODEL` in each job) rather than the
`deepseek-r1:8b` default used locally, and the agentic jobs carry a `timeout-minutes`
guard. For faster, more reliable runs, use a self-hosted runner (ideally with a GPU)
and bump `WORKSHOP_MODEL` back up.

#### Add a new scenario

Edit [examples/ch7-agent-ci/scenarios.ts](examples/ch7-agent-ci/scenarios.ts) — no changes to the workflow YAML needed:

```typescript
{
  name: 'checkout-flow',
  task: tasks.checkoutFlow(),   // add to prompts.ts
  critical: true,
}
```

**Exercises**

1. Add a `dashboard-charts` scenario (non-critical) to [examples/ch7-agent-ci/scenarios.ts](examples/ch7-agent-ci/scenarios.ts) and a matching `dashboardCharts()` task prompt in [examples/ch5-custom-agent/prompts.ts](examples/ch5-custom-agent/prompts.ts). Run it with `--scenario dashboard-charts` and observe the step summary.
2. Extend `CIReporter.writeStepSummary()` in [examples/ch7-agent-ci/reporter.ts](examples/ch7-agent-ci/reporter.ts) to add a "Zero tool calls" warning row for any scenario where the agent called `done()` on the first turn — this indicates the agent may have short-circuited without actually testing anything.
3. Modify the workflow in [.github/workflows/ch7-agent-ci.yml](.github/workflows/ch7-agent-ci.yml) to also run the agentic matrix on PRs targeting `main` (not just pushes to `main`), then update the cost-management comment to reflect the new trigger.

---

## Presentation

The workshop slide deck is checked in as `web-detective-workshop.pptx` (82 slides, 8 hours of content).

To rebuild it from source:

```bash
pip install python-pptx
python3 build_presentation.py
# → overwrites web-detective-workshop.pptx
```

`build_presentation.py` covers every chapter with opener, concept, code, discussion, and task slides.

---

## Project Structure

```
web-detective/
├── src/                          # React app (the system under test)
│   ├── pages/                    # Login, Dashboard, Products
│   ├── components/               # Navbar, PrivateRoute
│   └── context/AuthContext.tsx
├── tests/                        # Playwright test suite
│   ├── fixtures/index.ts         # Custom test + authenticated fixture
│   ├── pages/                    # Page objects (LoginPage, etc.)
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── products.spec.ts
├── examples/                     # Workshop chapter examples
│   ├── ch1-foundations/          # brittle-test.spec.ts, task-graph.ts
│   ├── ch2-execution-layer/      # action-wrapper.ts, browser-session.ts
│   ├── ch3-mcp/                  # server.ts, playwright-mcp-client.ts
│   ├── ch4-self-healing/         # locator-store.ts, self-healer.ts
│   ├── ch4.1-playwright-agents/  # planner.ts, healer.ts  ← NEW
│   ├── ch5-custom-agent/         # agent.ts, tools.ts, prompts.ts
│   ├── ch7-agent-ci/             # agent-runner.ts, reporter.ts, scenarios.ts
│   └── shared/                   # ollama.ts — local LLM client  ← NEW
├── specs/                        # AI-generated test plans (output of Ch4.1 Planner)
├── tests/generated/              # AI-generated test code (output of Ch4.1 Generator)
├── .claude/skills/               # Claude Code custom slash commands
│   ├── pw-run/
│   ├── pw-debug/
│   ├── pw-new-test/
│   ├── pw-page-object/
│   ├── pw-self-heal/             # Ch4 selector-level healing
│   └── pw-plan/                  # Ch4.1 Planner+Generator pipeline  ← NEW
├── .github/workflows/
│   ├── ch1-foundations.yml
│   ├── ch2-execution-layer.yml
│   ├── ch3-mcp.yml
│   ├── ch4-self-healing.yml
│   ├── ch4.1-playwright-agents.yml  ← NEW
│   ├── ch5-custom-agent.yml
│   ├── ch6-skills.yml
│   └── ch7-agent-ci.yml
├── build_presentation.py         # Rebuilds web-detective-workshop.pptx  ← NEW
└── web-detective-workshop.pptx   # 82-slide workshop deck  ← NEW
```

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **React Router v6** — client-side routing
- **Recharts** — bar and line charts
- **Playwright** — test suite + execution layer + MCP server + built-in AI agents (Ch4.1)
- **Ollama + DeepSeek-R1** — local LLM reasoning (no API key) in Ch4, Ch4.1, Ch5, Ch7; all calls go through examples/shared/ollama.ts
- **@modelcontextprotocol/sdk** — custom MCP server in Ch3
- **python-pptx** — presentation build script
