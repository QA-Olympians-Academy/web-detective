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

/** Default local model. Cheapest sensible tier for the workshop; override per run. */
export const MODEL = process.env.WORKSHOP_MODEL ?? 'deepseek-r1:8b'

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
 * Multi-turn chat against the local model. Returns the cleaned assistant text
 * (thinking removed) alongside Ollama's token counts for visibility.
 */
export async function chat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<{ text: string; promptTokens: number; outputTokens: number }> {
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
    const names = models.map(m => m.name)
    if (!names.some(n => n === MODEL || n.startsWith(`${MODEL}:`) || `${n}`.startsWith(MODEL))) {
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
