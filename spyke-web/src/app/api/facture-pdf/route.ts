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

    const ORANGE = '#ff6b4a'
    const BLACK = '#111111'
    const GRAY = '#6b7280'
    const LIGHT = '#f3f4f6'

    const styles = StyleSheet.create({
      page: {
        paddingTop: 34,
        paddingBottom: 30,
        paddingHorizontal: 40,
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: BLACK,
      },
      barLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 22,
        backgroundColor: ORANGE,
      },
      barBottomRight: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 80,
        height: 50,
        backgroundColor: ORANGE,
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
      },
      brandBlock: {
        width: '55%',
      },
      logo: {
        height: 26,
        marginBottom: 8,
        objectFit: 'contain',
      },
      brandName: {
        fontSize: 16,
        fontWeight: 700,
        color: ORANGE,
        letterSpacing: 0.5,
      },
      title: {
        fontSize: 44,
        fontWeight: 800,
        color: ORANGE,
        letterSpacing: 1,
      },
      metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: BLACK,
      },
      metaLeft: { width: '50%' },
      metaRight: { width: '50%', alignItems: 'flex-end' },
      metaText: { fontSize: 12, fontWeight: 700 },
      metaLabel: { fontSize: 12, fontWeight: 700 },
      partiesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        marginBottom: 12,
      },
      party: { width: '48%' },
      partyTitle: { fontSize: 12, fontWeight: 800, marginBottom: 6 },
      partyLine: { fontSize: 10, lineHeight: 1.35 },
      partyMuted: { fontSize: 10, color: GRAY },

      table: {
        marginTop: 10,
      },
      tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: BLACK,
        paddingBottom: 6,
        marginBottom: 6,
      },
      th: { fontSize: 11, fontWeight: 800 },
      row: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: BLACK,
      },
      cell: { fontSize: 12 },
      colDesc: { width: '52%' },
      colUnit: { width: '16%', textAlign: 'right' },
      colQty: { width: '12%', textAlign: 'center' },
      colTotal: { width: '20%', textAlign: 'right' },

      totalsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
      },
      totalsBox: { width: 280 },
      totalsLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
      },
      totalsLabel: { fontSize: 14, fontWeight: 800 },
      totalsValue: { fontSize: 14, fontWeight: 800 },
      totalsSmall: { fontSize: 11, color: GRAY, marginTop: 4, textAlign: 'right' },

      paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
      },
      paymentBlock: { width: '52%' },
      paymentTitle: { fontSize: 14, fontWeight: 800, marginBottom: 6 },
      paymentText: { fontSize: 10, lineHeight: 1.35 },

      footer: {
        marginTop: 14,
        fontSize: 8.8,
        color: GRAY,
        lineHeight: 1.35,
      },
    })

    const paddedLines = (() => {
      const base = (body.lines || []).map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
      }))
      while (base.length < 5) base.push({ description: '-', qty: 1, unitPrice: 0 })
      return base.slice(0, 8)
    })()

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
            React.createElement(
              View,
              { style: styles.brandBlock },
              body.logoUrl ? React.createElement(Image, { style: styles.logo, src: body.logoUrl }) : null,
              React.createElement(Text, { style: styles.brandName }, body.seller.name.toUpperCase())
            ),
            React.createElement(Text, { style: styles.title }, 'FACTURE')
          ),

          React.createElement(
            View,
            { style: styles.metaRow },
            React.createElement(
              View,
              { style: styles.metaLeft },
              React.createElement(Text, { style: styles.metaText }, `DATE : ${formatDateFr(body.dateIssue)}`),
              body.dueDate ? React.createElement(Text, { style: styles.metaText }, `ÉCHÉANCE : ${formatDateFr(body.dueDate)}`) : null
            ),
            React.createElement(
              View,
              { style: styles.metaRight },
              React.createElement(Text, { style: styles.metaLabel }, `FACTURE N° : ${body.invoiceNumber}`)
            )
          ),

          React.createElement(
            View,
            { style: styles.partiesRow },
            React.createElement(
              View,
              { style: styles.party },
              React.createElement(Text, { style: styles.partyTitle }, 'ÉMETTEUR :'),
              React.createElement(Text, { style: styles.partyLine }, body.seller.name),
              ...(body.seller.addressLines || []).map((l, i) => React.createElement(Text, { key: `sa-${i}`, style: styles.partyLine }, l)),
              body.seller.siret ? React.createElement(Text, { style: styles.partyLine }, `SIRET : ${body.seller.siret}`) : null
            ),
            React.createElement(
              View,
              { style: [styles.party, { alignItems: 'flex-end' }] },
              React.createElement(Text, { style: styles.partyTitle }, 'DESTINATAIRE :'),
              React.createElement(Text, { style: styles.partyLine }, body.buyer.name),
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
              React.createElement(Text, { style: [styles.th, styles.colDesc] }, 'Description :'),
              React.createElement(Text, { style: [styles.th, styles.colUnit] }, 'Prix Unitaire :'),
              React.createElement(Text, { style: [styles.th, styles.colQty] }, 'Quantité :'),
              React.createElement(Text, { style: [styles.th, styles.colTotal] }, 'Total :')
            ),
            ...paddedLines.map((l, idx) => {
              const lineTotal = (l.qty || 0) * (l.unitPrice || 0)
              return React.createElement(
                View,
                { key: `r-${idx}`, style: styles.row },
                React.createElement(Text, { style: [styles.cell, styles.colDesc] }, l.description || '-'),
                React.createElement(Text, { style: [styles.cell, styles.colUnit] }, l.unitPrice ? formatMoney(l.unitPrice) : '-'),
                React.createElement(Text, { style: [styles.cell, styles.colQty] }, l.description === '-' ? '-' : String(l.qty || 0)),
                React.createElement(Text, { style: [styles.cell, styles.colTotal] }, lineTotal ? formatMoney(lineTotal) : '-')
              )
            })
          ),

          React.createElement(
            View,
            { style: styles.paymentRow },
            React.createElement(
              View,
              { style: styles.paymentBlock },
              React.createElement(Text, { style: styles.paymentTitle }, 'RÈGLEMENT :'),
              React.createElement(Text, { style: styles.paymentText }, 'Par virement bancaire :'),
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
                React.createElement(Text, { style: styles.totalsLabel }, 'TOTAL HT :'),
                React.createElement(Text, { style: styles.totalsValue }, formatMoney(body.totals.totalHt))
              ),
              body.totals.totalTva > 0
                ? React.createElement(
                    View,
                    { style: styles.totalsLine },
                    React.createElement(Text, { style: styles.totalsLabel }, 'TVA :'),
                    React.createElement(Text, { style: styles.totalsValue }, formatMoney(body.totals.totalTva))
                  )
                : React.createElement(Text, { style: styles.totalsSmall }, 'TVA non applicable, art. 293 B du CGI'),
              React.createElement(
                View,
                { style: styles.totalsLine },
                React.createElement(Text, { style: styles.totalsLabel }, 'TOTAL TTC :'),
                React.createElement(Text, { style: styles.totalsValue }, formatMoney(body.totals.totalTtc))
              )
            )
          ),

          React.createElement(
            Text,
            { style: styles.footer },
            'Paiement par virement sous 30 jours\n'
              + "Pénalités de retard : 13,15 % / an (taux BCE au 01/01/2025 = 3,15 % + 10 points), applicables dès le lendemain de l'échéance.\n"
              + 'Indemnité forfaitaire de recouvrement : 40 € (art. L.441-10 du Code de commerce).\n\n'
              + 'Conditions générales de vente consultables sur le site : www.spykeapp.fr'
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
