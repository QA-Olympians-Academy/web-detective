/**
 * CH7 — CI-READY AGENT RUNNER
 *
 * Entry point for both local runs and GitHub Actions matrix jobs.
 *
 * Usage:
 *   # Run a single scenario (used by GitHub Actions matrix):
 *   npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
 *
 *   # Run all scenarios sequentially (local / smoke test):
 *   npx tsx examples/ch7-agent-ci/agent-runner.ts --all
 *
 *   # List available scenarios:
 *   npx tsx examples/ch7-agent-ci/agent-runner.ts --list
 *
 * Exit codes:
 *   0  — all critical scenarios passed
 *   1  — one or more critical scenarios failed
 *   2  — configuration error (bad arg, Ollama/model not available)
 */
import { WebTestAgent } from '../ch5-custom-agent/agent'
import { SCENARIOS, findScenario, type Scenario } from './scenarios'
import { CIReporter } from './reporter'
import { checkOllama } from '../shared/ollama'

// ── CLI argument parsing ───────────────────────────────────────────────────────

function parseArgs(): { mode: 'single'; name: string } | { mode: 'all' } | { mode: 'list' } {
  const args = process.argv.slice(2)

  if (args.includes('--list')) return { mode: 'list' }
  if (args.includes('--all'))  return { mode: 'all' }

  const idx = args.indexOf('--scenario')
  if (idx !== -1 && args[idx + 1]) return { mode: 'single', name: args[idx + 1] }

  console.error('Usage: agent-runner.ts --scenario <name> | --all | --list')
  process.exit(2)
}

// ── Runner ─────────────────────────────────────────────────────────────────────

async function runScenario(
  agent: WebTestAgent,
  reporter: CIReporter,
  scenario: Scenario,
): Promise<void> {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Running: ${scenario.name} [${scenario.critical ? 'critical' : 'optional'}]`)
  console.log('─'.repeat(60))

  const result = await agent.run(scenario.task)

  reporter.record({
    name:       scenario.name,
    passed:     result.passed,
    summary:    result.summary,
    toolCalls:  result.toolCalls,
    durationMs: result.durationMs,
    critical:   scenario.critical,
  })

  const icon = result.passed ? '✓' : '✗'
  console.log(`\n${icon} ${scenario.name}: ${result.passed ? 'PASSED' : 'FAILED'} (${result.durationMs}ms, ${result.toolCalls} steps)`)
  if (!result.passed) {
    console.log(`  ↳ ${result.summary}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

void (async () => {
  const args = parseArgs()

  if (args.mode === 'list') {
    console.log('\nAvailable scenarios:\n')
    for (const s of SCENARIOS) {
      console.log(`  ${s.name.padEnd(20)} ${s.critical ? '[critical]' : '[optional]'}`)
    }
    process.exit(0)
  }

  // Config check: the agent needs a local Ollama server with the model pulled.
  const ollamaStatus = await checkOllama()
  if (!ollamaStatus.ok) {
    console.error(`Error: ${ollamaStatus.error}`)
    process.exit(2)
  }

  const reporter = new CIReporter()
  const agent    = new WebTestAgent()

  const toRun: Scenario[] = args.mode === 'all'
    ? SCENARIOS
    : [findScenario(args.name)]

  for (const scenario of toRun) {
    await runScenario(agent, reporter, scenario)
  }

  // ── Finalise ────────────────────────────────────────────────────────────────

  await reporter.writeStepSummary()
  reporter.setOutputs()
  reporter.writeReport('./agent-report.json')

  const code = reporter.exitCode()
  console.log(`\nExit code: ${code} (${code === 0 ? 'all critical scenarios passed' : 'critical failure'})`)
  process.exit(code)
})()

/**
 * WORKSHOP TASKS (Chapter 7 hands-on):
 *
 * Task A — Run a single scenario locally (requires a local Ollama server):
 *   npx tsx examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
 *
 * Task B — List all scenarios, then run all:
 *   npx tsx examples/ch7-agent-ci/agent-runner.ts --list
 *   npx tsx examples/ch7-agent-ci/agent-runner.ts --all
 *
 * Task C — Add a new scenario to scenarios.ts and watch it appear in --list
 *   without changing this file or the workflow YAML.
 *
 * Task D — Push to main and watch the GitHub Actions matrix run each scenario
 *   as a separate parallel job, then inspect the Step Summary table.
 */
