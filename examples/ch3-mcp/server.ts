/**
 * CH3 — CUSTOM MCP SERVER (Playwright web-automation tools)
 *
 * Exposes browser actions as MCP tools so any MCP-compatible client
 * (Claude Code, GitHub Copilot Agent Mode, etc.) can drive the browser
 * using natural language without needing to know Playwright.
 *
 * Install deps:  npm install @modelcontextprotocol/sdk playwright
 * Run:           npx tsx examples/ch3-mcp/server.ts
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
  if (!browser) {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      baseURL: 'http://localhost:5173',
      viewport: { width: 1280, height: 800 },
    })
    page = await context.newPage()
  }
  return page!
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const tools: Tool[] = [
  {
    name: 'browser_navigate',
    description: 'Navigate the browser to a URL. Use relative paths like /login or /dashboard.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL or path to navigate to' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_click',
    description: 'Click an element. Prefer ARIA roles and labels over CSS selectors.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Playwright selector for the element to click' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'browser_fill',
    description: 'Type text into an input field.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Playwright selector for the input' },
        value:    { type: 'string', description: 'Text to type' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Return the accessibility tree of the current page. Use this to understand the page structure before clicking or filling.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Take a screenshot of the current page and return it as a base64-encoded PNG.',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: { type: 'boolean', description: 'Capture the full scrollable page (default: false)' },
      },
    },
  },
  {
    name: 'browser_assert_url',
    description: 'Assert that the current URL contains the given string. Returns ok: true/false.',
    inputSchema: {
      type: 'object',
      properties: {
        contains: { type: 'string', description: 'String that the URL must contain' },
      },
      required: ['contains'],
    },
  },
  {
    name: 'browser_assert_visible',
    description: 'Assert that an element matching the selector is visible on the page.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Playwright selector to check visibility for' },
      },
      required: ['selector'],
    },
  },
]

// ── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'playwright-web-automation', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  try {
    const p = await getPage()

    switch (name) {
      case 'browser_navigate': {
        await p.goto(args.url as string, { waitUntil: 'domcontentloaded' })
        return { content: [{ type: 'text', text: `Navigated to ${p.url()}` }] }
      }

      case 'browser_click': {
        await p.locator(args.selector as string).click()
        return { content: [{ type: 'text', text: `Clicked: ${args.selector}` }] }
      }

      case 'browser_fill': {
        await p.locator(args.selector as string).fill(args.value as string)
        return { content: [{ type: 'text', text: `Filled "${args.selector}" with "${args.value}"` }] }
      }

      case 'browser_snapshot': {
        const tree = await p.locator('body').ariaSnapshot()
        return { content: [{ type: 'text', text: tree }] }
      }

      case 'browser_screenshot': {
        const buf = await p.screenshot({ fullPage: (args.fullPage as boolean) ?? false })
        return {
          content: [{
            type: 'image',
            data: buf.toString('base64'),
            mimeType: 'image/png',
          }],
        }
      }

      case 'browser_assert_url': {
        const url = p.url()
        const ok = url.includes(args.contains as string)
        return {
          content: [{
            type: 'text',
            text: ok
              ? `✓ URL "${url}" contains "${args.contains}"`
              : `✗ URL "${url}" does NOT contain "${args.contains}"`,
          }],
        }
      }

      case 'browser_assert_visible': {
        const locator = p.locator(args.selector as string)
        const visible = await locator.isVisible()
        return {
          content: [{
            type: 'text',
            text: visible
              ? `✓ Element "${args.selector}" is visible`
              : `✗ Element "${args.selector}" is NOT visible`,
          }],
        }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true }
  }
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
 * 1. Start this server: npx tsx examples/ch3-mcp/server.ts
 * 2. Register it in your MCP client (Claude Code or VS Code settings).
 * 3. Ask the AI: "Log in to the web-detective app and confirm the dashboard loads."
 * 4. Watch it call browser_navigate, browser_fill, browser_click, browser_assert_url
 *    without you writing a single line of test code.
 * 5. Then ask: "What products have 'out of stock' status?" — it will snapshot + reason.
 */
