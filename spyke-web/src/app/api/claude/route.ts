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

    const msg = await client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 800,
      system: body.system,
      messages: [{ role: 'user', content: body.prompt }],
    })

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
