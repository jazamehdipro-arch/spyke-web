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
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=${encodeURIComponent(error)}`, url.origin))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=missing_params`, url.origin))
    }

    const stateSecret = requireEnv('GMAIL_OAUTH_STATE_SECRET')
    const st = verifyState(state, stateSecret)

    const googleClientId = requireEnv('GOOGLE_CLIENT_ID')
    const googleClientSecret = requireEnv('GOOGLE_CLIENT_SECRET')
    const gmailRedirectUri = requireEnv('GMAIL_REDIRECT_URI')

    const oauth2 = new OAuth2Client({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri: gmailRedirectUri,
    })

    const { tokens } = await oauth2.getToken(code)
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

    const { error: upsertError } = await supabaseAdmin
      .from('google_gmail_tokens')
      .upsert(
        {
          user_id: st.userId,
          refresh_token: refreshToken,
          access_token: tokens.access_token || null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) throw upsertError

    // If user already completed onboarding, don't send them back to onboarding.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', st.userId)
      .maybeSingle()

    const onboardingDone = Boolean((profile as any)?.onboarding_completed)
    const redirectTo = onboardingDone ? '/app.html?gmail=connected' : '/onboarding.html?gmail=connected'

    return NextResponse.redirect(new URL(redirectTo, url.origin))
  } catch {
    // Do not leak sensitive info
    const origin = (() => {
      try {
        return new URL(req.url).origin
      } catch {
        return 'https://www.spykeapp.fr'
      }
    })()
    return NextResponse.redirect(new URL(`/onboarding.html?gmail=error&reason=callback_failed`, origin))
  }
}
