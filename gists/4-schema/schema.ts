// src/schema.ts
import { z } from 'zod'

export const Verdict = z.object({
  verdict: z.enum(['pass', 'fail', 'warn']),
  score: z.number().min(0).max(1),
  issues: z.array(z.string()).max(10),
  rationale: z.string().max(800),
})
export type Verdict = z.infer<typeof Verdict>
