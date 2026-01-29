import { NextResponse } from 'next/server'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'

const BodySchema = z.object({
  prompt: z.string().min(1),
  // optional context for later
  system: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY manquant côté serveur' }, { status: 500 })
    }

    const json = await req.json()
    const body = BodySchema.parse(json)

    const client = new Anthropic({ apiKey })

    const modelsToTry = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-haiku-20240307',
    ] as const

    let lastErr: any = null
    let msg: Awaited<ReturnType<typeof client.messages.create>> | null = null

    for (const model of modelsToTry) {
      try {
        msg = await client.messages.create({
          model,
          max_tokens: 800,
          system: body.system,
          messages: [{ role: 'user', content: body.prompt }],
        })
        break
      } catch (e: any) {
        lastErr = e
      }
    }

    if (!msg) throw lastErr || new Error('Anthropic: no model available')

    const text = msg.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim()

    return NextResponse.json({ text })
  } catch (e: any) {
    // zod error or anthropic error
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 400 })
  }
}
