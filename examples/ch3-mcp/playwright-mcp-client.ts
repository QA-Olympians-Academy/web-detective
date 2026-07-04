// @ts-nocheck
/**
 * CH3 EXERCISE STUB — USING THE OFFICIAL @playwright/mcp SERVER
 *
 * This is the Chapter 3 exercise file. There is no code to implement here —
 * @playwright/mcp is configured in your AI client's MCP settings, not written.
 * During the workshop, follow the WORKSHOP TASKS below to connect it and drive
 * the app with natural language.
 *
 * Full reference (config snippets, tool surface, snapshot-vs-vision guidance):
 * `git checkout solutions` and see SOLUTIONS.md.
 *
 * @playwright/mcp is Playwright's first-party MCP server. It ships two modes:
 *
 *   • Accessibility snapshot mode (default) — faster, text-based, works headless
 *   • Vision mode (--vision)               — screenshot-based, uses image tokens
 */

export {}

/**
 * WORKSHOP TASKS (Chapter 3 hands-on):
 *
 * Task A — Connect @playwright/mcp to Claude Code and drive the app with natural language:
 *   Add an mcpServers block to .claude/settings.json that runs
 *   `npx @playwright/mcp@latest`, then prompt:
 *   "Log in to http://localhost:5173 with admin@shop.com / password123
 *    and tell me the four stat card values on the dashboard."
 *   No test code needed — the agent calls browser_navigate, browser_fill,
 *   browser_click, and browser_snapshot autonomously.
 *
 * Task B — Compare snapshot vs vision mode for a table assertion:
 *   Run the same prompt twice — once with the default server, once with --vision.
 *   "Go to the products page and count how many rows are in the table."
 *   Observe: which mode uses more tokens? Which answers faster?
 *
 * Task C — Use browser_get_console_logs to catch a silent JS error:
 *   In src/pages/Dashboard.tsx, add `console.error('chart render failed')` inside
 *   a useEffect. Then prompt the agent:
 *   "Navigate to the dashboard and check for any console errors."
 *   Observe how the agent surfaces the error without you writing an assertion.
 *
 * Task D — Chain snapshot → plan → act:
 *   Prompt the agent in two steps:
 *   Step 1: "Take a snapshot of /products and list every interactive element."
 *   Step 2: "Now use those elements to search for 'Electronics' and count the results."
 *   Notice how the agent reuses selector knowledge from step 1 in step 2.
 */
