import { OAuth2Client } from 'google-auth-library'

export function makeGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GMAIL_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing env: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GMAIL_REDIRECT_URI')
  }

  return new OAuth2Client({ clientId, clientSecret, redirectUri })
}
