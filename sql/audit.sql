CREATE TABLE audit_log (
    log_id INT IDENTITY PRIMARY KEY,
    action VARCHAR(100),
    table_name VARCHAR(50),
    timestamp DATETIME DEFAULT GETDATE()
);
CREATE TRIGGER trg_audit_reports
ON emergency_reports
AFTER INSERT
AS
BEGIN
  INSERT INTO audit_log (action, table_name)
  VALUES ('INSERT', 'emergency_reports');
END;