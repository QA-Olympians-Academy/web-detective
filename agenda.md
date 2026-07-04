# Rise of the Web Agents
## Crafting AI-Driven Testers for Modern Web Apps

> **Full-day advanced tutorial** · 8 hours · Target: Senior QA Engineers, SDETs, Test Automation Architects

---

## What You Will Build

By end of day, you will have a working end-to-end agentic workflow in which an AI agent:
- Performs real-time browser UI testing via Playwright
- Auto-generates test code from high-level prompts
- Self-heals broken selectors at runtime
- Runs on a local LLM (Ollama + DeepSeek-R1) with no API key, and/or GitHub Copilot Agent Mode
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
| Node.js (LTS) | Runtime for Playwright |
| Git + GitHub account | Repo access and Copilot integration |
| Playwright | Primary automation framework + execution layer + MCP server |
| Ollama + DeepSeek-R1 (`deepseek-r1:8b`) | Local LLM for agent reasoning — no API key (see `setup/local-llm-setup.md`) |
| TypeScript and/or Python | Scripting language |
| Docker Engine | Containerised CI/CD execution |

---

## Schedule

### 09:00 – 09:30 · Welcome & Environment Check *(30 min)*

- Workshop goals and structure overview
- Validate toolchain: Node, Playwright, Ollama + DeepSeek-R1, Docker, Claude Code
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

**Questions**
1. The brittle test uses `await page.waitForTimeout(2000)` — what specific problem does this mask, and what should replace it?
2. Which of the five agentic phases (observe / plan / act / verify / learn) is absent from a traditional Playwright test, and why does its absence matter?
3. `loginTaskGraph` has three tasks with preconditions. What happens if `submitCredentials` runs before `navigateToLogin` completes — and how does the task graph prevent it?

---

### ☕ 10:45 – 11:00 · Break *(15 min)*

---

### 11:00 – 12:30 · Chapter 2 — Playwright as the Execution Layer *(90 min)*

**Concepts**
- Treating Playwright as a controllable action toolkit — not a test runner
- Extracting and interpreting page source (DOM, a11y tree, screenshots) for LLM reasoning
- Mapping agentic actions to browser commands: a consistent action vocabulary
- Building a fault-tolerant session for autonomous agents (retries, timeouts, state recovery)

**Hands-on**
- Instrument a Playwright session to emit structured action logs
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

**Questions**
1. `ActionWrapper.snapshot()` returns both the accessibility tree and a screenshot. When would an LLM need the screenshot and when is the a11y tree alone sufficient?
2. `navigateWithRetry` multiplies the delay by the attempt number (`retryDelayMs * attempt`). Is this true exponential back-off? What would genuine exponential back-off look like and when would you prefer it?
3. The `ActionResult` interface captures `durationMs` for every action. Name two concrete ways an agent could use this timing data to improve future runs.

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

**Questions**
1. The custom MCP server keeps a single shared `AgentBrowserSession` across all tool calls. What breaks if two AI clients connect simultaneously, and how would you fix it?
2. `browser_snapshot` returns an accessibility tree while `browser_screenshot` returns a PNG. For a products-table assertion (count rows, read cell values), which tool is faster and cheaper — and why?
3. A tool schema marks `selector` as `required` for `browser_click`. What error would the MCP server return if the LLM omits it, and where in the server code does that validation happen?

---

### 14:15 – 15:00 · Chapter 4 — Self-Healing Selectors *(45 min)*

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

**Questions**
1. `LocatorStore.heal()` promotes the new selector to primary and demotes the old one to `fallbacks`. When should the healer try the fallbacks before asking the LLM for new candidates?
2. The LLM prompt asks for "3-5 alternative selectors ordered by stability". What makes a selector *stable* and how could you score stability without running the tests?
3. `healCount` tracks how many times a locator has been replaced. At what threshold would you flag a locator for manual review instead of auto-healing it again?

---

### 15:00 – 15:30 · Chapter 4.1 — Playwright Agents: Planner, Generator, Healer *(30 min)*

> Playwright ships three built-in AI agents that operate at a higher level than the selector healer in Chapter 4 — they generate and repair entire test files, not individual locator strings.

**Concepts**
- The three built-in agents and their roles:
  - **Planner** — explores the running app via the accessibility tree, produces a structured Markdown test plan in `specs/`
  - **Generator** — reads the plan, emits runnable TypeScript Playwright test files into `tests/`, verifying selectors live as it generates
  - **Healer** — runs the suite, replays failing steps, inspects the current UI, rewrites broken `test()` blocks, and re-runs until green
- Initialising agents with `npx playwright init-agents --loop=claude` and the generated `.github/` agent definitions
- Seed tests: why the Planner runs one before exploring — bootstrapping fixtures, global setup, and auth state
- How this differs from Chapter 4: selector-level healing vs. test-block rewriting

**Hands-on**
- Initialise Playwright agents and inspect the generated agent definitions
- Run `TestPlannerAgent` against the demo app; review `specs/web-detective.md` before committing
- Run `TestGeneratorAgent`; compare `tests/generated/web-detective.spec.ts` with hand-written `tests/auth.spec.ts`
- Introduce a deliberate failure in the generated test, run `TestHealerAgent`, and observe the multi-round repair loop
- Use the `/pw-plan` skill to drive the full pipeline from a single command

**Questions**
1. The Planner runs a seed test before navigating the app. What does the seed test actually bootstrap — and what would happen if the Planner navigated to `http://localhost:5173` without it?
2. The Generator is explicitly allowed to emit tests that contain errors, leaving them for the Healer to fix. Why is it preferable to allow imperfect generation rather than requiring the Generator to produce passing tests on the first attempt?
3. A button is renamed from "Submit" to "Save" after the tests were generated. The Chapter 4 `SelfHealingAgent` and the Chapter 4.1 `TestHealerAgent` are both available. Which one is the right tool for this failure, and why can't the other one help?

---

### ☕ 15:30 – 15:45 · Break *(15 min)*

---

### 15:45 – 16:30 · Chapter 5 — Building Your Own Custom AI Agent *(45 min)*

**Concepts**
- Designing the full reasoning loop: observe → plan → act → verify → learn
- Defining tools for UI interaction, invariant checking, and navigation
- Prompt engineering for deterministic and repeatable browser behaviour
- Swapping the underlying local model via Ollama (`WORKSHOP_MODEL`) without rewriting agent logic

**Hands-on**
- Build a minimal agent class with a tool registry and a planning prompt
- Wire it to the Playwright execution layer from Chapter 2
- Run a multi-step e-commerce scenario (login → search → checkout → confirm) driven entirely by the agent
- Tune the system prompt to fix a hallucination or off-track navigation

**Questions**
1. The system prompt says "Always call `snapshot()` first to understand page state — never guess selectors." What failure mode does this guard against, and what would you observe in the tool call log if the agent ignored this rule?
2. `done()` is a regular tool in the registry rather than a hard loop exit. What is the advantage of this design, and what would break if you replaced it with a simple `return` from inside `loop()`?
3. DeepSeek-R1 has no native tool-calling, so the agent asks the model to reply with a single JSON action (`{ "tool", "input" }`) which the loop parses. What are two ways this prompt-based protocol can fail that a provider's native tool-calling would prevent — and how does the agent's parser (`extractJson` in `examples/shared/ollama.ts`, plus the "not a valid action" retry) defend against them?

---

### 16:30 – 17:00 · Chapter 6 — Creating Effective Testing Skills *(30 min)*

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

**Questions**
1. The `/pw-debug` skill injects live test output via `` !`npx playwright test --reporter=line` `` before the LLM sees the prompt. Why does running the tests inside the skill (rather than pasting output manually) produce better diagnoses?
2. `allowed-tools` in a skill's frontmatter restricts which tools the agent may call. What is the security and correctness argument for limiting `/pw-new-test` to only `Read`, `Edit`, `Write`, and `Bash`?
3. A skill with no `argument-hint` field still works when invoked with an argument. What is the purpose of `argument-hint` then, and who benefits from it?

---

### 17:00 – 18:00 · Chapter 7 — Implementing an Agent & Running on CI *(60 min)*

> This chapter takes the agent from Chapter 5 and makes it production-grade: structured output, GitHub Actions annotations, parallel scenario matrix, and artifact-based post-mortem.

**Concepts**

*Making the agent CI-ready*
- Exit codes as the CI contract: 0 = all critical scenarios passed, 1 = critical failure, 2 = config error
- Separating scenario definitions from the runner — add tests without touching pipeline YAML
- The `critical` flag: hard failures vs. warnings that don't block the pipeline
- GitHub Actions workflow commands: `::error`, `::warning`, `::notice` annotations surfaced inline in PR diffs
- Writing to `$GITHUB_STEP_SUMMARY` — a Markdown table visible directly in the Actions UI
- Setting job outputs via `$GITHUB_OUTPUT` for downstream job consumption

*Pipeline architecture*
```
playwright (every push/PR)
    └── agentic matrix (main only, parallel per scenario)
    │       ├── auth-redirect
    │       ├── login-flow
    │       ├── product-search
    │       └── full-ecommerce
    └── locator-health (every push/PR)
```
- `fail-fast: false` — let all matrix jobs finish even if one fails
- Artifact upload per scenario: `agent-report.json` + trace zip
- Cost management: agent matrix gated to `main`; standard Playwright runs on every PR

**Hands-on**

*Part A — CI reporter (20 min)*
- Walk through [examples/ch7-agent-ci/reporter.ts](examples/ch7-agent-ci/reporter.ts)
- Add a new annotation type and verify it appears locally
- Inspect how `$GITHUB_STEP_SUMMARY` and `$GITHUB_OUTPUT` are written

*Part B — Scenario runner (25 min)*
- Run a single scenario with the CLI: `--scenario login-flow`
- Add a new scenario to [examples/ch7-agent-ci/scenarios.ts](examples/ch7-agent-ci/scenarios.ts) with `critical: false`
- Run `--all` and observe the per-scenario pass/fail output and JSON report
- Flip the new scenario's `critical` flag and observe the exit code change

*Part C — GitHub Actions pipeline (30 min)*
- Walk through [.github/workflows/agentic-tests.yml](.github/workflows/agentic-tests.yml) section by section
- Push a change to `main` and watch the matrix jobs run in parallel
- Open the Step Summary tab — inspect the Markdown table of scenario results
- Download the `agent-report-login-flow` artifact and inspect the JSON
- Deliberately break a selector and re-push: observe the `::error` annotation appear in the PR diff

**Questions**
1. The pipeline uses `fail-fast: false` on the agentic matrix. Under what circumstances would you change this to `fail-fast: true`, and what is the cost of doing so?
2. `CIReporter.annotation()` emits `::error` for critical failures and `::warning` for non-critical ones. GitHub renders these annotations inline in PR diffs. Why would a `::notice` annotation be a poor choice for a broken selector?
3. The agent matrix only runs on `main`, while standard Playwright tests run on every push and PR. What is the tradeoff this architecture makes, and how would you structure a middle ground (e.g. run agents on PRs to `main` only)?

---

### 18:00 – 18:15 · Q&A, Wrap-up & Next Steps *(15 min)*

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
6. **Scenarios are the unit of CI coverage** — each agent scenario should have a `critical` flag, a name, and live in a registry separate from the runner code.
7. **CI/CD is the finish line** — an agent that can't run headlessly in a pipeline, emit structured output, and surface failures as annotations is a prototype, not a solution.
