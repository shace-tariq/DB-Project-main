// =====================================================
// Smart Disaster Response MIS - Core JS
// =====================================================

/* ---- Mock Data Store (replaces backend API calls) ---- */
const DB = 
{
	currentUser: null,

	users: [
		{ id: 1, username: 'admin', password: 'admin123', name: 'System Administrator', role: 'Administrator', roleId: 1 },
		{ id: 2, username: 'op_ahmed', password: 'ahmed123', name: 'Ahmed Khan', role: 'EmergencyOperator', roleId: 2 },
		{ id: 3, username: 'field_ali', password: 'ali123', name: 'Ali Raza', role: 'FieldOfficer', roleId: 3 },
		{ id: 4, username: 'wm_tariq', password: 'tariq123', name: 'Tariq Mehmood', role: 'WarehouseManager', roleId: 4 },
		{ id: 5, username: 'fin_nadia', password: 'nadia123', name: 'Nadia Iqbal', role: 'FinanceOfficer', roleId: 5 },
	],

	reports: [
		{ id: 1, citizen: 'Muhammad Asif', phone: '+92-321-1234567', location: 'Sector G-9, Islamabad', lat: 33.6844, lng: 73.0479, type: 'Flood', severity: 'High', status: 'Assigned', reportedAt: '2025-04-27 08:30', team: 'Alpha Medical Unit', teamId: 1 },
		{ id: 2, citizen: 'Ayesha Siddiqui', phone: '+92-333-2345678', location: 'Model Town, Lahore', lat: 31.5204, lng: 74.3587, type: 'Urban Fire', severity: 'Critical', status: 'InProgress', reportedAt: '2025-04-27 09:15', team: 'Bravo Fire Squad', teamId: 2 },
		{ id: 3, citizen: 'Tariq Jameel', phone: '+92-312-3456789', location: 'Bara Road, Peshawar', lat: 34.0151, lng: 71.5249, type: 'Earthquake', severity: 'Critical', status: 'Assigned', reportedAt: '2025-04-27 10:00', team: 'Echo Medical Unit', teamId: 5 },
		{ id: 4, citizen: 'Sana Mirza', phone: '+92-345-4567890', location: 'Korangi, Karachi', lat: 24.8607, lng: 67.0011, type: 'Flood', severity: 'Medium', status: 'Pending', reportedAt: '2025-04-27 11:30', team: null, teamId: null },
		{ id: 5, citizen: 'Bilal Chaudhry', phone: '+92-301-5678901', location: 'Satellite Town, Quetta', lat: 30.1798, lng: 66.9750, type: 'Landslide', severity: 'High', status: 'Assigned', reportedAt: '2025-04-27 07:45', team: 'Golf Rescue Team', teamId: 7 },
		{ id: 6, citizen: 'Razia Bibi', phone: '+92-315-6789012', location: 'Old City, Multan', lat: 30.1575, lng: 71.5249, type: 'Urban Fire', severity: 'Low', status: 'Resolved', reportedAt: '2025-04-26 16:00', team: null, teamId: null },
	],

	teams: [
		{ id: 1, name: 'Alpha Medical Unit', type: 'Medical', location: 'Islamabad Base Camp', status: 'Assigned', members: 8 },
		{ id: 2, name: 'Bravo Fire Squad', type: 'Fire', location: 'Rawalpindi Station', status: 'Busy', members: 10 },
		{ id: 3, name: 'Charlie Rescue', type: 'Rescue', location: 'Lahore Ops Center', status: 'Available', members: 12 },
		{ id: 4, name: 'Delta Search Unit', type: 'Search', location: 'Karachi HQ', status: 'Available', members: 6 },
		{ id: 5, name: 'Echo Medical Unit', type: 'Medical', location: 'Peshawar Camp', status: 'Assigned', members: 7 },
		{ id: 6, name: 'Foxtrot Fire Squad', type: 'Fire', location: 'Quetta Base', status: 'Busy', members: 9 },
		{ id: 7, name: 'Golf Rescue Team', type: 'Rescue', location: 'Multan Center', status: 'Assigned', members: 11 },
		{ id: 8, name: 'Hotel Search Unit', type: 'Search', location: 'Faisalabad Station', status: 'Available', members: 5 },
	],

	inventory: [
		{ id: 1, warehouse: 'Islamabad Central', resource: 'Food Packages', unit: 'units', qty: 5000, threshold: 500, status: 'Adequate' },
		{ id: 2, warehouse: 'Islamabad Central', resource: 'Drinking Water', unit: 'liters', qty: 20000, threshold: 2000, status: 'Adequate' },
		{ id: 3, warehouse: 'Islamabad Central', resource: 'Medicines', unit: 'units', qty: 3000, threshold: 300, status: 'Adequate' },
		{ id: 4, warehouse: 'Lahore Regional', resource: 'Food Packages', unit: 'units', qty: 350, threshold: 400, status: 'Low Stock' },
		{ id: 5, warehouse: 'Lahore Regional', resource: 'Shelter Tents', unit: 'units', qty: 400, threshold: 40, status: 'Adequate' },
		{ id: 6, warehouse: 'Karachi Supply Hub', resource: 'Drinking Water', unit: 'liters', qty: 25000, threshold: 2500, status: 'Adequate' },
		{ id: 7, warehouse: 'Peshawar Store', resource: 'Medicines', unit: 'units', qty: 1500, threshold: 150, status: 'Adequate' },
		{ id: 8, warehouse: 'Peshawar Store', resource: 'Blankets', unit: 'units', qty: 45, threshold: 50, status: 'Low Stock' },
	],

	hospitals: [
		{ id: 1, name: 'PIMS Hospital', location: 'Islamabad', total: 500, available: 120, occupancy: 76, status: 'Available' },
		{ id: 2, name: 'Jinnah Hospital', location: 'Lahore', total: 800, available: 200, occupancy: 75, status: 'Available' },
		{ id: 3, name: 'Civil Hospital', location: 'Karachi', total: 1200, available: 350, occupancy: 71, status: 'Available' },
		{ id: 4, name: 'Hayatabad Med Complex', location: 'Peshawar', total: 600, available: 15, occupancy: 98, status: 'Critical' },
		{ id: 5, name: 'Nishtar Hospital', location: 'Multan', total: 700, available: 150, occupancy: 79, status: 'Available' },
		{ id: 6, name: 'CMH Rawalpindi', location: 'Rawalpindi', total: 400, available: 8, occupancy: 98, status: 'Full' },
	],

	financials: [
		{ id: 1, category: 'Donation - Corporate', type: 'Income', amount: 2000000, donor: 'XYZ Industries', status: 'Approved', date: '2025-04-25', desc: 'Corporate donation' },
		{ id: 2, category: 'Donation - Individual', type: 'Income', amount: 500000, donor: 'Arif Habib', status: 'Approved', date: '2025-04-26', desc: 'Individual donation' },
		{ id: 3, category: 'Resource Procurement', type: 'Expense', amount: 350000, donor: null, status: 'Approved', date: '2025-04-27', desc: 'Emergency food procurement' },
		{ id: 4, category: 'Team Operations', type: 'Expense', amount: 150000, donor: null, status: 'Approved', date: '2025-04-27', desc: 'Fire rescue team costs' },
		{ id: 5, category: 'Medical Expenses', type: 'Expense', amount: 280000, donor: null, status: 'Pending', date: '2025-04-28', desc: 'Medical supplies for earthquake' },
		{ id: 6, category: 'Donation - International', type: 'Income', amount: 5000000, donor: 'UNICEF Pakistan', status: 'Approved', date: '2025-04-20', desc: 'International relief fund' },
	],

	approvals: [
		{ id: 1, type: 'ResourceDistribution', desc: '200 units medicines for Lahore fire', requestedBy: 'Ali Raza', status: 'Approved', requestedAt: '2025-04-27 09:00', decidedAt: '2025-04-27 10:30' },
		{ id: 2, type: 'ResourceDistribution', desc: '100 shelter tents for Peshawar quake', requestedBy: 'Ali Raza', status: 'Pending', requestedAt: '2025-04-27 10:15', decidedAt: null },
		{ id: 3, type: 'FinancialApproval', desc: 'Medical expenses PKR 280,000', requestedBy: 'Nadia Iqbal', status: 'Pending', requestedAt: '2025-04-28 08:00', decidedAt: null },
		{ id: 4, type: 'RescueDeployment', desc: 'Team Echo to Peshawar earthquake zone', requestedBy: 'Ahmed Khan', status: 'Approved', requestedAt: '2025-04-27 10:00', decidedAt: '2025-04-27 10:05' },
	],

	auditLogs: [
		{ id: 1, user: 'Ahmed Khan', action: 'Assigned team to Report #1', table: 'emergency_reports', at: '2025-04-27 08:35' },
		{ id: 2, user: 'Ahmed Khan', action: 'Assigned team to Report #3', table: 'emergency_reports', at: '2025-04-27 10:05' },
		{ id: 3, user: 'Tariq Mehmood', action: 'Approved resource request #1', table: 'resource_allocation', at: '2025-04-26 15:00' },
		{ id: 4, user: 'Nadia Iqbal', action: 'Created financial transaction', table: 'financial_transactions', at: '2025-04-28 08:02' },
		{ id: 5, user: 'admin', action: 'Created user account', table: 'users', at: '2025-04-20 09:00' },
	],

	// Role permissions map
	rolePermissions: {
		Administrator: ['all'],
		EmergencyOperator: ['view_reports', 'create_reports', 'update_reports', 'manage_teams', 'view_inventory', 'view_hospitals', 'approve_workflows'],
		FieldOfficer: ['view_reports', 'update_reports', 'view_inventory', 'view_hospitals', 'manage_hospitals'],
		WarehouseManager: ['view_inventory', 'manage_inventory', 'approve_resources', 'view_reports', 'approve_workflows'],
		FinanceOfficer: ['view_financials', 'manage_financials', 'approve_workflows', 'view_reports'],
	}
};

/* ---- Auth ---- */
function login(username, password) 
{
	const u = DB.users.find(u => u.username === username && u.password === password);
	if (!u) return null;
	DB.currentUser = u;
	sessionStorage.setItem('mis_user', JSON.stringify(u));
	return u;
}

function logout() {
	DB.currentUser = null;
	sessionStorage.removeItem('mis_user');
	showLogin();
}

function getUser() {
	if (DB.currentUser) return DB.currentUser;
	const s = sessionStorage.getItem('mis_user');
	if (s) { DB.currentUser = JSON.parse(s); return DB.currentUser; }
	return null;
}

function hasPermission(perm) {
	const u = getUser();
	if (!u) return false;
	const perms = DB.rolePermissions[u.role] || [];
	return perms.includes('all') || perms.includes(perm);
}

/* ---- Routing ---- */
let currentPage = 'dashboard';
function navigate(page) {
	currentPage = page;
	document.querySelectorAll('.nav-item').forEach(el => {
		el.classList.toggle('active', el.dataset.page === page);
	});
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
	const totalIncome = DB.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
	const totalExpense = DB.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
	const pending = DB.approvals.filter(a => a.status === 'Pending').length;

	return `
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon red">🚨</div>
      <div class="kpi-body">
        <div class="kpi-value">${DB.reports.filter(r => r.status != 'Resolved' && r.status != 'Closed').length}</div>
        <div class="kpi-label">Active Incidents</div>
        <div class="kpi-delta up">↑ 2 new today</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">🧑‍🚒</div>
      <div class="kpi-body">
        <div class="kpi-value">${DB.teams.filter(t => t.status === 'Available').length}</div>
        <div class="kpi-label">Teams Available</div>
        <div class="kpi-delta down">↓ 3 deployed</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon blue">🏥</div>
      <div class="kpi-body">
        <div class="kpi-value">${DB.hospitals.reduce((a, b) => a + b.available, 0)}</div>
        <div class="kpi-label">Hospital Beds Available</div>
        <div class="kpi-delta down">↓ 2 critical capacity</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon orange">📦</div>
      <div class="kpi-body">
        <div class="kpi-value">${DB.inventory.filter(i => i.status === 'Low Stock').length}</div>
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
            ${DB.reports.slice(0, 5).map(r => `
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
      ${DB.inventory.filter(i => i.status === 'Low Stock').map(i => `
        <div class="alert-strip warning">
          📦 <strong>${i.resource}</strong> at ${i.warehouse} — Only ${i.qty} ${i.unit} remaining (threshold: ${i.threshold})
        </div>`).join('')}
      ${DB.hospitals.filter(h => h.status === 'Critical' || h.status === 'Full').map(h => `
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
		const counts = ['Critical', 'High', 'Medium', 'Low'].map(s => DB.reports.filter(r => r.severity === s).length);
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
		const income = DB.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
		const expense = DB.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
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
      ${renderReportsTable(DB.reports)}
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
	let data = DB.reports;
	if (s) data = data.filter(r => r.status === s);
	if (sv) data = data.filter(r => r.severity === sv);
	if (t) data = data.filter(r => r.type === t);
	document.getElementById('reports-table-wrap').innerHTML = renderReportsTable(data);
}

function viewReport(id) {
	const r = DB.reports.find(r => r.id === id);
	openModal(`Incident Report #${r.id}`, `
    <div style="display:grid;gap:12px">
      <div><strong>Citizen:</strong> ${r.citizen} (${r.phone})</div>
      <div><strong>Location:</strong> ${r.location} (${r.lat}, ${r.lng})</div>
      <div><strong>Disaster Type:</strong> ${r.type}</div>
      <div><strong>Severity:</strong> ${severityBadge(r.severity)}</div>
      <div><strong>Status:</strong> ${statusBadge(r.status)}</div>
      <div><strong>Reported At:</strong> ${r.reportedAt}</div>
      <div><strong>Assigned Team:</strong> ${r.team || 'Not Assigned'}</div>
    </div>`);
}

function assignTeam(reportId) {
	const available = DB.teams.filter(t => t.status === 'Available');
	openModal(`Assign Rescue Team to Report #${reportId}`,
		`<div class="form-group">
       <label>Select Team</label>
       <select id="sel-team">
         ${available.map(t => `<option value="${t.id}">${t.name} (${t.type}, ${t.members} members)</option>`).join('')}
       </select>
     </div>`,
		() => {
			const teamId = parseInt(document.getElementById('sel-team').value);
			const team = DB.teams.find(t => t.id === teamId);
			const report = DB.reports.find(r => r.id === reportId);
			report.team = team.name;
			report.teamId = team.id;
			report.status = 'Assigned';
			team.status = 'Assigned';
			DB.auditLogs.unshift({
				id: DB.auditLogs.length + 1, user: DB.currentUser.name,
				action: `Assigned ${team.name} to Report #${reportId}`, table: 'emergency_reports',
				at: new Date().toLocaleString()
			});
			toast(`Team ${team.name} assigned to Report #${reportId}`);
			renderPage('reports');
		});
}

function showAddReport() {
	openModal('New Emergency Report', `
    <div class="form-grid">
      <div class="form-group"><label>Citizen Name</label><input id="r-name" placeholder="Full name"></div>
      <div class="form-group"><label>Phone</label><input id="r-phone" placeholder="+92-3XX-XXXXXXX"></div>
      <div class="form-group full"><label>Location Description</label><input id="r-loc" placeholder="Area, City"></div>
      <div class="form-group"><label>Disaster Type</label>
        <select id="r-type"><option>Flood</option><option>Earthquake</option><option>Urban Fire</option><option>Landslide</option><option>Cyclone</option></select></div>
      <div class="form-group"><label>Severity</label>
        <select id="r-sev"><option>Low</option><option>Medium</option><option selected>High</option><option>Critical</option></select></div>
      <div class="form-group full"><label>Description</label><textarea id="r-desc" placeholder="Describe the incident..."></textarea></div>
    </div>`, () => {
		DB.reports.unshift({
			id: DB.reports.length + 1,
			citizen: document.getElementById('r-name').value || 'Anonymous',
			phone: document.getElementById('r-phone').value || 'N/A',
			location: document.getElementById('r-loc').value || 'Unknown Location',
			lat: 33.6844, lng: 73.0479,
			type: document.getElementById('r-type').value,
			severity: document.getElementById('r-sev').value,
			status: 'Pending',
			reportedAt: new Date().toLocaleString(),
			team: null, teamId: null
		});
		toast('Emergency report submitted successfully!');
		renderPage('reports');
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
        <div class="kpi-value">${DB.teams.filter(t => t.status === s).length}</div>
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
          ${DB.teams.map(t => `<tr>
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
	const t = DB.teams.find(t => t.id === id);
	openModal(`Release Team: ${t.name}`, `<p>Mark <strong>${t.name}</strong> as Available?</p>`, () => {
		t.status = 'Available';
		toast(`${t.name} is now Available`);
		renderPage('teams');
	});
}

/* =====================================================
   PAGE: INVENTORY
   ===================================================== */
function renderInventory() {
	return `
  ${DB.inventory.filter(i => i.status === 'Low Stock').map(i => `
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
          ${DB.inventory.map(i => `<tr>
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
      <div class="form-group"><label>Incident Report #</label>
        <select id="rr-report">${DB.reports.filter(r => r.status != 'Resolved').map(r => `<option value="${r.id}">#${r.id} - ${r.location}</option>`).join('')}</select></div>
      <div class="form-group"><label>Warehouse</label>
        <select id="rr-wh"><option>Islamabad Central</option><option>Lahore Regional</option><option>Karachi Supply Hub</option><option>Peshawar Store</option></select></div>
      <div class="form-group"><label>Resource Type</label>
        <select id="rr-res"><option>Food Packages</option><option>Drinking Water</option><option>Medicines</option><option>Shelter Tents</option><option>Blankets</option></select></div>
      <div class="form-group"><label>Quantity</label><input id="rr-qty" type="number" min="1" value="100"></div>
      <div class="form-group full"><label>Notes</label><textarea id="rr-notes" placeholder="Justification for request..."></textarea></div>
    </div>`, () => {
		toast('Resource request submitted for approval!');
	});
}

function updateInventory(id) {
	const inv = DB.inventory.find(i => i.id === id);
	openModal(`Update Inventory: ${inv.resource}`, `
    <div class="form-group">
      <label>New Quantity (${inv.unit})</label>
      <input id="inv-qty" type="number" value="${inv.qty}">
    </div>`, () => {
		inv.qty = parseInt(document.getElementById('inv-qty').value) || inv.qty;
		inv.status = inv.qty <= inv.threshold ? 'Low Stock' : 'Adequate';
		toast('Inventory updated successfully!');
		renderPage('inventory');
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
          ${DB.hospitals.map(h => `<tr>
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
	const h = DB.hospitals.find(h => h.id === hospId);
	if (h.available <= 0) { toast('No beds available at this hospital!', 'error'); return; }
	openModal(`Admit Patient to ${h.name}`, `
    <div class="form-grid">
      <div class="form-group"><label>Patient Name</label><input id="p-name" placeholder="Full name"></div>
      <div class="form-group"><label>Age</label><input id="p-age" type="number"></div>
      <div class="form-group"><label>Gender</label><select id="p-gender"><option>Male</option><option>Female</option><option>Other</option></select></div>
      <div class="form-group"><label>Contact Phone</label><input id="p-phone" placeholder="+92-3XX-XXXXXXX"></div>
      <div class="form-group"><label>Condition</label><select id="p-cond"><option>Admitted</option><option>Critical</option><option>Stable</option></select></div>
    </div>`, () => {
		h.available--;
		h.occupancy = Math.round((h.total - h.available) / h.total * 100);
		if (h.available === 0) h.status = 'Full';
		else if (h.available < 20) h.status = 'Critical';
		toast(`Patient admitted to ${h.name}`);
		renderPage('hospitals');
	});
}

/* =====================================================
   PAGE: FINANCIALS
   ===================================================== */
function renderFinancials() {
	const income = DB.financials.filter(f => f.type === 'Income' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);
	const expense = DB.financials.filter(f => f.type === 'Expense' && f.status === 'Approved').reduce((a, b) => a + b.amount, 0);

	return `
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-icon green">💰</div><div class="kpi-body"><div class="kpi-value">${(income / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Income (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon red">💸</div><div class="kpi-body"><div class="kpi-value">${(expense / 1e6).toFixed(1)}M</div><div class="kpi-label">Total Expenses (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon blue">⚖️</div><div class="kpi-body"><div class="kpi-value">${((income - expense) / 1e6).toFixed(1)}M</div><div class="kpi-label">Net Balance (PKR)</div></div></div>
    <div class="kpi-card"><div class="kpi-icon orange">⏳</div><div class="kpi-body"><div class="kpi-value">${DB.financials.filter(f => f.status === 'Pending').length}</div><div class="kpi-label">Pending Approvals</div></div></div>
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
            ${DB.financials.map(f => `<tr>
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
	const cats = [...new Set(DB.financials.map(f => f.category))];
	const vals = cats.map(c => DB.financials.filter(f => f.category === c).reduce((a, b) => a + b.amount, 0));
	new Chart(ctx, {
		type: 'pie',
		data: { labels: cats, datasets: [{ data: vals, backgroundColor: ['#2a9d8f', '#457b9d', '#1a3a5c', '#e63946', '#f4a261', '#ffd166', '#e9c46a', '#a8dadc'] }] },
		options: { plugins: { legend: { position: 'bottom' } } }
	});
}

function approveTransaction(id) {
	const f = DB.financials.find(f => f.id === id);
	openModal('Approve Transaction', `<p>Approve <strong>${f.category}</strong> for <strong>${formatCurrency(f.amount)}</strong>?</p>`, () => {
		f.status = 'Approved';
		toast('Transaction approved successfully!');
		renderPage('financials');
	});
}

function addTransaction() {
	openModal('Add Financial Transaction', `
    <div class="form-grid">
      <div class="form-group"><label>Category</label>
        <select id="t-cat"><option>Donation - Individual</option><option>Donation - Corporate</option><option>Resource Procurement</option><option>Team Operations</option><option>Medical Expenses</option></select></div>
      <div class="form-group"><label>Amount (PKR)</label><input id="t-amt" type="number" min="0" placeholder="0"></div>
      <div class="form-group"><label>Donor/Payee</label><input id="t-donor" placeholder="Name (for donations)"></div>
      <div class="form-group"><label>Reference No</label><input id="t-ref" placeholder="DON-YYYY-XXX"></div>
      <div class="form-group full"><label>Description</label><textarea id="t-desc" placeholder="Transaction details..."></textarea></div>
    </div>`, () => {
		DB.financials.push({
			id: DB.financials.length + 1,
			category: document.getElementById('t-cat').value,
			type: document.getElementById('t-cat').value.includes('Donation') ? 'Income' : 'Expense',
			amount: parseFloat(document.getElementById('t-amt').value) || 0,
			donor: document.getElementById('t-donor').value || null,
			status: 'Pending', date: new Date().toISOString().slice(0, 10),
			desc: document.getElementById('t-desc').value
		});
		toast('Transaction submitted — pending approval');
		renderPage('financials');
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
          ${DB.approvals.map(a => `<tr>
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

function decideApproval(id, decision) {
	const a = DB.approvals.find(a => a.id === id);
	openModal(`${decision}: ${a.type}`, `
    <p>${decision === 'Approved' ? '✅ Approve' : '❌ Reject'} request: <strong>${a.desc}</strong>?</p>
    <div class="form-group" style="margin-top:16px"><label>Comments (optional)</label><textarea id="ap-comment" placeholder="Add a comment..."></textarea></div>`,
		() => {
			a.status = decision;
			a.decidedAt = new Date().toLocaleString();
			toast(`Request ${decision.toLowerCase()} successfully!`, decision === 'Approved' ? 'success' : 'error');
			renderPage('approvals');
		});
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
          ${DB.auditLogs.map(l => `<tr>
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
          ${DB.users.map(u => `<tr>
            <td>${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td>${u.name}</td>
            <td><span class="badge badge-assigned">${u.role}</span></td>
            <td><button class="btn btn-sm btn-outline" onclick="toast('Edit user: ${u.name}','warning')">Edit</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function addUser() {
	openModal('Add New User', `
    <div class="form-grid">
      <div class="form-group"><label>Username</label><input id="u-user" placeholder="username"></div>
      <div class="form-group"><label>Full Name</label><input id="u-name" placeholder="Full Name"></div>
      <div class="form-group"><label>Email</label><input id="u-email" placeholder="email@example.com"></div>
      <div class="form-group"><label>Role</label>
        <select id="u-role"><option>Administrator</option><option>EmergencyOperator</option><option>FieldOfficer</option><option>WarehouseManager</option><option>FinanceOfficer</option></select></div>
      <div class="form-group"><label>Password</label><input id="u-pass" type="password"></div>
    </div>`, () => {
		DB.users.push({
			id: DB.users.length + 1, username: document.getElementById('u-user').value,
			name: document.getElementById('u-name').value, role: document.getElementById('u-role').value,
			password: document.getElementById('u-pass').value
		});
		toast('User created successfully!');
		renderPage('users');
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
				{ page: 'reports', icon: '🚨', label: 'Emergency Reports', badge: DB.reports.filter(r => r.status === 'Pending').length },
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
				{ page: 'approvals', icon: '✅', label: 'Approvals', badge: DB.approvals.filter(a => a.status === 'Pending').length },
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
const existing = getUser();
if (existing)
	showApp();
else
	showLogin();