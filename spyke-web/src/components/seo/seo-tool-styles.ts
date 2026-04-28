export const SEO_TOOL_CSS = `
  * { box-sizing: border-box; }
  .seo-tool {
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
    --yellow-dark: #eab308;
    --yellow-glow: rgba(250, 204, 21, 0.15);
    --green: #22c55e;
    --green-light: rgba(34, 197, 94, 0.1);
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
    background: var(--gray-50);
    color: var(--gray-900);
    min-height: 100vh;
  }
  .seo-navbar {
    background: var(--black);
    padding: 16px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .seo-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
  .seo-nav-logo-icon { width: 32px; height: 32px; background: var(--gray-800); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
  .seo-nav-logo-icon svg { width: 18px; height: 18px; fill: var(--yellow); }
  .seo-nav-logo-text { font-weight: 800; font-size: 20px; color: var(--white); letter-spacing: -0.5px; }
  .seo-nav-tools { display: flex; gap: 6px; }
  .seo-nav-tool { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--gray-400); text-decoration: none; }
  .seo-nav-tool:hover { color: var(--white); background: var(--gray-800); }
  .seo-nav-tool.active { color: var(--yellow); background: var(--gray-800); }
  .seo-nav-cta { padding: 9px 20px; background: var(--yellow); color: var(--black); border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; }

  .seo-hero { background: var(--black); padding: 56px 40px 46px; text-align: center; position: relative; overflow: hidden; }
  .seo-hero::before { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; background: var(--yellow); opacity: 0.06; top: -200px; left: 50%; transform: translateX(-50%); filter: blur(100px); }
  .seo-hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.2); color: var(--yellow); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; padding: 6px 16px; border-radius: 999px; margin-bottom: 18px; position: relative; z-index: 1; }
  .seo-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--yellow); }
  .seo-hero h1 { font-size: 40px; font-weight: 900; color: var(--white); letter-spacing: -1.4px; line-height: 1.15; max-width: 760px; margin: 0 auto 14px; position: relative; z-index: 1; }
  .seo-hero h1 span { color: var(--yellow); }
  .seo-hero-sub { font-size: 16px; color: var(--gray-400); max-width: 620px; margin: 0 auto; line-height: 1.7; position: relative; z-index: 1; }
  .seo-hero-trust { display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 24px; position: relative; z-index: 1; flex-wrap: wrap; }
  .seo-hero-trust-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-500); }
  .seo-hero-trust-item svg { width: 16px; height: 16px; stroke: var(--green); fill: none; stroke-width: 2.5; }

  .seo-ai-banner { max-width: 900px; margin: -18px auto 0; padding: 18px 28px; background: var(--gray-100); border: 1.5px dashed var(--gray-300); border-radius: 14px; display: flex; align-items: center; gap: 16px; position: relative; z-index: 2; }
  .seo-ai-icon { width: 42px; height: 42px; background: var(--gray-200); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
  .seo-ai-icon svg { width: 20px; height: 20px; fill: var(--gray-400); }
  .seo-ai-lock { position: absolute; bottom: -3px; right: -3px; width: 16px; height: 16px; background: var(--gray-500); border-radius: 4px; display: flex; align-items: center; justify-content: center; }
  .seo-ai-lock svg { width: 9px; height: 9px; fill: var(--white); }
  .seo-ai-title { font-size: 14px; font-weight: 900; color: var(--gray-500); }
  .seo-ai-sub { font-size: 12px; color: var(--gray-400); }
  .seo-ai-btn { padding: 8px 18px; background: var(--black); color: var(--white); border: none; border-radius: 8px; font-size: 12px; font-weight: 900; cursor: pointer; white-space: nowrap; }

  .seo-soft-nudge { max-width: 900px; margin: 12px auto 0; padding: 0 40px; }
  .seo-soft-nudge-card { background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.25); border-radius: 14px; padding: 14px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  .seo-soft-nudge-text { color: #111827; font-size: 13px; font-weight: 700; }
  .seo-soft-nudge-sub { color: #374151; font-size: 12px; margin-top: 2px; }
  .seo-soft-nudge-btn { padding: 10px 14px; background: var(--black); color: var(--white); border: none; border-radius: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; }

  .seo-form-wrap { max-width: 900px; margin: 32px auto 0; padding: 0 40px; }
  .seo-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 28px 32px; margin-bottom: 18px; }
  .seo-card-title { font-size: 15px; font-weight: 900; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--gray-100); }
  .seo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .seo-group { display: flex; flex-direction: column; gap: 6px; }
  .seo-group.full { grid-column: 1 / -1; }
  .seo-label { font-size: 12px; font-weight: 700; color: var(--gray-600); }
  .seo-input, .seo-select, .seo-textarea { padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: 10px; font-size: 14px; color: var(--gray-900); outline: none; background: var(--gray-50); }
  .seo-input:focus, .seo-select:focus, .seo-textarea:focus { border-color: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-glow); background: var(--white); }
  .seo-textarea { resize: vertical; min-height: 70px; }

  .seo-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .seo-table th { text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: var(--gray-400); padding: 8px 10px; border-bottom: 1px solid var(--gray-200); }
  .seo-table td { padding: 6px 10px; }
  .seo-table input, .seo-table select { width: 100%; }
  .seo-btn-add { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: none; border: 1.5px dashed var(--gray-300); border-radius: 8px; font-size: 13px; font-weight: 900; color: var(--gray-500); cursor: pointer; margin-top: 12px; }
  .seo-btn-remove { width: 28px; height: 28px; border: none; background: rgba(239, 68, 68, 0.08); color: #ef4444; border-radius: 6px; cursor: pointer; font-size: 16px; }

  .seo-totals { display: flex; justify-content: flex-end; margin-top: 18px; }
  .seo-totals-box { min-width: 280px; }
  .seo-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: var(--gray-600); }
  .seo-total-row.final { border-top: 2px solid var(--gray-200); margin-top: 8px; padding-top: 12px; }
  .seo-total-row.final .l { font-weight: 900; font-size: 16px; color: var(--black); }
  .seo-total-row.final .v { font-weight: 900; font-size: 22px; color: var(--black); }

  .seo-generate { text-align: center; margin-top: 8px; }
  .seo-btn-generate { padding: 16px 48px; background: var(--black); color: var(--white); border: none; border-radius: 14px; font-size: 16px; font-weight: 900; cursor: pointer; }
  .seo-note { font-size: 12px; color: var(--gray-400); margin-top: 10px; }

  .seo-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; align-items: center; justify-content: center; }
  .seo-modal-overlay.active { display: flex; }
  .seo-modal { background: var(--white); border-radius: 20px; padding: 32px 34px; max-width: 440px; width: 90%; text-align: center; }
  .seo-modal h3 { font-size: 20px; font-weight: 900; margin: 0 0 6px; }
  .seo-modal p { font-size: 14px; color: var(--gray-500); margin: 0 0 18px; }
  .seo-modal-form { display: flex; gap: 10px; margin-bottom: 12px; }
  .seo-modal-form input { flex: 1; }
  .seo-modal-form button { padding: 12px 18px; background: var(--black); color: var(--white); border: none; border-radius: 10px; font-weight: 900; cursor: pointer; }
  .seo-modal-skip { font-size: 13px; color: var(--gray-400); cursor: pointer; background: none; border: none; }

  @media (max-width: 768px) {
    .seo-navbar { padding: 12px 20px; }
    .seo-nav-tools { display: none; }
    .seo-hero { padding: 40px 20px 34px; }
    .seo-hero h1 { font-size: 28px; }
    .seo-form-wrap { padding: 0 20px; }
    .seo-grid { grid-template-columns: 1fr; }
    .seo-ai-banner { margin: -14px 20px 0; flex-direction: column; text-align: center; }
    .seo-soft-nudge { padding: 0 20px; }
  }
`
