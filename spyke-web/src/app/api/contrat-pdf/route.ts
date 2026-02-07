import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  title: z.string().default('Contrat'),
  date: z.string().default(''),
  logoUrl: z.string().optional().default(''),
  contractText: z.string().min(1),
  parties: z
    .object({
      sellerName: z.string().optional().default(''),
      buyerName: z.string().optional().default(''),
    })
    .optional()
    .default({ sellerName: '', buyerName: '' }),
})

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
      mono: {
        fontFamily: 'Courier',
        fontSize: 10,
        lineHeight: 1.5,
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
              body.date ? React.createElement(Text, { style: styles.subtitle }, `Date : ${body.date}`) : null
            )
          ),
          React.createElement(View, { style: styles.box }, React.createElement(Text, { style: styles.mono }, body.contractText)),
          React.createElement(
            View,
            { style: styles.footer },
            React.createElement(Text, null, body.parties?.sellerName ? `Prestataire: ${body.parties.sellerName}` : ''),
            React.createElement(Text, null, body.parties?.buyerName ? `Client: ${body.parties.buyerName}` : ''),
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
