import { NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function verifyState(state: string, secret: string): any {
  const [b64, sig] = String(state || '').split('.')
  if (!b64 || !sig) throw new Error('Invalid state')
  const expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid state signature')
  const json = Buffer.from(b64, 'base64url').toString('utf8')
  const payload = JSON.parse(json)
  const now = Math.floor(Date.now() / 1000)
  if (payload?.exp && now > Number(payload.exp)) throw new Error('State expired')
  if (!payload?.userId) throw new Error('Invalid state payload')
  return payload
}

export async function GET(req: Request) {
  let url: URL | null = null
  try {
    url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=${encodeURIComponent(error)}`, url.origin))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=missing_params`, url.origin))
    }

    let st: any
    try {
      const stateSecret = requireEnv('GMAIL_OAUTH_STATE_SECRET')
      st = verifyState(state, stateSecret)
    } catch {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=invalid_state`, url.origin))
    }

    const googleClientId = requireEnv('GOOGLE_CLIENT_ID')
    const googleClientSecret = requireEnv('GOOGLE_CLIENT_SECRET')
    const gmailRedirectUri = requireEnv('GMAIL_REDIRECT_URI')

    const oauth2 = new OAuth2Client({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri: gmailRedirectUri,
    })

    let tokens: any
    try {
      const r = await oauth2.getToken(code)
      tokens = r.tokens
    } catch {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=token_exchange_failed`, url.origin))
    }

    const refreshToken = tokens.refresh_token

    // If the user already consented before, Google may omit refresh_token.
    // In that case we can't keep long-lived access; user must revoke and retry.
    if (!refreshToken) {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=no_refresh_token`, url.origin))
    }

    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null

    // Best-effort: retrieve the Gmail account email for display.
    // Prefer userinfo endpoint, fallback to id_token payload (if present).
    let gmailEmail: string | null = null
    try {
      const at = String(tokens.access_token || '')
      if (at) {
        const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${at}` },
        })
        const j: any = await r.json().catch(() => null)
        if (r.ok && j?.email) gmailEmail = String(j.email)
      }
    } catch {
      // ignore
    }

    if (!gmailEmail) {
      try {
        const idToken = String(tokens.id_token || '')
        const parts = idToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
          if (payload?.email) gmailEmail = String(payload.email)
        }
      } catch {
        // ignore
      }
    }

    const { error: upsertError } = await supabaseAdmin
      .from('google_gmail_tokens')
      .upsert(
        {
          user_id: st.userId,
          refresh_token: refreshToken,
          access_token: tokens.access_token || null,
          expires_at: expiresAt,
          gmail_email: gmailEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) {
      // Log error details server-side (no secrets)
      try {
        console.error('gmail token upsert failed', {
          code: (upsertError as any)?.code,
          message: (upsertError as any)?.message,
          details: (upsertError as any)?.details,
          hint: (upsertError as any)?.hint,
        })
      } catch {}

      const code = encodeURIComponent(String((upsertError as any)?.code || ''))
      const msg = encodeURIComponent(String((upsertError as any)?.message || ''))
      return NextResponse.redirect(
        new URL(`/onboarding.html?gmail=error&reason=supabase_upsert_failed&code=${code}&msg=${msg}`, url.origin)
      )
    }

    // If user already completed onboarding, don't send them back to onboarding.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', st.userId)
      .maybeSingle()

    const onboardingDone = Boolean((profile as any)?.onboarding_completed)

    // Prefer returning user to the page they started the OAuth from (if provided)
    let returnTo = String((st as any)?.returnTo || '')
    if (!returnTo.startsWith('/')) returnTo = ''

    const fallback = onboardingDone ? '/app.html?gmail=connected' : '/onboarding.html?gmail=connected'
    const redirectTo = returnTo ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}gmail=connected` : fallback

    return NextResponse.redirect(new URL(redirectTo, url.origin))
  } catch (e: any) {
    // server-side log for Vercel (no secrets)
    try {
      console.error('gmail oauth callback failed', {
        message: String(e?.message || e || ''),
        name: String(e?.name || ''),
      })
    } catch {}

    const origin = (() => {
      try {
        return (url || new URL(req.url)).origin
      } catch {
        return 'https://www.spykeapp.fr'
      }
    })()
    return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=callback_failed`, origin))
  }
}
