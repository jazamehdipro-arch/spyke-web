import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { extractSigningLink, nameToFirstLast, yousignFetch, yousignJson } from '@/lib/yousign'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  contractId: z.string().uuid(),
  // default: send to client only; seller_first creates 2 signers and returns seller signing link
  mode: z.enum(['buyer_only', 'seller_first']).optional(),
})

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const appBaseUrl = process.env.APP_BASE_URL

    if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    if (!appBaseUrl) return NextResponse.json({ error: 'APP_BASE_URL manquant côté serveur' }, { status: 500 })

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })

    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const body = BodySchema.parse(await req.json())
    const mode = body.mode || 'buyer_only'

    // Authenticated Supabase client (RLS enforced)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = userData.user.id

    const { data: contract, error: cErr } = await supabase
      .from('contracts')
      .select('id,number,title,contract_text,mission_start,mission_end,amount_ht,tva_regime,buyer_snapshot,seller_snapshot,created_at')
      .eq('id', body.contractId)
      .eq('user_id', userId)
      .maybeSingle()

    if (cErr) throw cErr
    if (!contract) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })

    const buyer = (contract as any).buyer_snapshot || {}
    const seller = (contract as any).seller_snapshot || {}

    const buyerName = String(buyer?.name || '').trim()
    const buyerEmail = String(buyer?.email || '').trim()

    // Seller email: prefer connected Gmail (if any), else auth email
    let sellerEmail = String((seller as any)?.email || userData.user.email || '').trim()
    try {
      const { data: tokenRow } = await supabase
        .from('google_gmail_tokens')
        .select('gmail_email')
        .eq('user_id', userId)
        .maybeSingle()
      const gmailEmail = String((tokenRow as any)?.gmail_email || '').trim()
      if (gmailEmail) sellerEmail = gmailEmail
    } catch {
      // ignore
    }

    if (!buyerEmail) {
      return NextResponse.json(
        { error: "Email du client manquant (champ 'email' dans buyer_snapshot)." },
        { status: 400 }
      )
    }

    if (mode === 'seller_first' && !sellerEmail) {
      return NextResponse.json(
        { error: "Email du prestataire introuvable (connecte Gmail ou renseigne l'email dans le profil)." },
        { status: 400 }
      )
    }

    // 1) Generate the PDF via existing internal API (same rendering as the UI)
    const pdfRes = await fetch(`${appBaseUrl.replace(/\/+$/, '')}/api/contrat-pdf`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: contract.title || 'Contrat',
        date: new Date(String((contract as any).created_at || new Date().toISOString())).toISOString().slice(0, 10),
        contractText: String((contract as any).contract_text || ''),
        contractNumber: String((contract as any).number || ''),
        seller: {
          name: String(seller?.name || ''),
          siret: String(seller?.siret || ''),
          address: Array.isArray(seller?.addressLines) ? String(seller.addressLines.join(', ')) : String(seller?.address || ''),
          activity: String(seller?.activity || ''),
          email: String(seller?.email || ''),
        },
        buyer: {
          name: buyerName,
          siret: String(buyer?.siret || ''),
          representant: String(buyer?.representant || ''),
          address: Array.isArray(buyer?.addressLines) ? String(buyer.addressLines.join(', ')) : String(buyer?.address || ''),
          email: buyerEmail,
        },
        mission: {
          startDate: String((contract as any).mission_start || ''),
          endDate: String((contract as any).mission_end || ''),
          location: '',
          revisions: '',
          description: '',
          deliverables: '',
        },
        pricing: {
          type: 'forfait',
          amount: String((contract as any).amount_ht ?? ''),
        },
        vatRegime: String((contract as any).tva_regime || ''),
      }),
    })

    if (!pdfRes.ok) {
      const t = await pdfRes.text().catch(() => '')
      throw new Error(`Erreur génération PDF: ${pdfRes.status} ${t}`)
    }

    const pdfBytes = new Uint8Array(await pdfRes.arrayBuffer())

    // 2) Yousign: initiate signature request
    const sr = await yousignJson<any>('signature_requests', {
      method: 'POST',
      body: JSON.stringify({
        name: `Contrat ${(contract as any).number || ''}`.trim() || 'Contrat',
        delivery_mode: 'email',
        timezone: 'Europe/Paris',
      }),
    })

    const signatureRequestId = String(sr?.id || '')
    if (!signatureRequestId) throw new Error('Yousign: signature_request.id manquant')

    // 3) Upload document
    const form = new FormData()
    form.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), `contrat-${(contract as any).number || contract.id}.pdf`)
    form.append('nature', 'signable_document')
    form.append('parse_anchors', 'false')

    const docRes = await yousignFetch(`signature_requests/${signatureRequestId}/documents`, {
      method: 'POST',
      body: form,
    })
    const doc = await docRes.json()

    const documentId = String((doc as any)?.id || '')
    if (!documentId) throw new Error('Yousign: document.id manquant')

    // 4) Add signer(s) + signature field(s)
    // Our contract template has a signature block at the bottom of page 2.
    // These coordinates are MVP defaults for the current PDF layout.
    const SIG_PAGE = 2
    const SELLER_SIG = { x: 120, y: 620 }
    const BUYER_SIG = { x: 120, y: 705 }

    let sellerSigner: any = null
    let buyerSigner: any = null

    async function createSigner(payload: any) {
      try {
        return await yousignJson<any>(`signature_requests/${signatureRequestId}/signers`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } catch (e: any) {
        // Some Yousign workspaces/accounts don't support signer ordering params.
        // Retry without any ordering fields.
        const msg = String(e?.message || '')
        const shouldRetryWithoutOrder =
          msg.includes('extra_arguments_not_allowed') ||
          msg.includes('Extra attributes are not allowed') ||
          msg.toLowerCase().includes('unknown') ||
          msg.includes('parameters_not_valid') ||
          msg.includes('invalid')

        if (!shouldRetryWithoutOrder) throw e

        const cloned = JSON.parse(JSON.stringify(payload))
        delete cloned?.signing_order
        delete cloned?.signingOrder
        delete cloned?.order
        delete cloned?.rank

        return await yousignJson<any>(`signature_requests/${signatureRequestId}/signers`, {
          method: 'POST',
          body: JSON.stringify(cloned),
        })
      }
    }

    if (mode === 'seller_first') {
      const sellerName = String(seller?.name || 'Prestataire').trim() || 'Prestataire'
      const s = nameToFirstLast(sellerName)
      sellerSigner = await createSigner({
        // best-effort ordering
        signing_order: 1,
        info: {
          first_name: s.first_name,
          last_name: s.last_name,
          email: sellerEmail,
          locale: 'fr',
        },
        signature_level: 'electronic_signature',
        signature_authentication_mode: 'no_otp',
        fields: [
          {
            document_id: documentId,
            type: 'signature',
            page: SIG_PAGE,
            x: SELLER_SIG.x,
            y: SELLER_SIG.y,
          },
        ],
      })
    }

    const buyerNames = nameToFirstLast(buyerName || 'Client')
    const buyerPhone = String(buyer?.phone_number || buyer?.phone || '').trim()
    const buyerInfo: any = {
      first_name: buyerNames.first_name,
      last_name: buyerNames.last_name,
      email: buyerEmail,
      locale: 'fr',
    }
    if (buyerPhone) buyerInfo.phone_number = buyerPhone

    buyerSigner = await createSigner({
      ...(mode === 'seller_first' ? { signing_order: 2 } : {}),
      info: buyerInfo,
      signature_level: 'electronic_signature',
      signature_authentication_mode: 'no_otp',
      fields: [
        {
          document_id: documentId,
          type: 'signature',
          page: SIG_PAGE,
          x: BUYER_SIG.x,
          y: BUYER_SIG.y,
        },
      ],
    })

    const buyerSignerId = String(buyerSigner?.id || '')

    // 5) Activate
    await yousignFetch(`signature_requests/${signatureRequestId}/activate`, { method: 'POST' })

    // 6) Best-effort: fetch signing links
    let signingUrl = ''
    let sellerSigningUrl = ''
    try {
      const signers = await yousignJson<any>(`signature_requests/${signatureRequestId}/signers`, { method: 'GET' })
      signingUrl = extractSigningLink(signers) || extractSigningLink(buyerSigner)
      // if we created seller first, prefer its link for the initial UI popup
      if (mode === 'seller_first') {
        const maybe = extractSigningLink(signers?.signers?.[0] || signers?.data?.[0] || sellerSigner)
        sellerSigningUrl = maybe || extractSigningLink(sellerSigner)
      }
    } catch {
      signingUrl = extractSigningLink(buyerSigner)
      if (mode === 'seller_first') sellerSigningUrl = extractSigningLink(sellerSigner)
    }

    // Persist in DB
    const { error: insErr } = await supabase.from('signature_requests').insert({
      user_id: userId,
      contract_id: contract.id,
      provider: 'yousign',
      provider_request_id: signatureRequestId,
      provider_document_id: documentId,
      provider_signer_id: buyerSignerId || null,
      status: String(sr?.status || 'ongoing'),
      signing_url: (mode === 'seller_first' ? sellerSigningUrl : signingUrl) || null,
    } as any)

    if (insErr) throw insErr

    return NextResponse.json({
      ok: true,
      signatureRequestId,
      signingUrl: mode === 'seller_first' ? sellerSigningUrl || signingUrl : signingUrl,
      status: String(sr?.status || 'ongoing'),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
