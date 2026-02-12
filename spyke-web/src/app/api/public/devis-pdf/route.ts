import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const LineSchema = z.object({
  label: z.string().default(''),
  description: z.string().default(''),
  qty: z.number().nonnegative().default(0),
  unitPriceHt: z.number().nonnegative().default(0),
  vatRate: z.number().nonnegative().default(0),
})

const BodySchema = z.object({
  quoteNumber: z.string().min(1),
  title: z.string().optional().default(''),
  dateIssue: z.string().min(1), // YYYY-MM-DD
  validityUntil: z.string().optional().default(''),
  logoUrl: z.string().optional().default(''),

  seller: z.object({
    name: z.string().min(1),
    addressLines: z.array(z.string()).default([]),
    siret: z.string().optional().default(''),
    vatNumber: z.string().optional().default(''),
    iban: z.string().optional().default(''),
    bic: z.string().optional().default(''),
  }),

  buyer: z.object({
    name: z.string().min(1),
    addressLines: z.array(z.string()).default([]),
    siret: z.string().optional().default(''),
  }),

  lines: z.array(LineSchema).min(1),
  notes: z.string().optional().default(''),

  totals: z.object({
    totalHt: z.number().default(0),
    totalTva: z.number().default(0),
    totalTtc: z.number().default(0),
  }),
})

function formatMoney(amount: number) {
  return (amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDateFr(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const body = BodySchema.parse(json)

    const React = (await import('react')).default
    const { Document, Page, Text, View, Image, StyleSheet, pdf } = await import('@react-pdf/renderer')

    const styles = StyleSheet.create({
      page: {
        paddingTop: 42,
        paddingBottom: 34,
        paddingHorizontal: 42,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#0a0a0a',
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
      },
      partyBlock: { width: '48%' },
      logo: {
        height: 26,
        marginBottom: 8,
        objectFit: 'contain',
      },
      partyName: {
        fontSize: 12,
        fontWeight: 700,
        color: '#1e3a8a',
        marginBottom: 6,
      },
      partyLine: {
        fontSize: 9.5,
        lineHeight: 1.35,
        color: '#111827',
      },
      metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        marginBottom: 14,
      },
      docTitle: {
        fontSize: 14,
        fontWeight: 700,
        color: '#1e3a8a',
        marginBottom: 6,
      },
      docSubtitle: {
        fontSize: 10,
        color: '#374151',
      },
      metaRight: { alignItems: 'flex-end' },
      table: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        overflow: 'hidden',
        marginTop: 10,
      },
      tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#eef2ff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
      },
      th: {
        paddingVertical: 8,
        paddingHorizontal: 8,
        fontSize: 9.5,
        color: '#374151',
        fontWeight: 700,
      },
      tr: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      },
      td: {
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 10,
        color: '#111827',
      },
      tdMuted: {
        fontSize: 9,
        color: '#6b7280',
        marginTop: 3,
      },
      right: { textAlign: 'right' },
      center: { textAlign: 'center' },
      colLabel: { width: '32%' },
      colQty: { width: '14%' },
      colUnit: { width: '22%' },
      colVat: { width: '14%' },
      colTotal: { width: '18%' },
      totalsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 18,
      },
      totalsBox: {
        width: 240,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
      },
      totalsLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
      },
      totalsLineLast: { borderBottomWidth: 0 },
      totalsLabel: {
        fontSize: 10,
        color: '#111827',
        fontWeight: 700,
      },
      totalsValue: {
        fontSize: 10,
        color: '#111827',
        fontWeight: 700,
      },
      signRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 18,
      },
      signBox: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        width: 340,
      },
      signTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: '#111827' },
      signLine: { fontSize: 10, color: '#111827', marginTop: 6 },
      underline: { fontSize: 10, color: '#9ca3af' },
      footer: {
        position: 'absolute',
        left: 42,
        right: 42,
        bottom: 24,
        fontSize: 8.5,
        color: '#6b7280',
      },
      footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      footerRight: { textAlign: 'right' },
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
            { style: styles.headerRow },
            React.createElement(
              View,
              { style: styles.partyBlock },
              body.logoUrl ? React.createElement(Image, { style: styles.logo, src: body.logoUrl }) : null,
              React.createElement(Text, { style: styles.partyName }, body.seller.name),
              ...(body.seller.addressLines || []).map((l, i) => React.createElement(Text, { key: `s-${i}`, style: styles.partyLine }, l)),
              body.seller.siret ? React.createElement(Text, { style: [styles.partyLine, { marginTop: 6 }] }, `SIRET : ${body.seller.siret}`) : null,
              body.seller.vatNumber ? React.createElement(Text, { style: styles.partyLine }, `N° TVA Intracommunautaire : ${body.seller.vatNumber}`) : null
            ),
            React.createElement(
              View,
              { style: [styles.partyBlock, { alignItems: 'flex-end' }] },
              React.createElement(Text, { style: styles.partyName }, body.buyer.name),
              body.buyer.siret ? React.createElement(Text, { style: styles.partyLine }, `SIRET : ${body.buyer.siret}`) : null,
              ...(body.buyer.addressLines || []).map((l, i) => React.createElement(Text, { key: `b-${i}`, style: [styles.partyLine, styles.footerRight] }, l))
            )
          ),
          React.createElement(
            View,
            { style: styles.metaRow },
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.docTitle }, `Devis ${body.quoteNumber}`),
              body.title ? React.createElement(Text, { style: styles.docSubtitle }, body.title) : null
            ),
            React.createElement(
              View,
              { style: styles.metaRight },
              React.createElement(Text, { style: styles.docSubtitle }, `Émis le ${formatDateFr(body.dateIssue)}`),
              body.validityUntil ? React.createElement(Text, { style: [styles.docSubtitle, { marginTop: 4 }] }, `Valide jusqu'au ${formatDateFr(body.validityUntil)}`) : null
            )
          ),
          React.createElement(
            View,
            { style: styles.table },
            React.createElement(
              View,
              { style: styles.tableHeader },
              React.createElement(Text, { style: [styles.th, styles.colLabel] }, 'Libellé'),
              React.createElement(Text, { style: [styles.th, styles.colQty, styles.center] }, 'Quantité'),
              React.createElement(Text, { style: [styles.th, styles.colUnit, styles.right] }, 'Prix Unitaire HT'),
              React.createElement(Text, { style: [styles.th, styles.colVat, styles.right] }, 'TVA'),
              React.createElement(Text, { style: [styles.th, styles.colTotal, styles.right] }, 'Total HT')
            ),
            ...(body.lines || []).map((l, idx) => {
              const lineHt = (l.qty || 0) * (l.unitPriceHt || 0)
              return React.createElement(
                View,
                { key: `l-${idx}`, style: styles.tr },
                React.createElement(
                  View,
                  { style: [styles.td, styles.colLabel] },
                  React.createElement(Text, null, l.label || ''),
                  l.description ? React.createElement(Text, { style: styles.tdMuted }, l.description) : null
                ),
                React.createElement(Text, { style: [styles.td, styles.colQty, styles.center] }, String(l.qty || 0)),
                React.createElement(Text, { style: [styles.td, styles.colUnit, styles.right] }, formatMoney(l.unitPriceHt || 0)),
                React.createElement(Text, { style: [styles.td, styles.colVat, styles.right] }, `${(l.vatRate || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`),
                React.createElement(Text, { style: [styles.td, styles.colTotal, styles.right] }, formatMoney(lineHt))
              )
            })
          ),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(
              View,
              { style: styles.totalsBox },
              React.createElement(
                View,
                { style: styles.totalsLine },
                React.createElement(Text, { style: styles.totalsLabel }, 'Total HT'),
                React.createElement(Text, { style: styles.totalsValue }, formatMoney(body.totals.totalHt))
              ),
              React.createElement(
                View,
                { style: styles.totalsLine },
                React.createElement(Text, { style: styles.totalsLabel }, 'TVA'),
                React.createElement(Text, { style: styles.totalsValue }, formatMoney(body.totals.totalTva))
              ),
              React.createElement(
                View,
                { style: [styles.totalsLine, styles.totalsLineLast] },
                React.createElement(Text, { style: styles.totalsLabel }, 'Total TTC'),
                React.createElement(Text, { style: styles.totalsValue }, formatMoney(body.totals.totalTtc))
              )
            )
          ),
          React.createElement(
            View,
            { style: styles.signRow },
            React.createElement(
              View,
              { style: styles.signBox },
              React.createElement(Text, { style: styles.signTitle }, 'Bon pour accord'),
              React.createElement(Text, { style: styles.signLine }, 'Signé le :'),
              React.createElement(Text, { style: styles.underline }, '____________________________'),
              React.createElement(Text, { style: styles.signLine }, 'À :'),
              React.createElement(Text, { style: styles.underline }, '____________________________')
            )
          ),
          React.createElement(
            Text,
            { style: styles.footer },
            'La facture devra être payée dans les 30 jours à compter de la réalisation de la prestation ou de la réception de la marchandise.\n'
              + 'TVA non applicable, art. 293 B du CGI (si applicable).\n'
              + "En cas de retard de paiement, seront exigibles, conformément au code de commerce, une indemnité calculée sur la base de trois fois le taux de l'intérêt légal en vigueur ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€.\n"
              + "Pas d'escompte en cas de paiement anticipé.\n"
          ),
          React.createElement(
            View,
            { style: [styles.footer, { top: undefined, bottom: 24 }] },
            React.createElement(
              View,
              { style: styles.footerRow },
              React.createElement(
                View,
                null,
                body.seller.iban ? React.createElement(Text, null, `IBAN : ${body.seller.iban}`) : null,
                body.seller.bic ? React.createElement(Text, null, `BIC : ${body.seller.bic}`) : null
              ),
              React.createElement(Text, { style: styles.footerRight }, `Devis ${body.quoteNumber} | Page 1/1`)
            )
          )
        )
      )

    const instance = pdf(React.createElement(Doc))
    const buffer = await instance.toBuffer()

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="Devis-${body.quoteNumber}.pdf"`,
        'cache-control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
