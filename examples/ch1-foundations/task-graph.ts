/**
 * CH1 — AGENTIC TASK GRAPH
 *
 * A typed representation of a test scenario as a goal-driven task graph.
 * An agent uses this structure to plan, execute, verify, and retry — rather
 * than following a linear script that fails silently on any deviation.
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

export const loginTaskGraph: TaskGraph = {
  name: 'Login flow — web-detective',
  baseUrl: 'http://localhost:5173',

  tasks: [
    {
      id: 'navigate-to-login',
      goal: 'Open the login page',
      preconditions: ['app is running on localhost:5173'],
      actions: [
        {
          type: 'navigate',
          target: '/login',
          description: 'Navigate to the login route',
        },
        {
          type: 'assert_url',
          value: '/login',
          description: 'Confirm the URL is /login (not redirected away)',
        },
      ],
      successCriteria: 'URL is /login and login form is visible',
      onFailure: 'retry',
      maxRetries: 2,
    },

    {
      id: 'submit-credentials',
      goal: 'Fill and submit valid credentials',
      preconditions: ['login form is visible'],
      actions: [
        {
          type: 'fill',
          target: 'label:Email address >> input',   // semantic selector
          value: 'admin@shop.com',
          description: 'Enter admin email',
        },
        {
          type: 'fill',
          target: 'label:Password >> input',
          value: 'password123',
          description: 'Enter password',
        },
        {
          type: 'click',
          target: 'button[name="Sign In"]',
          description: 'Submit the login form',
        },
      ],
      successCriteria: 'No error message visible after submit',
      onFailure: 'abort',
      maxRetries: 1,
    },

    {
      id: 'verify-dashboard',
      goal: 'Confirm successful redirect to dashboard',
      preconditions: ['credentials were submitted'],
      actions: [
        {
          type: 'assert_url',
          value: '/dashboard',
          description: 'URL should be /dashboard after login',
        },
        {
          type: 'assert_visible',
          target: 'h2:text("Dashboard")',
          description: 'Dashboard heading is visible',
        },
        {
          type: 'screenshot',
          description: 'Capture dashboard state as audit evidence',
        },
      ],
      successCriteria: 'URL is /dashboard and heading "Dashboard" is visible',
      onFailure: 'retry',
      maxRetries: 2,
    },
  ],
}

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
  console.log(`\nTask Graph: ${graph.name}`)
  console.log(`Base URL  : ${graph.baseUrl}`)
  console.log(`Tasks     : ${graph.tasks.length}\n`)

  for (const task of graph.tasks) {
    console.log(`  [${task.id}]`)
    console.log(`    Goal    : ${task.goal}`)
    console.log(`    Actions : ${task.actions.length}`)
    console.log(`    Success : ${task.successCriteria}`)
    console.log(`    Failure : ${task.onFailure} (max ${task.maxRetries} retries)\n`)
  }
}
