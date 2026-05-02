// =====================================================
// Smart Disaster Response MIS - Core JS
// =====================================================
let STATE = {
  reports: [],
  teams: [],
  inventory: [],
  hospitals: [],
  financials: [],
  approvals: [],
  users: [],
  auditLogs: []

};
// =====================================================
// Smart Disaster Response MIS - Core JS
// =====================================================
 
// =====================================================
// Smart Disaster Response MIS - Core JS
// =====================================================
 
async function loadData() {
  try {
    const [r, t, i, h, f, a, u] = await Promise.all([
      fetch('http://localhost:3000/reports').then(res => res.json()),
      fetch('http://localhost:3000/teams').then(res => res.json()),
      fetch('http://localhost:3000/inventory').then(res => res.json()),
      fetch('http://localhost:3000/hospitals').then(res => res.json()),
      fetch('http://localhost:3000/financials').then(res => res.json()),
      fetch('http://localhost:3000/approvals').then(res => res.json()),
      fetch('http://localhost:3000/users').then(res => res.json())
    ]);

    STATE.reports = r;
    STATE.teams = t;
    STATE.inventory = i;
    STATE.hospitals = h;
STATE.financials = f;
    STATE.approvals = a;
    STATE.users = u;

  } catch (err) {
    console.error(err);
    toast('Failed to load data', 'error');
    await loadData();
    renderPage(currentPage);
  }
}
async function approveDispatch() {
  const body = { request_id: 1, approved_qty: 10, approver_id: 2 };
  const res = await fetch('http://localhost:3000/approve-dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.ok ? 'Approved & Dispatched' : data.error);
}

async function assignTeam(reportId) {
  const teamId = 1; // or from dropdown

  const res = await fetch('http://localhost:3000/assign-team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_id: reportId,
      team_id: teamId,
      operator_id: 2
    })
  });

  const data = await res.json();

  if (data.ok) {
    toast('Team assigned via DB transaction');
    await loadData();
    renderPage(currentPage);
  } else {
    toast(data.error, 'error');
  }
}

async function recordFinance() {
  const body = {
    report_id: 1,
    category_id: 1,
    amount: 5000,
    description: 'Donation',
    reference_no: 'REF123',
    donor_name: 'Ali',
    recorded_by: 2
  };
  const res = await fetch('http://localhost:3000/record-finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.ok ? `Recorded (ID: ${data.new_transaction_id})` : data.error);
}

/* ---- Auth ---- */
const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: 'Administrator' , name: 'admin' },
  { username: 'op_ahmed', password: 'ahmed123', role: 'Emergency Operator' , name: 'op_ahmed' },
  { username: 'field_ali', password: 'ali123', role: 'Field Officer' , name: 'field_ali' },
  { username: 'wm_tariq', password: 'tariq123', role: 'Warehouse Manager' , name: 'wm_tariq' },
  { username: 'fin_nadia', password: 'nadia123', role: 'Finance Officer', name: 'fin_nadia'  }
];

// Initialize STATE if missing
if (!STATE.users || STATE.users.length === 0) {
  STATE.users = DEFAULT_USERS;
}
function login(username, password) {
  const u = STATE.users.find(u => u.username === username && u.password === password);
  if (!u) return null;
  STATE.currentUser = u;
  sessionStorage.setItem('mis_user', JSON.stringify(u));
  return u;
}

function logout() {
  STATE.currentUser = null;
  sessionStorage.removeItem('mis_user');
  showLogin();
}

function getUser() {
  if (STATE.currentUser) return STATE.currentUser;
  const s = sessionStorage.getItem('mis_user');
  if (s) { STATE.currentUser = JSON.parse(s); return STATE.currentUser; }
  return null;
}

function hasPermission(perm) {
  const u = getUser();
  if (!u) return false;
  const perms = STATE.rolePermissions[u.role] || [];
  return perms.includes('all') || perms.includes(perm);
}

/* ---- Routing ---- */
let currentPage = 'dashboard';
async function navigate(page) {
  currentPage = page;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  await loadData();   // 🔥 CRITICAL LINE

  renderPage(page);
}
/* ---- Severity / Status helpers ---- */
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
  return `<span class="badge ${m[s] || ''}">${s}</span>`;
}

function formatCurrency(n) {
  return 'PKR ' + Number(n).toLocaleString('en-PK');
}

/* ---- Toast ---- */
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `alert-strip ${type === 'error' ? 'danger' : type} toast`;
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;animation:fadeInUp .3s';
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---- Modal helper ---- */
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
      ${onConfirm ? '<div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end"><button class="btn btn-outline" id="mc2">Cancel</button><button class="btn btn-primary" id="mConfirm">Confirm</button></div>' : ''}
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#mc').onclick = () => backdrop.remove();
  if (onConfirm) {
    backdrop.querySelector('#mc2').onclick = () => backdrop.remove();
    backdrop.querySelector('#mConfirm').onclick = () => { onConfirm(); backdrop.remove(); };
  }
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

/* ---- Page renderer ---- */
function renderPage(page) {
  const area = document.getElementById('content-area');
  const titles =
  {
    dashboard: 'Dashboard Overview', reports: 'Emergency Reports', teams: 'Rescue Teams',
    inventory: 'Inventory Management', hospitals: 'Hospital Coordination',
    financials: 'Financial Management', approvals: 'Approval Workflows',
    audit: 'Audit & Monitoring', users: 'User Management', profile: 'My Profile'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  switch (page) {
    case 'dashboard': area.innerHTML = renderDashboard(); afterDashboard(); break;
    case 'reports': area.innerHTML = renderReports(); break;
    case 'teams': area.innerHTML = renderTeams(); break;
    case 'inventory': area.innerHTML = renderInventory(); break;
    case 'hospitals': area.innerHTML = renderHospitals(); break;
    case 'financials': area.innerHTML = renderFinancials(); afterFinancials(); break;
    case 'approvals': area.innerHTML = renderApprovals(); break;
    case 'audit': area.innerHTML = renderAudit(); break;
    case 'users': area.innerHTML = renderUsers(); break;
    default: area.innerHTML = '<p>Page not found</p>';
  }
}

/* =====================================================
   PAGE: DASHBOARD
   ===================================================== */
function renderDashboard() {
  const totalIncome = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const totalExpense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const pending = STATE.approvals.filter(a => a.status === 'Pending').length;

  return `
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon red">🚨</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.reports.filter(r => r.status != 'Resolved' && r.status != 'Closed').length}</div>
        <div class="kpi-label">Active Incidents</div>
        <div class="kpi-delta up">↑ 2 new today</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">🧑‍🚒</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.teams.filter(t => t.status === 'Available').length}</div>
        <div class="kpi-label">Teams Available</div>
        <div class="kpi-delta down">↓ 3 deployed</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon blue">🏥</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.hospitals.reduce((a, b) => a + b.available, 0)}</div>
        <div class="kpi-label">Hospital Beds Available</div>
        <div class="kpi-delta down">↓ 2 critical capacity</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon orange">📦</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.inventory.filter(i => i.status === 'Low Stock').length}</div>
        <div class="kpi-label">Low-Stock Alerts</div>
        <div class="kpi-delta down">⚠ Requires attention</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon purple">✅</div>
      <div class="kpi-body">
        <div class="kpi-value">${pending}</div>
        <div class="kpi-label">Pending Approvals</div>
        <div class="kpi-delta">Awaiting decision</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">💰</div>
      <div class="kpi-body">
        <div class="kpi-value">${((totalIncome - totalExpense) / 1000000).toFixed(1)}M</div>
        <div class="kpi-label">Net Balance (PKR)</div>
        <div class="kpi-delta up">↑ Funds available</div>
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
              <td>${r.location}</td>
              <td>${r.type}</td>
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
          📦 <strong>${i.resource}</strong> at ${i.warehouse} — Only ${i.qty} ${i.unit} remaining (threshold: ${i.threshold})
        </div>`).join('')}
      ${STATE.hospitals.filter(h => h.status === 'Critical' || h.status === 'Full').map(h => `
        <div class="alert-strip danger">
          🏥 <strong>${h.name}</strong> — Only ${h.available} beds available (${h.occupancy}% occupancy)
        </div>`).join('')}
    </div>
  </div>`;
}

function afterDashboard() {
  // Severity chart
  const ctx1 = document.getElementById('chartSeverity');
  if (ctx1) {
    const counts = ['Critical', 'High', 'Medium', 'Low'].map(s => STATE.reports.filter(r => r.severity === s).length);
    new Chart(ctx1,
      {
        type: 'doughnut',
        data: { labels: ['Critical', 'High', 'Medium', 'Low'], datasets: [{ data: counts, backgroundColor: ['#e63946', '#f4a261', '#ffd166', '#2a9d8f'] }] },
        options: { plugins: { legend: { position: 'right' } }, cutout: '60%' }
      });
  }
  // Finance chart
  const ctx2 = document.getElementById('chartFinance');
  if (ctx2) {
    const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
    const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
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
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => v + 'M' } } } }
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
      <button class="btn btn-primary btn-sm" onclick="showAddReport()">+ New Report</button>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <select id="fltStatus" class="form-group" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Statuses</option>
        <option>Pending</option><option>Assigned</option><option>InProgress</option><option>Resolved</option>
      </select>
      <select id="fltSeverity" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Severities</option>
        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
      </select>
      <select id="fltType" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Types</option>
        <option>Flood</option><option>Earthquake</option><option>Urban Fire</option><option>Landslide</option>
      </select>
    </div>
    <div class="table-wrap" id="reports-table-wrap">
      ${renderReportsTable(STATE.reports)}
    </div>
  </div>`;
}

function renderReportsTable(data) {
  return `<table>
    <thead><tr><th>#</th><th>Citizen</th><th>Location</th><th>Type</th><th>Severity</th><th>Status</th><th>Reported At</th><th>Assigned Team</th><th>Actions</th></tr></thead>
    <tbody>
      ${data.map(r => `<tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.citizen}<br><small style="color:var(--text-muted)">${r.phone}</small></td>
        <td>${r.location}</td>
        <td>${r.type}</td>
        <td>${severityBadge(r.severity)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${r.reportedAt}</td>
        <td>${r.team || '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewReport(${r.id})">View</button>
          ${r.status === 'Pending' && hasPermission('manage_teams') ? `<button class="btn btn-sm btn-primary" onclick="assignTeam(${r.id})" style="margin-left:4px">Assign</button>` : ''}
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
  if (s) data = data.filter(r => r.status === s);
  if (sv) data = data.filter(r => r.severity === sv);
  if (t) data = data.filter(r => r.type === t);
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
          <option>Flood</option>
          <option>Earthquake</option>
          <option>Urban Fire</option>
          <option>Landslide</option>
        </select>
      </div>

      <div class="form-group">
        <label>Severity</label>
        <select id="r-sev">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>

      <div class="form-group full">
        <label>Description</label>
        <textarea id="r-desc"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        citizen_name: document.getElementById('r-name').value,
        phone: document.getElementById('r-phone').value,
        location: document.getElementById('r-loc').value,
        disaster_type: document.getElementById('r-type').value,
        severity: document.getElementById('r-sev').value,
        description: document.getElementById('r-desc').value
      };

      try {
        const res = await fetch('http://localhost:3000/create-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Report stored in database');
          await loadData();
          renderPage(currentPage);
          renderPage('reports');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${t.location}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${t.members}</td>
            <td>
              ${t.status === 'Busy' || t.status === 'Completed' ? `<button class="btn btn-sm btn-success" onclick="releaseTeam(${t.id})">Release</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function releaseTeam(id) {
  const t = STATE.teams.find(t => t.id === id);

  openModal(`Release Team: ${t.name}`, `
        <p>Mark <strong>${t.name}</strong> as Available?</p>
    `, async () => {

    try {
      const res = await fetch('http://localhost:3000/release-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: id,
          released_by: 2
        })
      });

      const data = await res.json();

      if (data.ok) {
        toast(`${t.name} released via DB`);
        await loadData();
        renderPage(currentPage);
      } else {
        toast(data.error, 'error');
      }

    } catch (err) {
      toast('Server error', 'error');
      await loadData();
      renderPage(currentPage);
    }
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
      <button class="btn btn-primary btn-sm" onclick="showResourceRequest()">+ Request Resources</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Warehouse</th><th>Resource</th><th>Quantity</th><th>Unit</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.inventory.map(i => `<tr>
            <td>${i.id}</td>
            <td>${i.warehouse}</td>
            <td>${i.resource}</td>
            <td><strong>${i.qty.toLocaleString()}</strong></td>
            <td>${i.unit}</td>
            <td>${i.threshold}</td>
            <td><span class="badge ${i.status === 'Low Stock' ? 'badge-high' : 'badge-resolved'}">${i.status}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="updateInventory(${i.id})">Update</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function showResourceRequest() {
  openModal('Request Resource Allocation', `
    <div class="form-grid">
      <div class="form-group">
        <label>Incident Report #</label>
        <select id="rr-report">
          ${STATE.reports.filter(r => r.status != 'Resolved')
      .map(r => `<option value="${r.id}">#${r.id} - ${r.location}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Warehouse</label>
        <select id="rr-wh">
          <option>Islamabad Central</option>
          <option>Lahore Regional</option>
          <option>Karachi Supply Hub</option>
          <option>Peshawar Store</option>
        </select>
      </div>

      <div class="form-group">
        <label>Resource Type</label>
        <select id="rr-res">
          <option>Food Packages</option>
          <option>Drinking Water</option>
          <option>Medicines</option>
          <option>Shelter Tents</option>
          <option>Blankets</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quantity</label>
        <input id="rr-qty" type="number" min="1" value="100">
      </div>

      <div class="form-group full">
        <label>Notes</label>
        <textarea id="rr-notes"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        report_id: parseInt(document.getElementById('rr-report').value),
        warehouse: document.getElementById('rr-wh').value,
        resource_type: document.getElementById('rr-res').value,
        quantity: parseInt(document.getElementById('rr-qty').value),
        notes: document.getElementById('rr-notes').value,
        requested_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/request-resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Resource request stored in DB');
          await loadData();
          renderPage(currentPage);
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
function updateInventory(id) {
  const inv = STATE.inventory.find(i => i.id === id);

  openModal(`Update Inventory: ${inv.resource}`, `
        <div class="form-group">
            <label>New Quantity (${inv.unit})</label>
            <input id="inv-qty" type="number" value="${inv.qty}">
        </div>`,
    async () => {

      const newQty = parseInt(document.getElementById('inv-qty').value);

      try {
        const res = await fetch('http://localhost:3000/update-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: id,
            quantity: newQty,
            updated_by: 2
          })
        });

        const data = await res.json();

        if (data.ok) {
          toast('Inventory updated in database');
          await loadData();
          renderPage(currentPage);
          renderPage('inventory');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${h.total - h.available}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:#eee;border-radius:3px">
                  <div style="width:${h.occupancy}%;height:100%;background:${h.occupancy > 90 ? 'var(--accent)' : h.occupancy > 75 ? 'var(--warning)' : 'var(--success)'};border-radius:3px"></div>
                </div>
                ${h.occupancy}%
              </div>
            </td>
            <td><span class="badge ${h.status === 'Available' ? 'badge-resolved' : h.status === 'Critical' ? 'badge-critical' : 'badge-high'}">${h.status}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="admitPatient(${h.id})">Admit Patient</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function admitPatient(hospId) {
  const h = STATE.hospitals.find(h => h.id === hospId);

  openModal(`Admit Patient to ${h.name}`, `
    <div class="form-grid">
      <div class="form-group"><label>Patient Name</label><input id="p-name"></div>
      <div class="form-group"><label>Age</label><input id="p-age" type="number"></div>
      <div class="form-group"><label>Gender</label><select id="p-gender"><option>Male</option><option>Female</option></select></div>
      <div class="form-group"><label>Phone</label><input id="p-phone"></div>
      <div class="form-group"><label>Condition</label><select id="p-cond"><option>Stable</option><option>Critical</option></select></div>
    </div>`,
    async () => {

      const body = {
        hospital_id: hospId,
        patient_name: document.getElementById('p-name').value,
        age: parseInt(document.getElementById('p-age').value),
        gender: document.getElementById('p-gender').value,
        phone: document.getElementById('p-phone').value,
        condition: document.getElementById('p-cond').value,
        admitted_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/admit-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Patient admitted (DB updated)');
          await loadData();
          renderPage(currentPage);
          renderPage('hospitals');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
/* =====================================================
   PAGE: FINANCIALS
   ===================================================== */
function renderFinancials() {
  const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);

  return `
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-icon green">💰</div><div class="kpi-body"><div class="kpi-value">${(income / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Income (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon red">💸</div><div class="kpi-body"><div class="kpi-value">${(expense / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Expenses (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon blue">⚖️</div><div class="kpi-body"><div class="kpi-value">${((income - expense) / 1e6).toFixed(1)}M</div><div class="kpi-label">Net Balance (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏳</div><div class="kpi-body"><div class="kpi-value">${STATE.financials.filter(f => f.status === 'Pending').length}</div><div class="kpi-label">Pending Approvals</div></div></div>
  </div>
  <div class="charts-row">
    <div class="card" style="margin-bottom:0">
      <div class="card-header"><div class="card-title">Income vs Expense</div></div>
      <canvas id="chartFinBreak" height="200"></canvas>
    </div>
    <div class="card" style="margin-bottom:0">
      <div class="card-header">
        <div class="card-title">All Transactions</div>
        <button class="btn btn-primary btn-sm" onclick="addTransaction()">+ Add Transaction</button>
      </div>
      <div class="table-wrap" style="max-height:250px;overflow-y:auto">
        <table>
          <thead><tr><th>#</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${STATE.financials.map(f => `<tr>
              <td>${f.id}</td>
              <td>${f.category}</td>
              <td><strong>${formatCurrency(f.amount)}</strong></td>
              <td>${statusBadge(f.status)}</td>
              <td>${f.date}</td>
              <td>${f.status === 'Pending' && hasPermission('manage_financials') ? `<button class="btn btn-sm btn-success" onclick="approveTransaction(${f.id})">Approve</button>` : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function afterFinancials() {
  const ctx = document.getElementById('chartFinBreak');
  if (!ctx) return;
  const cats = [...new Set(STATE.financials.map(f => f.category))];
  const vals = cats.map(c => STATE.financials.filter(f => f.category === c).reduce((a, b) => a + b.amount, 0));
  new Chart(ctx, {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: vals, backgroundColor: ['#2a9d8f', '#457b9d', '#1a3a5c', '#e63946', '#f4a261', '#ffd166', '#e9c46a', '#a8dadc'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}
function approveTransaction(id) {
  openModal('Approve Transaction', `
        <p>Approve transaction #${id}?</p>
    `, async () => {

    try {
      const res = await fetch('http://localhost:3000/approve-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: id,
          approved_by: 2
        })
      });

      const data = await res.json();

      if (data.ok) {
        toast('Transaction approved via DB');
        await loadData();
        renderPage(currentPage);
        renderPage('financials');
      } else {
        toast(data.error, 'error');
      }

    } catch (err) {
      toast('Server error', 'error');
      await loadData();
      renderPage(currentPage);
    }
  });
}


function addTransaction() {
  openModal('Add Financial Transaction', `
    <div class="form-grid">
      <div class="form-group"><label>Category</label>
        <select id="t-cat">
          <option>Donation - Individual</option>
          <option>Donation - Corporate</option>
          <option>Resource Procurement</option>
          <option>Team Operations</option>
          <option>Medical Expenses</option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount (PKR)</label>
        <input id="t-amt" type="number" min="0">
      </div>
      <div class="form-group">
        <label>Donor/Payee</label>
        <input id="t-donor">
      </div>
      <div class="form-group">
        <label>Reference No</label>
        <input id="t-ref">
      </div>
      <div class="form-group full">
        <label>Description</label>
        <textarea id="t-desc"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        report_id: 1,
        category_id: 1,
        amount: parseFloat(document.getElementById('t-amt').value) || 0,
        description: document.getElementById('t-desc').value,
        reference_no: document.getElementById('t-ref').value,
        donor_name: document.getElementById('t-donor').value,
        recorded_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/record-finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast(`Transaction saved in DB (ID: ${data.new_transaction_id})`);
          renderPage('financials');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${a.desc}</td>
            <td>${a.requestedBy}</td>
            <td>${statusBadge(a.status)}</td>
            <td>${a.requestedAt}</td>
            <td>${a.decidedAt || '—'}</td>
            <td>
              ${a.status === 'Pending' && hasPermission('approve_workflows') ? `
                <button class="btn btn-sm btn-success" onclick="decideApproval(${a.id},'Approved')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="decideApproval(${a.id},'Rejected')" style="margin-left:4px">Reject</button>` :
      '—'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function decideApproval(id, decision) {
  if (decision !== 'Approved') {
    toast('Only approval flow is connected to backend');
    await loadData();
    renderPage(currentPage);
    return;
  }

  const res = await fetch('http://localhost:3000/approve-dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: id,
      approved_qty: 100,
      approver_id: 2
    })
  });

  const data = await res.json();

  if (data.ok) {
    toast('Approved via database transaction');
    await loadData();
    renderPage(currentPage);
  } else {
    toast(data.error, 'error');
  }
}

/* =====================================================
   PAGE: AUDIT LOGS
   ===================================================== */
function renderAudit() {
  return `
  <div class="card">
    <div class="card-header"><div class="card-title">System Audit Log</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>User</th><th>Action</th><th>Table</th><th>Performed At</th></tr></thead>
        <tbody>
          ${STATE.auditLogs.map(l => `<tr>
            <td>${l.id}</td>
            <td><strong>${l.user}</strong></td>
            <td>${l.action}</td>
            <td><code>${l.table}</code></td>
            <td>${l.at}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* =====================================================
   PAGE: USER MANAGEMENT (Admin only)
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
        <thead><tr><th>#</th><th>Username</th><th>Full Name</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.users.map(u => `
          <tr>
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.name}</td>
            <td><span class="badge badge-assigned">${u.role}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="toast('Edit user: ${u.name}','warning')">Edit</button>
            </td>
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

      const body = {
        username: document.getElementById('u-user').value,
        name: document.getElementById('u-name').value,
        email: document.getElementById('u-email').value,
        role: document.getElementById('u-role').value,
        password: document.getElementById('u-pass').value
      };

      try {
        const res = await fetch('http://localhost:3000/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('User created in DB');
          await loadData();
          renderPage(currentPage);
          renderPage('users');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
/* =====================================================
   SIDEBAR BUILDER
   ===================================================== */
function buildSidebar() {
  const u = getUser();
  const role = u.role;
  const allNav = [
    {
      group: 'Main', items: [
        { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
        { page: 'reports', icon: '🚨', label: 'Emergency Reports', badge: STATE.reports.filter(r => r.status === 'Pending').length },
      ]
    },
    {
      group: 'Operations', items: [
        { page: 'teams', icon: '🧑‍🚒', label: 'Rescue Teams', roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
        { page: 'inventory', icon: '📦', label: 'Inventory', roles: ['Administrator', 'EmergencyOperator', 'WarehouseManager'] },
        { page: 'hospitals', icon: '🏥', label: 'Hospitals', roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
      ]
    },
    {
      group: 'Finance', items: [
        { page: 'financials', icon: '💰', label: 'Financials', roles: ['Administrator', 'FinanceOfficer'] },
        { page: 'approvals', icon: '✅', label: 'Approvals', badge: STATE.approvals.filter(a => a.status === 'Pending').length },
      ]
    },
    {
      group: 'System', items: [
        { page: 'audit', icon: '📋', label: 'Audit Logs', roles: ['Administrator', 'EmergencyOperator'] },
        { page: 'users', icon: '👥', label: 'User Management', roles: ['Administrator'] },
      ]
    },
  ];

  let html = '';
  allNav.forEach(g => {
    const visibleItems = g.items.filter(i => !i.roles || i.roles.includes(role) || role === 'Administrator');
    if (!visibleItems.length) return;
    html += `<div class="nav-section-label">${g.group}</div>`;
    visibleItems.forEach(i => {
      html += `<div class="nav-item ${currentPage === i.page ? 'active' : ''}" data-page="${i.page}" onclick="navigate('${i.page}')">
        <span class="icon">${i.icon}</span> ${i.label}
        ${i.badge ? `<span class="badge">${i.badge}</span>` : ''}
      </div>`;
    });
  });
  return html;
}

/* =====================================================
   BOOTSTRAP
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
      { u: 'admin', p: 'admin123', r: 'Administrator' },
      { u: 'op_ahmed', p: 'ahmed123', r: 'Emergency Operator' },
      { u: 'field_ali', p: 'ali123', r: 'Field Officer' },
      { u: 'wm_tariq', p: 'tariq123', r: 'Warehouse Manager' },
      { u: 'fin_nadia', p: 'nadia123', r: 'Finance Officer' },
    ].map(d => `<button class="btn btn-outline" style="width:100%;margin-bottom:8px;justify-content:space-between" onclick="quickLogin('${d.u}','${d.p}')"><span>${d.r}</span><span style="font-size:11px;opacity:.7">${d.u}</span></button>`).join('')}
      <div style="text-align:center;margin:16px 0;color:var(--text-muted);font-size:12px">— or enter credentials manually —</div>
      <div class="form-group" style="margin-bottom:12px"><label>Username</label><input id="li-user" placeholder="username"></div>
      <div class="form-group" style="margin-bottom:20px"><label>Password</label><input id="li-pass" type="password" placeholder="password" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Login →</button>
      <div id="login-error" style="color:var(--accent);margin-top:12px;text-align:center;font-size:13px"></div>
    </div>
  </div>`;
}

function quickLogin(u, p) {
  const user = login(u, p);
  if (user) showApp();
}

function doLogin() {
  const u = document.getElementById('li-user').value;
  const p = document.getElementById('li-pass').value;
  const user = login(u, p);
  if (user) showApp();
  else document.getElementById('login-error').textContent = '❌ Invalid username or password';
}

function showApp() {
  const u = getUser();
  document.body.innerHTML = `
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">🆘</span>
        <div>Smart Disaster<br>Response MIS</div>
      </div>
      <div class="sidebar-nav" id="sidebar-nav">${buildSidebar()}</div>
      <div class="sidebar-footer">
        <div class="user-info">${u.name}</div>
        <div class="role-tag">${u.role}</div>
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

  (async () => {
    await loadData();
    navigate('dashboard');
  })();
}

// Start
const existing = getUser();
if (existing)
  showApp();
else
  showLogin();
async function approveDispatch() {
  const body = { request_id: 1, approved_qty: 10, approver_id: 2 };
  const res = await fetch('http://localhost:3000/approve-dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.ok ? 'Approved & Dispatched' : data.error);
}

async function assignTeam(reportId) {
  const teamId = 1; // or from dropdown

  const res = await fetch('http://localhost:3000/assign-team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_id: reportId,
      team_id: teamId,
      operator_id: 2
    })
  });

  const data = await res.json();

  if (data.ok) {
    toast('Team assigned via DB transaction');
    await loadData();
    renderPage(currentPage);
  } else {
    toast(data.error, 'error');
  }
}

async function recordFinance() {
  const body = {
    report_id: 1,
    category_id: 1,
    amount: 5000,
    description: 'Donation',
    reference_no: 'REF123',
    donor_name: 'Ali',
    recorded_by: 2
  };
  const res = await fetch('http://localhost:3000/record-finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.ok ? `Recorded (ID: ${data.new_transaction_id})` : data.error);
}

/* ---- Auth ---- */
function login(username, password) {
  const u = STATE.users.find(u => u.username === username && u.password === password);
  if (!u) return null;
  STATE.currentUser = u;
  sessionStorage.setItem('mis_user', JSON.stringify(u));
  return u;
}

function logout() {
  STATE.currentUser = null;
  sessionStorage.removeItem('mis_user');
  showLogin();
}

function getUser() {
  if (STATE.currentUser) return STATE.currentUser;
  const s = sessionStorage.getItem('mis_user');
  if (s) { STATE.currentUser = JSON.parse(s); return STATE.currentUser; }
  return null;
}

function hasPermission(perm) {
  const u = getUser();
  if (!u) return false;
  const perms = STATE.rolePermissions[u.role] || [];
  return perms.includes('all') || perms.includes(perm);
}

/* ---- Routing ---- */
//let currentPage = 'dashboard';
async function navigate(page) {
  currentPage = page;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  await loadData();   // 🔥 CRITICAL LINE

  renderPage(page);
}
/* ---- Severity / Status helpers ---- */
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
  return `<span class="badge ${m[s] || ''}">${s}</span>`;
}

function formatCurrency(n) {
  return 'PKR ' + Number(n).toLocaleString('en-PK');
}

/* ---- Toast ---- */
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `alert-strip ${type === 'error' ? 'danger' : type} toast`;
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;animation:fadeInUp .3s';
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---- Modal helper ---- */
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
      ${onConfirm ? '<div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end"><button class="btn btn-outline" id="mc2">Cancel</button><button class="btn btn-primary" id="mConfirm">Confirm</button></div>' : ''}
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#mc').onclick = () => backdrop.remove();
  if (onConfirm) {
    backdrop.querySelector('#mc2').onclick = () => backdrop.remove();
    backdrop.querySelector('#mConfirm').onclick = () => { onConfirm(); backdrop.remove(); };
  }
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

/* ---- Page renderer ---- */
function renderPage(page) {
  const area = document.getElementById('content-area');
  const titles =
  {
    dashboard: 'Dashboard Overview', reports: 'Emergency Reports', teams: 'Rescue Teams',
    inventory: 'Inventory Management', hospitals: 'Hospital Coordination',
    financials: 'Financial Management', approvals: 'Approval Workflows',
    audit: 'Audit & Monitoring', users: 'User Management', profile: 'My Profile'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  switch (page) {
    case 'dashboard': area.innerHTML = renderDashboard(); afterDashboard(); break;
    case 'reports': area.innerHTML = renderReports(); break;
    case 'teams': area.innerHTML = renderTeams(); break;
    case 'inventory': area.innerHTML = renderInventory(); break;
    case 'hospitals': area.innerHTML = renderHospitals(); break;
    case 'financials': area.innerHTML = renderFinancials(); afterFinancials(); break;
    case 'approvals': area.innerHTML = renderApprovals(); break;
    case 'audit': area.innerHTML = renderAudit(); break;
    case 'users': area.innerHTML = renderUsers(); break;
    default: area.innerHTML = '<p>Page not found</p>';
  }
}

/* =====================================================
   PAGE: DASHBOARD
   ===================================================== */
function renderDashboard() {
  const totalIncome = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const totalExpense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const pending = STATE.approvals.filter(a => a.status === 'Pending').length;

  return `
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon red">🚨</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.reports.filter(r => r.status != 'Resolved' && r.status != 'Closed').length}</div>
        <div class="kpi-label">Active Incidents</div>
        <div class="kpi-delta up">↑ 2 new today</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">🧑‍🚒</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.teams.filter(t => t.status === 'Available').length}</div>
        <div class="kpi-label">Teams Available</div>
        <div class="kpi-delta down">↓ 3 deployed</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon blue">🏥</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.hospitals.reduce((a, b) => a + b.available, 0)}</div>
        <div class="kpi-label">Hospital Beds Available</div>
        <div class="kpi-delta down">↓ 2 critical capacity</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon orange">📦</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.inventory.filter(i => i.status === 'Low Stock').length}</div>
        <div class="kpi-label">Low-Stock Alerts</div>
        <div class="kpi-delta down">⚠ Requires attention</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon purple">✅</div>
      <div class="kpi-body">
        <div class="kpi-value">${pending}</div>
        <div class="kpi-label">Pending Approvals</div>
        <div class="kpi-delta">Awaiting decision</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">💰</div>
      <div class="kpi-body">
        <div class="kpi-value">${((totalIncome - totalExpense) / 1000000).toFixed(1)}M</div>
        <div class="kpi-label">Net Balance (PKR)</div>
        <div class="kpi-delta up">↑ Funds available</div>
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
              <td>${r.location}</td>
              <td>${r.type}</td>
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
          📦 <strong>${i.resource}</strong> at ${i.warehouse} — Only ${i.qty} ${i.unit} remaining (threshold: ${i.threshold})
        </div>`).join('')}
      ${STATE.hospitals.filter(h => h.status === 'Critical' || h.status === 'Full').map(h => `
        <div class="alert-strip danger">
          🏥 <strong>${h.name}</strong> — Only ${h.available} beds available (${h.occupancy}% occupancy)
        </div>`).join('')}
    </div>
  </div>`;
}

function afterDashboard() {
  // Severity chart
  const ctx1 = document.getElementById('chartSeverity');
  if (ctx1) {
    const counts = ['Critical', 'High', 'Medium', 'Low'].map(s => STATE.reports.filter(r => r.severity === s).length);
    new Chart(ctx1,
      {
        type: 'doughnut',
        data: { labels: ['Critical', 'High', 'Medium', 'Low'], datasets: [{ data: counts, backgroundColor: ['#e63946', '#f4a261', '#ffd166', '#2a9d8f'] }] },
        options: { plugins: { legend: { position: 'right' } }, cutout: '60%' }
      });
  }
  // Finance chart
  const ctx2 = document.getElementById('chartFinance');
  if (ctx2) {
    const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
    const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
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
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => v + 'M' } } } }
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
      <button class="btn btn-primary btn-sm" onclick="showAddReport()">+ New Report</button>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <select id="fltStatus" class="form-group" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Statuses</option>
        <option>Pending</option><option>Assigned</option><option>InProgress</option><option>Resolved</option>
      </select>
      <select id="fltSeverity" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Severities</option>
        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
      </select>
      <select id="fltType" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Types</option>
        <option>Flood</option><option>Earthquake</option><option>Urban Fire</option><option>Landslide</option>
      </select>
    </div>
    <div class="table-wrap" id="reports-table-wrap">
      ${renderReportsTable(STATE.reports)}
    </div>
  </div>`;
}

function renderReportsTable(data) {
  return `<table>
    <thead><tr><th>#</th><th>Citizen</th><th>Location</th><th>Type</th><th>Severity</th><th>Status</th><th>Reported At</th><th>Assigned Team</th><th>Actions</th></tr></thead>
    <tbody>
      ${data.map(r => `<tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.citizen}<br><small style="color:var(--text-muted)">${r.phone}</small></td>
        <td>${r.location}</td>
        <td>${r.type}</td>
        <td>${severityBadge(r.severity)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${r.reportedAt}</td>
        <td>${r.team || '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewReport(${r.id})">View</button>
          ${r.status === 'Pending' && hasPermission('manage_teams') ? `<button class="btn btn-sm btn-primary" onclick="assignTeam(${r.id})" style="margin-left:4px">Assign</button>` : ''}
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
  if (s) data = data.filter(r => r.status === s);
  if (sv) data = data.filter(r => r.severity === sv);
  if (t) data = data.filter(r => r.type === t);
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
          <option>Flood</option>
          <option>Earthquake</option>
          <option>Urban Fire</option>
          <option>Landslide</option>
        </select>
      </div>

      <div class="form-group">
        <label>Severity</label>
        <select id="r-sev">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>

      <div class="form-group full">
        <label>Description</label>
        <textarea id="r-desc"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        citizen_name: document.getElementById('r-name').value,
        phone: document.getElementById('r-phone').value,
        location: document.getElementById('r-loc').value,
        disaster_type: document.getElementById('r-type').value,
        severity: document.getElementById('r-sev').value,
        description: document.getElementById('r-desc').value
      };

      try {
        const res = await fetch('http://localhost:3000/create-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Report stored in database');
          await loadData();
          renderPage(currentPage);
          renderPage('reports');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${t.location}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${t.members}</td>
            <td>
              ${t.status === 'Busy' || t.status === 'Completed' ? `<button class="btn btn-sm btn-success" onclick="releaseTeam(${t.id})">Release</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function releaseTeam(id) {
  const t = STATE.teams.find(t => t.id === id);

  openModal(`Release Team: ${t.name}`, `
        <p>Mark <strong>${t.name}</strong> as Available?</p>
    `, async () => {

    try {
      const res = await fetch('http://localhost:3000/release-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: id,
          released_by: 2
        })
      });

      const data = await res.json();

      if (data.ok) {
        toast(`${t.name} released via DB`);
        renderPage('teams');
      } else {
        toast(data.error, 'error');
      }

    } catch (err) {
      toast('Server error', 'error');
      await loadData();
      renderPage(currentPage);
    }
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
      <button class="btn btn-primary btn-sm" onclick="showResourceRequest()">+ Request Resources</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Warehouse</th><th>Resource</th><th>Quantity</th><th>Unit</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.inventory.map(i => `<tr>
            <td>${i.id}</td>
            <td>${i.warehouse}</td>
            <td>${i.resource}</td>
            <td><strong>${i.qty.toLocaleString()}</strong></td>
            <td>${i.unit}</td>
            <td>${i.threshold}</td>
            <td><span class="badge ${i.status === 'Low Stock' ? 'badge-high' : 'badge-resolved'}">${i.status}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="updateInventory(${i.id})">Update</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function showResourceRequest() {
  openModal('Request Resource Allocation', `
    <div class="form-grid">
      <div class="form-group">
        <label>Incident Report #</label>
        <select id="rr-report">
          ${STATE.reports.filter(r => r.status != 'Resolved')
      .map(r => `<option value="${r.id}">#${r.id} - ${r.location}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Warehouse</label>
        <select id="rr-wh">
          <option>Islamabad Central</option>
          <option>Lahore Regional</option>
          <option>Karachi Supply Hub</option>
          <option>Peshawar Store</option>
        </select>
      </div>

      <div class="form-group">
        <label>Resource Type</label>
        <select id="rr-res">
          <option>Food Packages</option>
          <option>Drinking Water</option>
          <option>Medicines</option>
          <option>Shelter Tents</option>
          <option>Blankets</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quantity</label>
        <input id="rr-qty" type="number" min="1" value="100">
      </div>

      <div class="form-group full">
        <label>Notes</label>
        <textarea id="rr-notes"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        report_id: parseInt(document.getElementById('rr-report').value),
        warehouse: document.getElementById('rr-wh').value,
        resource_type: document.getElementById('rr-res').value,
        quantity: parseInt(document.getElementById('rr-qty').value),
        notes: document.getElementById('rr-notes').value,
        requested_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/request-resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Resource request stored in DB');
          await loadData();
          renderPage(currentPage);
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
function updateInventory(id) {
  const inv = STATE.inventory.find(i => i.id === id);

  openModal(`Update Inventory: ${inv.resource}`, `
        <div class="form-group">
            <label>New Quantity (${inv.unit})</label>
            <input id="inv-qty" type="number" value="${inv.qty}">
        </div>`,
    async () => {

      const newQty = parseInt(document.getElementById('inv-qty').value);

      try {
        const res = await fetch('http://localhost:3000/update-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: id,
            quantity: newQty,
            updated_by: 2
          })
        });

        const data = await res.json();

        if (data.ok) {
          toast('Inventory updated in database');
          await loadData();
          renderPage(currentPage);
          renderPage('inventory');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${h.total - h.available}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:#eee;border-radius:3px">
                  <div style="width:${h.occupancy}%;height:100%;background:${h.occupancy > 90 ? 'var(--accent)' : h.occupancy > 75 ? 'var(--warning)' : 'var(--success)'};border-radius:3px"></div>
                </div>
                ${h.occupancy}%
              </div>
            </td>
            <td><span class="badge ${h.status === 'Available' ? 'badge-resolved' : h.status === 'Critical' ? 'badge-critical' : 'badge-high'}">${h.status}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="admitPatient(${h.id})">Admit Patient</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function admitPatient(hospId) {
  const h = STATE.hospitals.find(h => h.id === hospId);

  openModal(`Admit Patient to ${h.name}`, `
    <div class="form-grid">
      <div class="form-group"><label>Patient Name</label><input id="p-name"></div>
      <div class="form-group"><label>Age</label><input id="p-age" type="number"></div>
      <div class="form-group"><label>Gender</label><select id="p-gender"><option>Male</option><option>Female</option></select></div>
      <div class="form-group"><label>Phone</label><input id="p-phone"></div>
      <div class="form-group"><label>Condition</label><select id="p-cond"><option>Stable</option><option>Critical</option></select></div>
    </div>`,
    async () => {

      const body = {
        hospital_id: hospId,
        patient_name: document.getElementById('p-name').value,
        age: parseInt(document.getElementById('p-age').value),
        gender: document.getElementById('p-gender').value,
        phone: document.getElementById('p-phone').value,
        condition: document.getElementById('p-cond').value,
        admitted_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/admit-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Patient admitted (DB updated)');
          await loadData();
          renderPage(currentPage);
          renderPage('hospitals');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
/* =====================================================
   PAGE: FINANCIALS
   ===================================================== */
function renderFinancials() {
  const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);

  return `
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-icon green">💰</div><div class="kpi-body"><div class="kpi-value">${(income / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Income (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon red">💸</div><div class="kpi-body"><div class="kpi-value">${(expense / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Expenses (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon blue">⚖️</div><div class="kpi-body"><div class="kpi-value">${((income - expense) / 1e6).toFixed(1)}M</div><div class="kpi-label">Net Balance (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏳</div><div class="kpi-body"><div class="kpi-value">${STATE.financials.filter(f => f.status === 'Pending').length}</div><div class="kpi-label">Pending Approvals</div></div></div>
  </div>
  <div class="charts-row">
    <div class="card" style="margin-bottom:0">
      <div class="card-header"><div class="card-title">Income vs Expense</div></div>
      <canvas id="chartFinBreak" height="200"></canvas>
    </div>
    <div class="card" style="margin-bottom:0">
      <div class="card-header">
        <div class="card-title">All Transactions</div>
        <button class="btn btn-primary btn-sm" onclick="addTransaction()">+ Add Transaction</button>
      </div>
      <div class="table-wrap" style="max-height:250px;overflow-y:auto">
        <table>
          <thead><tr><th>#</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${STATE.financials.map(f => `<tr>
              <td>${f.id}</td>
              <td>${f.category}</td>
              <td><strong>${formatCurrency(f.amount)}</strong></td>
              <td>${statusBadge(f.status)}</td>
              <td>${f.date}</td>
              <td>${f.status === 'Pending' && hasPermission('manage_financials') ? `<button class="btn btn-sm btn-success" onclick="approveTransaction(${f.id})">Approve</button>` : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function afterFinancials() {
  const ctx = document.getElementById('chartFinBreak');
  if (!ctx) return;
  const cats = [...new Set(STATE.financials.map(f => f.category))];
  const vals = cats.map(c => STATE.financials.filter(f => f.category === c).reduce((a, b) => a + b.amount, 0));
  new Chart(ctx, {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: vals, backgroundColor: ['#2a9d8f', '#457b9d', '#1a3a5c', '#e63946', '#f4a261', '#ffd166', '#e9c46a', '#a8dadc'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}
function approveTransaction(id) {
  openModal('Approve Transaction', `
        <p>Approve transaction #${id}?</p>
    `, async () => {

    try {
      const res = await fetch('http://localhost:3000/approve-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: id,
          approved_by: 2
        })
      });

      const data = await res.json();

      if (data.ok) {
        toast('Transaction approved via DB');
        await loadData();
        renderPage(currentPage);
        renderPage('financials');
      } else {
        toast(data.error, 'error');
      }

    } catch (err) {
      toast('Server error', 'error');
      await loadData();
      renderPage(currentPage);
    }
  });
}


function addTransaction() {
  openModal('Add Financial Transaction', `
    <div class="form-grid">
      <div class="form-group"><label>Category</label>
        <select id="t-cat">
          <option>Donation - Individual</option>
          <option>Donation - Corporate</option>
          <option>Resource Procurement</option>
          <option>Team Operations</option>
          <option>Medical Expenses</option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount (PKR)</label>
        <input id="t-amt" type="number" min="0">
      </div>
      <div class="form-group">
        <label>Donor/Payee</label>
        <input id="t-donor">
      </div>
      <div class="form-group">
        <label>Reference No</label>
        <input id="t-ref">
      </div>
      <div class="form-group full">
        <label>Description</label>
        <textarea id="t-desc"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        report_id: 1,
        category_id: 1,
        amount: parseFloat(document.getElementById('t-amt').value) || 0,
        description: document.getElementById('t-desc').value,
        reference_no: document.getElementById('t-ref').value,
        donor_name: document.getElementById('t-donor').value,
        recorded_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/record-finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast(`Transaction saved in DB (ID: ${data.new_transaction_id})`);
          renderPage('financials');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${a.desc}</td>
            <td>${a.requestedBy}</td>
            <td>${statusBadge(a.status)}</td>
            <td>${a.requestedAt}</td>
            <td>${a.decidedAt || '—'}</td>
            <td>
              ${a.status === 'Pending' && hasPermission('approve_workflows') ? `
                <button class="btn btn-sm btn-success" onclick="decideApproval(${a.id},'Approved')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="decideApproval(${a.id},'Rejected')" style="margin-left:4px">Reject</button>` :
      '—'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function decideApproval(id, decision) {
  if (decision !== 'Approved') {
    toast('Only approval flow is connected to backend');
    await loadData();
    renderPage(currentPage);
    return;
  }

  const res = await fetch('http://localhost:3000/approve-dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: id,
      approved_qty: 100,
      approver_id: 2
    })
  });

  const data = await res.json();

  if (data.ok) {
    toast('Approved via database transaction');
    await loadData();
    renderPage(currentPage);
  } else {
    toast(data.error, 'error');
  }
}

/* =====================================================
   PAGE: AUDIT LOGS
   ===================================================== */
function renderAudit() {
  return `
  <div class="card">
    <div class="card-header"><div class="card-title">System Audit Log</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>User</th><th>Action</th><th>Table</th><th>Performed At</th></tr></thead>
        <tbody>
          ${STATE.auditLogs.map(l => `<tr>
            <td>${l.id}</td>
            <td><strong>${l.user}</strong></td>
            <td>${l.action}</td>
            <td><code>${l.table}</code></td>
            <td>${l.at}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* =====================================================
   PAGE: USER MANAGEMENT (Admin only)
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
        <thead><tr><th>#</th><th>Username</th><th>Full Name</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.users.map(u => `<tr>
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.name}</td>
            <td><span class="badge badge-assigned">${u.role}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="toast('Edit user: ${u.name}','warning')">Edit</button></td>
            await loadData();
renderPage(currentPage);
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

      const body = {
        username: document.getElementById('u-user').value,
        name: document.getElementById('u-name').value,
        email: document.getElementById('u-email').value,
        role: document.getElementById('u-role').value,
        password: document.getElementById('u-pass').value
      };

      try {
        const res = await fetch('http://localhost:3000/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('User created in DB');
          await loadData();
          renderPage(currentPage);
          renderPage('users');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
/* =====================================================
   SIDEBAR BUILDER
   ===================================================== */
function buildSidebar() {
  const u = getUser();
  const role = u.role;
  const allNav = [
    {
      group: 'Main', items: [
        { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
        { page: 'reports', icon: '🚨', label: 'Emergency Reports', badge: STATE.reports.filter(r => r.status === 'Pending').length },
      ]
    },
    {
      group: 'Operations', items: [
        { page: 'teams', icon: '🧑‍🚒', label: 'Rescue Teams', roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
        { page: 'inventory', icon: '📦', label: 'Inventory', roles: ['Administrator', 'EmergencyOperator', 'WarehouseManager'] },
        { page: 'hospitals', icon: '🏥', label: 'Hospitals', roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
      ]
    },
    {
      group: 'Finance', items: [
        { page: 'financials', icon: '💰', label: 'Financials', roles: ['Administrator', 'FinanceOfficer'] },
        { page: 'approvals', icon: '✅', label: 'Approvals', badge: STATE.approvals.filter(a => a.status === 'Pending').length },
      ]
    },
    {
      group: 'System', items: [
        { page: 'audit', icon: '📋', label: 'Audit Logs', roles: ['Administrator', 'EmergencyOperator'] },
        { page: 'users', icon: '👥', label: 'User Management', roles: ['Administrator'] },
      ]
    },
  ];

  let html = '';
  allNav.forEach(g => {
    const visibleItems = g.items.filter(i => !i.roles || i.roles.includes(role) || role === 'Administrator');
    if (!visibleItems.length) return;
    html += `<div class="nav-section-label">${g.group}</div>`;
    visibleItems.forEach(i => {
      html += `<div class="nav-item ${currentPage === i.page ? 'active' : ''}" data-page="${i.page}" onclick="navigate('${i.page}')">
        <span class="icon">${i.icon}</span> ${i.label}
        ${i.badge ? `<span class="badge">${i.badge}</span>` : ''}
      </div>`;
    });
  });
  return html;
}

/* =====================================================
   BOOTSTRAP
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
      { u: 'admin', p: 'admin123', r: 'Administrator' },
      { u: 'op_ahmed', p: 'ahmed123', r: 'Emergency Operator' },
      { u: 'field_ali', p: 'ali123', r: 'Field Officer' },
      { u: 'wm_tariq', p: 'tariq123', r: 'Warehouse Manager' },
      { u: 'fin_nadia', p: 'nadia123', r: 'Finance Officer' },
    ].map(d => `<button class="btn btn-outline" style="width:100%;margin-bottom:8px;justify-content:space-between" onclick="quickLogin('${d.u}','${d.p}')"><span>${d.r}</span><span style="font-size:11px;opacity:.7">${d.u}</span></button>`).join('')}
      <div style="text-align:center;margin:16px 0;color:var(--text-muted);font-size:12px">— or enter credentials manually —</div>
      <div class="form-group" style="margin-bottom:12px"><label>Username</label><input id="li-user" placeholder="username"></div>
      <div class="form-group" style="margin-bottom:20px"><label>Password</label><input id="li-pass" type="password" placeholder="password" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Login →</button>
      <div id="login-error" style="color:var(--accent);margin-top:12px;text-align:center;font-size:13px"></div>
    </div>
  </div>`;
}

function quickLogin(u, p) {
  const user = login(u, p);
  if (user) showApp();
}

function doLogin() {
  const u = document.getElementById('li-user').value;
  const p = document.getElementById('li-pass').value;
  const user = login(u, p);
  if (user) showApp();
  else document.getElementById('login-error').textContent = '❌ Invalid username or password';
}

function showApp() {
  const u = getUser();
  document.body.innerHTML = `
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">🆘</span>
        <div>Smart Disaster<br>Response MIS</div>
      </div>
      <div class="sidebar-nav" id="sidebar-nav">${buildSidebar()}</div>
      <div class="sidebar-footer">
        <div class="user-info">${u.name}</div>
        <div class="role-tag">${u.role}</div>
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

// Start
// const existing = getUser();
if (existing)
  showApp();
else
  showLogin();
async function approveDispatch() {
  const body = { request_id: 1, approved_qty: 10, approver_id: 2 };
  const res = await fetch('http://localhost:3000/approve-dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.ok ? 'Approved & Dispatched' : data.error);
}

async function assignTeam(reportId) {
  const teamId = 1; // or from dropdown

  const res = await fetch('http://localhost:3000/assign-team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      report_id: reportId,
      team_id: teamId,
      operator_id: 2
    })
  });

  const data = await res.json();

  if (data.ok) {
    toast('Team assigned via DB transaction');
    await loadData();
    renderPage(currentPage);
  } else {
    toast(data.error, 'error');
  }
}

async function recordFinance() {
  const body = {
    report_id: 1,
    category_id: 1,
    amount: 5000,
    description: 'Donation',
    reference_no: 'REF123',
    donor_name: 'Ali',
    recorded_by: 2
  };
  const res = await fetch('http://localhost:3000/record-finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.ok ? `Recorded (ID: ${data.new_transaction_id})` : data.error);
}

/* ---- Auth ---- */
function login(username, password) {
  const u = STATE.users.find(u => u.username === username && u.password === password);
  if (!u) return null;
  STATE.currentUser = u;
  sessionStorage.setItem('mis_user', JSON.stringify(u));
  return u;
}

function logout() {
  STATE.currentUser = null;
  sessionStorage.removeItem('mis_user');
  showLogin();
}

function getUser() {
  if (STATE.currentUser) return STATE.currentUser;
  const s = sessionStorage.getItem('mis_user');
  if (s) { STATE.currentUser = JSON.parse(s); return STATE.currentUser; }
  return null;
}

function hasPermission(perm) {
  const u = getUser();
  if (!u) return false;
  const perms = STATE.rolePermissions[u.role] || [];
  return perms.includes('all') || perms.includes(perm);
}

/* ---- Routing ---- */
// let currentPage = 'dashboard';
async function navigate(page) {
  currentPage = page;

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  await loadData();   // 🔥 CRITICAL LINE

  renderPage(page);
}
/* ---- Severity / Status helpers ---- */
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
  return `<span class="badge ${m[s] || ''}">${s}</span>`;
}

function formatCurrency(n) {
  return 'PKR ' + Number(n).toLocaleString('en-PK');
}

/* ---- Toast ---- */
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `alert-strip ${type === 'error' ? 'danger' : type} toast`;
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;min-width:280px;animation:fadeInUp .3s';
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---- Modal helper ---- */
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
      ${onConfirm ? '<div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end"><button class="btn btn-outline" id="mc2">Cancel</button><button class="btn btn-primary" id="mConfirm">Confirm</button></div>' : ''}
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.querySelector('#mc').onclick = () => backdrop.remove();
  if (onConfirm) {
    backdrop.querySelector('#mc2').onclick = () => backdrop.remove();
    backdrop.querySelector('#mConfirm').onclick = () => { onConfirm(); backdrop.remove(); };
  }
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
}

/* ---- Page renderer ---- */
function renderPage(page) {
  const area = document.getElementById('content-area');
  const titles =
  {
    dashboard: 'Dashboard Overview', reports: 'Emergency Reports', teams: 'Rescue Teams',
    inventory: 'Inventory Management', hospitals: 'Hospital Coordination',
    financials: 'Financial Management', approvals: 'Approval Workflows',
    audit: 'Audit & Monitoring', users: 'User Management', profile: 'My Profile'
  };
  document.getElementById('page-title').textContent = titles[page] || page;

  switch (page) {
    case 'dashboard': area.innerHTML = renderDashboard(); afterDashboard(); break;
    case 'reports': area.innerHTML = renderReports(); break;
    case 'teams': area.innerHTML = renderTeams(); break;
    case 'inventory': area.innerHTML = renderInventory(); break;
    case 'hospitals': area.innerHTML = renderHospitals(); break;
    case 'financials': area.innerHTML = renderFinancials(); afterFinancials(); break;
    case 'approvals': area.innerHTML = renderApprovals(); break;
    case 'audit': area.innerHTML = renderAudit(); break;
    case 'users': area.innerHTML = renderUsers(); break;
    default: area.innerHTML = '<p>Page not found</p>';
  }
}

/* =====================================================
   PAGE: DASHBOARD
   ===================================================== */
function renderDashboard() {
  const totalIncome = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const totalExpense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const pending = STATE.approvals.filter(a => a.status === 'Pending').length;

  return `
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon red">🚨</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.reports.filter(r => r.status != 'Resolved' && r.status != 'Closed').length}</div>
        <div class="kpi-label">Active Incidents</div>
        <div class="kpi-delta up">↑ 2 new today</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">🧑‍🚒</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.teams.filter(t => t.status === 'Available').length}</div>
        <div class="kpi-label">Teams Available</div>
        <div class="kpi-delta down">↓ 3 deployed</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon blue">🏥</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.hospitals.reduce((a, b) => a + b.available, 0)}</div>
        <div class="kpi-label">Hospital Beds Available</div>
        <div class="kpi-delta down">↓ 2 critical capacity</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon orange">📦</div>
      <div class="kpi-body">
        <div class="kpi-value">${STATE.inventory.filter(i => i.status === 'Low Stock').length}</div>
        <div class="kpi-label">Low-Stock Alerts</div>
        <div class="kpi-delta down">⚠ Requires attention</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon purple">✅</div>
      <div class="kpi-body">
        <div class="kpi-value">${pending}</div>
        <div class="kpi-label">Pending Approvals</div>
        <div class="kpi-delta">Awaiting decision</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">💰</div>
      <div class="kpi-body">
        <div class="kpi-value">${((totalIncome - totalExpense) / 1000000).toFixed(1)}M</div>
        <div class="kpi-label">Net Balance (PKR)</div>
        <div class="kpi-delta up">↑ Funds available</div>
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
              <td>${r.location}</td>
              <td>${r.type}</td>
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
          📦 <strong>${i.resource}</strong> at ${i.warehouse} — Only ${i.qty} ${i.unit} remaining (threshold: ${i.threshold})
        </div>`).join('')}
      ${STATE.hospitals.filter(h => h.status === 'Critical' || h.status === 'Full').map(h => `
        <div class="alert-strip danger">
          🏥 <strong>${h.name}</strong> — Only ${h.available} beds available (${h.occupancy}% occupancy)
        </div>`).join('')}
    </div>
  </div>`;
}

function afterDashboard() {
  // Severity chart
  const ctx1 = document.getElementById('chartSeverity');
  if (ctx1) {
    const counts = ['Critical', 'High', 'Medium', 'Low'].map(s => STATE.reports.filter(r => r.severity === s).length);
    new Chart(ctx1,
      {
        type: 'doughnut',
        data: { labels: ['Critical', 'High', 'Medium', 'Low'], datasets: [{ data: counts, backgroundColor: ['#e63946', '#f4a261', '#ffd166', '#2a9d8f'] }] },
        options: { plugins: { legend: { position: 'right' } }, cutout: '60%' }
      });
  }
  // Finance chart
  const ctx2 = document.getElementById('chartFinance');
  if (ctx2) {
    const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
    const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
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
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => v + 'M' } } } }
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
      <button class="btn btn-primary btn-sm" onclick="showAddReport()">+ New Report</button>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <select id="fltStatus" class="form-group" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Statuses</option>
        <option>Pending</option><option>Assigned</option><option>InProgress</option><option>Resolved</option>
      </select>
      <select id="fltSeverity" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Severities</option>
        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
      </select>
      <select id="fltType" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13px" onchange="filterReports()">
        <option value="">All Types</option>
        <option>Flood</option><option>Earthquake</option><option>Urban Fire</option><option>Landslide</option>
      </select>
    </div>
    <div class="table-wrap" id="reports-table-wrap">
      ${renderReportsTable(STATE.reports)}
    </div>
  </div>`;
}

function renderReportsTable(data) {
  return `<table>
    <thead><tr><th>#</th><th>Citizen</th><th>Location</th><th>Type</th><th>Severity</th><th>Status</th><th>Reported At</th><th>Assigned Team</th><th>Actions</th></tr></thead>
    <tbody>
      ${data.map(r => `<tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.citizen}<br><small style="color:var(--text-muted)">${r.phone}</small></td>
        <td>${r.location}</td>
        <td>${r.type}</td>
        <td>${severityBadge(r.severity)}</td>
        <td>${statusBadge(r.status)}</td>
        <td>${r.reportedAt}</td>
        <td>${r.team || '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewReport(${r.id})">View</button>
          ${r.status === 'Pending' && hasPermission('manage_teams') ? `<button class="btn btn-sm btn-primary" onclick="assignTeam(${r.id})" style="margin-left:4px">Assign</button>` : ''}
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
  if (s) data = data.filter(r => r.status === s);
  if (sv) data = data.filter(r => r.severity === sv);
  if (t) data = data.filter(r => r.type === t);
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
          <option>Flood</option>
          <option>Earthquake</option>
          <option>Urban Fire</option>
          <option>Landslide</option>
        </select>
      </div>

      <div class="form-group">
        <label>Severity</label>
        <select id="r-sev">
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>
      </div>

      <div class="form-group full">
        <label>Description</label>
        <textarea id="r-desc"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        citizen_name: document.getElementById('r-name').value,
        phone: document.getElementById('r-phone').value,
        location: document.getElementById('r-loc').value,
        disaster_type: document.getElementById('r-type').value,
        severity: document.getElementById('r-sev').value,
        description: document.getElementById('r-desc').value
      };

      try {
        const res = await fetch('http://localhost:3000/create-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Report stored in database');
          await loadData();
          renderPage(currentPage);
          renderPage('reports');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${t.location}</td>
            <td>${statusBadge(t.status)}</td>
            <td>${t.members}</td>
            <td>
              ${t.status === 'Busy' || t.status === 'Completed' ? `<button class="btn btn-sm btn-success" onclick="releaseTeam(${t.id})">Release</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function releaseTeam(id) {
  const t = STATE.teams.find(t => t.id === id);

  openModal(`Release Team: ${t.name}`, `
        <p>Mark <strong>${t.name}</strong> as Available?</p>
    `, async () => {

    try {
      const res = await fetch('http://localhost:3000/release-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: id,
          released_by: 2
        })
      });

      const data = await res.json();

      if (data.ok) {
        toast(`${t.name} released via DB`);
        renderPage('teams');
      } else {
        toast(data.error, 'error');
      }

    } catch (err) {
      toast('Server error', 'error');
      await loadData();
      renderPage(currentPage);
    }
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
      <button class="btn btn-primary btn-sm" onclick="showResourceRequest()">+ Request Resources</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Warehouse</th><th>Resource</th><th>Quantity</th><th>Unit</th><th>Threshold</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.inventory.map(i => `<tr>
            <td>${i.id}</td>
            <td>${i.warehouse}</td>
            <td>${i.resource}</td>
            <td><strong>${i.qty.toLocaleString()}</strong></td>
            <td>${i.unit}</td>
            <td>${i.threshold}</td>
            <td><span class="badge ${i.status === 'Low Stock' ? 'badge-high' : 'badge-resolved'}">${i.status}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="updateInventory(${i.id})">Update</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function showResourceRequest() {
  openModal('Request Resource Allocation', `
    <div class="form-grid">
      <div class="form-group">
        <label>Incident Report #</label>
        <select id="rr-report">
          ${STATE.reports.filter(r => r.status != 'Resolved')
      .map(r => `<option value="${r.id}">#${r.id} - ${r.location}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Warehouse</label>
        <select id="rr-wh">
          <option>Islamabad Central</option>
          <option>Lahore Regional</option>
          <option>Karachi Supply Hub</option>
          <option>Peshawar Store</option>
        </select>
      </div>

      <div class="form-group">
        <label>Resource Type</label>
        <select id="rr-res">
          <option>Food Packages</option>
          <option>Drinking Water</option>
          <option>Medicines</option>
          <option>Shelter Tents</option>
          <option>Blankets</option>
        </select>
      </div>

      <div class="form-group">
        <label>Quantity</label>
        <input id="rr-qty" type="number" min="1" value="100">
      </div>

      <div class="form-group full">
        <label>Notes</label>
        <textarea id="rr-notes"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        report_id: parseInt(document.getElementById('rr-report').value),
        warehouse: document.getElementById('rr-wh').value,
        resource_type: document.getElementById('rr-res').value,
        quantity: parseInt(document.getElementById('rr-qty').value),
        notes: document.getElementById('rr-notes').value,
        requested_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/request-resource', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Resource request stored in DB');
          await loadData();
          renderPage(currentPage);
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
function updateInventory(id) {
  const inv = STATE.inventory.find(i => i.id === id);

  openModal(`Update Inventory: ${inv.resource}`, `
        <div class="form-group">
            <label>New Quantity (${inv.unit})</label>
            <input id="inv-qty" type="number" value="${inv.qty}">
        </div>`,
    async () => {

      const newQty = parseInt(document.getElementById('inv-qty').value);

      try {
        const res = await fetch('http://localhost:3000/update-inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_id: id,
            quantity: newQty,
            updated_by: 2
          })
        });

        const data = await res.json();

        if (data.ok) {
          toast('Inventory updated in database');
          await loadData();
          renderPage(currentPage);
          renderPage('inventory');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${h.total - h.available}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:#eee;border-radius:3px">
                  <div style="width:${h.occupancy}%;height:100%;background:${h.occupancy > 90 ? 'var(--accent)' : h.occupancy > 75 ? 'var(--warning)' : 'var(--success)'};border-radius:3px"></div>
                </div>
                ${h.occupancy}%
              </div>
            </td>
            <td><span class="badge ${h.status === 'Available' ? 'badge-resolved' : h.status === 'Critical' ? 'badge-critical' : 'badge-high'}">${h.status}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="admitPatient(${h.id})">Admit Patient</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function admitPatient(hospId) {
  const h = STATE.hospitals.find(h => h.id === hospId);

  openModal(`Admit Patient to ${h.name}`, `
    <div class="form-grid">
      <div class="form-group"><label>Patient Name</label><input id="p-name"></div>
      <div class="form-group"><label>Age</label><input id="p-age" type="number"></div>
      <div class="form-group"><label>Gender</label><select id="p-gender"><option>Male</option><option>Female</option></select></div>
      <div class="form-group"><label>Phone</label><input id="p-phone"></div>
      <div class="form-group"><label>Condition</label><select id="p-cond"><option>Stable</option><option>Critical</option></select></div>
    </div>`,
    async () => {

      const body = {
        hospital_id: hospId,
        patient_name: document.getElementById('p-name').value,
        age: parseInt(document.getElementById('p-age').value),
        gender: document.getElementById('p-gender').value,
        phone: document.getElementById('p-phone').value,
        condition: document.getElementById('p-cond').value,
        admitted_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/admit-patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('Patient admitted (DB updated)');
          await loadData();
          renderPage(currentPage);
          renderPage('hospitals');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
/* =====================================================
   PAGE: FINANCIALS
   ===================================================== */
function renderFinancials() {
  const income = STATE.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const expense = STATE.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);

  return `
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-icon green">💰</div><div class="kpi-body"><div class="kpi-value">${(income / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Income (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon red">💸</div><div class="kpi-body"><div class="kpi-value">${(expense / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Expenses (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon blue">⚖️</div><div class="kpi-body"><div class="kpi-value">${((income - expense) / 1e6).toFixed(1)}M</div><div class="kpi-label">Net Balance (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏳</div><div class="kpi-body"><div class="kpi-value">${STATE.financials.filter(f => f.status === 'Pending').length}</div><div class="kpi-label">Pending Approvals</div></div></div>
  </div>
  <div class="charts-row">
    <div class="card" style="margin-bottom:0">
      <div class="card-header"><div class="card-title">Income vs Expense</div></div>
      <canvas id="chartFinBreak" height="200"></canvas>
    </div>
    <div class="card" style="margin-bottom:0">
      <div class="card-header">
        <div class="card-title">All Transactions</div>
        <button class="btn btn-primary btn-sm" onclick="addTransaction()">+ Add Transaction</button>
      </div>
      <div class="table-wrap" style="max-height:250px;overflow-y:auto">
        <table>
          <thead><tr><th>#</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            ${STATE.financials.map(f => `<tr>
              <td>${f.id}</td>
              <td>${f.category}</td>
              <td><strong>${formatCurrency(f.amount)}</strong></td>
              <td>${statusBadge(f.status)}</td>
              <td>${f.date}</td>
              <td>${f.status === 'Pending' && hasPermission('manage_financials') ? `<button class="btn btn-sm btn-success" onclick="approveTransaction(${f.id})">Approve</button>` : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function afterFinancials() {
  const ctx = document.getElementById('chartFinBreak');
  if (!ctx) return;
  const cats = [...new Set(STATE.financials.map(f => f.category))];
  const vals = cats.map(c => STATE.financials.filter(f => f.category === c).reduce((a, b) => a + b.amount, 0));
  new Chart(ctx, {
    type: 'pie',
    data: { labels: cats, datasets: [{ data: vals, backgroundColor: ['#2a9d8f', '#457b9d', '#1a3a5c', '#e63946', '#f4a261', '#ffd166', '#e9c46a', '#a8dadc'] }] },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}
function approveTransaction(id) {
  openModal('Approve Transaction', `
        <p>Approve transaction #${id}?</p>
    `, async () => {

    try {
      const res = await fetch('http://localhost:3000/approve-finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: id,
          approved_by: 2
        })
      });

      const data = await res.json();

      if (data.ok) {
        toast('Transaction approved via DB');
        await loadData();
        renderPage(currentPage);
        renderPage('financials');
      } else {
        toast(data.error, 'error');
      }

    } catch (err) {
      toast('Server error', 'error');
      await loadData();
      renderPage(currentPage);
    }
  });
}


function addTransaction() {
  openModal('Add Financial Transaction', `
    <div class="form-grid">
      <div class="form-group"><label>Category</label>
        <select id="t-cat">
          <option>Donation - Individual</option>
          <option>Donation - Corporate</option>
          <option>Resource Procurement</option>
          <option>Team Operations</option>
          <option>Medical Expenses</option>
        </select>
      </div>
      <div class="form-group">
        <label>Amount (PKR)</label>
        <input id="t-amt" type="number" min="0">
      </div>
      <div class="form-group">
        <label>Donor/Payee</label>
        <input id="t-donor">
      </div>
      <div class="form-group">
        <label>Reference No</label>
        <input id="t-ref">
      </div>
      <div class="form-group full">
        <label>Description</label>
        <textarea id="t-desc"></textarea>
      </div>
    </div>`,
    async () => {

      const body = {
        report_id: 1,
        category_id: 1,
        amount: parseFloat(document.getElementById('t-amt').value) || 0,
        description: document.getElementById('t-desc').value,
        reference_no: document.getElementById('t-ref').value,
        donor_name: document.getElementById('t-donor').value,
        recorded_by: 2
      };

      try {
        const res = await fetch('http://localhost:3000/record-finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast(`Transaction saved in DB (ID: ${data.new_transaction_id})`);
          await loadData();
          renderPage(currentPage);
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
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
            <td>${a.desc}</td>
            <td>${a.requestedBy}</td>
            <td>${statusBadge(a.status)}</td>
            <td>${a.requestedAt}</td>
            <td>${a.decidedAt || '—'}</td>
            <td>
              ${a.status === 'Pending' && hasPermission('approve_workflows') ? `
                <button class="btn btn-sm btn-success" onclick="decideApproval(${a.id},'Approved')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="decideApproval(${a.id},'Rejected')" style="margin-left:4px">Reject</button>` :
      '—'}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

async function decideApproval(id, decision) {
  if (decision !== 'Approved') {
    toast('Only approval flow is connected to backend');
    await loadData();
    renderPage(currentPage);
    return;
  }

  const res = await fetch('http://localhost:3000/approve-dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: id,
      approved_qty: 100,
      approver_id: 2
    })
  });

  const data = await res.json();

  if (data.ok) {
    toast('Approved via database transaction');
    await loadData();
    renderPage(currentPage);
  } else {
    toast(data.error, 'error');
  }
}

/* =====================================================
   PAGE: AUDIT LOGS
   ===================================================== */
function renderAudit() {
  return `
  <div class="card">
    <div class="card-header"><div class="card-title">System Audit Log</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>User</th><th>Action</th><th>Table</th><th>Performed At</th></tr></thead>
        <tbody>
          ${STATE.auditLogs.map(l => `<tr>
            <td>${l.id}</td>
            <td><strong>${l.user}</strong></td>
            <td>${l.action}</td>
            <td><code>${l.table}</code></td>
            <td>${l.at}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* =====================================================
   PAGE: USER MANAGEMENT (Admin only)
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
        <thead><tr><th>#</th><th>Username</th><th>Full Name</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody>
          ${STATE.users.map(u => `<tr>
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.name}</td>
            <td><span class="badge badge-assigned">${u.role}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="toast('Edit user: ${u.name}','warning')">Edit</button></td>
            await loadData();
renderPage(currentPage);
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

      const body = {
        username: document.getElementById('u-user').value,
        name: document.getElementById('u-name').value,
        email: document.getElementById('u-email').value,
        role: document.getElementById('u-role').value,
        password: document.getElementById('u-pass').value
      };

      try {
        const res = await fetch('http://localhost:3000/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.ok) {
          toast('User created in DB');
          await loadData();
          renderPage(currentPage);
          renderPage('users');
        } else {
          toast(data.error, 'error');
        }

      } catch (err) {
        toast('Server error', 'error');
        await loadData();
        renderPage(currentPage);
      }
    });
}
/* =====================================================
   SIDEBAR BUILDER
   ===================================================== */
function buildSidebar() {
  const u = getUser();
  const role = u.role;
  const allNav = [
    {
      group: 'Main', items: [
        { page: 'dashboard', icon: '🏠', label: 'Dashboard' },
        { page: 'reports', icon: '🚨', label: 'Emergency Reports', badge: STATE.reports.filter(r => r.status === 'Pending').length },
      ]
    },
    {
      group: 'Operations', items: [
        { page: 'teams', icon: '🧑‍🚒', label: 'Rescue Teams', roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
        { page: 'inventory', icon: '📦', label: 'Inventory', roles: ['Administrator', 'EmergencyOperator', 'WarehouseManager'] },
        { page: 'hospitals', icon: '🏥', label: 'Hospitals', roles: ['Administrator', 'EmergencyOperator', 'FieldOfficer'] },
      ]
    },
    {
      group: 'Finance', items: [
        { page: 'financials', icon: '💰', label: 'Financials', roles: ['Administrator', 'FinanceOfficer'] },
        { page: 'approvals', icon: '✅', label: 'Approvals', badge: STATE.approvals.filter(a => a.status === 'Pending').length },
      ]
    },
    {
      group: 'System', items: [
        { page: 'audit', icon: '📋', label: 'Audit Logs', roles: ['Administrator', 'EmergencyOperator'] },
        { page: 'users', icon: '👥', label: 'User Management', roles: ['Administrator'] },
      ]
    },
  ];

  let html = '';
  allNav.forEach(g => {
    const visibleItems = g.items.filter(i => !i.roles || i.roles.includes(role) || role === 'Administrator');
    if (!visibleItems.length) return;
    html += `<div class="nav-section-label">${g.group}</div>`;
    visibleItems.forEach(i => {
      html += `<div class="nav-item ${currentPage === i.page ? 'active' : ''}" data-page="${i.page}" onclick="navigate('${i.page}')">
        <span class="icon">${i.icon}</span> ${i.label}
        ${i.badge ? `<span class="badge">${i.badge}</span>` : ''}
      </div>`;
    });
  });
  return html;
}

/* =====================================================
   BOOTSTRAP
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
      { u: 'admin', p: 'admin123', r: 'Administrator' },
      { u: 'op_ahmed', p: 'ahmed123', r: 'Emergency Operator' },
      { u: 'field_ali', p: 'ali123', r: 'Field Officer' },
      { u: 'wm_tariq', p: 'tariq123', r: 'Warehouse Manager' },
      { u: 'fin_nadia', p: 'nadia123', r: 'Finance Officer' },
    ].map(d => `<button class="btn btn-outline" style="width:100%;margin-bottom:8px;justify-content:space-between" onclick="quickLogin('${d.u}','${d.p}')"><span>${d.r}</span><span style="font-size:11px;opacity:.7">${d.u}</span></button>`).join('')}
      <div style="text-align:center;margin:16px 0;color:var(--text-muted);font-size:12px">— or enter credentials manually —</div>
      <div class="form-group" style="margin-bottom:12px"><label>Username</label><input id="li-user" placeholder="username"></div>
      <div class="form-group" style="margin-bottom:20px"><label>Password</label><input id="li-pass" type="password" placeholder="password" onkeydown="if(event.key==='Enter')doLogin()"></div>
      <button class="btn btn-primary" style="width:100%" onclick="doLogin()">Login →</button>
      <div id="login-error" style="color:var(--accent);margin-top:12px;text-align:center;font-size:13px"></div>
    </div>
  </div>`;
}

function quickLogin(u, p) {
  const user = login(u, p);
  if (user) showApp();
}

function doLogin() {
  const u = document.getElementById('li-user').value;
  const p = document.getElementById('li-pass').value;
  const user = login(u, p);
  if (user) showApp();
  else document.getElementById('login-error').textContent = '❌ Invalid username or password';
}

function showApp() {
  const u = getUser();
  document.body.innerHTML = `
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">🆘</span>
        <div>Smart Disaster<br>Response MIS</div>
      </div>
      <div class="sidebar-nav" id="sidebar-nav">${buildSidebar()}</div>
      <div class="sidebar-footer">
        <div class="user-info">${u.name}</div>
        <div class="role-tag">${u.role}</div>
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

// Start
// const existing = getUser();
if (existing)
  showApp();
else
  showLogin();