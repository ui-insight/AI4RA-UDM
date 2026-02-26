# AllowedValues vs CHECK Constraints

This document explains the distinction between flexible lookups stored in the `AllowedValues` table and hard-coded enumerations using CHECK constraints in the UDM schema.

## Design Philosophy

The UDM uses two approaches for controlling allowed values:

### AllowedValues Table (Flexible, Institution-Specific)
Used for lookup values that:
- May vary by institution or deployment
- Need rich metadata (descriptions, labels)
- Might be extended by users at runtime
- Are operational/workflow-specific rather than structural

### CHECK Constraints (Fixed, Universal Standards)
Used for enumerations that:
- Define the universal data model structure
- Are based on accounting standards (GAAP) or research administration norms
- Should remain consistent across all deployments
- Serve as schema-level documentation

---

## Current Uses of AllowedValues

The following tables use foreign keys to `AllowedValues` for flexible, extensible lookups:

### 1. ContactDetails
- **Column**: `AllowedValue_ID`
- **Purpose**: Contact types (Email, Phone, Fax, Mobile, etc.)
- **Rationale**: Institutions may have custom contact methods

### 2. ProjectRole
- **Column**: `Role_Value_ID`
- **Purpose**: Project role types (PI, Co-PI, Coordinator, Key Personnel, etc.)
- **Rationale**: Different institutions may have different role taxonomies

### 3. Fund
- **Column**: `Fund_Type_Value_ID`
- **Purpose**: Fund types and classifications
- **Rationale**: Fund structures vary significantly by institution

### 4. Transaction
- **Column**: `Transaction_Type_Value_ID`
- **Purpose**: Transaction types (Expense, Revenue, Encumbrance, Transfer, Adjustment, Reversal, Cost Share)
- **Rationale**: Different ERP systems and institutions use different transaction taxonomies
- **Note**: Includes 'Transfer' which was moved from Account_Type

### 5. Modification
- **Column**: `Event_Type_Value_ID`
- **Purpose**: Modification event types (Initial Award, Incremental Funding, No Cost Extension, Budget Revision, etc.)
- **Rationale**: Different sponsors and institutions have different modification workflows

### 6. AwardDeliverable
- **Column**: `Deliverable_Type_Value_ID`
- **Purpose**: Deliverable types (Technical Progress Report, Financial Report, Publication, etc.)
- **Rationale**: Different sponsors require different deliverable types - NIH, NSF, and foundations have distinct requirements

### 7. Project
- **Column**: `Project_Type_Value_ID`
- **Purpose**: Project types (Research, Training, Service, Clinical Trial, Fellowship, etc.)
- **Rationale**: Institutions have custom project categorizations beyond standard types

### 8. FinanceCode
- **Column**: `Purpose_Value_ID`
- **Purpose**: Finance code purposes (Direct Costs, Cost Share, Indirect Costs, Subcontract, etc.)
- **Rationale**: Cost allocation categories vary by institutional accounting structure

### 9. ConflictOfInterest
- **Column**: `Relationship_Type_Value_ID`
- **Purpose**: Relationship types (Financial, Consulting, Employment, Equity, etc.)
- **Rationale**: Different institutions track different relationship types in COI disclosures

### 10. Document
- **Column**: `Document_Type_Value_ID`
- **Purpose**: Document types (Proposal, Progress Report, Award Notice, etc.)
- **Rationale**: Each institution has unique document management needs and workflows

---

## Current Uses of CHECK Constraints

The following tables use CHECK constraints for standardized enumerations:

### Organization
- **Organization_Type**: `'Department','College','School','Sponsor','Subrecipient','Vendor','Institute','Center'`
- Rationale: Standard organizational classifications

### Personnel
- **Person_Type**: `'Faculty','Staff','Student','External','Postdoc','Resident','Fellow'`
- Rationale: Standard personnel classifications in academic institutions

### IndirectRate
- **Rate_Type**: `'On-Campus','Off-Campus','MTDC','TDC','Clinical Trial','Fringe Benefits','Facilities','Administrative'`
- **Base_Type**: `'MTDC','TDC','Salaries and Wages','Direct Salaries'`
- Rationale: Standard federal indirect cost rate structures

### Project
- **Project_Status**: `'Planning','Active','Completed','Suspended','Cancelled'`
- Rationale: Universal project lifecycle states

### Proposal
- **Internal_Approval_Status**: `'Draft','In Review','Approved','Rejected','Withdrawn'`
- **Decision_Status**: `'Pending','Submitted','Under Review','Awarded','Declined','Withdrawn'`
- Rationale: Standard proposal workflow states

### ProposalBudget
- **Rate_Base_Used**: `'MTDC','TDC','Salaries and Wages','Direct Salaries'`
- Rationale: Federal indirect cost rate bases

### Award
- **Award_Status**: `'Pending','Active','Closed','Suspended','Terminated'`
- Rationale: Standard award lifecycle states

### Modification
- **Approval_Status**: `'Pending','Approved','Rejected','Not Required'`
- Rationale: Standard approval workflow states

### Terms
- **Payment_Method**: `'Reimbursement','Advance','Cost-Reimbursement','Fixed-Price','Letter-of-Credit','Payment-Request'`
- **Invoicing_Frequency**: `'Monthly','Quarterly','Semi-Annual','Annual','Upon-Request','Milestone'`
- Rationale: Standard financial terms

### AwardBudgetPeriod
- **Period_Status**: `'Pending','Released','Active','Closed'`
- Rationale: Standard budget period states

### AwardBudget
- **Rate_Base_Used**: `'MTDC','TDC','Salaries and Wages','Direct Salaries'`
- Rationale: Federal indirect cost rate bases

### Subaward
- **Subaward_Status**: `'Pending','Active','Closed','Terminated','Suspended'`
- **Risk_Level**: `'Low','Medium','High'`
- Rationale: Standard subaward lifecycle and risk classifications

### CostShare
- **Commitment_Type**: `'Cash','In-Kind','Third-Party','Waived IDC'`
- **CostShare_Status**: `'Committed','In Progress','Met','Waived'`
- Rationale: Standard cost sharing types

### Invoice
- **Invoice_Status**: `'Draft','Submitted','Under Review','Approved','Paid','Rejected'`
- Rationale: Standard invoice workflow states

### AwardDeliverable
- **Deliverable_Status**: `'Pending','In Progress','Submitted','Accepted','Revision Required','Overdue'`
- Rationale: Standard deliverable workflow states

### Account
- **Account_Type**: `'Expense','Revenue','Asset','Liability','Equity'`
- Rationale: GAAP fundamental account classifications (removed 'Transfer' as it's a transaction type)

### Effort
- **Certification_Method**: `'PAR','Activity Report','Timesheet','Other'`
- **Prior_Approval_Status**: `'Not Required','Pending','Approved','Denied'`
- Rationale: Standard effort reporting methods

### ComplianceRequirement
- **Requirement_Type**: `'IRB','IACUC','IBC','COI','Radiation','Other'`
- **Review_Type**: `'Exempt','Expedited','Full Board','Not Human Subjects','Administrative'`
- **Requirement_Status**: `'Draft','Submitted','In Review','Approved','Expired','Conditional Approval','Disapproved','Terminated','Suspended','Not Applicable'`
- **Risk_Level**: `'Minimal','More than Minimal','High'`
- Rationale: Federal compliance requirements and IRB standards

### ConflictOfInterest
- **ConflictOfInterest_Status**: `'Under Review','No Conflict','Manageable Conflict','Unmanageable Conflict','Management Plan Required','Cleared'`
- Rationale: Federal COI status workflow states

### Document
- **Related_Entity_Type**: `'Award','Proposal','Project','ComplianceRequirement','Subaward','Organization','Personnel','Invoice','AwardDeliverable','ConflictOfInterest'`
- Rationale: Defines which entities can have documents attached (structural constraint)

### DataDictionary
- **Action_Type**: `'INSERT','UPDATE','DELETE','SELECT'`
- Rationale: Standard SQL operations for audit logging

---

## When to Use Which Approach

### Use AllowedValues When:
- Different institutions might need different values
- Values need metadata (descriptions, labels)
- Business users should be able to extend values without schema changes
- The values are operational/workflow-specific

### Use CHECK Constraints When:
- Values are defined by external standards (GAAP, federal regulations)
- Values define the structure of the universal model
- Values should be consistent across all deployments
- Schema-level documentation is important
- Performance is critical (CHECK constraints are faster than joins)

---

## Schema Change Notes

### Converted to AllowedValues (from CHECK constraints):

**1. Transaction_Type** - Different ERP systems and institutions use different transaction taxonomies
- Includes 'Transfer' which was moved from Account_Type

**2. Event_Type (Modification table)** - Different sponsors and institutions have different modification workflows

**3. Deliverable_Type** - Different sponsors require different deliverable types (NIH vs NSF vs foundations)

**4. Project_Type** - Institutions have custom project categorizations beyond standard types

**5. Purpose (FinanceCode table)** - Cost allocation categories vary by institutional accounting structure

**6. Relationship_Type (ConflictOfInterest table)** - Different institutions track different relationship types

**7. Document_Type** - Each institution has unique document management needs and workflows

### Other Changes:

**'Transfer' moved from Account_Type to Transaction_Type** because:
- 'Transfer' is an action/operation, not an account classification
- Account types should only be GAAP categories (Asset, Liability, Equity, Revenue, Expense)

**'COI' expanded to 'ConflictOfInterest'** in Related_Entity_Type CHECK constraint - no abbreviations in code

**Parent_Value_ID and Display_Order removed** from AllowedValues table - unnecessary hierarchy complexity
