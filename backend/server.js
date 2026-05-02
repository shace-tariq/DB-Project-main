//server.js
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE CONFIG =================
const config = {
  user: 'sa_user',
  password: '1234',
  server: 'localhost',
  port: 1433,
  database: 'disaster_mis',
  options: {
    trustServerCertificate: true
  }
};
// ================= CONNECTION =================
let pool;

async function getPool() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Connected to SQL Server');
    }
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
}

// ======================= GET ROUTES =======================

// Reports
app.get('/reports', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`
      SELECT 
    report_id,
    citizen_name,
    location_desc AS location,
    severity_level AS severity,
    status
FROM emergency_reports
`);
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Teams
app.get('/teams', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT * FROM rescue_teams');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Inventory
app.get('/inventory', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`SELECT 
    i.inventory_id,
    w.warehouse_name,
    rt.type_name AS resource,
    i.quantity
FROM inventory i
JOIN warehouses w ON w.warehouse_id = i.warehouse_id
JOIN resource_types rt ON rt.resource_type_id = i.resource_type_id`);
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Hospitals
app.get('/hospitals', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT * FROM hospitals');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Financials
app.get('/financials', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(`SELECT 
    ft.transaction_id,
    ft.amount,
    ft.status,
    ft.transaction_date,
    fc.category_name,
    ft.report_id
FROM financial_transactions ft
JOIN financial_categories fc ON fc.category_id = ft.category_id`);
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approvals
app.get('/approvals', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query('SELECT * FROM resource_requests');
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Users
app.get('/users', async (req, res) => {
  try {
    const p = await getPool();

    const result = await p.request().query(`
      SELECT  
        user_id AS id,
        username,
        password,
        full_name AS name,
        role_id
      FROM users
    `);

    res.json(result.recordset);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ======================= POST ROUTES =======================

// Approve + Dispatch (transaction)
app.post('/approve-dispatch', async (req, res) => {
  const { request_id, approved_qty, approver_id } = req.body;
  try {
    const p = await getPool();
    await p.request()
      .input('p_request_id', sql.Int, request_id)
      .input('p_approved_qty', sql.Decimal(12,2), approved_qty)
      .input('p_approver_id', sql.Int, approver_id)
      .execute('sp_approve_and_dispatch_resource');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Assign team
app.post('/assign-team', async (req, res) => {
  const { report_id, team_id, operator_id } = req.body;
  try {
    const p = await getPool();
    await p.request()
      .input('p_report_id', sql.Int, report_id)
      .input('p_team_id', sql.Int, team_id)
      .input('p_operator_id', sql.Int, operator_id)
      .execute('sp_assign_rescue_team');

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Record finance
app.post('/record-finance', async (req, res) => {
  const { report_id, category_id, amount, description, reference_no, donor_name, recorded_by } = req.body;
  try {
    const p = await getPool();
    const result = await p.request()
      .input('p_report_id', sql.Int, report_id)
      .input('p_category_id', sql.Int, category_id)
      .input('p_amount', sql.Decimal(15,2), amount)
      .input('p_description', sql.NVarChar(sql.MAX), description)
      .input('p_reference_no', sql.VarChar(100), reference_no)
      .input('p_donor_name', sql.VarChar(150), donor_name)
      .input('p_recorded_by', sql.Int, recorded_by)
      .execute('sp_record_financial_transaction');

    res.json({ ok: true, new_transaction_id: result.recordset?.[0]?.new_transaction_id });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Create report
app.post('/create-report', async (req, res) => {
  const { citizen_name, phone, location_desc, disaster_type_id, severity_level, description } = req.body;

  try {
    const p = await getPool();

    await p.request()
      .input('citizen_name', sql.VarChar(150), citizen_name)
      .input('citizen_phone', sql.VarChar(20), phone)
      .input('location_desc', sql.VarChar(255), location_desc)
      .input('location_lat', sql.Decimal(10,7), 33.6844)
      .input('location_lng', sql.Decimal(10,7), 73.0479)
      .input('disaster_type_id', sql.Int, disaster_type_id)
      .input('severity_level', sql.VarChar(10), severity_level)
      .input('description', sql.NVarChar(sql.MAX), description)

      .query(`
        INSERT INTO emergency_reports (
          citizen_name,
          citizen_phone,
          location_desc,
          location_lat,
          location_lng,
          disaster_type_id,
          severity_level,
          description
        )
        VALUES (
          @citizen_name,
          @citizen_phone,
          @location_desc,
          @location_lat,
          @location_lng,
          @disaster_type_id,
          @severity_level,
          @description
        )
      `);

    res.json({ ok: true });

  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ================= START SERVER =================
(async () => {
  try {
    await getPool();
    console.log('🚀 DB connection verified at startup');
  } catch (err) {
    console.error('🔥 Server started WITHOUT DB connection');
  }
})();
app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});