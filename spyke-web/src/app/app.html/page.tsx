"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

type Tab = 'dashboard' | 'clients' | 'assistant' | 'devis' | 'analyseur' | 'settings'

type ModalName = 'newClient' | 'newDevis'

type Tone = 'pro' | 'chaleureux' | 'formel'

type Template =
  | 'Réponse client'
  | 'Relance'
  | 'Envoi de devis'
  | 'Envoi facture'
  | 'Négociation'
  | 'Bienvenue'
  | 'Remerciement'

type ClientRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

export default function AppHtmlPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [modal, setModal] = useState<ModalName | null>(null)
  const [tone, setTone] = useState<Tone>('pro')
  const [template, setTemplate] = useState<Template>('Réponse client')

  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const [userFullName, setUserFullName] = useState<string>('')
  const [userPlan, setUserPlan] = useState<string>('Plan Free')
  const [userJob, setUserJob] = useState<string>('')
  const [userDefaultTone, setUserDefaultTone] = useState<string>('')

  const [clients, setClients] = useState<ClientRow[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const [assistantContext, setAssistantContext] = useState<string>('')
  const [assistantOutput, setAssistantOutput] = useState<string>('')

  // Ensure authenticated session for the app
  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        window.location.href = 'connexion.html'
        return
      }
      setUserId(data.session.user.id)
    })()
  }, [supabase])

  // Load profile + clients
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) return
      try {
        setLoading(true)

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name,last_name,job,email_tone')
          .eq('id', userId)
          .maybeSingle()

        const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
        setUserFullName(full || 'Utilisateur')
        setUserJob(String((profile as any)?.job || ''))
        setUserDefaultTone(String((profile as any)?.email_tone || ''))

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id,name,email,phone,notes')
          .order('created_at', { ascending: false })

        if (clientsError) throw clientsError
        setClients((clientsData || []) as ClientRow[])
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase, userId])

  const initials = useMemo(() => {
    const parts = userFullName.split(' ').filter(Boolean)
    const a = parts[0]?.[0] ?? 'U'
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase()
  }, [userFullName])

  async function refreshClients() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('clients')
      .select('id,name,email,phone,notes')
      .order('created_at', { ascending: false })
    if (!error) setClients((data || []) as ClientRow[])
  }

  async function generateAssistantEmail() {
    try {
      setLoading(true)
      setAssistantOutput('')

      const client = clients.find((c) => c.id === selectedClientId)

      const toneLabel =
        tone === 'pro' ? 'professionnel' : tone === 'chaleureux' ? 'chaleureux' : 'formel'

      const prenom = userFullName.split(' ').filter(Boolean)[0] || 'Utilisateur'
      const metier = userJob || 'Freelance'
      const tonPrefere = userDefaultTone || 'professionnel'

      const system = `Tu es l'assistant email de Spyke, un outil pour freelances français.

Tu génères des emails professionnels en français.

RÈGLES :
- Sois concis, pas de blabla inutile
- Adapte le ton selon ce qui est demandé (professionnel, chaleureux, formel, décontracté)
- Utilise le nom du client si fourni
- Ne mets jamais de placeholders comme [Nom] ou [Date], écris directement
- Termine toujours par une formule de politesse adaptée au ton
- Ne mets pas d'objet sauf si demandé
- Écris uniquement l'email, rien d'autre (pas d'explication, pas de commentaire)
- Ne signe jamais “Spyke” ou “Spyke assistance IA”. La signature doit être celle du freelance.

LONGUEUR : Adapte la longueur au contexte.
- Relance / message simple → court (4-6 lignes)
- Réponse détaillée / négociation / explication → plus long si nécessaire

CONTEXTE UTILISATEUR :
- Prénom : ${prenom}
- Métier : ${metier}
- Ton préféré par défaut : ${tonPrefere}`

      const prompt = [
        `Type d'email: ${template}`,
        `Ton: ${toneLabel}`,
        client ? `Client: ${client.name}${client.email ? ` (${client.email})` : ''}` : '',
        `Contexte: ${assistantContext || '(vide)'}`,
        '',
        'Rédige l\'email final.',
      ]
        .filter(Boolean)
        .join('\n')

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, system }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur IA (${res.status})`)

      setAssistantOutput(String(json?.text || '').trim())
    } catch (e: any) {
      alert(e?.message || 'Erreur IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --black: #0a0a0a;
          --white: #ffffff;
          --gray-50: #fafafa;
          --gray-100: #f4f4f5;
          --gray-200: #e4e4e7;
          --gray-300: #d4d4d8;
          --gray-400: #a1a1aa;
          --gray-500: #71717a;
          --gray-600: #52525b;
          --gray-700: #3f3f46;
          --gray-800: #27272a;
          --gray-900: #18181b;
          --yellow: #facc15;
          --yellow-light: #fef9c3;
          --yellow-dark: #eab308;
          --green: #22c55e;
          --green-light: #dcfce7;
          --red: #ef4444;
          --red-light: #fee2e2;
          --blue: #3b82f6;
          --blue-light: #dbeafe;
          --sidebar-width: 260px;
        }

        html,
        body {
          height: 100%;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          display: flex;
        }

        /* ===== SIDEBAR ===== */
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--black);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          margin-bottom: 40px;
        }

        .sidebar-logo-icon {
          width: 40px;
          height: 40px;
          background: var(--yellow);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-logo-icon svg {
          width: 22px;
          height: 22px;
          fill: var(--black);
        }

        .sidebar-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--white);
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          color: var(--gray-400);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
        }

        .nav-item:hover {
          background: var(--gray-800);
          color: var(--white);
        }

        .nav-item.active {
          background: var(--yellow);
          color: var(--black);
        }

        .nav-item.active svg {
          stroke: var(--black);
        }

        .nav-item svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--gray-600);
          padding: 24px 16px 12px;
        }

        .sidebar-footer {
          padding-top: 24px;
          border-top: 1px solid var(--gray-800);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .user-profile:hover {
          background: var(--gray-800);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--yellow);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--black);
        }

        .user-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--white);
        }

        .user-info p {
          font-size: 12px;
          color: var(--gray-500);
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          flex: 1;
          margin-left: var(--sidebar-width);
          padding: 32px 40px;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 16px;
        }

        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--black);
        }

        .page-subtitle {
          font-size: 15px;
          color: var(--gray-500);
          margin-top: 4px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* ===== BUTTONS ===== */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background: var(--black);
          color: var(--white);
        }

        .btn-primary:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: var(--white);
          color: var(--gray-700);
          border: 2px solid var(--gray-200);
        }

        .btn-secondary:hover {
          border-color: var(--gray-300);
          background: var(--gray-50);
        }

        .btn-yellow {
          background: var(--yellow);
          color: var(--black);
        }

        .btn-yellow:hover {
          background: var(--yellow-dark);
        }

        .btn svg {
          width: 18px;
          height: 18px;
        }

        /* ===== STATS CARDS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: var(--gray-300);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.yellow {
          background: var(--yellow-light);
        }

        .stat-icon.green {
          background: var(--green-light);
        }

        .stat-icon.blue {
          background: var(--blue-light);
        }

        .stat-icon.red {
          background: var(--red-light);
        }

        .stat-icon svg {
          width: 24px;
          height: 24px;
          stroke-width: 2;
        }

        .stat-icon.yellow svg {
          stroke: var(--yellow-dark);
        }
        .stat-icon.green svg {
          stroke: var(--green);
        }
        .stat-icon.blue svg {
          stroke: var(--blue);
        }
        .stat-icon.red svg {
          stroke: var(--red);
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--gray-500);
        }

        /* ===== CARDS ===== */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .card {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
        }

        .card-action {
          font-size: 13px;
          color: var(--gray-500);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .card-action:hover {
          color: var(--black);
        }

        /* ===== QUICK ACTIONS ===== */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--gray-50);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .quick-action:hover {
          background: var(--white);
          border-color: var(--gray-200);
          transform: translateY(-2px);
        }

        .quick-action-icon {
          width: 44px;
          height: 44px;
          background: var(--black);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--white);
        }

        .quick-action-text h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 2px;
        }

        .quick-action-text p {
          font-size: 12px;
          color: var(--gray-500);
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--gray-400);
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--gray-400);
        }

        /* ===== TAB CONTENT ===== */
        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        /* ===== CLIENTS TAB ===== */
        .clients-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* ===== ASSISTANT IA TAB ===== */
        .assistant-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
        }

        .assistant-sidebar {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
        }

        .assistant-sidebar h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 16px;
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .template-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          background: transparent;
        }

        .template-item:hover {
          background: var(--gray-50);
        }

        .template-item.active {
          background: var(--yellow-light);
          border-color: var(--yellow);
        }

        .template-item-icon {
          font-size: 18px;
        }

        .template-item-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
          line-height: 1.2;
        }

        .template-item-subtext {
          font-size: 12px;
          color: var(--gray-500);
          margin-top: 2px;
        }

        .template-item.active .template-item-text {
          color: var(--black);
          font-weight: 600;
        }

        .assistant-main {
          background: var(--white);
          border-radius: 16px;
          padding: 32px;
          border: 1px solid var(--gray-200);
        }

        .assistant-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 14px 18px;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s ease;
          background: var(--white);
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.15);
        }

        .form-textarea {
          min-height: 150px;
          resize: vertical;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .tone-selector {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tone-option {
          flex: 1;
          padding: 12px;
          text-align: center;
          border: 2px solid var(--gray-200);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          background: var(--white);
          min-width: 100px;
        }

        .tone-option:hover {
          border-color: var(--gray-300);
        }

        .tone-option.active {
          border-color: var(--yellow);
          background: var(--yellow-light);
        }

        .output-box {
          background: var(--gray-50);
          border-radius: 12px;
          padding: 24px;
          min-height: 200px;
          border: 1px solid var(--gray-200);
        }

        .output-box.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-400);
          font-size: 15px;
        }

        .output-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        /* ===== DEVIS TAB ===== */
        .devis-container {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
        }

        .devis-form {
          background: var(--white);
          border-radius: 16px;
          padding: 32px;
          border: 1px solid var(--gray-200);
        }

        .devis-section {
          margin-bottom: 32px;
        }

        .devis-section:last-child {
          margin-bottom: 0;
        }

        .devis-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--gray-100);
        }

        .prestation-item {
          display: grid;
          grid-template-columns: 1fr 100px 100px 40px;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
        }

        .prestation-item input {
          padding: 12px 14px;
          border: 2px solid var(--gray-200);
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
        }

        .prestation-item input:focus {
          outline: none;
          border-color: var(--yellow);
        }

        .btn-remove {
          width: 40px;
          height: 40px;
          border: none;
          background: var(--red-light);
          color: var(--red);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .btn-remove:hover {
          background: var(--red);
          color: var(--white);
        }

        .btn-add-prestation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border: 2px dashed var(--gray-300);
          border-radius: 12px;
          background: transparent;
          color: var(--gray-500);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-prestation:hover {
          border-color: var(--yellow);
          color: var(--yellow-dark);
          background: var(--yellow-light);
        }

        .devis-preview {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
          position: sticky;
          top: 32px;
        }

        .preview-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 20px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--gray-100);
          font-size: 14px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-row.total {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
          padding-top: 16px;
          margin-top: 8px;
          border-top: 2px solid var(--gray-200);
          border-bottom: none;
        }

        .preview-label {
          color: var(--gray-500);
        }

        .preview-value {
          font-weight: 600;
          color: var(--gray-900);
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-overlay.active {
          display: flex;
        }

        .modal {
          background: var(--white);
          border-radius: 20px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--black);
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border: none;
          background: var(--gray-100);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--gray-500);
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: var(--gray-200);
          color: var(--black);
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .modal-actions .btn {
          flex: 1;
          min-width: 160px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .clients-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .assistant-container {
            grid-template-columns: 1fr;
          }

          .assistant-sidebar {
            display: none;
          }

          .devis-container {
            grid-template-columns: 1fr;
          }

          .devis-preview {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .main-content {
            margin-left: 0;
            padding: 24px 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .clients-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .prestation-item {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <span className="sidebar-logo-text">Spyke</span>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </button>

          <button className={`nav-item ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>
            <svg viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Clients
          </button>

          <button className={`nav-item ${tab === 'assistant' ? 'active' : ''}`} onClick={() => setTab('assistant')}>
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Assistant IA
          </button>

          <button className={`nav-item ${tab === 'devis' ? 'active' : ''}`} onClick={() => setTab('devis')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Devis
          </button>

          <span className="nav-section-title">Outils</span>

          <button className={`nav-item ${tab === 'analyseur' ? 'active' : ''}`} onClick={() => setTab('analyseur')}>
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Analyseur de projet
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="user-profile" onClick={() => setTab('settings')}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <h4>{userFullName}</h4>
              <p>{userPlan}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard */}
        <div id="tab-dashboard" className={`tab-content ${tab === 'dashboard' ? 'active' : ''}`}> 
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Bienvenue, {userFullName.split(' ')[0] || userFullName} 👋</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exporter
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setModal('newDevis')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nouveau devis
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon yellow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0 €</div>
              <div className="stat-label">CA ce mois</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0%</div>
              <div className="stat-label">Taux de conversion</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0</div>
              <div className="stat-label">Clients actifs</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0</div>
              <div className="stat-label">Devis en attente</div>
            </div>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔔 Relances suggérées</h3>
              </div>
              <div className="empty-state" style={{ padding: 24 }}>
                <p>Aucune relance nécessaire 👍</p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">⚡ Actions rapides</h3>
              </div>
              <div className="quick-actions">
                <div className="quick-action" onClick={() => setTab('assistant')}>
                  <div className="quick-action-icon">✉️</div>
                  <div className="quick-action-text">
                    <h4>Nouvel email</h4>
                    <p>Générer avec l&apos;IA</p>
                  </div>
                </div>
                <div className="quick-action" onClick={() => setTab('devis')}>
                  <div className="quick-action-icon">📄</div>
                  <div className="quick-action-text">
                    <h4>Nouveau devis</h4>
                    <p>Créer en 2 min</p>
                  </div>
                </div>
                <div className="quick-action" onClick={() => setModal('newClient')}>
                  <div className="quick-action-icon">👤</div>
                  <div className="quick-action-text">
                    <h4>Ajouter client</h4>
                    <p>Nouveau contact</p>
                  </div>
                </div>
                <div className="quick-action" onClick={() => alert('Factures: bientôt')}>
                  <div className="quick-action-icon">💰</div>
                  <div className="quick-action-text">
                    <h4>Nouvelle facture</h4>
                    <p>Facturer un client</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📄 Devis récents</h3>
              <a
                href="#"
                className="card-action"
                onClick={(e) => {
                  e.preventDefault()
                  setTab('devis')
                }}
              >
                Tout voir
              </a>
            </div>
            <div className="empty-state" style={{ padding: 24 }}>
              <p>Aucun devis pour le moment</p>
            </div>
          </div>
        </div>

        {/* Clients */}
        <div id="tab-clients" className={`tab-content ${tab === 'clients' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Clients</h1>
              <p className="page-subtitle">Gérez votre portefeuille clients</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" type="button" onClick={() => setModal('newClient')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter un client
              </button>
            </div>
          </div>

          <div className="clients-grid">
            {clients.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <h4>Aucun client</h4>
                  <p>Ajoutez votre premier client pour commencer</p>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('newClient')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Ajouter un client
                  </button>
                </div>
              </div>
            ) : (
              clients.map((c) => (
                <div key={c.id} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div className="card-title">{c.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6 }}>
                        {c.email || '—'}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClientId(c.id)
                        setTab('assistant')
                      }}
                    >
                      ✉️ Email
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistant */}
        <div id="tab-assistant" className={`tab-content ${tab === 'assistant' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Assistant IA</h1>
              <p className="page-subtitle">Générez des emails professionnels en quelques secondes</p>
            </div>
          </div>

          <div className="assistant-container">
            <div className="assistant-sidebar">
              <h3>Type d&apos;email</h3>
              <div className="template-list">
                {([
                  ['✉️', 'Réponse client', "Répondre à un email"],
                  ['🔔', 'Relance', 'Sans réponse'],
                  ['📄', 'Envoi de devis', 'Devis à envoyer'],
                  ['💰', 'Envoi facture', 'Paiement / facture'],
                  ['🤝', 'Négociation', 'Tarifs, délais'],
                  ['👋', 'Bienvenue', 'Premier contact'],
                  ['🙏', 'Remerciement', 'Après prestation'],
                ] as Array<[string, Template, string]>).map(([icon, label, sub]) => (
                  <div
                    key={label}
                    className={`template-item ${template === label ? 'active' : ''}`}
                    onClick={() => setTemplate(label)}
                  >
                    <span className="template-item-icon">{icon}</span>
                    <div>
                      <div className="template-item-text">{label}</div>
                      <div className="template-item-subtext">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="assistant-main">
              <form className="assistant-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select
                      className="form-select"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ton</label>
                    <div className="tone-selector">
                      <div className={`tone-option ${tone === 'pro' ? 'active' : ''}`} onClick={() => setTone('pro')}>
                        Pro
                      </div>
                      <div
                        className={`tone-option ${tone === 'chaleureux' ? 'active' : ''}`}
                        onClick={() => setTone('chaleureux')}
                      >
                        Chaleureux
                      </div>
                      <div className={`tone-option ${tone === 'formel' ? 'active' : ''}`} onClick={() => setTone('formel')}>
                        Formel
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contexte</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Décrivez la situation, ce que vous souhaitez communiquer..."
                    value={assistantContext}
                    onChange={(e) => setAssistantContext(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="template-list">
                    {([
                      ['✉️', 'Réponse client', "Répondre à un email"],
                      ['🔔', 'Relance', 'Sans réponse'],
                      ['📄', 'Envoi de devis', 'Devis à envoyer'],
                      ['💰', 'Envoi facture', 'Paiement / facture'],
                      ['🤝', 'Négociation', 'Tarifs, délais'],
                      ['👋', 'Bienvenue', 'Premier contact'],
                      ['🙏', 'Remerciement', 'Après prestation'],
                    ] as Array<[string, Template, string]>).map(([icon, label, sub]) => (
                      <div
                        key={label}
                        className={`template-item ${template === label ? 'active' : ''}`}
                        onClick={() => setTemplate(label)}
                      >
                        <span className="template-item-icon">{icon}</span>
                        <div>
                          <div className="template-item-text">{label}</div>
                          <div className="template-item-subtext">{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-yellow"
                  style={{ width: '100%' }}
                  onClick={generateAssistantEmail}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Générer avec l&apos;IA
                </button>

                <div className="form-group">
                  <label className="form-label">Résultat</label>
                  <div className={`output-box ${assistantOutput ? '' : 'empty'}`}>{assistantOutput || "L'email généré apparaîtra ici..."}</div>
                  <div className="output-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        if (!assistantOutput) return
                        await navigator.clipboard.writeText(assistantOutput)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copier
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={generateAssistantEmail}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                      </svg>
                      Régénérer
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Devis */}
        <div id="tab-devis" className={`tab-content ${tab === 'devis' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Nouveau devis</h1>
              <p className="page-subtitle">Créez un devis professionnel en quelques minutes</p>
            </div>
          </div>

          <div className="devis-container">
            <div className="devis-form">
              <div className="devis-section">
                <h3 className="devis-section-title">👤 Client</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nom / Entreprise</label>
                    <input type="text" className="form-input" placeholder="Nom du client" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" placeholder="email@exemple.com" />
                  </div>
                </div>
              </div>

              <div className="devis-section">
                <h3 className="devis-section-title">📋 Prestations</h3>
                <div className="prestation-item">
                  <input type="text" placeholder="Description de la prestation" />
                  <input type="number" placeholder="Qté" />
                  <input type="number" placeholder="Prix HT" />
                  <button className="btn-remove" type="button">
                    ✕
                  </button>
                </div>
                <div className="prestation-item">
                  <input type="text" placeholder="Description de la prestation" />
                  <input type="number" placeholder="Qté" />
                  <input type="number" placeholder="Prix HT" />
                  <button className="btn-remove" type="button">
                    ✕
                  </button>
                </div>
                <button className="btn-add-prestation" type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Ajouter une prestation
                </button>
              </div>

              <div className="devis-section">
                <h3 className="devis-section-title">⚙️ Options</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">TVA (%)</label>
                    <select className="form-select" defaultValue="0">
                      <option value="0">0% (Auto-entrepreneur)</option>
                      <option value="20">20%</option>
                      <option value="10">10%</option>
                      <option value="5.5">5.5%</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Acompte (%)</label>
                    <select className="form-select" defaultValue="0">
                      <option value="0">Pas d&apos;acompte</option>
                      <option value="30">30%</option>
                      <option value="50">50%</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes / Conditions</label>
                  <textarea className="form-textarea" rows={3} placeholder="Conditions de paiement, délais..." />
                </div>
              </div>
            </div>

            <div className="devis-preview">
              <h3 className="preview-title">Récapitulatif</h3>
              <div className="preview-row">
                <span className="preview-label">Sous-total HT</span>
                <span className="preview-value">0,00 €</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">TVA (0%)</span>
                <span className="preview-value">0,00 €</span>
              </div>
              <div className="preview-row total">
                <span className="preview-label">Total TTC</span>
                <span className="preview-value">0,00 €</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Acompte</span>
                <span className="preview-value">0,00 €</span>
              </div>

              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-yellow" type="button" style={{ width: '100%' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  Générer PDF
                </button>
                <button className="btn btn-secondary" type="button" style={{ width: '100%' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Envoyer par email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analyseur */}
        <div id="tab-analyseur" className={`tab-content ${tab === 'analyseur' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Analyseur de projet</h1>
              <p className="page-subtitle">Analysez un brief client pour évaluer sa faisabilité</p>
            </div>
          </div>

          <div className="devis-container">
            <div className="devis-form">
              <div className="form-group">
                <label className="form-label">Brief du client</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 250 }}
                  placeholder="Collez ici le brief ou la demande de votre client..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Budget annoncé (optionnel)</label>
                  <input type="text" className="form-input" placeholder="Ex: 3000€" />
                </div>
                <div className="form-group">
                  <label className="form-label">Délai demandé (optionnel)</label>
                  <input type="text" className="form-input" placeholder="Ex: 2 semaines" />
                </div>
              </div>

              <button type="button" className="btn btn-yellow" style={{ width: '100%' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Analyser le projet
              </button>
            </div>

            <div className="devis-preview">
              <h3 className="preview-title">Résultat de l&apos;analyse</h3>
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">🔍</div>
                <p>L&apos;analyse apparaîtra ici</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div id="tab-settings" className={`tab-content ${tab === 'settings' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Paramètres</h1>
              <p className="page-subtitle">Configurez votre compte</p>
            </div>
          </div>
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">⚙️</div>
              <h4>Paramètres</h4>
              <p>Section en cours de développement</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: New Client */}
      <div
        className={`modal-overlay ${modal === 'newClient' ? 'active' : ''}`}
        id="modal-newClient"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null)
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <h3 className="modal-title">Nouveau client</h3>
            <button className="modal-close" type="button" onClick={() => setModal(null)}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nom / Entreprise</label>
              <input name="client_name" type="text" className="form-input" placeholder="Ex: Digital Agency" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="client_email" type="email" className="form-input" placeholder="contact@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input name="client_phone" type="tel" className="form-input" placeholder="06 12 34 56 78" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="client_notes"
                className="form-textarea"
                rows={3}
                placeholder="Informations complémentaires..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={async () => {
                  if (!supabase || !userId) {
                    alert('Session manquante')
                    return
                  }

                  const modalEl = document.getElementById('modal-newClient')
                  const name = String(
                    (modalEl?.querySelector('[name="client_name"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const email = String(
                    (modalEl?.querySelector('[name="client_email"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const phone = String(
                    (modalEl?.querySelector('[name="client_phone"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const notes = String(
                    (modalEl?.querySelector('[name="client_notes"]') as HTMLTextAreaElement | null)?.value || ''
                  ).trim()

                  if (!name) {
                    alert('Nom requis')
                    return
                  }

                  try {
                    setLoading(true)
                    const { error } = await supabase.from('clients').insert({
                      user_id: userId,
                      name,
                      email: email || null,
                      phone: phone || null,
                      notes: notes || null,
                    })
                    if (error) throw error
                    setModal(null)
                    await refreshClients()
                  } catch (e: any) {
                    alert(e?.message || 'Erreur ajout client')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? 'Ajout…' : 'Ajouter le client'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
