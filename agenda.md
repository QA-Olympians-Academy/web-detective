# Rise of the Web Agents
## Crafting AI-Driven Testers for Modern Web Apps

> **Full-day advanced tutorial** · 8 hours · Target: Senior QA Engineers, SDETs, Test Automation Architects

---

## What You Will Build

By end of day, you will have a working end-to-end agentic workflow in which an AI agent:
- Performs real-time browser UI testing via WebdriverIO and Playwright
- Auto-generates test code from high-level prompts
- Self-heals broken selectors at runtime
- Integrates with OpenRouter and/or GitHub Copilot Agent Mode
- Drives a browser through the official `@playwright/mcp` server
- Runs autonomously inside a CI/CD pipeline
- Is controlled by well-crafted, reusable testing skills

---

## Prerequisites

Make sure the following are installed before arriving:

| Tool | Purpose |
|------|---------|
| VS Code + GitHub Copilot | IDE + Agent Mode |
| Claude Code (or similar AI CLI) | Skills and agentic test authoring |
| Node.js (LTS) | Runtime for WebdriverIO / Playwright |
| Git + GitHub account | Repo access and Copilot integration |
| WebdriverIO CLI | Primary automation framework |
| Playwright | Execution layer + MCP server |
| TypeScript and/or Python | Scripting language |
| Docker Engine | Containerised CI/CD execution |

---

## Schedule

### 09:00 – 09:30 · Welcome & Environment Check *(30 min)*

- Workshop goals and structure overview
- Validate toolchain: Node, WebdriverIO, Playwright, Docker, Claude Code
- Repository clone and project walkthrough
- Quick demo of the target web application under test

---

### 09:30 – 10:45 · Chapter 1 — Foundations of Agentic Automation *(75 min)*

**Concepts**
- What "agentic" means in the context of QA engineering
- LLM-enhanced automation vs. traditional scripts — where the line is
- Architectural patterns: reactive agents, goal-driven agents, multi-agent pipelines
- The agent reasoning loop: observe → plan → act → verify → learn
- MCP as an enabler for structured agent environments

**Hands-on**
- Inspect a classic brittle Playwright test and identify failure modes
- Map the test steps to an agentic task graph
- Discuss: where does human judgement still live?

---

### ☕ 10:45 – 11:00 · Break *(15 min)*

---

### 11:00 – 12:30 · Chapter 2 — WebdriverIO & Playwright as the Execution Layer *(90 min)*

**Concepts**
- Treating WebdriverIO / Playwright as a controllable action toolkit — not a test runner
- Extracting and interpreting page source (DOM, a11y tree, screenshots) for LLM reasoning
- Mapping agentic actions to browser commands: a consistent action vocabulary
- Building a fault-tolerant session for autonomous agents (retries, timeouts, state recovery)

**Hands-on**
- Instrument a WebdriverIO session to emit structured action logs
- Write an action wrapper that an LLM can call: `navigate`, `click`, `fill`, `assert`
- Run a short autonomous flow against the demo app and inspect the logs

#### Playwright CLI Deep-Dive *(embedded, ~30 min)*

**Key commands every agentic QA engineer must know**

| Command | Purpose |
|---------|---------|
| `npx playwright test` | Run the suite; flags: `--headed`, `--debug`, `--ui`, `--grep`, `--project` |
| `npx playwright codegen <url>` | Record browser interactions and auto-generate locators |
| `npx playwright show-report` | Open the HTML report with timeline, traces, and screenshots |
| `npx playwright show-trace <file>` | Inspect a saved trace offline — step through every action |
| `PWDEBUG=1 npx playwright test` | Launch Playwright Inspector for step-by-step debugging |

**Hands-on**
- Use `codegen` against the demo app to capture a login flow; observe selector choices
- Break a test intentionally; use `--debug` and the Inspector to trace the failure
- Open a trace file in `show-trace` and correlate a failed assertion with a DOM snapshot

---

### 🍽️ 12:30 – 13:15 · Lunch *(45 min)*

---

### 13:15 – 14:15 · Chapter 3 — Build Your Own MCP Server *(60 min)*

**Concepts**
- MCP architecture: hosts, clients, servers, tools, and resources
- How GitHub Copilot Agent Mode and Claude Code talk to MCP servers
- Designing a web-automation MCP server: tool surface and schema design

**Hands-on**
- Scaffold an MCP server that exposes browser actions as tools
- Connect it to Copilot Agent Mode in VS Code
- Prompt the agent to navigate and assert against the demo app — no test code written manually
- Debug a failed tool call and fix the schema

#### The Official `@playwright/mcp` Server *(embedded, ~20 min)*

**Concepts**
- What `@playwright/mcp` ships out of the box: `browser_navigate`, `browser_click`, `browser_fill`, `browser_snapshot`, `browser_screenshot`, `browser_evaluate`
- Vision mode vs. accessibility-snapshot mode — when to use each
- Wiring `@playwright/mcp` to Claude Code, VS Code Copilot, or any MCP-compatible client

**Hands-on**
- Install and launch `@playwright/mcp` with a single npx command
- Connect it to your AI client of choice
- Drive the demo app using plain English: "Log in with admin credentials and verify the dashboard loads"
- Compare: hand-written Playwright test vs. the same assertion driven through MCP

---

### 14:15 – 15:15 · Chapter 4 — Self-Healing Selectors *(60 min)*

**Concepts**
- Runtime detection of locator failures
- Parsing the UI tree and ranking alternative selector candidates
- Using LLMs to propose and validate replacement locators
- Building a persistent "locator memory" that heals over time
- Logging locator evolution for long-term maintainability

**Hands-on**
- Intentionally break three selectors in a test suite
- Watch the self-healing agent detect and repair them in real time
- Review and commit the locator memory file
- Discuss: when to trust auto-healed selectors vs. when to review manually

---

### ☕ 15:15 – 15:30 · Break *(15 min)*

---

### 15:30 – 16:15 · Chapter 5 — Building Your Own Custom AI Agent *(45 min)*

**Concepts**
- Designing the full reasoning loop: observe → plan → act → verify → learn
- Defining tools for UI interaction, invariant checking, and navigation
- Prompt engineering for deterministic and repeatable browser behaviour
- Integrating OpenRouter to swap underlying LLMs without rewriting agent logic

**Hands-on**
- Build a minimal agent class with a tool registry and a planning prompt
- Wire it to the WebdriverIO / Playwright execution layer from Chapter 2
- Run a multi-step e-commerce scenario (login → search → checkout → confirm) driven entirely by the agent
- Tune the system prompt to fix a hallucination or off-track navigation

---

### 16:15 – 17:00 · Chapter 6 — Creating Effective Testing Skills *(45 min)*

> Skills (also called custom slash commands) are reusable, parameterised prompts that give an AI agent specialised QA behaviour. A well-crafted skill is the difference between an agent that works once and one that works every time.

**Concepts**

*Anatomy of a skill*
- Frontmatter fields that matter for testing: `name`, `description`, `argument-hint`, `allowed-tools`
- Context injection: shell blocks (`` !`command` ``) to pull live test results, git diff, or browser state into the prompt before the LLM sees it
- Argument passing with `$ARGUMENTS` — when to use positional args vs. named args

*Prompt engineering inside skills*
- Be specific about output format — "list failing test titles, then the error, then a one-line fix" beats "explain the failure"
- Anchor to project conventions: reference actual file paths, fixture names, and page object patterns
- Guard rails: tell the skill what NOT to do ("never modify test files unless the user confirms")
- Use `allowed-tools` to pre-approve only the tools the skill needs — keeps it fast and auditable

*Common QA skill templates*
| Skill | What it does |
|-------|-------------|
| `run-tests [filter]` | Run suite or filtered subset; summarise pass/fail; diagnose failures by category |
| `debug-test <name>` | Headed run with trace; cross-reference page object and component source; propose a diff |
| `new-test <description>` | Scaffold spec using project fixtures and page objects; run and fix until green |
| `new-page-object <Page>` | Read React source; generate typed page object with `readonly` locators and action methods |
| `self-heal` | Detect broken locators; propose replacements ranked by selector stability |

**Hands-on**
- Write a `debug-test` skill from scratch: frontmatter, context injection, diagnostic logic, output contract
- Write a `new-test` skill that enforces the project's fixture and page-object conventions
- Invoke both skills against a deliberately broken test and validate the output
- Discuss: how to version-control skills alongside tests so they stay in sync

---

### 17:00 – 17:30 · Chapter 7 — Autonomous Test Execution & CI/CD *(30 min)*

**Concepts**
- Running a complete test scenario from high-level goal descriptions
- Strategies for repeatability and determinism in agentic tests
- Logging agent decisions in a human-auditable format
- Scaling autonomous agents in CI/CD: parallelism, cost, and failure triage

**Hands-on**
- Add the agent runner to a GitHub Actions workflow
- Trigger a run and inspect the structured decision log as a pipeline artifact
- Review: what passes, what flakes, and what the agent could not handle — and why

---

### 17:30 – 18:00 · Q&A, Wrap-up & Next Steps *(30 min)*

- Open Q&A
- Key takeaways and mental model recap
- Recommended reading and tooling references
- Where the field is heading: multi-agent QA teams, visual regression agents, compliance agents
- Feedback form

---

## Key Takeaways

1. **Agentic ≠ magic** — agents are still grounded in reliable browser automation; the intelligence is in the orchestration layer.
2. **The Playwright CLI is the agent's eyes** — `codegen`, `show-trace`, and `PWDEBUG` make the gap between human and agent debugging much smaller.
3. **MCP is the glue** — `@playwright/mcp` gives any LLM client a standardised way to drive a real browser without custom wrappers.
4. **Self-healing is a strategy, not a feature** — it requires a locator memory and a review discipline.
5. **Skills are the unit of reusable agent behaviour** — a well-scoped skill with tight allowed-tools and a clear output contract is more valuable than a clever one-shot prompt.
6. **CI/CD is the finish line** — an agent that can't run headlessly in a pipeline is a prototype, not a solution.
