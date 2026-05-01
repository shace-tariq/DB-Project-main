-- ============================================================
-- Smart Disaster Response MIS - TRIGGERS
-- Converted: MySQL → T-SQL (SQL Server)
-- Key changes:
--   • No DELIMITER $$ — T-SQL uses GO
--   • No FOR EACH ROW — T-SQL triggers fire once per statement, use inserted/deleted pseudo-tables
--   • SIGNAL SQLSTATE → RAISERROR or THROW
--   • NOW() → GETDATE()
--   • CONCAT() → string concatenation with + (CAST numerics to VARCHAR first)
--   • IF/ELSEIF → IF/ELSE
--   • MySQL multi-event triggers split into separate T-SQL triggers
-- ============================================================
USE disaster_mis;
GO

-- ============================================================
-- TRIGGER 1: Auto-deduct inventory when resource request dispatched
-- ============================================================
CREATE OR ALTER TRIGGER trg_inventory_deduct_on_dispatch
ON resource_allocation_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Only act on rows transitioning TO 'Dispatched'
    IF NOT EXISTS (
        SELECT 1 FROM inserted i
        JOIN deleted d ON d.request_id = i.request_id
        WHERE i.status = 'Dispatched' AND d.status <> 'Dispatched'
    ) RETURN;

    -- Deduct inventory for each dispatched row
    UPDATE inv
    SET    inv.quantity     = inv.quantity - i.approved_qty,
           inv.last_updated = GETDATE()
    FROM   inventory inv
    JOIN   inserted  i  ON  inv.warehouse_id     = i.warehouse_id
                        AND inv.resource_type_id  = i.resource_type_id
    JOIN   deleted   d  ON  d.request_id          = i.request_id
    WHERE  i.status = 'Dispatched' AND d.status <> 'Dispatched';

    -- Insert low-inventory alerts where quantity has dropped to/below threshold
    INSERT INTO system_alerts (alert_type, message, severity, related_id)
    SELECT 'LowInventory',
           'Inventory for resource_type_id ' + CAST(inv.resource_type_id AS VARCHAR) +
           ' in warehouse_id ' + CAST(inv.warehouse_id AS VARCHAR) +
           ' is now below threshold (' + CAST(inv.quantity AS VARCHAR) +
           ' ' + rt.unit + ' remaining).',
           'Warning',
           inv.warehouse_id
    FROM   inventory     inv
    JOIN   resource_types rt ON rt.resource_type_id = inv.resource_type_id
    JOIN   inserted       i  ON  i.warehouse_id      = inv.warehouse_id
                             AND i.resource_type_id  = inv.resource_type_id
    JOIN   deleted        d  ON  d.request_id        = i.request_id
    WHERE  i.status = 'Dispatched' AND d.status <> 'Dispatched'
      AND  inv.quantity <= inv.threshold_level;
END;
GO

-- ============================================================
-- TRIGGER 2: Prevent negative inventory
-- ============================================================
CREATE OR ALTER TRIGGER trg_prevent_negative_inventory
ON inventory
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM inserted WHERE quantity < 0)
    BEGIN
        RAISERROR('ERROR: Inventory quantity cannot fall below zero. Insufficient stock.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;
GO

-- ============================================================
-- TRIGGER 3a: Update rescue team availability when a team is assigned
-- ============================================================
CREATE OR ALTER TRIGGER trg_team_status_on_report_assign
ON emergency_reports
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Free old team when assignment changes
    UPDATE rt
    SET    rt.availability = 'Available',
           rt.updated_at  = GETDATE()
    FROM   rescue_teams rt
    JOIN   deleted      d ON d.assigned_team_id = rt.team_id
    JOIN   inserted     i ON i.report_id        = d.report_id
    WHERE  d.assigned_team_id IS NOT NULL
      AND  (i.assigned_team_id IS NULL OR i.assigned_team_id <> d.assigned_team_id);

    INSERT INTO team_activity_log (team_id, report_id, previous_status, new_status, notes)
    SELECT d.assigned_team_id, d.report_id, 'Assigned', 'Available',
           'Unassigned from report #' + CAST(d.report_id AS VARCHAR)
    FROM   deleted  d
    JOIN   inserted i ON i.report_id = d.report_id
    WHERE  d.assigned_team_id IS NOT NULL
      AND  (i.assigned_team_id IS NULL OR i.assigned_team_id <> d.assigned_team_id);

    -- Assign new team
    UPDATE rt
    SET    rt.availability = 'Assigned',
           rt.updated_at  = GETDATE()
    FROM   rescue_teams rt
    JOIN   inserted     i ON i.assigned_team_id = rt.team_id
    JOIN   deleted      d ON d.report_id        = i.report_id
    WHERE  i.assigned_team_id IS NOT NULL
      AND  (d.assigned_team_id IS NULL OR d.assigned_team_id <> i.assigned_team_id);

    INSERT INTO team_activity_log (team_id, report_id, previous_status, new_status, notes)
    SELECT i.assigned_team_id, i.report_id, 'Available', 'Assigned',
           'Assigned to report #' + CAST(i.report_id AS VARCHAR)
    FROM   inserted i
    JOIN   deleted  d ON d.report_id = i.report_id
    WHERE  i.assigned_team_id IS NOT NULL
      AND  (d.assigned_team_id IS NULL OR d.assigned_team_id <> i.assigned_team_id);

    -- Free team when report is Resolved/Closed
    UPDATE rt
    SET    rt.availability = 'Completed',
           rt.updated_at  = GETDATE()
    FROM   rescue_teams rt
    JOIN   inserted     i ON i.assigned_team_id = rt.team_id
    JOIN   deleted      d ON d.report_id        = i.report_id
    WHERE  i.status IN ('Resolved','Closed')
      AND  d.status NOT IN ('Resolved','Closed')
      AND  i.assigned_team_id IS NOT NULL;

    INSERT INTO team_activity_log (team_id, report_id, previous_status, new_status, notes)
    SELECT i.assigned_team_id, i.report_id, 'Busy', 'Completed',
           'Report #' + CAST(i.report_id AS VARCHAR) + ' marked as ' + i.status
    FROM   inserted i
    JOIN   deleted  d ON d.report_id = i.report_id
    WHERE  i.status IN ('Resolved','Closed')
      AND  d.status NOT IN ('Resolved','Closed')
      AND  i.assigned_team_id IS NOT NULL;
END;
GO

-- ============================================================
-- TRIGGER 4a: Log financial transactions on INSERT
-- ============================================================
CREATE OR ALTER TRIGGER trg_financial_audit_on_insert
ON financial_transactions
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO financial_audit_log (transaction_id, action, performed_by, new_amount, new_status, notes)
    SELECT i.transaction_id, 'Created', i.recorded_by, i.amount, i.status,
           'Transaction created: ' + i.description
    FROM   inserted i;
END;
GO

-- ============================================================
-- TRIGGER 4b: Log financial transactions on UPDATE
-- ============================================================
CREATE OR ALTER TRIGGER trg_financial_audit_on_update
ON financial_transactions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO financial_audit_log
        (transaction_id, action, performed_by, old_amount, new_amount, old_status, new_status, notes)
    SELECT
        i.transaction_id,
        CASE WHEN d.status <> i.status THEN 'StatusChanged' ELSE 'AmountModified' END,
        COALESCE(i.approved_by, i.recorded_by),
        d.amount, i.amount, d.status, i.status,
        'Changed from status=' + d.status + ' to ' + i.status
    FROM inserted i
    JOIN deleted  d ON d.transaction_id = i.transaction_id
    WHERE d.status <> i.status OR d.amount <> i.amount;
END;
GO

-- ============================================================
-- TRIGGER 5: Auto-update hospital available beds on patient admission
-- ============================================================
CREATE OR ALTER TRIGGER trg_hospital_beds_on_admit
ON patients
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE h
    SET    h.available_beds = h.available_beds - 1,
           h.updated_at    = GETDATE()
    FROM   hospitals h
    JOIN   inserted  i ON i.hospital_id = h.hospital_id
    WHERE  h.available_beds > 0;

    -- Alert if beds critically low
    INSERT INTO system_alerts (alert_type, message, severity, related_id)
    SELECT 'LowHospitalCapacity',
           h.hospital_name + ' has only ' + CAST(h.available_beds AS VARCHAR) + ' beds available!',
           'Critical',
           h.hospital_id
    FROM   hospitals h
    JOIN   inserted  i ON i.hospital_id = h.hospital_id
    WHERE  h.available_beds < 10;
END;
GO

-- ============================================================
-- TRIGGER 6: Release hospital bed on patient discharge
-- ============================================================
CREATE OR ALTER TRIGGER trg_hospital_beds_on_discharge
ON patients
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE h
    SET    h.available_beds = h.available_beds + 1,
           h.updated_at    = GETDATE()
    FROM   hospitals h
    JOIN   inserted  i ON i.hospital_id = h.hospital_id
    JOIN   deleted   d ON d.patient_id  = i.patient_id
    WHERE  i.status = 'Discharged' AND d.status <> 'Discharged';
END;
GO

-- ============================================================
-- TRIGGER 7: Audit log for emergency report updates
-- MySQL JSON_OBJECT() → T-SQL: build JSON string manually or use FOR JSON
-- ============================================================
CREATE OR ALTER TRIGGER trg_audit_emergency_report_update
ON emergency_reports
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, performed_at)
    SELECT
        'emergency_reports',
        i.report_id,
        'UPDATE',
        -- Build JSON manually (compatible with all SQL Server versions)
        '{"status":"' + d.status + '","severity_level":"' + d.severity_level +
        '","assigned_team_id":' + ISNULL(CAST(d.assigned_team_id AS VARCHAR),'null') + '}',
        '{"status":"' + i.status + '","severity_level":"' + i.severity_level +
        '","assigned_team_id":' + ISNULL(CAST(i.assigned_team_id AS VARCHAR),'null') + '}',
        GETDATE()
    FROM inserted i
    JOIN deleted  d ON d.report_id = i.report_id;
END;
GO

-- ============================================================
-- TRIGGER 8: Prevent resource dispatch without approval
-- ============================================================
CREATE OR ALTER TRIGGER trg_prevent_dispatch_without_approval
ON resource_allocation_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN deleted d ON d.request_id = i.request_id
        WHERE i.status = 'Dispatched' AND d.status = 'Pending'
    )
    BEGIN
        RAISERROR('ERROR: Resource cannot be dispatched without prior approval.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;
GO