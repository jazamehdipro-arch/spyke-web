import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !anonKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    }
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur' }, { status: 500 })
    }

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })

    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    // Validate token
    const supabaseAuth = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const docType = String(form.get('type') || 'doc')
    const userId = userData.user.id

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const bucket = 'shares'
    // best effort: create bucket if missing
    try {
      // @ts-ignore
      await supabaseAdmin.storage.createBucket(bucket, { public: false })
    } catch {
      // ignore (already exists or not allowed)
    }

    const now = new Date()
    const stamp = now.toISOString().replace(/[:.]/g, '-')
    const path = `${userId}/${docType}/${stamp}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, file, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (uploadError) throw uploadError

    const expiresIn = 60 * 60 * 24 * 7 // 7 days
    const { data: signed, error: signedError } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresIn)
    if (signedError) throw signedError

    return NextResponse.json({ url: signed?.signedUrl || '' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
