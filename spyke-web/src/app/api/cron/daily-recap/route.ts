import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

export async function GET(req: Request) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get('authorization') || ''
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Yesterday range
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  const dateLabel = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  async function countRange(table: string) {
    const { count } = await db
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lte('created_at', endIso)
    return count ?? 0
  }

  // Page views
  const { count: pageViews } = await db
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'page_view')
    .gte('created_at', startIso)
    .lte('created_at', endIso)

  // SEO PDF generated
  const { count: seoPdfs } = await db
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'pdf_generated')
    .gte('created_at', startIso)
    .lte('created_at', endIso)

  const [newAccounts, newQuotes, newInvoices, newContracts] = await Promise.all([
    countRange('profiles'),
    countRange('quotes'),
    countRange('invoices'),
    countRange('contracts'),
  ])

  const appDocs = newQuotes + newInvoices + newContracts

  // Send email
  const transporter = nodemailer.createTransport({
    host: 'mail.infomaniak.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px; background: #f8fafc; color: #1e293b;">
  <div style="background: #fff; border-radius: 12px; padding: 28px 32px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
    <h2 style="margin: 0 0 4px; font-size: 20px; color: #6366f1;">📊 Récap Spyke</h2>
    <p style="margin: 0 0 24px; font-size: 13px; color: #94a3b8; text-transform: capitalize;">${dateLabel}</p>

    <table style="width: 100%; border-collapse: collapse;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; font-size: 14px; color: #64748b;">👁 Visiteurs (pages vues)</td>
        <td style="padding: 12px 0; font-size: 20px; font-weight: 700; text-align: right; color: #6366f1;">${pageViews ?? 0}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; font-size: 14px; color: #64748b;">👤 Nouveaux comptes créés</td>
        <td style="padding: 12px 0; font-size: 20px; font-weight: 700; text-align: right; color: #0ea5e9;">${newAccounts}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; font-size: 14px; color: #64748b;">📋 Documents créés (comptes)</td>
        <td style="padding: 12px 0; font-size: 20px; font-weight: 700; text-align: right; color: #10b981;">${appDocs}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 0 6px 16px; font-size: 12px; color: #94a3b8;">↳ Devis</td>
        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right; color: #94a3b8;">${newQuotes}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 0 6px 16px; font-size: 12px; color: #94a3b8;">↳ Factures</td>
        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right; color: #94a3b8;">${newInvoices}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 0 6px 16px; font-size: 12px; color: #94a3b8;">↳ Contrats</td>
        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right; color: #94a3b8;">${newContracts}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; font-size: 14px; color: #64748b;">📄 PDF générés (pages SEO)</td>
        <td style="padding: 12px 0; font-size: 20px; font-weight: 700; text-align: right; color: #f59e0b;">${seoPdfs ?? 0}</td>
      </tr>
    </table>

    <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
      <a href="https://www.spykeapp.fr/admin/dashboard" style="display: inline-block; background: #6366f1; color: #fff; border-radius: 8px; padding: 10px 24px; font-size: 13px; font-weight: 600; text-decoration: none;">Voir le dashboard →</a>
    </div>
  </div>
  <p style="text-align: center; font-size: 11px; color: #cbd5e1; margin-top: 16px;">Spyke · spykeapp.fr</p>
</body>
</html>
`

  await transporter.sendMail({
    from: 'Robin de Spyke <contact@spykeapp.fr>',
    to: ADMIN_EMAIL,
    subject: `📊 Récap Spyke — ${dateLabel}`,
    html,
  })

  return NextResponse.json({ ok: true, date: dateLabel, pageViews, newAccounts, appDocs, seoPdfs })
}
