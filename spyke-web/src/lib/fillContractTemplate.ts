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

  // pdfjs-dist expects DOMMatrix in some Node environments.
  // Provide a tiny 2D DOMMatrix polyfill when missing.
  if (typeof (globalThis as any).DOMMatrix === 'undefined') {
    ;(globalThis as any).DOMMatrix = class DOMMatrixPolyfill {
      a: number
      b: number
      c: number
      d: number
      e: number
      f: number

      constructor(init?: any) {
        // Support: [a,b,c,d,e,f]
        const arr = Array.isArray(init) ? init : null
        this.a = Number(arr?.[0] ?? 1)
        this.b = Number(arr?.[1] ?? 0)
        this.c = Number(arr?.[2] ?? 0)
        this.d = Number(arr?.[3] ?? 1)
        this.e = Number(arr?.[4] ?? 0)
        this.f = Number(arr?.[5] ?? 0)
      }

      multiply(other: any) {
        const o = other instanceof (globalThis as any).DOMMatrix ? other : new (globalThis as any).DOMMatrix(other)
        const a = this.a * o.a + this.c * o.b
        const b = this.b * o.a + this.d * o.b
        const c = this.a * o.c + this.c * o.d
        const d = this.b * o.c + this.d * o.d
        const e = this.a * o.e + this.c * o.f + this.e
        const f = this.b * o.e + this.d * o.f + this.f
        return new (globalThis as any).DOMMatrix([a, b, c, d, e, f])
      }

      inverse() {
        const det = this.a * this.d - this.b * this.c
        if (!det) return new (globalThis as any).DOMMatrix([1, 0, 0, 1, 0, 0])
        const a = this.d / det
        const b = -this.b / det
        const c = -this.c / det
        const d = this.a / det
        const e = (this.c * this.f - this.d * this.e) / det
        const f = (this.b * this.e - this.a * this.f) / det
        return new (globalThis as any).DOMMatrix([a, b, c, d, e, f])
      }

      toFloat64Array() {
        return Float64Array.from([this.a, this.b, this.c, this.d, this.e, this.f])
      }
    }
  }

  // Lazy-load pdfjs (ESM) in Node runtime.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const loadingTask = (pdfjs as any).getDocument({
    data: opts.templateBytes,
    disableWorker: true,
  })
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
