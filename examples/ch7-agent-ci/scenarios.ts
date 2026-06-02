/**
 * CH7 — AGENT SCENARIOS
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

export const SCENARIOS: Scenario[] = [
  {
    name: 'auth-redirect',
    task: tasks.authRedirect(),
    critical: true,
  },
  {
    name: 'login-flow',
    task: tasks.loginFlow(),
    critical: true,
  },
  {
    name: 'product-search',
    task: tasks.productSearch('Electronics', 6),
    critical: true,
  },
  {
    name: 'full-ecommerce',
    task: tasks.fullEcommerce(),
    critical: true,
  },
]

/** Look up a scenario by name — used by the CLI runner */
export function findScenario(name: string): Scenario {
  const s = SCENARIOS.find(s => s.name === name)
  if (!s) {
    const valid = SCENARIOS.map(s => s.name).join(', ')
    throw new Error(`Unknown scenario "${name}". Valid values: ${valid}`)
  }
  return s
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
