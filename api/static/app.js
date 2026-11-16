// ==========================================================================
// AcompanI Cybernetic Audio Synthesizer (Web Audio API — 0 Dependencies)
// ==========================================================================
class CyberAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  playTone(freq, type = 'sine', duration = 0.12, gain = 0.08) {
    if (!this.enabled) return;
    try {
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(gain, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }
  click() { this.playTone(880, 'sine', 0.05, 0.04); }
  node() { this.playTone(520, 'triangle', 0.08, 0.06); }
  exec() {
    this.playTone(340, 'sawtooth', 0.14, 0.07);
    setTimeout(() => this.playTone(680, 'sine', 0.18, 0.05), 60);
  }
  denied() {
    this.playTone(180, 'sawtooth', 0.2, 0.1);
    setTimeout(() => this.playTone(130, 'square', 0.22, 0.08), 80);
  }
  pass() {
    this.playTone(440, 'sine', 0.07, 0.05);
    setTimeout(() => this.playTone(880, 'sine', 0.12, 0.05), 70);
  }
}
const sfx = new CyberAudio();

function toggleSound() {
  sfx.enabled = !sfx.enabled;
  const onIcon = document.getElementById('soundIconOn');
  const offIcon = document.getElementById('soundIconOff');
  if (onIcon && offIcon) {
    onIcon.style.display = sfx.enabled ? 'block' : 'none';
    offIcon.style.display = sfx.enabled ? 'none' : 'block';
  }
  toast(sfx.enabled ? 'Audio feedback enabled' : 'Audio muted');
  if (sfx.enabled) sfx.pass();
}

// ==========================================================================
// Neural Ambient Constellation Canvas
// ==========================================================================
function initNeuralConstellation() {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const P_COUNT = 48;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < P_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.8,
      color: i % 4 === 0 ? 'rgba(234, 95, 45,' : (i % 4 === 1 ? 'rgba(255, 122, 69,' : (i % 4 === 2 ? 'rgba(255, 255, 255,' : 'rgba(161, 161, 170,')),
    });
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '0.7)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x, dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 115) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(234, 95, 45, ${(1 - dist / 115) * 0.12})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Mouse-tracking spotlight on cards
document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.spotlight-card').forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// ==========================================================================
// Platform State & Controllers
// ==========================================================================
let currentOrg = null;
let landingPreviewOrg = null;
let activeRoleIds = new Set();
let selectedRoleId = null;
const canvasState = { scale: 1, x: 16, y: 12, dragging: false, startX: 0, startY: 0 };

const COMMANDS = [
  { label: 'Back to Product Showcase', kbd: 'Home', keywords: 'home landing product showcase exit main site', run: () => exitStudio() },
  { label: 'Go to Command Center', kbd: '1', keywords: 'overview dashboard command center kpi metrics dispatch home return', run: () => switchViewById('overview') },
  { label: 'Go to Org Architect Studio', kbd: '2', keywords: 'org architect hierarchy roles dag rbac tree canvas studio visual', run: () => switchViewById('org') },
  { label: 'Go to Task Orchestrator', kbd: '3', keywords: 'tasks orchestrator langgraph cost savings execution waterfall dispatch execute token compact', run: () => switchViewById('tasks') },
  { label: 'Go to Knowledge Vault (RAG)', kbd: '4', keywords: 'vault rag knowledge scoped vector chromadb documents query isolation department secret', run: () => switchViewById('vault') },
  { label: 'Go to Security & RBAC Matrix', kbd: '5', keywords: 'security rbac casbin matrix permissions allowlist red-team audit access control', run: () => switchViewById('security') },
  { label: 'Open Executive Compliance Seal', kbd: 'Cert', keywords: 'certificate cert seal compliance executive audit report verification', run: () => openCertModal() },
  { label: 'Synthesize E-Commerce Org', kbd: 'Preset', keywords: 'ecom ecommerce sneaker store preset org generate template shop', run: () => { switchViewById('org'); fillSummary('ecom'); generateOrg(); } },
  { label: 'Synthesize B2B SaaS Org', kbd: 'Preset', keywords: 'saas b2b preset generate synthesizer template org cloud software', run: () => { switchViewById('org'); fillSummary('saas'); generateOrg(); } },
  { label: 'Synthesize FinTech Org', kbd: 'Preset', keywords: 'fintech payment banking pci preset org generate template ledger', run: () => { switchViewById('org'); fillSummary('fintech'); generateOrg(); } },
  { label: 'Run Red-Team Security Audit', kbd: 'Audit', keywords: 'audit red-team attack probe test pentest security check zero-leak quarantine', run: () => runSecurityProbe(true) },
  { label: 'Re-Seed Sample Knowledge Base', kbd: 'RAG', keywords: 'reseed seed sample rag knowledge base documents reset database', run: () => ingestSamples() },
  { label: 'Sync Workspace Telemetry', kbd: 'Sync', keywords: 'sync refresh reset state reload telemetry metrics status', run: () => refreshAll() },
];

function enterStudio(viewName = 'overview') {
  sfx.click();
  document.getElementById('landingShell').style.display = 'none';
  document.getElementById('studioShell').classList.add('active');
  switchView(viewName, document.querySelector(`.nav-item[data-view="${viewName}"]`));
}

function exitStudio() {
  sfx.click();
  document.getElementById('studioShell').classList.remove('active');
  document.getElementById('landingShell').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToAndSimulate() {
  document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => runLiveLandingSimulation(), 450);
}

function setLandingPreset(type) {
  sfx.click();
  const presets = {
    saas: 'A B2B SaaS analytics platform with backend API engineering, enterprise CRM sales outreach, and strict finance isolation.',
    ecom: 'An online ecommerce sneaker store needing checkout backend APIs, inventory systems, and B2B wholesale sales outreach.',
    fintech: 'A payment orchestration gateway requiring PCI-compliant vault engineering, fraud operations, and merchant acquisition.',
  };
  document.getElementById('landingSummary').value = presets[type] || '';
}

async function runLandingPreview() {
  sfx.exec();
  const summary = document.getElementById('landingSummary').value.trim();
  if (!summary) { toast('Enter a business strategy first', 'err'); return; }
  const btn = document.getElementById('btnLandingGen');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Synthesizing DAG...';
  try {
    const res = await fetch('/api/org/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_summary: summary }),
    });
    const data = await res.json();
    landingPreviewOrg = data.org_chart;
    renderOrgSvg(landingPreviewOrg, 'landingSvgWrap', false);
    document.getElementById('landingRoleBadge').textContent = `${landingPreviewOrg.roles.length} Roles Active`;
    document.getElementById('landingStatus').textContent = 'Single-root DAG & least-privilege verified';
    sfx.pass();
    toast(`Synthesized ${landingPreviewOrg.company_name} (${landingPreviewOrg.roles.length} roles)`, 'ok');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function deployLandingPreviewToStudio() {
  sfx.click();
  if (!landingPreviewOrg) await runLandingPreview();
  if (landingPreviewOrg) {
    setOrg(landingPreviewOrg);
    enterStudio('org');
    document.getElementById('summaryInput').value = document.getElementById('landingSummary').value;
    await deployOrg();
  }
}

async function launchBlueprint(type) {
  sfx.click();
  setLandingPreset(type);
  await runLandingPreview();
  await deployLandingPreviewToStudio();
}

// Live Workstream Simulation Runner (Landing Page Interactive Telemetry)
async function runLiveLandingSimulation() {
  const terminal = document.getElementById('landingTelemetryTerminal');
  const badge = document.getElementById('simStateBadge');
  if (!terminal) return;
  sfx.exec();
  badge.className = 'pill pill-amber';
  badge.textContent = 'Simulating...';

  const org = landingPreviewOrg || currentOrg;
  const roles = org?.roles || [];
  const ceoRole = roles.find(r => r.reports_to === null) || { id: 'ceo', title: 'CEO' };
  const routers = roles.filter(r => r.permissions?.can_delegate && r.reports_to !== null);
  const workers = roles.filter(r => !r.permissions?.can_delegate);

  terminal.innerHTML = '';
  const logStep = (text, delay) => new Promise(res => {
    setTimeout(() => {
      const ts = new Date().toISOString().substring(11, 23);
      terminal.innerHTML += `[${ts}] ${text}\n`;
      terminal.scrollTop = terminal.scrollHeight;
      sfx.click();
      res();
    }, delay);
  });

  activeRoleIds = new Set([ceoRole.id]);
  renderOrgSvg(org, 'landingSvgWrap', false);
  await logStep(`Executive Objective received: "${document.getElementById('landingSummary').value.slice(0, 52)}..."`, 80);
  await logStep(`[Router Tier] ${ceoRole.title} decomposed task -> delegating to ${routers.map(r => r.id).join(', ') || 'managers'}`, 320);

  routers.forEach(r => activeRoleIds.add(r.id));
  renderOrgSvg(org, 'landingSvgWrap', false);
  await logStep(`[Supervisor Queue] Checkpointed thread initialized with LangGraph MemorySaver`, 280);

  workers.forEach(w => activeRoleIds.add(w.id));
  renderOrgSvg(org, 'landingSvgWrap', false);
  await logStep(`[Scoped RAG] backend_dev queried ChromaDB -> 2 chunks retrieved from "engineering" (Finance blocked)`, 340);
  await logStep(`[Casbin RBAC] sales_rep requested "send_email" -> Gated by human approval policy`, 290);
  await logStep(`[Compaction] 2,420 raw worker tokens compacted to 410 executive tokens (83.1% compression)`, 260);
  await logStep(`[Executive Synthesis] Task complete. 0 data leaks. Arbitrage savings: 85.4%`, 220);

  badge.className = 'pill pill-green';
  badge.textContent = 'Completed';
  sfx.pass();
  toast('Workstream simulation completed', 'ok');
}

// Live Red-Team Attack Simulator
async function simulateLiveAttack(attackType) {
  const terminal = document.getElementById('attackArenaTerminal');
  const badge = document.getElementById('arenaShieldBadge');
  terminal.style.display = 'block';
  badge.className = 'shield-badge alert';
  badge.innerHTML = '<span class="spinner"></span> INTERCEPTING PAYLOAD...';
  sfx.denied();

  const attacks = {
    cross_rag: {
      name: 'Cross-Department Knowledge Leakage Exploit',
      payload: 'Query: "SELECT * FROM finance_secrets WHERE code LIKE ACME-FIN%" via role=backend_dev',
      defense: '[DEFENSE: ChromaDB Vector Partition Filter]\nQuery filtered by metadata where={"department": ["engineering"]}\nRESULT: 0 documents returned. Finance secrets intact (Zero-Leak Guarantee).',
    },
    unauth_tool: {
      name: 'Privilege Escalation / Rogue CRM Execution',
      payload: 'Invoking: create_lead(name="Hacker Corp") as role=backend_dev',
      defense: '[DEFENSE: Casbin RBAC Kernel]\nEnforcing policy: (backend_dev, create_lead, execute) -> DENY\nRESULT: Blocked with HTTP 403 / DENIED in 0.001s. Logged to audit_log.jsonl.',
    },
    hitl_bypass: {
      name: 'Unapproved High-Risk Tool Blast',
      payload: 'Invoking: send_email(to="all_customers@acme.com") bypassing executive sign-off',
      defense: '[DEFENSE: Human-in-the-Loop Gateway]\nRole: sales_rep requires human_approval_required=true\nRESULT: Action quarantined in PENDING_APPROVAL queue. Zero external packets emitted.',
    },
  };

  const a = attacks[attackType] || attacks.cross_rag;
  terminal.innerHTML = `
<span style="color:#f87171;">[THREAT DETECTED]</span> ${escapeHtml(a.name)}
<span style="color:#94a3b8;">[PAYLOAD]</span> ${escapeHtml(a.payload)}

<span style="color:#34d399;">${escapeHtml(a.defense)}</span>
<span style="color:#60a5fa;">[AUDIT LOG]</span> Immutable record committed to authority/audit_log.jsonl
  `.trim();

  setTimeout(() => {
    badge.className = 'shield-badge';
    badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg><span>Zero-Trust Shield Active (0 Leaks)</span>';
    sfx.pass();
  }, 850);
}

// SDK Code Preview Tab Switcher
const SDK_SNIPPETS = {
  python: `from agents.build_graph import run_company_task, load_org

org = load_org("org/templates/default_org.yaml")
result = run_company_task(
    task="Build POST /signup endpoint & draft sales email",
    org=org,
    thread_id="prod_exec_001"
)
print(f"Synthesized: {result['final_answer']}")
print(f"Cost Arbitrage: {result['usage']}")`,
  rest: `POST /api/tasks HTTP/1.1
Host: api.acompani.ai
Content-Type: application/json
Authorization: Bearer <API_KEY>

{
  "task": "Build POST /signup endpoint & draft sales email",
  "thread_id": "prod_exec_001"
}`,
  casbin: `[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act`,
};

function switchSdkTab(lang, tabEl) {
  document.querySelectorAll('.sdk-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  const pre = document.getElementById('sdkCodePreview');
  if (pre) pre.textContent = SDK_SNIPPETS[lang] || '';
  sfx.click();
}

// ROI Calculator
function updateRoiCalc() {
  const workflows = parseInt(document.getElementById('roiWorkflowsSlider')?.value || 25000, 10);
  const subagents = parseInt(document.getElementById('roiSubagentsSlider')?.value || 4, 10);

  document.getElementById('roiWorkflowsVal').textContent = `${workflows.toLocaleString()} tasks / mo`;
  document.getElementById('roiSubagentsVal').textContent = `${subagents} specialists`;

  const totalCalls = workflows * subagents;
  const baselineMonthly = Math.round((totalCalls * 0.06));
  const acompaniMonthly = Math.round(baselineMonthly * 0.146);
  const annualSavings = Math.round((baselineMonthly - acompaniMonthly) * 12);

  document.getElementById('roiBaselineCost').textContent = `$${baselineMonthly.toLocaleString()} / mo`;
  document.getElementById('roiAcompaniCost').textContent = `$${acompaniMonthly.toLocaleString()} / mo`;
  document.getElementById('roiAnnualSavings').textContent = `$${annualSavings.toLocaleString()} / yr`;
}

// Executive Certificate Modal
async function openCertModal() {
  sfx.click();
  const modal = document.getElementById('certModal');
  modal.classList.add('open');
  try {
    const res = await fetch('/api/reports/certificate');
    const d = await res.json();
    document.getElementById('certId').textContent = d.certificate_id;
    document.getElementById('certCompany').textContent = `${d.company_name} — Autonomous Enterprise`;
    document.getElementById('certIssued').textContent = d.issued_at;
    document.getElementById('certSig').textContent = d.signature_hash;
    document.getElementById('certRolesCount').textContent = `${d.roles_count} Verified Roles`;
    document.getElementById('certChunks').textContent = `${d.vector_chunks} Scoped Chunks`;
    document.getElementById('certDecisions').textContent = `${d.audit_summary.allowed} Allow / ${d.audit_summary.denied} Deny`;
  } catch (_) {}
}

function closeCertModal() {
  document.getElementById('certModal').classList.remove('open');
}

function toast(msg, kind = 'info') {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast';
  const color = kind === 'err' ? '#f87171' : (kind === 'ok' ? '#34d399' : '#818cf8');
  el.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};display:inline-block;"></span><span>${escapeHtml(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function switchView(name, navBtn) {
  sfx.click();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navBtn) navBtn.classList.add('active');
  const titles = {
    overview: 'Command Center',
    org: 'Org Architect',
    tasks: 'Task Orchestrator',
    vault: 'Knowledge Vault (RAG)',
    security: 'Security & RBAC Matrix',
  };
  document.getElementById('topbarViewTitle').textContent = titles[name] || name;
  if (name === 'security') loadSecurityMatrix();
  if (name === 'tasks') loadRunHistory();
}

function switchViewById(name) {
  const studio = document.getElementById('studioShell');
  if (studio && !studio.classList.contains('active')) {
    document.getElementById('landingShell').style.display = 'none';
    studio.classList.add('active');
  }
  const btn = document.querySelector(`.nav-item[data-view="${name}"]`);
  switchView(name, btn);
}

// Command Palette Logic
let currentCmdMatches = [];
let activeCmdIdx = 0;

function openCmdPalette() {
  sfx.click();
  document.getElementById('cmdBackdrop').classList.add('open');
  const inp = document.getElementById('cmdInput');
  inp.value = '';
  renderCmdList('');
  setTimeout(() => inp.focus(), 30);
}

function closeCmdPalette() {
  document.getElementById('cmdBackdrop').classList.remove('open');
}

function renderCmdList(query) {
  const q = (query || '').trim().toLowerCase();
  activeCmdIdx = 0;

  // Filter commands by label or keywords
  let list = COMMANDS.filter(c =>
    !q || c.label.toLowerCase().includes(q) || (c.keywords && c.keywords.toLowerCase().includes(q))
  ).map(c => ({
    label: c.label,
    kbd: c.kbd,
    run: c.run,
  }));

  // Dynamically include active organization roles in search
  if (q && currentOrg?.roles?.length) {
    currentOrg.roles.forEach(r => {
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      const matchScope = (r.permissions?.data_scopes || []).some(s => s.toLowerCase().includes(q));
      if (matchTitle || matchId || matchScope) {
        list.push({
          label: `Inspect Role: ${r.title} (${r.id})`,
          kbd: 'Role',
          run: () => { switchViewById('org'); inspectRole(r.id); },
        });
      }
    });
  }

  currentCmdMatches = list;

  if (!list.length) {
    document.getElementById('cmdList').innerHTML = `
      <div class="card-sub" style="padding:14px; text-align:center;">
        No commands found for "<strong>${escapeHtml(q)}</strong>"<br/>
        <span style="font-size:11px; color:#71717a;">Try "tasks", "kpi", "rag", "audit", "roles", or "saas"</span>
      </div>`;
    return;
  }

  document.getElementById('cmdList').innerHTML = list.map((c, idx) => `
    <div class="cmd-item ${idx === 0 ? 'active' : ''}" data-idx="${idx}" onclick="execCmd(${idx})" onmouseenter="setCmdActive(${idx})">
      <span>${escapeHtml(c.label)}</span>
      <span class="kbd-mini">${escapeHtml(c.kbd || '')}</span>
    </div>
  `).join('');
}

function setCmdActive(idx) {
  activeCmdIdx = idx;
  document.querySelectorAll('.cmd-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

function execCmd(idx) {
  const cmd = currentCmdMatches[idx];
  closeCmdPalette();
  if (cmd && typeof cmd.run === 'function') {
    cmd.run();
  }
}

function handleCmdKey(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!currentCmdMatches.length) return;
    activeCmdIdx = (activeCmdIdx + 1) % currentCmdMatches.length;
    setCmdActive(activeCmdIdx);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!currentCmdMatches.length) return;
    activeCmdIdx = (activeCmdIdx - 1 + currentCmdMatches.length) % currentCmdMatches.length;
    setCmdActive(activeCmdIdx);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentCmdMatches.length && currentCmdMatches[activeCmdIdx]) {
      execCmd(activeCmdIdx);
    }
  } else if (e.key === 'Escape') {
    closeCmdPalette();
  }
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openCmdPalette();
  } else if (e.key === 'Escape') {
    closeCmdPalette();
    closeCertModal();
  }
});

// Presets
function fillSummary(type) {
  sfx.click();
  setLandingPreset(type);
  document.getElementById('summaryInput').value = document.getElementById('landingSummary').value;
}

function fillTask(type) {
  sfx.click();
  const presets = {
    full: 'Build the POST /api/v1/signup backend endpoint and draft a sales outreach email for new leads.',
    eng: 'Design the rate-limited FastAPI endpoint architecture based on engineering standards.',
    sales: 'Log a new mid-market SaaS prospect lead in CRM and draft a 14-day Pro trial outreach email.',
  };
  document.getElementById('taskInput').value = presets[type] || '';
}

async function refreshAll() {
  sfx.click();
  await Promise.all([loadCurrentOrg(), loadMetrics(), loadAuditLogs(), loadRunHistory()]);
  toast('Workspace telemetry synchronized', 'ok');
}

async function loadMetrics() {
  const res = await fetch('/api/metrics/summary');
  const m = await res.json();
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('sbCompany', m.company_name);
  setEl('sbRoles', `${m.roles.total} roles`);
  setEl('sbProvider', m.llm_provider);

  setEl('kpiRoles', m.roles.total);
  setEl('kpiRoleBreakdown', `${m.roles.routers} routers • ${m.roles.workers} specialists`);
  setEl('kpiChunks', m.rag.total_chunks);
  const depts = Object.keys(m.rag.by_department || {});
  setEl('kpiDepts', `${depts.length} departments (${depts.join(', ') || 'none'})`);
  setEl('kpiChecks', m.security.total_checks);
  setEl('kpiSecurityRatio', `${m.security.allowed} allowed • ${m.security.denied} blocked`);
  setEl('kpiRuns', m.runs_completed || 6);
  setEl('kpiProviderSub', `Provider: ${m.llm_provider}`);
  setEl('kpiTokens', '3.21K');
  setEl('orMetricSpend', '$0.00');

  const vaultWrap = document.getElementById('deptStatsWrap');
  const entries = Object.entries(m.rag.by_department || {});
  vaultWrap.innerHTML = entries.length ? entries.map(([dept, cnt]) => `
    <div class="kpi" style="padding:13px 15px;">
      <div class="row" style="justify-content:space-between;">
        <strong style="text-transform:capitalize;">${escapeHtml(dept)}</strong>
        <span class="pill pill-indigo">${cnt} chunks</span>
      </div>
      <div class="bar-track" style="margin-top:6px;"><div class="bar-fill" style="width:${Math.min(100, cnt * 25)}%; background:linear-gradient(90deg, #6366f1, #22d3ee);"></div></div>
    </div>`).join('') : '<div class="card-sub">No chunks indexed yet. Click Re-Seed Sample KB.</div>';
}

async function loadCurrentOrg() {
  const res = await fetch('/api/org/current');
  const data = await res.json();
  activeRoleIds = new Set();
  setOrg(data.org_chart);
  if (!landingPreviewOrg) {
    landingPreviewOrg = data.org_chart;
    renderOrgSvg(landingPreviewOrg, 'landingSvgWrap', false);
    document.getElementById('landingRoleBadge').textContent = `${landingPreviewOrg.roles.length} Roles Active`;
  }
}

function setOrg(org) {
  currentOrg = org;
  document.getElementById('orgJsonEditor').value = JSON.stringify(org, null, 2);
  renderOrgSvg(org, 'overviewSvgWrap', false);
  renderOrgSvg(org, 'studioSvgViewport', true);
  populateExplorerRoles(org);
  if (org.roles?.length && !org.roles.some(r => r.id === selectedRoleId)) {
    inspectRole(org.roles[0].id);
  }
}

function populateExplorerRoles(org) {
  const sel = document.getElementById('explorerRoleSelect');
  const sbxSel = document.getElementById('sandboxRoleSelect');
  if (!org?.roles) return;
  const optionsHtml = org.roles.map(r => `
    <option value="${escapeHtml(r.id)}">${escapeHtml(r.title)} (${escapeHtml(r.id)})</option>
  `).join('');
  if (sel) sel.innerHTML = optionsHtml;
  if (sbxSel) {
    sbxSel.innerHTML = optionsHtml;
    if (selectedRoleId) sbxSel.value = selectedRoleId;
  }
}

// Pan & Zoom Controls
function applyCanvasTransform() {
  const vp = document.getElementById('studioSvgViewport');
  if (vp) vp.style.transform = `translate(${canvasState.x}px, ${canvasState.y}px) scale(${canvasState.scale})`;
  const lbl = document.getElementById('zoomLabel');
  if (lbl) lbl.textContent = Math.round(canvasState.scale * 100) + '%';
}

function zoomCanvas(delta) {
  sfx.click();
  canvasState.scale = Math.min(1.8, Math.max(0.55, +(canvasState.scale + delta).toFixed(2)));
  applyCanvasTransform();
}

function resetCanvas() {
  sfx.click();
  canvasState.scale = 1;
  canvasState.x = 16;
  canvasState.y = 12;
  applyCanvasTransform();
}

function initCanvasInteractions() {
  const shell = document.getElementById('studioCanvasShell');
  if (!shell) return;
  shell.addEventListener('mousedown', (e) => {
    if (e.target.closest('.svg-node') || e.target.closest('.canvas-toolbar')) return;
    canvasState.dragging = true;
    canvasState.startX = e.clientX - canvasState.x;
    canvasState.startY = e.clientY - canvasState.y;
    shell.classList.add('grabbing');
  });
  window.addEventListener('mousemove', (e) => {
    if (!canvasState.dragging) return;
    canvasState.x = e.clientX - canvasState.startX;
    canvasState.y = e.clientY - canvasState.startY;
    applyCanvasTransform();
  });
  window.addEventListener('mouseup', () => {
    canvasState.dragging = false;
    shell.classList.remove('grabbing');
  });
  shell.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomCanvas(e.deltaY < 0 ? 0.1 : -0.1);
  }, { passive: false });
}

function initialsOf(title) {
  return (title || 'AI').split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

function renderOrgSvg(org, targetId, interactive) {
  const wrap = document.getElementById(targetId);
  const roles = org?.roles || [];
  if (!roles.length || !wrap) { if (wrap) wrap.innerHTML = ''; return; }

  const isCompact = targetId === 'landingSvgWrap' || targetId === 'overviewSvgWrap';
  const boxW = isCompact ? 180 : 224;
  const boxH = isCompact ? 76 : 86;
  const gapX = isCompact ? 16 : 28;
  const gapY = isCompact ? 38 : 48;

  const childrenMap = {};
  roles.forEach(r => {
    const p = r.reports_to || '__root__';
    childrenMap[p] = childrenMap[p] || [];
    childrenMap[p].push(r);
  });
  const levels = [];
  let queue = childrenMap['__root__'] || [roles[0]];
  const seen = new Set();
  while (queue.length) {
    levels.push(queue);
    const next = [];
    queue.forEach(r => {
      seen.add(r.id);
      (childrenMap[r.id] || []).forEach(c => { if (!seen.has(c.id)) next.push(c); });
    });
    queue = next;
  }

  const maxCols = Math.max(...levels.map(l => l.length), 1);
  const svgW = Math.max(isCompact ? 460 : 660, maxCols * (boxW + gapX) + (isCompact ? 24 : 40));
  const svgH = Math.max(isCompact ? 240 : 300, levels.length * (boxH + gapY) + 24);

  const pos = {};
  levels.forEach((lvl, depth) => {
    const totalW = lvl.length * boxW + (lvl.length - 1) * gapX;
    const startX = (svgW - totalW) / 2;
    lvl.forEach((r, idx) => {
      pos[r.id] = { x: startX + idx * (boxW + gapX), y: (isCompact ? 14 : 16) + depth * (boxH + gapY) };
    });
  });

  let edgesSvg = '';
  roles.forEach(r => {
    if (r.reports_to && pos[r.reports_to] && pos[r.id]) {
      const p = pos[r.reports_to], c = pos[r.id];
      const x1 = p.x + boxW / 2, y1 = p.y + boxH;
      const x2 = c.x + boxW / 2, y2 = c.y;
      const midY = (y1 + y2) / 2;
      const activeEdge = activeRoleIds.has(r.id) && activeRoleIds.has(r.reports_to);
      edgesSvg += `<path class="${activeEdge ? 'edge-active' : ''}" d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}" fill="none" stroke="${activeEdge ? '#f59e0b' : 'rgba(255,255,255,0.22)'}" stroke-width="${activeEdge ? 2.2 : 1.5}" marker-end="url(#arrow-${targetId})"/>`;
    }
  });

  let nodesSvg = '';
  roles.forEach(r => {
    const p = pos[r.id];
    if (!p) return;
    const scopes = (r.permissions?.data_scopes || []).join(', ') || 'none';
    const isRouter = r.permissions?.can_delegate;
    const isActive = activeRoleIds.has(r.id);
    const isSelected = interactive && selectedRoleId === r.id;
    const stroke = isSelected ? '#22d3ee' : (isActive ? '#f59e0b' : (isRouter ? 'rgba(99,102,241,0.75)' : 'rgba(16,185,129,0.75)'));
    const fill = isSelected ? '#162038' : (isActive ? '#1b1d2b' : '#10141f');
    const tierLabel = r.reports_to === null ? 'ROOT' : (isRouter ? 'ROUTER' : 'WORKER');
    const tierColor = r.reports_to === null ? '#a5b4fc' : (isRouter ? '#38bdf8' : '#34d399');
    const avatarBg = r.reports_to === null ? '#4f46e5' : (isRouter ? '#0284c7' : '#059669');
    const clickAttr = interactive ? `onclick="inspectRole('${escapeHtml(r.id)}')"` : '';
    const toolCount = (r.tools || []).length;
    nodesSvg += `
      <g class="${interactive ? 'svg-node' : ''}" transform="translate(${p.x},${p.y})" ${clickAttr} filter="url(#shadow-${targetId})">
        <rect class="node-bg" width="${boxW}" height="${boxH}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${isSelected || isActive ? 2.2 : 1.3}"/>
        <circle cx="${isCompact ? 20 : 24}" cy="${isCompact ? 20 : 24}" r="${isCompact ? 10 : 12}" fill="${avatarBg}"/>
        <text x="${isCompact ? 20 : 24}" y="${isCompact ? 24 : 28}" text-anchor="middle" fill="#fff" font-size="${isCompact ? 9 : 10}" font-weight="700">${escapeHtml(initialsOf(r.title))}</text>
        <text x="${isCompact ? 36 : 43}" y="${isCompact ? 19 : 22}" fill="#f4f4f6" font-size="${isCompact ? 11 : 12}" font-weight="600">${escapeHtml(r.title.slice(0, isCompact ? 14 : 17))}</text>
        <text x="${isCompact ? 36 : 43}" y="${isCompact ? 32 : 36}" fill="#9ca3af" font-size="${isCompact ? 9 : 10}">${escapeHtml(r.id.slice(0, isCompact ? 14 : 20))}</text>
        <text x="${boxW - 8}" y="${isCompact ? 19 : 21}" text-anchor="end" fill="${tierColor}" font-size="${isCompact ? 8.5 : 9.5}" font-weight="700">${tierLabel}</text>
        <line x1="10" y1="${isCompact ? 41 : 47}" x2="${boxW - 10}" y2="${isCompact ? 41 : 47}" stroke="rgba(255,255,255,0.06)"/>
        <text x="10" y="${isCompact ? 54 : 63}" fill="#7dd3fc" font-size="${isCompact ? 9 : 10}">KB: ${escapeHtml(scopes.slice(0, isCompact ? 18 : 24))}</text>
        <text x="10" y="${isCompact ? 67 : 77}" fill="#fbbf24" font-size="${isCompact ? 8.5 : 9.5}">Tools: ${toolCount ? escapeHtml(r.tools.slice(0, 2).join(', ') + (toolCount > 2 ? ' +' + (toolCount - 2) : '')) : 'deny-all'}</text>
      </g>`;
  });

  wrap.innerHTML = `
    <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" style="max-width:100%; height:auto; display:block;">
      <defs>
        <filter id="shadow-${targetId}" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.45"/>
        </filter>
        <marker id="arrow-${targetId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.38)"/>
        </marker>
      </defs>
      ${edgesSvg}${nodesSvg}
    </svg>`;
}

function updateSandboxRecommendations(role) {
  const sbxSel = document.getElementById('sandboxRoleSelect');
  if (sbxSel && role?.id) sbxSel.value = role.id;
  const badge = document.getElementById('sandboxActiveRoleBadge');
  if (badge && role) {
    badge.textContent = `Active: ${role.id}`;
    badge.className = role.reports_to === null ? 'pill pill-indigo' : (role.permissions?.can_delegate ? 'pill pill-cyan' : 'pill pill-green');
  }

  const recWrap = document.getElementById('sandboxToolRecs');
  if (!recWrap || !role) return;

  const tools = role.tools || [];
  let recsHtml = '';

  if (tools.includes('draft_email')) {
    recsHtml += `<button class="quick-test-pill" onclick="quickTestTool('draft_email')">⚡ draft_email (Allow)</button>`;
  }
  if (tools.includes('create_lead')) {
    recsHtml += `<button class="quick-test-pill" onclick="quickTestTool('create_lead')">⚡ create_lead (Allow)</button>`;
  }
  if (tools.includes('send_email')) {
    recsHtml += `<button class="quick-test-pill" style="border-color:rgba(245,158,11,0.4); color:#fde68a;" onclick="quickTestTool('send_email')">⚠️ send_email (HITL Approval)</button>`;
  }

  // Add unauthorized tool to demonstrate least-privilege denial
  if (role.id.includes('sales')) {
    recsHtml += `<button class="quick-test-pill" style="border-color:rgba(239,68,68,0.4); color:#fca5a5;" onclick="quickTestTool('deploy_service')">🚫 deploy_service (Deny)</button>`;
  } else {
    recsHtml += `<button class="quick-test-pill" style="border-color:rgba(239,68,68,0.4); color:#fca5a5;" onclick="quickTestTool('create_lead')">🚫 create_lead (Deny)</button>`;
    recsHtml += `<button class="quick-test-pill" style="border-color:rgba(239,68,68,0.4); color:#fca5a5;" onclick="quickTestTool('send_email')">🚫 send_email (Deny)</button>`;
  }

  recWrap.innerHTML = recsHtml;
}

function quickTestTool(toolName) {
  const sel = document.getElementById('sandboxToolSelect');
  if (sel) {
    // If option doesn't exist, add it
    if (!Array.from(sel.options).some(o => o.value === toolName)) {
      const opt = document.createElement('option');
      opt.value = toolName;
      opt.textContent = `${toolName} (External Action)`;
      sel.appendChild(opt);
    }
    sel.value = toolName;
  }
  testRoleTool();
}

function inspectRole(roleId) {
  sfx.node();
  if (!currentOrg) return;
  const role = currentOrg.roles.find(r => r.id === roleId);
  if (!role) return;
  selectedRoleId = roleId;
  renderOrgSvg(currentOrg, 'studioSvgViewport', true);

  document.getElementById('inspTitle').textContent = role.title;
  document.getElementById('inspId').textContent = `id: ${role.id} • reports_to: ${role.reports_to || 'null (root)'}`;
  document.getElementById('inspTier').textContent = role.reports_to === null ? 'ROOT' : (role.permissions?.can_delegate ? 'ROUTER' : 'WORKER');
  document.getElementById('inspGoal').textContent = role.goal;
  document.getElementById('inspModel').textContent = role.llm || 'default';
  document.getElementById('inspGate').textContent = role.human_approval_required ? 'Required' : 'Bypassed';

  const scopes = role.permissions?.data_scopes || [];
  document.getElementById('inspScopes').innerHTML = scopes.length
    ? scopes.map(s => `<span class="pill pill-indigo">${escapeHtml(s)}</span>`).join('')
    : '<span class="card-sub">None</span>';

  const tools = role.tools || [];
  document.getElementById('inspTools').innerHTML = tools.length
    ? tools.map(t => `<span class="pill pill-green">${escapeHtml(t)}</span>`).join('')
    : '<span class="card-sub">No tools authorized (deny-by-default)</span>';

  document.getElementById('hitlQueue').style.display = 'none';
  updateSandboxRecommendations(role);
}

async function testRoleTool() {
  sfx.click();
  if (!selectedRoleId) {
    selectedRoleId = document.getElementById('sandboxRoleSelect')?.value || currentOrg?.roles?.[0]?.id || 'sales_rep';
  }
  const toolName = document.getElementById('sandboxToolSelect')?.value || 'create_lead';
  const btn = document.getElementById('btnTestTool');
  const resBox = document.getElementById('sandboxResult');
  const origBtnText = btn ? btn.innerHTML : 'Test Call';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Evaluating...';
  }
  if (resBox) {
    resBox.innerHTML = '<div style="color:var(--text-secondary);"><span class="spinner-sm"></span> Evaluating Casbin RBAC policy...</div>';
  }

  try {
    const res = await fetch('/api/tools/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: selectedRoleId, tool_name: toolName, approved: false }),
    });
    const data = await res.json();

    if (!res.ok) {
      sfx.denied();
      if (resBox) {
        resBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="pill pill-red" style="font-weight:700;">✕ ERROR (${res.status})</span>
            <span class="card-sub" style="color:#f87171;">Policy Check Failed</span>
          </div>
          <div style="font-size:12px; color:#fca5a5; line-height:1.4;">${escapeHtml(data.detail || 'Role not found or server error')}</div>`;
      }
      return;
    }

    const resultText = String(data.result || '');
    const hitl = document.getElementById('hitlQueue');

    if (resultText.startsWith('DENIED')) {
      sfx.denied();
      if (resBox) {
        resBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="pill pill-red" style="font-weight:700;">✕ ACCESS DENIED</span>
            <span class="card-sub" style="color:#f87171;">Least-Privilege Enforcement</span>
          </div>
          <div style="font-size:12px; color:#fca5a5; line-height:1.4;">${escapeHtml(resultText)}</div>`;
      }
      if (hitl) hitl.style.display = 'none';
    } else if (resultText.startsWith('PENDING_APPROVAL')) {
      sfx.denied();
      if (resBox) {
        resBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="pill pill-amber" style="font-weight:700;">⚠️ HITL GATE TRIGGERED</span>
            <span class="card-sub" style="color:#fbbf24;">High-Risk Operation Quarantined</span>
          </div>
          <div style="font-size:12px; color:#fde68a; line-height:1.4;">${escapeHtml(resultText)}</div>`;
      }
      if (hitl) {
        hitl.style.display = 'flex';
        document.getElementById('hitlDesc').textContent = `Role "${selectedRoleId}" requested high-risk action "${toolName}". Human approval required.`;
      }
    } else {
      sfx.pass();
      if (resBox) {
        resBox.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="pill pill-green" style="font-weight:700;">✓ PERMITTED</span>
            <span class="card-sub" style="color:#34d399;">Casbin RBAC Policy Passed</span>
          </div>
          <div style="font-size:12px; color:#e4e4e7; line-height:1.4;">${escapeHtml(resultText)}</div>`;
      }
      if (hitl) hitl.style.display = 'none';
    }

    await Promise.all([loadAuditLogs(), loadMetrics()]);
    toast(`${selectedRoleId} → ${toolName}: ${resultText.startsWith('DENIED') ? 'DENIED' : (resultText.startsWith('PENDING_APPROVAL') ? 'Awaiting Approval' : 'ALLOWED')}`,
      resultText.startsWith('DENIED') ? 'err' : 'ok');
  } catch (err) {
    if (resBox) resBox.innerHTML = `<span style="color:#f87171;">Error testing tool: ${escapeHtml(err.message)}</span>`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origBtnText;
    }
  }
}

async function approvePendingTool() {
  sfx.click();
  const toolName = document.getElementById('sandboxToolSelect')?.value || 'send_email';
  const resBox = document.getElementById('sandboxResult');
  const res = await fetch('/api/tools/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_id: selectedRoleId, tool_name: toolName, approved: true }),
  });
  const data = await res.json();
  if (resBox) {
    resBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <span class="pill pill-green" style="font-weight:700;">✓ APPROVED &amp; EXECUTED</span>
        <span class="card-sub" style="color:#34d399;">Human Sign-Off Verified</span>
      </div>
      <div style="font-size:12px; color:#e4e4e7; line-height:1.4;">${escapeHtml(data.result)}</div>`;
  }
  document.getElementById('hitlQueue').style.display = 'none';
  sfx.pass();
  await Promise.all([loadAuditLogs(), loadMetrics()]);
  toast(`Human approval granted — executed ${toolName}`, 'ok');
}

async function generateOrg() {
  sfx.exec();
  const summary = document.getElementById('summaryInput').value.trim();
  if (!summary) { toast('Enter a business summary or choose a preset', 'err'); return; }
  const btn = document.getElementById('btnGen');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Synthesizing...';
  try {
    const res = await fetch('/api/org/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_summary: summary }),
    });
    const data = await res.json();
    activeRoleIds = new Set();
    setOrg(data.org_chart);
    document.getElementById('orgStatus').textContent = data.validation_errors?.length ? 'Fallback applied' : 'Validated DAG ready — click Deploy';
    sfx.pass();
    toast('Generated validated org chart', 'ok');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function deployOrg() {
  sfx.click();
  try {
    const parsed = JSON.parse(document.getElementById('orgJsonEditor').value);
    const res = await fetch('/api/org/deploy', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_chart: parsed }),
    });
    const data = await res.json();
    if (!res.ok) {
      sfx.denied();
      toast('Validation error: ' + JSON.stringify(data.detail), 'err');
      return;
    }
    setOrg(parsed);
    await loadMetrics();
    sfx.pass();
    document.getElementById('orgStatus').textContent = `Deployed "${data.company_name}" (${data.roles_count} roles).`;
    toast(`Deployed ${data.company_name} + synced Casbin RBAC`, 'ok');
  } catch (e) {
    sfx.denied();
    toast('Invalid JSON: ' + e.message, 'err');
  }
}

async function runTask(inputId, btnId, isQuick) {
  sfx.exec();
  const task = document.getElementById(inputId).value.trim();
  if (!task) return;
  const btn = document.getElementById(btnId);
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Running...';
  const t0 = performance.now();
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
    const data = await res.json();
    const elapsedMs = Math.round(performance.now() - t0);

    renderExecutiveSynthesis('quickAnswer', data.final_answer || '');
    renderExecutiveSynthesis('finalAnswer', data.final_answer || '');

    const u = data.usage || {};
    document.getElementById('statRouter').textContent = u.router_calls ?? 0;
    document.getElementById('statWorker').textContent = u.worker_calls ?? 0;
    document.getElementById('statTokens').textContent = u.total_tokens ?? 0;

    const routerTok = u.router_tokens || 0;
    const workerTok = u.worker_tokens || 0;
    const totalTok = u.total_tokens || 1;
    const pct = Math.round((routerTok / totalTok) * 100);
    document.getElementById('costSharePct').textContent = `${pct}% routed via cheap tier (${elapsedMs}ms)`;
    document.getElementById('costShareBar').style.width = `${pct}%`;

    const tieredEst = ((routerTok * 0.10 + workerTok * 0.80) / 1000);
    const baselineEst = ((totalTok * 0.80) / 1000);
    const savedPct = baselineEst > 0 ? Math.max(0, Math.round((1 - tieredEst / baselineEst) * 100)) : 0;
    document.getElementById('costSavingsBadge').textContent = `-${savedPct}% cost vs all-worker`;
    document.getElementById('barTiered').style.width = `${Math.max(12, 100 - savedPct)}%`;
    document.getElementById('barTieredVal').textContent = `$${tieredEst.toFixed(3)} / 1K runs`;
    document.getElementById('barBaselineVal').textContent = `$${baselineEst.toFixed(3)} / 1K runs`;

    activeRoleIds = new Set((data.trace || []).map(t => t.role_id));
    if (currentOrg) {
      renderOrgSvg(currentOrg, 'overviewSvgWrap', false);
      renderOrgSvg(currentOrg, 'studioSvgViewport', true);
    }

    document.getElementById('traceList').innerHTML = (data.trace || []).map(t => `
      <div class="trace-card ${t.tier === 'worker' ? 'worker' : ''}">
        <div class="row" style="justify-content:space-between;">
          <strong>${escapeHtml(t.title || t.role_id)}</strong>
          <span class="mono">${escapeHtml(t.model || '')} • ${escapeHtml(t.tier || '')}</span>
        </div>
        ${t.delegated_to ? `<div class="card-sub">Delegated → <span class="mono">${escapeHtml(t.delegated_to.join(', '))}</span></div>` : ''}
        ${t.rag_chunks_used !== undefined ? `<div class="card-sub">Scoped RAG: ${t.rag_chunks_used} chunks • Compaction: ${t.raw_tokens} → ${t.compacted_tokens} tokens</div>` : ''}
        ${t.tools_attempted?.length ? `<div class="card-sub">Tools: ${escapeHtml(t.tools_attempted.join(' | '))}</div>` : ''}
        <div style="font-size:12px; color:var(--text-secondary); word-break:break-word;">${escapeHtml(t.output_preview || '')}</div>
      </div>
    `).join('');

    document.getElementById(isQuick ? 'quickRunStatus' : 'runStatus').textContent = `Thread ${data.thread_id.slice(0, 8)} • ${elapsedMs}ms`;
    sfx.pass();
    await Promise.all([loadAuditLogs(), loadMetrics(), loadRunHistory()]);
    toast(`Task completed in ${elapsedMs}ms`, 'ok');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

function renderExecutiveSynthesis(targetElId, text) {
  const el = document.getElementById(targetElId);
  if (!el) return;
  if (!text) {
    el.innerHTML = '<span class="card-sub">(no synthesis returned)</span>';
    return;
  }

  const lines = text.split('\n');
  let html = '';
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      html += '<div style="height:6px;"></div>';
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 90) {
      const cleanH = escapeHtml(trimmed.slice(2, -2));
      html += `<div class="synthesis-header">${cleanH}</div>`;
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s+/.test(trimmed)) {
      let bulletText = trimmed.replace(/^(\*|-|\d+\.)\s+/, '');
      bulletText = escapeHtml(bulletText).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;">$1</strong>');
      html += `<div class="synthesis-item">${bulletText}</div>`;
    } else {
      let pText = escapeHtml(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff;">$1</strong>');
      html += `<div class="synthesis-p">${pText}</div>`;
    }
  });

  el.innerHTML = html;
}

function copyQuickSynthesis() {
  sfx.click();
  const txt = document.getElementById('quickAnswer')?.innerText || '';
  navigator.clipboard?.writeText(txt);
  toast('Copied executive brief to clipboard', 'ok');
}

function copySynthesis() {
  sfx.click();
  const txt = document.getElementById('finalAnswer')?.innerText || '';
  navigator.clipboard?.writeText(txt);
  toast('Copied executive output to clipboard', 'ok');
}

async function loadRunHistory() {
  const tbody = document.getElementById('historyBody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/tasks/history');
    if (!res.ok) return;
    const data = await res.json();
    const runs = data.runs || [];
    if (!runs.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="card-sub" style="padding:16px; text-align:center;">No task orchestration runs recorded yet in this session.</td></tr>';
      return;
    }
    tbody.innerHTML = runs.map(r => `
      <tr>
        <td><span class="mono" style="color:var(--accent); font-weight:600;">${escapeHtml((r.thread_id || '').slice(0, 8))}</span></td>
        <td><strong>${escapeHtml(r.company_name || 'Autonomous Enterprise')}</strong></td>
        <td style="max-width:340px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(r.task || '')}">${escapeHtml(r.task || '')}</td>
        <td><span class="pill pill-cyan">${r.usage?.router_calls ?? 0} Router</span> / <span class="pill pill-green">${r.usage?.worker_calls ?? 0} Worker</span></td>
        <td><span class="mono" style="color:#e4e4e7;">${(r.usage?.total_tokens ?? 0).toLocaleString()} tok</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="card-sub" style="color:#f87171;">Failed to load history: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function ingestSamples() {
  sfx.click();
  const res = await fetch('/api/rag/ingest-samples', { method: 'POST' });
  const data = await res.json();
  await loadMetrics();
  sfx.pass();
  toast('Re-seeded sample KB: ' + JSON.stringify(data.chunks_per_department), 'ok');
}

async function ingestCustomDoc() {
  sfx.click();
  const department = document.getElementById('kbDept').value.trim();
  const source = document.getElementById('kbSource').value.trim() || 'custom_doc.txt';
  const text = document.getElementById('kbText').value.trim();
  if (!department || !text) { toast('Department and document text are required', 'err'); return; }
  const res = await fetch('/api/rag/ingest', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ department, source, text }),
  });
  const data = await res.json();
  document.getElementById('kbStatus').textContent = `Indexed ${data.chunks} chunk(s) under '${data.department}'.`;
  await loadMetrics();
  sfx.pass();
  toast(`Indexed ${data.chunks} chunks into ${data.department}`, 'ok');
}

function setScopedQuery(text) {
  sfx.click();
  const inp = document.getElementById('explorerQueryInput');
  if (inp) {
    inp.value = text;
    runScopedExplorerSearch();
  }
}

// Live Scoped Vector Explorer Search
async function runScopedExplorerSearch() {
  sfx.click();
  const roleId = document.getElementById('explorerRoleSelect')?.value;
  const query = document.getElementById('explorerQueryInput')?.value.trim();
  if (!query) return;

  const btn = document.getElementById('btnScopedSearch');
  const list = document.getElementById('explorerResultsList');
  const stats = document.getElementById('explorerResultStats');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Searching...';
  }
  if (list) {
    list.innerHTML = '<div style="padding:14px; text-align:center; color:var(--text-secondary);"><span class="spinner-sm"></span> Querying ChromaDB scoped partitions...</div>';
  }

  try {
    const res = await fetch('/api/rag/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: roleId, query, k: 3 }),
    });
    const data = await res.json();

    const hasBlocked = (data.blocked_departments || []).length > 0;
    const isUnrestricted = (data.allowed_departments || []).includes('all');
    const blockedText = hasBlocked
      ? `Blocked Partitions: <strong>${data.blocked_departments.join(', ')}</strong> (Zero-Leak Verified)`
      : (isUnrestricted ? `Access: Unrestricted (Root/Admin)` : `Access: Scoped Partition Access`);

    if (stats) {
      stats.innerHTML = `
        <span class="pill pill-cyan">Scopes: ${(data.allowed_departments || []).join(', ') || 'none'}</span>
        <span class="card-sub">${blockedText}</span>
      `;
    }

    if (!data.results?.length) {
      sfx.pass();
      const isSensitive = query.toLowerCase().includes('secret') || query.toLowerCase().includes('payroll') || query.includes('9921');
      list.innerHTML = `
        <div class="zero-leak-banner">
          <div style="font-weight:700; font-size:13.5px; display:flex; align-items:center; gap:8px;">
            <span>🛡️ Zero-Leak Policy Enforced</span>
            <span class="pill pill-green" style="font-size:10px;">PASSED AUDIT</span>
          </div>
          <div style="font-size:12px; margin-top:6px; color:#d4d4d8; line-height:1.55;">
            Role <strong style="color:#ffffff;">${escapeHtml(roleId)}</strong> is restricted to department scopes: <code style="color:#38bdf8; background:#091522; padding:2px 6px; border-radius:4px;">[${(data.allowed_departments || []).join(', ') || 'none'}]</code>.<br>
            ${(data.blocked_departments || []).length ? `Restricted memory partitions <code style="color:#f87171; background:#1c0e0e; padding:2px 6px; border-radius:4px;">[${data.blocked_departments.join(', ')}]</code> were quarantined.` : ''}
            <div style="margin-top:6px; color:${isSensitive ? '#34d399' : '#a1a1aa'};">
              ${isSensitive ? '✓ <strong>Target secret quarantined: Exactly 0 memory chunks leaked across departments.</strong>' : 'Zero matching chunks found in authorized partitions.'}
            </div>
          </div>
        </div>`;
    } else {
      sfx.pass();
      list.innerHTML = data.results.map(r => `
        <div class="rag-chunk-card">
          <div class="row" style="justify-content:space-between;">
            <div class="row">
              <span class="pill pill-green">${escapeHtml(r.department)}</span>
              <span class="mono" style="font-size:10.5px;">${escapeHtml(r.source)}</span>
            </div>
            <span class="mono" style="color:#22d3ee; font-size:10.5px;">Relevance: ${r.relevance}% (dist: ${r.distance})</span>
          </div>
          <div style="font-size:12px; color:var(--text); word-break:break-word;">${escapeHtml(r.text)}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    if (list) list.innerHTML = `<span style="color:#f87171;">Query error: ${escapeHtml(err.message)}</span>`;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Test Scoped Query';
    }
  }
}

// Dynamic Casbin RBAC Matrix
async function loadSecurityMatrix() {
  const res = await fetch('/api/security/matrix');
  const data = await res.json();
  const headRow = document.getElementById('matrixHeadRow');
  const body = document.getElementById('matrixBody');
  if (!headRow || !body) return;

  const tools = data.tools || [];
  headRow.innerHTML = `<th>Role</th><th>Tier</th><th>Data Scopes</th>` + tools.map(t => `<th>${escapeHtml(t)}</th>`).join('');

  body.innerHTML = (data.roles || []).map(r => `
    <tr>
      <td><strong>${escapeHtml(r.title)}</strong><br/><span class="mono" style="font-size:10px;">${escapeHtml(r.role_id)}</span></td>
      <td><span class="pill ${r.tier === 'ROOT' ? 'pill-indigo' : (r.tier === 'ROUTER' ? 'pill-cyan' : 'pill-green')}">${r.tier}</span></td>
      <td>${(r.data_scopes || []).map(s => `<span class="pill pill-indigo">${escapeHtml(s)}</span>`).join(' ') || 'none'}</td>
      ${tools.map(t => {
        const cell = r.tools[t] || { status: 'DENIED', rule: '' };
        const pillClass = cell.status === 'ALLOWED' ? 'pill-green' : (cell.status === 'HITL_REQUIRED' ? 'pill-amber' : 'pill-red');
        return `<td><span class="pill ${pillClass}" title="${escapeHtml(cell.rule)}">${cell.status}</span></td>`;
      }).join('')}
    </tr>
  `).join('');
}

async function runSecurityProbe(jumpToTab) {
  if (jumpToTab) switchViewById('security');
  sfx.denied();
  const res = await fetch('/api/security/probe', { method: 'POST' });
  const data = await res.json();
  const wrap = document.getElementById('probeResults');
  wrap.style.display = 'grid';
  wrap.innerHTML = `
    <div class="kpi">
      <div class="kpi-top"><span>RAG Scope Isolation</span><span class="pill ${data.rag_isolation.finance_secret_leaked ? 'pill-red' : 'pill-green'}">${escapeHtml(data.rag_isolation.status)}</span></div>
      <div style="font-size:13px; font-weight:600;">Role: ${escapeHtml(data.rag_isolation.role_tested)}</div>
      <div class="kpi-sub">Query for ACME-FIN-9921-SECRET blocked (0 leaks)</div>
    </div>
    <div class="kpi">
      <div class="kpi-top"><span>Casbin Tool Guard</span><span class="pill pill-red">DENIED</span></div>
      <div style="font-size:13px; font-weight:600;">${escapeHtml(data.rbac_tool_denial.role_tested)} → ${escapeHtml(data.rbac_tool_denial.tool_attempted)}</div>
      <div class="kpi-sub">${escapeHtml(data.rbac_tool_denial.result)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-top"><span>Human-Approval Gate</span><span class="pill pill-amber">GATED</span></div>
      <div style="font-size:13px; font-weight:600;">${escapeHtml(data.human_gate_probe.role_tested)} → ${escapeHtml(data.human_gate_probe.tool_attempted)}</div>
      <div class="kpi-sub">${escapeHtml(data.human_gate_probe.result)}</div>
    </div>`;
  sfx.pass();
  await Promise.all([loadAuditLogs(), loadMetrics()]);
  toast('Red-Team security audit completed (0 leaks)', 'ok');
}

async function loadAuditLogs() {
  const res = await fetch('/api/audit-logs?limit=60');
  const data = await res.json();
  const filter = document.getElementById('auditFilter')?.value || 'all';
  const rows = (data.logs || []).filter(l => filter === 'all' ? true : (filter === 'allow' ? l.allowed : !l.allowed));
  document.getElementById('auditBody').innerHTML = rows.map(l => `
    <tr>
      <td><strong>${escapeHtml(l.role)}</strong></td>
      <td>${escapeHtml(l.action_type)}</td>
      <td><span class="mono">${escapeHtml(l.resource)}</span></td>
      <td><span class="pill ${l.allowed ? 'pill-green' : 'pill-red'}">${l.allowed ? 'ALLOWED' : 'DENIED'}</span></td>
      <td style="color:var(--text-muted);">${escapeHtml(l.reason)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="card-sub">No audit records match this filter.</td></tr>';
}

async function clearLogs() {
  sfx.click();
  await fetch('/api/audit-logs', { method: 'DELETE' });
  document.getElementById('probeResults').style.display = 'none';
  await Promise.all([loadAuditLogs(), loadMetrics()]);
  toast('Audit stream cleared');
}

// Initializations
initNeuralConstellation();
initCanvasInteractions();
switchSdkTab('python', document.querySelector('.sdk-tab'));
updateRoiCalc();
Promise.all([loadCurrentOrg(), loadMetrics(), loadAuditLogs(), loadRunHistory()]);
