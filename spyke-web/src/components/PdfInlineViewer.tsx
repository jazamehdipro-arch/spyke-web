'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PdfInlineViewerProps = {
  url: string
}

export default function PdfInlineViewer({ url }: PdfInlineViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const isMobile = useMemo(() => {
    try {
      return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '')
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let revokeObjectUrl: string | null = null

    ;(async () => {
      try {
        setLoading(true)
        setError('')

        const el = containerRef.current
        if (!el) return
        el.innerHTML = ''

        // Lazy-load pdf.js
        // Note: with Next + ESM, use dynamic import.
        const pdfjs = await import('pdfjs-dist')

        // Set worker (CDN). This avoids bundling worker hassles.
        // Version must match installed pdfjs-dist version.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const version = (pdfjs as any)?.version || '5.4.624'
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`

        // Fetch PDF bytes ourselves to avoid CORS surprises and to support blob: URLs.
        let pdfUrl = url
        if (pdfUrl.startsWith('blob:')) {
          // ok
        }

        const res = await fetch(pdfUrl)
        if (!res.ok) throw new Error(`PDF fetch failed (${res.status})`)
        const ab = await res.arrayBuffer()

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const loadingTask = pdfjs.getDocument({ data: ab })
        const doc = await loadingTask.promise

        // Render pages
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          if (cancelled) return
          const page = await doc.getPage(pageNum)

          // Choose a scale that fits mobile but remains readable.
          const viewport = page.getViewport({ scale: isMobile ? 1.15 : 1.4 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) continue

          const outputScale = window.devicePixelRatio || 1
          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          canvas.style.width = `${Math.floor(viewport.width)}px`
          canvas.style.height = `${Math.floor(viewport.height)}px`
          canvas.style.display = 'block'
          canvas.style.margin = '0 auto'
          canvas.style.background = '#fff'
          canvas.style.borderRadius = '10px'
          canvas.style.boxShadow = '0 8px 22px rgba(0,0,0,0.08)'

          const pageWrap = document.createElement('div')
          pageWrap.style.padding = isMobile ? '10px 0' : '16px 0'
          pageWrap.appendChild(canvas)
          el.appendChild(pageWrap)

          const renderContext = {
            canvasContext: context,
            viewport,
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
          }
          await page.render(renderContext as any).promise
        }

        if (cancelled) return
        setLoading(false)
      } catch (e: any) {
        if (cancelled) return
        setLoading(false)
        setError(e?.message || 'PDF preview error')
      }
    })()

    return () => {
      cancelled = true
      try {
        if (revokeObjectUrl) URL.revokeObjectURL(revokeObjectUrl)
      } catch {}
    }
  }, [url, isMobile])

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto', padding: 14 }}>
      {loading ? (
        <div style={{ padding: 18, color: 'rgba(0,0,0,0.6)', fontSize: 13 }}>Chargement du PDF…</div>
      ) : null}

      {error ? (
        <div style={{ padding: 18, color: '#b91c1c', fontSize: 13 }}>
          <div>Aperçu PDF impossible: {error}</div>
          <div style={{ marginTop: 10, color: 'rgba(0,0,0,0.65)' }}>
            Affichage du PDF via le viewer du navigateur (les boutons en bas restent disponibles).
          </div>
          <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.10)', background: '#fff', height: 'min(70vh, 820px)' }}>
            <iframe title="Aperçu PDF" src={url} style={{ width: '100%', height: '100%', border: 0 }} />
          </div>
        </div>
      ) : null}

      <div ref={containerRef} />
    </div>
  )
}
