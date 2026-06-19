// @ts-nocheck
/**
 * CH7 EXERCISE STUB — CI-READY AGENT RUNNER
 *
 * This is the Chapter 7 exercise file. Implement the bodies live during the
 * workshop. For the full reference implementation, run `git checkout solutions`
 * and see SOLUTIONS.md.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Entry point for both local runs and GitHub Actions matrix jobs.
 *
 * Usage:
 *   # Run a single scenario (used by GitHub Actions matrix):
 *   npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
 *
 *   # Run all scenarios sequentially (local / smoke test):
 *   npx ts-node examples/ch7-agent-ci/agent-runner.ts --all
 *
 *   # List available scenarios:
 *   npx ts-node examples/ch7-agent-ci/agent-runner.ts --list
 *
 * Exit codes:
 *   0  — all critical scenarios passed
 *   1  — one or more critical scenarios failed
 *   2  — configuration error (bad arg, missing API key)
 */
import { WebTestAgent } from '../ch5-custom-agent/agent'
import { SCENARIOS, findScenario, type Scenario } from './scenarios'
import { CIReporter } from './reporter'

// ── CLI argument parsing ───────────────────────────────────────────────────────

function parseArgs(): { mode: 'single'; name: string } | { mode: 'all' } | { mode: 'list' } {
  throw new Error('TODO: implement in Chapter 7')
}

// ── Runner ─────────────────────────────────────────────────────────────────────

async function runScenario(
  agent: WebTestAgent,
  reporter: CIReporter,
  scenario: Scenario,
): Promise<void> {
  throw new Error('TODO: implement in Chapter 7')
}

// ── Main ───────────────────────────────────────────────────────────────────────

void (async () => {
  throw new Error('TODO: implement in Chapter 7')
})()

/**
 * WORKSHOP TASKS (Chapter 7 hands-on):
 *
 * Task A — Run a single scenario locally:
 *   ANTHROPIC_API_KEY=sk-... npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
 *
 * Task B — List all scenarios, then run all:
 *   npx ts-node examples/ch7-agent-ci/agent-runner.ts --list
 *   ANTHROPIC_API_KEY=sk-... npx ts-node examples/ch7-agent-ci/agent-runner.ts --all
 *
 * Task C — Add a new scenario to scenarios.ts and watch it appear in --list
 *   without changing this file or the workflow YAML.
 *
 * Task D — Push to main and watch the GitHub Actions matrix run each scenario
 *   as a separate parallel job, then inspect the Step Summary table.
 */
