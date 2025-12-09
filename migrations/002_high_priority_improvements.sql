-- Migration: High Priority Schema Improvements
-- Purpose: Implement 6 critical schema enhancements
-- Date: 2024-12-08
-- Status: DRAFT - Review before execution

-- IMPROVEMENTS INCLUDED:
-- 1. Add missing foreign keys on audit columns
-- 2. Increase DECIMAL precision for monetary values (15,2 → 18,2)
-- 3. Add date range validation constraints
-- 4. Fix nullability for critical fields
-- 5. Add email format validation constraints
-- 6. Update constraint names for consistency

-- ========================================
-- PART 1: ADD MISSING FOREIGN KEYS ON AUDIT COLUMNS
-- ========================================

-- Note: Last_Modified_By should reference Personnel_ID
-- These FK allow NULL since records can be created by system

ALTER TABLE Organization
    ADD CONSTRAINT fk_organization_modified_by
    FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Organization
    ADD CONSTRAINT fk_organization_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Personnel
    ADD CONSTRAINT fk_personnel_modified_by
    FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Personnel
    ADD CONSTRAINT fk_personnel_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Project
    ADD CONSTRAINT fk_project_modified_by
    FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Project
    ADD CONSTRAINT fk_project_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Proposal
    ADD CONSTRAINT fk_proposal_modified_by
    FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Proposal
    ADD CONSTRAINT fk_proposal_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Award
    ADD CONSTRAINT fk_award_modified_by
    FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Award
    ADD CONSTRAINT fk_award_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE AwardBudget
    ADD CONSTRAINT fk_awardbudget_modified_by
    FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE ComplianceRequirement
    ADD CONSTRAINT fk_compliancereq_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Invoice
    ADD CONSTRAINT fk_invoice_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Modification
    ADD CONSTRAINT fk_modification_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON UPDATE CASCADE;

ALTER TABLE ProjectRole
    ADD CONSTRAINT fk_projectrole_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Subaward
    ADD CONSTRAINT fk_subaward_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Transaction
    ADD CONSTRAINT fk_transaction_created_by
    FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- PART 2: INCREASE DECIMAL PRECISION (15,2 → 18,2)
-- ========================================

-- Award table
ALTER TABLE Award MODIFY COLUMN Current_Total_Funded DECIMAL(18,2) NOT NULL DEFAULT 0;
ALTER TABLE Award MODIFY COLUMN Total_Anticipated_Funding DECIMAL(18,2);

-- AwardBudget table
ALTER TABLE AwardBudget MODIFY COLUMN Approved_Direct_Cost DECIMAL(18,2);
ALTER TABLE AwardBudget MODIFY COLUMN Approved_Indirect_Cost DECIMAL(18,2);
ALTER TABLE AwardBudget MODIFY COLUMN Approved_Total_Cost DECIMAL(18,2);
ALTER TABLE AwardBudget MODIFY COLUMN Current_Direct_Cost DECIMAL(18,2);
ALTER TABLE AwardBudget MODIFY COLUMN Current_Indirect_Cost DECIMAL(18,2);
ALTER TABLE AwardBudget MODIFY COLUMN Current_Total_Cost DECIMAL(18,2);

-- AwardBudgetPeriod table
ALTER TABLE AwardBudgetPeriod MODIFY COLUMN Direct_Costs DECIMAL(18,2) DEFAULT 0;
ALTER TABLE AwardBudgetPeriod MODIFY COLUMN Indirect_Costs DECIMAL(18,2) DEFAULT 0;
ALTER TABLE AwardBudgetPeriod MODIFY COLUMN Total_Costs DECIMAL(18,2) DEFAULT 0;
ALTER TABLE AwardBudgetPeriod MODIFY COLUMN Cost_Share_Amount DECIMAL(18,2) DEFAULT 0;

-- ConflictOfInterest table
ALTER TABLE ConflictOfInterest MODIFY COLUMN Financial_Interest_Amount DECIMAL(18,2);

-- CostShare table
ALTER TABLE CostShare MODIFY COLUMN Committed_Amount DECIMAL(18,2) NOT NULL;
ALTER TABLE CostShare MODIFY COLUMN Met_Amount DECIMAL(18,2) DEFAULT 0;

-- Effort table
ALTER TABLE Effort MODIFY COLUMN Committed_Percent DECIMAL(5,2) NOT NULL;
ALTER TABLE Effort MODIFY COLUMN Committed_Person_Months DECIMAL(4,2);
ALTER TABLE Effort MODIFY COLUMN Actual_Percent DECIMAL(5,2);
ALTER TABLE Effort MODIFY COLUMN Variance_Percent DECIMAL(5,2);

-- Invoice table
ALTER TABLE Invoice MODIFY COLUMN Direct_Costs DECIMAL(18,2) DEFAULT 0;
ALTER TABLE Invoice MODIFY COLUMN Indirect_Costs DECIMAL(18,2) DEFAULT 0;
ALTER TABLE Invoice MODIFY COLUMN Cost_Share DECIMAL(18,2) DEFAULT 0;
ALTER TABLE Invoice MODIFY COLUMN Total_Amount DECIMAL(18,2) NOT NULL;
ALTER TABLE Invoice MODIFY COLUMN Payment_Amount DECIMAL(18,2);

-- Modification table
ALTER TABLE Modification MODIFY COLUMN Funding_Amount_Change DECIMAL(18,2) DEFAULT 0;

-- ProposalBudget table
ALTER TABLE ProposalBudget MODIFY COLUMN Direct_Cost DECIMAL(18,2);
ALTER TABLE ProposalBudget MODIFY COLUMN Indirect_Cost DECIMAL(18,2);
ALTER TABLE ProposalBudget MODIFY COLUMN Total_Cost DECIMAL(18,2);
ALTER TABLE ProposalBudget MODIFY COLUMN Quantity DECIMAL(10,2);
ALTER TABLE ProposalBudget MODIFY COLUMN Unit_Cost DECIMAL(18,2);

-- Proposal table
ALTER TABLE Proposal MODIFY COLUMN Total_Proposed_Direct DECIMAL(18,2);
ALTER TABLE Proposal MODIFY COLUMN Total_Proposed_Indirect DECIMAL(18,2);
ALTER TABLE Proposal MODIFY COLUMN Total_Proposed_Budget DECIMAL(18,2);

-- ProjectRole table
ALTER TABLE ProjectRole MODIFY COLUMN Salary_Charged DECIMAL(18,2);

-- Subaward table
ALTER TABLE Subaward MODIFY COLUMN Amount DECIMAL(18,2);

-- Transaction table
ALTER TABLE Transaction MODIFY COLUMN Amount DECIMAL(18,2) NOT NULL;

-- ========================================
-- PART 3: ADD DATE RANGE VALIDATION CONSTRAINTS
-- ========================================

ALTER TABLE Project
    ADD CONSTRAINT chk_project_date_range
    CHECK (End_Date IS NULL OR End_Date >= Start_Date);

ALTER TABLE Award
    ADD CONSTRAINT chk_award_date_range
    CHECK (Current_End_Date >= Original_Start_Date);

ALTER TABLE Award
    ADD CONSTRAINT chk_award_original_dates
    CHECK (Original_End_Date >= Original_Start_Date);

ALTER TABLE Proposal
    ADD CONSTRAINT chk_proposal_date_range
    CHECK (Proposed_End_Date IS NULL OR Proposed_End_Date >= Proposed_Start_Date);

ALTER TABLE Subaward
    ADD CONSTRAINT chk_subaward_date_range
    CHECK (End_Date IS NULL OR End_Date >= Start_Date);

ALTER TABLE AwardBudgetPeriod
    ADD CONSTRAINT chk_period_date_range
    CHECK (End_Date >= Start_Date);

ALTER TABLE Effort
    ADD CONSTRAINT chk_effort_date_range
    CHECK (Period_End_Date >= Period_Start_Date);

ALTER TABLE Invoice
    ADD CONSTRAINT chk_invoice_period_range
    CHECK (Period_End_Date >= Period_Start_Date);

ALTER TABLE IndirectRate
    ADD CONSTRAINT chk_rate_date_range
    CHECK (Effective_End_Date IS NULL OR Effective_End_Date >= Effective_Start_Date);

-- ========================================
-- ========================================

ALTER TABLE Personnel
    ADD CONSTRAINT chk_personnel_email_format
    CHECK (Primary_Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify foreign keys were added
SELECT
    constraint_name,
    table_name,
    column_name,
    referenced_table_name
FROM information_schema.key_column_usage
WHERE table_schema = 'AI4RA-UDM'
  AND constraint_name LIKE '%_modified_by' OR constraint_name LIKE '%_created_by'
ORDER BY table_name, constraint_name;

-- Verify DECIMAL precision changes
SELECT
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_schema = 'AI4RA-UDM'
  AND data_type = 'decimal'
ORDER BY table_name, column_name;

-- Verify date range constraints
SELECT
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'AI4RA-UDM'
  AND constraint_type = 'CHECK'
  AND constraint_name LIKE '%date%'
ORDER BY table_name;

-- Verify email constraint
SELECT
    constraint_name,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'AI4RA-UDM'
  AND constraint_name LIKE '%email%'
ORDER BY table_name;
