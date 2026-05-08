import { GoogleGenAI, Type } from '@google/genai'
import { Verdict } from './schema'

export interface JudgeContext {
  url: string
  ariaSnapshot: string
  screenshot: string // base64-encoded PNG
}

let client: GoogleGenAI | null = null
const getClient = (): GoogleGenAI => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error('judge: GEMINI_API_KEY (or GOOGLE_API_KEY) is required')
    }
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

export async function judge(rubric: string, ctx: JudgeContext): Promise<Verdict> {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: `Page URL: ${ctx.url}\n\nAccessibility tree:\n${ctx.ariaSnapshot}` },
          { inlineData: { mimeType: 'image/png', data: ctx.screenshot } },
        ],
      },
    ],
    config: {
      systemInstruction: rubric,
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, enum: ['pass', 'fail', 'warn'] },
          score: { type: Type.NUMBER },
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          rationale: { type: Type.STRING },
        },
        required: ['verdict', 'score', 'issues', 'rationale'],
        propertyOrdering: ['verdict', 'score', 'issues', 'rationale'],
      },
    },
  })

  if (!response.text) {
    throw new Error('judge: empty response from model')
  }

  const usage = response.usageMetadata
  if (usage) {
    // eslint-disable-next-line no-console
    console.log(
      `[judge] tokens prompt=${usage.promptTokenCount} completion=${usage.candidatesTokenCount} total=${usage.totalTokenCount}`,
    )
  }

  return Verdict.parse(JSON.parse(response.text))
}
