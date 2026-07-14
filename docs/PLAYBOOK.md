# Workshop Playbook — Rise of the Web Agents (8 hours)

**Instructor runbook.** Companion to [agenda.md](agenda.md) (the schedule) and
the chapter examples under [`examples/`](../examples). This document is what you
run the room from: prerequisites, pre-flight, a timed run-of-show, checkpoints,
and a troubleshooting table built from real failures.

**Format:** 8 hours (09:00–18:15) · 2 breaks + lunch · hands-on ·
**fully local, no cloud LLM key.** The agent, self-healing, and analysis all run
on **Ollama + DeepSeek-R1** locally. GitHub Copilot Agent Mode is an optional
add-on for the MCP and skills chapters.

---

## 0. Student prerequisites — MUST be done BEFORE the session

> The setup is heavy (a ~5 GB model download + Playwright browser binaries). The
> 30-minute in-session check is for **fixing stragglers, not first-time
> installs.** Send this section 4–5 days ahead. A student who arrives having
> *not* completed and **verified** the checklist cannot do the hands-on labs.

### 0.1 Hardware & OS
- **macOS (Apple Silicon or Intel), Linux, or Windows + WSL2.**
- **≥ 16 GB RAM recommended** (`deepseek-r1:8b` is ~5 GB and runs locally). 8 GB
  works but is slow on CPU; on <8 GB use `llama3.2:3b` (set `WORKSHOP_MODEL`).
- **~15 GB free disk** (DeepSeek-R1 ~5 GB, Playwright browsers ~1 GB, node_modules,
  optional llama3.1 ~4.9 GB for the Ch4 healer).
- Any **NVIDIA / Apple-Silicon GPU** makes Ollama much faster (used automatically).
- A **GitHub account** (for the CI chapter; read access is enough).

### 0.2 Toolchain to install (with verify commands)

| Tool | Install | Verify (must succeed) |
|------|---------|----------------------|
| Node.js 20+ (LTS) | [nodejs.org](https://nodejs.org) | `node -v` |
| Git | [git-scm.com](https://git-scm.com) | `git --version` |
| Ollama | macOS: `brew install ollama` · Linux: `curl -fsSL https://ollama.com/install.sh \| sh` · Windows: installer | `ollama --version` |
| VS Code | [code.visualstudio.com](https://code.visualstudio.com) | opens |
| GitHub Copilot (Agent Mode) | VS Code Extensions → *GitHub Copilot* | Copilot chat responds |
| Claude Code *(or another AI CLI)* | `npm i -g @anthropic-ai/claude-code` | `claude --version` |
| Docker Engine *(CI chapter only)* | [docker.com](https://docker.com) | `docker --version` |

> **No Anthropic/OpenAI key is needed anywhere in the hands-on labs** — every
> LLM-backed example talks to your local Ollama server. `ANTHROPIC_API_KEY` is
> only relevant if you later enable the *cloud-agent* variant of the Ch5/Ch7 CI
> jobs; the local path is the default and is free.

### 0.3 Pull the local model (large download — do this on good Wi-Fi)
```bash
# Ollama listens on port 11434. macOS/Windows installers start it automatically;
# on Linux (or if the port is refused) run `ollama serve &` in a spare terminal.
curl -s http://localhost:11434/api/tags >/dev/null && echo "✓ ollama up"

ollama pull deepseek-r1:8b        # ~5 GB — the reasoning/agent model
ollama pull llama3.1:latest       # ~4.9 GB — REQUIRED for the Ch4 self-healer
ollama list                       # must show deepseek-r1:8b and llama3.1
```
> **Why two models?** DeepSeek-R1 drives most chapters, but the **Ch4
> self-healer must use `llama3.1`** — DeepSeek-R1 spends its whole token budget
> inside `<think>…</think>` and returns no selector JSON, so no candidates are
> produced. See §4 (14:15 block) and the troubleshooting table.
>
> Quick sanity chat (expect a coherent answer, possibly after a `<think>` block):
> `ollama run deepseek-r1:8b "In one sentence, what is a Playwright locator?"` → `/bye`

### 0.4 Clone, install, and add Playwright browsers
```bash
git clone https://github.com/QA-Olympians-Academy/web-detective.git
cd web-detective
npm install
npx playwright install            # downloads Chromium/Firefox/WebKit (~1 GB)
```

### 0.5 (Optional) Point Continue / Copilot at the local model
For the inline-assistant exercises, the Continue VS Code extension can use the
same Ollama endpoint — see [setup/local-llm-setup.md](../setup/local-llm-setup.md).
This is optional; the runnable examples don't need it.

### 0.6 ✅ Pre-flight smoke test (the gate — students screenshot the result)
```bash
# 1. dev server up (leave it running in its own terminal all day)
npm run dev &                     # → http://localhost:5173
sleep 3 && curl -s http://localhost:5173 >/dev/null && echo "✓ app up"

# 2. local model responds
curl -s http://localhost:11434/api/tags >/dev/null && echo "✓ ollama up"

# 3. examples type-check (uses the examples-only tsconfig)
npx tsc --noEmit -p tsconfig.examples.json && echo "✓ examples type-check"

# 4. the Playwright suite runs and the app is reachable (some tests may fail — fine)
npx playwright test
```
**Green condition:** app at `:5173`, Ollama up, `tsc` clean, and
`npx playwright test` **starts and drives the browser** (a few assertions may
fail — the point is the stack works). Students should arrive at this state.

**App credentials** (used all day):
```
URL: http://localhost:5173   ·   admin@shop.com / password123
Routes: /login · /dashboard · /products
```

---

## 1. Instructor pre-flight (day-of, ~30 min before)

- [ ] Your own machine passes the entire §0 checklist.
- [ ] `ollama serve` running; `ollama list` shows **both** `deepseek-r1:8b` and `llama3.1`.
- [ ] `npm run dev` up at `:5173`; log in with `admin@shop.com / password123` once.
- [ ] `npx playwright test` runs; note which specs pass/fail so live demos are predictable.
- [ ] **Ch4 heal dry-run** works: `WORKSHOP_MODEL=llama3.1:latest npx tsx examples/ch4-self-healing/run-healer.ts`
      returns clean selector JSON and patches a broken locator (see §4).
- [ ] **Ch4.1 pipeline dry-run**: `npx tsx examples/ch4.1-playwright-agents/planner.ts` produces a plan.
- [ ] **Ch5 agent dry-run**: `npx tsx examples/ch5-custom-agent/agent.ts` completes one scenario.
- [ ] **Ch7 dry-run**: `npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow` exits 0.
- [ ] Projector font ≥ 16pt; terminal + editor + browser window arranged.
- [ ] A clean git branch / `git stash` ready so you can reset demo edits between runs.
- [ ] Offline fallback: pre-recorded clips of the heal loop and the agentic run,
      in case conference Wi-Fi dies (the models are local, but npm/clone aren't).

---

## 2. Run-of-show (8 hours)

| Time | Block | Mode | Checkpoint |
|------|-------|------|-----------|
| 09:00 | Welcome & environment check | Talk + hands-on | ✅ everyone green on §0.6 |
| 09:30 | **Ch1 — Foundations** (brittle test → task graph) | Talk + hands-on | ✅ ran `task-graph.ts` |
| 10:45 | *Break (15)* | — | — |
| 11:00 | **Ch2 — Execution layer** + Playwright CLI deep-dive | Hands-on | ✅ ran an action-wrapper flow |
| 12:30 | *Lunch (45)* | — | — |
| 13:15 | **Ch3 — Build your own MCP server** | Hands-on | ✅ agent drove the app via MCP |
| 14:15 | **Ch4 — Self-healing selectors** (llama3.1) | Hands-on | ✅ everyone saw a heal go green |
| 15:00 | **Ch4.1 — Playwright agents** (Planner/Generator/Healer) | Hands-on | ✅ ran the planner → generator |
| 15:30 | *Break (15)* | — | — |
| 15:45 | **Ch5 — Custom AI agent** (observe→plan→act→verify→learn) | Hands-on | ✅ ran a multi-step scenario |
| 16:30 | **Ch6 — Effective testing skills** | Hands-on | ✅ authored/invoked a skill |
| 17:00 | **Ch7 — Agent on CI** (reporter · scenarios · Actions) | Hands-on | ✅ `--all` ran; annotation seen |
| 18:00 | Q&A, wrap-up & next steps | Talk | — |

### Block detail & instructor cues

**09:00 — Welcome & env check (30 min).** Do *not* teach installation. Run §0.6
live; walk the room. Gate: every student shows the app at `:5173`, Ollama up, and
a running `npx playwright test`. Pair anyone stuck with a neighbour; if >2 are
red, use a spare pre-configured machine. 60-second app tour: `/login` →
`/dashboard` → `/products`.

**09:30 — Ch1 Foundations (75 min).** Open [examples/ch1-foundations/brittle-test.spec.ts](../examples/ch1-foundations/brittle-test.spec.ts)
and hunt failure modes (the `waitForTimeout(2000)` is the headline). Then map the
same login flow to the agentic task graph:
```bash
npx tsx examples/ch1-foundations/task-graph.ts
```
Land the observe→plan→act→verify→learn loop and the preconditions idea (why
`submitCredentials` can't run before `navigateToLogin`). Use the three agenda
questions to drive discussion.

**11:00 — Ch2 Execution layer (90 min).** Playwright as a controllable action
toolkit, not a runner. Run the instrumented flow and read the structured logs:
```bash
npx tsx examples/ch2-execution-layer/run-exercises.ts
```
Walk [action-wrapper.ts](../examples/ch2-execution-layer/action-wrapper.ts) (the
`navigate/click/fill/assert` vocabulary + `snapshot()`) and
[browser-session.ts](../examples/ch2-execution-layer/browser-session.ts)
(retries/timeouts). **Embedded CLI deep-dive (~30 min)** — everyone runs:
```bash
npx playwright codegen http://localhost:5173/login   # observe selector choices
npx playwright test --ui                             # timeline + watch mode
npx playwright show-trace                            # step through a saved trace
```
Teaching point: `codegen`, `show-trace`, and `PWDEBUG=1` are the agent's eyes.

**13:15 — Ch3 MCP server (60 min).** Scaffold and inspect the custom server
[examples/ch3-mcp/server.ts](../examples/ch3-mcp/server.ts) (tool surface +
schema), then the client [playwright-mcp-client.ts](../examples/ch3-mcp/playwright-mcp-client.ts):
```bash
npx tsx examples/ch3-mcp/server.ts &                 # start the MCP server
npx tsx examples/ch3-mcp/playwright-mcp-client.ts    # drive the app through it
```
Optionally wire the **official `@playwright/mcp`** to Copilot Agent Mode / Claude
Code and drive the app in plain English ("Log in with admin credentials and
verify the dashboard loads"). Contrast a hand-written test vs. the MCP-driven
assertion. Teaching point: the shared `AgentBrowserSession` is single-client —
name what breaks with two clients.

**14:15 — Ch4 Self-healing (45 min) — first centrepiece.** Live break→heal.
**Use llama3.1, not DeepSeek-R1:**
```bash
# 1. break a selector in a page object / locator store (rename to a wrong value)
# 2. run the healer (local llama3.1, no key):
WORKSHOP_MODEL=llama3.1:latest npx tsx examples/ch4-self-healing/run-healer.ts
```
Narrate what scrolls by: *detect the genuinely-failed selector → read the page's
current DOM/a11y tree → ask llama3.1 for ranked candidates → validate (safe
string, resolves to exactly one element, only the failing selector) → apply →
retry.* Review the persistent locator memory afterwards.

> **Teaching point:** the model is non-deterministic (8B). The value isn't a
> perfect model — it's the **guardrails**: it only patches a selector that
> failed, only if the replacement is valid and its target actually exists in the
> captured DOM. A bad suggestion is rejected, never applied. Run it twice to show
> the retry loop absorbing format variance. **`locators.json` is gitignored** —
> it's runtime state, not source.

**15:00 — Ch4.1 Playwright agents (30 min).** Higher level than Ch4: these rewrite
whole `test()` blocks, not selector strings.
```bash
npx tsx examples/ch4.1-playwright-agents/planner.ts   # explore app → plan in specs/
# generator emits tests/generated/*.spec.ts (intentionally imperfect)
npx tsx examples/ch4.1-playwright-agents/healer.ts     # run → repair broken blocks → re-run
```
Or drive the whole pipeline with the **`/pw-plan`** skill. Land the Ch4-vs-Ch4.1
distinction: *rename a button "Submit"→"Save"* is a **Ch4.1 Healer** job
(test-block rewrite), not a Ch4 selector heal.

**15:45 — Ch5 Custom agent (45 min) — second centrepiece.** Build the full
reasoning loop and run a multi-step e-commerce scenario end-to-end:
```bash
npx tsx examples/ch5-custom-agent/agent.ts            # login → search → checkout → confirm
```
Walk [tools.ts](../examples/ch5-custom-agent/tools.ts) (tool registry, incl.
`done()` as a tool) and [prompts.ts](../examples/ch5-custom-agent/prompts.ts).
Teaching point: DeepSeek-R1 has **no native tool-calling**, so the loop uses a
prompt-based JSON action protocol (`{ "tool", "input" }`), parsed by
`extractJson` in [examples/shared/ollama.ts](../examples/shared/ollama.ts) with a
"not a valid action" retry. Tune the system prompt live to fix an off-track
navigation.

**16:30 — Ch6 Skills (30 min).** Skills = reusable, parameterised prompts. Open
the shipped ones in [.claude/skills/](../.claude/skills) (`pw-run`, `pw-debug`,
`pw-new-test`, `pw-page-object`, `pw-self-heal`, `pw-plan`). Have students author
a `debug-test`-style skill: frontmatter (`name`, `description`, `argument-hint`,
`allowed-tools`), context injection via `` !`npx playwright test --reporter=line` ``,
a tight output contract. Invoke against a broken test. Teaching point: live test
output beats pasted output; `allowed-tools` keeps skills fast and auditable.

**17:00 — Ch7 Agent on CI (60 min).** Make the Ch5 agent production-grade.
- *Part A — reporter (~20 min):* walk [reporter.ts](../examples/ch7-agent-ci/reporter.ts);
  show `::error`/`::warning`/`::notice`, `$GITHUB_STEP_SUMMARY`, `$GITHUB_OUTPUT`.
- *Part B — scenarios (~25 min):*
  ```bash
  npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
  npx tsx examples/ch7-agent-ci/agent-runner.ts --all
  ```
  Add a scenario to [scenarios.ts](../examples/ch7-agent-ci/scenarios.ts) with
  `critical: false`; flip it to `true` and watch the exit code change
  (0 = pass/non-critical, 1 = critical failure). **Scenarios live in the
  registry, never in YAML.**
- *Part C — Actions (~15 min):* walk [.github/workflows/ch7-agent-ci.yml](../.github/workflows/ch7-agent-ci.yml);
  the agent matrix is gated to `main`, standard Playwright runs on every PR;
  `fail-fast: false`; per-scenario `agent-report.json` + trace artifacts.

**18:00 — Q&A & wrap-up (15 min).** Recap the 7 takeaways from the agenda:
agents are grounded in reliable automation; the CLI is the agent's eyes; MCP is
the glue; self-healing is a strategy (memory + review discipline); skills are the
unit of reusable behaviour; scenarios are the unit of CI coverage; CI is the
finish line.

---

## 3. Checkpoints (don't advance the room past a red one)

1. **09:30** — app at `:5173`, Ollama up, `npx playwright test` runs for everyone.
2. **12:30** — everyone ran an action-wrapper flow and opened a trace.
3. **15:30** — everyone watched (or ran) a **selector heal** go green.
4. **17:00** — everyone ran the custom agent through a multi-step scenario.
5. **18:00** — everyone ran `agent-runner --all` and saw a CI-style report.

---

## 4. Troubleshooting (hit while building the workshop)

| Symptom | Cause | Fix |
|---------|-------|-----|
| `tsc` errors on examples | ran without the examples config | always `npx tsc --noEmit -p tsconfig.examples.json` — the root `tsconfig.json` is the React app only |
| `ts-node` can't resolve imports | ESM package | run examples with **`npx tsx`**, never `ts-node` |
| Ch4 healer returns empty / "no candidates" | DeepSeek-R1 burns its budget inside `<think>…</think>` | use **`WORKSHOP_MODEL=llama3.1:latest`** for the healer |
| LLM call hangs / very slow | first load into RAM, or low RAM | pre-`ollama run <model>` once; close other apps; on <8 GB use `llama3.2:3b` |
| `connection refused :11434` | Ollama server not running | `ollama serve &`; verify `curl http://localhost:11434/api/tags` |
| Model not found | not pulled | `ollama pull deepseek-r1:8b` (and `llama3.1:latest` for Ch4) |
| Tests can't reach the app | dev server not running | `npm run dev` must be up at `:5173` **before** any example or test |
| `browserType.launch: Executable doesn't exist` | Playwright browsers missing | `npx playwright install` |
| Agent emits prose instead of a JSON action | 8B format non-determinism | expected occasionally; `extractJson` + the "not a valid action" retry recover — re-run |
| Healer patches a wrong selector | model hallucinated a value | it won't apply — the DOM/uniqueness guard rejects targets not in the snapshot |
| `locators.json` shows up in `git status` | expected | it's **gitignored** runtime state, not source — don't commit it |
| Ch4.1 generated spec fails on first run | intentional | that's the Healer's job — run `healer.ts` to clean it up |
| Copilot/Continue not using local model | pointed at cloud | point config at `http://localhost:11434` — see [setup/local-llm-setup.md](../setup/local-llm-setup.md) |

### CI-only gotchas (Ch7 / GitHub Actions)
| Symptom | Fix |
|---------|-----|
| Agentic jobs never trigger on a PR | by design — the agent matrix is gated to `main`; standard Playwright runs on PRs |
| One matrix scenario fails and kills the rest | set `fail-fast: false` (already set) so all scenarios finish |
| Non-critical failure blocks merge | check the scenario's `critical` flag — `false` emits a `::warning` and exits 0 |
| Adding a scenario needs a YAML edit | it doesn't — add one object to `SCENARIOS[]` in `scenarios.ts` |
| Missing key for a cloud-agent CI variant | add `ANTHROPIC_API_KEY` as a repo secret (only for the optional cloud path; local Ollama needs none) |

---

## 5. One-shot student setup script (share as `setup.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "checks:"; node -v; git --version; ollama --version

# models
curl -s http://localhost:11434/api/tags >/dev/null || { echo "starting ollama"; ollama serve & sleep 3; }
ollama list | grep -q deepseek-r1:8b || ollama pull deepseek-r1:8b
ollama list | grep -q llama3.1       || ollama pull llama3.1:latest

# repo
[ -d web-detective ] || git clone https://github.com/QA-Olympians-Academy/web-detective.git
cd web-detective
npm install
npx playwright install

# type-check the examples
npx tsc --noEmit -p tsconfig.examples.json

echo "✅ prerequisites satisfied — run 'npm run dev' then 'npx playwright test' to finish the smoke test"
```

---

## 6. What "success" looks like at 18:15
- Every student ran the Playwright suite against the local React app.
- Every student drove the browser through **both** a custom MCP server and at
  least one **agentic loop** on **local DeepSeek-R1** — no cloud key.
- Every student watched (or ran) a **self-heal** turn a broken selector green
  (Ch4, llama3.1) and a **test-block heal** (Ch4.1).
- Every student authored and invoked a **skill**, and ran the agent under a
  **CI-style scenario runner** with structured output.
- The class understands the guardrail model — *the LLM proposes, the validators
  dispose* — and where each piece plugs into CI.
```
