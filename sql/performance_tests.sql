-- WITHOUT INDEX
SET STATISTICS TIME ON;

SELECT * FROM emergency_reports WHERE severity_level = 5;

-- CREATE INDEX
CREATE INDEX idx_severity ON emergency_reports(severity_level);

-- WITH INDEX
SELECT * FROM emergency_reports WHERE severity_level = 5;

SET STATISTICS TIME OFF;