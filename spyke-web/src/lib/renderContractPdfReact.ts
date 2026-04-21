import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'

export type ContractPdfInput = {
  title?: string
  date?: string
  logoUrl?: string
  contractNumber?: string
  contractText?: string
  seller?: { name?: string; siret?: string; address?: string; activity?: string; email?: string }
  buyer?: { name?: string; siret?: string; representant?: string; address?: string; email?: string }

  // Freelance signature (prestataire)
  includeSignature?: boolean
  signatureDataUrl?: string // data:... base64

  // Client signature (captured on /sign/contract/[token])
  clientSignatureDataUrl?: string // data:... base64
  clientSignedAt?: string
  clientSignedPlace?: string
}

function norm(s: any) {
  return String(s || '').trim()
}

function has(s: any) {
  return !!norm(s)
}

export async function renderContractPdfReact(input: ContractPdfInput): Promise<Buffer> {
  const styles = StyleSheet.create({
    page: {
      paddingTop: 42,
      paddingBottom: 46,
      paddingHorizontal: 44,
      fontSize: 10.5,
      fontFamily: 'Helvetica',
      color: '#111827',
      lineHeight: 1.45,
    },
    // Removed top "SPYKE" label for cleaner client-facing contract PDFs.
    mainTitle: { fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 6 },
    contractNo: { fontSize: 11, textAlign: 'center', color: '#374151', marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 8 },
    partiesBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 14 },
    partiesGrid: { flexDirection: 'row', gap: 10 },
    col: { width: '50%', padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
    colTitle: { fontSize: 10.5, fontWeight: 800, marginBottom: 8 },
    kv: { fontSize: 10.2, marginBottom: 4 },
    kvLabel: { fontWeight: 700 },
    contentBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, backgroundColor: '#ffffff' },
    h2: { fontSize: 11.5, fontWeight: 800, marginTop: 10, marginBottom: 5 },
    h3: { fontSize: 10.8, fontWeight: 800, marginTop: 6, marginBottom: 4 },
    p: { fontSize: 10.5, lineHeight: 1.5, marginBottom: 7 },
    listItem: { flexDirection: 'row', marginBottom: 4 },
    bullet: { width: 14, fontWeight: 800 },
    listText: { flex: 1, fontSize: 10.5, lineHeight: 1.45 },
    table: { marginTop: 6, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
    trHead: { flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    th: { fontSize: 9.2, fontWeight: 800, padding: 6 },
    td: { fontSize: 9.2, padding: 6 },
    cellJalon: { width: '12%' },
    cellLivrable: { width: '38%' },
    cellDate: { width: '22%' },
    cellMode: { width: '28%' },
    footer: {
      position: 'absolute',
      left: 44,
      right: 44,
      bottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 9,
      color: '#9ca3af',
    },
    subtle: { color: '#6b7280' },
    sigImg: { width: '100%', height: 64, objectFit: 'contain' },
  })

  const seller = input.seller || {}
  const buyer = input.buyer || {}

  const sellerLines: Array<[string, string]> = [
    ['Nom', norm(seller.name)],
    ['Activité', norm(seller.activity)],
    ['SIRET', norm(seller.siret)],
    ['Adresse', norm(seller.address)],
    ['Email', norm(seller.email)],
  ]

  const buyerLines: Array<[string, string]> = [
    ['Nom', norm(buyer.name)],
    ['Représentant', norm(buyer.representant)],
    ['SIRET', norm(buyer.siret)],
    ['Adresse', norm(buyer.address)],
    ['Email', norm(buyer.email)],
  ]

  const signatureDataUrl = input.includeSignature ? norm(input.signatureDataUrl) : ''
  const clientSignatureDataUrl = norm(input.clientSignatureDataUrl)
  const clientSignedAt = norm(input.clientSignedAt)
  const clientSignedPlace = norm(input.clientSignedPlace)

  const bodyText = norm(input.contractText)

  const Doc = () =>
    React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(Text, { style: styles.mainTitle }, 'CONTRAT DE PRESTATION DE SERVICES'),
        React.createElement(Text, { style: styles.contractNo }, `N° ${norm(input.contractNumber) || ''}`.trim()),
        React.createElement(Text, { style: styles.sectionTitle }, 'ENTRE LES SOUSSIGNÉS :'),
        React.createElement(
          View,
          { style: styles.partiesBox },
          React.createElement(
            View,
            { style: styles.partiesGrid },
            React.createElement(
              View,
              { style: styles.col },
              React.createElement(Text, { style: styles.colTitle }, 'LE PRESTATAIRE'),
              ...sellerLines
                .filter(([, v]) => has(v))
                .map(([k, v], idx) =>
                  React.createElement(
                    Text,
                    { key: `s-${idx}`, style: styles.kv },
                    React.createElement(Text, { style: styles.kvLabel }, `${k} : `),
                    v
                  )
                )
            ),
            React.createElement(
              View,
              { style: styles.col },
              React.createElement(Text, { style: styles.colTitle }, 'LE CLIENT'),
              ...buyerLines
                .filter(([, v]) => has(v))
                .map(([k, v], idx) =>
                  React.createElement(
                    Text,
                    { key: `b-${idx}`, style: styles.kv },
                    React.createElement(Text, { style: styles.kvLabel }, `${k} : `),
                    v
                  )
                )
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.contentBox },
          (() => {
            const allLines = String(bodyText || '').split(/\n/)
            // The contract text includes the header + parties section, but we already render it above.
            // Start rendering content at ARTICLE 1 to avoid duplicates.
            const firstArticleIdx = allLines.findIndex((l) => /^\s*ARTICLE\s+1\b/i.test(String(l || '').trim()))
            const lines = firstArticleIdx >= 0 ? allLines.slice(firstArticleIdx) : allLines

            const nodes: any[] = []
            let buf: string[] = []
            let inSignatures = false
            let sigParty: 'PRESTATAIRE' | 'CLIENT' | '' = ''

            const flush = (key: string) => {
              const text = buf
                .map((x) => String(x || '').trim())
                .filter(Boolean)
                .join(' ')
                .trim()
              buf = []
              if (!text) return
              nodes.push(React.createElement(Text, { key, style: styles.p }, text))
            }

            const pushHeading = (key: string, t: string, level: 2 | 3) => {
              nodes.push(React.createElement(Text, { key, style: level === 2 ? styles.h2 : styles.h3 }, t.trim()))
            }

            const pushListItem = (key: string, t: string) => {
              nodes.push(
                React.createElement(
                  View,
                  { key, style: styles.listItem },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(Text, { style: styles.listText }, t.trim())
                )
              )
            }

            const tableHeader = 'Jalon Livrable attendu Date prévue Mode de livraison'

            const pushTable = (key: string, rows: Array<{ jalon: string; livrable: string; date: string; mode: string }>) => {
              nodes.push(
                React.createElement(
                  View,
                  { key, style: styles.table },
                  React.createElement(
                    View,
                    { style: styles.trHead },
                    React.createElement(Text, { style: [styles.th, styles.cellJalon] }, 'Jalon'),
                    React.createElement(Text, { style: [styles.th, styles.cellLivrable] }, 'Livrable attendu'),
                    React.createElement(Text, { style: [styles.th, styles.cellDate] }, 'Date prévue'),
                    React.createElement(Text, { style: [styles.th, styles.cellMode] }, 'Mode')
                  ),
                  ...rows.map((r, idx) =>
                    React.createElement(
                      View,
                      { key: `${key}-r-${idx}`, style: styles.tr },
                      React.createElement(Text, { style: [styles.td, styles.cellJalon] }, r.jalon),
                      React.createElement(Text, { style: [styles.td, styles.cellLivrable] }, r.livrable),
                      React.createElement(Text, { style: [styles.td, styles.cellDate] }, r.date),
                      React.createElement(Text, { style: [styles.td, styles.cellMode] }, r.mode)
                    )
                  )
                )
              )
            }

            let pi = 0
            for (let i = 0; i < lines.length; i++) {
              const raw = String(lines[i] || '')
              const line = raw.trim()

              if (!line) {
                flush(`p-${pi++}`)
                continue
              }

              if (line === tableHeader) {
                flush(`p-${pi++}`)
                const rows: Array<{ jalon: string; livrable: string; date: string; mode: string }> = []
                let j = i + 1
                for (; j < lines.length; j++) {
                  const l2 = String(lines[j] || '').trim()
                  if (!l2) break
                  const m = l2.match(/^(Final|\d+)\s+(.+?)\s+(\[[^\]]+\]|\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|\S+)\s+(\[.*\]|.+)$/)
                  if (m) rows.push({ jalon: m[1], livrable: m[2], date: m[3], mode: m[4] })
                  else break
                }
                if (rows.length) {
                  pushTable(`table-${pi++}`, rows)
                  i = j - 1
                  continue
                }
              }

              if (/^ARTICLE\b/i.test(line)) {
                flush(`p-${pi++}`)
                pushHeading(`h-${pi++}`, line, 2)
                continue
              }

              if (line === 'SIGNATURES') {
                flush(`p-${pi++}`)
                inSignatures = true
                sigParty = ''
                pushHeading(`h-${pi++}`, line, 2)
                continue
              }

              if (/^\d+(?:\.\d+)?\s+—\s+/.test(line) || /^[A-Z]\./.test(line)) {
                flush(`p-${pi++}`)
                pushHeading(`h3-${pi++}`, line, 3)
                continue
              }

              if (line.startsWith('- ')) {
                flush(`p-${pi++}`)
                pushListItem(`li-${pi++}`, line.slice(2))
                continue
              }

              if (inSignatures && line === 'Le PRESTATAIRE') {
                flush(`p-${pi++}`)
                sigParty = 'PRESTATAIRE'
                pushHeading(`h3-${pi++}`, line, 3)
                continue
              }
              if (inSignatures && line === 'Le CLIENT') {
                flush(`p-${pi++}`)
                sigParty = 'CLIENT'
                pushHeading(`h3-${pi++}`, line, 3)
                continue
              }

              if (inSignatures && line.startsWith('Signature') && sigParty === 'PRESTATAIRE') {
                flush(`p-${pi++}`)
                nodes.push(React.createElement(Text, { key: `sig-label-${pi++}`, style: styles.p }, 'Signature :'))
                if (signatureDataUrl) nodes.push(React.createElement(Image, { key: `sig-img-${pi++}`, style: styles.sigImg, src: signatureDataUrl }))
                continue
              }

              if (inSignatures && line.startsWith('Signature') && sigParty === 'CLIENT') {
                flush(`p-${pi++}`)
                nodes.push(React.createElement(Text, { key: `sigc-label-${pi++}`, style: styles.p }, 'Signature :'))
                if (clientSignatureDataUrl) {
                  nodes.push(React.createElement(Image, { key: `sigc-img-${pi++}`, style: styles.sigImg, src: clientSignatureDataUrl }))
                }
                if (clientSignedAt || clientSignedPlace) {
                  const meta = [clientSignedAt ? `Signé le : ${clientSignedAt}` : '', clientSignedPlace ? `À : ${clientSignedPlace}` : ''].filter(Boolean).join(' — ')
                  if (meta) nodes.push(React.createElement(Text, { key: `sigc-meta-${pi++}`, style: styles.subtle }, meta))
                }
                continue
              }

              buf.push(line)
            }

            flush(`p-${pi++}`)
            return React.createElement(View, null, ...nodes)
          })()
        ),
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(Text, null, 'Contrat généré avec Spyke'),
          React.createElement(Text, { render: (p: any) => `Page ${p.pageNumber}/${p.totalPages}` })
        )
      )
    )

  const out: any = await pdf(React.createElement(Doc)).toBuffer()

  if (Buffer.isBuffer(out)) return out
  if (out instanceof Uint8Array) return Buffer.from(out)
  if (out instanceof ArrayBuffer) return Buffer.from(new Uint8Array(out))

  // In some runtimes, react-pdf returns a PDFKit PDFDocument (readable stream).
  if (out && typeof out.on === 'function') {
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      out.on('data', (c: any) => {
        try {
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        } catch {
          // ignore
        }
      })
      out.on('end', () => resolve(Buffer.concat(chunks)))
      out.on('error', reject)
    })
  }

  throw new Error('PDF buffer generation failed (unexpected react-pdf output)')
}
