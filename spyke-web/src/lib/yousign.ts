export type YousignConfig = {
  apiKey: string
  baseUrl: string
}

export function requireYousignConfig(): YousignConfig {
  const apiKey = process.env.YOUSIGN_API_KEY
  const baseUrl = process.env.YOUSIGN_BASE_URL || 'https://api-sandbox.yousign.app/v3'
  if (!apiKey) throw new Error('YOUSIGN_API_KEY manquant côté serveur')
  if (!baseUrl) throw new Error('YOUSIGN_BASE_URL manquant côté serveur')
  return { apiKey, baseUrl }
}

export async function yousignFetch(path: string, init: RequestInit & { config?: YousignConfig } = {}) {
  const config = init.config || requireYousignConfig()
  const url = `${config.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

  const headers = new Headers(init.headers || {})
  headers.set('authorization', `Bearer ${config.apiKey}`)

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Yousign API error ${res.status}: ${text || res.statusText}`)
  }
  return res
}

export async function yousignJson<T>(path: string, init: RequestInit & { config?: YousignConfig } = {}): Promise<T> {
  const headers = new Headers(init.headers || {})
  if (!headers.has('content-type') && !(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json')
  }
  const res = await yousignFetch(path, { ...init, headers })
  return (await res.json()) as T
}

export function nameToFirstLast(fullName: string): { first_name: string; last_name: string } {
  const s = String(fullName || '').trim().replace(/\s+/g, ' ')
  if (!s) return { first_name: '', last_name: '' }
  const parts = s.split(' ')
  if (parts.length === 1) return { first_name: parts[0], last_name: ' ' }
  return {
    first_name: parts.slice(0, -1).join(' '),
    last_name: parts.slice(-1).join(' '),
  }
}

export function extractSigningLink(obj: any): string {
  const candidates: any[] = []
  if (obj && typeof obj === 'object') candidates.push(obj)
  // sometimes returned as {signers:[{signature_link:...}]}
  if (obj?.signers) candidates.push(...obj.signers)
  if (obj?.data) candidates.push(obj.data)

  for (const c of candidates) {
    const v = (c as any)?.signature_link || (c as any)?.signing_link || (c as any)?.signer_link
    if (typeof v === 'string' && v.startsWith('http')) return v
    if (v && typeof v === 'object') {
      const u = (v as any)?.url || (v as any)?.redirect_url || (v as any)?.href
      if (typeof u === 'string' && u.startsWith('http')) return u
    }
  }
  return ''
}
