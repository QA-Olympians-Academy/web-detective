// @ts-nocheck
/**
 * CH1 — AGENTIC TASK GRAPH  (WORKSHOP EXERCISE STUB)
 *
 * This is the Chapter 1 exercise file. The types and signatures below define
 * the API you will work against — implement the bodies live during the workshop.
 *
 * Goal: a typed representation of a test scenario as a goal-driven task graph.
 * An agent uses this structure to plan, execute, verify, and retry — rather
 * than following a linear script that fails silently on any deviation.
 *
 * The full reference implementation is available via:
 *   git checkout solutions
 * and is documented in SOLUTIONS.md.
 */

// ── Core types ────────────────────────────────────────────────────────────────

export type ActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'assert_visible'
  | 'assert_text'
  | 'assert_url'
  | 'screenshot'
  | 'wait_for_state'

export interface AgentAction {
  type: ActionType
  target?: string        // selector, URL, or assertion value
  value?: string         // input value for fill; expected text for assert_text
  description: string    // human-readable intent — what the agent logs
}

export interface AgentTask {
  id: string
  goal: string                 // high-level intent, e.g. "verify login redirects to dashboard"
  preconditions: string[]      // what must be true before this task runs
  actions: AgentAction[]
  successCriteria: string      // what "done" looks like — the agent checks this
  onFailure: 'retry' | 'heal' | 'abort'
  maxRetries: number
}

export interface TaskGraph {
  name: string
  baseUrl: string
  tasks: AgentTask[]
}

// ── Example: login scenario mapped as a task graph ────────────────────────────

export const loginTaskGraph: TaskGraph = { name: '', baseUrl: '', tasks: [] } // TODO: build the login task graph (navigate → submit credentials → verify dashboard)

// ── Runner skeleton ───────────────────────────────────────────────────────────

/**
 * WORKSHOP TASK (Chapter 1 hands-on):
 *
 * The graph above is data — an agent reads it and decides how to execute each
 * task based on current page state. Unlike a script, it can:
 *
 *   • Re-evaluate preconditions before each task
 *   • Retry tasks that fail transiently (network blip, animation in progress)
 *   • Invoke a healing sub-agent when onFailure === 'heal'
 *   • Produce a structured audit log keyed to task IDs
 *
 * Next step: wire this graph into the ActionWrapper in ch2-execution-layer/action-wrapper.ts
 */
export function describeGraph(graph: TaskGraph): void {
  throw new Error('TODO: implement in Chapter 1')
}
