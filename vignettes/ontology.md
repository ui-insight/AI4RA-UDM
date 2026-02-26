# UDM Ontology

This document describes the structure, conventions, and purpose of every entity in the AI4RA Unified Data Model.

## Naming Conventions

### Tables: PascalCase

Table names use PascalCase with no separators. Tables are named as singular nouns.

```
Organization    ProjectRole    AwardBudgetPeriod    ComplianceRequirement
```

### Columns: Snake_case

Column names use capitalized Snake_case. Each word is capitalized and separated by underscores.

```
Award_Number    Start_Date    Is_Active    Sponsor_Organization_ID
```

### Primary Keys: `TableName_ID`

Every table's primary key follows the pattern `TableName_ID`. This makes joins predictable — you always know the PK name from the table name.

```
Personnel_ID    Award_ID    Organization_ID    ComplianceRequirement_ID
```

### Foreign Keys: Named by Role

When a table references another table, the foreign key is named to describe the *role* of that relationship, not just the target table. This is especially important when multiple foreign keys reference the same table.

```sql
-- Award has two Organization references, each named by role:
Sponsor_Organization_ID        -- the funding sponsor
Prime_Sponsor_Organization_ID  -- the ultimate funding source (pass-through)

-- Proposal has three Organization references:
Sponsor_Organization_ID        -- the funding sponsor
Submitting_Organization_ID     -- the unit preparing the proposal
Administering_Organization_ID  -- the unit managing finances
```

### Standard Suffixes

| Suffix | Meaning | Examples |
|--------|---------|----------|
| `_ID` | Primary or foreign key | `Award_ID`, `Personnel_ID` |
| `_Date` | Date or datetime | `Start_Date`, `Due_Date`, `Date_Created` |
| `_Status` | Current lifecycle state (CHECK constraint) | `Award_Status`, `Invoice_Status` |
| `_Type` | Classification (CHECK or AllowedValues) | `Organization_Type`, `Rate_Type` |
| `_Amount` | Monetary value | `Transaction_Amount`, `Current_Total_Funded` |
| `_Percent` | Percentage | `FTE_Percent`, `Effort_Percent` |
| `_Number` | Sequential or reference number | `Award_Number`, `Period_Number` |
| `_Name` | Human-readable name | `Organization_Name`, `First_Name` |
| `_Code` | Short identifier | `Fund_Code`, `Account_Code` |
| `_Description` | Free-text description | `Project_Description`, `Activity_Description` |
| `Is_` | Boolean flag (prefix) | `Is_Active`, `Is_Primary`, `Is_Key_Personnel` |

## Design Patterns

### AllowedValues vs CHECK Constraints

The UDM uses two approaches for controlling enumerated values. Understanding when to use each is fundamental to the model's design.

**AllowedValues table** — for values that vary by institution. Institutions populate this table with their own codes, labels, and descriptions. The schema defines *which fields* use AllowedValues (via a foreign key to the AllowedValues table), but the actual values are institution-specific.

Used by 10 fields: contact types, project roles, fund types, transaction types, modification event types, deliverable types, project types, finance code purposes, COI relationship types, and document types.

**CHECK constraints** — for values that are universal standards. These are hardcoded in the schema because they should be consistent everywhere: GAAP account types, federal rate structures, lifecycle status workflows, compliance requirement types.

See [allowedvalues.md](allowedvalues.md) for the complete list of which fields use which approach and why.

### Self-Referencing Hierarchies

Several tables reference themselves to model hierarchies:

- `Organization.Parent_Organization_ID` → a college contains departments, a department belongs to a school
- `Project.Parent_Project_ID` → a program contains subprojects
- `Account.Parent_Account_Code` → chart of accounts hierarchy
- `AllowedValues.Parent_Value_ID` → nested lookup categories (if needed)

### Bridge Tables

Many-to-many relationships use bridge tables that carry their own attributes:

- `ProjectRole` bridges Personnel and Project, adding role type, FTE%, dates, and key personnel flag
- `Effort` bridges ProjectRole and time periods, adding certification data

### Referential Integrity

Foreign keys use `ON DELETE RESTRICT` (preventing deletion of referenced records) and `ON UPDATE CASCADE` (propagating key changes). This reflects the interconnected nature of research administration data — you can't delete a sponsor organization while it still has active awards.

Nullable foreign keys indicate optional relationships. For example, `Award.Proposal_ID` is nullable because not all awards originate from a formal proposal.

---

## Reference Tables

### AllowedValues

Stores institution-specific controlled vocabularies. Each row has a group (e.g., `ContactType`, `ProjectRole`), a code, a display label, and an optional description. Other tables reference this via foreign keys like `Role_Value_ID` or `Fund_Type_Value_ID`.

**Why it exists**: Different institutions classify the same concepts differently. A university might have project roles like "Faculty PI" and "Graduate RA" while a national lab uses "Principal Investigator" and "Research Scientist." The AllowedValues pattern lets each institution define their own vocabulary without changing the schema.

### BudgetCategory

Standardized budget line item categories used across proposals and awards: Senior Personnel, Other Personnel, Equipment, Travel, Participant Support, Other Direct Costs, etc. These follow federal budget category standards (SF-424 R&R).

### Organization

Institutional entities that participate in research funding. A single table represents all organization types — sponsors, academic departments, subrecipients, vendors — distinguished by `Organization_Type`. Organizations form hierarchies via `Parent_Organization_ID` (e.g., Department → College → University).

**Why one table**: In research administration, the same organization can play multiple roles. NIH is a sponsor on one award and a collaborator on another. A department is an administering unit for its own awards and a subrecipient on another institution's award. A single Organization table with role-specific foreign key names (like `Sponsor_Organization_ID`) handles this cleanly.

---

## Core Entities

### Personnel

Individuals involved in research: faculty, staff, students, postdocs, and external collaborators. Stores identifying information (name, email, ORCID) and links to a home department via `Department_Organization_ID`.

PII-sensitive fields: `First_Name`, `Last_Name`, `Middle_Name`, `Primary_Email`, `ORCID`.

### ContactDetails

Contact information (email, phone, fax, etc.) for both Personnel and Organizations. Uses AllowedValues for contact type classification. A person or organization can have multiple contact records.

### Project

Research or training projects that may span multiple funding sources. A project can have multiple proposals and multiple awards. Projects form hierarchies via `Parent_Project_ID` for programs with subprojects. Status tracked via CHECK constraint: Planning → Active → Completed/Suspended/Cancelled.

---

## Pre-Award

### RFA

Request for Applications, also known as funding opportunities, program announcements, or solicitations. Captures the sponsor, deadlines, funding amounts, and eligibility criteria. Links proposals back to the opportunity they respond to.

### Proposal

A formal request for funding submitted to a sponsor. Tracks the full proposal lifecycle from drafting through submission to decision. Links to the project it supports, the RFA it responds to (if any), and three distinct Organization roles: sponsor (who funds it), submitting organization (who prepares it), and administering organization (who manages the finances).

Includes both internal approval workflow (`Internal_Approval_Status`) and external decision tracking (`Decision_Status`).

### ProposalBudget

Detailed budget line items for proposals, organized by budget period and category. Supports versioning via `Version_Number` for budget revisions during negotiation. Each line item links to a BudgetCategory and can reference an IndirectRate for F&A calculations.

---

## Post-Award

### Award

The central entity of post-award management. Represents funded grants, contracts, and cooperative agreements. Links to its originating proposal, project, sponsor, and (for pass-through funding) prime sponsor. Tracks the full funding amount, current balance, and award lifecycle dates.

Status workflow: Pending → Active → Closed/Suspended/Terminated.

### Modification

Tracks changes to awards after initial funding: incremental funding, no-cost extensions, budget revisions, PI changes, scope modifications, and carryover approvals. Each modification records what changed, the financial impact, and who approved it.

### Terms

Award terms and conditions: payment method (reimbursement, advance, letter of credit), invoicing frequency, reporting requirements, cost sharing obligations, and special conditions. Each award has one Terms record capturing the contractual parameters.

### AwardBudgetPeriod

Budget periods (typically annual) within an award. Each period has its own start/end dates, funding amounts, and status. Awards are divided into periods to match sponsor reporting and funding cycles.

### AwardBudget

Detailed budget line items within a budget period, organized by BudgetCategory. Tracks three amounts: proposed (from the original proposal), approved (what the sponsor authorized), and current (after any modifications). This three-way comparison is essential for budget management.

### Subaward

Subawards issued to other institutions under a prime award. Tracks the subrecipient organization, funding amounts, dates, risk level, and monitoring requirements. Links to the parent award via `Prime_Award_ID`.

### CostShare

Cost sharing commitments where the institution (or a third party) contributes resources to match sponsor funding. Tracks commitment type (cash, in-kind, waived indirect costs), amounts committed vs. actual, and current status.

### AwardDeliverable

Required reports and deliverables: progress reports, financial reports, publications, data sharing plans, final reports, etc. Tracks due dates, submission status, and the responsible person. Links to specific budget periods when deliverables are period-specific.

---

## Financial Management

### Fund

Fund codes from the institutional accounting system. Each fund has a code, links to an organization, and has a type classification via AllowedValues (e.g., restricted, unrestricted, endowment).

### Account

Chart of accounts for general ledger coding. Accounts have types based on GAAP classifications (Asset, Liability, Equity, Revenue, Expense) enforced via CHECK constraint. Supports hierarchical account structures via `Parent_Account_Code`.

### FinanceCode

Award-specific finance codes that link awards to institutional accounting strings. Each code connects an award to a fund, account, and purpose classification. This is the bridge between the research administration world (awards, projects) and the institutional accounting world (funds, accounts).

Also known as: FOAP (Fund-Organization-Account-Program), account strings, or financial codes, depending on the institution.

### ActivityCode

Activity classification codes used to categorize spending by purpose or function (e.g., instruction, research, public service). These are institutional codes that may align with NACUBO functional classifications.

### Transaction

Individual financial transactions charged to awards: expenses, encumbrances, revenues, transfers. Each transaction links to multiple financial dimensions — fund, account, finance code, activity code, award, project, and budget period. This multi-dimensional linking enables reporting across any combination of financial attributes.

### IndirectRate

Negotiated indirect cost rates (also called F&A rates or overhead rates). Each record specifies a rate type (on-campus, off-campus, MTDC, etc.), base type, percentage, and the effective date range. Links to the organization the rate applies to. Institutions typically have multiple rates negotiated with the federal government.

### Invoice

Invoices submitted to sponsors for reimbursement or payment. Tracks invoice amounts, submission dates, payment status, and links to the award and budget period. Supports the billing cycle for cost-reimbursable and fixed-price awards.

---

## Personnel & Effort

### ProjectRole

Assigns personnel to projects with specific roles (PI, Co-PI, coordinator, key personnel, etc.) and effort allocations. Role types use AllowedValues since institutions have different role taxonomies. Each assignment has a date range, FTE percentage, and optional link to a funding award.

This is a bridge table — it connects Personnel, Project, and Award while carrying its own attributes (role, dates, effort, key personnel flag).

### Effort

Effort certification and tracking. Each record captures the percentage of time a person spent on a project role during a specific period, along with certification details (method, certifier, date). Supports federal effort reporting requirements (OMB Uniform Guidance).

---

## Compliance

### ComplianceRequirement

Regulatory approvals required for research: IRB (human subjects), IACUC (animal subjects), IBC (biosafety), radiation safety, and others. Tracks the requirement type, protocol number, approval dates, expiration, and review type (exempt, expedited, full board). Links to the project and principal investigator.

### ConflictOfInterest

COI disclosures and management plans. Records the type of relationship (financial, consulting, equity, etc.) via AllowedValues, the entity involved, financial details, and the review outcome. Supports federal COI requirements (42 CFR Part 50 Subpart F).

---

## System

### Document

Document management for files associated with any entity in the system: proposals, awards, projects, compliance requirements, etc. Tracks file metadata (name, type, size, path), versioning, and the related entity via a polymorphic pattern (`Related_Entity_Type` + `Related_Entity_ID`).

### ActivityLog

Audit trail recording all significant data changes and user actions. Captures the action type (INSERT, UPDATE, DELETE), the affected entity, the user, timestamp, and description. This is infrastructure for compliance and debugging, not a research administration domain entity.

---

## Reference Views

The UDM includes 8 pre-built views as reference implementations for common reporting needs. Institutions can adopt these directly or adapt them.

| View | Purpose |
|------|---------|
| `vw_All_ContactDetails` | Unified contact details from both Personnel and Organizations |
| `vw_Active_Awards` | Active awards with sponsor, funding, expenses, and available balance |
| `vw_Active_Personnel_Roles` | Current personnel on active projects with roles and effort |
| `vw_Award_Financial_Summary` | Financial summary by award and budget period |
| `vw_Expiring_Awards` | Awards expiring within 90 days with PI contact information |
| `vw_Overdue_Deliverables` | Deliverables past due with days overdue and responsible person |
| `vw_ComplianceRequirement_Status` | Active compliance requirements with expiration tracking |
| `vw_Budget_Comparison` | Proposed vs approved vs current vs actual spending |
