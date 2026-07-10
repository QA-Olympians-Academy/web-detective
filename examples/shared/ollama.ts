/**
 * SHARED — LOCAL LLM CLIENT (Ollama + DeepSeek)
 *
 * Every LLM-backed chapter (Ch4, Ch4.1, Ch5, Ch7) talks to a model running
 * locally through Ollama — no API key, no per-token cost. The default model is
 * DeepSeek-R1 (`deepseek-r1:8b`), a reasoning model, so its raw output is wrapped
 * in <think>…</think> chain-of-thought that must be stripped before use.
 *
 * DeepSeek-R1 does NOT support Ollama's native tool-calling API, so the agentic
 * chapters use a prompt-based protocol instead: the model is asked to reply with a
 * single JSON action, which `extractJson` parses.
 *
 * Prerequisites (see setup/local-llm-setup.md):
 *   ollama pull deepseek-r1:8b        # ~5 GB, one time
 *   ollama serve                       # if not already running (port 11434)
 *
 * Override the model with WORKSHOP_MODEL, e.g.:
 *   WORKSHOP_MODEL=deepseek-r1:1.5b    # smaller / faster on low-RAM machines
 *   WORKSHOP_MODEL=qwen2.5-coder:7b    # stronger at strict JSON output
 */
import ollama from 'ollama'

/** Default local model. Fast, non-reasoning, reliable JSON; override per run. */
export const MODEL = process.env.WORKSHOP_MODEL ?? 'llama3.1:latest'

/** A single chat turn, mirroring Ollama's message shape. */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * DeepSeek-R1 emits its chain-of-thought inside <think>…</think>. Strip it so
 * downstream parsing sees only the final answer.
 */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

/**
 * How many times to retry a chat request that fails transiently. Under memory
 * pressure (e.g. an 8B model on a ~7 GB CI runner) the llama-server subprocess
 * can segfault mid-request; the `ollama serve` daemon respawns it on the next
 * call, so a short backoff usually recovers. Override with WORKSHOP_LLM_RETRIES.
 */
const MAX_RETRIES = (() => {
  const raw = process.env.WORKSHOP_LLM_RETRIES
  if (!raw) return 3
  const n = Number.parseInt(raw, 10)
  return Number.isInteger(n) && n >= 0 ? n : 3
})()

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * True for failures worth retrying: the model server crashed/restarted or the
 * socket dropped mid-request — transient, not a malformed request on our side.
 */
function isTransient(err: unknown): boolean {
  const status = (err as { status_code?: number } | null)?.status_code
  if (typeof status === 'number' && status >= 500) return true
  const msg = err instanceof Error ? err.message : String(err)
  return /terminated|segmentation|core dumped|fetch failed|ECONNREFUSED|ECONNRESET|socket hang up|premature close/i.test(
    msg,
  )
}

/**
 * Multi-turn chat against the local model. Returns the cleaned assistant text
 * (thinking removed) alongside Ollama's token counts for visibility.
 *
 * Retries transient server crashes (see MAX_RETRIES) with exponential backoff so
 * a single llama-server segfault on a memory-constrained CI runner doesn't fail
 * the whole run.
 */
export async function chat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<{ text: string; promptTokens: number; outputTokens: number }> {
  console.log(`[Ollama] ${messages.length} messages → ${MODEL} (temp=${opts.temperature ?? 0.2})`)
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await ollama.chat({
        model: MODEL,
        messages,
        options: {
          temperature: opts.temperature ?? 0.2,
          // DeepSeek-R1 spends tokens "thinking" before answering; too small a budget
          // yields empty content. Default generously.
          num_predict: opts.maxTokens ?? 2048,
        },
      })
      return {
        text: stripThinking(res.message.content),
        promptTokens: res.prompt_eval_count ?? 0,
        outputTokens: res.eval_count ?? 0,
      }
    } catch (err) {
      lastErr = err
      if (attempt === MAX_RETRIES || !isTransient(err)) break
      const backoffMs = 2000 * 2 ** attempt // 2s, 4s, 8s — time for the model to reload
      const reason = err instanceof Error ? err.message : String(err)
      console.warn(
        `  ⚠ LLM request failed (${reason}) — retry ${attempt + 1}/${MAX_RETRIES} in ${backoffMs}ms`,
      )
      await sleep(backoffMs)
    }
  }
  throw lastErr
}

/**
 * Single-shot convenience: system + user prompt → cleaned assistant text.
 */
export async function complete(
  system: string,
  user: string,
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  const { text } = await chat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    opts,
  )
  return text
}

/**
 * Verify the local Ollama server is reachable and the target model is pulled.
 * Used by CI-style entry points to fail fast with a clear config error.
 */
export async function checkOllama(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { models } = await ollama.list()
    const names = models.map((m) => m.name)
    if (!names.some((n) => n === MODEL || n.startsWith(`${MODEL}:`) || `${n}`.startsWith(MODEL))) {
      return { ok: false, error: `Model "${MODEL}" not found. Run: ollama pull ${MODEL}` }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: `Cannot reach Ollama on port 11434 (${err instanceof Error ? err.message : String(err)}). Start it with: ollama serve`,
    }
  }
}

/**
 * Extract the first JSON value (object or array) from a possibly noisy model
 * response — handles ```json fences and leading/trailing prose. Returns null if
 * nothing parseable is found.
 */
export function extractJson<T>(text: string): T | null {
  const cleaned = stripThinking(text)
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : cleaned
  const match = body.match(/[[{][\s\S]*[\]}]/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}
