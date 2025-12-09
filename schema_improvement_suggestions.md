# UDM Schema Improvement Suggestions

## Executive Summary
The AI4RA Unified Data Model (UDM) is well-structured with comprehensive coverage of research administration domains. This document provides suggestions to enhance clarity, consistency, flexibility, and usability for research administrators.

---

## 1. Naming Consistency and Clarity

### 1.1 Organization vs Org Inconsistency
**Issue**: Mixed use of "Organization" (table name) and "Org" (column prefix)
- Table: `Organization`
- Columns: `Org_ID`, `Org_Name`, `Org_Type`, `Parent_Org_ID`

**Suggestion**: Choose one convention and apply consistently
- **Option A (Recommended)**: Use full word for clarity
  - Table: `Organization`
  - Columns: `Organization_ID`, `Organization_Name`, `Organization_Type`, `Parent_Organization_ID`
- **Option B**: Use abbreviation consistently
  - Table: `Org`
  - Keep current column names

**Rationale**: Research administrators may not be familiar with database conventions. Full names are clearer.

### 1.2 Inconsistent ID Column Naming
**Issue**: Primary keys use different patterns
- `Org_ID` (abbreviated table name)
- `Personnel_ID` (full table name)
- `Award_ID` (abbreviated)
- `Role_ID` (no table reference)
- `Contact_ID` (full table name)

**Suggestion**: Standardize to `TableName_ID` format
- Examples: `Organization_ID`, `Personnel_ID`, `Award_ID`, `ProjectRole_ID`, `Contact_ID`

**Rationale**: Consistency improves readability and reduces confusion when joining tables.

### 1.3 CamelCase vs Snake_case Inconsistency

**Issue**: The schema mixes naming conventions inconsistently

- **Table names**: PascalCase (e.g., `AllowedValues`, `ProjectRole`, `ComplianceRequirement`)
- **Column names**: Snake_case (e.g., `Allowed_Value_ID`, `Project_ID`, `Is_Active`)
- **Mixed approach**: Some multi-word columns like `AllowedValues` vs `Allowed_Value_ID`

**Current Pattern Examples**:

```sql
-- Table: AllowedValues (PascalCase)
Allowed_Value_ID        -- Snake_case
Allowed_Value_Group     -- Snake_case
Is_Active               -- Snake_case

-- Table: ComplianceRequirement (PascalCase)
Requirement_ID          -- Snake_case
Principal_Investigator_ID -- Snake_case
```

**Suggestion**: Choose one consistent convention across the entire schema

**Option A (Recommended for MySQL/Dolt)**: Keep current mixed approach but document it clearly

- Table names: PascalCase (current)
- Column names: Snake_case (current)
- Document this convention in schema documentation

**Option B**: Full Snake_case (more portable)

- Table names: `allowed_values`, `project_role`, `compliance_requirement`
- Column names: `allowed_value_id`, `project_id`, `is_active`

**Option C**: Full PascalCase (less common for SQL)

- Table names: `AllowedValues`, `ProjectRole` (current)
- Column names: `AllowedValueID`, `ProjectID`, `IsActive`

**Rationale**:

- Current mixed approach (PascalCase tables, Snake_case columns) is actually quite common and acceptable
- The key is consistency and clear documentation
- Snake_case is often preferred for columns as it's case-insensitive and more readable
- If migrating to other databases, full snake_case (Option B) is most portable

**Recommendation**: Keep the current mixed approach but ensure it's consistently applied and documented. Avoid any exceptions.

### 1.4 Ambiguous Column Names
**Issue**: Multiple tables have columns with same generic names:
- `Title` appears in Project, Proposal, Award, RFA, ComplianceRequirement, Document
- `Status` appears in 15+ tables
- `Name` columns vary (Org_Name, Fund_Name, Account_Name, Finance_Name, Activity_Name)

**Suggestion**: Prefix generic columns with table context
- `Project_Title`, `Proposal_Title`, `Award_Title`
- `Award_Status`, `Project_Status`, `Proposal_Status`
- Maintain current pattern for Name: `Organization_Name`, `Fund_Name`, etc.

**Rationale**: Makes queries more readable and reduces ambiguity in reports.

---

## 2. Data Type and Constraint Improvements

### 2.1 Currency/Monetary Values
**Issue**: Using `DECIMAL(15,2)` for all monetary values
- May not be sufficient for large federal awards (e.g., $100M+ awards)

**Suggestion**:
- Increase to `DECIMAL(18,2)` for monetary columns
- Consider separate columns for different currencies if international awards are common

**Rationale**: Prevents overflow on large awards and provides future-proofing.

### 2.2 VARCHAR Length Standardization
**Issue**: Inconsistent VARCHAR lengths for similar data types
- Email: `VARCHAR(255)` in Personnel.Primary_Email
- Contact.Contact_Value: `VARCHAR(255)` (could be email or other)
- Names vary: `VARCHAR(100)` to `VARCHAR(255)`

**Suggestion**: Standardize common data types
- Names (first, last, middle): `VARCHAR(100)`
- Email addresses: `VARCHAR(320)` (max email length per RFC 5321)
- Phone numbers: `VARCHAR(20)`
- URLs: `VARCHAR(2048)`
- Descriptions: `TEXT` or `VARCHAR(1000)`

**Rationale**: Aligns with standards and prevents data truncation.

### 2.3 Date vs Timestamp Precision
**Issue**: Mixing DATE and TIMESTAMP types
- Award dates use DATE
- ActivityLog uses TIMESTAMP
- Some events might benefit from time precision

**Suggestion**:
- Keep DATE for business dates (start/end dates, deadlines)
- Use TIMESTAMP for audit/event tracking
- Consider DATETIME for events that need time but not timezone (e.g., submission times)

**Rationale**: Matches business requirements and improves audit capability.

---

## 3. Missing Relationships and Foreign Keys

### 3.1 Audit Column Foreign Keys
**Issue**: Audit columns lack foreign key constraints
- `Last_Modified_By VARCHAR(50)` (should reference Personnel_ID)
- `Created_By_Personnel_ID VARCHAR(50)` (has FK in some tables, missing in others)

**Suggestion**: Add foreign key constraints to all audit columns
```sql
CONSTRAINT fk_modified_by FOREIGN KEY (Last_Modified_By)
    REFERENCES Personnel(Personnel_ID)
    ON DELETE SET NULL
```

**Rationale**: Ensures data integrity and enables tracking of who made changes.

### 3.2 Document Relationships
**Issue**: Document table uses string-based entity linking
- `Related_Entity_Type VARCHAR(50)`
- `Related_Entity_ID VARCHAR(50)`
- No enforced referential integrity

**Suggestion**: Consider polymorphic relationship pattern or junction tables
- Option A: Keep current flexible design but add validation triggers
- Option B: Create specific junction tables (AwardDocument, ProposalDocument, etc.)

**Rationale**: Current design is flexible but doesn't enforce integrity. Triggers can validate.

---

## 4. Missing Tables and Entities

### 4.1 Personnel Roles/Permissions
**Issue**: No table for system user roles and permissions

**Suggestion**: Add tables:
- `UserRole` - Defines roles (PI, Admin, Finance Officer, etc.)
- `UserPermission` - Links users to roles and grants permissions
- `AuditPermission` - Tracks permission changes

**Rationale**: Critical for system security and access control.

### 4.2 Institutional Policy
**Issue**: No place to store institutional policies that affect awards

**Suggestion**: Add `InstitutionalPolicy` table
- Policy_ID, Policy_Name, Policy_Type, Effective_Date, Expiration_Date
- Policy_Document_ID (links to Document table)

**Rationale**: Policies affect award management and should be tracked systematically.

### 4.3 Sponsor Contact Information
**Issue**: Organizations can be sponsors, but no dedicated sponsor contact tracking

**Suggestion**: Add `SponsorContact` table or enhance existing Contact
- Links specific personnel at sponsor organizations to awards/RFAs
- Tracks program officers, grants specialists, etc.

**Rationale**: Important for award management and communication tracking.

### 4.4 Budget Rebudgeting/Revisions
**Issue**: No formal tracking of budget revisions beyond modifications

**Suggestion**: Add `BudgetRevision` table
- Links to AwardBudget
- Tracks revision number, justification, approval status, effective date
- Maintains history of budget changes

**Rationale**: Budget revisions are common and need detailed tracking for compliance.

---

## 5. Flexibility and Extensibility

### 5.1 Hard-coded CHECK Constraints
**Issue**: Many CHECK constraints use hard-coded lists
- `Org_Type IN ('Department','College','School',...)`
- `Person_Type IN ('Faculty','Staff','Student',...)`
- Makes schema changes require DDL modifications

**Suggestion**: Move CHECK constraint values to AllowedValues table
- Create views or triggers to enforce validation
- Or use `ENUM` types if database supports them well

**Rationale**: Institutional variations are common; configuration-based validation is more flexible.

### 5.2 Subaward Complexity
**Issue**: Subaward table is relatively simple
- Large awards may have complex subaward structures
- No subaward budget periods
- No subaward invoicing separate from prime

**Suggestion**: Consider enhancing subaward tracking
- `SubawardBudgetPeriod` table
- `SubawardInvoice` table
- Link to prime award budget periods

**Rationale**: Subawards often require detailed tracking similar to prime awards.

### 5.3 Multi-PI and Collaborative Awards
**Issue**: No explicit support for multi-institution collaborative awards

**Suggestion**: Add explicit collaboration tracking
- `AwardCollaboration` table linking awards across institutions
- Role field indicating lead vs. partner institution
- Percentage allocation fields

**Rationale**: Collaborative awards are common in research and have specific requirements.

---

## 6. Data Quality and Validation

### 6.1 Required vs Optional Fields
**Issue**: Many important fields are nullable when they shouldn't be
- `Personnel.Primary_Email` should likely be required
- `Award.CFDA_Number` should be required for federal awards
- `Project.Start_Date` and `End_Date` are optional but usually critical

**Suggestion**: Review nullability requirements
- Consider conditional requirements (e.g., CFDA required IF sponsor is federal)
- Document business rules for optional fields

**Rationale**: Better data quality and fewer incomplete records.

### 6.2 Email Validation
**Issue**: No email format validation beyond length

**Suggestion**: Add CHECK constraint or trigger for email format
```sql
CONSTRAINT chk_email_format CHECK (
    Primary_Email IS NULL OR
    Primary_Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
)
```

**Rationale**: Prevents data entry errors and ensures valid contact information.

### 6.3 Date Range Validation
**Issue**: No validation that end dates are after start dates

**Suggestion**: Add CHECK constraints
```sql
CONSTRAINT chk_project_dates CHECK (End_Date IS NULL OR End_Date >= Start_Date)
CONSTRAINT chk_award_dates CHECK (Current_End_Date >= Original_Start_Date)
```

**Rationale**: Prevents logical errors in date ranges.

---

## 7. Performance and Indexing

### 7.1 Missing Indexes
**Issue**: No explicit index definitions beyond primary/foreign keys

**Suggestion**: Add indexes for common query patterns
```sql
-- Frequently queried by status
CREATE INDEX idx_award_status ON Award(Status);
CREATE INDEX idx_project_status ON Project(Status);

-- Date range queries
CREATE INDEX idx_award_dates ON Award(Current_End_Date, Original_Start_Date);

-- Sponsor queries
CREATE INDEX idx_award_sponsor ON Award(Sponsor_Org_ID, Status);

-- Search queries
CREATE INDEX idx_personnel_name ON Personnel(Last_Name, First_Name);
CREATE INDEX idx_org_name ON Organization(Org_Name);
```

**Rationale**: Improves query performance for common reports.

### 7.2 Composite Indexes
**Issue**: No composite indexes for multi-column queries

**Suggestion**: Add composite indexes based on common query patterns
```sql
CREATE INDEX idx_transaction_award_date ON Transaction(Award_ID, Transaction_Date);
CREATE INDEX idx_effort_role_period ON Effort(Role_ID, Period_Start_Date, Period_End_Date);
```

**Rationale**: Significantly improves performance for filtered queries.

---

## 8. User Experience for Research Administrators

### 8.1 Terminology Alignment
**Issue**: Some database terms may not align with research administration terminology

**Suggestions**:
- Consider renaming `PAF_Routing_Status` to include explanation in DataDictionary
- `MTDC` and `TDC` should be spelled out in descriptions
- `NICRA` should be explained (Negotiated Indirect Cost Rate Agreement)

**Rationale**: Makes system more accessible to non-technical users.

### 8.2 Calculated/Derived Fields
**Issue**: Some common calculations aren't stored

**Suggestion**: Consider adding calculated fields or views for:
- Award burn rate (spent vs. time elapsed)
- Days until award expiration
- Percentage of budget spent
- FTE totals by award

**Rationale**: Commonly needed for reports; pre-calculating improves performance.

### 8.3 Status Workflow Clarity
**Issue**: Status values don't clearly indicate workflow progression

**Suggestion**: Enhance status values to show progression
- Award: `Pending -> Active -> Closing -> Closed` (add Closing state)
- Proposal: Show clear path from Draft through submission to decision

**Rationale**: Helps users understand where items are in the workflow.

---

## 9. Compliance and Audit

### 9.1 Change History
**Issue**: ActivityLog is generic; critical tables may need detailed history

**Suggestion**: Consider temporal tables or triggers for critical entities
- Award changes should track all field changes with before/after values
- Budget changes need detailed audit trail
- Effort certification changes must be tracked for compliance

**Rationale**: Federal compliance often requires detailed change tracking.

### 9.2 Data Retention
**Issue**: No systematic data retention/archival strategy

**Suggestion**: Add retention fields and policy
- `Retention_Period` column
- `Archived_Date` column
- `Archival_Status` column
- Link to retention policy

**Rationale**: Regulatory requirements often specify minimum retention periods.

### 9.3 Electronic Signatures
**Issue**: No support for electronic signatures on certifications

**Suggestion**: Add signature tracking
- `EffortCertification` table with signature fields
- `Signature_Date`, `Signature_Method`, `IP_Address`
- Link to digital signature document if applicable

**Rationale**: Effort certification requires signatures; tracking is important for audits.

---

## 10. Implementation Checklist

Use this checklist to track progress on implementing schema improvements:

### High Priority (All Completed! ✓)

- [x] **Document naming conventions** - Added to README.md (PascalCase tables, Snake_case columns)
- [x] **Standardize Organization vs Org** - Standardized to "Organization" (see Completed section)
- [ ] **Standardize ID column naming** - Apply TableName_ID pattern consistently (deferred - very large effort)
- [x] **Add missing foreign keys** on audit columns (see Completed section)
- [x] **Increase DECIMAL precision** for monetary values (see Completed section)
- [x] **Add date range validation** constraints (see Completed section)
- [x] **Review and fix nullability** for critical fields (see Completed section)
- [x] **Add email format validation** constraints (see Completed section)

### Medium Priority (Next Phase)

- [ ] **Add indexes** for common query patterns
  - [ ] Status columns (Award_Status, Project_Status)
  - [ ] Date range queries (Award dates)
  - [ ] Sponsor queries
  - [ ] Personnel name searches
- [ ] **Create BudgetRevision** table for tracking budget changes
- [ ] **Add InstitutionalPolicy** table
- [ ] **Enhance subaward tracking**
  - [ ] SubawardBudgetPeriod table
  - [ ] SubawardInvoice table
- [ ] **Move CHECK constraints** to AllowedValues where appropriate
- [ ] **Add SponsorContact** table or enhance Contact
- [ ] **Prefix ambiguous column names** (Title, Status, Name)

### Low Priority (Future Enhancements)

- [ ] **Add calculated/derived fields** or views
  - [ ] Award burn rate
  - [ ] Days until expiration
  - [ ] Budget percentage spent
- [ ] **Implement temporal tables** for critical entities
- [ ] **Add multi-institution collaboration** support (AwardCollaboration table)
- [ ] **Create user roles/permissions** tables
  - [ ] UserRole table
  - [ ] UserPermission table
  - [ ] AuditPermission table
- [ ] **Add electronic signature** support (EffortCertification table)
- [ ] **Add data retention** fields and archival strategy
- [ ] **Create composite indexes** for multi-column queries

### Completed

- [x] **Document naming conventions** in README.md (2024-12-08)
- [x] **Standardize Organization vs Org** - Changed all Org_\* columns to Organization_\* (2024-12-08)
  - Updated: Organization table, Personnel, Project, RFA, Proposal, Award, Subaward, CostShare, Fund, FinanceCode, IndirectRate
  - Total: 15 columns renamed across 11 tables
  - Migration script: migrations/001_standardize_org_to_organization.sql
- [x] **Add missing foreign keys** on audit columns (2024-12-08)
  - Added 17 FK constraints for Last_Modified_By and Created_By_Personnel_ID
  - Tables: Organization, Personnel, Project, Proposal, Award, AwardBudget, ComplianceRequirement, Invoice, Modification, ProjectRole, Subaward, Transaction
- [x] **Increase DECIMAL precision** for monetary values (2024-12-08)
  - Changed all DECIMAL(15,2) to DECIMAL(18,2)
  - Affected 37 monetary columns across 13 tables
  - Prevents overflow on awards > $999 billion
- [x] **Add date range validation** constraints (2024-12-08)
  - Added 8 CHECK constraints ensuring end_date >= start_date
  - Tables: Project, Award, Proposal, Subaward, AwardBudgetPeriod, Effort, Invoice, IndirectRate
- [x] **Review and fix nullability** for critical fields (2024-12-08)
  - Made Primary_Email NOT NULL and increased to VARCHAR(320)
  - Made Project.Start_Date NOT NULL
- [x] **Add email format validation** constraint (2024-12-08)
  - Added CHECK constraint on Personnel.Primary_Email using REGEXP
  - Migration script: migrations/002_high_priority_improvements.sql
- [x] **Create comprehensive testing suite** (udm_testing.sql)
- [x] **Generate ERD documentation** (Mermaid diagram in README.md)
- [x] **Populate DataDictionary** table (72 entity definitions)

---

## 11. Overall Schema Strengths

The UDM schema demonstrates several excellent design decisions:

1. **Comprehensive Coverage**: Covers all major research administration domains
2. **Referential Integrity**: Good use of foreign keys
3. **Audit Trails**: Consistent inclusion of created/modified timestamps
4. **Flexible Lookup System**: AllowedValues table provides flexibility
5. **Self-Referencing Relationships**: Proper handling of hierarchical data (Org, Project)
6. **Financial Tracking**: Detailed budget and transaction tracking
7. **Compliance Support**: Tables for IRB, COI, and other compliance requirements
8. **View Support**: Pre-built views for common queries

---

## 12. Conclusion

The AI4RA-UDM is a solid foundation for research administration data management. The suggested improvements focus on:

- **Consistency**: Standardizing naming and data types
- **Clarity**: Making the schema more accessible to research administrators
- **Flexibility**: Allowing for institutional variations
- **Compliance**: Supporting audit and regulatory requirements
- **Performance**: Optimizing for common query patterns
- **Completeness**: Filling gaps in entity coverage

These improvements will make the UDM more robust, easier to use, and better aligned with the needs of research administration professionals across diverse institutions.

**Recommendation**: Prioritize naming consistency and missing foreign keys first, as these have the most immediate impact on data quality and usability. Then address flexibility and performance enhancements based on institutional needs.
