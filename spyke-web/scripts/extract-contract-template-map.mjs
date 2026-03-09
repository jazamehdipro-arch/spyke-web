import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function norm(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
}

const templatePath = path.join(__dirname, '..', 'public', 'templates', 'contrat-template.pdf')
const outPath = path.join(__dirname, '..', 'src', 'lib', 'contractTemplateMap.json')

const bytes = new Uint8Array(fs.readFileSync(templatePath))

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

const loadingTask = pdfjs.getDocument({ data: bytes, disableWorker: true })
const pdf = await loadingTask.promise

const map = {
  template: 'contrat-template.pdf',
  pages: pdf.numPages,
  extractedAt: new Date().toISOString(),
  items: [],
}

for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
  const page = await pdf.getPage(pageIndex + 1)
  const text = await page.getTextContent()
  const items = text.items || []

  for (const it of items) {
    const str = norm(it.str)
    if (!str) continue
    const tr = it.transform || []
    const x = Number(tr[4] ?? NaN)
    const y = Number(tr[5] ?? NaN)
    const w = Number(it.width ?? 0)
    const h = Math.max(Number(it.height ?? 0), 10)
    const fontSize = Math.max(8, Math.min(14, Math.abs(Number(tr[0] ?? 10)) || 10))
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    // Store everything; runtime will filter by replacement keys.
    map.items.push({
      pageIndex,
      str,
      x,
      y,
      w,
      h,
      fontSize,
    })
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(map, null, 2), 'utf8')
console.log('Wrote', outPath, 'items=', map.items.length)
