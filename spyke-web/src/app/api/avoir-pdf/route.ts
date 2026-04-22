import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const LineSchema = z.object({
  description: z.string().default(''),
  qty: z.number().nonnegative().default(0),
  unitPrice: z.number().nonnegative().default(0),
})

const BodySchema = z.object({
  creditNoteNumber: z.string().min(1, 'Numéro d\'avoir manquant'),
  dateIssue: z.string().min(1, "Date d'avoir manquante"),
  referenceInvoiceNumber: z.string().optional().default(''),
  logoUrl: z.string().optional().default(''),

  seller: z.object({
    name: z.string().min(1, 'Nom du prestataire manquant'),
    addressLines: z.array(z.string()).default([]),
    siret: z.string().optional().default(''),
    iban: z.string().optional().default(''),
    bic: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
    bankAccount: z.string().optional().default(''),
  }),

  buyer: z.object({
    name: z.string().min(1, 'Nom du client manquant'),
    addressLines: z.array(z.string()).default([]),
    siret: z.string().optional().default(''),
  }),

  lines: z.array(LineSchema).min(1),

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
    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    const token = headers.authorization.replace(/^Bearer\s+/i, '').trim()
    if (!token) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

    const { data: userRes } = await supabase.auth.getUser(token)
    const user = userRes?.user
    if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

    const json = await req.json()
    const body = BodySchema.parse(json)

    const React = (await import('react')).default
    const { Document, Page, Text, View, Image, StyleSheet, pdf } = await import('@react-pdf/renderer')

    const ORANGE = '#ff6b4a'
    const BLACK = '#111111'
    const GRAY = '#6b7280'
    const LIGHT = '#f3f4f6'

    const styles = StyleSheet.create({
      page: { paddingTop: 34, paddingBottom: 30, paddingHorizontal: 40, fontSize: 10, fontFamily: 'Helvetica', color: BLACK },
      barLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, backgroundColor: ORANGE },
      barBottomRight: { position: 'absolute', right: 0, bottom: 0, width: 80, height: 50, backgroundColor: ORANGE },
      headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
      logo: { height: 26, objectFit: 'contain' },
      title: { fontSize: 18, fontWeight: 700, color: BLACK },
      subtitle: { fontSize: 10, color: GRAY, marginTop: 3 },
      partyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 },
      partyBlock: { width: '48%' },
      partyName: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
      partyLine: { fontSize: 9.5, color: GRAY, lineHeight: 1.35 },
      metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 14 },
      metaItem: { fontSize: 10, color: GRAY },
      metaValue: { fontSize: 10, fontWeight: 700, color: BLACK, marginTop: 2 },
      table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden', marginTop: 8 },
      tableHeader: { flexDirection: 'row', backgroundColor: LIGHT, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
      th: { paddingVertical: 8, paddingHorizontal: 10, fontSize: 9.5, fontWeight: 700, color: GRAY },
      tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
      td: { paddingVertical: 10, paddingHorizontal: 10, fontSize: 10, color: BLACK },
      right: { textAlign: 'right' },
      center: { textAlign: 'center' },
      colDesc: { width: '46%' },
      colQty: { width: '14%' },
      colUnit: { width: '20%' },
      colTotal: { width: '20%' },
      totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
      totalsBox: { width: 240, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
      totalsLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
      totalsLineLast: { borderBottomWidth: 0 },
      totalsLabel: { fontSize: 10, color: GRAY, fontWeight: 700 },
      totalsValue: { fontSize: 10, color: BLACK, fontWeight: 700 },
      footer: { position: 'absolute', left: 40, right: 40, bottom: 18, fontSize: 9, color: GRAY, flexDirection: 'row', justifyContent: 'space-between' },
      footerRight: { color: '#ffffff', fontWeight: 700 },
    })

    const Doc = () =>
      React.createElement(
        Document,
        null,
        React.createElement(
          Page,
          { size: 'A4', style: styles.page },
          React.createElement(View, { style: styles.barLeft }),
          React.createElement(View, { style: styles.barBottomRight }),
          React.createElement(
            View,
            { style: styles.headerRow },
            body.logoUrl ? React.createElement(Image, { style: styles.logo, src: body.logoUrl }) : React.createElement(View, null),
            React.createElement(
              View,
              { style: { alignItems: 'flex-end' } },
              React.createElement(Text, { style: styles.title }, 'AVOIR'),
              React.createElement(Text, { style: styles.subtitle }, body.creditNoteNumber)
            )
          ),
          React.createElement(
            View,
            { style: styles.partyRow },
            React.createElement(
              View,
              { style: styles.partyBlock },
              React.createElement(Text, { style: styles.partyName }, body.seller.name),
              ...(body.seller.addressLines || []).map((l, i) => React.createElement(Text, { key: `s-${i}`, style: styles.partyLine }, l)),
              body.seller.siret ? React.createElement(Text, { style: [styles.partyLine, { marginTop: 6 }] }, `SIRET : ${body.seller.siret}`) : null
            ),
            React.createElement(
              View,
              { style: [styles.partyBlock, { alignItems: 'flex-end' }] },
              React.createElement(Text, { style: styles.partyName }, body.buyer.name),
              ...(body.buyer.addressLines || []).map((l, i) => React.createElement(Text, { key: `b-${i}`, style: styles.partyLine }, l)),
              body.buyer.siret ? React.createElement(Text, { style: [styles.partyLine, { marginTop: 6 }] }, `SIRET : ${body.buyer.siret}`) : null
            )
          ),
          React.createElement(
            View,
            { style: styles.metaRow },
            React.createElement(
              View,
              null,
              React.createElement(Text, { style: styles.metaItem }, "Date d'émission"),
              React.createElement(Text, { style: styles.metaValue }, formatDateFr(body.dateIssue)),
              body.referenceInvoiceNumber
                ? React.createElement(Text, { style: [styles.metaItem, { marginTop: 8 }] }, 'Référence facture')
                : null,
              body.referenceInvoiceNumber
                ? React.createElement(Text, { style: styles.metaValue }, body.referenceInvoiceNumber)
                : null
            ),
            React.createElement(View, { style: { alignItems: 'flex-end' } }, React.createElement(Text, { style: styles.metaItem }, ''))
          ),
          React.createElement(
            View,
            { style: styles.table },
            React.createElement(
              View,
              { style: styles.tableHeader },
              React.createElement(Text, { style: [styles.th, styles.colDesc] }, 'Description'),
              React.createElement(Text, { style: [styles.th, styles.colQty, styles.center] }, 'Qté'),
              React.createElement(Text, { style: [styles.th, styles.colUnit, styles.right] }, 'PU HT'),
              React.createElement(Text, { style: [styles.th, styles.colTotal, styles.right] }, 'Total')
            ),
            ...(body.lines || []).map((l, i) =>
              React.createElement(
                View,
                { key: `l-${i}`, style: styles.tr },
                React.createElement(Text, { style: [styles.td, styles.colDesc] }, l.description || ''),
                React.createElement(Text, { style: [styles.td, styles.colQty, styles.center] }, String(l.qty ?? '')),
                React.createElement(Text, { style: [styles.td, styles.colUnit, styles.right] }, formatMoney(Number(l.unitPrice || 0))),
                React.createElement(Text, { style: [styles.td, styles.colTotal, styles.right] }, formatMoney(Number(l.qty || 0) * Number(l.unitPrice || 0)))
              )
            )
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
            { style: styles.footer },
            React.createElement(Text, null, 'Document généré par Spyke'),
            React.createElement(Text, { style: styles.footerRight }, new Date().toLocaleDateString('fr-FR'))
          )
        )
      )

    const instance = pdf(React.createElement(Doc))
    const buffer = await instance.toBuffer()

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="Avoir-${body.creditNoteNumber}.pdf"`,
        'cache-control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 400 })
  }
}
