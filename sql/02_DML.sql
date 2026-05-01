-- ============================================================
-- Smart Disaster Response MIS - DML (Seed / Sample Data)
-- Converted: MySQL → T-SQL (SQL Server)
-- ============================================================
USE disaster_mis;
GO

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (role_name, description) VALUES
('Administrator',      'Full system access, user management, system configuration'),
('EmergencyOperator',  'Manages emergency reports, assigns teams, tracks incidents'),
('FieldOfficer',       'Updates field status, views assigned incidents'),
('WarehouseManager',   'Manages inventory, approves resource requests'),
('FinanceOfficer',     'Records and approves financial transactions');
GO

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO permissions (permission_name, description) VALUES
('view_reports',         'View emergency reports'),
('create_reports',       'Create emergency reports'),
('update_reports',       'Update report status'),
('delete_reports',       'Delete emergency reports'),
('manage_teams',         'Assign and manage rescue teams'),
('view_inventory',       'View warehouse inventory'),
('manage_inventory',     'Update inventory levels'),
('approve_resources',    'Approve resource distribution requests'),
('view_financials',      'View financial transactions'),
('manage_financials',    'Create and approve financial entries'),
('view_hospitals',       'View hospital data'),
('manage_hospitals',     'Update hospital bed/patient data'),
('manage_users',         'Create, edit, deactivate user accounts'),
('view_audit_logs',      'View system audit logs'),
('approve_workflows',    'Approve/reject workflow requests');
GO

-- ============================================================
-- ROLE-PERMISSION MAPPINGS
-- ============================================================
-- Administrator gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- EmergencyOperator
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions
WHERE permission_name IN ('view_reports','create_reports','update_reports',
                          'manage_teams','view_inventory','view_hospitals',
                          'approve_workflows');

-- FieldOfficer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions
WHERE permission_name IN ('view_reports','update_reports','view_inventory',
                          'view_hospitals','manage_hospitals');

-- WarehouseManager
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions
WHERE permission_name IN ('view_inventory','manage_inventory','approve_resources',
                          'view_reports','approve_workflows');

-- FinanceOfficer
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, permission_id FROM permissions
WHERE permission_name IN ('view_financials','manage_financials','approve_workflows',
                          'view_reports');
GO

-- ============================================================
-- USERS  (passwords are bcrypt of "Password123!")
-- ============================================================
INSERT INTO users (username, password_hash, full_name, email, phone, role_id) VALUES
('admin',     '$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'System Administrator', 'admin@disaster-mis.pk',         '+92-300-0000001', 1),
('op_ahmed',  '$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'Ahmed Khan',           'ahmed.khan@disaster-mis.pk',    '+92-300-1111111', 2),
('op_fatima', '$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'Fatima Malik',         'fatima.malik@disaster-mis.pk',  '+92-300-2222222', 2),
('field_ali', '$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'Ali Raza',             'ali.raza@disaster-mis.pk',      '+92-300-3333333', 3),
('field_sara','$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'Sara Hussain',         'sara.hussain@disaster-mis.pk',  '+92-300-4444444', 3),
('wm_tariq',  '$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'Tariq Mehmood',        'tariq.mehmood@disaster-mis.pk', '+92-300-5555555', 4),
('fin_nadia', '$2b$12$KIXqhZmzG7wqXREkO3rFiO1234567890abcdefghij', 'Nadia Iqbal',          'nadia.iqbal@disaster-mis.pk',   '+92-300-6666666', 5);
GO

-- ============================================================
-- DISASTER TYPES
-- ============================================================
INSERT INTO disaster_types (type_name, description) VALUES
('Flood',               'Overflow of water onto normally dry land'),
('Earthquake',          'Sudden ground shaking due to tectonic movement'),
('Urban Fire',          'Uncontrolled fire in urban/residential areas'),
('Landslide',           'Mass movement of rock and soil down a slope'),
('Cyclone',             'Tropical storm with high winds and heavy rain'),
('Drought',             'Extended period of insufficient rainfall'),
('Industrial Accident', 'Hazardous incidents at industrial facilities');
GO

-- ============================================================
-- RESCUE TEAMS
-- ============================================================
INSERT INTO rescue_teams (team_name, team_type, current_location, location_lat, location_lng, availability, member_count) VALUES
('Alpha Medical Unit',  'Medical', 'Islamabad Base Camp', 33.6844, 73.0479, 'Available', 8),
('Bravo Fire Squad',    'Fire',    'Rawalpindi Station',  33.5651, 73.0169, 'Available', 10),
('Charlie Rescue Team', 'Rescue',  'Lahore Ops Center',   31.5204, 74.3587, 'Available', 12),
('Delta Search Unit',   'Search',  'Karachi HQ',          24.8607, 67.0011, 'Assigned',  6),
('Echo Medical Unit',   'Medical', 'Peshawar Camp',       34.0151, 71.5249, 'Available', 7),
('Foxtrot Fire Squad',  'Fire',    'Quetta Base',         30.1798, 66.9750, 'Busy',      9),
('Golf Rescue Team',    'Rescue',  'Multan Center',       30.1575, 71.5249, 'Available', 11),
('Hotel Search Unit',   'Search',  'Faisalabad Station',  31.4504, 73.1350, 'Available', 5);
GO

-- ============================================================
-- WAREHOUSES
-- ============================================================
INSERT INTO warehouses (warehouse_name, location, manager_id) VALUES
('Islamabad Central Warehouse', 'G-10 Industrial Area, Islamabad', 6),
('Lahore Regional Depot',       'Kot Lakhpat, Lahore',             6),
('Karachi Supply Hub',          'SITE Area, Karachi',              6),
('Peshawar Emergency Store',    'Hayatabad Phase 5, Peshawar',     6);
GO

-- ============================================================
-- RESOURCE TYPES
-- ============================================================
INSERT INTO resource_types (type_name, unit, description) VALUES
('Food Packages',  'units',  'Ready-to-eat meal packages'),
('Drinking Water', 'liters', 'Bottled/purified water supply'),
('Medicines',      'units',  'Essential medicine kits and supplies'),
('Shelter Tents',  'units',  'Emergency shelter tents'),
('Blankets',       'units',  'Thermal blankets for cold areas'),
('First Aid Kits', 'units',  'Portable first-aid kits'),
('Generators',     'units',  'Portable power generators'),
('Body Bags',      'units',  'Disaster mortuary supplies');
GO

-- ============================================================
-- INVENTORY (warehouse × resource)
-- ============================================================
INSERT INTO inventory (warehouse_id, resource_type_id, quantity, threshold_level) VALUES
-- Islamabad
(1,1,5000,500),(1,2,20000,2000),(1,3,3000,300),(1,4,500,50),
(1,5,1000,100),(1,6,800,80),(1,7,20,5),(1,8,100,10),
-- Lahore
(2,1,4000,400),(2,2,15000,1500),(2,3,2500,250),(2,4,400,40),
(2,5,800,80),(2,6,600,60),(2,7,15,3),(2,8,80,8),
-- Karachi
(3,1,6000,600),(3,2,25000,2500),(3,3,3500,350),(3,4,600,60),
(3,5,1200,120),(3,6,1000,100),(3,7,25,5),(3,8,120,12),
-- Peshawar
(4,1,2000,200),(4,2,8000,800),(4,3,1500,150),(4,4,200,20),
(4,5,500,50),(4,6,400,40),(4,7,8,2),(4,8,40,4);
GO

-- ============================================================
-- HOSPITALS
-- ============================================================
INSERT INTO hospitals (hospital_name, location, location_lat, location_lng, total_beds, available_beds, contact_phone) VALUES
('PIMS Hospital Islamabad',        'Shifa Road, Islamabad', 33.7081, 73.0683, 500,  120, '+92-51-9261170'),
('Jinnah Hospital Lahore',         'Jail Road, Lahore',     31.5200, 74.3369, 800,  200, '+92-42-99203066'),
('Civil Hospital Karachi',         'Karachi City',          24.8608, 67.0104, 1200, 350, '+92-21-9215740'),
('Hayatabad Medical Complex',      'Peshawar',              34.0151, 71.5249, 600,  180, '+92-91-9217461'),
('Nishtar Hospital Multan',        'Multan City',           30.1575, 71.5249, 700,  150, '+92-61-9200030'),
('Combined Military Hospital Rwp', 'Rawalpindi Cantt',      33.5651, 73.0169, 400,   90, '+92-51-5600405');
GO

-- ============================================================
-- FINANCIAL CATEGORIES
-- ============================================================
INSERT INTO financial_categories (category_name, category_type) VALUES
('Donation - Individual',    'Income'),
('Donation - Corporate',     'Income'),
('Donation - International', 'Income'),
('Resource Procurement',     'Expense'),
('Team Operations',          'Expense'),
('Medical Expenses',         'Expense'),
('Logistics & Transport',    'Expense'),
('Infrastructure Repair',    'Expense');
GO

-- ============================================================
-- EMERGENCY REPORTS (sample)
-- ============================================================
INSERT INTO emergency_reports
  (citizen_name, citizen_phone, location_lat, location_lng, location_desc,
   disaster_type_id, severity_level, description, status, reported_by, assigned_team_id)
VALUES
('Muhammad Asif',   '+92-321-1234567', 33.6844, 73.0479, 'Sector G-9, Islamabad',
  1, 'High',     'Flood water entering residential areas',         'Assigned',   2, 1),
('Ayesha Siddiqui', '+92-333-2345678', 31.5204, 74.3587, 'Model Town, Lahore',
  3, 'Critical', 'Building fire spreading to adjacent structures', 'InProgress', 2, 2),
('Tariq Jameel',    '+92-312-3456789', 34.0151, 71.5249, 'Bara Road, Peshawar',
  2, 'Critical', 'Earthquake damage, people trapped under rubble', 'Assigned',   3, 5),
('Sana Mirza',      '+92-345-4567890', 24.8607, 67.0011, 'Korangi, Karachi',
  1, 'Medium',   'Street flooding blocking rescue routes',         'Pending',    3, NULL),
('Bilal Chaudhry',  '+92-301-5678901', 30.1798, 66.9750, 'Satellite Town, Quetta',
  4, 'High',     'Landslide blocking main highway, 2 cars buried', 'Assigned',   2, 7),
('Razia Bibi',      '+92-315-6789012', 30.1575, 71.5249, 'Old City, Multan',
  3, 'Low',      'Small kitchen fire, contained but smoke damage', 'Resolved',   4, NULL);
GO

-- ============================================================
-- RESOURCE ALLOCATION REQUESTS (sample)
-- MySQL: NOW() - INTERVAL n DAY → T-SQL: DATEADD(DAY, -n, GETDATE())
-- ============================================================
INSERT INTO resource_allocation_requests
  (report_id, warehouse_id, resource_type_id, requested_qty, approved_qty,
   status, requested_by, approved_by, requested_at, approved_at, notes)
VALUES
(1, 1, 1, 500,  500,  'Dispatched', 4, 6, DATEADD(DAY,-2,GETDATE()), DATEADD(DAY,-1,GETDATE()), 'Urgent flood relief'),
(1, 1, 2, 5000, 5000, 'Dispatched', 4, 6, DATEADD(DAY,-2,GETDATE()), DATEADD(DAY,-1,GETDATE()), 'Drinking water for 500 families'),
(2, 2, 3, 200,  150,  'Approved',   4, 6, DATEADD(DAY,-1,GETDATE()), GETDATE(),                  'Medical supplies for fire victims'),
(3, 4, 4, 100,  NULL, 'Pending',    4, NULL, GETDATE(),              NULL,                        'Tents for earthquake survivors'),
(5, 1, 5, 300,  300,  'Consumed',   4, 6, DATEADD(DAY,-3,GETDATE()), DATEADD(DAY,-2,GETDATE()), 'Blankets for landslide area');
GO

-- ============================================================
-- PATIENTS (sample)
-- ============================================================
INSERT INTO patients (full_name, age, gender, contact_phone, report_id, hospital_id, status) VALUES
('Muhammad Asif Jr.', 12, 'Male',   '+92-321-1234567', 1, 1, 'Admitted'),
('Fatima Asif',       35, 'Female', '+92-321-1234567', 1, 1, 'Stable'),
('Unknown Male 001',  45, 'Male',   NULL,              2, 2, 'Critical'),
('Raza Khan',         28, 'Male',   '+92-312-3456789', 3, 4, 'Critical'),
('Samina Akhtar',     50, 'Female', '+92-312-3456789', 3, 4, 'Admitted');
GO

-- ============================================================
-- FINANCIAL TRANSACTIONS (sample)
-- ============================================================
INSERT INTO financial_transactions
  (report_id, category_id, amount, description, reference_no, donor_name, recorded_by, approved_by, status)
VALUES
(NULL, 1, 500000.00,  'Individual donation from Lahore businessman',   'DON-2025-001', 'Arif Habib',      7, 1, 'Approved'),
(NULL, 2, 2000000.00, 'Corporate donation from XYZ Industries',        'DON-2025-002', 'XYZ Industries',  7, 1, 'Approved'),
(1,   4, 350000.00,   'Emergency food procurement for Islamabad flood', 'PRO-2025-001', NULL,              7, 1, 'Approved'),
(2,   5, 150000.00,   'Fire rescue team deployment costs',              'OPS-2025-001', NULL,              7, 1, 'Approved'),
(3,   6, 280000.00,   'Medical supplies for earthquake victims',        'MED-2025-001', NULL,              7, NULL,'Pending'),
(NULL, 3, 5000000.00, 'UNICEF international disaster relief fund',      'INT-2025-001', 'UNICEF Pakistan', 7, 1, 'Approved');
GO

-- ============================================================
-- APPROVAL REQUESTS (sample)
-- ============================================================
INSERT INTO approval_requests (request_type, reference_id, requested_by, approved_by, status, comments) VALUES
('ResourceDistribution', 3, 4, 6,    'Approved', 'Approved for 150 units medical supplies'),
('ResourceDistribution', 4, 4, NULL, 'Pending',  NULL),
('FinancialApproval',    5, 7, NULL, 'Pending',  'Awaiting finance officer sign-off'),
('RescueDeployment',     3, 2, 1,    'Approved', 'Team Echo deployed to Peshawar earthquake zone');
GO

-- ============================================================
-- TEAM ACTIVITY LOG (sample)
-- ============================================================
INSERT INTO team_activity_log (team_id, report_id, previous_status, new_status, changed_by, notes) VALUES
(1, 1, 'Available', 'Assigned', 2, 'Assigned to Islamabad flood response'),
(2, 2, 'Available', 'Assigned', 2, 'Assigned to Lahore fire incident'),
(2, 2, 'Assigned',  'Busy',     3, 'Team on site, active firefighting'),
(5, 3, 'Available', 'Assigned', 2, 'Deployed to Peshawar earthquake zone'),
(6, 5, 'Available', 'Busy',     2, 'Quetta landslide rescue operation'),
(7, 5, 'Available', 'Assigned', 2, 'Support team for Quetta landslide');
GO