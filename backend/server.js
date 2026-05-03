// server.js — Smart Disaster Response MIS API
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ============================================================
// DATABASE CONFIG (override with env vars in production)
// ============================================================
const config = {
  user: process.env.DB_USER || 'sa_user',
  password: process.env.DB_PASSWORD || '1234',
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'disaster_mis',
  options: { trustServerCertificate: true, enableArithAbort: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let pool;
async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server (database:', config.database + ')');
  }
  return pool;
}

// ============================================================
// HELPERS
// ============================================================
function sendErr(res, code, msg, details) {
  return res.status(code).json({ ok: false, error: msg, details });
}

async function logAudit(p, userId, action, table, recordId, oldData, newData) {
  await p.request()
    .input('uid', sql.Int, userId || null)
    .input('act', sql.VarChar(100), action)
    .input('tbl', sql.VarChar(100), table || null)
    .input('rid', sql.Int, recordId || null)
    .input('old', sql.NVarChar(sql.MAX), oldData || null)
    .input('new', sql.NVarChar(sql.MAX), newData || null)
    .query(`
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (@uid, @act, @tbl, @rid, @old, @new)
    `);
}

// ============================================================
// AUTH
// ============================================================
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return sendErr(res, 400, 'username and password required');
  try {
    const p = await getPool();
    const r = await p.request()
      .input('u', sql.VarChar(100), username)
      .query(`
        SELECT u.user_id, u.username, u.password, u.full_name, u.email, u.is_active,
               r.role_name
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.username = @u
      `);
    if (!r.recordset.length) return sendErr(res, 401, 'Invalid credentials');
    const u = r.recordset[0];
    if (!u.is_active) return sendErr(res, 403, 'Account is inactive');
    if (u.password !== password) return sendErr(res, 401, 'Invalid credentials');

    await p.request()
      .input('uid', sql.Int, u.user_id)
      .query('UPDATE users SET last_login = GETDATE() WHERE user_id = @uid');

    const perms = await p.request()
      .input('rname', sql.VarChar(50), u.role_name)
      .query(`
        SELECT pr.permission_name
        FROM roles r
        JOIN role_permissions rp ON rp.role_id = r.role_id
        JOIN permissions pr ON pr.permission_id = rp.permission_id
        WHERE r.role_name = @rname
      `);

    res.json({
      ok: true,
      user: {
        id: u.user_id,
        username: u.username,
        name: u.full_name,
        email: u.email,
        role: u.role_name
      },
      permissions: perms.recordset.map(x => x.permission_name)
    });
  } catch (e) {
    sendErr(res, 500, e.message);
  }
});

app.get('/permissions', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT r.role_name, pr.permission_name
      FROM roles r
      JOIN role_permissions rp ON rp.role_id = r.role_id
      JOIN permissions pr ON pr.permission_id = rp.permission_id
    `);
    const map = {};
    r.recordset.forEach(row => {
      if (!map[row.role_name]) map[row.role_name] = [];
      map[row.role_name].push(row.permission_name);
    });
    res.json(map);
  } catch (e) {
    sendErr(res, 500, e.message);
  }
});

// ============================================================
// REFERENCE DATA
// ============================================================
app.get('/disaster-types', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT disaster_type_id AS id, type_name AS name
      FROM disaster_types ORDER BY type_name
    `);
    res.json(r.recordset);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/resource-types', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT resource_type_id AS id, type_name AS name, unit
      FROM resource_types ORDER BY type_name
    `);
    res.json(r.recordset);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/warehouses', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT warehouse_id AS id, warehouse_name AS name, location
      FROM warehouses ORDER BY warehouse_name
    `);
    res.json(r.recordset);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/financial-categories', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT category_id AS id, category_name AS name, category_type AS type
      FROM financial_categories ORDER BY category_name
    `);
    res.json(r.recordset);
  } catch (e) { sendErr(res, 500, e.message); }
});

// ============================================================
// READ ROUTES (shapes match the frontend STATE)
// ============================================================
app.get('/reports', async (req, res) => {
  try {
    const p = await getPool();
    const reqSql = p.request();
    let where = ' WHERE 1=1 ';
    if (req.query.status) {
      reqSql.input('flt_status', sql.VarChar(20), req.query.status);
      where += ' AND er.status = @flt_status ';
    }
    if (req.query.severity) {
      reqSql.input('flt_sev', sql.VarChar(10), req.query.severity);
      where += ' AND er.severity_level = @flt_sev ';
    }
    if (req.query.disaster_type) {
      reqSql.input('flt_type', sql.VarChar(100), req.query.disaster_type);
      where += ' AND dt.type_name = @flt_type ';
    }
    const r = await reqSql.query(`
      SELECT
        er.report_id      AS id,
        er.citizen_name   AS citizen,
        er.citizen_phone  AS phone,
        er.location_desc  AS location,
        dt.type_name      AS type,
        er.severity_level AS severity,
        er.status,
        CONVERT(VARCHAR(19), er.reported_at, 120) AS reportedAt,
        rt.team_name      AS team,
        er.description
      FROM emergency_reports er
      LEFT JOIN disaster_types dt ON dt.disaster_type_id = er.disaster_type_id
      LEFT JOIN rescue_teams   rt ON rt.team_id = er.assigned_team_id
      ${where}
      ORDER BY er.reported_at DESC
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/teams', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        team_id          AS id,
        team_name        AS name,
        team_type        AS type,
        current_location AS location,
        availability     AS status,
        member_count     AS members
      FROM rescue_teams
      ORDER BY team_id
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/inventory', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        i.inventory_id    AS id,
        w.warehouse_name  AS warehouse,
        rt.type_name      AS resource,
        i.quantity        AS qty,
        rt.unit           AS unit,
        i.threshold_level AS threshold,
        CASE WHEN i.quantity <= i.threshold_level THEN 'Low Stock' ELSE 'Available' END AS status
      FROM inventory i
      JOIN warehouses     w  ON w.warehouse_id      = i.warehouse_id
      JOIN resource_types rt ON rt.resource_type_id = i.resource_type_id
      ORDER BY i.inventory_id
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/hospitals', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        hospital_id    AS id,
        hospital_name  AS name,
        location,
        total_beds     AS total,
        available_beds AS available,
        CASE WHEN total_beds > 0
             THEN CAST(ROUND(100.0 * (total_beds - available_beds) / NULLIF(total_beds, 0), 0) AS INT)
             ELSE 0 END AS occupancy,
        CASE
          WHEN available_beds = 0 THEN 'Full'
          WHEN total_beds > 0 AND 100.0 * (total_beds - available_beds) / total_beds >= 90 THEN 'Critical'
          ELSE 'Available'
        END AS status
      FROM hospitals
      WHERE is_active = 1
      ORDER BY hospital_id
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/financials', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        ft.transaction_id AS id,
        fc.category_name  AS category,
        fc.category_type  AS type,
        ft.amount,
        ft.status,
        CONVERT(VARCHAR(19), ft.transaction_date, 120) AS date,
        ft.donor_name     AS donor,
        ft.reference_no   AS reference,
        ft.description
      FROM financial_transactions ft
      JOIN financial_categories fc ON fc.category_id = ft.category_id
      ORDER BY ft.transaction_date DESC
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/approvals', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        ar.approval_id  AS id,
        ar.request_type AS type,
        ar.reference_id,
        ar.status,
        u1.full_name    AS requestedBy,
        CONVERT(VARCHAR(19), ar.requested_at, 120) AS requestedAt,
        CONVERT(VARCHAR(19), ar.decided_at, 120)   AS decidedAt,
        ISNULL(
          ar.comments,
          CAST(ar.request_type AS VARCHAR(50)) + ' #' + CAST(ar.reference_id AS VARCHAR(20))
        ) AS [desc]
      FROM approval_requests ar
      LEFT JOIN users u1 ON u1.user_id = ar.requested_by
      ORDER BY ar.requested_at DESC
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/users', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT
        u.user_id   AS id,
        u.username,
        u.password,
        u.full_name AS name,
        u.email,
        u.is_active AS active,
        r.role_name AS role
      FROM users u
      JOIN roles r ON r.role_id = u.role_id
      ORDER BY u.user_id
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

app.get('/audit-logs', async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT TOP 200
        a.audit_log_id                  AS id,
        ISNULL(u.full_name, '(system)') AS [user],
        a.action,
        a.table_name                    AS [table],
        a.record_id,
        CONVERT(VARCHAR(19), a.performed_at, 120) AS at
      FROM audit_logs a
      LEFT JOIN users u ON u.user_id = a.user_id
      ORDER BY a.performed_at DESC
    `);
    res.json(r.recordset || []);
  } catch (e) { sendErr(res, 500, e.message); }
});

// ============================================================
// WRITE ROUTES
// ============================================================

// Create emergency report (accepts frontend-shaped or canonical payload)
app.post('/create-report', async (req, res) => {
  const b = req.body || {};
  const citizen_name = b.citizen_name;
  const phone = b.phone ?? b.citizen_phone;
  const location_desc = b.location_desc ?? b.location;
  const severity_level = b.severity_level ?? b.severity;
  const description = b.description ?? '';
  const lat = parseFloat(b.location_lat);
  const lng = parseFloat(b.location_lng);
  const location_lat = Number.isFinite(lat) ? lat : 33.6844;
  const location_lng = Number.isFinite(lng) ? lng : 73.0479;

  if (!location_desc || !severity_level)
    return sendErr(res, 400, 'location and severity are required');

  try {
    const p = await getPool();
    let disaster_type_id = b.disaster_type_id != null
      ? parseInt(b.disaster_type_id, 10) : NaN;
    if (!Number.isFinite(disaster_type_id) && b.disaster_type) {
      const lookup = await p.request()
        .input('t', sql.VarChar(100), b.disaster_type)
        .query('SELECT disaster_type_id FROM disaster_types WHERE type_name = @t');
      if (!lookup.recordset.length)
        return sendErr(res, 400, 'Unknown disaster type: ' + b.disaster_type);
      disaster_type_id = lookup.recordset[0].disaster_type_id;
    }
    if (!Number.isFinite(disaster_type_id))
      return sendErr(res, 400, 'disaster_type or disaster_type_id is required');

    const r = await p.request()
      .input('citizen_name', sql.VarChar(150), citizen_name)
      .input('citizen_phone', sql.VarChar(20), phone || '')
      .input('location_desc', sql.VarChar(255), location_desc)
      .input('location_lat', sql.Decimal(10, 7), location_lat)
      .input('location_lng', sql.Decimal(10, 7), location_lng)
      .input('disaster_type_id', sql.Int, disaster_type_id)
      .input('severity_level', sql.VarChar(10), severity_level)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('reported_by', sql.Int, b.reported_by || null)
      .query(`
        INSERT INTO emergency_reports
          (citizen_name, citizen_phone, location_desc, location_lat, location_lng,
           disaster_type_id, severity_level, description, reported_by)
        OUTPUT INSERTED.report_id AS new_report_id
        VALUES (@citizen_name, @citizen_phone, @location_desc, @location_lat, @location_lng,
                @disaster_type_id, @severity_level, @description, @reported_by)
      `);
    const newId = r.recordset[0].new_report_id;
    await logAudit(p, b.reported_by, 'CREATE_REPORT', 'emergency_reports', newId, null, null);
    res.json({ ok: true, new_report_id: newId });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Assign rescue team (uses stored procedure)
app.post('/assign-team', async (req, res) => {
  const { report_id, team_id, operator_id } = req.body || {};
  if (!report_id || !team_id) return sendErr(res, 400, 'report_id and team_id required');
  try {
    const p = await getPool();
    await p.request()
      .input('p_report_id', sql.Int, report_id)
      .input('p_team_id', sql.Int, team_id)
      .input('p_operator_id', sql.Int, operator_id || null)
      .execute('sp_assign_rescue_team');
    await p.request()
      .input('tid', sql.Int, team_id)
      .query(`UPDATE rescue_teams SET availability = 'Assigned', updated_at = GETDATE() WHERE team_id = @tid`);
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Release team
app.post('/release-team', async (req, res) => {
  const { team_id, released_by } = req.body || {};
  if (!team_id) return sendErr(res, 400, 'team_id required');
  try {
    const p = await getPool();
    const cur = await p.request()
      .input('tid', sql.Int, team_id)
      .query('SELECT availability FROM rescue_teams WHERE team_id = @tid');
    if (!cur.recordset.length) return sendErr(res, 404, 'Team not found');
    const prev = cur.recordset[0].availability;

    await p.request()
      .input('tid', sql.Int, team_id)
      .query(`UPDATE rescue_teams SET availability = 'Available', updated_at = GETDATE() WHERE team_id = @tid`);

    await p.request()
      .input('tid', sql.Int, team_id)
      .input('uid', sql.Int, released_by || null)
      .input('prev', sql.VarChar(50), prev)
      .query(`
        INSERT INTO team_activity_log (team_id, previous_status, new_status, changed_by, notes)
        VALUES (@tid, @prev, 'Available', @uid, 'Manual release')
      `);
    await logAudit(p, released_by, 'RELEASE_TEAM', 'rescue_teams', team_id, prev, 'Available');
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Admit patient (trigger updates hospital beds)
app.post('/admit-patient', async (req, res) => {
  const b = req.body || {};
  if (!b.hospital_id || !b.patient_name)
    return sendErr(res, 400, 'hospital_id and patient_name required');
  const status = b.condition === 'Critical' ? 'Critical' : 'Admitted';
  try {
    const p = await getPool();
    const r = await p.request()
      .input('hospital_id', sql.Int, b.hospital_id)
      .input('full_name', sql.VarChar(150), b.patient_name)
      .input('age', sql.Int, b.age || null)
      .input('gender', sql.VarChar(10), b.gender || null)
      .input('phone', sql.VarChar(20), b.phone || null)
      .input('status', sql.VarChar(20), status)
      .input('report_id', sql.Int, b.report_id || null)
      .query(`
        INSERT INTO patients
          (full_name, age, gender, contact_phone, hospital_id, report_id, status, notes)
        OUTPUT INSERTED.patient_id AS new_patient_id
        VALUES (@full_name, @age, @gender, @phone, @hospital_id, @report_id, @status, 'Admitted via MIS')
      `);
    const newId = r.recordset[0].new_patient_id;
    await logAudit(p, b.admitted_by, 'ADMIT_PATIENT', 'patients', newId, null, status);
    res.json({ ok: true, new_patient_id: newId });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Record financial transaction (uses stored procedure where possible)
app.post('/record-finance', async (req, res) => {
  const b = req.body || {};
  if (b.amount == null || !b.category_id || !b.recorded_by)
    return sendErr(res, 400, 'amount, category_id and recorded_by required');
  try {
    const p = await getPool();
    const result = await p.request()
      .input('p_report_id', sql.Int, b.report_id || null)
      .input('p_category_id', sql.Int, b.category_id)
      .input('p_amount', sql.Decimal(15, 2), b.amount)
      .input('p_description', sql.NVarChar(sql.MAX), b.description || '')
      .input('p_reference_no', sql.VarChar(100), b.reference_no || '')
      .input('p_donor_name', sql.VarChar(150), b.donor_name || '')
      .input('p_recorded_by', sql.Int, b.recorded_by)
      .execute('sp_record_financial_transaction');
    res.json({ ok: true, new_transaction_id: result.recordset?.[0]?.new_transaction_id });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Approve a financial transaction
app.post('/approve-finance', async (req, res) => {
  const { transaction_id, approved_by } = req.body || {};
  if (!transaction_id || !approved_by) return sendErr(res, 400, 'transaction_id and approved_by required');
  try {
    const p = await getPool();
    const upd = await p.request()
      .input('tid', sql.Int, transaction_id)
      .input('uid', sql.Int, approved_by)
      .query(`
        UPDATE financial_transactions
        SET status = 'Approved', approved_by = @uid
        WHERE transaction_id = @tid AND status = 'Pending'
      `);
    if (!upd.rowsAffected[0])
      return sendErr(res, 409, 'No pending transaction with that id');

    await p.request()
      .input('tid', sql.Int, transaction_id)
      .input('uid', sql.Int, approved_by)
      .query(`
        UPDATE approval_requests
        SET status = 'Approved', approved_by = @uid, decided_at = GETDATE()
        WHERE request_type = 'FinancialApproval' AND reference_id = @tid AND status = 'Pending'
      `);

    await logAudit(p, approved_by, 'APPROVE_FINANCE', 'financial_transactions', transaction_id, 'Pending', 'Approved');
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Approve + dispatch a resource request (transactional SP)
app.post('/approve-dispatch', async (req, res) => {
  const { request_id, approved_qty, approver_id } = req.body || {};
  if (!request_id || approved_qty == null) return sendErr(res, 400, 'request_id and approved_qty required');
  try {
    const p = await getPool();
    await p.request()
      .input('p_request_id', sql.Int, request_id)
      .input('p_approved_qty', sql.Decimal(12, 2), approved_qty)
      .input('p_approver_id', sql.Int, approver_id || null)
      .execute('sp_approve_and_dispatch_resource');

    await logAudit(p, approver_id, 'APPROVE_DISPATCH', 'resource_requests', request_id, 'Pending', 'Dispatched');
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Generic approval decision (Approved or Rejected) for any approval_request row.
// Also propagates the decision to the underlying entity so the Approvals page
// actually drives the workflow (resource dispatch / finance approval).
app.post('/decide-approval', async (req, res) => {
  const { approval_id, decision, approver_id, comments } = req.body || {};
  if (!approval_id || !decision) return sendErr(res, 400, 'approval_id and decision required');
  if (decision !== 'Approved' && decision !== 'Rejected')
    return sendErr(res, 400, 'decision must be Approved or Rejected');
  try {
    const p = await getPool();

    const cur = await p.request()
      .input('aid', sql.Int, approval_id)
      .query(`
        SELECT request_type, reference_id, status
        FROM approval_requests WHERE approval_id = @aid
      `);
    if (!cur.recordset.length) return sendErr(res, 404, 'Approval not found');
    const row = cur.recordset[0];
    if (row.status !== 'Pending') return sendErr(res, 409, 'Approval already decided');

    await p.request()
      .input('aid', sql.Int, approval_id)
      .input('dec', sql.VarChar(10), decision)
      .input('uid', sql.Int, approver_id || null)
      .input('cmt', sql.NVarChar(sql.MAX), comments || null)
      .query(`
        UPDATE approval_requests
        SET status = @dec, approved_by = @uid, decided_at = GETDATE(),
            comments = ISNULL(@cmt, comments)
        WHERE approval_id = @aid AND status = 'Pending'
      `);

    if (row.request_type === 'ResourceDistribution') {
      if (decision === 'Approved') {
        await p.request()
          .input('rid', sql.Int, row.reference_id)
          .input('uid', sql.Int, approver_id || null)
          .query(`
            UPDATE resource_requests
            SET status = 'Approved',
                approved_qty = ISNULL(approved_qty, requested_qty),
                approved_by  = @uid,
                approved_at  = GETDATE()
            WHERE request_id = @rid;

            UPDATE resource_requests
            SET status = 'Dispatched',
                dispatched_at = GETDATE()
            WHERE request_id = @rid;
          `);
      } else {
        await p.request()
          .input('rid', sql.Int, row.reference_id)
          .query(`
            UPDATE resource_requests SET status = 'Rejected'
            WHERE request_id = @rid AND status IN ('Pending', 'Approved')
          `);
      }
    } else if (row.request_type === 'FinancialApproval') {
      await p.request()
        .input('tid', sql.Int, row.reference_id)
        .input('uid', sql.Int, approver_id || null)
        .input('newst', sql.VarChar(10), decision)
        .query(`
          UPDATE financial_transactions
          SET status = @newst,
              approved_by = @uid
          WHERE transaction_id = @tid AND status = 'Pending'
        `);
    }

    await logAudit(p, approver_id, 'DECIDE_APPROVAL', 'approval_requests', approval_id, 'Pending', decision);
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Create a resource request (Pending until approve-dispatch)
app.post('/request-resource', async (req, res) => {
  const b = req.body || {};
  if (!b.report_id || !b.warehouse || !b.resource_type || !b.quantity || !b.requested_by)
    return sendErr(res, 400, 'report_id, warehouse, resource_type, quantity, requested_by required');
  try {
    const p = await getPool();

    const wh = await p.request()
      .input('wn', sql.VarChar(150), b.warehouse)
      .query('SELECT TOP 1 warehouse_id FROM warehouses WHERE warehouse_name = @wn');
    if (!wh.recordset.length) return sendErr(res, 400, 'Unknown warehouse: ' + b.warehouse);
    const warehouse_id = wh.recordset[0].warehouse_id;

    const rt = await p.request()
      .input('rn', sql.VarChar(100), b.resource_type)
      .query('SELECT TOP 1 resource_type_id FROM resource_types WHERE type_name = @rn');
    if (!rt.recordset.length) return sendErr(res, 400, 'Unknown resource type: ' + b.resource_type);
    const resource_type_id = rt.recordset[0].resource_type_id;

    const ins = await p.request()
      .input('report_id', sql.Int, b.report_id)
      .input('warehouse_id', sql.Int, warehouse_id)
      .input('resource_type_id', sql.Int, resource_type_id)
      .input('qty', sql.Decimal(12, 2), b.quantity)
      .input('requested_by', sql.Int, b.requested_by)
      .input('notes', sql.NVarChar(sql.MAX), b.notes || null)
      .query(`
        INSERT INTO resource_requests
          (report_id, warehouse_id, resource_type_id, requested_qty, requested_by, notes)
        OUTPUT INSERTED.request_id AS new_request_id
        VALUES (@report_id, @warehouse_id, @resource_type_id, @qty, @requested_by, @notes)
      `);
    const newId = ins.recordset[0].new_request_id;

    await p.request()
      .input('rid', sql.Int, newId)
      .input('uid', sql.Int, b.requested_by)
      .query(`
        INSERT INTO approval_requests (request_type, reference_id, requested_by, status)
        VALUES ('ResourceDistribution', @rid, @uid, 'Pending')
      `);
    await logAudit(p, b.requested_by, 'REQUEST_RESOURCE', 'resource_requests', newId, null, 'Pending');
    res.json({ ok: true, new_request_id: newId });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Update inventory quantity (warehouse manager)
app.post('/update-inventory', async (req, res) => {
  const { resource_id, quantity, updated_by } = req.body || {};
  if (!resource_id || quantity == null) return sendErr(res, 400, 'resource_id and quantity required');
  try {
    const p = await getPool();
    const cur = await p.request()
      .input('iid', sql.Int, resource_id)
      .query('SELECT quantity FROM inventory WHERE inventory_id = @iid');
    if (!cur.recordset.length) return sendErr(res, 404, 'Inventory row not found');
    const oldQty = cur.recordset[0].quantity;

    await p.request()
      .input('iid', sql.Int, resource_id)
      .input('q', sql.Decimal(12, 2), quantity)
      .query(`
        UPDATE inventory
        SET quantity = @q, last_updated = GETDATE()
        WHERE inventory_id = @iid
      `);
    await logAudit(p, updated_by, 'UPDATE_INVENTORY', 'inventory', resource_id,
      String(oldQty), String(quantity));
    res.json({ ok: true });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// Create user
app.post('/create-user', async (req, res) => {
  const b = req.body || {};
  if (!b.username || !b.password || !b.name || !b.email || !b.role)
    return sendErr(res, 400, 'username, password, name, email, role required');
  try {
    const p = await getPool();
    const r = await p.request()
      .input('rn', sql.VarChar(50), b.role)
      .query('SELECT role_id FROM roles WHERE role_name = @rn');
    if (!r.recordset.length) return sendErr(res, 400, 'Unknown role: ' + b.role);
    const role_id = r.recordset[0].role_id;

    const ins = await p.request()
      .input('u', sql.VarChar(100), b.username)
      .input('pw', sql.VarChar(100), b.password)
      .input('fn', sql.VarChar(150), b.name)
      .input('em', sql.VarChar(150), b.email)
      .input('ph', sql.VarChar(20), b.phone || null)
      .input('rid', sql.Int, role_id)
      .query(`
        INSERT INTO users (username, password, full_name, email, phone, role_id)
        OUTPUT INSERTED.user_id AS new_user_id
        VALUES (@u, @pw, @fn, @em, @ph, @rid)
      `);
    const newId = ins.recordset[0].new_user_id;
    await logAudit(p, b.created_by || null, 'CREATE_USER', 'users', newId, null, b.username);
    res.json({ ok: true, new_user_id: newId });
  } catch (e) {
    sendErr(res, 400, e.message);
  }
});

// ============================================================
// START
// ============================================================
(async () => {
  try { await getPool(); }
  catch (e) { console.error('Server starting WITHOUT DB:', e.message); }
})();
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => console.log('API running on http://localhost:' + PORT));
