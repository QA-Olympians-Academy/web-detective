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
