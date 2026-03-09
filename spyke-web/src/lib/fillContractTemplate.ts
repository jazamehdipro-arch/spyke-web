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

  // Group map items by normalized string so we can resolve quickly.
  const buckets = new Map<string, MapItem[]>()
  for (const it of items) {
    const key = norm(it.str)
    if (!key) continue
    const arr = buckets.get(key) || []
    arr.push(it)
    buckets.set(key, arr)
  }

  for (const [rawKey, value] of Object.entries(replacementsNorm)) {
    const segs = buckets.get(rawKey)
    if (!segs || !segs.length) continue

    for (const seg of segs) {
      if (seg.pageIndex < 0 || seg.pageIndex >= pageCount) continue
      const page = pdfDoc.getPage(seg.pageIndex)

      // Cover placeholder
      page.drawRectangle({
        x: seg.x,
        y: seg.y - 2,
        width: Math.max(seg.w, 10),
        height: Math.max(seg.h, 10) + 4,
        color: rgb(1, 1, 1),
        opacity: 1,
      })

      // Draw replacement
      page.drawText(String(value || ''), {
        x: seg.x,
        y: seg.y,
        size: Math.max(8, Math.min(12, Number(seg.fontSize || 10))),
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: Math.max(seg.w, 200),
      })
    }
  }

  const bytes = await pdfDoc.save()
  return new Uint8Array(bytes)
}
