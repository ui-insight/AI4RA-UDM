-- UDM Testing SQL
-- This file contains test INSERT and SELECT statements to verify schema integrity
-- Run in fresh test_db/ only - see udm_testing.md for protocol

-- Clean up any existing test data (not needed if using fresh database per protocol)
DELETE FROM ActivityLog;
DELETE FROM Effort;
DELETE FROM ConflictOfInterest;
DELETE FROM ComplianceRequirement;
DELETE FROM Document;
DELETE FROM AwardDeliverable;
DELETE FROM Invoice;
DELETE FROM Transaction;
DELETE FROM IndirectRate;
DELETE FROM FinanceCode;
DELETE FROM ActivityCode;
DELETE FROM Account;
DELETE FROM Fund;
DELETE FROM CostShare;
DELETE FROM Subaward;
DELETE FROM AwardBudget;
DELETE FROM AwardBudgetPeriod;
DELETE FROM Terms;
DELETE FROM Modification;
DELETE FROM Award;
DELETE FROM ProposalBudget;
DELETE FROM Proposal;
DELETE FROM RFA;
DELETE FROM ProjectRole;
DELETE FROM Project;
DELETE FROM ContactDetails;
DELETE FROM Personnel;
DELETE FROM Organization;
DELETE FROM BudgetCategory;
DELETE FROM AllowedValues;

-- ========================================
-- 1. Test AllowedValues (foundation table)
-- ========================================
INSERT INTO AllowedValues (Allowed_Value_Group, Allowed_Value_Code, Allowed_Value_Label, Allowed_Value_Description, Display_Order) VALUES
('OrgType', 'DEPT', 'Department', 'Academic or administrative department', 1),
('OrgType', 'COLLEGE', 'College', 'College within the university', 2),
('OrgType', 'SPONSOR', 'Sponsor', 'External funding organization', 3),
('PersonType', 'FACULTY', 'Faculty', 'Faculty member', 1),
('PersonType', 'STAFF', 'Staff', 'Staff member', 2),
('PersonType', 'STUDENT', 'Student', 'Student', 3),
('ContactType', 'EMAIL', 'Email', 'Email address', 1),
('ContactType', 'PHONE', 'Phone', 'Phone number', 2),
('ProjectRole', 'PI', 'Principal Investigator', 'Lead investigator on the project', 1),
('ProjectRole', 'CO_PI', 'Co-Principal Investigator', 'Co-lead investigator', 2),
('ProjectRole', 'KEY', 'Key Personnel', 'Key personnel on the project', 3),
('FundType', 'GRANT', 'Grant Fund', 'Grant funding', 1),
('FundType', 'CONTRACT', 'Contract Fund', 'Contract funding', 2);

SELECT 'AllowedValues Test' as test_name, COUNT(*) as inserted_rows FROM AllowedValues;

-- ========================================
-- 2. Test Organization
-- ========================================
INSERT INTO Organization (Organization_ID, Organization_Name, Organization_Type, Parent_Organization_ID, UEI) VALUES
('UNI001', 'University of Idaho', 'College', NULL, '123456789012'),
('DEPT001', 'Computer Science', 'Department', 'UNI001', NULL),
('SPONSOR001', 'National Science Foundation', 'Sponsor', NULL, '987654321098'),
('SUB001', 'Test Subrecipient Org', 'Subrecipient', NULL, '111222333444');

SELECT 'Organization Test' as test_name, COUNT(*) as inserted_rows FROM Organization;
SELECT 'Organization Hierarchy Test' as test_name, o.Organization_Name as org, p.Organization_Name as parent
FROM Organization o
LEFT JOIN Organization p ON o.Parent_Organization_ID = p.Organization_ID;

-- ========================================
-- 3. Test Personnel
-- ========================================
INSERT INTO Personnel (Personnel_ID, ORCID, First_Name, Last_Name, Middle_Name, Institutional_ID, Primary_Email, Person_Type, Department_Organization_ID) VALUES
('PER001', '0000-0001-2345-6789', 'Jane', 'Doe', 'A', 'EMP001', 'jane.doe@uidaho.edu', 'Faculty', 'DEPT001'),
('PER002', '0000-0002-3456-7890', 'John', 'Smith', 'B', 'EMP002', 'john.smith@uidaho.edu', 'Faculty', 'DEPT001'),
('PER003', NULL, 'Alice', 'Johnson', NULL, 'EMP003', 'alice.j@uidaho.edu', 'Staff', 'DEPT001');

SELECT 'Personnel Test' as test_name, COUNT(*) as inserted_rows FROM Personnel;

-- ========================================
-- 4. Test ContactDetails
-- ========================================
INSERT INTO ContactDetails (Personnel_ID, AllowedValue_ID, ContactDetails_Value, Is_Primary) VALUES
('PER001', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'EMAIL' AND Allowed_Value_Group = 'ContactType'), 'jane.doe@uidaho.edu', TRUE),
('PER001', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'PHONE' AND Allowed_Value_Group = 'ContactType'), '208-555-1234', FALSE),
('PER002', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'EMAIL' AND Allowed_Value_Group = 'ContactType'), 'john.smith@uidaho.edu', TRUE);

SELECT 'ContactDetails Test' as test_name, COUNT(*) as inserted_rows FROM ContactDetails;

-- ========================================
-- 5. Test Project
-- ========================================
INSERT INTO Project (Project_ID, Project_Title, Acronym, Project_Type, Abstract, Start_Date, End_Date, Lead_Organization_ID, Project_Status) VALUES
('PROJ001', 'Advanced AI Research Initiative', 'AIRI', 'Research', 'Research in artificial intelligence and machine learning', '2024-01-01', '2026-12-31', 'DEPT001',  'Active'),
('PROJ002', 'Graduate Training Program', 'GTP', 'Training', 'Graduate student training in computer science', '2024-06-01', '2027-05-31', 'DEPT001',  'Active');

SELECT 'Project Test' as test_name, COUNT(*) as inserted_rows FROM Project;

-- ========================================
-- 6. Test RFA
-- ========================================
INSERT INTO RFA (RFA_ID, Sponsor_Organization_ID, RFA_Number, RFA_Title, Program_Code, CFDA_Number) VALUES
('RFA001', 'SPONSOR001', 'NSF-24-001', 'Computer and Information Science and Engineering Core Programs', 'CISE-CORE', '47.070'),
('RFA002', 'SPONSOR001', 'NSF-24-002', 'Graduate Research Fellowship Program', 'GRFP', '47.076');

SELECT 'RFA Test' as test_name, COUNT(*) as inserted_rows FROM RFA;

-- ========================================
-- 7. Test Proposal
-- ========================================
INSERT INTO Proposal (Proposal_ID, Proposal_Number, Proposal_Title, Project_ID, Sponsor_Organization_ID, RFA_ID, Proposed_Start_Date, Proposed_End_Date, Total_Proposed_Direct, Total_Proposed_Indirect, Total_Proposed_Budget, Submission_Deadline, Internal_Approval_Status, Decision_Status) VALUES
('PROP001', 'UI-2024-001', 'Advanced AI Research Initiative', 'PROJ001', 'SPONSOR001', 'RFA001', '2024-01-01', '2026-12-31', 450000.00, 150000.00, 600000.00, '2023-11-15', 'Approved',  'Submitted'),
('PROP002', 'UI-2024-002', 'Graduate Training Program', 'PROJ002', 'SPONSOR001', 'RFA002', '2024-06-01', '2027-05-31', 300000.00, 100000.00, 400000.00, '2023-12-01', 'Approved',  'Awarded');

SELECT 'Proposal Test' as test_name, COUNT(*) as inserted_rows FROM Proposal;

-- ========================================
-- 8. Test BudgetCategory
-- ========================================
INSERT INTO BudgetCategory (Category_Code, Category_Name, Category_Description, Display_Order) VALUES
('A', 'Senior Personnel', 'Senior/key person salaries and wages', 1),
('B', 'Other Personnel', 'Other direct personnel costs', 2),
('C', 'Fringe Benefits', 'Fringe benefits for personnel', 3),
('D', 'Equipment', 'Equipment purchases over $5,000', 4),
('E', 'Travel', 'Domestic and foreign travel', 5),
('F', 'Participant Support', 'Participant support costs', 6),
('G', 'Other Direct Costs', 'Materials, supplies, services', 7),
('H', 'Indirect Costs', 'F&A/overhead costs', 8);

SELECT 'BudgetCategory Test' as test_name, COUNT(*) as inserted_rows FROM BudgetCategory;

-- ========================================
-- 9. Test ProposalBudget
-- ========================================
INSERT INTO ProposalBudget (Proposal_ID, Period_Number, BudgetCategory_ID, Line_Item_Description, Direct_Cost, Indirect_Cost, Total_Cost) VALUES
('PROP001', 1, (SELECT BudgetCategory_ID FROM BudgetCategory WHERE Category_Code = 'A'), 'PI Salary - J. Doe', 80000.00, 26666.67, 106666.67),
('PROP001', 1, (SELECT BudgetCategory_ID FROM BudgetCategory WHERE Category_Code = 'B'), 'Graduate Student', 30000.00, 10000.00, 40000.00),
('PROP001', 1, (SELECT BudgetCategory_ID FROM BudgetCategory WHERE Category_Code = 'D'), 'Computing Equipment', 50000.00, 0.00, 50000.00);

SELECT 'ProposalBudget Test' as test_name, COUNT(*) as inserted_rows FROM ProposalBudget;

-- ========================================
-- 10. Test Award
-- ========================================
INSERT INTO Award (Award_ID, Award_Number, Award_Title, Project_ID, Sponsor_Organization_ID, RFA_ID, Proposal_ID, Original_Start_Date, Original_End_Date, Current_Total_Funded, Current_End_Date, Award_Status) VALUES
('AWD001', 'NSF-2024-12345', 'Advanced AI Research Initiative', 'PROJ001', 'SPONSOR001', 'RFA001', 'PROP001', '2024-01-01', '2026-12-31', 600000.00, '2026-12-31',  'Active'),
('AWD002', 'NSF-2024-67890', 'Graduate Training Program', 'PROJ002', 'SPONSOR001', 'RFA002', 'PROP002', '2024-06-01', '2027-05-31', 400000.00, '2027-05-31',  'Active');

SELECT 'Award Test' as test_name, COUNT(*) as inserted_rows FROM Award;

-- ========================================
-- 11. Test Modification
-- ========================================
INSERT INTO Modification (Modification_ID, Award_ID, Modification_Number, Event_Type, Effective_Date, Funding_Amount_Change, New_End_Date, Change_Description, Requires_Prior_Approval, Approval_Status) VALUES
('MOD001', 'AWD001', '001', 'Initial Award', '2024-01-01', 600000.00, NULL, 'Initial award funding', FALSE,  'Not Required'),
('MOD002', 'AWD001', '002', 'Incremental Funding', '2024-06-01', 50000.00, NULL, 'Additional funding for Year 2', FALSE,  'Approved');

SELECT 'Modification Test' as test_name, COUNT(*) as inserted_rows FROM Modification;

-- ========================================
-- 11. Test Terms
-- ========================================
INSERT INTO Terms (Award_ID, Payment_Method, Invoicing_Frequency, Invoice_Submission_Days, Reporting_Requirements, Record_Retention_Years) VALUES
('AWD001', 'Reimbursement', 'Quarterly', 30, 'Annual progress reports required', 3),
('AWD002', 'Advance', 'Annual', 45, 'Annual and final reports required', 5);

SELECT 'Terms Test' as test_name, COUNT(*) as inserted_rows FROM Terms;

-- ========================================
-- 12. Test AwardBudgetPeriod
-- ========================================
INSERT INTO AwardBudgetPeriod (Award_ID, Period_Number, Start_Date, End_Date, Direct_Costs, Indirect_Costs, Total_Costs, Cost_Share_Amount, Period_Status) VALUES
('AWD001', 1, '2024-01-01', '2024-12-31', 150000.00, 50000.00, 200000.00, 0.00, 'Active'),
('AWD001', 2, '2025-01-01', '2025-12-31', 150000.00, 50000.00, 200000.00, 0.00, 'Pending'),
('AWD001', 3, '2026-01-01', '2026-12-31', 150000.00, 50000.00, 200000.00, 0.00, 'Pending');

SELECT 'AwardBudgetPeriod Test' as test_name, COUNT(*) as inserted_rows FROM AwardBudgetPeriod;

-- ========================================
-- 13. Test AwardBudget
-- ========================================
INSERT INTO AwardBudget (Award_ID, AwardBudgetPeriod_ID, BudgetCategory_ID, Line_Item_Description, Approved_Direct_Cost, Approved_Indirect_Cost, Approved_Total_Cost, Current_Direct_Cost, Current_Indirect_Cost, Current_Total_Cost) VALUES
('AWD001', (SELECT AwardBudgetPeriod_ID FROM AwardBudgetPeriod WHERE Award_ID = 'AWD001' AND Period_Number = 1), (SELECT BudgetCategory_ID FROM BudgetCategory WHERE Category_Code = 'A'), 'PI Salary', 80000.00, 26666.67, 106666.67, 80000.00, 26666.67, 106666.67),
('AWD001', (SELECT AwardBudgetPeriod_ID FROM AwardBudgetPeriod WHERE Award_ID = 'AWD001' AND Period_Number = 1), (SELECT BudgetCategory_ID FROM BudgetCategory WHERE Category_Code = 'D'), 'Computing Equipment', 50000.00, 0.00, 50000.00, 50000.00, 0.00, 50000.00);

SELECT 'AwardBudget Test' as test_name, COUNT(*) as inserted_rows FROM AwardBudget;

-- ========================================
-- 14. Test Subaward
-- ========================================
INSERT INTO Subaward (Subaward_ID, Prime_Award_ID, Subrecipient_Organization_ID, Subaward_Number, Subaward_Amount, Start_Date, End_Date, Subaward_Status, PI_Name, Risk_Level) VALUES
('SUB001', 'AWD001', 'SUB001', 'UI-SUB-2024-001', 100000.00, '2024-03-01', '2026-02-28', 'Active', 'Dr. Bob Williams',  'Low');

SELECT 'Subaward Test' as test_name, COUNT(*) as inserted_rows FROM Subaward;

-- ========================================
-- 15. Test CostShare
-- ========================================
INSERT INTO CostShare (Award_ID, Committed_Amount, Commitment_Type, Source_Organization_ID, Source_Description, Is_Mandatory, CostShare_Status, Met_Amount) VALUES
('AWD001', 25000.00, 'In-Kind', 'DEPT001', 'Faculty time contribution', TRUE, 'Committed', 0.00);

SELECT 'CostShare Test' as test_name, COUNT(*) as inserted_rows FROM CostShare;

-- ========================================
-- 16. Test Invoice
-- ========================================
INSERT INTO Invoice (Invoice_ID, Award_ID, Invoice_Number, Period_ID, Invoice_Date, Period_Start_Date, Period_End_Date, Direct_Costs, Indirect_Costs, Total_Amount, Invoice_Status) VALUES
('INV001', 'AWD001', 'UI-INV-2024-001', (SELECT Period_ID FROM AwardBudgetPeriod WHERE Award_ID = 'AWD001' AND Period_Number = 1), '2024-03-31', '2024-01-01', '2024-03-31', 37500.00, 12500.00, 50000.00,  'Submitted');

SELECT 'Invoice Test' as test_name, COUNT(*) as inserted_rows FROM Invoice;

-- ========================================
-- 17. Test AwardDeliverable
-- ========================================
INSERT INTO AwardDeliverable (Award_ID, Deliverable_Type, Period_ID, Deliverable_Number, Due_Date, Deliverable_Status, Responsible_Personnel_ID) VALUES
('AWD001', 'Annual Report', (SELECT Period_ID FROM AwardBudgetPeriod WHERE Award_ID = 'AWD001' AND Period_Number = 1), 'AR-2024', '2024-12-31', 'Pending', 'PER001'),
('AWD001', 'Technical Progress Report', (SELECT Period_ID FROM AwardBudgetPeriod WHERE Award_ID = 'AWD001' AND Period_Number = 1), 'TPR-Q1-2024', '2024-04-15', 'Submitted', 'PER001');

SELECT 'AwardDeliverable Test' as test_name, COUNT(*) as inserted_rows FROM AwardDeliverable;

-- ========================================
-- 18. Test ProjectRole
-- ========================================
INSERT INTO ProjectRole (Project_ID, Personnel_ID, Role_Value_ID, Is_Key_Personnel, Funding_Award_ID, Start_Date, End_Date, FTE_Percent) VALUES
('PROJ001', 'PER001', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'PI' AND Allowed_Value_Group = 'ProjectRole'), TRUE, 'AWD001', '2024-01-01', '2026-12-31', 25.00),
('PROJ001', 'PER002', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'CO_PI' AND Allowed_Value_Group = 'ProjectRole'), TRUE, 'AWD001', '2024-01-01', '2026-12-31', 15.00);

SELECT 'ProjectRole Test' as test_name, COUNT(*) as inserted_rows FROM ProjectRole;

-- ========================================
-- 19. Test Fund, Account, FinanceCode, ActivityCode
-- ========================================
INSERT INTO Fund (Fund_Code, Fund_Name, Fund_Type_Value_ID, Organization_ID) VALUES
('10001', 'General Fund', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'GRANT' AND Allowed_Value_Group = 'FundType'), 'UNI001'),
('20001', 'Grant Fund - NSF', (SELECT Allowed_Value_ID FROM AllowedValues WHERE Allowed_Value_Code = 'GRANT' AND Allowed_Value_Group = 'FundType'), 'DEPT001');

INSERT INTO Account (Account_Code, Account_Name, Natural_Classification, Account_Type) VALUES
('610000', 'Salaries', 'Personnel Costs', 'Expense'),
('620000', 'Equipment', 'Capital', 'Expense'),
('800000', 'Revenue', 'Grant Revenue', 'Revenue');

INSERT INTO ActivityCode (Activity_Code, Activity_Name, Activity_Type) VALUES
('RES', 'Research', 'Research'),
('INS', 'Instruction', 'Instruction');

INSERT INTO FinanceCode (Finance_Code, Finance_Name, Award_ID, Purpose, Organization_ID) VALUES
('FIN001', 'NSF AI Award Direct', 'AWD001', 'Direct Costs', 'DEPT001'),
('FIN002', 'NSF AI Award IDC', 'AWD001', 'Indirect Costs', 'UNI001');

SELECT 'Fund Test' as test_name, COUNT(*) as inserted_rows FROM Fund;
SELECT 'Account Test' as test_name, COUNT(*) as inserted_rows FROM Account;
SELECT 'ActivityCode Test' as test_name, COUNT(*) as inserted_rows FROM ActivityCode;
SELECT 'FinanceCode Test' as test_name, COUNT(*) as inserted_rows FROM FinanceCode;

-- ========================================
-- 20. Test IndirectRate
-- ========================================
INSERT INTO IndirectRate (Organization_ID, Rate_Type, Rate_Percentage, Effective_Start_Date, Effective_End_Date, Base_Type, Negotiated_Agreement_ID) VALUES
('UNI001', 'On-Campus', 53.50, '2024-01-01', '2026-12-31', 'MTDC', 'NICRA-2024'),
('UNI001', 'Off-Campus', 26.00, '2024-01-01', '2026-12-31', 'MTDC', 'NICRA-2024');

SELECT 'IndirectRate Test' as test_name, COUNT(*) as inserted_rows FROM IndirectRate;

-- ========================================
-- 21. Test Transaction
-- ========================================
INSERT INTO Transaction (Transaction_ID, Fund_Code, Account_Code, Finance_Code, Activity_Code, Transaction_Date, Fiscal_Year, Fiscal_Period, Transaction_Amount, Transaction_Type, Description, Award_ID, Project_ID, Document_Number) VALUES
('TXN001', '20001', '610000', 'FIN001', 'RES', '2024-01-15', 2024, 1, 6666.67, 'Expense', 'PI Salary - January 2024', 'AWD001', 'PROJ001', 'PAY-2024-001'),
('TXN002', '20001', '620000', 'FIN001', 'RES', '2024-02-01', 2024, 2, 25000.00, 'Expense', 'Computing Equipment Purchase', 'AWD001', 'PROJ001', 'PO-2024-001'),
('TXN003', '20001', '800000', NULL, 'RES', '2024-01-05', 2024, 1, 50000.00, 'Revenue', 'First Quarter Award Funding', 'AWD001', 'PROJ001', 'REV-2024-001');

SELECT 'Transaction Test' as test_name, COUNT(*) as inserted_rows FROM Transaction;

-- ========================================
-- 22. Test Effort
-- ========================================
INSERT INTO Effort (Role_ID, Period_Start_Date, Period_End_Date, Committed_Percent, Committed_Person_Months, Actual_Percent, Is_Certified, Certification_Method, Requires_Prior_Approval, Prior_Approval_Status) VALUES
((SELECT Role_ID FROM ProjectRole WHERE Personnel_ID = 'PER001' AND Project_ID = 'PROJ001' LIMIT 1), '2024-01-01', '2024-06-30', 25.00, 1.50, 25.00, TRUE, 'PAR', FALSE, 'Not Required'),
((SELECT Role_ID FROM ProjectRole WHERE Personnel_ID = 'PER002' AND Project_ID = 'PROJ001' LIMIT 1), '2024-01-01', '2024-06-30', 15.00, 0.90, 16.00, FALSE, 'PAR', FALSE, 'Not Required');

SELECT 'Effort Test' as test_name, COUNT(*) as inserted_rows FROM Effort;

-- ========================================
-- 23. Test ComplianceRequirement
-- ========================================
INSERT INTO ComplianceRequirement (Requirement_ID, Requirement_Number, Requirement_Title, Requirement_Type, Project_ID, Review_Type, Initial_Approval_Date, Expiration_Date, Requirement_Status, Principal_Investigator_ID, Approval_Body, Risk_Level) VALUES
('IRB001', 'IRB-2024-001', 'Human Subjects Research for AI Survey Study', 'IRB', 'PROJ001', 'Expedited', '2023-12-01', '2024-12-01', 'Approved', 'PER001', 'Institutional Review Board', 'Minimal');

SELECT 'ComplianceRequirement Test' as test_name, COUNT(*) as inserted_rows FROM ComplianceRequirement;

-- ========================================
-- 24. Test ConflictOfInterest
-- ========================================
INSERT INTO ConflictOfInterest (Personnel_ID, Project_ID, Award_ID, Disclosure_Date, Relationship_Type, Entity_Name, Financial_Interest_Amount, COI_Status) VALUES
('PER001', 'PROJ001', 'AWD001', '2023-11-01', 'Consulting', 'Tech Consulting Inc.', 5000.00, 'No Conflict');

SELECT 'ConflictOfInterest Test' as test_name, COUNT(*) as inserted_rows FROM ConflictOfInterest;

-- ========================================
-- 25. Test Document
-- ========================================
INSERT INTO Document (Document_Type, Document_Title, Related_Entity_Type, Related_Entity_ID, File_Name, Storage_Location, File_Size_KB, MIME_Type, Uploaded_By_Personnel_ID, Version_Number, Document_Status, Access_Level) VALUES
('Proposal', 'Advanced AI Research Initiative - Full Proposal', 'Proposal', 'PROP001', 'AIRI_Full_Proposal.pdf', '/documents/proposals/2024/', 2048, 'application/pdf', 'PER001', 1, 'Active', 'Internal'),
('Award Notice', 'NSF Award Notice', 'Award', 'AWD001', 'NSF_Award_12345.pdf', '/documents/awards/2024/', 512, 'application/pdf', 'PER003', 1, 'Active', 'Internal');

SELECT 'Document Test' as test_name, COUNT(*) as inserted_rows FROM Document;

-- ========================================
-- 26. Test ActivityLog
-- ========================================
INSERT INTO ActivityLog (Table_Name, Record_ID, Action_Type, User_ID, New_Values) VALUES
('Award', 'AWD001', 'INSERT', 'PER001', '{"Award_Number": "NSF-2024-12345"}'),
('Invoice', 'INV001', 'INSERT', 'PER003', '{"Invoice_Number": "UI-INV-2024-001"}');

SELECT 'ActivityLog Test' as test_name, COUNT(*) as inserted_rows FROM ActivityLog;

-- ========================================
-- RELATIONSHIP INTEGRITY TESTS
-- ========================================
SELECT '=== RELATIONSHIP INTEGRITY TESTS ===' as test_section;

-- Test Foreign Key Relationships
SELECT 'Award -> Project Relationship' as test_name,
       a.Award_Number, p.Project_Title
FROM Award a
INNER JOIN Project p ON a.Project_ID = p.Project_ID;

SELECT 'Award -> Organization Relationship' as test_name,
       a.Award_Number, o.Organization_Name as Sponsor
FROM Award a
INNER JOIN Organization o ON a.Sponsor_Organization_ID = o.Organization_ID;

SELECT 'ProjectRole -> Personnel Relationship' as test_name,
       pr.Project_ID,
       CONCAT(p.First_Name, ' ', p.Last_Name) as Person_Name,
       av.Allowed_Value_Label as Role
FROM ProjectRole pr
INNER JOIN Personnel p ON pr.Personnel_ID = p.Personnel_ID
INNER JOIN AllowedValues av ON pr.Role_Value_ID = av.Allowed_Value_ID;

SELECT 'Transaction -> Award Relationship' as test_name,
       t.Transaction_ID, t.Description, a.Award_Number
FROM Transaction t
INNER JOIN Award a ON t.Award_ID = a.Award_ID;

-- ========================================
-- VIEW TESTS
-- ========================================
SELECT '=== VIEW TESTS ===' as test_section;

-- Test views exist and can be queried
SELECT 'vw_active_awards' as view_name, COUNT(*) as row_count FROM vw_active_awards;
SELECT 'vw_active_personnel_roles' as view_name, COUNT(*) as row_count FROM vw_active_personnel_roles;
SELECT 'vw_award_financial_summary' as view_name, COUNT(*) as row_count FROM vw_award_financial_summary;

-- ========================================
-- SUMMARY REPORT
-- ========================================
SELECT '=== SUMMARY OF ALL INSERTED DATA ===' as summary_section;

SELECT 'AllowedValues' as table_name, COUNT(*) as total_rows FROM AllowedValues
UNION ALL
SELECT 'Organization', COUNT(*) FROM Organization
UNION ALL
SELECT 'Personnel', COUNT(*) FROM Personnel
UNION ALL
SELECT 'Contact', COUNT(*) FROM Contact
UNION ALL
SELECT 'Project', COUNT(*) FROM Project
UNION ALL
SELECT 'RFA', COUNT(*) FROM RFA
UNION ALL
SELECT 'Proposal', COUNT(*) FROM Proposal
UNION ALL
SELECT 'ProposalBudget', COUNT(*) FROM ProposalBudget
UNION ALL
SELECT 'Award', COUNT(*) FROM Award
UNION ALL
SELECT 'Modification', COUNT(*) FROM Modification
UNION ALL
SELECT 'Terms', COUNT(*) FROM Terms
UNION ALL
SELECT 'AwardBudgetPeriod', COUNT(*) FROM AwardBudgetPeriod
UNION ALL
SELECT 'AwardBudget', COUNT(*) FROM AwardBudget
UNION ALL
SELECT 'Subaward', COUNT(*) FROM Subaward
UNION ALL
SELECT 'CostShare', COUNT(*) FROM CostShare
UNION ALL
SELECT 'Invoice', COUNT(*) FROM Invoice
UNION ALL
SELECT 'AwardDeliverable', COUNT(*) FROM AwardDeliverable
UNION ALL
SELECT 'ProjectRole', COUNT(*) FROM ProjectRole
UNION ALL
SELECT 'Fund', COUNT(*) FROM Fund
UNION ALL
SELECT 'Account', COUNT(*) FROM Account
UNION ALL
SELECT 'ActivityCode', COUNT(*) FROM ActivityCode
UNION ALL
SELECT 'FinanceCode', COUNT(*) FROM FinanceCode
UNION ALL
SELECT 'IndirectRate', COUNT(*) FROM IndirectRate
UNION ALL
SELECT 'Transaction', COUNT(*) FROM Transaction
UNION ALL
SELECT 'Effort', COUNT(*) FROM Effort
UNION ALL
SELECT 'ComplianceRequirement', COUNT(*) FROM ComplianceRequirement
UNION ALL
SELECT 'ConflictOfInterest', COUNT(*) FROM ConflictOfInterest
UNION ALL
SELECT 'Document', COUNT(*) FROM Document
UNION ALL
SELECT 'ActivityLog', COUNT(*) FROM ActivityLog;

-- ========================================
-- CONSTRAINT VALIDATION TESTS
-- ========================================
SELECT '=== CONSTRAINT VALIDATION ===' as test_section;

-- Test CHECK constraints
SELECT 'Organization Type Constraints' as test_name, Organization_Type, COUNT(*) as count
FROM Organization
GROUP BY Organization_Type;

SELECT 'Personnel Type Constraints' as test_name, Person_Type, COUNT(*) as count
FROM Personnel
GROUP BY Person_Type;

SELECT 'Award Status Constraints' as test_name, Award_Status, COUNT(*) as count
FROM Award
GROUP BY Award_Status;

SELECT 'Project Status Constraints' as test_name, Project_Status, COUNT(*) as count
FROM Project
GROUP BY Project_Status;
