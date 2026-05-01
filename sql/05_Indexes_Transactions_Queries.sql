-- ============================================================
-- Smart Disaster Response MIS - INDEXES & PERFORMANCE
-- Converted: MySQL → T-SQL (SQL Server)
-- Key changes:
--   • EXPLAIN → removed (use SET STATISTICS IO ON / execution plan in SSMS)
--   • DELIMITER $$ / CREATE PROCEDURE ... END$$ → standard T-SQL CREATE OR ALTER PROCEDURE
--   • START TRANSACTION / COMMIT / ROLLBACK → BEGIN TRAN / COMMIT / ROLLBACK
--   • DECLARE EXIT HANDLER FOR SQLEXCEPTION → TRY/CATCH
--   • SELECT ... INTO var → SELECT @var = col ...
--   • FOR UPDATE → not needed; SQL Server uses row locks with UPDLOCK hint
--   • SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = ... → THROW 50000, '...', 1
--   • NOW() → GETDATE()
--   • LAST_INSERT_ID() → SCOPE_IDENTITY()
--   • SET var = val → SET @var = val
--   • JSON_OBJECT() → manual JSON string concatenation
-- ============================================================
USE disaster_mis;
GO

-- ============================================================
-- INDEXING STRATEGY
-- ============================================================

-- Emergency Reports
CREATE INDEX idx_report_status          ON emergency_reports(status);
CREATE INDEX idx_report_severity        ON emergency_reports(severity_level);
CREATE INDEX idx_report_disaster_type   ON emergency_reports(disaster_type_id);
CREATE INDEX idx_report_reported_at     ON emergency_reports(reported_at);
CREATE INDEX idx_report_location        ON emergency_reports(location_lat, location_lng);
CREATE INDEX idx_report_team            ON emergency_reports(assigned_team_id);
CREATE INDEX idx_report_status_severity ON emergency_reports(status, severity_level);
CREATE INDEX idx_report_type_status     ON emergency_reports(disaster_type_id, status);

-- Rescue Teams
CREATE INDEX idx_team_availability      ON rescue_teams(availability);
CREATE INDEX idx_team_type              ON rescue_teams(team_type, availability);

-- Inventory
CREATE INDEX idx_inventory_stock        ON inventory(warehouse_id, resource_type_id);
CREATE INDEX idx_inventory_threshold    ON inventory(quantity, threshold_level);

-- Resource Requests
CREATE INDEX idx_alloc_status           ON resource_allocation_requests(status);
CREATE INDEX idx_alloc_requested_at     ON resource_allocation_requests(requested_at);
CREATE INDEX idx_alloc_report           ON resource_allocation_requests(report_id);
CREATE INDEX idx_alloc_warehouse        ON resource_allocation_requests(warehouse_id, resource_type_id);

-- Financial Transactions
CREATE INDEX idx_fin_transaction_date   ON financial_transactions(transaction_date);
CREATE INDEX idx_fin_status             ON financial_transactions(status);
CREATE INDEX idx_fin_category           ON financial_transactions(category_id);
CREATE INDEX idx_fin_report             ON financial_transactions(report_id);
CREATE INDEX idx_fin_date_status        ON financial_transactions(transaction_date, status);

-- Patients
CREATE INDEX idx_patient_status         ON patients(status);
CREATE INDEX idx_patient_hospital       ON patients(hospital_id, status);

-- Audit Logs
CREATE INDEX idx_audit_table            ON audit_logs(table_name);
CREATE INDEX idx_audit_performed_at     ON audit_logs(performed_at);
CREATE INDEX idx_audit_user             ON audit_logs(user_id);
GO

-- ============================================================
-- PERFORMANCE ANALYSIS QUERIES
-- T-SQL: use SET STATISTICS IO ON + execution plans instead of EXPLAIN
-- ============================================================

-- Query A: Active critical incidents (benefits from idx_report_status_severity)
SET STATISTICS IO ON;
SELECT report_id, location_desc, severity_level, reported_at
FROM   emergency_reports
WHERE  status = 'Pending'
  AND  severity_level = 'Critical';
SET STATISTICS IO OFF;
GO

-- Query B: Low-stock inventory check (benefits from idx_inventory_threshold)
SET STATISTICS IO ON;
SELECT w.warehouse_name, rt.type_name, i.quantity, i.threshold_level
FROM   inventory i
JOIN   warehouses     w  ON w.warehouse_id     = i.warehouse_id
JOIN   resource_types rt ON rt.resource_type_id = i.resource_type_id
WHERE  i.quantity <= i.threshold_level;
SET STATISTICS IO OFF;
GO

-- Query C: Financial transactions in date range (benefits from idx_fin_date_status)
-- MySQL: NOW() - INTERVAL 30 DAY → T-SQL: DATEADD(DAY, -30, GETDATE())
SET STATISTICS IO ON;
SELECT transaction_id, amount, status, transaction_date
FROM   financial_transactions
WHERE  transaction_date BETWEEN DATEADD(DAY, -30, GETDATE()) AND GETDATE()
  AND  status = 'Approved';
SET STATISTICS IO OFF;
GO

-- Query D: Available Medical teams (benefits from idx_team_type)
SET STATISTICS IO ON;
SELECT team_id, team_name, current_location
FROM   rescue_teams
WHERE  team_type    = 'Medical'
  AND  availability = 'Available';
SET STATISTICS IO OFF;
GO

-- ============================================================
-- STORED PROCEDURE 1: Approve and dispatch resource allocation
-- ============================================================
CREATE OR ALTER PROCEDURE sp_approve_and_dispatch_resource
    @p_request_id   INT,
    @p_approved_qty DECIMAL(12,2),
    @p_approver_id  INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_warehouse_id  INT;
    DECLARE @v_resource_type INT;
    DECLARE @v_available_qty DECIMAL(12,2);

    BEGIN TRY
        BEGIN TRAN;

        -- Lock and read the pending request
        SELECT @v_warehouse_id  = warehouse_id,
               @v_resource_type = resource_type_id
        FROM   resource_allocation_requests WITH (UPDLOCK, ROWLOCK)
        WHERE  request_id = @p_request_id
          AND  status     = 'Pending';

        IF @v_warehouse_id IS NULL
        BEGIN
            THROW 50001, 'Request not found or not in Pending status.', 1;
        END;

        -- Check inventory availability
        SELECT @v_available_qty = quantity
        FROM   inventory WITH (UPDLOCK, ROWLOCK)
        WHERE  warehouse_id     = @v_warehouse_id
          AND  resource_type_id = @v_resource_type;

        IF @v_available_qty < @p_approved_qty
        BEGIN
            THROW 50002, 'Insufficient inventory for this allocation.', 1;
        END;

        -- Approve
        UPDATE resource_allocation_requests
        SET    status       = 'Approved',
               approved_qty = @p_approved_qty,
               approved_by  = @p_approver_id,
               approved_at  = GETDATE()
        WHERE  request_id   = @p_request_id;

        -- Dispatch (trigger trg_inventory_deduct_on_dispatch fires here)
        UPDATE resource_allocation_requests
        SET    status        = 'Dispatched',
               dispatched_at = GETDATE()
        WHERE  request_id    = @p_request_id;

        -- Record approval workflow
        INSERT INTO approval_requests
            (request_type, reference_id, requested_by, approved_by, status, decided_at)
        SELECT 'ResourceDistribution', @p_request_id, requested_by,
               @p_approver_id, 'Approved', GETDATE()
        FROM   resource_allocation_requests
        WHERE  request_id = @p_request_id;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- STORED PROCEDURE 2: Assign rescue team to an incident
-- ============================================================
CREATE OR ALTER PROCEDURE sp_assign_rescue_team
    @p_report_id   INT,
    @p_team_id     INT,
    @p_operator_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_team_status VARCHAR(50);

    BEGIN TRY
        BEGIN TRAN;

        -- Lock and read team availability
        SELECT @v_team_status = availability
        FROM   rescue_teams WITH (UPDLOCK, ROWLOCK)
        WHERE  team_id = @p_team_id;

        IF @v_team_status NOT IN ('Available','Completed')
        BEGIN
            THROW 50003, 'Team is not available for assignment.', 1;
        END;

        -- Update report (triggers handle team status update + activity log)
        UPDATE emergency_reports
        SET    assigned_team_id = @p_team_id,
               status           = 'Assigned',
               updated_at       = GETDATE()
        WHERE  report_id        = @p_report_id;

        -- Audit log
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (
            @p_operator_id,
            'ASSIGN_TEAM',
            'emergency_reports',
            @p_report_id,
            '{"team_id":' + CAST(@p_team_id AS VARCHAR) +
            ',"operator":' + CAST(@p_operator_id AS VARCHAR) + '}'
        );

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- STORED PROCEDURE 3: Record financial transaction with approval workflow
-- ============================================================
CREATE OR ALTER PROCEDURE sp_record_financial_transaction
    @p_report_id    INT,
    @p_category_id  INT,
    @p_amount       DECIMAL(15,2),
    @p_description  NVARCHAR(MAX),
    @p_reference_no VARCHAR(100),
    @p_donor_name   VARCHAR(150),
    @p_recorded_by  INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_txn_id INT;

    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO financial_transactions
            (report_id, category_id, amount, description, reference_no, donor_name, recorded_by, status)
        VALUES
            (@p_report_id, @p_category_id, @p_amount, @p_description,
             @p_reference_no, @p_donor_name, @p_recorded_by, 'Pending');

        -- T-SQL: SCOPE_IDENTITY() replaces LAST_INSERT_ID()
        SET @v_txn_id = CAST(SCOPE_IDENTITY() AS INT);

        -- Create approval workflow entry
        INSERT INTO approval_requests (request_type, reference_id, requested_by, status)
        VALUES ('FinancialApproval', @v_txn_id, @p_recorded_by, 'Pending');

        -- Audit log (trigger trg_financial_audit_on_insert also fires)
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (
            @p_recorded_by,
            'CREATE_TRANSACTION',
            'financial_transactions',
            @v_txn_id,
            '{"amount":' + CAST(@p_amount AS VARCHAR) +
            ',"category_id":' + CAST(@p_category_id AS VARCHAR) + '}'
        );

        COMMIT TRAN;

        -- Return new transaction ID
        SELECT @v_txn_id AS new_transaction_id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
GO

-- ============================================================
-- STORED PROCEDURE 4: Rollback demo - insufficient stock
-- ============================================================
CREATE OR ALTER PROCEDURE sp_test_rollback_insufficient_stock
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRAN;

        -- Attempt to set inventory to -9999 (trigger trg_prevent_negative_inventory will reject)
        UPDATE inventory
        SET    quantity = -9999
        WHERE  inventory_id = 1;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRAN;
        SELECT 'ROLLBACK EXECUTED: Insufficient stock - transaction reversed' AS result;
    END CATCH;
END;
GO

-- ============================================================
-- VIEW vs DIRECT TABLE QUERY - PERFORMANCE COMPARISON
-- Use SSMS: Query → Include Actual Execution Plan (Ctrl+M)
-- ============================================================

-- Test 1: Using VIEW
-- SELECT * FROM vw_active_incidents WHERE severity_level = 'Critical';

-- Test 2: Direct table query equivalent
-- SELECT er.report_id, er.citizen_name, dt.type_name, er.severity_level, er.status,
--        rt.team_name, u.full_name
-- FROM   emergency_reports er
-- JOIN   disaster_types dt ON dt.disaster_type_id = er.disaster_type_id
-- LEFT JOIN rescue_teams rt ON rt.team_id = er.assigned_team_id
-- LEFT JOIN users u ON u.user_id = er.reported_by
-- WHERE  er.severity_level = 'Critical'
--   AND  er.status NOT IN ('Resolved','Closed');

-- ============================================================
-- MIS ANALYTICAL QUERIES
-- ============================================================

-- 1. Incident count by disaster type and severity
SELECT disaster_type, severity_level, incident_count, avg_response_minutes
FROM   vw_incident_statistics
ORDER  BY incident_count DESC;
GO

-- 2. Response time analytics
-- TIMESTAMPDIFF(MINUTE, a, b) → DATEDIFF(MINUTE, a, b)
SELECT
    dt.type_name AS disaster_type,
    AVG(CAST(DATEDIFF(MINUTE, er.reported_at, er.updated_at) AS FLOAT)) AS avg_resolution_min,
    MIN(DATEDIFF(MINUTE, er.reported_at, er.updated_at))                 AS min_resolution_min,
    MAX(DATEDIFF(MINUTE, er.reported_at, er.updated_at))                 AS max_resolution_min,
    COUNT(*) AS resolved_count
FROM emergency_reports er
JOIN disaster_types dt ON dt.disaster_type_id = er.disaster_type_id
WHERE er.status IN ('Resolved','Closed')
GROUP BY dt.type_name;
GO

-- 3. Financial summary by category type
SELECT
    fc.category_type,
    fc.category_name,
    SUM(ft.amount)  AS total_amount,
    COUNT(*)        AS transaction_count,
    AVG(ft.amount)  AS avg_amount
FROM financial_transactions ft
JOIN financial_categories fc ON fc.category_id = ft.category_id
WHERE ft.status = 'Approved'
GROUP BY fc.category_type, fc.category_name
ORDER BY fc.category_type, total_amount DESC;
GO

-- 4. Resource utilization: dispatched vs consumed
SELECT
    rt.type_name AS resource,
    SUM(CASE WHEN rar.status = 'Dispatched' THEN rar.approved_qty ELSE 0 END) AS dispatched,
    SUM(CASE WHEN rar.status = 'Consumed'   THEN rar.approved_qty ELSE 0 END) AS consumed,
    COUNT(*) AS total_requests
FROM resource_allocation_requests rar
JOIN resource_types rt ON rt.resource_type_id = rar.resource_type_id
GROUP BY rt.type_name;
GO

-- 5. Approval workflow efficiency
-- TIMESTAMPDIFF(HOUR, a, b) → DATEDIFF(HOUR, a, b)
SELECT
    request_type,
    status,
    COUNT(*) AS [count],
    AVG(CAST(DATEDIFF(HOUR, requested_at, COALESCE(decided_at, GETDATE())) AS FLOAT)) AS avg_hours_to_decide
FROM approval_requests
GROUP BY request_type, status;
GO

-- 6. Hospital occupancy report
SELECT hospital_name, total_beds, available_beds, occupancy_pct, capacity_status
FROM   vw_hospital_capacity
ORDER  BY occupancy_pct DESC;
GO

-- 7. Team performance: assignments per team
SELECT
    rt.team_name,
    rt.team_type,
    rt.availability,
    COUNT(tal.log_id)                                                     AS total_activities,
    SUM(CASE WHEN tal.new_status = 'Assigned'  THEN 1 ELSE 0 END)        AS assignments,
    SUM(CASE WHEN tal.new_status = 'Completed' THEN 1 ELSE 0 END)        AS completions
FROM rescue_teams rt
LEFT JOIN team_activity_log tal ON tal.team_id = rt.team_id
GROUP BY rt.team_id, rt.team_name, rt.team_type, rt.availability;
GO