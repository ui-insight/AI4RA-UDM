# TODO

## 1. Schema Standardization (Primary Keys)
*Ensure strict `TableName_ID` naming convention for easier joins.* Document this in the README.md

- [ ] Rename `ProposalBudget.Budget_ID` $\rightarrow$ **`ProposalBudget_ID`**
- [ ] Rename `Modification.Event_ID` $\rightarrow$ **`Modification_ID`**
- [ ] Rename `AwardBudgetPeriod.Period_ID` $\rightarrow$ **`AwardBudgetPeriod_ID`**
- [ ] Rename `AwardDeliverable.Deliverable_ID` $\rightarrow$ **`AwardDeliverable_ID`**
- [ ] Rename `ProjectRole.Role_ID` $\rightarrow$ **`ProjectRole_ID`**
- [ ] Rename `IndirectRate.Rate_ID` $\rightarrow$ **`IndirectRate_ID`**
- [ ] Rename `ComplianceRequirement.Requirement_ID` $\rightarrow$ **`ComplianceRequirement_ID`**
- [ ] Rename `ConflictOfInterest.COI_ID` $\rightarrow$ **`ConflictOfInterest_ID`**
- [ ] Rename `Terms.Terms_ID` $\rightarrow$ **`AwardTerms_ID`**

## 2. Organization References (Foreign Keys)
*Update generic `Organization_ID` columns to context-specific, role-based names.* Document this in the README.md. 

- [ ] **Project Table:** Rename FK to **`Lead_Organization_ID`**
- [ ] **RFA Table:** Rename FK to **`Sponsor_Organization_ID`**
- [ ] **Proposal Table:**
  - [ ] Rename sponsor FK to **`Sponsor_Organization_ID`**
  - [ ] Add new column: **`Submitting_Organization_ID`** (The unit that prepares and submits the proposal)
  - [ ] Add new column: **`Administering_Organization_ID`** (The unit responsible for the financial administration of the potential award)
- [ ] **Award Table:**
  - [ ] Rename sponsor FK to **`Sponsor_Organization_ID`**
  - [ ] Ensure **`Prime_Sponsor_Organization_ID`** exists
- [ ] **Subaward Table:** Rename FK to **`Subrecipient_Organization_ID`**
- [ ] **CostShare Table:** Rename FK to **`Source_Organization_ID`**
- [ ] **IndirectRate Table:** Rename FK to **`Applicable_Organization_ID`**

## 3. Structural & Logic Improvements
- [ ] **Contacts View:** Create a SQL View **`vw_All_Contacts`** to union Personnel and Organization contact details.
- [ ] **Contacts table rename:**
  - [ ] Verify that the `Contacts` table has been correctly renamed to **`ContactDetails`** throughout the schema.
- [ ] **Proposal Versioning:**
  - [ ] Add **`Previous_Proposal_ID`** (self-referencing FK) to `Proposal` table.
  - [ ] Add **`Submission_Version`** (INT) to `Proposal` table.
- [ ] **Award/Project Flexibility:**
  - [ ] Make **`Award.Proposal_ID` NULLABLE** (to handle direct awards).
- [ ] **Modification Logic:**
  - [ ] Add **`Impact_on_Budget`** (BOOLEAN) to `Modification` table.

## 4. Budgeting & Financial Fidelity
- [ ] **Standardized Categories:**
  - [ ] Create a **`BudgetCategory`** reference table.
  - [ ] Update `ProposalBudget` and `AwardBudget` to reference this table.
- [ ] **Indirect Cost Transparency:**
  - [ ] Add **`Applied_Indirect_Rate_ID`** (FK to `IndirectRate`) to the `ProposalBudget` table.
  - [ ] Add **`Rate_Base_Used`** (e.g., 'MTDC', 'TDC') to **both** `ProposalBudget` and `AwardBudget`.
  - [ ] **CLARIFICATION:** The `Indirect_Costs` columns should store the **Original Approved Amount** for audit purposes, even if the system dynamically calculates the *current* amount using the rate table.
- [ ] **Budget Versioning:**
  - [ ] Add **`Version_No`** to `ProposalBudget` table.

## 5. Data Integrity
- [ ] **Refine Enums:**
  - [ ] (Optional) Create dedicated lookup tables for high-traffic enums (e.g., `PersonType`, `ProjectStatus`) instead of relying solely on the generic `AllowedValues` table for strict SQL constraint enforcement.

## 6. General
- [ ] Review instructions.md and the notebook to record the schema ontology into the README.md. Add a section on tables amd views summarizing each.
## 7. Dashboard
- [ ] Look at the udm_dashboard.md and make a todo list for that. Things like create the github action. Set up access on dolthub.

