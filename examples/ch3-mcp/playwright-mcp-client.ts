/**
 * CH3 — USING THE OFFICIAL @playwright/mcp SERVER
 *
 * @playwright/mcp is Playwright's first-party MCP server. It ships two modes:
 *
 *   • Accessibility snapshot mode (default) — faster, text-based, works headless
 *   • Vision mode (--vision)               — screenshot-based, uses image tokens
 *
 * You don't write this code — you configure it in your AI client's MCP settings.
 * This file shows the config snippets and explains the tool surface.
 */

/**
 * ── 1. Claude Code (claude.json / .claude/settings.json) ─────────────────────
 *
 * Add this to your project's .claude/settings.json:
 *
 * {
 *   "mcpServers": {
 *     "playwright": {
 *       "command": "npx",
 *       "args": ["@playwright/mcp@latest"]
 *     }
 *   }
 * }
 *
 * For vision mode (uses screenshots instead of accessibility tree):
 * {
 *   "mcpServers": {
 *     "playwright": {
 *       "command": "npx",
 *       "args": ["@playwright/mcp@latest", "--vision"]
 *     }
 *   }
 * }
 */

/**
 * ── 2. VS Code (GitHub Copilot Agent Mode) ───────────────────────────────────
 *
 * Add to .vscode/mcp.json:
 *
 * {
 *   "servers": {
 *     "playwright": {
 *       "type": "stdio",
 *       "command": "npx",
 *       "args": ["@playwright/mcp@latest"]
 *     }
 *   }
 * }
 */

/**
 * ── 3. Tool surface provided by @playwright/mcp ───────────────────────────────
 *
 * The server exposes these tools automatically — no configuration needed:
 *
 * Navigation:
 *   browser_navigate(url)             — go to a URL
 *   browser_navigate_back()           — browser back button
 *   browser_navigate_forward()        — browser forward button
 *
 * Interaction:
 *   browser_click(element, ref?)      — click by description or reference
 *   browser_fill(element, value)      — type into a field
 *   browser_select_option(element, values) — choose from a <select>
 *   browser_check(element)            — check a checkbox
 *   browser_hover(element)            — hover over element
 *   browser_press_key(key)            — keyboard shortcut (e.g. "Enter", "Tab")
 *   browser_drag(startElement, endElement)
 *
 * Observation:
 *   browser_snapshot()                — accessibility tree (default mode)
 *   browser_screenshot()              — PNG screenshot (vision mode)
 *   browser_get_console_logs()        — browser console output
 *
 * Tabs & frames:
 *   browser_tab_list()                — list open tabs
 *   browser_tab_new(url?)             — open new tab
 *   browser_tab_select(index)         — switch to tab
 *   browser_tab_close(index?)         — close tab
 *
 * Network & files:
 *   browser_network_requests()        — recent network requests
 *   browser_file_upload(element, paths)
 *
 * Utilities:
 *   browser_wait(time)                — pause for ms
 *   browser_close()                   — close browser
 */

/**
 * ── 4. Snapshot vs Vision mode — when to use which ────────────────────────────
 *
 * SNAPSHOT MODE (default):
 *   ✓ Faster — no image processing
 *   ✓ Cheaper — no vision tokens
 *   ✓ Works headlessly in CI
 *   ✓ Better for structured pages (forms, tables, lists)
 *   ✗ Can't reason about purely visual layout or canvas elements
 *
 * VISION MODE (--vision flag):
 *   ✓ Works on any page including canvas, SVG charts, custom components
 *   ✓ Useful when accessibility tree is incomplete or misleading
 *   ✓ Better for visual regression questions ("does this look right?")
 *   ✗ Slower and more expensive (image tokens per screenshot)
 *   ✗ Sensitive to viewport size and font rendering
 *
 * For the web-detective app:
 *   → Use snapshot mode for login, products table, and navigation tests
 *   → Use vision mode for Recharts bar/line chart assertions
 */

/**
 * ── 5. Example prompts for the web-detective app ──────────────────────────────
 *
 * Once @playwright/mcp is connected, ask the agent:
 *
 * "Navigate to http://localhost:5173, log in with admin@shop.com / password123,
 *  then tell me the total revenue shown on the dashboard."
 *
 * "Go to the products page and list all items with 'Out of Stock' status."
 *
 * "Try to navigate to /dashboard without logging in and confirm you are
 *  redirected to /login."
 *
 * "Search for 'ELC' in the products search box and count the results."
 *
 * Each of these requires zero test code — the agent calls browser_navigate,
 * browser_snapshot, browser_fill, and browser_click autonomously.
 */

export {}

/**
 * WORKSHOP TASKS (Chapter 3 hands-on):
 *
 * Task A — Connect @playwright/mcp to Claude Code and drive the app with natural language:
 *   Add the mcpServers block from section 1 to .claude/settings.json, then prompt:
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
