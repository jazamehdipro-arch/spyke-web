import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fillContractTemplatePdf } from '@/lib/fillContractTemplate'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  title: z.string().default('Contrat'),
  date: z.string().default(''),
  logoUrl: z.string().optional().default(''),
  includeSignature: z.boolean().optional().default(false),
  signedAt: z.string().optional().default(''),
  signedPlace: z.string().optional().default(''),
  signatureUrl: z.string().optional().default(''),
  contractText: z.string().optional().default(''),
  parties: z
    .object({
      sellerName: z.string().optional().default(''),
      buyerName: z.string().optional().default(''),
    })
    .optional()
    .default({ sellerName: '', buyerName: '' }),

  // Extended structured fields (preferred) to fill the PDF template.
  contractNumber: z.string().optional().default(''),

  seller: z
    .object({
      name: z.string().optional().default(''),
      siret: z.string().optional().default(''),
      address: z.string().optional().default(''),
      activity: z.string().optional().default(''),
      email: z.string().optional().default(''),
    })
    .optional()
    .default({ name: '', siret: '', address: '', activity: '', email: '' }),

  buyer: z
    .object({
      name: z.string().optional().default(''),
      siret: z.string().optional().default(''),
      representant: z.string().optional().default(''),
      address: z.string().optional().default(''),
      email: z.string().optional().default(''),
    })
    .optional()
    .default({ name: '', siret: '', representant: '', address: '', email: '' }),

  mission: z
    .object({
      startDate: z.string().optional().default(''),
      endDate: z.string().optional().default(''),
      location: z.string().optional().default(''),
      revisions: z.string().optional().default(''),
      description: z.string().optional().default(''),
      deliverables: z.string().optional().default(''),
    })
    .optional()
    .default({ startDate: '', endDate: '', location: '', revisions: '', description: '', deliverables: '' }),

  pricing: z
    .object({
      type: z.string().optional().default(''),
      amount: z.string().optional().default(''),
    })
    .optional()
    .default({ type: '', amount: '' }),

  vatRegime: z.string().optional().default(''),
  paymentSchedule: z.string().optional().default(''),
  paymentDelay: z.string().optional().default(''),
  ipClause: z.string().optional().default(''),
  confidentiality: z.string().optional().default(''),
  termination: z.string().optional().default(''),
})

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    }

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })

    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const json = await req.json()
    const body = BodySchema.parse(json)

    // NOTE: Contracts should NOT be auto-signed by the freelancer inside Spyke.
    // The signature is handled via the public signing link flow (client signs), so we never embed a freelancer signature here.

    const sellerName = body.seller?.name || body.parties?.sellerName || ''
    const buyerName = body.buyer?.name || body.parties?.buyerName || ''

    // Prefer a generated PDF (React-PDF) by default: it's the most reliable (no template artifacts).
    // You can force the engine via env:
    // - SPYKE_CONTRACT_PDF_ENGINE=react     (always React-PDF)
    // - SPYKE_CONTRACT_PDF_ENGINE=template (always template)
    // Backward compat: SPYKE_CONTRACT_TEMPLATE=1 forces template.
    const engine = String(process.env.SPYKE_CONTRACT_PDF_ENGINE || '').trim().toLowerCase()
    const useTemplate = process.env.SPYKE_CONTRACT_TEMPLATE === '1' || engine === 'template'

    try {
      if (!useTemplate) {
        throw new Error('Contract template disabled')
      }
      // Fill the user-provided PDF template (only placeholder zones are replaced).
      const templatePath = join(process.cwd(), 'public', 'templates', 'contrat-template.pdf')
      const templateBytes = await readFile(templatePath)

      const replacements: Record<string, string> = {
        // Core placeholders
        '[NUMÉRO DU CONTRAT]': body.contractNumber || '',
        '[DATE]': body.date || '',

        // Seller (prestataire)
        '[NOM PRESTATAIRE]': sellerName,
        '[NOM\nPRESTATAIRE]': sellerName,
        '[PRÉNOM      NOM]': sellerName,
        '[PRÉNOM NOM]': sellerName,
        '[PRÉNOM NOM],': sellerName ? `${sellerName},` : '',
        '[PRÉNOM      NOM],': sellerName ? `${sellerName},` : '',
        '[NUMÉRO     SIRET]': body.seller?.siret || '',
        '[NUMÉRO SIRET]': body.seller?.siret || '',
        '[NUMÉRO     SIRET],': body.seller?.siret ? `${body.seller?.siret},` : '',
        '[NUMÉRO SIRET],': body.seller?.siret ? `${body.seller?.siret},` : '',
        '[NUMÉRO     SIRET],    ': body.seller?.siret ? `${body.seller?.siret},` : '',
        '[SIRET PRESTATAIRE]': body.seller?.siret || '',
        '[NUMÉRO DU SIRET]': body.seller?.siret || '',
        '[ADRESSE PRESTATAIRE]': body.seller?.address || '',
        '[ADRESSE PRESTATAIRE].': body.seller?.address ? `${body.seller?.address}.` : '',
        '[ACTIVITÉ]': body.seller?.activity || '',
        '[EMAIL PRESTATAIRE]': body.seller?.email || '',

        // Buyer (client)
        '[NOM CLIENT]': buyerName,
        '[SIRET CLIENT]': body.buyer?.siret || '',
        '[ADRESSE CLIENT]': body.buyer?.address || '',
        '[ADRESSE CLIENT],': body.buyer?.address ? `${body.buyer?.address},` : '',
        '[REPRÉSENTANT]': body.buyer?.representant || '',
        '[EMAIL CLIENT]': body.buyer?.email || '',

        // Mission
        "[DÉCRIRE L'OBJECTIF DE LA MISSION]": body.mission?.description || '',
        'DESCRIPTION DÉTAILLÉE DE LA MISSION': body.mission?.description || '',
        'LIVRABLES ATTENDUS': body.mission?.deliverables || '',
        '[DATE DÉBUT]': body.mission?.startDate || '',
        '[DATE FIN]': body.mission?.endDate || '',
        '[À DISTANCE / SUR SITE / MIXTE]': body.mission?.location || '',
        '[NOMBRE  DE  RÉVISIONS]': body.mission?.revisions || '',

        // Pricing
        '[FORFAIT / TJM / TAUX HORAIRE]': body.pricing?.type || '',
        '[MONTANT]': body.pricing?.amount || '',
        '[FRANCHISE EN BASE / ASSUJETTI]': body.vatRegime || '',
        '[30/70 / 50/50 / 100% FIN / PERSONNALISÉ]': body.paymentSchedule || '',
        '[30 JOURS / 45 JOURS / 60 JOURS]': body.paymentDelay || '',
        "[CESSION APRÈS PAIEMENT / LICENCE D'UTILISATION / CESSION TOTALE]": body.ipClause || '',
        '[OUI / NON]': body.confidentiality || '',
        '[PRÉAVIS 15 JOURS / 30 JOURS / SANS PRÉAVIS]': body.termination || '',

        // Clean common template placeholders we don't fill yet
        '[Madame/Monsieur]': '',
        '[Madame/Monsieur  PRÉNOM  NOM]': '',
        '[Forme   sociale   (SARL,   SAS,   etc.)]': '',
        '[MONTANT] euros': '',
        '[VILLE  RCS]': '',
        '[NUMÉRO  RCS]': '',
        '[FONCTION]': '',
        '[DÉCRIRE LE PROJET DU CLIENT]': '',
        '[NOMBRE]': '',
        '[PRIX EN LETTRES]': '',
        '[ADRESSE DE FACTURATION DU PRESTATAIRE]': '',
      }

      const filledRes = await fillContractTemplatePdf({
        templateBytes: new Uint8Array(templateBytes),
        replacements,
      })

      const filled = filledRes.bytes
      const replacedCount = Number(filledRes.replaced || 0)

      // If we didn't replace anything, the coordinate map most likely doesn't match the template in production.
      // Throw to trigger the React-PDF fallback so the user still gets a filled contract.
      if (replacedCount <= 0) {
        throw new Error('Template placeholders not found (map/template mismatch)')
      }

      // No embedded freelancer signature in contracts.

      return new NextResponse(filled as any, { 
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="Contrat-${new Date().toISOString().slice(0, 10)}.pdf"`,
          'cache-control': 'no-store',
          'x-spyke-contract-template-replaced': String(replacedCount || 0),
        },
      })
    } catch (err: any) {
      // Fallback: generate a simple PDF without pdfjs.
      // We also surface the template error in a header so it's diagnosable from the browser.
      const templateErrMsg = String(err?.message || err || '').slice(0, 160)

      // Resolve freelancer signature image when requested (manual signing flow).
      // React-PDF remote images can be flaky; embed as data URL.
      let signatureDataUrl = ''
      if (body.includeSignature) {
        signatureDataUrl = String(body.signatureUrl || '').trim()
        if (signatureDataUrl && /^https?:\/\//i.test(signatureDataUrl)) {
          try {
            const imgRes = await fetch(signatureDataUrl)
            const ct = String(imgRes.headers.get('content-type') || 'image/png')
            const ab = await imgRes.arrayBuffer()
            const b64 = Buffer.from(ab).toString('base64')
            signatureDataUrl = `data:${ct};base64,${b64}`
          } catch {
            // ignore
          }
        }
      }

      const { renderContractPdfReact } = await import('@/lib/renderContractPdfReact')

      const buf = await renderContractPdfReact({
        title: body.title,
        date: body.date,
        logoUrl: body.logoUrl,
        contractNumber: body.contractNumber,
        contractText: body.contractText,
        seller: body.seller,
        buyer: body.buyer,
        includeSignature: Boolean(body.includeSignature),
        signatureDataUrl,
      })

      return new NextResponse(buf as any, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="Contrat-${new Date().toISOString().slice(0, 10)}.pdf"`,
          'cache-control': 'no-store',
          'x-spyke-contract-fallback': '1',
          'x-spyke-contract-template-error': templateErrMsg,
          'x-spyke-signature-url': body.includeSignature && String(body.signatureUrl || '').trim() ? '1' : '0',
          'x-spyke-signature-data': signatureDataUrl.startsWith('data:') ? '1' : '0',
        },
      })
    }

    /*
    const React = (await import('react')).default
    const { Document, Page, Text, View, Image, StyleSheet, pdf } = await import('@react-pdf/renderer')

    const styles = StyleSheet.create({
      page: {
        paddingTop: 40,
        paddingBottom: 36,
        paddingHorizontal: 44,
        fontSize: 10.5,
        fontFamily: 'Helvetica',
        color: '#111827',
        lineHeight: 1.45,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
      },
      logo: {
        height: 24,
        objectFit: 'contain',
      },
      title: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 4,
        color: '#1e3a8a',
      },
      subtitle: {
        fontSize: 10,
        color: '#6b7280',
      },
      box: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 14,
        backgroundColor: '#ffffff',
      },
      bodyText: {
        fontSize: 10.5,
        lineHeight: 1.55,
        color: '#111827',
      },
      paragraph: {
        marginBottom: 8,
      },
      h2: {
        fontSize: 12,
        fontWeight: 700,
        color: '#1e3a8a',
        marginTop: 10,
        marginBottom: 6,
      },
      subtle: {
        fontSize: 9.5,
        color: '#6b7280',
      },
      footer: {
        position: 'absolute',
        left: 44,
        right: 44,
        bottom: 20,
        fontSize: 9,
        color: '#9ca3af',
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      badge: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 999,
        paddingVertical: 3,
        paddingHorizontal: 10,
        fontSize: 9,
        color: '#6b7280',
      },
    })

    const Doc = () =>
      React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          { size: 'A4', style: styles.page },
          React.createElement(
            View,
            { style: styles.header },
            body.logoUrl ? React.createElement(Image, { style: styles.logo, src: body.logoUrl }) : React.createElement(View, null),
            React.createElement(
              View,
              { style: { alignItems: 'flex-end' } },
              React.createElement(Text, { style: styles.title }, body.title),
              body.date ? React.createElement(Text, { style: styles.subtitle }, `Date : ${body.date}`) : React.createElement(Text, { style: styles.subtitle }, ' '),
              body.parties?.sellerName || body.parties?.buyerName
                ? React.createElement(Text, { style: styles.subtle }, `Parties : ${[body.parties?.sellerName, body.parties?.buyerName].filter(Boolean).join(' / ')}`)
                : null
            )
          ),
          React.createElement(
            View,
            { style: styles.box },
            (() => {
              const raw = String(body.contractText || '').trim()
              const parts = raw
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean)

              const isHeading = (p: string) =>
                /^ARTICLE\s+\d+\b/i.test(p) ||
                /^ARTICLE\b/i.test(p) ||
                /^\d+\)\s+/.test(p) ||
                /^\d+\./.test(p) ||
                /^TITRE\b/i.test(p) ||
                /^CHAPITRE\b/i.test(p)

              return React.createElement(
                View,
                null,
                ...parts.map((p, idx) => {
                  if (isHeading(p) && p.length < 140) {
                    return React.createElement(Text, { key: `h-${idx}`, style: styles.h2 }, p)
                  }
                  return React.createElement(Text, { key: `p-${idx}`, style: [styles.bodyText, styles.paragraph] }, p)
                })
              )
            })()
          ),
          React.createElement(
            View,
            { style: styles.footer },
            React.createElement(Text, { style: styles.badge }, 'Contrat généré avec Spyke'),
            React.createElement(Text, null, 'Page 1/1')
          )
        )
      )

    const instance = pdf(React.createElement(Doc))
    const buffer = await instance.toBuffer()

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="Contrat-${new Date().toISOString().slice(0, 10)}.pdf"`,
        'cache-control': 'no-store',
      },
    })
    */
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
