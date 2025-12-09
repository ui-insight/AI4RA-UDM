-- Create AllowedValues FIRST since other tables reference it
CREATE TABLE AllowedValues (
    Allowed_Value_ID INT AUTO_INCREMENT PRIMARY KEY,
    Allowed_Value_Group VARCHAR(50) NOT NULL,
    Allowed_Value_Code VARCHAR(50) NOT NULL,
    Allowed_Value_Label VARCHAR(255) NOT NULL,
    Allowed_Value_Description TEXT,
    Parent_Value_ID INT,
    Display_Order INT,
    CONSTRAINT uq_value_code UNIQUE (Allowed_Value_Group, Allowed_Value_Code),
    CONSTRAINT fk_value_parent FOREIGN KEY (Parent_Value_ID)
        REFERENCES AllowedValues(Allowed_Value_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- BudgetCategory reference table
CREATE TABLE BudgetCategory (
    BudgetCategory_ID INT AUTO_INCREMENT PRIMARY KEY,
    Category_Code VARCHAR(50) UNIQUE NOT NULL,
    Category_Name VARCHAR(100) NOT NULL,
    Category_Description TEXT,
    Display_Order INT
);

-- Then create Organization (no external dependencies)
CREATE TABLE Organization (
    Organization_ID VARCHAR(50) PRIMARY KEY,
    Organization_Name VARCHAR(255) NOT NULL,
    Organization_Type VARCHAR(50) NOT NULL,
    Parent_Organization_ID VARCHAR(50),
    UEI VARCHAR(12),
    CONSTRAINT chk_organization_type CHECK (Organization_Type IN ('Department','College','School','Sponsor','Subrecipient','Vendor','Institute','Center')),
    CONSTRAINT chk_uei_format CHECK (UEI IS NULL OR CHAR_LENGTH(UEI) = 12),
    CONSTRAINT fk_organization_parent FOREIGN KEY (Parent_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Then Personnel (depends on Organization)
CREATE TABLE Personnel (
    Personnel_ID VARCHAR(50) PRIMARY KEY,
    ORCID VARCHAR(19) UNIQUE,
    First_Name VARCHAR(100) NOT NULL,
    Last_Name VARCHAR(100) NOT NULL,
    Middle_Name VARCHAR(100),
    Institutional_ID VARCHAR(50) UNIQUE,
    Primary_Email VARCHAR(320) NOT NULL,
    Person_Type VARCHAR(50),
    Department_Organization_ID VARCHAR(50),
    CONSTRAINT chk_personnel_type CHECK (Person_Type IN ('Faculty','Staff','Student','External','Postdoc','Resident','Fellow')),
    CONSTRAINT chk_orcid_format CHECK (ORCID IS NULL OR ORCID REGEXP '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{3}[0-9X]$'),
    CONSTRAINT chk_personnel_email_format CHECK (Primary_Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT fk_personnel_dept FOREIGN KEY (Department_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE ContactDetails (
    ContactDetails_ID INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Only one of these can be non-null
    Personnel_ID VARCHAR(50),
    Organization_ID VARCHAR(50),
    
    -- Contact type controlled by AllowedValues (e.g., Email, Phone, Fax)
    AllowedValue_ID INT,
    
    -- Contact information
    ContactDetails_Value VARCHAR(255) NOT NULL,
    Is_Primary BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT chk_contact_entity CHECK (
        (Personnel_ID IS NOT NULL AND Organization_ID IS NULL) OR
        (Personnel_ID IS NULL AND Organization_ID IS NOT NULL)
    ),
    
    -- Foreign keys
    CONSTRAINT fk_contact_personnel FOREIGN KEY (Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_contact_org FOREIGN KEY (Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_contact_type FOREIGN KEY (AllowedValue_ID)
        REFERENCES AllowedValues(Allowed_Value_ID)
        ON UPDATE CASCADE
);


-- Project
CREATE TABLE Project (
    Project_ID VARCHAR(50) PRIMARY KEY,
    Project_Title VARCHAR(500) NOT NULL,
    Acronym VARCHAR(50),
    Parent_Project_ID VARCHAR(50),
    Project_Type VARCHAR(50),
    Abstract TEXT,
    Start_Date DATE NOT NULL,
    End_Date DATE,
    Lead_Organization_ID VARCHAR(50) NOT NULL,
    Project_Status VARCHAR(50) DEFAULT 'Active',
    CONSTRAINT chk_project_type CHECK (Project_Type IN ('Research','Training','Service','Clinical Trial','Fellowship','Infrastructure','Other')),
    CONSTRAINT chk_project_status CHECK (Project_Status IN ('Planning','Active','Completed','Suspended','Cancelled')),
    CONSTRAINT fk_project_parent FOREIGN KEY (Parent_Project_ID)
        REFERENCES Project(Project_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_project_org FOREIGN KEY (Lead_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON UPDATE CASCADE,
    CONSTRAINT chk_project_date_range CHECK (End_Date IS NULL OR End_Date >= Start_Date)
);

-- RFA
CREATE TABLE RFA (
    RFA_ID VARCHAR(50) PRIMARY KEY,
    Sponsor_Organization_ID VARCHAR(50) NOT NULL,
    RFA_Number VARCHAR(100),
    RFA_Title VARCHAR(500) NOT NULL,
    Program_Code VARCHAR(100),
    Announcement_URL VARCHAR(1000),
    Opportunity_Number VARCHAR(100),
    CFDA_Number VARCHAR(20),
    CONSTRAINT fk_rfa_sponsor FOREIGN KEY (Sponsor_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON UPDATE CASCADE
);

-- Proposal
CREATE TABLE Proposal (
    Proposal_ID VARCHAR(50) PRIMARY KEY,
    Proposal_Number VARCHAR(100) UNIQUE,
    Proposal_Title VARCHAR(500) NOT NULL,
    Project_ID VARCHAR(50),
    Sponsor_Organization_ID VARCHAR(50) NOT NULL,
    Submitting_Organization_ID VARCHAR(50),
    Administering_Organization_ID VARCHAR(50),
    RFA_ID VARCHAR(50),
    Previous_Proposal_ID VARCHAR(50),
    Submission_Version INT DEFAULT 1,
    Proposed_Start_Date DATE,
    Proposed_End_Date DATE,
    Total_Proposed_Direct DECIMAL(18,2),
    Total_Proposed_Indirect DECIMAL(18,2),
    Total_Proposed_Budget DECIMAL(18,2),
    Submission_Deadline DATE,
    Submission_Date DATE,
    Internal_Approval_Status VARCHAR(50) DEFAULT 'Draft',
    Decision_Status VARCHAR(50) DEFAULT 'Pending',
    Decision_Date DATE,
    PAF_Routing_Status VARCHAR(50),
    CONSTRAINT chk_internal_status CHECK (Internal_Approval_Status IN ('Draft','In Review','Approved','Rejected','Withdrawn')),
    CONSTRAINT chk_decision_status CHECK (Decision_Status IN ('Pending','Submitted','Under Review','Awarded','Declined','Withdrawn')),
    CONSTRAINT fk_proposal_project FOREIGN KEY (Project_ID)
        REFERENCES Project(Project_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_proposal_sponsor FOREIGN KEY (Sponsor_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON UPDATE CASCADE,
    CONSTRAINT fk_proposal_submitting_org FOREIGN KEY (Submitting_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_proposal_administering_org FOREIGN KEY (Administering_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_proposal_rfa FOREIGN KEY (RFA_ID)
        REFERENCES RFA(RFA_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_proposal_previous FOREIGN KEY (Previous_Proposal_ID)
        REFERENCES Proposal(Proposal_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_proposal_date_range CHECK (Proposed_End_Date IS NULL OR Proposed_End_Date >= Proposed_Start_Date)
);

-- ProposalBudget
CREATE TABLE ProposalBudget (
    ProposalBudget_ID INT AUTO_INCREMENT PRIMARY KEY,
    Proposal_ID VARCHAR(50) NOT NULL,
    Period_Number INT NOT NULL,
    BudgetCategory_ID INT NOT NULL,
    Line_Item_Description VARCHAR(500),
    Direct_Cost DECIMAL(18,2),
    Indirect_Cost DECIMAL(18,2),
    Total_Cost DECIMAL(18,2),
    Quantity DECIMAL(10,2),
    Unit_Cost DECIMAL(18,2),
    Applied_Indirect_Rate_ID INT,
    Rate_Base_Used VARCHAR(50),
    Version_No INT DEFAULT 1,
    CONSTRAINT chk_rate_base_used CHECK (Rate_Base_Used IN ('MTDC','TDC','Salaries and Wages','Direct Salaries')),
    CONSTRAINT fk_propbudget_proposal FOREIGN KEY (Proposal_ID)
        REFERENCES Proposal(Proposal_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_propbudget_category FOREIGN KEY (BudgetCategory_ID)
        REFERENCES BudgetCategory(BudgetCategory_ID)
        ON UPDATE CASCADE,
    CONSTRAINT fk_propbudget_indirect_rate FOREIGN KEY (Applied_Indirect_Rate_ID)
        REFERENCES IndirectRate(IndirectRate_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT uq_proposal_budget_item UNIQUE (Proposal_ID, Period_Number, BudgetCategory_ID, Line_Item_Description)
);

-- Award
CREATE TABLE Award (
    Award_ID VARCHAR(50) PRIMARY KEY,
    Award_Number VARCHAR(100) UNIQUE NOT NULL,
    Award_Title VARCHAR(500) NOT NULL,
    Project_ID VARCHAR(50) NOT NULL,
    Sponsor_Organization_ID VARCHAR(50) NOT NULL,
    RFA_ID VARCHAR(50),
    Proposal_ID VARCHAR(50),
    Original_Start_Date DATE NOT NULL,
    Original_End_Date DATE NOT NULL,
    Current_Total_Funded DECIMAL(18,2) NOT NULL DEFAULT 0,
    Current_End_Date DATE NOT NULL,
    Total_Anticipated_Funding DECIMAL(18,2),
    Award_Status VARCHAR(50) DEFAULT 'Pending',
    CFDA_Number VARCHAR(20),
    Federal_Award_ID VARCHAR(100),
    Prime_Sponsor_Organization_ID VARCHAR(50),
    Flow_Through_Indicator BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_award_status CHECK (Award_Status IN ('Pending','Active','Closed','Suspended','Terminated')),
    CONSTRAINT fk_award_project FOREIGN KEY (Project_ID)
        REFERENCES Project(Project_ID)
        ON UPDATE CASCADE,
    CONSTRAINT fk_award_sponsor FOREIGN KEY (Sponsor_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON UPDATE CASCADE,
    CONSTRAINT fk_award_rfa FOREIGN KEY (RFA_ID)
        REFERENCES RFA(RFA_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_award_proposal FOREIGN KEY (Proposal_ID)
        REFERENCES Proposal(Proposal_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_award_prime_sponsor FOREIGN KEY (Prime_Sponsor_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_award_date_range CHECK (Current_End_Date >= Original_Start_Date),
    CONSTRAINT chk_award_original_dates CHECK (Original_End_Date >= Original_Start_Date)
);

-- Modification
CREATE TABLE Modification (
    Modification_ID VARCHAR(50) PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    Modification_Number VARCHAR(20) NOT NULL,
    Event_Type VARCHAR(50) NOT NULL,
    Event_Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Effective_Date DATE NOT NULL,
    Funding_Amount_Change DECIMAL(18,2) DEFAULT 0,
    New_End_Date DATE,
    Affected_Personnel_ID VARCHAR(50),
    Change_Description TEXT,
    Justification TEXT,
    Impact_on_Budget BOOLEAN DEFAULT FALSE,
    Requires_Prior_Approval BOOLEAN DEFAULT FALSE,
    Approval_Status VARCHAR(50) DEFAULT 'Pending',
    Approved_By_Personnel_ID VARCHAR(50),
    Approval_Date DATE,
    CONSTRAINT chk_event_type CHECK (Event_Type IN (
        'Initial Award','Incremental Funding','No Cost Extension',
        'Budget Revision','Scope Change','Personnel Change','Termination',
        'Supplement','Carryforward','Administrative Change'
    )),
    CONSTRAINT chk_approval_status CHECK (Approval_Status IN ('Pending','Approved','Rejected','Not Required')),
    CONSTRAINT fk_mod_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_mod_approver FOREIGN KEY (Approved_By_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_mod_affected_personnel FOREIGN KEY (Affected_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Terms
CREATE TABLE Terms (
    AwardTerms_ID INT AUTO_INCREMENT PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    Payment_Method VARCHAR(50),
    Invoicing_Frequency VARCHAR(50),
    Invoice_Submission_Days INT,
    Reporting_Requirements TEXT,
    Special_Conditions TEXT,
    Property_Requirements TEXT,
    Publication_Requirements TEXT,
    Closeout_Requirements TEXT,
    Record_Retention_Years INT DEFAULT 3,
    CONSTRAINT chk_payment_method CHECK (Payment_Method IN (
        'Reimbursement','Advance','Cost-Reimbursement','Fixed-Price',
        'Letter-of-Credit','Payment-Request'
    )),
    CONSTRAINT chk_invoicing_frequency CHECK (Invoicing_Frequency IN (
        'Monthly','Quarterly','Semi-Annual','Annual','Upon-Request','Milestone'
    )),
    CONSTRAINT fk_terms_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- AwardBudgetPeriod
CREATE TABLE AwardBudgetPeriod (
    AwardBudgetPeriod_ID INT AUTO_INCREMENT PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    Period_Number INT NOT NULL,
    Start_Date DATE NOT NULL,
    End_Date DATE NOT NULL,
    Direct_Costs DECIMAL(18,2) DEFAULT 0,
    Indirect_Costs DECIMAL(18,2) DEFAULT 0,
    Total_Costs DECIMAL(18,2) DEFAULT 0,
    Cost_Share_Amount DECIMAL(18,2) DEFAULT 0,
    Period_Status VARCHAR(50) DEFAULT 'Pending',
    CONSTRAINT fk_period_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_period_status CHECK (Period_Status IN ('Pending','Released','Active','Closed')),
    CONSTRAINT uq_award_period UNIQUE (Award_ID, Period_Number),
    CONSTRAINT chk_period_date_range CHECK (End_Date >= Start_Date)
);

-- AwardBudget
CREATE TABLE AwardBudget (
    Award_Budget_ID INT AUTO_INCREMENT PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    AwardBudgetPeriod_ID INT NOT NULL,
    BudgetCategory_ID INT NOT NULL,
    Line_Item_Description VARCHAR(500),
    Approved_Direct_Cost DECIMAL(18,2),
    Approved_Indirect_Cost DECIMAL(18,2),
    Approved_Total_Cost DECIMAL(18,2),
    Current_Direct_Cost DECIMAL(18,2),
    Current_Indirect_Cost DECIMAL(18,2),
    Current_Total_Cost DECIMAL(18,2),
    Rate_Base_Used VARCHAR(50),
    CONSTRAINT chk_award_rate_base_used CHECK (Rate_Base_Used IN ('MTDC','TDC','Salaries and Wages','Direct Salaries')),
    CONSTRAINT fk_awardbudget_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_awardbudget_period FOREIGN KEY (AwardBudgetPeriod_ID)
        REFERENCES AwardBudgetPeriod(AwardBudgetPeriod_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_awardbudget_category FOREIGN KEY (BudgetCategory_ID)
        REFERENCES BudgetCategory(BudgetCategory_ID)
        ON UPDATE CASCADE,
    CONSTRAINT uq_award_budget_item UNIQUE (Award_ID, AwardBudgetPeriod_ID, BudgetCategory_ID, Line_Item_Description)
);

-- Subaward
CREATE TABLE Subaward (
    Subaward_ID VARCHAR(50) PRIMARY KEY,
    Prime_Award_ID VARCHAR(50) NOT NULL,
    Subrecipient_Organization_ID VARCHAR(50) NOT NULL,
    Subaward_Number VARCHAR(100) UNIQUE,
    Subaward_Amount DECIMAL(18,2),
    Start_Date DATE,
    End_Date DATE,
    Subaward_Status VARCHAR(50) DEFAULT 'Active',
    Statement_of_Work TEXT,
    PI_Name VARCHAR(255),
    Monitoring_Plan TEXT,
    Risk_Level VARCHAR(20),
    CONSTRAINT chk_subaward_status CHECK (Subaward_Status IN ('Pending','Active','Closed','Terminated','Suspended')),
    CONSTRAINT chk_risk_level CHECK (Risk_Level IN ('Low','Medium','High')),
    CONSTRAINT fk_subaward_prime FOREIGN KEY (Prime_Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_subaward_org FOREIGN KEY (Subrecipient_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON UPDATE CASCADE,
    CONSTRAINT chk_subaward_date_range CHECK (End_Date IS NULL OR End_Date >= Start_Date)
);

-- CostShare
CREATE TABLE CostShare (
    CostShare_ID INT AUTO_INCREMENT PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    Committed_Amount DECIMAL(18,2) NOT NULL,
    Commitment_Type VARCHAR(50),
    Source_Organization_ID VARCHAR(50),
    Source_Fund_Code VARCHAR(20),
    Source_Description VARCHAR(500),
    Is_Mandatory BOOLEAN DEFAULT FALSE,
    CostShare_Status VARCHAR(50) DEFAULT 'Committed',
    Met_Amount DECIMAL(18,2) DEFAULT 0,
    CONSTRAINT chk_commitment_type CHECK (Commitment_Type IN ('Cash','In-Kind','Third-Party','Waived IDC')),
    CONSTRAINT chk_costshare_status CHECK (CostShare_Status IN ('Committed','In Progress','Met','Waived')),
    CONSTRAINT fk_costshare_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_costshare_org FOREIGN KEY (Source_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Invoice
CREATE TABLE Invoice (
    Invoice_ID VARCHAR(50) PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    Invoice_Number VARCHAR(100) UNIQUE NOT NULL,
    AwardBudgetPeriod_ID INT,
    Invoice_Date DATE NOT NULL,
    Period_Start_Date DATE NOT NULL,
    Period_End_Date DATE NOT NULL,
    Direct_Costs DECIMAL(18,2) DEFAULT 0,
    Indirect_Costs DECIMAL(18,2) DEFAULT 0,
    Cost_Share DECIMAL(18,2) DEFAULT 0,
    Total_Amount DECIMAL(18,2) NOT NULL,
    Invoice_Status VARCHAR(50) DEFAULT 'Draft',
    Submission_Date DATE,
    Payment_Date DATE,
    Payment_Amount DECIMAL(18,2),
    CONSTRAINT chk_invoice_status CHECK (Invoice_Status IN ('Draft','Submitted','Under Review','Approved','Paid','Rejected')),
    CONSTRAINT fk_invoice_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_invoice_period FOREIGN KEY (AwardBudgetPeriod_ID)
        REFERENCES AwardBudgetPeriod(AwardBudgetPeriod_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_invoice_period_range CHECK (Period_End_Date >= Period_Start_Date)
);

-- AwardDeliverable
CREATE TABLE AwardDeliverable (
    AwardDeliverable_ID INT AUTO_INCREMENT PRIMARY KEY,
    Award_ID VARCHAR(50) NOT NULL,
    Deliverable_Type VARCHAR(50) NOT NULL,
    AwardBudgetPeriod_ID INT,
    Deliverable_Number VARCHAR(50),
    Due_Date DATE NOT NULL,
    Submission_Date DATE,
    Deliverable_Status VARCHAR(50) DEFAULT 'Pending',
    Responsible_Personnel_ID VARCHAR(50),
    Reviewed_By_Personnel_ID VARCHAR(50),
    Review_Date DATE,
    Comments TEXT,
    CONSTRAINT chk_deliverable_type CHECK (Deliverable_Type IN (
        'Technical Progress Report','Financial Report','Annual Report',
        'Final Technical Report','Final Financial Report','Property Report',
        'Invention Disclosure','Animal Welfare Report','Data Submission',
        'Software Release','Clinical Trial Registration','Publication',
        'Presentation','Material Transfer','Other'
    )),
    CONSTRAINT chk_deliverable_status CHECK (Deliverable_Status IN ('Pending','In Progress','Submitted','Accepted','Revision Required','Overdue')),
    CONSTRAINT fk_deliverable_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_deliverable_period FOREIGN KEY (AwardBudgetPeriod_ID)
        REFERENCES AwardBudgetPeriod(AwardBudgetPeriod_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_deliverable_responsible FOREIGN KEY (Responsible_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_deliverable_reviewer FOREIGN KEY (Reviewed_By_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ProjectRole
CREATE TABLE ProjectRole (
    ProjectRole_ID INT AUTO_INCREMENT PRIMARY KEY,
    Project_ID VARCHAR(50) NOT NULL,
    Personnel_ID VARCHAR(50) NOT NULL,
    Role_Value_ID INT NOT NULL,
    Is_Key_Personnel BOOLEAN DEFAULT FALSE,
    Funding_Award_ID VARCHAR(50),
    Start_Date DATE NOT NULL,
    End_Date DATE,
    FTE_Percent DECIMAL(5,2),
    Salary_Charged DECIMAL(18,2),
    CONSTRAINT chk_fte_percent CHECK (FTE_Percent IS NULL OR (FTE_Percent >= 0 AND FTE_Percent <= 100)),
    CONSTRAINT fk_role_project FOREIGN KEY (Project_ID)
        REFERENCES Project(Project_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_role_personnel FOREIGN KEY (Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_role_award FOREIGN KEY (Funding_Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_role_value FOREIGN KEY (Role_Value_ID)
        REFERENCES AllowedValues(Allowed_Value_ID)
        ON UPDATE CASCADE,
    CONSTRAINT uq_project_role UNIQUE (Project_ID, Personnel_ID, Role_Value_ID, Start_Date)
);

-- Fund
CREATE TABLE Fund (
    Fund_Code VARCHAR(20) PRIMARY KEY,
    Fund_Name VARCHAR(255) NOT NULL,
    Fund_Type_Value_ID INT,
    Organization_ID VARCHAR(50),
    CONSTRAINT fk_fund_type FOREIGN KEY (Fund_Type_Value_ID)
        REFERENCES AllowedValues(Allowed_Value_ID)
        ON UPDATE CASCADE,
    CONSTRAINT fk_fund_org FOREIGN KEY (Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Account
CREATE TABLE Account (
    Account_Code VARCHAR(20) PRIMARY KEY,
    Account_Name VARCHAR(255) NOT NULL,
    Natural_Classification VARCHAR(100),
    Account_Type VARCHAR(50),
    Parent_Account_Code VARCHAR(20),
    CONSTRAINT chk_account_type CHECK (Account_Type IN (
        'Expense','Revenue','Asset','Liability','Equity','Transfer'
    )),
    CONSTRAINT fk_account_parent FOREIGN KEY (Parent_Account_Code)
        REFERENCES Account(Account_Code)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- FinanceCode
CREATE TABLE FinanceCode (
    Finance_Code VARCHAR(20) PRIMARY KEY,
    Finance_Name VARCHAR(255) NOT NULL,
    Award_ID VARCHAR(50),
    Purpose VARCHAR(100),
    Organization_ID VARCHAR(50),
    CONSTRAINT fk_fincode_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_fincode_org FOREIGN KEY (Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_purpose CHECK (Purpose IN (
        'Direct Costs','Cost Share','Indirect Costs','Subcontract',
        'Department Share','Program Income','Other'
    ))
);

-- ActivityCode
CREATE TABLE ActivityCode (
    Activity_Code VARCHAR(20) PRIMARY KEY,
    Activity_Name VARCHAR(255) NOT NULL,
    Activity_Type VARCHAR(50),
    CONSTRAINT chk_activity_type CHECK (Activity_Type IN (
        'Instruction','Research','Public Service','Academic Support',
        'Student Services','Institutional Support','Operations'
    ))
);

-- IndirectRate
CREATE TABLE IndirectRate (
    IndirectRate_ID INT AUTO_INCREMENT PRIMARY KEY,
    Applicable_Organization_ID VARCHAR(50) NOT NULL,
    Rate_Type VARCHAR(50),
    Rate_Percentage DECIMAL(5,2) NOT NULL,
    Effective_Start_Date DATE NOT NULL,
    Effective_End_Date DATE,
    Base_Type VARCHAR(50),
    Negotiated_Agreement_ID VARCHAR(50),
    CONSTRAINT fk_rate_org FOREIGN KEY (Applicable_Organization_ID)
        REFERENCES Organization(Organization_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT chk_rate_type CHECK (Rate_Type IN (
        'On-Campus','Off-Campus','MTDC','TDC','Clinical Trial',
        'Fringe Benefits','Facilities','Administrative'
    )),
    CONSTRAINT chk_base_type CHECK (Base_Type IN (
        'MTDC','TDC','Salaries and Wages','Direct Salaries'
    )),
    CONSTRAINT chk_rate_date_range CHECK (Effective_End_Date IS NULL OR Effective_End_Date >= Effective_Start_Date)
);

-- Transaction
CREATE TABLE Transaction (
    Transaction_ID VARCHAR(50) PRIMARY KEY,
    Fund_Code VARCHAR(20) NOT NULL,
    Account_Code VARCHAR(20) NOT NULL,
    Finance_Code VARCHAR(20),
    Activity_Code VARCHAR(20),
    Transaction_Date DATE NOT NULL,
    Fiscal_Year INT,
    Fiscal_Period INT,
    Transaction_Amount DECIMAL(18,2) NOT NULL,
    Transaction_Type VARCHAR(50),
    Description VARCHAR(500),
    Award_ID VARCHAR(50),
    Project_ID VARCHAR(50),
    AwardBudgetPeriod_ID INT,
    Document_Number VARCHAR(100),
    Journal_ID VARCHAR(50),
    Vendor_ID VARCHAR(50),
    Personnel_ID VARCHAR(50),
    Reference_Number VARCHAR(100),
    Is_Reconciled BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_trans_type CHECK (Transaction_Type IN (
        'Expense','Revenue','Encumbrance','Transfer','Adjustment',
        'Reversal','Cost Share'
    )),
    CONSTRAINT fk_trans_fund FOREIGN KEY (Fund_Code)
        REFERENCES Fund(Fund_Code)
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_account FOREIGN KEY (Account_Code)
        REFERENCES Account(Account_Code)
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_fincode FOREIGN KEY (Finance_Code)
        REFERENCES FinanceCode(Finance_Code)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_activity FOREIGN KEY (Activity_Code)
        REFERENCES ActivityCode(Activity_Code)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_project FOREIGN KEY (Project_ID)
        REFERENCES Project(Project_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_period FOREIGN KEY (AwardBudgetPeriod_ID)
        REFERENCES AwardBudgetPeriod(AwardBudgetPeriod_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_trans_personnel FOREIGN KEY (Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Effort
CREATE TABLE Effort (
    Effort_ID INT AUTO_INCREMENT PRIMARY KEY,
    ProjectRole_ID INT NOT NULL,
    Period_Start_Date DATE NOT NULL,
    Period_End_Date DATE NOT NULL,
    Committed_Percent DECIMAL(5,2) NOT NULL,
    Committed_Person_Months DECIMAL(4,2),
    Actual_Percent DECIMAL(5,2),
    Variance_Percent DECIMAL(5,2),
    Is_Certified BOOLEAN DEFAULT FALSE,
    Certification_Date DATE,
    Certified_By_Personnel_ID VARCHAR(50),
    Certification_Method VARCHAR(50),
    Requires_Prior_Approval BOOLEAN DEFAULT FALSE,
    Prior_Approval_Status VARCHAR(50),
    CONSTRAINT chk_effort_percent CHECK (Committed_Percent BETWEEN 0 AND 100),
    CONSTRAINT chk_actual_percent CHECK (Actual_Percent IS NULL OR (Actual_Percent BETWEEN 0 AND 100)),
    CONSTRAINT chk_certification_method CHECK (Certification_Method IN ('PAR','Activity Report','Timesheet','Other')),
    CONSTRAINT chk_prior_approval_status CHECK (Prior_Approval_Status IN ('Not Required','Pending','Approved','Denied')),
    CONSTRAINT fk_effort_role FOREIGN KEY (ProjectRole_ID)
        REFERENCES ProjectRole(ProjectRole_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_effort_certifier FOREIGN KEY (Certified_By_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_effort_date_range CHECK (Period_End_Date >= Period_Start_Date)
);

-- ComplianceRequirement
CREATE TABLE ComplianceRequirement (
    ComplianceRequirement_ID VARCHAR(50) PRIMARY KEY,
    Requirement_Number VARCHAR(100) UNIQUE NOT NULL,
    Requirement_Title VARCHAR(500) NOT NULL,
    Requirement_Type VARCHAR(50) NOT NULL,
    Project_ID VARCHAR(50),
    Review_Type VARCHAR(50),
    Initial_Approval_Date DATE,
    Expiration_Date DATE,
    Requirement_Status VARCHAR(50) DEFAULT 'In Review',
    Principal_Investigator_ID VARCHAR(50) NOT NULL,
    Approval_Body VARCHAR(100),
    Risk_Level VARCHAR(20),
    CONSTRAINT chk_requirement_type CHECK (Requirement_Type IN ('IRB','IACUC','IBC','COI','Radiation','Other')),
    CONSTRAINT chk_review_type CHECK (Review_Type IN ('Exempt','Expedited','Full Board','Not Human Subjects','Administrative')),
    CONSTRAINT chk_requirement_status CHECK (Requirement_Status IN (
        'Draft','Submitted','In Review','Approved','Expired',
        'Conditional Approval','Disapproved','Terminated','Suspended',
        'Closed'
    )),
    CONSTRAINT chk_risk_level CHECK (Risk_Level IN ('Minimal','More than Minimal','High')),
    CONSTRAINT fk_requirement_project FOREIGN KEY (Project_ID)
        REFERENCES Project(Project_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_requirement_pi FOREIGN KEY (Principal_Investigator_ID)
        REFERENCES Personnel(Personnel_ID)
        ON UPDATE CASCADE
);

-- ConflictOfInterest
CREATE TABLE ConflictOfInterest (
    ConflictOfInterest_ID INT AUTO_INCREMENT PRIMARY KEY,
    Personnel_ID VARCHAR(50) NOT NULL,
    Project_ID VARCHAR(50),
    Award_ID VARCHAR(50),
    Disclosure_Date DATE NOT NULL,
    Relationship_Type VARCHAR(100),
    Entity_Name VARCHAR(255),
    Financial_Interest_Amount DECIMAL(18,2),
    Relationship_Description TEXT,
    Management_Plan TEXT,
    COI_Status VARCHAR(50) DEFAULT 'Under Review',
    Review_Date DATE,
    Reviewed_By_Personnel_ID VARCHAR(50),
    CONSTRAINT chk_coi_status CHECK (COI_Status IN (
        'Under Review','No Conflict','Manageable Conflict','Unmanageable Conflict',
        'Management Plan Required','Cleared'
    )),
    CONSTRAINT chk_relationship_type CHECK (Relationship_Type IN (
        'Financial','Consulting','Employment','Equity','Intellectual Property',
        'Board Membership','Family','Other'
    )),
    CONSTRAINT fk_coi_personnel FOREIGN KEY (Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_coi_project FOREIGN KEY (Project_ID)
        REFERENCES Project(Project_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_coi_award FOREIGN KEY (Award_ID)
        REFERENCES Award(Award_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_coi_reviewer FOREIGN KEY (Reviewed_By_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Document
CREATE TABLE Document (
    Document_ID INT AUTO_INCREMENT PRIMARY KEY,
    Document_Type VARCHAR(50) NOT NULL,
    Document_Title VARCHAR(500),
    Related_Entity_Type VARCHAR(50) NOT NULL,
    Related_Entity_ID VARCHAR(50) NOT NULL,
    File_Name VARCHAR(255),
    Storage_Location VARCHAR(500),
    Storage_Key VARCHAR(500),
    File_Size_KB INT,
    MIME_Type VARCHAR(100),
    Upload_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Uploaded_By_Personnel_ID VARCHAR(50),
    Version_Number INT DEFAULT 1,
    Is_Current_Version BOOLEAN DEFAULT TRUE,
    Document_Status VARCHAR(50) DEFAULT 'Active',
    Access_Level VARCHAR(50) DEFAULT 'Internal',
    Retention_Date DATE,
    Description TEXT,
    Tags VARCHAR(500),
    CONSTRAINT chk_doc_type CHECK (Document_Type IN (
        'Proposal','Progress Report','Financial Report','Final Report',
        'Closeout Document','Award Notice','Modification','Correspondence',
        'Compliance Approval','Budget','SOW','Contract','Subaward',
        'Invoice','Receipt','Data Submission','Software Release',
        'Publication','Presentation','Other'
    )),
    CONSTRAINT chk_entity_type CHECK (Related_Entity_Type IN (
        'Award','Proposal','Project','ComplianceRequirement','Subaward','Organization',
        'Personnel','Invoice','AwardDeliverable','COI'
    )),
    CONSTRAINT chk_doc_status CHECK (Document_Status IN ('Active','Archived','Deleted','Superseded')),
    CONSTRAINT chk_access_level CHECK (Access_Level IN ('Public','Internal','Restricted','Confidential')),
    CONSTRAINT fk_doc_uploader FOREIGN KEY (Uploaded_By_Personnel_ID)
        REFERENCES Personnel(Personnel_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ActivityLog
CREATE TABLE ActivityLog (
    Activity_ID INT AUTO_INCREMENT PRIMARY KEY,
    Table_Name VARCHAR(100) NOT NULL,
    Record_ID VARCHAR(50) NOT NULL,
    Action_Type VARCHAR(20) NOT NULL,
    Action_Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    User_ID VARCHAR(50),
    Old_Values TEXT,
    New_Values TEXT,
    IP_Address VARCHAR(45),
    Session_ID VARCHAR(100),
    CONSTRAINT chk_action_type CHECK (Action_Type IN ('INSERT','UPDATE','DELETE','SELECT'))
);
