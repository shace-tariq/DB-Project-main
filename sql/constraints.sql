ALTER TABLE emergency_reports
ADD CONSTRAINT chk_severity 
CHECK (severity_level IN ('Low','Medium','High','Critical'));

ALTER TABLE emergency_reports
ADD CONSTRAINT chk_status CHECK (status IN ('Pending','Assigned','Resolved','Closed'));

ALTER TABLE rescue_teams
ADD CONSTRAINT chk_team_status CHECK (availability IN ('Available','Assigned','Busy','Completed'));

ALTER TABLE inventory
ADD CONSTRAINT chk_quantity CHECK (quantity >= 0);