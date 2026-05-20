export const SEO_TOOL_CSS = `
  * { box-sizing: border-box; }

  .seo-tool {
    --black: #0a0a0a;
    --white: #ffffff;
    --bg: #f4f4f8;
    --border: #e4e4ec;
    --text: #0f172a;
    --muted: #6b7280;
    --accent: #facc15;
    --accent-mid: #e6b800;
    --accent-light: rgba(250,204,21,0.15);
    --green: #10b981;
    --red: #ef4444;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.08);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    padding-bottom: 80px;
  }

  /* ── NAVBAR ──────────────────────────────────────── */
  .seo-navbar {
    background: var(--black);
    padding: 0 40px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    gap: 16px;
  }
  .seo-nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
  .seo-nav-logo-icon {
    width: 28px; height: 28px;
    background: rgba(250,204,21,0.18);
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
  }
  .seo-nav-logo-icon svg { width: 15px; height: 15px; fill: #facc15; }
  .seo-nav-logo-text { font-weight: 800; font-size: 18px; color: #fff; letter-spacing: -0.4px; }
  .seo-nav-tools { display: flex; gap: 2px; }
  .seo-nav-tool {
    padding: 6px 13px; border-radius: 7px;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.45); text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }
  .seo-nav-tool:hover { color: #fff; background: rgba(255,255,255,0.08); }
  .seo-nav-tool.active { color: #facc15; background: rgba(250,204,21,0.12); }
  .seo-nav-cta {
    padding: 8px 16px;
    background: var(--accent); color: #0a0a0a;
    border-radius: 8px;
    font-size: 13px; font-weight: 700; text-decoration: none;
    white-space: nowrap; flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .seo-nav-cta:hover { opacity: 0.88; }

  /* ── HERO ────────────────────────────────────────── */
  .seo-hero {
    background: var(--black);
    padding: 64px 40px 56px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .seo-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 60% at 50% -10%, rgba(250,204,21,0.12), transparent 70%);
    pointer-events: none;
  }
  .seo-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(250,204,21,0.10);
    border: 1px solid rgba(250,204,21,0.30);
    color: #facc15;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
    padding: 5px 14px; border-radius: 999px;
    margin-bottom: 22px; position: relative; z-index: 1;
  }
  .seo-hero-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #facc15; }
  .seo-hero h1 {
    font-size: 56px; font-weight: 900; color: #fff;
    letter-spacing: -2.5px; line-height: 1.05;
    max-width: 760px; margin: 0 auto 18px;
    position: relative; z-index: 1;
  }
  .seo-hero h1 span { color: #facc15; }
  .seo-hero-sub {
    font-size: 17px; color: rgba(255,255,255,0.5);
    max-width: 540px; margin: 0 auto; line-height: 1.7;
    position: relative; z-index: 1;
  }
  .seo-hero-sub b { color: rgba(255,255,255,0.75); font-weight: 600; }
  .seo-hero-trust {
    display: flex; align-items: center; justify-content: center;
    gap: 24px; margin-top: 30px; flex-wrap: wrap;
    position: relative; z-index: 1;
  }
  .seo-hero-trust-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: rgba(255,255,255,0.38); font-weight: 500;
  }
  .seo-hero-trust-item svg {
    width: 14px; height: 14px;
    stroke: var(--green); fill: none; stroke-width: 2.5;
  }

  /* ── AI BANNER ───────────────────────────────────── */
  .seo-ai-banner {
    max-width: 1200px; margin: -16px auto 0;
    padding: 14px 20px;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex; align-items: center; gap: 14px;
    position: relative; z-index: 10;
    width: calc(100% - 80px);
    box-shadow: var(--shadow-sm);
  }
  .seo-ai-icon {
    width: 36px; height: 36px;
    background: #f3f4f6; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
  }
  .seo-ai-icon svg { width: 17px; height: 17px; fill: var(--muted); }
  .seo-ai-lock {
    position: absolute; bottom: -3px; right: -3px;
    width: 13px; height: 13px;
    background: var(--muted); border-radius: 3px;
    display: flex; align-items: center; justify-content: center;
  }
  .seo-ai-lock svg { width: 7px; height: 7px; fill: #fff; }
  .seo-ai-title { font-size: 13px; font-weight: 700; color: var(--text); }
  .seo-ai-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .seo-ai-btn {
    padding: 7px 14px;
    background: var(--accent); color: #0a0a0a;
    border: none; border-radius: 7px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .seo-ai-btn:hover { opacity: 0.88; }

  /* ── WORKSPACE ───────────────────────────────────── */
  .seo-workspace {
    max-width: 1200px;
    margin: 28px auto 0;
    padding: 0 40px;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }
  .seo-form-col { display: flex; flex-direction: column; gap: 14px; }

  /* ── SECTIONS (numbered steps) ───────────────────── */
  .seo-section {
    background: var(--white);
    border-radius: 14px;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.04);
  }
  .seo-section-header {
    padding: 16px 22px;
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid #f3f4f6;
  }
  .seo-section-num {
    width: 24px; height: 24px;
    background: var(--accent); color: #fff;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; flex-shrink: 0;
  }
  .seo-section-title { font-size: 14px; font-weight: 700; color: var(--text); }
  .seo-section-subtitle { font-size: 12px; color: var(--muted); margin-left: auto; }
  .seo-section-body { padding: 20px 22px; }

  /* ── FORM FIELDS ─────────────────────────────────── */
  .seo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .seo-group { display: flex; flex-direction: column; gap: 5px; }
  .seo-group.full { grid-column: 1 / -1; }
  .seo-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .seo-input, .seo-select, .seo-textarea {
    padding: 10px 13px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: 14px; color: var(--text);
    outline: none; background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%; font-family: inherit;
  }
  .seo-input:focus, .seo-select:focus, .seo-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  .seo-input::placeholder, .seo-textarea::placeholder { color: #d1d5db; }
  .seo-textarea { resize: vertical; min-height: 80px; }

  /* ── TABLE ───────────────────────────────────────── */
  .seo-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .seo-table { width: 100%; border-collapse: collapse; min-width: 460px; }
  .seo-table th {
    text-align: left;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;
    color: var(--muted); padding: 0 8px 10px;
    border-bottom: 1.5px solid var(--border);
  }
  .seo-table td { padding: 7px 6px; vertical-align: top; }
  .seo-table td:first-child { padding-left: 0; }
  .seo-table td:last-child { padding-right: 0; width: 36px; }
  .seo-btn-add {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    background: none; border: 1.5px dashed var(--border);
    border-radius: 8px;
    font-size: 13px; font-weight: 600; color: var(--muted);
    cursor: pointer; margin-top: 10px;
    transition: border-color 0.15s, color 0.15s;
  }
  .seo-btn-add:hover { border-color: var(--accent); color: var(--accent); }
  .seo-btn-remove {
    width: 28px; height: 28px; border: none;
    background: rgba(239,68,68,0.07); color: var(--red);
    border-radius: 6px; cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .seo-btn-remove:hover { background: rgba(239,68,68,0.15); }

  /* ── TABLE TOTALS ────────────────────────────────── */
  .seo-totals { display: flex; justify-content: flex-end; margin-top: 18px; border-top: 1.5px solid var(--border); padding-top: 16px; }
  .seo-totals-box { min-width: 240px; }
  .seo-total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: var(--muted); }
  .seo-total-row.final { margin-top: 6px; padding-top: 10px; border-top: 1.5px solid var(--border); }
  .seo-total-row.final .l { font-weight: 800; font-size: 14px; color: var(--text); }
  .seo-total-row.final .v { font-weight: 900; font-size: 20px; color: var(--text); }

  /* ── SUMMARY PANEL (sticky right) ───────────────── */
  .seo-summary-col { position: sticky; top: 74px; display: flex; flex-direction: column; gap: 14px; }
  .seo-summary {
    background: var(--white);
    border-radius: 16px;
    box-shadow: var(--shadow-md);
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.04);
  }
  .seo-summary-top { padding: 20px 22px; border-bottom: 1px solid #f3f4f6; }
  .seo-summary-label {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;
    color: var(--muted); margin-bottom: 16px;
  }
  .seo-summary-row {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px; color: var(--muted); padding: 4px 0;
  }
  .seo-summary-row.total {
    margin-top: 10px; padding-top: 14px;
    border-top: 1.5px solid var(--border);
  }
  .seo-summary-row.total .sl { font-size: 14px; font-weight: 700; color: var(--text); }
  .seo-summary-row.total .sv { font-size: 28px; font-weight: 900; color: var(--text); letter-spacing: -1px; }
  .seo-summary-actions { padding: 18px 22px; display: flex; flex-direction: column; gap: 10px; }
  .seo-btn-generate {
    width: 100%; padding: 15px;
    background: var(--accent); color: #0a0a0a;
    border: none; border-radius: 12px;
    font-size: 15px; font-weight: 800; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.15s;
    letter-spacing: -0.2px;
    box-shadow: 0 4px 14px rgba(250,204,21,0.4);
  }
  .seo-btn-generate:hover { background: var(--accent-mid); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(250,204,21,0.5); }
  .seo-btn-generate:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(250,204,21,0.3); }
  .seo-summary-note {
    text-align: center; font-size: 11px; color: var(--muted);
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .seo-summary-note-dot { width: 3px; height: 3px; border-radius: 50%; background: #d1d5db; }
  .seo-summary-nudge {
    margin: 0 22px 20px;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(250,204,21,0.05), rgba(250,204,21,0.10));
    border: 1px solid rgba(250,204,21,0.20);
    border-radius: 12px;
  }
  .seo-summary-nudge-title { font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .seo-summary-nudge-text { font-size: 11px; color: var(--muted); margin-bottom: 10px; line-height: 1.55; }
  .seo-summary-nudge-btn {
    width: 100%; padding: 9px;
    background: var(--accent); color: #0a0a0a;
    border: none; border-radius: 8px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    transition: opacity 0.15s;
  }
  .seo-summary-nudge-btn:hover { opacity: 0.88; }

  /* Mini tools widget */
  .seo-mini-tools {
    background: var(--white);
    border-radius: 14px;
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .seo-mini-tools-title {
    padding: 12px 16px;
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);
    border-bottom: 1px solid #f3f4f6;
  }
  .seo-mini-tool {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    text-decoration: none; color: var(--text);
    border-bottom: 1px solid #f9fafb;
    transition: background 0.12s;
    font-size: 13px; font-weight: 500;
  }
  .seo-mini-tool:last-child { border-bottom: none; }
  .seo-mini-tool:hover { background: #f9fafb; }
  .seo-mini-tool.active { font-weight: 700; }
  .seo-mini-tool-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ── MOBILE STICKY BAR ───────────────────────────── */
  .seo-mobile-bar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: #fff;
    border-top: 1px solid var(--border);
    padding: 12px 20px;
    align-items: center; justify-content: space-between; gap: 16px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  }
  .seo-mobile-bar-info { display: flex; flex-direction: column; }
  .seo-mobile-bar-label { font-size: 11px; color: var(--muted); font-weight: 600; }
  .seo-mobile-bar-amount { font-size: 20px; font-weight: 900; color: var(--text); letter-spacing: -0.5px; }
  .seo-mobile-bar-btn {
    padding: 12px 24px;
    background: var(--accent); color: #0a0a0a;
    border: none; border-radius: 10px;
    font-size: 14px; font-weight: 800; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(250,204,21,0.4);
  }

  /* ── MODAL ───────────────────────────────────────── */
  .seo-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); z-index: 200; align-items: center; justify-content: center; padding: 20px; }
  .seo-modal-overlay.active { display: flex; }
  .seo-modal {
    background: #fff; border-radius: 20px;
    padding: 32px; max-width: 420px; width: 100%;
    text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  .seo-modal h3 { font-size: 21px; font-weight: 900; margin: 0 0 8px; letter-spacing: -0.5px; }
  .seo-modal p { font-size: 14px; color: var(--muted); margin: 0 0 20px; line-height: 1.6; }
  .seo-modal-skip { font-size: 13px; color: var(--muted); cursor: pointer; background: none; border: none; margin-top: 6px; }

  /* ── MODAL BUTTONS (PDF preview) ────────────────── */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }
  .btn-primary { background: var(--accent); color: #0a0a0a; }
  .btn-primary:hover { opacity: 0.88; }
  .btn-secondary { background: #f3f4f6; color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: #e9eaec; }

  /* Kept for backward compat */
  .seo-soft-nudge { display: none; }
  .seo-note { display: none; }
  .seo-generate { display: none; }
  .seo-card { background: var(--white); border-radius: 14px; box-shadow: var(--shadow-sm); padding: 22px; margin-bottom: 14px; border: 1px solid rgba(0,0,0,0.04); }
  .seo-card-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6; }
  .seo-form-wrap { max-width: 1200px; margin: 28px auto 0; padding: 0 40px; }

  /* ── RESPONSIVE ──────────────────────────────────── */
  @media (max-width: 960px) {
    .seo-workspace { grid-template-columns: 1fr; padding: 0 20px; }
    .seo-summary-col { display: none; }
    .seo-mobile-bar { display: flex; }
    .seo-tool { padding-bottom: 90px; }
  }
  @media (max-width: 768px) {
    .seo-navbar { padding: 0 16px; height: 54px; }
    .seo-nav-tools { display: none; }
    .seo-hero { padding: 48px 20px 40px; }
    .seo-hero h1 { font-size: 36px; letter-spacing: -1.5px; }
    .seo-hero-sub { font-size: 15px; }
    .seo-hero-trust { gap: 14px; }
    .seo-ai-banner { margin: -12px 16px 0; width: auto; flex-direction: column; gap: 10px; text-align: center; }
    .seo-grid { grid-template-columns: 1fr; }
    .seo-section-body { padding: 16px; }
    .seo-form-wrap { padding: 0 16px; }
  }
`
