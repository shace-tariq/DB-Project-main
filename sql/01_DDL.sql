-- ============================================================
-- Smart Disaster Response MIS - DDL (Schema Definition)
-- Compatible with Microsoft SQL Server (T-SQL)
-- ============================================================

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'disaster_mis')
    DROP DATABASE disaster_mis;
GO
CREATE DATABASE disaster_mis;
GO

USE disaster_mis;
GO

-- ============================================================
-- 1. USERS & ROLE-BASED ACCESS CONTROL
-- ============================================================

CREATE TABLE roles (
    role_id     INT           IDENTITY(1,1) PRIMARY KEY,
    role_name   VARCHAR(50)   NOT NULL UNIQUE,
    description VARCHAR(MAX)
);

CREATE TABLE users (
    user_id       INT           IDENTITY(1,1) PRIMARY KEY,
    username      VARCHAR(100)  NOT NULL UNIQUE,
    password      VARCHAR(100)  NOT NULL,
    full_name     VARCHAR(150)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    phone         VARCHAR(20),
    role_id       INT           NOT NULL,
    is_active     BIT           DEFAULT 1,
    created_at    DATETIME      DEFAULT GETDATE(),
    last_login    DATETIME,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE permissions (
    permission_id   INT           IDENTITY(1,1) PRIMARY KEY,
    permission_name VARCHAR(100)  NOT NULL UNIQUE,
    description     VARCHAR(MAX)
);

CREATE TABLE role_permissions (
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(role_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);

-- ============================================================
-- 2. DISASTER / INCIDENT MANAGEMENT
-- ============================================================

CREATE TABLE disaster_types (
    disaster_type_id INT           IDENTITY(1,1) PRIMARY KEY,
    type_name        VARCHAR(100)  NOT NULL UNIQUE,
    description      VARCHAR(MAX)
);

CREATE TABLE emergency_reports (
    report_id        INT           IDENTITY(1,1) PRIMARY KEY,
    citizen_name     VARCHAR(150),
    citizen_phone    VARCHAR(20),
    location_lat     DECIMAL(10,7) NOT NULL,
    location_lng     DECIMAL(10,7) NOT NULL,
    location_desc    VARCHAR(255)  NOT NULL,
    disaster_type_id INT           NOT NULL,
    severity_level   VARCHAR(10)   NOT NULL CHECK (severity_level IN ('Low','Medium','High','Critical')),
    description      VARCHAR(MAX),
    status           VARCHAR(20)   DEFAULT 'Pending' CHECK (status IN ('Pending','Assigned','InProgress','Resolved','Closed')),
    reported_at      DATETIME      DEFAULT GETDATE(),
    updated_at       DATETIME      DEFAULT GETDATE(),
    reported_by      INT,
    assigned_team_id INT,
    FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(disaster_type_id),
    FOREIGN KEY (reported_by)      REFERENCES users(user_id)
);

-- ============================================================
-- 3. RESCUE TEAM MANAGEMENT
-- ============================================================

CREATE TABLE rescue_teams (
    team_id          INT           IDENTITY(1,1) PRIMARY KEY,
    team_name        VARCHAR(150)  NOT NULL,
    team_type        VARCHAR(20)   NOT NULL CHECK (team_type IN ('Medical','Fire','Rescue','Search')),
    current_location VARCHAR(255),
    location_lat     DECIMAL(10,7),
    location_lng     DECIMAL(10,7),
    availability     VARCHAR(20)   DEFAULT 'Available' CHECK (availability IN ('Available','Assigned','Busy','Completed')),
    member_count     INT           DEFAULT 0,
    created_at       DATETIME      DEFAULT GETDATE(),
    updated_at       DATETIME      DEFAULT GETDATE()
);

-- Add FK from emergency_reports to rescue_teams now that rescue_teams exists
ALTER TABLE emergency_reports
    ADD CONSTRAINT fk_report_team
    FOREIGN KEY (assigned_team_id) REFERENCES rescue_teams(team_id);

CREATE TABLE team_activity_log (
    log_id          INT           IDENTITY(1,1) PRIMARY KEY,
    team_id         INT           NOT NULL,
    report_id       INT,
    previous_status VARCHAR(50),
    new_status      VARCHAR(50),
    changed_by      INT,
    notes           VARCHAR(MAX),
    changed_at      DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (team_id)    REFERENCES rescue_teams(team_id),
    FOREIGN KEY (report_id)  REFERENCES emergency_reports(report_id),
    FOREIGN KEY (changed_by) REFERENCES users(user_id)
);

-- ============================================================
-- 4. WAREHOUSE & RESOURCE MANAGEMENT
-- ============================================================

CREATE TABLE warehouses (
    warehouse_id   INT           IDENTITY(1,1) PRIMARY KEY,
    warehouse_name VARCHAR(150)  NOT NULL,
    location       VARCHAR(255)  NOT NULL,
    manager_id     INT,
    created_at     DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (manager_id) REFERENCES users(user_id)
);

CREATE TABLE resource_types (
    resource_type_id INT           IDENTITY(1,1) PRIMARY KEY,
    type_name        VARCHAR(100)  NOT NULL UNIQUE,
    unit             VARCHAR(50)   NOT NULL,
    description      VARCHAR(MAX)
);

CREATE TABLE inventory (
    inventory_id     INT           IDENTITY(1,1) PRIMARY KEY,
    warehouse_id     INT           NOT NULL,
    resource_type_id INT           NOT NULL,
    quantity         DECIMAL(12,2) DEFAULT 0,
    threshold_level  DECIMAL(12,2) DEFAULT 0,
    last_updated     DATETIME      DEFAULT GETDATE(),
    CONSTRAINT uq_warehouse_resource UNIQUE (warehouse_id, resource_type_id),
    FOREIGN KEY (warehouse_id)     REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id)
);

CREATE TABLE resource_requests (
    request_id       INT           IDENTITY(1,1) PRIMARY KEY,
    report_id        INT           NOT NULL,
    warehouse_id     INT           NOT NULL,
    resource_type_id INT           NOT NULL,
    requested_qty    DECIMAL(12,2) NOT NULL,
    approved_qty     DECIMAL(12,2),
    status           VARCHAR(20)   DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Dispatched','Consumed')),
    requested_by     INT           NOT NULL,
    approved_by      INT,
    requested_at     DATETIME      DEFAULT GETDATE(),
    approved_at      DATETIME,
    dispatched_at    DATETIME,
    consumed_at      DATETIME,
    notes            VARCHAR(MAX),
    FOREIGN KEY (report_id)        REFERENCES emergency_reports(report_id),
    FOREIGN KEY (warehouse_id)     REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (resource_type_id) REFERENCES resource_types(resource_type_id),
    FOREIGN KEY (requested_by)     REFERENCES users(user_id),
    FOREIGN KEY (approved_by)      REFERENCES users(user_id)
);

-- ============================================================
-- 5. HOSPITAL COORDINATION
-- ============================================================

CREATE TABLE hospitals (
    hospital_id    INT           IDENTITY(1,1) PRIMARY KEY,
    hospital_name  VARCHAR(200)  NOT NULL,
    location       VARCHAR(255)  NOT NULL,
    location_lat   DECIMAL(10,7),
    location_lng   DECIMAL(10,7),
    total_beds     INT           NOT NULL DEFAULT 0,
    available_beds INT           NOT NULL DEFAULT 0,
    contact_phone  VARCHAR(20),
    is_active      BIT           DEFAULT 1,
    updated_at     DATETIME      DEFAULT GETDATE()
);

CREATE TABLE patients (
    patient_id     INT           IDENTITY(1,1) PRIMARY KEY,
    full_name      VARCHAR(150)  NOT NULL,
    age            INT,
    gender         VARCHAR(10)   CHECK (gender IN ('Male','Female','Other')),
    contact_phone  VARCHAR(20),
    report_id      INT,
    hospital_id    INT           NOT NULL,
    admission_date DATETIME      DEFAULT GETDATE(),
    discharge_date DATETIME,
    status         VARCHAR(20)   DEFAULT 'Admitted' CHECK (status IN ('Admitted','Critical','Stable','Discharged','Deceased')),
    notes          VARCHAR(MAX),
    FOREIGN KEY (report_id)   REFERENCES emergency_reports(report_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id)
);

-- ============================================================
-- 6. FINANCIAL MANAGEMENT
-- ============================================================

CREATE TABLE financial_categories (
    category_id   INT           IDENTITY(1,1) PRIMARY KEY,
    category_name VARCHAR(100)  NOT NULL UNIQUE,
    category_type VARCHAR(10)   NOT NULL CHECK (category_type IN ('Income','Expense'))
);

CREATE TABLE financial_transactions (
    transaction_id   INT           IDENTITY(1,1) PRIMARY KEY,
    report_id        INT,
    category_id      INT           NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,
    transaction_date DATETIME      DEFAULT GETDATE(),
    description      VARCHAR(MAX),
    reference_no     VARCHAR(100),
    donor_name       VARCHAR(150),
    recorded_by      INT           NOT NULL,
    approved_by      INT,
    status           VARCHAR(10)   DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    FOREIGN KEY (report_id)   REFERENCES emergency_reports(report_id),
    FOREIGN KEY (category_id) REFERENCES financial_categories(category_id),
    FOREIGN KEY (recorded_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

CREATE TABLE financial_audit_log (
    audit_id       INT           IDENTITY(1,1) PRIMARY KEY,
    transaction_id INT           NOT NULL,
    action         VARCHAR(50)   NOT NULL,
    performed_by   INT           NOT NULL,
    old_amount     DECIMAL(15,2),
    new_amount     DECIMAL(15,2),
    old_status     VARCHAR(50),
    new_status     VARCHAR(50),
    performed_at   DATETIME      DEFAULT GETDATE(),
    notes          VARCHAR(MAX),
    FOREIGN KEY (transaction_id) REFERENCES financial_transactions(transaction_id),
    FOREIGN KEY (performed_by)   REFERENCES users(user_id)
);

-- ============================================================
-- 7. APPROVAL WORKFLOWS
-- ============================================================

CREATE TABLE approval_requests (
    approval_id  INT           IDENTITY(1,1) PRIMARY KEY,
    request_type VARCHAR(30)   NOT NULL CHECK (request_type IN ('ResourceDistribution','RescueDeployment','FinancialApproval')),
    reference_id INT           NOT NULL,
    requested_by INT           NOT NULL,
    approved_by  INT,
    status       VARCHAR(10)   DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    requested_at DATETIME      DEFAULT GETDATE(),
    decided_at   DATETIME,
    comments     VARCHAR(MAX),
    FOREIGN KEY (requested_by) REFERENCES users(user_id),
    FOREIGN KEY (approved_by)  REFERENCES users(user_id)
);

-- ============================================================
-- 8. AUDIT & MONITORING
-- ============================================================

CREATE TABLE audit_logs (
    audit_log_id INT           IDENTITY(1,1) PRIMARY KEY,
    user_id      INT,
    action       VARCHAR(100)  NOT NULL,
    table_name   VARCHAR(100),
    record_id    INT,
    old_data     VARCHAR(MAX),
    new_data     VARCHAR(MAX),
    ip_address   VARCHAR(45),
    performed_at DATETIME      DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- 9. SYSTEM NOTIFICATIONS / ALERTS
-- ============================================================

CREATE TABLE system_alerts (
    alert_id   INT           IDENTITY(1,1) PRIMARY KEY,
    alert_type VARCHAR(100)  NOT NULL,
    message    VARCHAR(MAX)  NOT NULL,
    severity   VARCHAR(10)   DEFAULT 'Info' CHECK (severity IN ('Info','Warning','Critical')),
    is_read    BIT           DEFAULT 0,
    related_id INT,
    created_at DATETIME      DEFAULT GETDATE()
);