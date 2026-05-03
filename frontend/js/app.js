/* =====================================================
   Smart Disaster Response MIS — Single-Page App
   ===================================================== */

const API_BASE = 'http://127.0.0.1:3000';

const STATE = {
  reports: [],
  teams: [],
  inventory: [],
  hospitals: [],
  financials: [],
  approvals: [],
  users: [],
  auditLogs: [],
  disasterTypes: [],
  resourceTypes: [],
  warehouses: [],
  financialCategories: [],
  rolePermissions: {},
  currentUser: null,
  permissions: []
};

let currentPage = 'dashboard';
let isLoading = false;

/* ---------- Networking ---------- */
async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ctype = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();
  if (!ctype.includes('application/json')) {
    throw new Error('Invalid JSON response from server');
  }
  try {
    return JSON.parse(text);
  } catch (_) {
    throw new Error('Invalid JSON response from server');
  }
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  let body;
  try { body = await res.json(); } catch (_) { body = null; }
  if (!res.ok || (body && body.ok === false)) {
    const msg = (body && (body.error || body.message)) || ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return body;
}

async function loadData() {
  if (isLoading) return;
  isLoading = true;
  try {
    const results = await Promise.allSettled([
      safeFetch(`${API_BASE}/reports`),
      safeFetch(`${API_BASE}/teams`),
      safeFetch(`${API_BASE}/inventory`),
      safeFetch(`${API_BASE}/hospitals`),
      safeFetch(`${API_BASE}/financials`),
      safeFetch(`${API_BASE}/approvals`),
      safeFetch(`${API_BASE}/users`),
      safeFetch(`${API_BASE}/audit-logs`),
      safeFetch(`${API_BASE}/disaster-types`),
      safeFetch(`${API_BASE}/resource-types`),
      safeFetch(`${API_BASE}/warehouses`),
      safeFetch(`${API_BASE}/financial-categories`)
    ]);

    const pick = (idx) => {
      const r = results[idx];
      if (r && r.status === 'fulfilled' && Array.isArray(r.value)) return r.value;
      if (r && r.status === 'rejected') console.warn('loadData: endpoint failed', r.reason);
      return [];
    };

    const [r, t, i, h, f, a, u, al, dt, rt, wh, fc] =
      results.map((_, idx) => pick(idx));

    STATE.reports             = r;
    STATE.teams               = t;
    STATE.inventory           = i;
    STATE.hospitals           = h;
    STATE.financials          = f;
    STATE.approvals           = a;
    STATE.users               = u;
    STATE.auditLogs           = al;
    STATE.disasterTypes       = dt;
    STATE.resourceTypes       = rt;
    STATE.warehouses          = wh;
    STATE.financialCategories = fc;

    const failed = results.filter(x => x.status === 'rejected').length;
    if (failed) toast(`${failed} endpoint(s) failed to load`, 'warning');

    renderPage(currentPage);
  } catch (err) {
    console.error('loadData failed:', err);
    toast('Failed to load data: ' + err.message, 'error');
    STATE.reports             = STATE.reports             || [];
    STATE.teams               = STATE.teams               || [];
    STATE.inventory           = STATE.inventory           || [];
    STATE.hospitals           = STATE.hospitals           || [];
    STATE.financials          = STATE.financials          || [];
    STATE.approvals           = STATE.approvals           || [];
    STATE.users               = STATE.users               || [];
    STATE.auditLogs           = STATE.auditLogs           || [];
    STATE.disasterTypes       = STATE.disasterTypes       || [];
    STATE.resourceTypes       = STATE.resourceTypes       || [];
    STATE.warehouses          = STATE.warehouses          || [];
    STATE.financialCategories = STATE.financialCategories || [];
  } finally {
    isLoading = false;
  }
}

/* ---------- Auth ---------- */
async function doServerLogin(username, password) {
  try {
    const data = await api('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    STATE.currentUser = data.user;
    STATE.permissions = data.permissions || [];
    sessionStorage.setItem('mis_user', JSON.stringify(data.user));
    sessionStorage.setItem('mis_perms', JSON.stringify(STATE.permissions));
    return data.user;
  } catch (err) {
    return { error: err.message };
  }
}

function logout() {
  STATE.currentUser = null;
  STATE.permissions = [];
  sessionStorage.removeItem('mis_user');
  sessionStorage.removeItem('mis_perms');
  showLogin();
}

function getUser() {
  if (STATE.currentUser) return STATE.currentUser;
  const s = sessionStorage.getItem('mis_user');
  if (!s) return null;
  try {
    STATE.currentUser = JSON.parse(s);
  } catch (_) {
    STATE.currentUser = null;
    sessionStorage.removeItem('mis_user');
    return null;
  }
  const p = sessionStorage.getItem('mis_perms');
  try {
    STATE.permissions = p ? JSON.parse(p) : [];
  } catch (_) {
    STATE.permissions = [];
  }
  if (!Array.isArray(STATE.permissions)) STATE.permissions = [];
  return STATE.currentUser;
}

function hasPermission(perm) {
  const user = getUser();
  if (!user) return false;
  if (!Array.isArray(STATE.permissions)) STATE.permissions = [];
  const perms = STATE.permissions;
  return perms.includes(perm) || user.role === 'Administrator';
}

/* ---------- Routing ---------- */
async function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  await loadData();
  renderPage(page);
  refreshSidebarBadges();
}

function renderPage(page) {
  const area = document.getElementById('content-area');
  if (!area) return;

  area.innerHTML = '';

  const titles = {
    dashboard: 'Dashboard Overview', reports: 'Emergency Reports', teams: 'Rescue Teams',
    inventory: 'Inventory Management', hospitals: 'Hospital Coordination',
    financials: 'Financial Management', approvals: 'Approval Workflows',
    audit: 'Audit & Monitoring', users: 'User Management'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[page] || page;

  switch (page) {
    case 'dashboard':  area.innerHTML = renderDashboard();  afterDashboard();  break;
    case 'reports':    area.innerHTML = renderReports();    break;
    case 'teams':      area.innerHTML = renderTeams();      break;
    case 'inventory':  area.innerHTML = renderInventory();  break;
    case 'hospitals':  area.innerHTML = renderHospitals();  break;
    case 'financials': area.innerHTML = renderFinancials(); afterFinancials(); break;
    case 'approvals':  area.innerHTML = renderApprovals();  break;
    case 'audit':      area.innerHTML = renderAudit();      break;
    case 'users':      area.innerHTML = renderUsers();      break;
    default:           area.innerHTML = '<p>Page not found</p>';
  }
}

function refreshSidebarBadges() {
  const bar = document.getElementById('sidebar-nav');
  if (bar) bar.innerHTML = buildSidebar();
}

/* ---------- UI helpers ---------- */
function severityBadge(s) {
  const m = { Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return `<span class="badge ${m[s] || ''}">${s}</span>`;
}

function statusBadge(s) {
  const m = {
    Pending: 'badge-pending', Assigned: 'badge-assigned', InProgress: 'badge-inprogress',
    Resolved: 'badge-resolved', Closed: 'badge-closed', Approved: 'badge-approved',
    Rejected: 'badge-rejected', Available: 'badge-available', Busy: 'badge-busy',
    Dispatched: 'badge-dispatched'
  };
  return `<span class="badge ${m[s] || ''}">${s || ''}</span>`;
}

function formatCurrency(n) {
  return 'PKR ' + Number(n || 0).toLocaleString('en-PK');
}

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `alert-strip ${type === 'error' ? 'danger' : type} toast`;
  t.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;animation:fadeInUp .3s';
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function openModal(title, bodyHTML, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" id="mc">✕</button>
      </div>
      <div id="modal-body">${bodyHTML}</div>
      ${onConfirm
      ? '<div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end">' +
        '<button class="btn btn-outline" id="mc2">Cancel</button>' +
        '<button class="btn btn-primary" id="mConfirm">Confirm</button></div>'
      : ''}
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#mc').onclick = () => backdrop.remove();
  if (onConfirm) {
    backdrop.querySelector('#mc2').onclick = () => backdrop.remove();
    backdrop.querySelector('#mConfirm').onclick = async () => {
      try { await onConfirm(); } finally { backdrop.remove(); }
    };
  }
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

/* =====================================================
   PAGE: DASHBOARD
   ===================================================== */
function renderDashboard() {
  const totalIncome = STATE.financials
    .filter(f => f.type === 'Income' && f.status === 'Approved')
    .reduce((a, b) => a + Number(b.amount), 0);
  const totalExpense = STATE.financials
    .filter(f => f.type === 'Expense' && f.status === 'Approved')
    .reduce((a, b) => a + Number(b.amount), 0);
  const pending = STATE.approvals.filter(a => a.status === 'Pending').length;
  const totalAvailableBeds = STATE.hospitals.reduce((a, b) => a + Number(b.available || 0), 0);

  return `
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon red">🚨</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.reports.filter(r => r.status !== 'Resolved' && r.status !== 'Closed').length}</div>
        <div class="kpi-label">Active Incidents</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">🧑‍🚒</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.teams.filter(t => t.status === 'Available').length}</div>
        <div class="kpi-label">Teams Available</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon blue">🏥</div>
      <div class="kpi-body">
        <div class="kpi-value">${totalAvailableBeds}</div>
        <div class="kpi-label">Hospital Beds Available</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon orange">📦</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.inventory.filter(i => i.status === 'Low Stock').length}</div>
        <div class="kpi-label">Low-Stock Alerts</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon purple">✅</div>
      <div class="kpi-body">
        <div class="kpi-value">${pending}</div>
        <div class="kpi-label">Pending Approvals</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">💰</div>
      <div class="kpi-body">
        <div class="kpi-value">${((totalIncome - totalExpense) / 1e6).toFixed(1)}M</div>
        <div class="kpi-label">Net Balance (PKR)</div>
      </div>
    </div>
  </div>

  <div class="charts-row">
    <div class="card">
      <div class="card-header"><div class="card-title">📊 Incidents by Severity</div></div>
      <canvas id="chartSeverity" height="200"></canvas>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">💵 Financial Summary (PKR)</div></div>
      <canvas id="chartFinance" height="200"></canvas>
    </div>
  </div>

  <div class="charts-row">
    <div class="card">
      <div class="card-header"><div class="card-title">🚑 Recent Incidents</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Location</th><th>Type</th><th>Severity</th><th>Status</th></tr></thead>
          <tbody>
            ${STATE.reports.slice(0, 5).map(r => `
              <tr>
                <td><strong>#${r.id}</strong></td>
                <td>${r.location || ''}</td>
                <td>${r.type || ''}</td>
                <td>${severityBadge(r.severity)}</td>
                <td>${statusBadge(r.status)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">⚠️ Low Stock Alerts</div></div>
      ${STATE.inventory.filter(i => i.status === 'Low Stock').map(i => `
        <div class="alert-strip warning">
          📦 <strong>${i.resource}</strong> at ${i.warehouse} —
          Only ${i.qty} ${i.unit} remaining (threshold: ${i.threshold})
        </div>`).join('') || '<p style="color:var(--text-muted)">No low-stock alerts.</p>'}
      ${STATE.hospitals.filter(h => h.status === 'Critical' || h.status === 'Full').map(h => `
        <div class="alert-strip danger">
          🏥 <strong>${h.name}</strong> — ${h.available} beds available (${h.occupancy}% occupancy)
        </div>`).join('')}
    </div>
  </div>`;
}

function afterDashboard() {
  const ctx1 = document.getElementById('chartSeverity');
  if (ctx1 && window.Chart) {
    const counts = ['Critical', 'High', 'Medium', 'Low']
      .map(s => STATE.reports.filter(r => r.severity === s).length);
    new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{ data: counts, backgroundColor: ['#e63946', '#f4a261', '#ffd166', '#2a9d8f'] }]
      },
      options: { plugins: { legend: { position: 'right' } }, cutout: '60%' }
    });
  }
  const ctx2 = document.getElementById('chartFinance');
  if (ctx2 && window.Chart) {
    const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved')
      .reduce((a, b) => a + Number(b.amount), 0);
    const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved')
      .reduce((a, b) => a + Number(b.amount), 0);
    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Total Income', 'Total Expense', 'Net Balance'],
        datasets: [{
          data: [income / 1e6, expense / 1e6, (income - expense) / 1e6],
          backgroundColor: ['#2a9d8f', '#e63946', '#457b9d'],
          borderRadius: 8
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { ticks: { callback: v => v + 'M' } } }
      }
    });
  }
}

/* =====================================================
   PAGE: EMERGENCY REPORTS
   ===================================================== */
function renderReports() {
  return `
  <div class="card">
    <div class="card-header">
      <div class="card-title">Emergency Incident Reports</div>
      ${hasPermission('create_reports')
        ? '<button class="btn btn-primary btn-sm" onclick="showAddReport()">+ New Report</button>'
        : ''}
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <select id="fltStatus" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Statuses</option>
        <option>Pending</option><option>Assigned</option><option>InProgress</option><option>Resolved</option><option>Closed</option>
      </select>
      <select id="fltSeverity" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Severities</option>
        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
      </select>
      <select id="fltType" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Types</option>
        ${STATE.disasterTypes.map(t => `<option>${t.name}</option>`).join('')}
      </select>
    </div>
    <div class="table-wrap" id="reports-table-wrap">${renderReportsTable(STATE.reports)}</div>
  </div>`;
}

function renderReportsTable(data) {
  if (!Array.isArray(data)) data = [];
  if (!data.length) return '<p style="color:var(--text-muted)">No reports found.</p>';
  return `<table>
    <thead><tr><th>#</th><th>Citizen</th><th>Location</th><th>Type</th><th>Severity</th><th>Status</th><th>Reported At</th><th>Assigned Team</th><th>Actions</th></tr></thead>
    <tbody>
      ${data.map(r => `<tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.citizen || ''}<br><small style="color:var(--text-muted)">${r.phone || ''}</small></td>
        <td>${r.location || ''}</td>
        <td>${r.type || ''}</td>
        <td>${severityBadge(r.severity)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${r.reportedAt || ''}</td>
        <td>${r.team || '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
        <td>
          ${r.status === 'Pending' && hasPermission('manage_teams')
            ? `<button class="btn btn-sm btn-primary" onclick="assignTeamPrompt(${r.id})">Assign Team</button>`
            : ''}
        </td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}

function filterReports() {
  const s = document.getElementById('fltStatus').value;
  const sv = document.getElementById('fltSeverity').value;
  const t = document.getElementById('fltType').value;
  let data = STATE.reports;
  if (s)  data = data.filter(r => r.status === s);
  if (sv) data = data.filter(r => r.severity === sv);
  if (t)  data = data.filter(r => r.type === t);
  document.getElementById('reports-table-wrap').innerHTML = renderReportsTable(data);
}

function showAddReport() {
  openModal('New Emergency Report', `
    <div class="form-grid">
      <div class="form-group"><label>Citizen Name</label><input id="r-name"></div>
      <div class="form-group"><label>Phone</label><input id="r-phone"></div>
      <div class="form-group full"><label>Location</label><input id="r-loc"></div>
      <div class="form-group">
        <label>Disaster Type</label>
        <select id="r-type">
          ${STATE.disasterTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Severity</label>
        <select id="r-sev">
          <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
        </select>
      </div>
      <div class="form-group full"><label>Description</label><textarea id="r-desc"></textarea></div>
    </div>`,
    async () => {
      const u = getUser();
      const body = {
        citizen_name: document.getElementById('r-name').value,
        phone: document.getElementById('r-phone').value,
        location: document.getElementById('r-loc').value,
        disaster_type_id: parseInt(document.getElementById('r-type').value, 10),
        severity: document.getElementById('r-sev').value,
        description: document.getElementById('r-desc').value,
        reported_by: u && u.id
      };
      try {
        const data = await api('/create-report', { method: 'POST', body: JSON.stringify(body) });
        toast('Report stored (ID ' + data.new_report_id + ')');
        await loadData();
        renderPage('reports');
      } catch (err) { toast(err.message, 'error'); }
    });
}

function assignTeamPrompt(reportId) {
  const available = STATE.teams.filter(t => t.status === 'Available');
  if (!available.length) return toast('No available teams', 'warning');
  openModal('Assign Rescue Team', `
    <div class="form-group">
      <label>Team</label>
      <select id="at-team">
        ${available.map(t => `<option value="${t.id}">#${t.id} — ${t.name} (${t.type})</option>`).join('')}
      </select>
    </div>`, async () => {
    const u = getUser();
    try {
      await api('/assign-team', {
        method: 'POST',
        body: JSON.stringify({
          report_id: reportId,
          team_id: parseInt(document.getElementById('at-team').value, 10),
          operator_id: u && u.id
        })
      });
      toast('Team assigned');
      await loadData(); renderPage(currentPage);
    } catch (err) { toast(err.message, 'error'); }
  });
}

/* =====================================================
   PAGE: RESCUE TEAMS
   ===================================================== */
function renderTeams() {
  return `
  <div class="kpi-grid">
    ${['Available', 'Assigned', 'Busy', 'Completed'].map(s => `
      <div class="kpi-card">
        <div class="kpi-icon ${s === 'Available' ? 'green' : s === 'Busy' ? 'red' : s === 'Assigned' ? 'blue' : 'purple'}">
          ${s === 'Available' ? '✅' : s === 'Busy' ? '🔴' : s === 'Assigned' ? '📍' : '🏁'}
        </div>
        <div class="kpi-body">
          <div class="kpi-value">${STATE.teams.filter(t => t.status === s).length}</div>
          <div class="kpi-label">${s}</div>
        </div>
      </div>`).join('')}
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Rescue Team Directory</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Team Name</th><th>Type</th><th>Current Location</th><th>Status</th><th>Members</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.teams.map(t => `<tr>
            <td><strong>#${t.id}</strong></td>
            <td>${t.name}</td>
            <td><span class="badge badge-assigned">${t.type}</span></td>
            <td>${t.location || ''}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${t.members}</td>
            <td>
              ${(t.status === 'Busy' || t.status === 'Completed' || t.status === 'Assigned') && hasPermission('manage_teams')
                ? `<button class="btn btn-sm btn-success" onclick="releaseTeam(${t.id})">Release</button>`
                : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function releaseTeam(id) {
  const t = STATE.teams.find(x => x.id === id);
  if (!t) return;
  openModal(`Release Team: ${t.name}`,
    `<p>Mark <strong>${t.name}</strong> as Available?</p>`,
    async () => {
      const u = getUser();
      try {
        await api('/release-team', {
          method: 'POST',
          body: JSON.stringify({ team_id: id, released_by: u && u.id })
        });
        toast(`${t.name} released`);
        await loadData(); renderPage('teams');
      } catch (err) { toast(err.message, 'error'); }
    });
}

/* =====================================================
   PAGE: INVENTORY
   ===================================================== */
function renderInventory() {
  return `
  ${STATE.inventory.filter(i => i.status === 'Low Stock').map(i => `
    <div class="alert-strip warning">⚠️ Low Stock: <strong>${i.resource}</strong> at ${i.warehouse} — ${i.qty} ${i.unit} (threshold: ${i.threshold})</div>
  `).join('')}
  <div class="card">
    <div class="card-header">
      <div class="card-title">Warehouse Inventory</div>
      ${hasPermission('approve_resources') || hasPermission('manage_inventory')
        ? '<button class="btn btn-primary btn-sm" onclick="showResourceRequest()">+ Request Resources</button>'
        : ''}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Warehouse</th><th>Resource</th><th>Quantity</th><th>Unit</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.inventory.map(i => `<tr>
            <td>${i.id}</td>
            <td>${i.warehouse}</td>
            <td>${i.resource}</td>
            <td><strong>${Number(i.qty || 0).toLocaleString()}</strong></td>
            <td>${i.unit}</td>
            <td>${i.threshold}</td>
            <td><span class="badge ${i.status === 'Low Stock' ? 'badge-high' : 'badge-resolved'}">${i.status}</span></td>
            <td>${hasPermission('manage_inventory')
              ? `<button class="btn btn-sm btn-outline" onclick="updateInventory(${i.id})">Update</button>`
              : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function showResourceRequest() {
  const reportOpts = STATE.reports.filter(r => r.status !== 'Resolved' && r.status !== 'Closed');
  if (!STATE.warehouses.length || !STATE.resourceTypes.length) {
    return toast('Reference data not loaded yet', 'warning');
  }
  openModal('Request Resource Allocation', `
    <div class="form-grid">
      <div class="form-group">
        <label>Incident Report #</label>
        <select id="rr-report">
          ${reportOpts.map(r => `<option value="${r.id}">#${r.id} — ${r.location}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Warehouse</label>
        <select id="rr-wh">
          ${STATE.warehouses.map(w => `<option>${w.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Resource Type</label>
        <select id="rr-res">
          ${STATE.resourceTypes.map(r => `<option>${r.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Quantity</label>
        <input id="rr-qty" type="number" min="1" value="100">
      </div>
      <div class="form-group full"><label>Notes</label><textarea id="rr-notes"></textarea></div>
    </div>`,
    async () => {
      const u = getUser();
      const body = {
        report_id: parseInt(document.getElementById('rr-report').value, 10),
        warehouse: document.getElementById('rr-wh').value,
        resource_type: document.getElementById('rr-res').value,
        quantity: parseInt(document.getElementById('rr-qty').value, 10),
        notes: document.getElementById('rr-notes').value,
        requested_by: u && u.id
      };
      try {
        const data = await api('/request-resource', { method: 'POST', body: JSON.stringify(body) });
        toast('Resource request submitted (ID ' + data.new_request_id + ')');
        await loadData(); renderPage(currentPage);
      } catch (err) { toast(err.message, 'error'); }
    });
}

function updateInventory(id) {
  const inv = STATE.inventory.find(i => i.id === id);
  if (!inv) return;
  openModal(`Update Inventory: ${inv.resource}`, `
    <div class="form-group">
      <label>New Quantity (${inv.unit})</label>
      <input id="inv-qty" type="number" value="${inv.qty}">
    </div>`,
    async () => {
      const u = getUser();
      const newQty = parseFloat(document.getElementById('inv-qty').value);
      try {
        await api('/update-inventory', {
          method: 'POST',
          body: JSON.stringify({ resource_id: id, quantity: newQty, updated_by: u && u.id })
        });
        toast('Inventory updated');
        await loadData(); renderPage('inventory');
      } catch (err) { toast(err.message, 'error'); }
    });
}

/* =====================================================
   PAGE: HOSPITALS
   ===================================================== */
function renderHospitals() {
  return `
  <div class="card">
    <div class="card-header"><div class="card-title">Hospital Capacity Overview</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Hospital</th><th>Location</th><th>Total Beds</th><th>Available</th><th>Occupied</th><th>Occupancy %</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.hospitals.map(h => `<tr>
            <td>${h.id}</td>
            <td><strong>${h.name}</strong></td>
            <td>${h.location}</td>
            <td>${h.total}</td>
            <td>${h.available}</td>
            <td>${(h.total || 0) - (h.available || 0)}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:#eee;border-radius:3px">
                  <div style="width:${h.occupancy}%;height:100%;background:${h.occupancy > 90 ? 'var(--accent)' : h.occupancy > 75 ? 'var(--warning)' : 'var(--success)'};border-radius:3px"></div>
                </div>${h.occupancy}%
              </div>
            </td>
            <td><span class="badge ${h.status === 'Available' ? 'badge-resolved' : h.status === 'Critical' ? 'badge-critical' : 'badge-high'}">${h.status}</span></td>
            <td>${hasPermission('manage_hospitals')
              ? `<button class="btn btn-sm btn-outline" onclick="admitPatient(${h.id})">Admit Patient</button>`
              : '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function admitPatient(hospId) {
  const h = STATE.hospitals.find(x => x.id === hospId);
  if (!h) return;
  openModal(`Admit Patient to ${h.name}`, `
    <div class="form-grid">
      <div class="form-group"><label>Patient Name</label><input id="p-name"></div>
      <div class="form-group"><label>Age</label><input id="p-age" type="number"></div>
      <div class="form-group"><label>Gender</label>
        <select id="p-gender"><option>Male</option><option>Female</option><option>Other</option></select>
      </div>
      <div class="form-group"><label>Phone</label><input id="p-phone"></div>
      <div class="form-group"><label>Condition</label>
        <select id="p-cond"><option>Stable</option><option>Critical</option></select>
      </div>
    </div>`,
    async () => {
      const u = getUser();
      const body = {
        hospital_id: hospId,
        patient_name: document.getElementById('p-name').value,
        age: parseInt(document.getElementById('p-age').value, 10) || null,
        gender: document.getElementById('p-gender').value,
        phone: document.getElementById('p-phone').value,
        condition: document.getElementById('p-cond').value,
        admitted_by: u && u.id
      };
      try {
        const data = await api('/admit-patient', { method: 'POST', body: JSON.stringify(body) });
        toast('Patient admitted (ID ' + data.new_patient_id + ')');
        await loadData(); renderPage('hospitals');
      } catch (err) { toast(err.message, 'error'); }
    });
}

/* =====================================================
   PAGE: FINANCIALS
   ===================================================== */
function renderFinancials() {
  const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved')
    .reduce((a, b) => a + Number(b.amount), 0);
  const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved')
    .reduce((a, b) => a + Number(b.amount), 0);
  return `
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-icon green">💰</div><div class="kpi-body"><div class="kpi-value">${(income / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Income (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon red">💸</div><div class="kpi-body"><div class="kpi-value">${(expense / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Expenses (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon blue">⚖️</div><div class="kpi-body"><div class="kpi-value">${((income - expense) / 1e6).toFixed(1)}M</div><div class="kpi-label">Net Balance (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏳</div><div class="kpi-body"><div class="kpi-value">${STATE.financials.filter(f => f.status === 'Pending').length}</div><div class="kpi-label">Pending Approvals</div></div></div>
  </div>
  <div class="charts-row">
    <div class="card" style="margin-bottom:0">
      <div class="card-header"><div class="card-title">By Category</div></div>
      <canvas id="chartFinBreak" height="200"></canvas>
    </div>
    <div class="card" style="margin-bottom:0">
      <div class="card-header">
        <div class="card-title">All Transactions</div>
        ${hasPermission('manage_financials')
          ? '<button class="btn btn-primary btn-sm" onclick="addTransaction()">+ Add Transaction</button>'
          : ''}
      </div>
      <div class="table-wrap" style="max-height:300px;overflow-y:auto">
        <table>
          <thead><tr><th>#</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${STATE.financials.map(f => `<tr>
              <td>${f.id}</td>
              <td>${f.category}</td>
              <td><strong>${formatCurrency(f.amount)}</strong></td>
              <td>${statusBadge(f.status)}</td>
              <td>${f.date}</td>
              <td>${f.status === 'Pending' && hasPermission('manage_financials')
                ? `<button class="btn btn-sm btn-success" onclick="approveTransaction(${f.id})">Approve</button>`
                : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function afterFinancials() {
  const ctx = document.getElementById('chartFinBreak');
  if (!ctx || !window.Chart) return;
  const cats = [...new Set(STATE.financials.map(f => f.category))];
  const vals = cats.map(c => STATE.financials
    .filter(f => f.category === c)
    .reduce((a, b) => a + Number(b.amount), 0));
  new Chart(ctx, {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: vals, backgroundColor:
      ['#2a9d8f', '#457b9d', '#1a3a5c', '#e63946', '#f4a261', '#ffd166', '#e9c46a', '#a8dadc'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

function approveTransaction(id) {
  openModal('Approve Transaction', `<p>Approve transaction #${id}?</p>`, async () => {
    const u = getUser();
    try {
      await api('/approve-finance', {
        method: 'POST',
        body: JSON.stringify({ transaction_id: id, approved_by: u && u.id })
      });
      toast('Transaction approved');
      await loadData(); renderPage('financials');
    } catch (err) { toast(err.message, 'error'); }
  });
}

function addTransaction() {
  if (!STATE.financialCategories.length) return toast('Categories not loaded yet', 'warning');
  openModal('Add Financial Transaction', `
    <div class="form-grid">
      <div class="form-group"><label>Category</label>
        <select id="t-cat">
          ${STATE.financialCategories.map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Amount (PKR)</label><input id="t-amt" type="number" min="0"></div>
      <div class="form-group"><label>Donor / Payee</label><input id="t-donor"></div>
      <div class="form-group"><label>Reference No</label><input id="t-ref"></div>
      <div class="form-group"><label>Linked Report (optional)</label>
        <select id="t-report">
          <option value="">— none —</option>
          ${STATE.reports.map(r => `<option value="${r.id}">#${r.id} — ${r.location}</option>`).join('')}
        </select>
      </div>
      <div class="form-group full"><label>Description</label><textarea id="t-desc"></textarea></div>
    </div>`,
    async () => {
      const u = getUser();
      const repVal = document.getElementById('t-report').value;
      const body = {
        report_id: repVal ? parseInt(repVal, 10) : null,
        category_id: parseInt(document.getElementById('t-cat').value, 10),
        amount: parseFloat(document.getElementById('t-amt').value) || 0,
        description: document.getElementById('t-desc').value,
        reference_no: document.getElementById('t-ref').value,
        donor_name: document.getElementById('t-donor').value,
        recorded_by: u && u.id
      };
      try {
        const data = await api('/record-finance', { method: 'POST', body: JSON.stringify(body) });
        toast('Transaction saved (ID ' + data.new_transaction_id + ')');
        await loadData(); renderPage('financials');
      } catch (err) { toast(err.message, 'error'); }
    });
}

/* =====================================================
   PAGE: APPROVALS
   ===================================================== */
function renderApprovals() {
  return `
  <div class="card">
    <div class="card-header"><div class="card-title">Approval Workflow Queue</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Type</th><th>Description</th><th>Requested By</th><th>Status</th><th>Requested At</th><th>Decided At</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.approvals.map(a => `<tr>
            <td>${a.id}</td>
            <td><span class="badge badge-assigned">${a.type}</span></td>
            <td>${a.desc || ''}</td>
            <td>${a.requestedBy || ''}</td>
            <td>${statusBadge(a.status)}</td>
            <td>${a.requestedAt || ''}</td>
            <td>${a.decidedAt || '—'}</td>
            <td>
              ${a.status === 'Pending' && hasPermission('approve_workflows') ? `
                <button class="btn btn-sm btn-success" onclick="decideApproval(${a.id},'Approved')">Approve</button>
                <button class="btn btn-sm btn-danger"  onclick="decideApproval(${a.id},'Rejected')" style="margin-left:4px">Reject</button>`
                : '—'}
            </td>
          </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">No approval requests.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function decideApproval(id, decision) {
  const u = getUser();
  try {
    await api('/decide-approval', {
      method: 'POST',
      body: JSON.stringify({ approval_id: id, decision, approver_id: u && u.id })
    });
    toast(`Request ${decision.toLowerCase()}`);
    await loadData(); renderPage('approvals');
  } catch (err) { toast(err.message, 'error'); }
}

/* =====================================================
   PAGE: AUDIT LOGS
   ===================================================== */
function renderAudit() {
  if (!Array.isArray(STATE.auditLogs)) STATE.auditLogs = [];

  const rows = STATE.auditLogs.length
    ? STATE.auditLogs.map(l => `<tr>
        <td>${l.id ?? ''}</td>
        <td><strong>${l.user || ''}</strong></td>
        <td>${l.action || ''}</td>
        <td><code>${l.table || ''}</code></td>
        <td>${l.record_id ?? ''}</td>
        <td>${l.at || ''}</td>
      </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">No audit entries.</td></tr>';

  return `
  <div class="card">
    <div class="card-header"><div class="card-title">System Audit Log (last 200)</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>User</th><th>Action</th><th>Table</th><th>Record</th><th>Performed At</th></tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* =====================================================
   PAGE: USER MANAGEMENT
   ===================================================== */
function renderUsers() {
  if (!hasPermission('manage_users')) {
    return `<div class="alert-strip danger">⛔ You do not have permission to manage users.</div>`;
  }
  return `
  <div class="card">
    <div class="card-header">
      <div class="card-title">User Management</div>
      <button class="btn btn-primary btn-sm" onclick="addUser()">+ Add User</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Active</th></tr></thead>
        <tbody>
          ${STATE.users.map(u => `<tr>
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.name}</td>
            <td>${u.email || ''}</td>
            <td><span class="badge badge-assigned">${u.role}</span></td>
            <td>${u.active ? '✅' : '⛔'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function addUser() {
  openModal('Add New User', `
    <div class="form-grid">
      <div class="form-group"><label>Username</label><input id="u-user"></div>
      <div class="form-group"><label>Full Name</label><input id="u-name"></div>
      <div class="form-group"><label>Email</label><input id="u-email"></div>
      <div class="form-group"><label>Phone</label><input id="u-phone"></div>
      <div class="form-group">
        <label>Role</label>
        <select id="u-role">
          <option>Administrator</option>
          <option>EmergencyOperator</option>
          <option>FieldOfficer</option>
          <option>WarehouseManager</option>
          <option>FinanceOfficer</option>
        </select>
      </div>
      <div class="form-group"><label>Password</label><input id="u-pass" type="password"></div>
    </div>`,
    async () => {
      const me = getUser();
      const body = {
        username: document.getElementById('u-user').value,
        name: document.getElementById('u-name').value,
        email: document.getElementById('u-email').value,
        phone: document.getElementById('u-phone').value,
        role: document.getElementById('u-role').value,
        password: document.getElementById('u-pass').value,
        created_by: me && me.id
      };
      try {
        const data = await api('/create-user', { method: 'POST', body: JSON.stringify(body) });
        toast('User created (ID ' + data.new_user_id + ')');
        await loadData(); renderPage('users');
      } catch (err) { toast(err.message, 'error'); }
    });
}

/* =====================================================
   SIDEBAR
   ===================================================== */
function buildSidebar() {
  const u = getUser();
  if (!u) return '';
  const role = u.role;
  const allNav = [
    { group: 'Main', items: [
      { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
      { page: 'reports', icon: '🚨', label: 'Emergency Reports',
        badge: STATE.reports.filter(r => r.status === 'Pending').length },
    ]},
    { group: 'Operations', items: [
      { page: 'teams', icon: '🧑‍🚒', label: 'Rescue Teams',
        roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
      { page: 'inventory', icon: '📦', label: 'Inventory',
        roles: ['Administrator', 'EmergencyOperator', 'WarehouseManager'] },
      { page: 'hospitals', icon: '🏥', label: 'Hospitals',
        roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
    ]},
    { group: 'Finance', items: [
      { page: 'financials', icon: '💰', label: 'Financials',
        roles: ['Administrator', 'FinanceOfficer'] },
      { page: 'approvals', icon: '✅', label: 'Approvals',
        badge: STATE.approvals.filter(a => a.status === 'Pending').length },
    ]},
    { group: 'System', items: [
      { page: 'audit', icon: '📋', label: 'Audit Logs',
        roles: ['Administrator', 'EmergencyOperator'] },
      { page: 'users', icon: '👥', label: 'User Management',
        roles: ['Administrator'] },
    ]},
  ];

  let html = '';
  allNav.forEach(g => {
    const visible = g.items.filter(i =>
      !i.roles || i.roles.includes(role) || role === 'Administrator');
    if (!visible.length) return;
    html += `<div class="nav-section-label">${g.group}</div>`;
    visible.forEach(i => {
      html += `<div class="nav-item ${currentPage === i.page ? 'active' : ''}" data-page="${i.page}" onclick="navigate('${i.page}')">
        <span class="icon">${i.icon}</span> ${i.label}
        ${i.badge ? `<span class="badge">${i.badge}</span>` : ''}
      </div>`;
    });
  });
  return html;
}

/* =====================================================
   BOOTSTRAP — Login & App shells
   ===================================================== */
function showLogin() {
  document.body.innerHTML = `
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo">
        <span class="logo-icon">🆘</span>
        <h1>Smart Disaster Response MIS</h1>
        <p>Management Information System</p>
      </div>
      ${[
        { u: 'admin',     p: 'admin123',  r: 'Administrator' },
        { u: 'op_ahmed',  p: 'ahmed123',  r: 'Emergency Operator' },
        { u: 'field_ali', p: 'ali123',    r: 'Field Officer' },
        { u: 'wm_tariq',  p: 'tariq123',  r: 'Warehouse Manager' },
        { u: 'fin_nadia', p: 'nadia123',  r: 'Finance Officer' },
      ].map(d => `<button class="btn btn-outline" style="width:100%;margin-bottom:8px;justify-content:space-between" onclick="quickLogin('${d.u}','${d.p}')"><span>${d.r}</span><span style="font-size:11px;opacity:.7">${d.u}</span></button>`).join('')}
      <div style="text-align:center;margin:16px 0;color:var(--text-muted);font-size:12px">— or enter credentials manually —</div>
      <div class="form-group" style="margin-bottom:12px"><label>Username</label><input id="li-user" placeholder="username"></div>
      <div class="form-group" style="margin-bottom:20px"><label>Password</label><input id="li-pass" type="password" placeholder="password" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Login →</button>
      <div id="login-error" style="color:var(--accent);margin-top:12px;text-align:center;font-size:13px"></div>
    </div>
  </div>`;
}

async function quickLogin(u, p) {
  const result = await doServerLogin(u, p);
  if (result && !result.error) showApp();
  else toast((result && result.error) || 'Login failed', 'error');
}

async function doLogin() {
  const u = document.getElementById('li-user').value;
  const p = document.getElementById('li-pass').value;
  const result = await doServerLogin(u, p);
  if (result && !result.error) showApp();
  else document.getElementById('login-error').textContent = '❌ ' + ((result && result.error) || 'Login failed');
}

function showApp() {
  const u = getUser();
  if (!u) { showLogin(); return; }
  document.body.innerHTML = `
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">🆘</span>
        <div>Smart Disaster<br>Response MIS</div>
      </div>
      <div class="sidebar-nav" id="sidebar-nav">${buildSidebar()}</div>
      <div class="sidebar-footer">
        <div class="user-info">${u.name || u.username || ''}</div>
        <div class="role-tag">${u.role || ''}</div>
        <button class="logout-btn" onclick="logout()">⏻ Logout</button>
      </div>
    </nav>
    <div class="main-content">
      <div class="top-bar">
        <div class="page-title" id="page-title">Dashboard Overview</div>
        <div class="top-bar-right">
          <div style="font-size:12px;color:var(--text-muted)">${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="alert-bell" onclick="navigate('approvals')">🔔<span class="dot"></span></div>
        </div>
      </div>
      <div class="content-area" id="content-area"></div>
    </div>
  </div>`;
  navigate('dashboard');
}

/* ---------- Start ---------- */
(async function boot() {
  const existing = getUser();
  if (existing) {
    // Refresh permissions in background
    try {
      const map = await safeFetch(`${API_BASE}/permissions`);
      STATE.rolePermissions = map;
      STATE.permissions = map[existing.role] || STATE.permissions;
      sessionStorage.setItem('mis_perms', JSON.stringify(STATE.permissions));
    } catch (_) { /* ignore — keep cached perms */ }
    showApp();
  } else {
    showLogin();
  }
})();
