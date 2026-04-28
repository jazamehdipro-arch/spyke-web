import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (userData.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
      return NextResponse.json({ error: 'Accès réservé admin' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

    if (rows.length === 0) return NextResponse.json({ error: 'Fichier vide ou non lisible' }, { status: 400 })

    // Detect columns case-insensitively
    const firstRow = rows[0]
    const keys = Object.keys(firstRow)
    const find = (candidates: string[]) =>
      keys.find(k => candidates.some(c => k.toLowerCase().includes(c))) ?? null

    const emailKey = find(['email', 'mail', 'e-mail'])
    const nameKey = find(['nom', 'name', 'prénom', 'prenom', 'contact'])
    const jobKey = find(['titre', 'title', 'poste', 'job', 'métier', 'metier', 'fonction'])

    if (!emailKey) return NextResponse.json({ error: 'Colonne email introuvable dans le fichier' }, { status: 400 })

    const contacts = rows
      .map(row => ({
        email: String(row[emailKey] ?? '').trim().toLowerCase(),
        name: nameKey ? String(row[nameKey] ?? '').trim() || null : null,
        job_title: jobKey ? String(row[jobKey] ?? '').trim() || null : null,
      }))
      .filter(c => c.email && c.email.includes('@'))

    if (contacts.length === 0)
      return NextResponse.json({ error: 'Aucun email valide trouvé dans le fichier' }, { status: 400 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Upsert — skip duplicates
    const { error: insertError } = await supabaseAdmin
      .from('outreach_contacts')
      .upsert(contacts, { onConflict: 'email', ignoreDuplicates: true })

    if (insertError) throw insertError

    return NextResponse.json({ ok: true, imported: contacts.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur interne'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
