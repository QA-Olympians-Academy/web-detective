# CLAUDE.md — web-detective

Workshop repo for **"Rise of the Web Agents"** — an 8-hour tutorial on agentic test automation
using Playwright, a local LLM (Ollama + DeepSeek-R1), MCP, and GitHub Actions.

---

## Development commands

```bash
# App
npm run dev          # start React app on http://localhost:5173
npm run build        # type-check + Vite production build

# Tests
npx playwright test                              # full suite
npx playwright test tests/auth.spec.ts --headed  # single file, headed
npx tsc --noEmit -p tsconfig.examples.json       # type-check all examples

# Chapter examples (requires a local Ollama server — see setup/local-llm-setup.md)
ollama serve &                       # if not already running (port 11434)
ollama pull deepseek-r1:8b           # one time, ~5 GB
npx tsx examples/ch5-custom-agent/agent.ts
npx tsx examples/ch4.1-playwright-agents/planner.ts
npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
npx tsx examples/ch7-agent-ci/agent-runner.ts --all

# Presentation rebuild
python3 build_presentation.py   # rewrites web-detective-workshop.pptx (82 slides)
```

---

## App credentials

```
URL:      http://localhost:5173
Email:    admin@shop.com
Password: password123
```

Routes: `/login` · `/dashboard` · `/products`

---

## TypeScript config

All chapter examples share `tsconfig.examples.json`:
- target: ES2022, module: CommonJS
- strict: true, noUnusedLocals: true, noUnusedParameters: true
- includes: `examples/` only

Never run `tsc` without `-p tsconfig.examples.json` for examples — the root `tsconfig.json` is for the React app only.

Run examples with `npx tsx` (not `ts-node`) — the repo is an ESM package and `ts-node` can't resolve the examples' relative imports on Node ≥20.

---

## Workshop chapter structure

| Chapter | Path | Key files |
|---------|------|-----------|
| Ch1 — Foundations | `examples/ch1-foundations/` | `brittle-test.spec.ts`, `task-graph.ts` |
| Ch2 — Browser Layer | `examples/ch2-execution-layer/` | `action-wrapper.ts`, `browser-session.ts` |
| Ch3 — MCP Server | `examples/ch3-mcp/` | `server.ts`, `playwright-mcp-client.ts` |
| Ch4 — Self-Healing | `examples/ch4-self-healing/` | `locator-store.ts`, `self-healer.ts` |
| Ch4.1 — Playwright Agents | `examples/ch4.1-playwright-agents/` | `planner.ts`, `healer.ts` |
| Ch5 — Custom Agent | `examples/ch5-custom-agent/` | `agent.ts`, `tools.ts`, `prompts.ts` |
| Ch6 — Skills | `.claude/skills/` | `pw-run/`, `pw-plan/`, `pw-self-heal/`, … |
| Ch7 — Agent CI | `examples/ch7-agent-ci/` | `agent-runner.ts`, `reporter.ts`, `scenarios.ts` |

---

## Claude Code skills

Invoke these inside Claude Code with `/skill-name [args]`:

| Skill | What it does |
|-------|--------------|
| `/pw-run [file\|grep]` | Run Playwright tests, report pass/fail, suggest fix on failure |
| `/pw-debug [file]` | Headed run + trace + root-cause diagnosis |
| `/pw-new-test [description]` | Scaffold spec + page object, run until green |
| `/pw-page-object [Name /route]` | Generate typed POM from React source |
| `/pw-self-heal [file]` | Ch4 selector-level healing via LocatorStore |
| `/pw-plan [feature]` | Ch4.1 Planner → Generator pipeline for new features |

All skill files are in `.claude/skills/<name>/SKILL.md`.

---

## Self-healing — two levels

- **Ch4 (`/pw-self-heal`)** — heals individual selector strings in `locator-store.ts`. Use for page objects and ongoing maintenance.
- **Ch4.1 (`/pw-plan` or `healer.ts`)** — rewrites entire failing `test()` blocks. Use for AI-generated specs in `tests/generated/`.

---

## CI / GitHub Actions

One workflow per chapter, triggered by `paths` filter. All run `npx tsc --noEmit -p tsconfig.examples.json` as the first job.

The Ch4.1 workflow has three jobs:
1. `type-check` — always runs
2. `plan-validation` — installs Playwright, starts dev server, validates planner + generator output
3. `pipeline-e2e` — full Planner → run → Healer → re-run loop, gated to `main` pushes only

Add `ANTHROPIC_API_KEY` as a repository secret to enable Ch5 and Ch7 agentic jobs.

---

## Scenario registry (Ch7)

Scenarios live in `examples/ch7-agent-ci/scenarios.ts` — **never in the workflow YAML**.
Adding a scenario = one object in `SCENARIOS[]`, no YAML change needed.

`critical: true` → failure sets exit code 1 (blocks merge).
`critical: false` → failure emits a warning annotation, exits 0.

---

## Presentation

`web-detective-workshop.pptx` — 82 slides covering all chapters.
Rebuild with `python3 build_presentation.py` (requires `pip install python-pptx`).

---

## Key invariants

- Always start the dev server (`npm run dev`) before running any chapter example or Playwright test.
- A local **Ollama** server (port 11434) with the model pulled must be running for any LLM-backed example (Ch4, Ch4.1, Ch5, Ch7). No API key — everything runs locally and free. See `setup/local-llm-setup.md`.
- `WORKSHOP_MODEL` overrides the model for all LLM-backed examples (default `deepseek-r1:8b`). Use `WORKSHOP_MODEL=deepseek-r1:1.5b` on low-RAM machines, or `WORKSHOP_MODEL=qwen2.5-coder:7b` for stronger JSON adherence in the agentic chapters. All LLM calls go through `examples/shared/ollama.ts`, which strips DeepSeek-R1's `<think>…</think>` output and parses JSON actions. The per-turn `tokens —` log shows Ollama's prompt/output token counts.
- DeepSeek-R1 has no native tool-calling, so Ch5/Ch7 use a **prompt-based JSON action protocol** (one `{ "tool", "input" }` object per turn), not provider tool schemas. There is no prompt caching (local inference).
- The `locators.json` file produced by Ch4 is gitignored — it is runtime state, not source.
- Generated specs in `tests/generated/` are intentionally imperfect; the Ch4.1 Healer cleans them up.
- Prefer ARIA selectors (`getByRole`, `getByLabel`, `getByText`) everywhere. No CSS or XPath selectors in new code.
