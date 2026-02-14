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
  invoiceNumber: z.string().min(1),
  dateIssue: z.string().min(1),
  dueDate: z.string().optional().default(''),
  logoUrl: z.string().optional().default(''),

  seller: z.object({
    name: z.string().min(1),
    addressLines: z.array(z.string()).default([]),
    siret: z.string().optional().default(''),
    iban: z.string().optional().default(''),
    bic: z.string().optional().default(''),
    bankName: z.string().optional().default(''),
    bankAccount: z.string().optional().default(''),
  }),

  buyer: z.object({
    name: z.string().min(1),
    addressLines: z.array(z.string()).default([]),
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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

    const React = (await import('react')).default
    const { Document, Page, Text, View, Image, StyleSheet, pdf } = await import('@react-pdf/renderer')

    // Harmonise Invoice PDF with Spyke Devis style (clean + modern)
    const BLUE = '#1e3a8a'
    const BLACK = '#0a0a0a'
    const GRAY = '#6b7280'
    const LIGHT = '#eef2ff'

    const styles = StyleSheet.create({
      page: {
        paddingTop: 42,
        paddingBottom: 34,
        paddingHorizontal: 42,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: BLACK,
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
        color: BLUE,
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
        color: BLUE,
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
        backgroundColor: LIGHT,
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
      right: { textAlign: 'right' },
      center: { textAlign: 'center' },
      colDesc: { width: '46%' },
      colQty: { width: '14%' },
      colUnit: { width: '20%' },
      colTotal: { width: '20%' },
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
      paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 18,
      },
      paymentBlock: { width: '54%' },
      paymentTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, color: '#111827' },
      paymentText: { fontSize: 9.5, lineHeight: 1.35, color: '#374151' },
      footer: {
        position: 'absolute',
        left: 42,
        right: 42,
        bottom: 24,
        fontSize: 8.5,
        color: GRAY,
        lineHeight: 1.35,
      },
      footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      footerRight: { textAlign: 'right' },
    })

    const paddedLines = (() => {
      const base = (body.lines || []).map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
      }))
      // Keep the table visually stable
      while (base.length < 6) base.push({ description: '', qty: 0, unitPrice: 0 })
      return base.slice(0, 10)
    })()

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
              React.createElement(Text, { style: styles.partyName }, body.seller.name)
            ),
            React.createElement(
              View,
              { style: [styles.partyBlock, { alignItems: 'flex-end' }] },
              React.createElement(Text, { style: styles.docTitle }, `Facture ${body.invoiceNumber}`),
              React.createElement(Text, { style: styles.docSubtitle }, `Émise le ${formatDateFr(body.dateIssue)}`),
              body.dueDate ? React.createElement(Text, { style: [styles.docSubtitle, { marginTop: 4 }] }, `Échéance ${formatDateFr(body.dueDate)}`) : null
            )
          ),

          React.createElement(
            View,
            { style: styles.metaRow },
            React.createElement(
              View,
              { style: styles.partyBlock },
              React.createElement(Text, { style: [styles.docSubtitle, { fontWeight: 700, color: '#111827' }] }, 'Émetteur'),
              ...(body.seller.addressLines || []).map((l, i) => React.createElement(Text, { key: `sa-${i}`, style: styles.partyLine }, l)),
              body.seller.siret ? React.createElement(Text, { style: [styles.partyLine, { marginTop: 6 }] }, `SIRET : ${body.seller.siret}`) : null
            ),
            React.createElement(
              View,
              { style: [styles.partyBlock, { alignItems: 'flex-end' }] },
              React.createElement(Text, { style: [styles.docSubtitle, { fontWeight: 700, color: '#111827' }] }, 'Client'),
              React.createElement(Text, { style: [styles.partyLine, { textAlign: 'right' }] }, body.buyer.name),
              ...(body.buyer.addressLines || []).map((l, i) =>
                React.createElement(Text, { key: `ba-${i}`, style: [styles.partyLine, { textAlign: 'right' }] }, l)
              )
            )
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
            ...paddedLines.map((l, idx) => {
              const lineTotal = (l.qty || 0) * (l.unitPrice || 0)
              const empty = !l.description
              return React.createElement(
                View,
                { key: `r-${idx}`, style: styles.tr },
                React.createElement(Text, { style: [styles.td, styles.colDesc] }, empty ? ' ' : l.description),
                React.createElement(Text, { style: [styles.td, styles.colQty, styles.center] }, empty ? ' ' : String(l.qty || 0)),
                React.createElement(Text, { style: [styles.td, styles.colUnit, styles.right] }, empty ? ' ' : formatMoney(l.unitPrice || 0)),
                React.createElement(Text, { style: [styles.td, styles.colTotal, styles.right] }, empty ? ' ' : formatMoney(lineTotal))
              )
            })
          ),

          React.createElement(
            View,
            { style: styles.paymentRow },
            React.createElement(
              View,
              { style: styles.paymentBlock },
              React.createElement(Text, { style: styles.paymentTitle }, 'Règlement'),
              React.createElement(Text, { style: styles.paymentText }, 'Par virement bancaire.'),
              body.seller.bankName ? React.createElement(Text, { style: styles.paymentText }, `Banque : ${body.seller.bankName}`) : null,
              body.seller.bankAccount ? React.createElement(Text, { style: styles.paymentText }, `Compte : ${body.seller.bankAccount}`) : null,
              body.seller.iban ? React.createElement(Text, { style: styles.paymentText }, `IBAN : ${body.seller.iban}`) : null,
              body.seller.bic ? React.createElement(Text, { style: styles.paymentText }, `BIC : ${body.seller.bic}`) : null
            ),
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
            Text,
            { style: styles.footer },
            "En cas de retard de paiement, seront exigibles, conformément au code de commerce, une indemnité calculée sur la base de trois fois le taux de l'intérêt légal en vigueur ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40€.\n"
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
              React.createElement(Text, { style: styles.footerRight }, `Facture ${body.invoiceNumber} | Page 1/1`)
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
        'content-disposition': `attachment; filename="Facture-${body.invoiceNumber}.pdf"`,
        'cache-control': 'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
