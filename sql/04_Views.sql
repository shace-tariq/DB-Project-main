-- ============================================================
-- Smart Disaster Response MIS - VIEWS
-- Converted: MySQL → T-SQL (SQL Server)
-- Key changes:
--   • CREATE OR REPLACE VIEW → CREATE OR ALTER VIEW
--   • TIMESTAMPDIFF(MINUTE/HOUR, a, b) → DATEDIFF(MINUTE/HOUR, a, b)
--   • NOW() → GETDATE()
--   • TRUE → 1
--   • ORDER BY removed from view definitions (not allowed in T-SQL views without TOP)
-- ============================================================
USE disaster_mis;
GO

-- ============================================================
-- VIEW 1: Active Incidents Dashboard (Emergency Operator View)
-- ============================================================
CREATE OR ALTER VIEW vw_active_incidents AS
SELECT
    er.report_id,
    er.citizen_name,
    er.citizen_phone,
    er.location_desc,
    er.location_lat,
    er.location_lng,
    dt.type_name                                              AS disaster_type,
    er.severity_level,
    er.status,
    er.reported_at,
    er.updated_at,
    rt.team_name                                              AS assigned_team,
    rt.team_type,
    rt.availability                                           AS team_availability,
    u.full_name                                               AS reported_by_name,
    DATEDIFF(MINUTE, er.reported_at, GETDATE())               AS minutes_since_report
FROM emergency_reports er
JOIN disaster_types    dt ON dt.disaster_type_id = er.disaster_type_id
LEFT JOIN rescue_teams rt ON rt.team_id          = er.assigned_team_id
LEFT JOIN users        u  ON u.user_id           = er.reported_by
WHERE er.status NOT IN ('Resolved','Closed');
GO

-- ============================================================
-- VIEW 2: Inventory Status with Low-Stock Flags (Warehouse Manager)
-- Note: ORDER BY removed — add it in the calling query
-- ============================================================
CREATE OR ALTER VIEW vw_inventory_status AS
SELECT
    w.warehouse_id,
    w.warehouse_name,
    w.location                 AS warehouse_location,
    rt.type_name               AS resource_name,
    rt.unit,
    i.quantity,
    i.threshold_level,
    CASE
        WHEN i.quantity <= 0                THEN 'Out of Stock'
        WHEN i.quantity <= i.threshold_level THEN 'Low Stock'
        ELSE 'Adequate'
    END                        AS stock_status,
    i.last_updated
FROM inventory      i
JOIN warehouses     w  ON w.warehouse_id     = i.warehouse_id
JOIN resource_types rt ON rt.resource_type_id = i.resource_type_id;
GO

-- ============================================================
-- VIEW 3: Financial Summary View (Finance Officer)
-- ============================================================
CREATE OR ALTER VIEW vw_financial_summary AS
SELECT
    ft.transaction_id,
    fc.category_name,
    fc.category_type,
    ft.amount,
    ft.transaction_date,
    ft.description,
    ft.reference_no,
    ft.donor_name,
    ft.status,
    u_rec.full_name            AS recorded_by,
    u_app.full_name            AS approved_by,
    er.location_desc           AS related_incident
FROM financial_transactions ft
JOIN financial_categories   fc    ON fc.category_id  = ft.category_id
JOIN users                  u_rec ON u_rec.user_id   = ft.recorded_by
LEFT JOIN users             u_app ON u_app.user_id   = ft.approved_by
LEFT JOIN emergency_reports er    ON er.report_id    = ft.report_id;
GO

-- ============================================================
-- VIEW 4: Hospital Capacity Overview (Field Officer / Operator)
-- MySQL: WHERE h.is_active = TRUE → T-SQL: WHERE h.is_active = 1
-- ============================================================
CREATE OR ALTER VIEW vw_hospital_capacity AS
SELECT
    h.hospital_id,
    h.hospital_name,
    h.location,
    h.total_beds,
    h.available_beds,
    h.total_beds - h.available_beds                                              AS occupied_beds,
    ROUND(CAST(h.total_beds - h.available_beds AS FLOAT) / h.total_beds * 100, 2) AS occupancy_pct,
    CASE
        WHEN h.available_beds = 0  THEN 'Full'
        WHEN h.available_beds < 20 THEN 'Critical'
        WHEN h.available_beds < 50 THEN 'High Load'
        ELSE 'Available'
    END                                                                          AS capacity_status,
    COUNT(p.patient_id)                                                          AS current_patients,
    h.contact_phone,
    h.updated_at
FROM hospitals h
LEFT JOIN patients p ON p.hospital_id = h.hospital_id
                    AND p.status NOT IN ('Discharged','Deceased')
WHERE h.is_active = 1
GROUP BY
    h.hospital_id, h.hospital_name, h.location, h.total_beds,
    h.available_beds, h.contact_phone, h.updated_at;
GO

-- ============================================================
-- VIEW 5: Rescue Team Status Board (Emergency Operator)
-- ============================================================
CREATE OR ALTER VIEW vw_team_status AS
SELECT
    rt.team_id,
    rt.team_name,
    rt.team_type,
    rt.current_location,
    rt.availability,
    rt.member_count,
    er.report_id        AS current_report_id,
    er.location_desc    AS current_incident_location,
    er.severity_level   AS incident_severity,
    er.status           AS incident_status
FROM rescue_teams rt
LEFT JOIN emergency_reports er ON er.assigned_team_id = rt.team_id
                               AND er.status NOT IN ('Resolved','Closed');
GO

-- ============================================================
-- VIEW 6: MIS Reporting - Incident Statistics
-- TIMESTAMPDIFF(MINUTE, a, b) → DATEDIFF(MINUTE, a, b)
-- ============================================================
CREATE OR ALTER VIEW vw_incident_statistics AS
SELECT
    dt.type_name        AS disaster_type,
    er.severity_level,
    er.status,
    COUNT(*)            AS incident_count,
    MIN(er.reported_at) AS first_incident,
    MAX(er.reported_at) AS latest_incident,
    AVG(CAST(
        DATEDIFF(MINUTE, er.reported_at,
            CASE WHEN er.status IN ('Resolved','Closed') THEN er.updated_at
                 ELSE GETDATE() END)
        AS FLOAT))      AS avg_response_minutes
FROM emergency_reports er
JOIN disaster_types    dt ON dt.disaster_type_id = er.disaster_type_id
GROUP BY dt.type_name, er.severity_level, er.status;
GO

-- ============================================================
-- VIEW 7: Resource Allocation Pipeline (Warehouse Manager)
-- ============================================================
CREATE OR ALTER VIEW vw_resource_pipeline AS
SELECT
    rar.request_id,
    er.location_desc    AS incident_location,
    er.severity_level,
    w.warehouse_name,
    rt2.type_name       AS resource_name,
    rt2.unit,
    rar.requested_qty,
    rar.approved_qty,
    rar.status          AS request_status,
    u_req.full_name     AS requested_by,
    u_app.full_name     AS approved_by,
    rar.requested_at,
    rar.approved_at,
    rar.dispatched_at
FROM resource_requests rar
JOIN emergency_reports er   ON er.report_id          = rar.report_id
JOIN warehouses        w    ON w.warehouse_id         = rar.warehouse_id
JOIN resource_types    rt2  ON rt2.resource_type_id  = rar.resource_type_id
JOIN users             u_req ON u_req.user_id         = rar.requested_by
LEFT JOIN users        u_app ON u_app.user_id         = rar.approved_by;
GO

-- ============================================================
-- VIEW 8: Approval Workflow Tracker
-- TIMESTAMPDIFF(HOUR, a, b) → DATEDIFF(HOUR, a, b)
-- ============================================================
CREATE OR ALTER VIEW vw_approval_tracker AS
SELECT
    ar.approval_id,
    ar.request_type,
    ar.reference_id,
    ar.status,
    u_req.full_name     AS requested_by,
    u_app.full_name     AS approved_by,
    ar.requested_at,
    ar.decided_at,
    DATEDIFF(HOUR, ar.requested_at, COALESCE(ar.decided_at, GETDATE())) AS hours_pending,
    ar.comments
FROM approval_requests ar
JOIN users u_req         ON u_req.user_id = ar.requested_by
LEFT JOIN users u_app    ON u_app.user_id = ar.approved_by;
GO

-- ============================================================
-- VIEW 9: Donation Summary (Finance Officer)
-- ============================================================
CREATE OR ALTER VIEW vw_donation_summary AS
SELECT
    fc.category_name,
    ft.donor_name,
    SUM(ft.amount)           AS total_donated,
    COUNT(*)                 AS transaction_count,
    MIN(ft.transaction_date) AS first_donation,
    MAX(ft.transaction_date) AS latest_donation,
    ft.status
FROM financial_transactions ft
JOIN financial_categories fc ON fc.category_id = ft.category_id
WHERE fc.category_type = 'Income'
GROUP BY fc.category_name, ft.donor_name, ft.status;
GO

-- ============================================================
-- VIEW 10: Budget Utilization per Disaster Event
-- ============================================================
CREATE OR ALTER VIEW vw_budget_by_event AS
SELECT
    er.report_id,
    er.location_desc    AS incident,
    dt.type_name        AS disaster_type,
    er.severity_level,
    SUM(CASE WHEN fc.category_type = 'Expense' THEN ft.amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN fc.category_type = 'Income'  THEN ft.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN fc.category_type = 'Expense' THEN ft.amount ELSE 0 END)
  - SUM(CASE WHEN fc.category_type = 'Income'  THEN ft.amount ELSE 0 END) AS net_cost
FROM financial_transactions ft
JOIN emergency_reports    er ON er.report_id      = ft.report_id
JOIN disaster_types       dt ON dt.disaster_type_id = er.disaster_type_id
JOIN financial_categories fc ON fc.category_id    = ft.category_id
WHERE ft.status = 'Approved'
GROUP BY er.report_id, er.location_desc, dt.type_name, er.severity_level;
GO