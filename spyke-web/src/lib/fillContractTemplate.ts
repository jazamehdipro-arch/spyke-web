import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import templateMap from './contractTemplateMap.json'

type ReplacementMap = Record<string, string>

type MapItem = {
  pageIndex: number
  str: string
  x: number
  y: number
  w: number
  h: number
  fontSize: number
}

function norm(s: string) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Overlay-replace placeholders using a pre-extracted coordinate map (no pdfjs at runtime).
 * This is Vercel-safe.
 */
export async function fillContractTemplatePdf(opts: { templateBytes: Uint8Array; replacements: ReplacementMap }) {
  const replacementsNorm: ReplacementMap = {}
  for (const [k, v] of Object.entries(opts.replacements || {})) {
    replacementsNorm[norm(k)] = String(v ?? '')
  }

  const pdfDoc = await PDFDocument.load(opts.templateBytes)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const items = (templateMap as any).items as MapItem[]
  const pageCount = pdfDoc.getPageCount()

  // Scan items in extraction order and match 1..N consecutive segments (placeholders can be split).
  const maxJoin = 4

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const page = pdfDoc.getPage(pageIndex)
    const pageItems = items.filter((it) => it.pageIndex === pageIndex)

    for (let i = 0; i < pageItems.length; i++) {
      // Try to match from longest to shortest to avoid partials.
      let matchedLen = 0
      let matchedValue: string | undefined

      for (let len = Math.min(maxJoin, pageItems.length - i); len >= 1; len--) {
        const parts: string[] = []
        for (let j = 0; j < len; j++) {
          const s = norm(pageItems[i + j]?.str)
          if (s) parts.push(s)
        }
        if (!parts.length) continue
        const key = norm(parts.join(' '))
        const repl = replacementsNorm[key]
        if (repl != null) {
          matchedLen = len
          matchedValue = String(repl)
          break
        }
      }

      if (!matchedLen || matchedValue == null) continue

      const segs = pageItems.slice(i, i + matchedLen)

      // Cover each segment rectangle
      for (const s of segs) {
        page.drawRectangle({
          x: s.x,
          y: s.y - 2,
          width: Math.max(s.w, 10),
          height: Math.max(s.h, 10) + 4,
          color: rgb(1, 1, 1),
          opacity: 1,
        })
      }

      // Draw replacement once over the full placeholder bounding box.
      const xMin = Math.min(...segs.map((s) => s.x))
      const yMax = Math.max(...segs.map((s) => s.y))
      const xMax = Math.max(...segs.map((s) => s.x + Math.max(s.w, 10)))
      const fontSize = Math.max(8, Math.min(12, Number(segs[0]?.fontSize || 10)))

      page.drawText(String(matchedValue || ''), {
        x: xMin,
        y: yMax,
        size: fontSize,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: Math.max(xMax - xMin, 200),
      })

      i += matchedLen - 1
    }
  }

  const bytes = await pdfDoc.save()
  return new Uint8Array(bytes)
}
