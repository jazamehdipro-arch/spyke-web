import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

export async function addPdfWatermark(params: {
  pdfBytes: Uint8Array
  text: string
  // 0..1
  opacity?: number
  // relative size factor (default ~11% of page min dimension)
  scale?: number
}) {
  const { pdfBytes, text } = params
  const opacity = typeof params.opacity === 'number' ? params.opacity : 0.12
  const scale = typeof params.scale === 'number' && params.scale > 0 ? params.scale : 0.11

  // Best-effort: if watermarking fails, return the original PDF bytes.
  // This prevents public PDF endpoints from breaking when pdf-lib can't parse the buffer.
  let doc: PDFDocument
  try {
    doc = await PDFDocument.load(pdfBytes)
  } catch {
    return pdfBytes
  }

  const font = await doc.embedFont(StandardFonts.HelveticaBold)

  const pages = doc.getPages()
  for (const page of pages) {
    const { width, height } = page.getSize()

    const fontSize = Math.max(42, Math.floor(Math.min(width, height) * scale))
    const textWidth = font.widthOfTextAtSize(text, fontSize)

    // Centered watermark with a diagonal rotation
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      rotate: degrees(-25),
      opacity,
    })
  }

  return await doc.save()
}
