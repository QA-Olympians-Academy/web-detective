// @ts-nocheck
/**
 * CH7 EXERCISE STUB — AGENT SCENARIOS
 *
 * This is the Chapter 7 exercise file. Implement the bodies live during the
 * workshop. For the full reference implementation, run `git checkout solutions`
 * and see SOLUTIONS.md.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Each scenario is one agent run: a goal string, a name for reporting,
 * and a 'critical' flag that determines whether failure blocks the pipeline.
 *
 * Separating scenarios from the runner means:
 *   • CI can run them in a matrix (parallel jobs, one per scenario)
 *   • You can add new test scenarios without touching pipeline YAML
 *   • Non-critical scenarios (exploratory checks) warn but don't fail the build
 */
import { tasks } from '../ch5-custom-agent/prompts'

export interface Scenario {
  /** Unique key — used as the matrix value in the GitHub Actions workflow */
  name: string
  /** High-level goal string passed to WebTestAgent.run() */
  task: string
  /**
   * If true, a failed run sets exit code 1 and blocks dependent jobs.
   * If false, failure emits a warning annotation but the pipeline continues.
   */
  critical: boolean
}

// TODO: populate with the workshop scenarios (auth-redirect, login-flow, …)
export const SCENARIOS: Scenario[] = []

/** Look up a scenario by name — used by the CLI runner */
export function findScenario(name: string): Scenario {
  throw new Error('TODO: implement in Chapter 7')
}

/**
 * WORKSHOP TASKS (Chapter 7 hands-on):
 *
 * Task A — Add a non-critical logout scenario and confirm it doesn't block the pipeline:
 *   First add a logout() task to examples/ch5-custom-agent/prompts.ts (see Task A there).
 *   Then add to SCENARIOS:
 *     { name: 'logout-flow', task: tasks.logout(), critical: false }
 *   Run --all and verify: if logout-flow fails, exit code is still 0.
 *
 * Task B — Run a single scenario from the CLI and observe the reporter output:
 *   npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario product-search
 *   Note the per-step log lines, the step summary table, and the JSON report written
 *   to ./agent-report.json. Open the file and inspect the structure.
 *
 * Task C — Change a critical scenario to optional and observe the exit code difference:
 *   Set product-search to critical: false.
 *   Modify tasks.productSearch() to assert an impossible count (e.g. 999 results).
 *   Run --all — confirm the pipeline exits 0 despite the failure, with a ⚠ warning.
 *   Flip critical back to true and re-run — confirm exit code becomes 1.
 *
 * Task D — Support prefix matching in findScenario for faster CLI use:
 *   Update findScenario to first try exact match, then fall back to prefix:
 *     SCENARIOS.find(s => s.name.startsWith(name))
 *   Verify: --scenario login resolves to login-flow, --scenario auth resolves to auth-redirect.
 *   What should happen if the prefix matches two scenarios?
 */
