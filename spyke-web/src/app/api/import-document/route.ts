import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import pdfParse from 'pdf-parse'
import { GoogleAuth } from 'google-auth-library'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const DocTypeSchema = z.enum(['devis', 'facture', 'contrat'])

const ImportResultBaseSchema = z.object({
  warnings: z.array(z.string()).default([]),
})

const ImportDevisSchema = ImportResultBaseSchema.extend({
  title: z.string().optional().default(''),
  dateIssue: z.string().optional().default(''), // YYYY-MM-DD
  validityDays: z.number().int().positive().optional(),
  client: z
    .object({
      name: z.string().optional().default(''),
      siret: z.string().optional().default(''),
      address: z.string().optional().default(''),
      postalCode: z.string().optional().default(''),
      city: z.string().optional().default(''),
    })
    .optional()
    .default({ name: '', siret: '', address: '', postalCode: '', city: '' }),
  lines: z
    .array(
      z.object({
        label: z.string().optional().default(''),
        description: z.string().optional().default(''),
        qty: z.number().nonnegative().optional().default(1),
        unitPriceHt: z.number().nonnegative().optional().default(0),
        vatRate: z.number().nonnegative().optional().default(0),
      })
    )
    .optional()
    .default([]),
  notes: z.string().optional().default(''),
})

const ImportFactureSchema = ImportResultBaseSchema.extend({
  invoiceNumber: z.string().optional().default(''),
  dateIssue: z.string().optional().default(''),
  client: z
    .object({
      name: z.string().optional().default(''),
      siret: z.string().optional().default(''),
      address: z.string().optional().default(''),
      postalCode: z.string().optional().default(''),
      city: z.string().optional().default(''),
    })
    .optional()
    .default({ name: '', siret: '', address: '', postalCode: '', city: '' }),
  lines: z
    .array(
      z.object({
        description: z.string().optional().default(''),
        qty: z.number().nonnegative().optional().default(1),
        unitPrice: z.number().nonnegative().optional().default(0),
      })
    )
    .optional()
    .default([]),
  notes: z.string().optional().default(''),
})

const ImportContratSchema = ImportResultBaseSchema.extend({
  title: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
  client: z
    .object({
      name: z.string().optional().default(''),
      siret: z.string().optional().default(''),
      address: z.string().optional().default(''),
      postalCode: z.string().optional().default(''),
      city: z.string().optional().default(''),
    })
    .optional()
    .default({ name: '', siret: '', address: '', postalCode: '', city: '' }),
  scope: z.string().optional().default(''),
  price: z
    .object({
      mode: z.enum(['forfait', 'tjm', 'horaire']).optional().default('forfait'),
      amount: z.number().nonnegative().optional().default(0),
    })
    .optional()
    .default({ mode: 'forfait', amount: 0 }),
  notes: z.string().optional().default(''),
})

function base64FromBuffer(buf: Buffer) {
  return buf.toString('base64')
}

async function extractTextFromPdf(buf: Buffer) {
  try {
    const data = await pdfParse(buf)
    const t = String(data.text || '').replace(/\s+\n/g, '\n').trim()
    return t
  } catch {
    return ''
  }
}

async function extractTextWithDocumentAI(fileBuf: Buffer, mimeType: string) {
  const projectId = process.env.GCP_PROJECT_ID
  const location = process.env.GCP_LOCATION || 'eu'
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID
  const saJson = process.env.GCP_SERVICE_ACCOUNT_JSON

  if (!projectId || !processorId || !saJson) {
    throw new Error('Document AI env manquantes (GCP_PROJECT_ID, DOCUMENT_AI_PROCESSOR_ID, GCP_SERVICE_ACCOUNT_JSON)')
  }

  let credentials: any
  try {
    credentials = JSON.parse(saJson)
  } catch {
    throw new Error('GCP_SERVICE_ACCOUNT_JSON invalide (JSON attendu)')
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })

  const client = await auth.getClient()
  const tokenResp: any = await (client as any).getAccessToken()
  const accessToken = typeof tokenResp === 'string' ? tokenResp : tokenResp?.token
  if (!accessToken) throw new Error('Impossible de récupérer un access token GCP')

  const url = `https://documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      rawDocument: {
        content: base64FromBuffer(fileBuf),
        mimeType,
      },
    }),
  })

  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || 'Erreur OCR Document AI'
    throw new Error(msg)
  }

  const text = String(json?.document?.text || '').trim()
  return text
}

async function claudeToJson({ system, prompt }: { system: string; prompt: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant côté serveur')

  const client = new Anthropic({ apiKey })

  // Some Anthropic accounts don't have access to every dated model id.
  // Try a small fallback set.
  const modelsToTry = [
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-latest',
    'claude-3-5-haiku-20241022',
    'claude-3-haiku-20240307',
  ] as const

  let lastErr: any = null
  let msg: Awaited<ReturnType<typeof client.messages.create>> | null = null

  for (const model of modelsToTry) {
    try {
      msg = await client.messages.create({
        model,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: prompt }],
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

  // Claude can sometimes wrap JSON in fences — strip them.
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  return cleaned
}

function buildSystem(type: z.infer<typeof DocTypeSchema>) {
  return [
    "Tu es un extracteur de données pour un logiciel de gestion (devis, factures, contrats).",
    "On te donne du texte OCR (bruité possible).",
    "Ta tâche: retourner UNIQUEMENT un JSON valide (pas de texte autour).",
    "Si une info est absente, mets une valeur vide ou 0.",
    "Ajoute un tableau warnings avec les points incertains (montants, TVA, dates, lignes).",
    type === 'devis'
      ? 'Schema attendu: { title, dateIssue(YYYY-MM-DD), validityDays(number?), client:{name,siret,address,postalCode,city}, lines:[{label,description,qty,unitPriceHt,vatRate}], notes, warnings }'
      : type === 'facture'
        ? 'Schema attendu: { invoiceNumber, dateIssue(YYYY-MM-DD), client:{name,siret,address,postalCode,city}, lines:[{description,qty,unitPrice}], notes, warnings }'
        : 'Schema attendu: { title, startDate(YYYY-MM-DD), endDate(YYYY-MM-DD), client:{name,siret,address,postalCode,city}, scope, price:{mode:forfait|tjm|horaire, amount}, notes, warnings }',
    "Contraintes: dates au format YYYY-MM-DD si possible.",
    "TVA: si non trouvée, mets 0.",
  ].join('\n')
}

function buildPrompt(type: z.infer<typeof DocTypeSchema>, extractedText: string) {
  return [
    `Type: ${type}`,
    '',
    'Texte à analyser:',
    extractedText.slice(0, 20000),
  ].join('\n')
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    }

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })

    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    // Validate token
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const type = DocTypeSchema.parse(String(form.get('type') || ''))
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const mimeType = file.type || 'application/octet-stream'
    const ab = await file.arrayBuffer()
    const buf = Buffer.from(ab)

    // 1) Try PDF text layer first when PDF
    let extractedText = ''
    if (mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      extractedText = await extractTextFromPdf(buf)
    }

    // 2) Fallback to OCR (Document AI) for images and scanned PDFs
    // If OCR env isn't configured yet, keep the feature "à bientôt" instead of failing hard.
    if (!extractedText || extractedText.length < 50) {
      const hasOcrEnv =
        !!process.env.GCP_PROJECT_ID &&
        !!process.env.DOCUMENT_AI_PROCESSOR_ID &&
        !!process.env.GCP_SERVICE_ACCOUNT_JSON

      const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isImage = (mimeType || '').startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)

      if (!hasOcrEnv) {
        // If it's an image or a scanned PDF, we can't proceed without OCR.
        if (isImage) {
          return NextResponse.json(
            {
              error:
                "Import photo bientôt disponible (OCR non configuré). Utilise un PDF texte en attendant.",
            },
            { status: 501 }
          )
        }

        if (isPdf) {
          return NextResponse.json(
            {
              error:
                "Ce PDF semble scanné (pas de texte détecté). L'import OCR arrive bientôt.",
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          {
            error: "Format non supporté pour l'instant.",
          },
          { status: 400 }
        )
      }

      extractedText = await extractTextWithDocumentAI(buf, mimeType)
    }

    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json({ error: 'Impossible d\'extraire du texte depuis ce document' }, { status: 400 })
    }

    const system = buildSystem(type)
    const prompt = buildPrompt(type, extractedText)

    // If the AI is down / inaccessible: this is a real error (user wants an error message).
    let jsonText = ''
    try {
      jsonText = await claudeToJson({ system, prompt })
    } catch (e: any) {
      return NextResponse.json(
        {
          error: `IA indisponible: ${e?.message || 'Erreur'}`,
        },
        { status: 503 }
      )
    }

    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        {
          error: 'IA: réponse non-JSON',
          raw: jsonText.slice(0, 2000),
        },
        { status: 502 }
      )
    }

    // If the AI responds but can't find info, it should return empty values + warnings.
    // Validation errors mean the AI output is not in the expected shape → treat as AI failure.
    let data: any
    try {
      if (type === 'devis') data = ImportDevisSchema.parse(parsed)
      if (type === 'facture') data = ImportFactureSchema.parse(parsed)
      if (type === 'contrat') data = ImportContratSchema.parse(parsed)
    } catch (e: any) {
      return NextResponse.json(
        {
          error: `IA: données invalides: ${e?.message || 'Erreur validation'}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ type, data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 400 })
  }
}
