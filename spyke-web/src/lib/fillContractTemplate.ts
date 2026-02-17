import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type ReplacementMap = Record<string, string>

type PdfJsItem = {
  str: string
  width?: number
  height?: number
  transform?: number[]
}

function norm(s: string) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Overlay-replace placeholders by locating the placeholder strings using pdfjs text items.
 * This keeps the original template PDF intact, only covering the placeholder text and drawing new text.
 */
export async function fillContractTemplatePdf(opts: { templateBytes: Uint8Array; replacements: ReplacementMap }) {
  const replacementsNorm: ReplacementMap = {}
  for (const [k, v] of Object.entries(opts.replacements || {})) {
    replacementsNorm[norm(k)] = String(v ?? '')
  }

  const pdfDoc = await PDFDocument.load(opts.templateBytes)
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Lazy-load pdfjs (ESM) in Node runtime.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Disable worker in Node.
  ;(pdfjs as any).GlobalWorkerOptions.workerSrc = undefined

  const loadingTask = (pdfjs as any).getDocument({ data: opts.templateBytes })
  const pdf = await loadingTask.promise

  const pageCount = pdf.numPages

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const page = await pdf.getPage(pageIndex + 1)
    const text = await page.getTextContent()
    const items = (text.items || []) as PdfJsItem[]

    const outPage = pdfDoc.getPage(pageIndex)

    for (const it of items) {
      const raw = String(it.str || '')
      const key = norm(raw)
      if (!key) continue
      const repl = replacementsNorm[key]
      if (repl == null) continue

      const tr = (it.transform || []) as number[]
      const x = Number(tr[4] ?? NaN)
      const y = Number(tr[5] ?? NaN)
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue

      const w = Number(it.width ?? 0)
      const h = Math.max(Number(it.height ?? 0), 10)

      // cover old placeholder
      outPage.drawRectangle({
        x,
        y: y - 2,
        width: Math.max(w, 10),
        height: h + 4,
        color: rgb(1, 1, 1),
        opacity: 1,
      })

      // best-effort font size from transform
      const fontSize = Math.max(9, Math.min(12, Math.abs(Number(tr[0] ?? 10)) || 10))

      // Draw replacement (truncate if absurdly long)
      const textValue = String(repl)
      outPage.drawText(textValue, {
        x,
        y,
        size: fontSize,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: Math.max(w, 200),
      })
    }
  }

  const bytes = await pdfDoc.save()
  return new Uint8Array(bytes)
}
