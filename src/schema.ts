import { z } from 'zod'

export const Verdict = z.object({
  verdict: z.enum(['pass', 'fail', 'warn']),
  score: z.number().min(0).max(1),
  issues: z.array(z.string()).max(10),
  rationale: z.string().max(800),
})

export type Verdict = z.infer<typeof Verdict>

// Hand-written JSON Schema for OpenAI's structured-output mode.
// Kept in sync with the zod schema above; zod re-validates the response on the way out.
export const VerdictJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'score', 'issues', 'rationale'],
  properties: {
    verdict: { type: 'string', enum: ['pass', 'fail', 'warn'] },
    score: { type: 'number', minimum: 0, maximum: 1 },
    issues: { type: 'array', items: { type: 'string' }, maxItems: 10 },
    rationale: { type: 'string', maxLength: 800 },
  },
} as const
