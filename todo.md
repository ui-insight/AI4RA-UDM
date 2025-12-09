# TODO

## 1. Schema Standardization (Primary Keys)
*Ensure strict `TableName_ID` naming convention for easier joins.* Document this in the README.md

- [x] Rename `ProposalBudget.Budget_ID` $\rightarrow$ **`ProposalBudget_ID`**
- [x] Rename `Modification.Event_ID` $\rightarrow$ **`Modification_ID`**
- [x] Rename `AwardBudgetPeriod.Period_ID` $\rightarrow$ **`AwardBudgetPeriod_ID`**
- [x] Rename `AwardDeliverable.Deliverable_ID` $\rightarrow$ **`AwardDeliverable_ID`**
- [x] Rename `ProjectRole.Role_ID` $\rightarrow$ **`ProjectRole_ID`**
- [x] Rename `IndirectRate.Rate_ID` $\rightarrow$ **`IndirectRate_ID`**
- [x] Rename `ComplianceRequirement.Requirement_ID` $\rightarrow$ **`ComplianceRequirement_ID`**
- [x] Rename `ConflictOfInterest.COI_ID` $\rightarrow$ **`ConflictOfInterest_ID`**
- [x] Rename `Terms.Terms_ID` $\rightarrow$ **`AwardTerms_ID`**

## 2. Organization References (Foreign Keys)
*Update generic `Organization_ID` columns to context-specific, role-based names.* Document this in the README.md. 

- [x] **Project Table:** Rename FK to **`Lead_Organization_ID`**
- [x] **RFA Table:** Rename FK to **`Sponsor_Organization_ID`**
- [x] **Proposal Table:**
  - [x] Rename sponsor FK to **`Sponsor_Organization_ID`**
  - [x] Add new column: **`Submitting_Organization_ID`** (The unit that prepares and submits the proposal)
  - [x] Add new column: **`Administering_Organization_ID`** (The unit responsible for the financial administration of the potential award)
- [x] **Award Table:**
  - [x] Rename sponsor FK to **`Sponsor_Organization_ID`**
  - [x] Ensure **`Prime_Sponsor_Organization_ID`** exists
- [x] **Subaward Table:** Rename FK to **`Subrecipient_Organization_ID`**
- [x] **CostShare Table:** Rename FK to **`Source_Organization_ID`**
- [x] **IndirectRate Table:** Rename FK to **`Applicable_Organization_ID`**

## 3. Structural & Logic Improvements
- [x] **Contacts View:** Create a SQL View **`vw_All_Contacts`** to union Personnel and Organization contact details.
- [x] **Contacts table rename:**
  - [x] Verify that the `Contacts` table has been correctly renamed to **`ContactDetails`** throughout the schema.
- [x] **Proposal Versioning:**
  - [x] Add **`Previous_Proposal_ID`** (self-referencing FK) to `Proposal` table.
  - [x] Add **`Submission_Version`** (INT) to `Proposal` table.
- [x] **Award/Project Flexibility:**
  - [x] Make **`Award.Proposal_ID` NULLABLE** (to handle direct awards).
- [x] **Modification Logic:**
  - [x] Add **`Impact_on_Budget`** (BOOLEAN) to `Modification` table.

## 4. Budgeting & Financial Fidelity
- [x] **Standardized Categories:**
  - [x] Create a **`BudgetCategory`** reference table.
  - [x] Update `ProposalBudget` and `AwardBudget` to reference this table.
- [x] **Indirect Cost Transparency:**
  - [x] Add **`Applied_Indirect_Rate_ID`** (FK to `IndirectRate`) to the `ProposalBudget` table.
  - [x] Add **`Rate_Base_Used`** (e.g., 'MTDC', 'TDC') to **both** `ProposalBudget` and `AwardBudget`.
  - [x] **CLARIFICATION:** The `Indirect_Costs` columns should store the **Original Approved Amount** for audit purposes, even if the system dynamically calculates the *current* amount using the rate table.
- [x] **Budget Versioning:**
  - [x] Add **`Version_No`** to `ProposalBudget` table.

## 5. Data Integrity
- [x] **Refine Enums:**
  - [x] (Optional) Create dedicated lookup tables for high-traffic enums (e.g., `PersonType`, `ProjectStatus`) instead of relying solely on the generic `AllowedValues` table for strict SQL constraint enforcement.

## 6. General
- [x] Review instructions.md and the notebook to record the schema ontology into the README.md. Add a section on tables amd views summarizing each.
## 7. Dashboard
- [x] Look at the udm_dashboard.md and make a todo list for that. Things like create the github action. Set up access on dolthub.

