-- DataDictionary values for Research Administration Unified Data Model
-- Comprehensive documentation for all tables and columns
-- Uses INSERT IGNORE to skip any entries that already exist

INSERT IGNORE INTO DataDictionary (Entity, Entity_Type, Parent_Entity, Description, Synonyms, PII_Flag) VALUES

-- ====================
-- TABLE DOCUMENTATION
-- ====================

-- AllowedValues
('AllowedValues', 'Table', NULL, 'Stores allowed values for controlled vocabularies used in other tables', 'ValueList, LookupTable', FALSE),

-- BudgetCategory
('BudgetCategory', 'Table', NULL, 'Reference table for standardized budget categories used in proposals and awards', 'Budget Categories, Cost Categories', FALSE),

-- Account
('Account', 'Table', NULL, 'Chart of accounts for financial transactions and general ledger coding', 'GL Accounts, Account Codes', FALSE),

-- ActivityLog
('ActivityLog', 'Table', NULL, 'Audit trail of all data changes and user actions in the system', 'Audit Log, Change Log, History', FALSE),

-- AwardBudget
('AwardBudget', 'Table', NULL, 'Detailed budget line items for awards by budget period and category', 'Award Budget Lines', FALSE),

-- AwardBudgetPeriod
('AwardBudgetPeriod', 'Table', NULL, 'Budget periods for awards with funding amounts and dates', 'Award Periods, Budget Years', FALSE),

-- AwardDeliverable
('AwardDeliverable', 'Table', NULL, 'Required deliverables and reports for awards with due dates and status tracking', 'Reports, Deliverables, Milestones', FALSE),

-- ComplianceRequirement
('ComplianceRequirement', 'Table', NULL, 'Regulatory compliance requirements (IRB, IACUC, IBC, COI) for projects', 'IRB, IACUC, Compliance, Ethics Approvals', FALSE),

-- ConflictOfInterest
('ConflictOfInterest', 'Table', NULL, 'Conflict of interest disclosures and management plans for personnel', 'COI, Disclosures', FALSE),

-- CostShare
('CostShare', 'Table', NULL, 'Cost sharing commitments and contributions for awards', 'Cost Sharing, Matching Funds', FALSE),

-- Document
('Document', 'Table', NULL, 'Document management system for proposals, awards, reports, and other files', 'Files, Attachments, Documents', FALSE),

-- Effort
('Effort', 'Table', NULL, 'Effort certification and tracking for personnel time charged to projects', 'Effort Reporting, Time Allocation, PAR', FALSE),

-- FinanceCode
('FinanceCode', 'Table', NULL, 'Finance system codes linking awards to institutional accounting strings', 'Financial Codes, Account Strings, FOAP', FALSE),

-- Fund
('Fund', 'Table', NULL, 'Fund codes from institutional accounting system', 'Funds, Fund Codes', FALSE),

-- IndirectRate
('IndirectRate', 'Table', NULL, 'Negotiated indirect cost rates (F&A rates) for organizations', 'F&A Rates, Overhead Rates, IDC Rates, NICRA', FALSE),

-- Invoice
('Invoice', 'Table', NULL, 'Invoices submitted to sponsors for reimbursement or payment', 'Billing, Invoices, Payment Requests', FALSE),

-- Modification
('Modification', 'Table', NULL, 'Award modifications tracking funding changes, extensions, and amendments', 'Award Amendments, Changes, Revisions', FALSE),

-- Organization
('Organization', 'Table', NULL, 'Stores information about organizations, departments, colleges, sponsors, and other units', 'Org', FALSE),

-- Personnel
('Personnel', 'Table', NULL, 'Stores information about individuals involved in projects and awards', 'Person, Employee', FALSE),

-- ContactDetails
('ContactDetails', 'Table', NULL, 'Stores contact information for personnel and organizations', 'Contact, ContactInfo', FALSE),

-- Project
('Project', 'Table', NULL, 'Represents research or training projects', NULL, FALSE),

-- ProjectRole
('ProjectRole', 'Table', NULL, 'Personnel roles and assignments on projects with effort allocation', 'Project Team, Personnel Assignments, Roles', FALSE),

-- RFA
('RFA', 'Table', NULL, 'Represents Request for Applications or funding announcements', 'Funding Opportunity', FALSE),

-- Proposal
('Proposal', 'Table', NULL, 'Represents submitted proposals for projects', NULL, FALSE),

-- ProposalBudget
('ProposalBudget', 'Table', NULL, 'Detailed budget line items for proposals by period and category', 'Proposal Budget Lines', FALSE),

-- Award
('Award', 'Table', NULL, 'Represents awarded funding for projects', NULL, FALSE),

-- Subaward
('Subaward', 'Table', NULL, 'Represents subawards issued under prime awards', NULL, FALSE),

-- Terms
('Terms', 'Table', NULL, 'Terms and conditions for awards including payment, reporting, and special requirements', 'Award Terms, Conditions, Requirements', FALSE),

-- Transaction
('Transaction', 'Table', NULL, 'Financial transactions charged to awards from institutional accounting system', 'Expenses, Charges, Ledger Entries', FALSE),

-- ====================
-- COLUMN DOCUMENTATION
-- ====================

-- ========================================
-- AllowedValues Columns
-- ========================================
('Allowed_Value_ID', 'Column', 'AllowedValues', 'Primary key for allowed values', 'Value ID', FALSE),
('Allowed_Value_Group', 'Column', 'AllowedValues', 'Grouping category for related allowed values', 'Group, Category', FALSE),
('Allowed_Value_Code', 'Column', 'AllowedValues', 'Short code identifier for the value', 'Code, Key', FALSE),
('Allowed_Value_Label', 'Column', 'AllowedValues', 'Display label for the value in user interfaces', 'Label, Display Name', FALSE),
('Allowed_Value_Description', 'Column', 'AllowedValues', 'Detailed description of the value and its usage', 'Description', FALSE),

-- ========================================
-- BudgetCategory Columns
-- ========================================
('BudgetCategory_ID', 'Column', 'BudgetCategory', 'Primary key for budget category', 'Category ID', FALSE),
('Category_Code', 'Column', 'BudgetCategory', 'Short code for budget category', 'Code', FALSE),
('Category_Name', 'Column', 'BudgetCategory', 'Name of budget category (e.g., Personnel, Equipment, Travel)', 'Name', FALSE),
('Category_Description', 'Column', 'BudgetCategory', 'Description of what expenses belong in this category', 'Description', FALSE),

-- ========================================
-- Organization Columns
-- ========================================
('Organization_ID', 'Column', 'Organization', 'Primary key for organization', 'Org ID', FALSE),
('Organization_Name', 'Column', 'Organization', 'Full name of the organization', 'Name, Org Name', FALSE),
('Organization_Type', 'Column', 'Organization', 'Type of organization (Department, College, School, Sponsor, Subrecipient, Vendor, Institute, Center)', 'Type, Org Type', FALSE),
('Parent_Organization_ID', 'Column', 'Organization', 'Reference to parent organization in hierarchy', 'Parent Org ID', FALSE),
('UEI', 'Column', 'Organization', 'Unique Entity Identifier (12-character SAM registration number)', 'UEI, SAM Number', FALSE),

-- ========================================
-- Personnel Columns
-- ========================================
('Personnel_ID', 'Column', 'Personnel', 'Primary key for personnel record', 'Person ID, Employee ID', FALSE),
('ORCID', 'Column', 'Personnel', 'Open Researcher and Contributor ID in format XXXX-XXXX-XXXX-XXXX', 'ORCID iD', TRUE),
('First_Name', 'Column', 'Personnel', 'First name of individual', 'Given Name, Forename', TRUE),
('Last_Name', 'Column', 'Personnel', 'Last name of individual', 'Surname, Family Name', TRUE),
('Middle_Name', 'Column', 'Personnel', 'Middle name or initial of individual', 'Middle Initial', TRUE),
('Institutional_ID', 'Column', 'Personnel', 'Institution-specific identifier for personnel', 'Employee ID, Net ID', FALSE),
('Primary_Email', 'Column', 'Personnel', 'Primary email address for communication', 'Email, Work Email', TRUE),
('Person_Type', 'Column', 'Personnel', 'Type of personnel (Faculty, Staff, Student, External, Postdoc, Resident, Fellow)', 'Type, Role', FALSE),
('Department_Organization_ID', 'Column', 'Personnel', 'Reference to primary department organization', 'Department ID, Org ID', FALSE),

-- ========================================
-- ContactDetails Columns
-- ========================================
('ContactDetails_ID', 'Column', 'ContactDetails', 'Primary key for contact detail record', 'Contact ID', FALSE),
('Personnel_ID', 'Column', 'ContactDetails', 'Reference to personnel (mutually exclusive with Organization_ID)', 'Person ID', FALSE),
('Organization_ID', 'Column', 'ContactDetails', 'Reference to organization (mutually exclusive with Personnel_ID)', 'Org ID', FALSE),
('AllowedValue_ID', 'Column', 'ContactDetails', 'Type of contact (Email, Phone, Fax) from AllowedValues', 'Contact Type ID', FALSE),
('ContactDetails_Value', 'Column', 'ContactDetails', 'The actual contact value (email address, phone number, etc.)', 'Value, Contact Info', TRUE),

-- ========================================
-- IndirectRate Columns
-- ========================================
('IndirectRate_ID', 'Column', 'IndirectRate', 'Primary key for indirect rate record', 'Rate ID', FALSE),
('Organization_ID', 'Column', 'IndirectRate', 'Organization to which this indirect cost rate applies', 'Applicable Organization, Org ID', FALSE),
('Rate_Type', 'Column', 'IndirectRate', 'Type of indirect rate (On-Campus, Off-Campus, MTDC, TDC, Clinical Trial, Fringe Benefits, Facilities, Administrative)', 'Type', FALSE),
('Rate_Percentage', 'Column', 'IndirectRate', 'Percentage rate as decimal (e.g., 55.50 for 55.5%)', 'Rate, Percentage', FALSE),
('Effective_Start_Date', 'Column', 'IndirectRate', 'Date when rate becomes effective', 'Start Date, Effective Date', FALSE),
('Effective_End_Date', 'Column', 'IndirectRate', 'Date when rate expires (NULL if still active)', 'End Date, Expiration Date', FALSE),
('Base_Type', 'Column', 'IndirectRate', 'Base type for rate calculation (MTDC, TDC, Salaries and Wages, Direct Salaries)', 'Base', FALSE),
('Negotiated_Agreement_ID', 'Column', 'IndirectRate', 'Reference to negotiated rate agreement document', 'NICRA ID, Agreement ID', FALSE),

-- ========================================
-- Project Columns
-- ========================================
('Project_ID', 'Column', 'Project', 'Primary key for project', 'Project Number', FALSE),
('Project_Title', 'Column', 'Project', 'Full title of the project', 'Title', FALSE),
('Acronym', 'Column', 'Project', 'Short acronym or abbreviation for project', 'Short Name, Abbreviation', FALSE),
('Parent_Project_ID', 'Column', 'Project', 'Reference to parent project for sub-projects', 'Parent Project', FALSE),
('Project_Type_Value_ID', 'Column', 'Project', 'Type of project from AllowedValues (Research, Training, Service, Clinical Trial, Fellowship, Infrastructure, Other)', 'Type', FALSE),
('Abstract', 'Column', 'Project', 'Abstract or summary description of project', 'Summary, Description', FALSE),
('Start_Date', 'Column', 'Project', 'Project start date', 'Begin Date', FALSE),
('End_Date', 'Column', 'Project', 'Project end date', 'Completion Date', FALSE),
('Lead_Organization_ID', 'Column', 'Project', 'Primary organization leading the project', 'Lead Org, Primary Org', FALSE),
('Project_Status', 'Column', 'Project', 'Current status (Planning, Active, Completed, Suspended, Cancelled)', 'Status', FALSE),

-- ========================================
-- RFA Columns
-- ========================================
('RFA_ID', 'Column', 'RFA', 'Primary key for request for application', 'RFA Number, Opportunity ID', FALSE),
('Sponsor_Organization_ID', 'Column', 'RFA', 'Sponsoring organization issuing the RFA', 'Sponsor ID, Agency ID', FALSE),
('RFA_Number', 'Column', 'RFA', 'Official RFA or funding opportunity number', 'FOA Number, Number', FALSE),
('RFA_Title', 'Column', 'RFA', 'Title of the funding opportunity', 'Opportunity Title, Title', FALSE),
('Program_Code', 'Column', 'RFA', 'Program code or activity code for the opportunity', 'Activity Code', FALSE),
('Announcement_URL', 'Column', 'RFA', 'URL to the full announcement', 'URL, Link', FALSE),
('Opportunity_Number', 'Column', 'RFA', 'Grants.gov or other system opportunity number', 'Opp Number', FALSE),
('CFDA_Number', 'Column', 'RFA', 'Catalog of Federal Domestic Assistance number', 'CFDA, Assistance Listing Number', FALSE),

-- ========================================
-- Proposal Columns
-- ========================================
('Proposal_ID', 'Column', 'Proposal', 'Primary key for proposal', 'Proposal Number', FALSE),
('Proposal_Number', 'Column', 'Proposal', 'Institution-assigned proposal number', 'Number, Ref Number', FALSE),
('Proposal_Title', 'Column', 'Proposal', 'Title of the proposal', 'Title', FALSE),
('Project_ID', 'Column', 'Proposal', 'Associated project (may be NULL for new projects)', 'Project', FALSE),
('Sponsor_Organization_ID', 'Column', 'Proposal', 'Organization to which proposal is submitted', 'Sponsor ID, Agency ID', FALSE),
('Submitting_Organization_ID', 'Column', 'Proposal', 'Organization submitting the proposal', 'Submitter Org ID', FALSE),
('Administering_Organization_ID', 'Column', 'Proposal', 'Organization that will administer the award if funded', 'Admin Org ID', FALSE),
('RFA_ID', 'Column', 'Proposal', 'Associated request for application', 'RFA, Opportunity', FALSE),
('Previous_Proposal_ID', 'Column', 'Proposal', 'Reference to previous related proposal (renewals, resubmissions)', 'Parent Proposal, Prior Proposal', FALSE),
('Submission_Version', 'Column', 'Proposal', 'Version number for resubmissions', 'Version', FALSE),
('Proposed_Start_Date', 'Column', 'Proposal', 'Proposed project start date', 'Start Date', FALSE),
('Proposed_End_Date', 'Column', 'Proposal', 'Proposed project end date', 'End Date', FALSE),
('Total_Proposed_Direct', 'Column', 'Proposal', 'Total direct costs proposed', 'Direct Costs', FALSE),
('Total_Proposed_Indirect', 'Column', 'Proposal', 'Total indirect costs proposed', 'Indirect Costs, F&A Costs', FALSE),
('Total_Proposed_Budget', 'Column', 'Proposal', 'Total budget proposed (direct + indirect)', 'Total Budget', FALSE),
('Submission_Deadline', 'Column', 'Proposal', 'Sponsor deadline for submission', 'Deadline, Due Date', FALSE),
('Submission_Date', 'Column', 'Proposal', 'Actual date submitted to sponsor', 'Submit Date', FALSE),
('Internal_Approval_Status', 'Column', 'Proposal', 'Internal approval status (Draft, In Review, Approved, Rejected, Withdrawn)', 'Approval Status', FALSE),
('Decision_Status', 'Column', 'Proposal', 'Sponsor decision status (Pending, Submitted, Under Review, Awarded, Declined, Withdrawn)', 'Status', FALSE),
('Decision_Date', 'Column', 'Proposal', 'Date sponsor made funding decision', 'Award Date, Decline Date', FALSE),
('PAF_Routing_Status', 'Column', 'Proposal', 'Proposal approval form routing status', 'Routing Status, Workflow Status', FALSE),

-- ========================================
-- ProposalBudget Columns
-- ========================================
('ProposalBudget_ID', 'Column', 'ProposalBudget', 'Primary key for proposal budget line item', 'Budget Line ID', FALSE),
('Proposal_ID', 'Column', 'ProposalBudget', 'Reference to parent proposal', 'Proposal', FALSE),
('Period_Number', 'Column', 'ProposalBudget', 'Budget period number (typically 1-5 for multi-year budgets)', 'Period, Year', FALSE),
('BudgetCategory_ID', 'Column', 'ProposalBudget', 'Budget category for this line item', 'Category', FALSE),
('Line_Item_Description', 'Column', 'ProposalBudget', 'Description of specific budget line item', 'Description, Line Item', FALSE),
('Direct_Cost', 'Column', 'ProposalBudget', 'Direct cost amount for this line item', 'Direct', FALSE),
('Indirect_Cost', 'Column', 'ProposalBudget', 'Indirect cost amount for this line item', 'Indirect, F&A', FALSE),
('Total_Cost', 'Column', 'ProposalBudget', 'Total cost (direct + indirect) for this line item', 'Total', FALSE),
('Quantity', 'Column', 'ProposalBudget', 'Quantity of units for calculation', 'Qty, Units', FALSE),
('Unit_Cost', 'Column', 'ProposalBudget', 'Cost per unit', 'Rate, Price', FALSE),
('Applied_Indirect_Rate_ID', 'Column', 'ProposalBudget', 'Indirect rate applied to this line item', 'IDC Rate ID', FALSE),
('Rate_Base_Used', 'Column', 'ProposalBudget', 'Base type used for indirect rate calculation (MTDC, TDC, Salaries and Wages, Direct Salaries)', 'Base', FALSE),
('Version_No', 'Column', 'ProposalBudget', 'Budget version number for tracking revisions', 'Version', FALSE),

-- ========================================
-- Award Columns
-- ========================================
('Award_ID', 'Column', 'Award', 'Primary key for award', 'Award Number', FALSE),
('Award_Number', 'Column', 'Award', 'Official sponsor-assigned award number', 'Number', FALSE),
('Award_Title', 'Column', 'Award', 'Title of the award', 'Title', FALSE),
('Project_ID', 'Column', 'Award', 'Associated project', 'Project', FALSE),
('Sponsor_Organization_ID', 'Column', 'Award', 'Direct sponsor providing funding', 'Sponsor ID, Agency ID', FALSE),
('RFA_ID', 'Column', 'Award', 'Original request for application', 'RFA, Opportunity', FALSE),
('Proposal_ID', 'Column', 'Award', 'Proposal that resulted in this award', 'Proposal', FALSE),
('Original_Start_Date', 'Column', 'Award', 'Original project period start date', 'Start Date, Begin Date', FALSE),
('Original_End_Date', 'Column', 'Award', 'Original project period end date', 'End Date', FALSE),
('Current_Total_Funded', 'Column', 'Award', 'Current total funded amount including modifications', 'Total Funding, Funded Amount', FALSE),
('Current_End_Date', 'Column', 'Award', 'Current project period end date (may differ from original due to extensions)', 'End Date', FALSE),
('Total_Anticipated_Funding', 'Column', 'Award', 'Total anticipated funding over full award life', 'Total Award', FALSE),
('Award_Status', 'Column', 'Award', 'Current status (Pending, Active, Closed, Suspended, Terminated)', 'Status', FALSE),
('CFDA_Number', 'Column', 'Award', 'Catalog of Federal Domestic Assistance number', 'CFDA, Assistance Listing Number', FALSE),
('Federal_Award_ID', 'Column', 'Award', 'Federal award identification number for federal awards', 'FAIN', FALSE),
('Prime_Sponsor_Organization_ID', 'Column', 'Award', 'Ultimate funding source for flow-through awards', 'Prime Sponsor, Prime Agency', FALSE),
('Flow_Through_Indicator', 'Column', 'Award', 'Flag indicating if this is a flow-through award', 'Flow Through, Pass Through', FALSE),

-- ========================================
-- Modification Columns
-- ========================================
('Modification_ID', 'Column', 'Modification', 'Primary key for modification', 'Mod ID, Amendment ID', FALSE),
('Award_ID', 'Column', 'Modification', 'Award being modified', 'Award', FALSE),
('Modification_Number', 'Column', 'Modification', 'Sequential modification number', 'Mod Number, Amendment Number', FALSE),
('Event_Type_Value_ID', 'Column', 'Modification', 'Type of modification event from AllowedValues (Initial Award, Incremental Funding, No Cost Extension, Budget Revision, Scope Change, Personnel Change, Termination, Supplement, Carryforward, Administrative Change)', 'Type', FALSE),
('Event_Timestamp', 'Column', 'Modification', 'Date and time modification was recorded in system', 'Timestamp', FALSE),
('Effective_Date', 'Column', 'Modification', 'Date modification becomes effective', 'Effective Date', FALSE),
('Funding_Amount_Change', 'Column', 'Modification', 'Change in funding amount (positive or negative)', 'Funding Change, Amount Change', FALSE),
('New_End_Date', 'Column', 'Modification', 'New end date if modification includes date extension', 'End Date', FALSE),
('Affected_Personnel_ID', 'Column', 'Modification', 'Personnel affected by modification (for personnel changes)', 'Person ID', FALSE),
('Change_Description', 'Column', 'Modification', 'Description of what changed', 'Description, Details', FALSE),
('Justification', 'Column', 'Modification', 'Justification for the modification', 'Reason', FALSE),
('Impact_on_Budget', 'Column', 'Modification', 'Flag indicating if modification impacts budget', 'Budget Impact', FALSE),
('Requires_Prior_Approval', 'Column', 'Modification', 'Flag indicating if sponsor prior approval was required', 'Prior Approval Required', FALSE),
('Approval_Status', 'Column', 'Modification', 'Status of approval (Pending, Approved, Rejected, Not Required)', 'Status', FALSE),
('Approved_By_Personnel_ID', 'Column', 'Modification', 'Personnel who approved the modification', 'Approver ID', FALSE),
('Approval_Date', 'Column', 'Modification', 'Date modification was approved', 'Approval Date', FALSE),

-- ========================================
-- Terms Columns
-- ========================================
('AwardTerms_ID', 'Column', 'Terms', 'Primary key for award terms', 'Terms ID', FALSE),
('Award_ID', 'Column', 'Terms', 'Award these terms apply to', 'Award', FALSE),
('Payment_Method', 'Column', 'Terms', 'Payment method (Reimbursement, Advance, Cost-Reimbursement, Fixed-Price, Letter-of-Credit, Payment-Request)', 'Payment Type', FALSE),
('Invoicing_Frequency', 'Column', 'Terms', 'How often invoices should be submitted (Monthly, Quarterly, Semi-Annual, Annual, Upon-Request, Milestone)', 'Billing Frequency', FALSE),
('Invoice_Submission_Days', 'Column', 'Terms', 'Number of days allowed for invoice submission after period end', 'Submission Days', FALSE),
('Reporting_Requirements', 'Column', 'Terms', 'Description of reporting requirements', 'Reports Required', FALSE),
('Special_Conditions', 'Column', 'Terms', 'Special terms and conditions of the award', 'Conditions', FALSE),
('Property_Requirements', 'Column', 'Terms', 'Equipment and property management requirements', 'Property Rules', FALSE),
('Publication_Requirements', 'Column', 'Terms', 'Requirements for publications and acknowledgments', 'Publication Rules', FALSE),
('Closeout_Requirements', 'Column', 'Terms', 'Requirements for award closeout', 'Closeout', FALSE),
('Record_Retention_Years', 'Column', 'Terms', 'Number of years records must be retained', 'Retention Period', FALSE),

-- ========================================
-- AwardBudgetPeriod Columns
-- ========================================
('AwardBudgetPeriod_ID', 'Column', 'AwardBudgetPeriod', 'Primary key for award budget period', 'Period ID', FALSE),
('Award_ID', 'Column', 'AwardBudgetPeriod', 'Award this period belongs to', 'Award', FALSE),
('Period_Number', 'Column', 'AwardBudgetPeriod', 'Sequential period number', 'Period, Year', FALSE),
('Start_Date', 'Column', 'AwardBudgetPeriod', 'Period start date', 'Begin Date', FALSE),
('End_Date', 'Column', 'AwardBudgetPeriod', 'Period end date', 'End Date', FALSE),
('Direct_Costs', 'Column', 'AwardBudgetPeriod', 'Total direct costs for period', 'Direct', FALSE),
('Indirect_Costs', 'Column', 'AwardBudgetPeriod', 'Total indirect costs for period', 'Indirect, F&A', FALSE),
('Total_Costs', 'Column', 'AwardBudgetPeriod', 'Total costs for period (direct + indirect)', 'Total', FALSE),
('Cost_Share_Amount', 'Column', 'AwardBudgetPeriod', 'Cost share required for period', 'Cost Share', FALSE),
('Period_Status', 'Column', 'AwardBudgetPeriod', 'Status of period (Pending, Released, Active, Closed)', 'Status', FALSE),

-- ========================================
-- AwardBudget Columns
-- ========================================
('Award_Budget_ID', 'Column', 'AwardBudget', 'Primary key for award budget line item', 'Budget Line ID', FALSE),
('Award_ID', 'Column', 'AwardBudget', 'Award this budget line belongs to', 'Award', FALSE),
('AwardBudgetPeriod_ID', 'Column', 'AwardBudget', 'Budget period this line belongs to', 'Period ID', FALSE),
('BudgetCategory_ID', 'Column', 'AwardBudget', 'Budget category for this line', 'Category', FALSE),
('Line_Item_Description', 'Column', 'AwardBudget', 'Description of budget line item', 'Description, Line Item', FALSE),
('Approved_Direct_Cost', 'Column', 'AwardBudget', 'Originally approved direct cost amount', 'Approved Direct', FALSE),
('Approved_Indirect_Cost', 'Column', 'AwardBudget', 'Originally approved indirect cost amount', 'Approved Indirect', FALSE),
('Approved_Total_Cost', 'Column', 'AwardBudget', 'Originally approved total cost amount', 'Approved Total', FALSE),
('Current_Direct_Cost', 'Column', 'AwardBudget', 'Current direct cost amount after modifications', 'Current Direct', FALSE),
('Current_Indirect_Cost', 'Column', 'AwardBudget', 'Current indirect cost amount after modifications', 'Current Indirect', FALSE),
('Current_Total_Cost', 'Column', 'AwardBudget', 'Current total cost amount after modifications', 'Current Total', FALSE),
('Rate_Base_Used', 'Column', 'AwardBudget', 'Base type used for indirect rate calculation (MTDC, TDC, Salaries and Wages, Direct Salaries)', 'Base', FALSE),

-- ========================================
-- Subaward Columns
-- ========================================
('Subaward_ID', 'Column', 'Subaward', 'Primary key for subaward', 'Subaward Number', FALSE),
('Prime_Award_ID', 'Column', 'Subaward', 'Prime award funding this subaward', 'Prime Award', FALSE),
('Subrecipient_Organization_ID', 'Column', 'Subaward', 'Organization receiving subaward', 'Subrecipient ID, Sub Org ID', FALSE),
('Subaward_Number', 'Column', 'Subaward', 'Institution-assigned subaward number', 'Number', FALSE),
('Subaward_Amount', 'Column', 'Subaward', 'Total subaward amount', 'Amount', FALSE),
('Start_Date', 'Column', 'Subaward', 'Subaward start date', 'Begin Date', FALSE),
('End_Date', 'Column', 'Subaward', 'Subaward end date', 'End Date', FALSE),
('Subaward_Status', 'Column', 'Subaward', 'Current status (Pending, Active, Closed, Terminated, Suspended)', 'Status', FALSE),
('Statement_of_Work', 'Column', 'Subaward', 'Statement of work for subrecipient', 'SOW, Scope of Work', FALSE),
('PI_Name', 'Column', 'Subaward', 'Name of principal investigator at subrecipient institution', 'Subrecipient PI', TRUE),
('Monitoring_Plan', 'Column', 'Subaward', 'Plan for monitoring subrecipient performance', 'Monitoring', FALSE),
('Risk_Level', 'Column', 'Subaward', 'Risk assessment level (Low, Medium, High)', 'Risk', FALSE),

-- ========================================
-- CostShare Columns
-- ========================================
('CostShare_ID', 'Column', 'CostShare', 'Primary key for cost share commitment', 'Cost Share ID', FALSE),
('Award_ID', 'Column', 'CostShare', 'Award requiring cost share', 'Award', FALSE),
('Committed_Amount', 'Column', 'CostShare', 'Amount committed for cost sharing', 'Commitment, Amount', FALSE),
('Commitment_Type', 'Column', 'CostShare', 'Type of cost share (Cash, In-Kind, Third-Party, Waived IDC)', 'Type', FALSE),
('Source_Organization_ID', 'Column', 'CostShare', 'Organization providing cost share', 'Source Org', FALSE),
('Source_Fund_Code', 'Column', 'CostShare', 'Fund code for cost share source', 'Fund', FALSE),
('Source_Description', 'Column', 'CostShare', 'Description of cost share source', 'Description', FALSE),
('Is_Mandatory', 'Column', 'CostShare', 'Flag indicating if cost share is mandatory or voluntary', 'Mandatory', FALSE),
('CostShare_Status', 'Column', 'CostShare', 'Status (Committed, In Progress, Met, Waived)', 'Status', FALSE),
('Met_Amount', 'Column', 'CostShare', 'Amount of cost share commitment actually met', 'Met', FALSE),

-- ========================================
-- Invoice Columns
-- ========================================
('Invoice_ID', 'Column', 'Invoice', 'Primary key for invoice', 'Invoice Number', FALSE),
('Award_ID', 'Column', 'Invoice', 'Award being invoiced', 'Award', FALSE),
('Invoice_Number', 'Column', 'Invoice', 'Institution-assigned invoice number', 'Number', FALSE),
('AwardBudgetPeriod_ID', 'Column', 'Invoice', 'Budget period being invoiced', 'Period ID', FALSE),
('Invoice_Date', 'Column', 'Invoice', 'Date invoice was created', 'Date', FALSE),
('Period_Start_Date', 'Column', 'Invoice', 'Start date of period covered by invoice', 'Period Start', FALSE),
('Period_End_Date', 'Column', 'Invoice', 'End date of period covered by invoice', 'Period End', FALSE),
('Direct_Costs', 'Column', 'Invoice', 'Direct costs invoiced', 'Direct', FALSE),
('Indirect_Costs', 'Column', 'Invoice', 'Indirect costs invoiced', 'Indirect, F&A', FALSE),
('Cost_Share', 'Column', 'Invoice', 'Cost share amount reported on invoice', 'Cost Share', FALSE),
('Total_Amount', 'Column', 'Invoice', 'Total amount invoiced', 'Total', FALSE),
('Invoice_Status', 'Column', 'Invoice', 'Status (Draft, Submitted, Under Review, Approved, Paid, Rejected)', 'Status', FALSE),
('Submission_Date', 'Column', 'Invoice', 'Date invoice was submitted to sponsor', 'Submit Date', FALSE),
('Payment_Date', 'Column', 'Invoice', 'Date payment was received', 'Paid Date', FALSE),
('Payment_Amount', 'Column', 'Invoice', 'Amount of payment received', 'Payment', FALSE),

-- ========================================
-- AwardDeliverable Columns
-- ========================================
('AwardDeliverable_ID', 'Column', 'AwardDeliverable', 'Primary key for award deliverable', 'Deliverable ID', FALSE),
('Award_ID', 'Column', 'AwardDeliverable', 'Award requiring deliverable', 'Award', FALSE),
('Deliverable_Type_Value_ID', 'Column', 'AwardDeliverable', 'Type of deliverable from AllowedValues (Technical Progress Report, Financial Report, Annual Report, Final Technical Report, Final Financial Report, Property Report, Invention Disclosure, Animal Welfare Report, Data Submission, Software Release, Clinical Trial Registration, Publication, Presentation, Material Transfer, Other)', 'Type', FALSE),
('AwardBudgetPeriod_ID', 'Column', 'AwardDeliverable', 'Budget period deliverable is due for', 'Period ID', FALSE),
('Deliverable_Number', 'Column', 'AwardDeliverable', 'Sequential deliverable number', 'Number', FALSE),
('Due_Date', 'Column', 'AwardDeliverable', 'Date deliverable is due', 'Due Date, Deadline', FALSE),
('Submission_Date', 'Column', 'AwardDeliverable', 'Date deliverable was submitted', 'Submit Date', FALSE),
('Deliverable_Status', 'Column', 'AwardDeliverable', 'Status (Pending, In Progress, Submitted, Accepted, Revision Required, Overdue)', 'Status', FALSE),
('Responsible_Personnel_ID', 'Column', 'AwardDeliverable', 'Personnel responsible for completing deliverable', 'Responsible Person', FALSE),
('Reviewed_By_Personnel_ID', 'Column', 'AwardDeliverable', 'Personnel who reviewed deliverable', 'Reviewer', FALSE),
('Review_Date', 'Column', 'AwardDeliverable', 'Date deliverable was reviewed', 'Review Date', FALSE),
('Comments', 'Column', 'AwardDeliverable', 'Comments or notes about deliverable', 'Notes', FALSE),

-- ========================================
-- ProjectRole Columns
-- ========================================
('ProjectRole_ID', 'Column', 'ProjectRole', 'Primary key for project role', 'Role ID', FALSE),
('Project_ID', 'Column', 'ProjectRole', 'Project this role belongs to', 'Project', FALSE),
('Personnel_ID', 'Column', 'ProjectRole', 'Person assigned to role', 'Person ID', FALSE),
('Role_Value_ID', 'Column', 'ProjectRole', 'Role type from AllowedValues (PI, Co-PI, Co-I, Key Personnel, etc.)', 'Role', FALSE),
('Is_Key_Personnel', 'Column', 'ProjectRole', 'Flag indicating if this is key personnel', 'Key Personnel', FALSE),
('Funding_Award_ID', 'Column', 'ProjectRole', 'Award funding this role', 'Award', FALSE),
('Start_Date', 'Column', 'ProjectRole', 'Date person started in role', 'Begin Date', FALSE),
('End_Date', 'Column', 'ProjectRole', 'Date person ended in role', 'End Date', FALSE),
('FTE_Percent', 'Column', 'ProjectRole', 'Full-time equivalent percentage allocated to role', 'FTE, Effort', FALSE),
('Salary_Charged', 'Column', 'ProjectRole', 'Salary amount charged to project', 'Salary', FALSE),

-- ========================================
-- Fund Columns
-- ========================================
('Fund_Code', 'Column', 'Fund', 'Primary key fund code from institutional accounting system', 'Fund', FALSE),
('Fund_Name', 'Column', 'Fund', 'Descriptive name of fund', 'Name', FALSE),
('Fund_Type_Value_ID', 'Column', 'Fund', 'Fund type from AllowedValues', 'Fund Type', FALSE),
('Organization_ID', 'Column', 'Fund', 'Organization responsible for fund', 'Org ID', FALSE),

-- ========================================
-- Account Columns
-- ========================================
('Account_Code', 'Column', 'Account', 'Primary key account code from chart of accounts', 'Account', FALSE),
('Account_Name', 'Column', 'Account', 'Descriptive name of account', 'Name', FALSE),
('Account_Category', 'Column', 'Account', 'Category of account describing the nature of the expense (e.g., Salaries, Supplies, Equipment, Travel)', 'Natural Classification, Category', FALSE),
('Account_Type', 'Column', 'Account', 'Type of account (Expense, Revenue, Asset, Liability, Equity)', 'Type', FALSE),
('Parent_Account_Code', 'Column', 'Account', 'Parent account for hierarchical chart of accounts', 'Parent Account', FALSE),

-- ========================================
-- FinanceCode Columns
-- ========================================
('Finance_Code', 'Column', 'FinanceCode', 'Primary key finance code', 'Finance String, FOAP', FALSE),
('Finance_Name', 'Column', 'FinanceCode', 'Descriptive name of finance code', 'Name', FALSE),
('Award_ID', 'Column', 'FinanceCode', 'Award associated with finance code', 'Award', FALSE),
('Purpose_Value_ID', 'Column', 'FinanceCode', 'Purpose of finance code from AllowedValues (Direct Costs, Cost Share, Indirect Costs, Subcontract, Department Share, Program Income, Other)', 'Use', FALSE),
('Organization_ID', 'Column', 'FinanceCode', 'Organization responsible for finance code', 'Org ID', FALSE),

-- ========================================
-- Transaction Columns
-- ========================================
('Transaction_ID', 'Column', 'Transaction', 'Primary key for transaction', 'Trans ID', FALSE),
('Fund_Code', 'Column', 'Transaction', 'Fund code transaction is charged to', 'Fund', FALSE),
('Account_Code', 'Column', 'Transaction', 'Account code transaction is charged to', 'Account', FALSE),
('Finance_Code', 'Column', 'Transaction', 'Finance code transaction is charged to', 'Finance String', FALSE),
('Transaction_Date', 'Column', 'Transaction', 'Date transaction occurred', 'Date', FALSE),
('Fiscal_Year', 'Column', 'Transaction', 'Fiscal year of transaction', 'FY', FALSE),
('Fiscal_Period', 'Column', 'Transaction', 'Fiscal period of transaction (typically 1-12 for months)', 'Period, Month', FALSE),
('Transaction_Amount', 'Column', 'Transaction', 'Dollar amount of transaction', 'Amount', FALSE),
('Transaction_Type_Value_ID', 'Column', 'Transaction', 'Type of transaction from AllowedValues (Expense, Revenue, Encumbrance, Transfer, Adjustment, Reversal, Cost Share)', 'Type', FALSE),
('Description', 'Column', 'Transaction', 'Description of transaction', 'Details, Memo', FALSE),
('Award_ID', 'Column', 'Transaction', 'Award transaction is associated with', 'Award', FALSE),
('Project_ID', 'Column', 'Transaction', 'Project transaction is associated with', 'Project', FALSE),
('AwardBudgetPeriod_ID', 'Column', 'Transaction', 'Budget period transaction is associated with', 'Period ID', FALSE),
('Document_Number', 'Column', 'Transaction', 'Document number from source system', 'Doc Number', FALSE),
('Journal_ID', 'Column', 'Transaction', 'Journal entry identifier', 'Journal Number', FALSE),
('Vendor_ID', 'Column', 'Transaction', 'Vendor identifier for expense transactions', 'Vendor', FALSE),
('Personnel_ID', 'Column', 'Transaction', 'Personnel associated with transaction (for salary transactions)', 'Person ID', FALSE),
('Reference_Number', 'Column', 'Transaction', 'Reference or confirmation number', 'Reference', FALSE),
('Is_Reconciled', 'Column', 'Transaction', 'Flag indicating if transaction has been reconciled', 'Reconciled', FALSE),

-- ========================================
-- Effort Columns
-- ========================================
('Effort_ID', 'Column', 'Effort', 'Primary key for effort record', 'Effort ID', FALSE),
('ProjectRole_ID', 'Column', 'Effort', 'Project role this effort record belongs to', 'Role ID', FALSE),
('Period_Start_Date', 'Column', 'Effort', 'Start date of effort reporting period', 'Period Start', FALSE),
('Period_End_Date', 'Column', 'Effort', 'End date of effort reporting period', 'Period End', FALSE),
('Committed_Percent', 'Column', 'Effort', 'Committed effort percentage', 'Committed Effort', FALSE),
('Committed_Person_Months', 'Column', 'Effort', 'Committed effort in person months', 'Person Months', FALSE),
('Actual_Percent', 'Column', 'Effort', 'Actual effort percentage expended', 'Actual Effort', FALSE),
('Variance_Percent', 'Column', 'Effort', 'Variance between committed and actual effort', 'Variance', FALSE),
('Is_Certified', 'Column', 'Effort', 'Flag indicating if effort has been certified', 'Certified', FALSE),
('Certification_Date', 'Column', 'Effort', 'Date effort was certified', 'Cert Date', FALSE),
('Certified_By_Personnel_ID', 'Column', 'Effort', 'Person who certified the effort', 'Certifier', FALSE),
('Certification_Method', 'Column', 'Effort', 'Method used for certification (PAR, Activity Report, Timesheet, Other)', 'Method', FALSE),
('Requires_Prior_Approval', 'Column', 'Effort', 'Flag indicating if variance requires sponsor prior approval', 'Prior Approval Required', FALSE),
('Prior_Approval_Status', 'Column', 'Effort', 'Status of prior approval (Not Required, Pending, Approved, Denied)', 'Approval Status', FALSE),

-- ========================================
-- ComplianceRequirement Columns
-- ========================================
('ComplianceRequirement_ID', 'Column', 'ComplianceRequirement', 'Primary key for compliance requirement', 'Requirement ID, Protocol ID', FALSE),
('Requirement_Number', 'Column', 'ComplianceRequirement', 'Institution-assigned requirement number', 'Protocol Number, IRB Number', FALSE),
('Requirement_Title', 'Column', 'ComplianceRequirement', 'Title of compliance requirement or protocol', 'Title', FALSE),
('Requirement_Type', 'Column', 'ComplianceRequirement', 'Type of requirement (IRB, IACUC, IBC, COI, Radiation, Other)', 'Type', FALSE),
('Project_ID', 'Column', 'ComplianceRequirement', 'Project this requirement applies to', 'Project', FALSE),
('Review_Type', 'Column', 'ComplianceRequirement', 'Type of review (Exempt, Expedited, Full Board, Not Human Subjects, Administrative)', 'Review Level', FALSE),
('Initial_Approval_Date', 'Column', 'ComplianceRequirement', 'Date of initial approval', 'Approval Date', FALSE),
('Expiration_Date', 'Column', 'ComplianceRequirement', 'Date approval expires', 'Expiry Date', FALSE),
('Requirement_Status', 'Column', 'ComplianceRequirement', 'Current status (Draft, Submitted, In Review, Approved, Expired, Conditional Approval, Disapproved, Terminated, Suspended, Closed)', 'Status', FALSE),
('Principal_Investigator_ID', 'Column', 'ComplianceRequirement', 'Principal investigator for requirement', 'PI', FALSE),
('Approval_Body', 'Column', 'ComplianceRequirement', 'Name of approving committee or body', 'Committee', FALSE),
('Risk_Level', 'Column', 'ComplianceRequirement', 'Risk level assessment (Minimal, More than Minimal, High)', 'Risk', FALSE),

-- ========================================
-- ConflictOfInterest Columns
-- ========================================
('ConflictOfInterest_ID', 'Column', 'ConflictOfInterest', 'Primary key for conflict of interest disclosure', 'COI ID', FALSE),
('Personnel_ID', 'Column', 'ConflictOfInterest', 'Person making disclosure', 'Person ID', FALSE),
('Project_ID', 'Column', 'ConflictOfInterest', 'Project disclosure relates to', 'Project', FALSE),
('Award_ID', 'Column', 'ConflictOfInterest', 'Award disclosure relates to', 'Award', FALSE),
('Disclosure_Date', 'Column', 'ConflictOfInterest', 'Date disclosure was made', 'Date', FALSE),
('Relationship_Type_Value_ID', 'Column', 'ConflictOfInterest', 'Type of relationship from AllowedValues (Financial, Consulting, Employment, Equity, Intellectual Property, Board Membership, Family, Other)', 'Type', FALSE),
('Entity_Name', 'Column', 'ConflictOfInterest', 'Name of entity involved in potential conflict', 'Company, Organization', FALSE),
('Financial_Interest_Amount', 'Column', 'ConflictOfInterest', 'Dollar value of financial interest', 'Amount', FALSE),
('Relationship_Description', 'Column', 'ConflictOfInterest', 'Description of relationship and potential conflict', 'Description', FALSE),
('Management_Plan', 'Column', 'ConflictOfInterest', 'Plan for managing identified conflict', 'Plan', FALSE),
('ConflictOfInterest_Status', 'Column', 'ConflictOfInterest', 'Status (Under Review, No Conflict, Manageable Conflict, Unmanageable Conflict, Management Plan Required, Cleared)', 'COI Status, Status', FALSE),
('Review_Date', 'Column', 'ConflictOfInterest', 'Date disclosure was reviewed', 'Review Date', FALSE),
('Reviewed_By_Personnel_ID', 'Column', 'ConflictOfInterest', 'Person who reviewed disclosure', 'Reviewer', FALSE),

-- ========================================
-- Document Columns
-- ========================================
('Document_ID', 'Column', 'Document', 'Primary key for document', 'Doc ID', FALSE),
('Document_Type_Value_ID', 'Column', 'Document', 'Type of document from AllowedValues (Proposal, Progress Report, Financial Report, Final Report, Closeout Document, Award Notice, Modification, Correspondence, Compliance Approval, Budget, SOW, Contract, Subaward, Invoice, Receipt, Data Submission, Software Release, Publication, Presentation, Other)', 'Type', FALSE),
('Related_Entity_Type', 'Column', 'Document', 'Type of entity document is related to (Award, Proposal, Project, ComplianceRequirement, Subaward, Organization, Personnel, Invoice, AwardDeliverable, ConflictOfInterest)', 'Entity Type', FALSE),
('Related_Entity_ID', 'Column', 'Document', 'ID of related entity', 'Entity ID', FALSE),
('File_Name', 'Column', 'Document', 'Original filename', 'Filename', FALSE),
('Storage_Location', 'Column', 'Document', 'Storage location or path', 'Location, Path', FALSE),
('File_Size_Bytes', 'Column', 'Document', 'File size in bytes', 'Size, File Size', FALSE),
('MIME_Type', 'Column', 'Document', 'MIME type of document (e.g., application/pdf, image/jpeg)', 'Content Type, File Type', FALSE),
('File_Hash', 'Column', 'Document', 'Cryptographic hash for file integrity verification (SHA-256, SHA-512, etc.)', 'Hash, Checksum', FALSE),
('Version_Number', 'Column', 'Document', 'Version number for document versioning', 'Version', FALSE),
('Description', 'Column', 'Document', 'Description of document contents', 'Details', FALSE),

-- ========================================
-- ActivityLog Columns
-- ========================================
('Activity_ID', 'Column', 'ActivityLog', 'Primary key for activity log entry', 'Log ID', FALSE),
('Table_Name', 'Column', 'ActivityLog', 'Name of table that was modified', 'Table', FALSE),
('Record_ID', 'Column', 'ActivityLog', 'ID of record that was modified', 'Record ID', FALSE),
('Action_Type', 'Column', 'ActivityLog', 'Type of action (INSERT, UPDATE, DELETE, SELECT)', 'Action', FALSE),
('Action_Timestamp', 'Column', 'ActivityLog', 'Date and time action occurred', 'Timestamp', FALSE),
('User_ID', 'Column', 'ActivityLog', 'User who performed action', 'User', FALSE),
('Old_Values', 'Column', 'ActivityLog', 'JSON of values before change', 'Before', FALSE),
('New_Values', 'Column', 'ActivityLog', 'JSON of values after change', 'After', FALSE),
('IP_Address', 'Column', 'ActivityLog', 'IP address of user', 'IP', TRUE),
('Session_ID', 'Column', 'ActivityLog', 'Session identifier', 'Session', FALSE);
