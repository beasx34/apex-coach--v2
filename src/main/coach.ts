// LLM client. Supports Groq (text, free + fast) and Google Gemini (vision +
// text, free tier). Both providers are called via plain HTTP so we avoid
// pulling in heavy SDKs.
import type { CoachConfig, CoachTip } from '@common/types'
import { buildUserPrompt, SYSTEM_PROMPT_EN, SYSTEM_PROMPT_RU, type PromptContext } from '@common/prompts'

interface LlmResponseTip {
  text?: string
  category?: CoachTip['category']
  priority?: number
}

interface LlmResponse {
  tips?: LlmResponseTip[]
}

class SlidingWindow {
  private readonly events: number[] = []
  constructor(private readonly capacity: number, private readonly windowMs: number) {}
  tryConsume(): boolean {
    const now = Date.now()
    while (this.events.length && now - this.events[0] > this.windowMs) this.events.shift()
    if (this.events.length >= this.capacity) return false
    this.events.push(now)
    return true
  }
}

function safeParseJson(text: string): LlmResponse | null {
  // Models sometimes wrap JSON in code fences. Strip them and retry.
  const stripped = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(stripped) as LlmResponse
  } catch {
    // Try to extract the first { ... } block.
    const match = stripped.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      return JSON.parse(match[0]) as LlmResponse
    } catch {
      return null
    }
  }
}

function toTips(resp: LlmResponse | null, source: CoachTip['source']): CoachTip[] {
  if (!resp?.tips?.length) return []
  return resp.tips.slice(0, 3).map((t, i) => ({
    id: `${source}-${Date.now()}-${i}`,
    text: (t.text ?? '').trim(),
    category: t.category ?? 'general',
    priority: Math.min(5, Math.max(1, t.priority ?? 3)),
    source,
    createdAt: Date.now()
  })).filter((t) => t.text.length > 0)
}

async function callGroqText(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  })
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return json.choices?.[0]?.message?.content ?? ''
}

async function callGeminiText(apiKey: string, model: string, system: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { role: 'system', parts: [{ text: system }] },
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      contents: [{ role: 'user', parts: [{ text: user }] }]
    })
  })
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
}

async function callGeminiVision(
  apiKey: string,
  model: string,
  system: string,
  user: string,
  png: Buffer
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { role: 'system', parts: [{ text: system }] },
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      contents: [
        {
          role: 'user',
          parts: [
            { text: user },
            { inlineData: { mimeType: 'image/png', data: png.toString('base64') } }
          ]
        }
      ]
    })
  })
  if (!res.ok) throw new Error(`Gemini vision HTTP ${res.status}: ${await res.text()}`)
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
}

export class ApexCoach {
  private rateLimit: SlidingWindow

  constructor(private cfg: CoachConfig) {
    this.rateLimit = new SlidingWindow(cfg.rpmLimit, 60_000)
  }

  reconfigure(cfg: CoachConfig): void {
    this.cfg = cfg
    this.rateLimit = new SlidingWindow(cfg.rpmLimit, 60_000)
  }

  /** Text-only advice based on the current state. Cheap, runs on every tick. */
  async advise(ctx: PromptContext): Promise<CoachTip[]> {
    if (!this.cfg.apiKey) return []
    if (!this.rateLimit.tryConsume()) return []
    const system = ctx.language === 'ru' ? SYSTEM_PROMPT_RU : SYSTEM_PROMPT_EN
    const user = buildUserPrompt(ctx)
    const raw = this.cfg.provider === 'groq'
      ? await callGroqText(this.cfg.apiKey, this.cfg.textModel, system, user)
      : await callGeminiText(this.cfg.apiKey, this.cfg.textModel, system, user)
    return toTips(safeParseJson(raw), 'llm-text')
  }

  /**
   * Vision-augmented advice. Sends the actual screenshot to Gemini for deeper
   * analysis. Always uses Gemini regardless of the configured text provider,
   * because Groq does not yet expose a free vision endpoint at the time of
   * writing.
   */
  async deepAnalyze(ctx: PromptContext, frame: Buffer, geminiApiKey: string): Promise<CoachTip[]> {
    if (!geminiApiKey) return []
    if (!this.rateLimit.tryConsume()) return []
    const system = ctx.language === 'ru' ? SYSTEM_PROMPT_RU : SYSTEM_PROMPT_EN
    const user = buildUserPrompt(ctx)
    const raw = await callGeminiVision(geminiApiKey, this.cfg.visionModel, system, user, frame)
    return toTips(safeParseJson(raw), 'llm-vision')
  }
}
