// @ts-nocheck
/**
 * CH7 EXERCISE STUB — CI REPORTER
 *
 * This is the Chapter 7 exercise file. Implement the bodies live during the
 * workshop. For the full reference implementation, run `git checkout solutions`
 * and see SOLUTIONS.md.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Translates agent run results into GitHub Actions-native output:
 *
 *   • Workflow annotations  — surfaces failures inline in the PR diff
 *   • Step summary          — renders a Markdown table in the Actions UI
 *   • Job outputs           — lets downstream jobs read pass/fail state
 *   • JSON report file      — uploaded as an artifact for post-mortem
 *
 * All methods are no-ops when running locally (no GITHUB_ACTIONS env var).
 */
import * as fs from 'fs'
import * as path from 'path'

export interface ScenarioResult {
  name: string
  passed: boolean
  summary: string
  toolCalls: number
  durationMs: number
  critical: boolean
}

export class CIReporter {
  private readonly results: ScenarioResult[] = []
  private readonly isCI = !!process.env.GITHUB_ACTIONS

  // ── Record ──────────────────────────────────────────────────────────────────

  record(result: ScenarioResult): void {
    throw new Error('TODO: implement in Chapter 7')
  }

  // ── Summary ─────────────────────────────────────────────────────────────────

  async writeStepSummary(): Promise<void> {
    throw new Error('TODO: implement in Chapter 7')
  }

  // ── Outputs (readable by downstream jobs) ────────────────────────────────────

  setOutputs(): void {
    throw new Error('TODO: implement in Chapter 7')
  }

  // ── JSON report (uploaded as artifact) ───────────────────────────────────────

  writeReport(outPath = './agent-report.json'): void {
    throw new Error('TODO: implement in Chapter 7')
  }

  // ── Exit code ────────────────────────────────────────────────────────────────

  exitCode(): number {
    throw new Error('TODO: implement in Chapter 7')
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private annotation(
    level: 'error' | 'warning' | 'notice',
    title: string,
    message: string,
  ): void {
    throw new Error('TODO: implement in Chapter 7')
  }

  private setOutput(name: string, value: string): void {
    throw new Error('TODO: implement in Chapter 7')
  }
}

/**
 * WORKSHOP TASKS (Chapter 7 hands-on):
 *
 * Task A — Run the reporter locally and inspect non-CI output:
 *   npx ts-node examples/ch7-agent-ci/agent-runner.ts --scenario login-flow
 *   With no GITHUB_ACTIONS env var, record() prints to stdout instead of emitting
 *   workflow commands. Confirm the step summary table appears in the terminal.
 *
 * Task B — Add a duration_ms job output for downstream job conditioning:
 *   In setOutputs(), add:
 *     this.setOutput('total_duration_ms', String(this.results.reduce((s, r) => s + r.durationMs, 0)))
 *   Then in the GitHub Actions workflow, add a step that fails if total_duration_ms > 120000.
 *
 * Task C — Add a Slack-compatible JSON payload method:
 *   Add writeSlackPayload(outPath: string): void that writes a Slack Block Kit message.
 *   The payload should include: overall pass/fail, scenario count, and a bullet list
 *   of critical failures. Use https://api.slack.com/block-kit to validate the format.
 *
 * Task D — Surface the failing assertion text inline in the PR annotation:
 *   The annotation() call for a failure currently uses result.summary as the message.
 *   result.summary often contains the full agent reasoning — trim it to the first
 *   sentence that contains "✗" so the annotation fits in the PR diff view.
 */
