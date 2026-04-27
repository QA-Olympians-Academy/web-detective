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

Each chapter has runnable examples under `examples/`. Start the dev server first:

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
npx ts-node -e "import { describeGraph, loginTaskGraph } from './examples/ch1-foundations/task-graph.ts'; describeGraph(loginTaskGraph)"
```

---

### Ch2 — WebdriverIO & Playwright as the Execution Layer

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
npx ts-node examples/ch2-execution-layer/action-wrapper.ts
npx ts-node examples/ch2-execution-layer/browser-session.ts
```

---

### Ch3 — Build Your Own MCP Server

**Files:** [examples/ch3-mcp/](examples/ch3-mcp/)

**Option A — Custom MCP server** (built from scratch in the workshop):

```bash
# Install the MCP SDK
npm install @modelcontextprotocol/sdk

# Start the server (communicates over stdio)
npx ts-node examples/ch3-mcp/server.ts
```

Register it in Claude Code (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "web-detective": {
      "command": "npx",
      "args": ["ts-node", "examples/ch3-mcp/server.ts"]
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

---

### Ch4 — Self-Healing Selectors

**Files:** [examples/ch4-self-healing/](examples/ch4-self-healing/)

```bash
# Seed the locator store with the app's default selectors
npx ts-node -e "
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

# 3. Run the self-healer (requires ANTHROPIC_API_KEY)
ANTHROPIC_API_KEY=sk-... npx ts-node -e "
import { chromium } from 'playwright'
import { LocatorStore } from './examples/ch4-self-healing/locator-store.ts'
import { SelfHealingAgent } from './examples/ch4-self-healing/self-healer.ts'

const store = new LocatorStore('./locator-memory.json')
const healer = new SelfHealingAgent(store, process.env.ANTHROPIC_API_KEY)
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

---

### Ch5 — Building Your Own Custom AI Agent

**Files:** [examples/ch5-custom-agent/](examples/ch5-custom-agent/)

Requires an Anthropic API key:

```bash
export ANTHROPIC_API_KEY=sk-ant-...

# Install the Anthropic SDK if not already present
npm install @anthropic-ai/sdk

# Run the full e-commerce verification agent
npx ts-node examples/ch5-custom-agent/agent.ts
```

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
| Heal broken locators | `/pw-self-heal` | Detects broken selectors, proposes LLM-ranked replacements |

---

### Ch7 — Implementing an Agent & Running on CI

**Files:** [examples/ch7-agent-ci/](examples/ch7-agent-ci/)  
**Workflow:** [.github/workflows/agentic-tests.yml](.github/workflows/agentic-tests.yml)

#### List available scenarios

```bash
npx ts-node examples/ch7-agent-ci/agent-runner.ts --list
```

#### Run a single scenario locally

```bash
export ANTHROPIC_API_KEY=sk-ant-...

npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario auth-redirect
npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario product-search
npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario full-ecommerce
```

#### Run all scenarios sequentially

```bash
ANTHROPIC_API_KEY=sk-ant-... npx ts-node examples/ch7-agent-ci/agent-runner.ts --all
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
| [ch5-custom-agent.yml](.github/workflows/ch5-custom-agent.yml) | `examples/ch5-custom-agent/**` | Type-check, tool registry validation, agent run on `main` |
| [ch6-skills.yml](.github/workflows/ch6-skills.yml) | `.claude/skills/**` | Frontmatter validation, `argument-hint` presence check |
| [ch7-agent-ci.yml](.github/workflows/ch7-agent-ci.yml) | Every push/PR | Full pipeline: Playwright + agentic matrix + locator health |

#### Enable the agentic jobs (Ch5 + Ch7)

Add your API key as a repository secret:

```
Settings → Secrets and variables → Actions → New repository secret
Name:  ANTHROPIC_API_KEY
Value: sk-ant-...
```

#### Add a new scenario

Edit [examples/ch7-agent-ci/scenarios.ts](examples/ch7-agent-ci/scenarios.ts) — no changes to the workflow YAML needed:

```typescript
{
  name: 'checkout-flow',
  task: tasks.checkoutFlow(),   // add to prompts.ts
  critical: true,
}
```

---

## Project Structure

```
web-detective/
├── src/                        # React app (the system under test)
│   ├── pages/                  # Login, Dashboard, Products
│   ├── components/             # Navbar, PrivateRoute
│   └── context/AuthContext.tsx
├── tests/                      # Playwright test suite
│   ├── fixtures/index.ts       # Custom test + authenticated fixture
│   ├── pages/                  # Page objects (LoginPage, etc.)
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── products.spec.ts
├── examples/                   # Workshop chapter examples
│   ├── ch1-foundations/
│   ├── ch2-execution-layer/
│   ├── ch3-mcp/
│   ├── ch4-self-healing/
│   ├── ch5-custom-agent/
│   └── ch7-agent-ci/
├── .claude/skills/             # Claude Code custom slash commands
│   ├── pw-run/
│   ├── pw-debug/
│   ├── pw-new-test/
│   ├── pw-page-object/
│   └── pw-self-heal/
└── .github/workflows/
    ├── ch1-foundations.yml
    ├── ch2-execution-layer.yml
    ├── ch3-mcp.yml
    ├── ch4-self-healing.yml
    ├── ch5-custom-agent.yml
    ├── ch6-skills.yml
    └── ch7-agent-ci.yml
```

## Stack

- **React 18** + **TypeScript** + **Vite 5**
- **React Router v6** — client-side routing
- **Recharts** — bar and line charts
- **Playwright** — test suite + execution layer + MCP server
- **Anthropic SDK** — LLM reasoning in Ch4 (self-healing) and Ch5 (custom agent)
- **@modelcontextprotocol/sdk** — custom MCP server in Ch3
