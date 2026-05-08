import OpenAI from 'openai'
import { Verdict, VerdictJsonSchema } from './schema'

export interface JudgeContext {
  url: string
  ariaSnapshot: string
  screenshot: string // base64-encoded PNG
}

let client: OpenAI | null = null
const getClient = (): OpenAI => (client ??= new OpenAI())

export async function judge(rubric: string, ctx: JudgeContext): Promise<Verdict> {
  const response = await getClient().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    seed: 42,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'verdict',
        schema: VerdictJsonSchema,
        strict: true,
      },
    },
    messages: [
      { role: 'system', content: rubric },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Page URL: ${ctx.url}\n\nAccessibility tree:\n${ctx.ariaSnapshot}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${ctx.screenshot}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
  })

  const message = response.choices[0]?.message
  if (!message?.content) {
    throw new Error('judge: empty response from model')
  }

  const usage = response.usage
  if (usage) {
    // eslint-disable-next-line no-console
    console.log(
      `[judge] tokens prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`,
    )
  }

  const raw = JSON.parse(message.content)
  return Verdict.parse(raw)
}
