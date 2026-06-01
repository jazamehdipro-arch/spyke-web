import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET
  if (secret) {
    const provided = req.headers.get('x-webhook-secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const record = body?.record ?? body
  const email = record?.email ?? '?'
  const createdAt = record?.created_at ? new Date(record.created_at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : '?'

  const transporter = nodemailer.createTransport({
    host: 'mail.infomaniak.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.INFOMANIAK_SMTP_USER!,
      pass: process.env.INFOMANIAK_SMTP_PASSWORD!,
    },
  })

  await transporter.sendMail({
    from: 'Spyke <contact@spykeapp.fr>',
    to: ADMIN_EMAIL,
    subject: `🚀 Nouveau compte Spyke : ${email}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0a0a0a;margin:0 0 16px">Nouveau compte créé</h2>
        <p style="margin:0 0 8px;color:#374151"><strong>Email :</strong> ${email}</p>
        <p style="margin:0 0 24px;color:#374151"><strong>Date :</strong> ${createdAt}</p>
        <a href="https://spykeapp.fr/admin/users" style="background:#facc15;color:#0a0a0a;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:14px">Voir dans l'admin →</a>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
