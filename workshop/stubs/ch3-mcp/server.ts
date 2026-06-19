// @ts-nocheck
/**
 * CH3 EXERCISE STUB — CUSTOM MCP SERVER (Playwright web-automation tools)
 *
 * This is the Chapter 3 exercise file. Implement the bodies live during the
 * workshop: define the MCP tool schemas, wire up the ListTools / CallTool
 * request handlers, and drive the Playwright page from each tool case.
 *
 * Full reference implementation: `git checkout solutions` and see SOLUTIONS.md.
 *
 * Install deps:  npm install @modelcontextprotocol/sdk playwright
 * Run:           npx ts-node examples/ch3-mcp/server.ts
 * Connect:       add to your MCP client config (see playwright-mcp-client.ts)
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { chromium, type Browser, type Page } from 'playwright'

// ── Browser state (singleton per server process) ──────────────────────────────

let browser: Browser | null = null
let page: Page | null = null

async function getPage(): Promise<Page> {
  // TODO: implement in Chapter 3 — lazily launch chromium, create a context
  // with baseURL http://localhost:5173, open a page, and return it.
  throw new Error('TODO: implement in Chapter 3')
}

// ── Tool definitions ──────────────────────────────────────────────────────────

// TODO: implement in Chapter 3 — define one Tool per browser action
// (browser_navigate, browser_click, browser_fill, browser_snapshot,
//  browser_screenshot, browser_assert_url, browser_assert_visible) with a
// description and a JSON inputSchema.
const tools: Tool[] = [
  // TODO: add tool definitions here
]

// ── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'playwright-web-automation', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // TODO: implement in Chapter 3 — return the list of tools.
  throw new Error('TODO: implement in Chapter 3')
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // TODO: implement in Chapter 3 — dispatch on request.params.name, perform the
  // matching Playwright action against getPage(), and return MCP content.
  // Wrap in try/catch and return { isError: true } on failure.
  throw new Error('TODO: implement in Chapter 3')
})

// ── Entrypoint ────────────────────────────────────────────────────────────────

void (async () => {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  process.on('SIGINT', async () => {
    await browser?.close()
    process.exit(0)
  })
})()

/**
 * WORKSHOP TASK (Chapter 3 hands-on):
 *
 * 1. Start this server: npx ts-node examples/ch3-mcp/server.ts
 * 2. Register it in your MCP client (Claude Code or VS Code settings).
 * 3. Ask the AI: "Log in to the web-detective app and confirm the dashboard loads."
 * 4. Watch it call browser_navigate, browser_fill, browser_click, browser_assert_url
 *    without you writing a single line of test code.
 * 5. Then ask: "What products have 'out of stock' status?" — it will snapshot + reason.
 */
