import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fillContractTemplatePdf } from '@/lib/fillContractTemplate'

export const runtime = 'nodejs'

const BodySchema = z.object({
  title: z.string().default('Contrat'),
  date: z.string().default(''),
  logoUrl: z.string().optional().default(''),
  contractText: z.string().optional().default(''),
  parties: z
    .object({
      sellerName: z.string().optional().default(''),
      buyerName: z.string().optional().default(''),
    })
    .optional()
    .default({ sellerName: '', buyerName: '' }),

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
    const json = await req.json()
    const body = BodySchema.parse(json)

    const templatePath = join(process.cwd(), 'public', 'templates', 'contrat-template.pdf')
    const templateBytes = await readFile(templatePath)

    const sellerName = body.seller?.name || body.parties?.sellerName || ''
    const buyerName = body.buyer?.name || body.parties?.buyerName || ''

    const replacements: Record<string, string> = {
      '[NUMÉRO DU CONTRAT]': body.contractNumber || '',
      '[DATE]': body.date || '',

      '[NOM PRESTATAIRE]': sellerName,
      '[NOM\nPRESTATAIRE]': sellerName,
      '[PRÉNOM      NOM]': sellerName,
      '[PRÉNOM NOM]': sellerName,
      '[NUMÉRO     SIRET]': body.seller?.siret || '',
      '[SIRET PRESTATAIRE]': body.seller?.siret || '',
      '[ADRESSE PRESTATAIRE]': body.seller?.address || '',
      '[ACTIVITÉ]': body.seller?.activity || '',
      '[EMAIL PRESTATAIRE]': body.seller?.email || '',

      '[NOM CLIENT]': buyerName,
      '[SIRET CLIENT]': body.buyer?.siret || '',
      '[REPRÉSENTANT]': body.buyer?.representant || '',
      '[ADRESSE CLIENT]': body.buyer?.address || '',
      '[EMAIL CLIENT]': body.buyer?.email || '',

      "[DÉCRIRE L'OBJECTIF DE LA MISSION]": body.mission?.description || '',
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

      '[Madame/Monsieur]': '',
      '[Forme   sociale   (SARL,   SAS,   etc.)]': '',
      '[VILLE  RCS]': '',
      '[NUMÉRO  RCS]': '',
      '[FONCTION]': '',
      '[DÉCRIRE LE PROJET DU CLIENT]': '',
      '[NOMBRE]': '',
      '[PRIX EN LETTRES]': '',
      '[ADRESSE DE FACTURATION DU PRESTATAIRE]': '',
    }

    const filled = await fillContractTemplatePdf({
      templateBytes: new Uint8Array(templateBytes),
      replacements,
    })

    return new NextResponse(filled as any, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="Contrat.pdf"`,
        'cache-control': 'no-store',
      },
    })

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
      logo: { height: 24, objectFit: 'contain' },
      title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
      subtitle: { fontSize: 10, color: '#6b7280' },
      box: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        padding: 14,
        backgroundColor: '#ffffff',
      },
      mono: { fontFamily: 'Courier', fontSize: 10, lineHeight: 1.5 },
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
              React.createElement(Text, { style: styles.title }, body.title || 'Contrat'),
              body.date ? React.createElement(Text, { style: styles.subtitle }, `Date : ${body.date}`) : React.createElement(Text, { style: styles.subtitle }, ' ')
            )
          ),
          React.createElement(
            View,
            { style: styles.box },
            body.parties?.sellerName || body.parties?.buyerName
              ? React.createElement(
                  Text,
                  { style: { marginBottom: 10, color: '#374151' } },
                  `Parties : ${[body.parties?.sellerName, body.parties?.buyerName].filter(Boolean).join(' / ')}`
                )
              : null,
            React.createElement(Text, { style: styles.mono }, body.contractText)
          ),
          React.createElement(
            View,
            { style: styles.footer },
            React.createElement(Text, null, 'Spyke'),
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
        'content-disposition': `attachment; filename="Contrat.pdf"`,
        'cache-control': 'no-store',
      },
    })
    */
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
