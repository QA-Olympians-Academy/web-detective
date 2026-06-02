/**
 * CH7 — CI REPORTER
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
    this.results.push(result)

    if (!result.passed) {
      const level = result.critical ? 'error' : 'warning'
      this.annotation(level, `Agent scenario failed: ${result.name}`, result.summary)
    } else {
      this.annotation('notice', `Agent scenario passed: ${result.name}`, result.summary)
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────

  async writeStepSummary(): Promise<void> {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const total  = this.results.reduce((s, r) => s + r.durationMs, 0)

    const statusBadge = failed === 0 ? '✅ All passed' : `❌ ${failed} failed`

    const rows = this.results.map(r => {
      const icon   = r.passed ? '✅' : (r.critical ? '❌' : '⚠️')
      const badge  = r.critical ? '`critical`' : '`optional`'
      return `| ${icon} | ${r.name} | ${badge} | ${r.toolCalls} steps | ${r.durationMs}ms |`
    })

    const md = `
## Agent Verification — ${statusBadge}

| | Scenario | Priority | Steps | Duration |
|---|---|---|---|---|
${rows.join('\n')}

**${passed}/${this.results.length} passed** · Total: ${total}ms

<details><summary>Detailed summaries</summary>

${this.results.map(r => `### ${r.passed ? '✅' : '❌'} ${r.name}\n\n${r.summary}`).join('\n\n---\n\n')}

</details>
`

    const summaryFile = process.env.GITHUB_STEP_SUMMARY
    if (summaryFile) {
      fs.appendFileSync(summaryFile, md)
    } else {
      console.log('\n── Step Summary ─────────────────────────────────────────')
      console.log(md)
    }
  }

  // ── Outputs (readable by downstream jobs) ────────────────────────────────────

  setOutputs(): void {
    const passed        = this.results.every(r => !r.critical || r.passed)
    const criticalFailed = this.results.filter(r => r.critical && !r.passed).map(r => r.name)

    this.setOutput('passed',          String(passed))
    this.setOutput('critical_failed', criticalFailed.join(','))
    this.setOutput('total_scenarios', String(this.results.length))
    this.setOutput('passed_count',    String(this.results.filter(r => r.passed).length))
  }

  // ── JSON report (uploaded as artifact) ───────────────────────────────────────

  writeReport(outPath = './agent-report.json'): void {
    const report = {
      timestamp:     new Date().toISOString(),
      passed:        this.results.every(r => !r.critical || r.passed),
      totalDurationMs: this.results.reduce((s, r) => s + r.durationMs, 0),
      scenarios:     this.results,
    }
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
    console.log(`\nReport written → ${outPath}`)
  }

  // ── Exit code ────────────────────────────────────────────────────────────────

  exitCode(): number {
    return this.results.some(r => r.critical && !r.passed) ? 1 : 0
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private annotation(
    level: 'error' | 'warning' | 'notice',
    title: string,
    message: string,
  ): void {
    // GitHub Actions workflow command — surfaces inline in PR review
    const escaped = message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
    if (this.isCI) {
      console.log(`::${level} title=${title}::${escaped}`)
    } else {
      const prefix = level === 'error' ? '✗' : level === 'warning' ? '⚠' : '✓'
      console.log(`  ${prefix} [${title}]`)
    }
  }

  private setOutput(name: string, value: string): void {
    const outputFile = process.env.GITHUB_OUTPUT
    if (outputFile) {
      fs.appendFileSync(outputFile, `${name}=${value}\n`)
    }
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
