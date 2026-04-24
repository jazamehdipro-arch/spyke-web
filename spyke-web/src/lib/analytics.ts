'use client'

export async function track(eventName: string, props: Record<string, unknown> = {}) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ eventName, props }),
      keepalive: true,
    })
  } catch {
    // best-effort only
  }
}
