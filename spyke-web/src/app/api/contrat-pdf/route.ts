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

    // Prefer filling the PDF template, but fall back to a generated PDF if pdfjs worker setup fails in production.
    try {
      // Fill the user-provided PDF template (only placeholder zones are replaced).
      const templatePath = join(process.cwd(), 'public', 'templates', 'contrat-template.pdf')
      const templateBytes = await readFile(templatePath)

      const replacements: Record<string, string> = {
        '[NUMÉRO DU CONTRAT]': body.contractNumber || '',
        '[DATE]': body.date || '',
        '[NOM PRESTATAIRE]': sellerName,
        '[NOM\nPRESTATAIRE]': sellerName,
        '[SIRET PRESTATAIRE]': body.seller?.siret || '',
        '[ADRESSE PRESTATAIRE]': body.seller?.address || '',
        '[ACTIVITÉ]': body.seller?.activity || '',
        '[EMAIL PRESTATAIRE]': body.seller?.email || '',

        '[NOM CLIENT]': buyerName,
        '[SIRET CLIENT]': body.buyer?.siret || '',
        '[REPRÉSENTANT]': body.buyer?.representant || '',
        '[ADRESSE CLIENT]': body.buyer?.address || '',
        '[EMAIL CLIENT]': body.buyer?.email || '',

        'DESCRIPTION DÉTAILLÉE DE LA MISSION': body.mission?.description || '',
        'LIVRABLES ATTENDUS': body.mission?.deliverables || '',

        '[DATE DÉBUT]': body.mission?.startDate || '',
        '[DATE FIN]': body.mission?.endDate || '',
        '[À DISTANCE / SUR SITE / MIXTE]': body.mission?.location || '',
        '[NOMBRE  DE  RÉVISIONS]': body.mission?.revisions || '',

        '[FORFAIT / TJM / TAUX HORAIRE]': body.pricing?.type || '',
        '[MONTANT]': body.pricing?.amount || '',
        '[FRANCHISE EN BASE / ASSUJETTI]': body.vatRegime || '',
        '[30/70 / 50/50 / 100% FIN / PERSONNALISÉ]': body.paymentSchedule || '',
        '[30 JOURS / 45 JOURS / 60 JOURS]': body.paymentDelay || '',
        "[CESSION APRÈS PAIEMENT / LICENCE D'UTILISATION / CESSION TOTALE]": body.ipClause || '',
        '[OUI / NON]': body.confidentiality || '',
        '[PRÉAVIS 15 JOURS / 30 JOURS / SANS PRÉAVIS]': body.termination || '',
      }

      let filled = await fillContractTemplatePdf({
        templateBytes: new Uint8Array(templateBytes),
        replacements,
      })

      // No embedded freelancer signature in contracts.

      return new NextResponse(filled as any, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="Contrat-${new Date().toISOString().slice(0, 10)}.pdf"`,
          'cache-control': 'no-store',
        },
      })
    } catch (err: any) {
      // Fallback: generate a simple PDF without pdfjs.
      const React = (await import('react')).default
      const { Document, Page, Text, View, Image, StyleSheet, pdf } = await import('@react-pdf/renderer')

      const styles = StyleSheet.create({
        page: { paddingTop: 40, paddingBottom: 36, paddingHorizontal: 44, fontSize: 10.5, fontFamily: 'Helvetica', color: '#111827', lineHeight: 1.45 },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
        logo: { height: 24, objectFit: 'contain' },
        title: { fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e3a8a' },
        subtitle: { fontSize: 10, color: '#6b7280' },
        box: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, backgroundColor: '#ffffff' },
        bodyText: { fontSize: 10.5, lineHeight: 1.55, color: '#111827' },
        paragraph: { marginBottom: 8 },
        h2: { fontSize: 12, fontWeight: 700, color: '#1e3a8a', marginTop: 10, marginBottom: 6 },
        signatureTitle: { fontSize: 12, fontWeight: 700, color: '#1e3a8a', marginTop: 16, marginBottom: 8 },
        signatureBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, height: 160 },
        signatureImg: { width: '100%', height: '100%', objectFit: 'contain' },
      })

      const bodyText = String(body.contractText || '').trim() || 'Contrat'

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
                React.createElement(Text, { style: styles.title }, body.title || 'Contrat'),
                body.date ? React.createElement(Text, { style: styles.subtitle }, `Date : ${body.date}`) : React.createElement(Text, { style: styles.subtitle }, ' ')
              )
            ),
            React.createElement(
              View,
              { style: styles.box },
              React.createElement(Text, { style: [styles.bodyText, styles.paragraph] }, `Prestataire : ${sellerName || ''}`),
              React.createElement(Text, { style: [styles.bodyText, styles.paragraph] }, `Client : ${buyerName || ''}`),
              body.contractNumber ? React.createElement(Text, { style: [styles.bodyText, styles.paragraph] }, `N° : ${body.contractNumber}`) : null,
              React.createElement(Text, { style: styles.h2 }, 'Contenu'),
              React.createElement(Text, { style: styles.bodyText }, bodyText)
            ),
            null
          )
        )

      const buf = await pdf(React.createElement(Doc)).toBuffer()
      return new NextResponse(buf as any, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="Contrat-${new Date().toISOString().slice(0, 10)}.pdf"`,
          'cache-control': 'no-store',
          'x-spyke-contract-fallback': '1',
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
