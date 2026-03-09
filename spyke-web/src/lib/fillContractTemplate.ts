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

  // In Next/Vercel, pdfjs "fake worker" still needs a resolvable worker module.
  // Depending on how the ESM module is wrapped by the bundler, GlobalWorkerOptions can live on
  // either the module namespace or on a default export.
  try {
    const gwo = (pdfjs as any).GlobalWorkerOptions || (pdfjs as any).default?.GlobalWorkerOptions
    if (gwo) {
      gwo.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.mjs'
      // Make sure we don't keep a stale worker port.
      try { gwo.workerPort = null } catch {}
    }
  } catch {
    // ignore
  }

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

    // Some placeholders in the template can be split across multiple text items
    // (e.g. "[NOM" + "PRESTATAIRE]"). We therefore try to match replacements
    // using 1..N consecutive items.
    for (let i = 0; i < items.length; i++) {
      const it0 = items[i]
      const s0 = String(it0?.str || '')
      if (!norm(s0)) continue

      // Try to match from longest to shortest to avoid partial matches.
      const maxJoin = 4
      let matchedLen = 0
      let matchedValue: string | undefined

      for (let len = Math.min(maxJoin, items.length - i); len >= 1; len--) {
        const parts = [] as string[]
        for (let j = 0; j < len; j++) {
          const s = String(items[i + j]?.str || '')
          if (norm(s)) parts.push(s)
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

      const segs = items.slice(i, i + matchedLen)
        .map((seg) => {
          const tr = (seg.transform || []) as number[]
          const x = Number(tr[4] ?? NaN)
          const y = Number(tr[5] ?? NaN)
          const w = Number(seg.width ?? 0)
          const h = Math.max(Number(seg.height ?? 0), 10)
          const fontSize = Math.max(9, Math.min(12, Math.abs(Number(tr[0] ?? 10)) || 10))
          return { tr, x, y, w, h, fontSize }
        })
        .filter((s) => Number.isFinite(s.x) && Number.isFinite(s.y))

      if (!segs.length) {
        i += matchedLen - 1
        continue
      }

      const xMin = Math.min(...segs.map((s) => s.x))
      const yMax = Math.max(...segs.map((s) => s.y))
      const xMax = Math.max(...segs.map((s) => s.x + Math.max(s.w, 10)))
      const hMax = Math.max(...segs.map((s) => s.h))
      const fontSize = segs[0].fontSize

      // Cover each original segment (placeholders), then draw replacement once.
      for (const s of segs) {
        outPage.drawRectangle({
          x: s.x,
          y: s.y - 2,
          width: Math.max(s.w, 10),
          height: s.h + 4,
          color: rgb(1, 1, 1),
          opacity: 1,
        })
      }

      outPage.drawText(matchedValue, {
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
