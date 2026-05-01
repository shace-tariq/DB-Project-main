# DB-Project

============================================================
  Smart Disaster Response MIS
  Database Systems Project
  Deadline: 3rd May 2026
============================================================

CONTENTS OF THIS ZIP
---------------------
disaster_mis/
├── README.txt                      <- This file
├── ERD_DrawIO.xml                  <- ERD for draw.io (paste in Extras > Edit Diagram)
├── Design_Rationale.docx           <- Deliverable #10: Design Rationale Document
├── Normalization_Steps.docx        <- Deliverable #3: Normalization Steps
├── sql/
│   ├── 01_DDL.sql                  <- Deliverable #4a: Schema (DDL)
│   ├── 02_DML.sql                  <- Deliverable #4b: Sample Data (DML)
│   ├── 03_Triggers.sql             <- Deliverable #6: Trigger Implementation
│   ├── 04_Views.sql                <- Deliverable #7: View Definitions
│   └── 05_Indexes_Transactions_Queries.sql  <- Deliverables #5, #8: Stored Procedures,
│                                              Indexing, Performance Analysis, MIS Queries
└── frontend/
    ├── index.html                  <- Deliverable #9: Frontend (entry point)
    ├── css/
    │   └── style.css               <- Frontend styles
    └── js/
        └── app.js                  <- Full SPA application logic

HOW TO RUN THE DATABASE
-----------------------
1. Open MySQL 8.0+ (MySQL Workbench or CLI)
2. Run in order:
   SOURCE sql/01_DDL.sql;
   SOURCE sql/02_DML.sql;
   SOURCE sql/03_Triggers.sql;
   SOURCE sql/04_Views.sql;
   SOURCE sql/05_Indexes_Transactions_Queries.sql;

HOW TO RUN THE FRONTEND
------------------------
1. Open frontend/index.html in any modern browser
2. No server required - runs as a standalone SPA

LOGIN CREDENTIALS
-----------------
Username          Password      Role
---------         --------      ----
admin             admin123      Administrator
op_ahmed          ahmed123      Emergency Operator
field_ali         ali123        Field Officer
wm_tariq          tariq123      Warehouse Manager
fin_nadia         nadia123      Finance Officer

HOW TO IMPORT ERD INTO DRAW.IO
--------------------------------
1. Go to draw.io (diagrams.net)
2. Create a new diagram
3. Click Extras > Edit Diagram
4. Paste the contents of ERD_DrawIO.xml
5. Click OK

DATABASE: disaster_mis
MySQL 8.0+ required (uses JSON columns, ENUMs, Window Functions)

DELIVERABLES CHECKLIST
-----------------------
[x] 1. ERD Diagram          - ERD_DrawIO.xml
[x] 2. Relational Schema    - 01_DDL.sql (complete schema with PKs, FKs, constraints)
[x] 3. Normalization Steps  - Normalization_Steps.docx
[x] 4. SQL Implementation   - 01_DDL.sql + 02_DML.sql + queries in 05_...sql
[x] 5. Transaction Demo     - Stored procedures in 05_...sql with ROLLBACK handlers
[x] 6. Trigger Implementation - 03_Triggers.sql (8 triggers with use case docs)
[x] 7. View Definitions & Perf - 04_Views.sql (10 views + EXPLAIN analysis)
[x] 8. Indexing & Query Perf  - 05_...sql (20+ indexes + EXPLAIN comparisons)
[x] 9. Frontend Interface   - frontend/ (full SPA with charts, RBAC, all modules)
[x] 10. Design Rationale    - Design_Rationale.docx
[x] 11. MIS Reports/Dashboards - Built into frontend + analytical queries in 05_...sql