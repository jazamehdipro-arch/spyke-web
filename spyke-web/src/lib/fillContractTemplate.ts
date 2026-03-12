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
export async function fillContractTemplatePdf(opts: { templateBytes: Uint8Array; replacements: ReplacementMap }): Promise<{ bytes: Uint8Array; replaced: number }> {
  const replacementsNorm: ReplacementMap = {}
  for (const [k, v] of Object.entries(opts.replacements || {})) {
    replacementsNorm[norm(k)] = String(v ?? '')
  }

  const pdfDoc = await PDFDocument.load(opts.templateBytes)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const items = (templateMap as any).items as MapItem[]
  const pageCount = pdfDoc.getPageCount()

  // Scan items in extraction order and match 1..N consecutive segments (placeholders can be split across many tokens).
  // Increase join window so long placeholders like "[Forme sociale (SARL, SAS, etc.)]" are matched.
  const maxJoin = 12

  let replaced = 0

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

      // Compute a generous bounding box for the matched placeholder and blank it out.
      // (Some placeholders are highlighted or split in a way where per-segment rectangles leave artifacts.)
      const xMin = Math.min(...segs.map((s) => s.x))
      const xMax = Math.max(...segs.map((s) => s.x + Math.max(s.w, 10)))
      const yMax = Math.max(...segs.map((s) => s.y))
      const yMin = Math.min(...segs.map((s) => s.y - Math.max(s.h, 10)))

      const boxW = Math.max(xMax - xMin, 10)
      const boxH = Math.max(yMax - yMin, 10)
      const fontSize = Math.max(8, Math.min(12, Number(segs[0]?.fontSize || 10)))

      // One big white rectangle with padding
      page.drawRectangle({
        x: xMin - 1,
        y: yMin - 2,
        width: boxW + 2,
        height: boxH + 6,
        color: rgb(1, 1, 1),
        opacity: 1,
      })

      const text = String(matchedValue || '').trim()

      // Simple word-wrap (up to 3 lines) to avoid overlapping outside of narrow boxes.
      const wrap = (t: string, maxWidth: number, maxLines: number) => {
        const words = t.split(/\s+/).filter(Boolean)
        const lines: string[] = []
        let cur = ''
        for (const w of words) {
          const next = cur ? cur + ' ' + w : w
          const width = helvetica.widthOfTextAtSize(next, fontSize)
          if (width <= maxWidth || !cur) {
            cur = next
            continue
          }
          lines.push(cur)
          cur = w
          if (lines.length >= maxLines - 1) break
        }
        if (cur) lines.push(cur)
        // Ellipsis if still remaining words
        const usedWords = lines.join(' ').split(/\s+/).length
        if (usedWords < words.length && lines.length) {
          let last = lines[lines.length - 1]
          while (last && helvetica.widthOfTextAtSize(last + '…', fontSize) > maxWidth) {
            last = last.split(' ').slice(0, -1).join(' ')
          }
          lines[lines.length - 1] = (last || '').trim() + '…'
        }
        return lines
      }

      if (text) {
        const lines = wrap(text, Math.max(boxW, 40), 3)
        const lineH = fontSize * 1.15

        for (let li = 0; li < lines.length; li++) {
          page.drawText(lines[li], {
            x: xMin,
            y: yMax - li * lineH,
            size: fontSize,
            font: helvetica,
            color: rgb(0.1, 0.1, 0.1),
            maxWidth: Math.max(boxW, 40),
          })
        }
      }

      replaced++
      i += matchedLen - 1
    }
  }

  const bytes = await pdfDoc.save()
  return { bytes: new Uint8Array(bytes), replaced }
}
