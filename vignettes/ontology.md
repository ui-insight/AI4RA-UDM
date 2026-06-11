# UDM v2 Ontology

This document describes the structure, conventions, and purpose of every entity in the AI4RA Unified Data Model, version 2. The UDM contains **49 tables** organized into **7 domains**, plus **10 reference views**.

For the canonical machine-readable specification, see [udm-v2-schema.md](udm-v2-schema.md) (prose) and [udm-v2-schema.json](udm-v2-schema.json) (MySQL/MariaDB serialization).

## Scope

The UDM models **research administration business data** — the entities, relationships, and attributes that research offices work with daily. It deliberately does **not** model:

- **ETL or data pipelines** — how data gets into the UDM is an implementation concern, not a schema concern. See the [lakehouse](https://github.com/ui-insight/lakehouse) project for adapter patterns.
- **Business process definitions** — workflow steps, approval routing, and process templates belong in process management tools, not in the data model. See the [ProcessMapping](https://github.com/ui-insight/ProcessMapping) project.
- **Application-specific operational state** — ticketing system internals, user sessions, and UI state are outside scope. v1 of the ontology had `ApplicationSystem` and `ServiceRequest` tables despite the stated philosophy; v2 enforces the philosophy by moving those concerns to local extensions.
- **Storage engine, SQL dialect, enforcement mechanism** — the specification is deliberately implementation-agnostic. The companion JSON ships a MySQL/MariaDB example implementation; other dialects are equally valid.
- **Numeric precision, rounding, tolerance** — runtime data-quality concerns, not modeling.
- **UI, query patterns, performance tuning, denormalization for read efficiency** — out of scope.

The guiding principle: if a concept is something a research administrator would describe as "our data," it belongs in the UDM. If it's something an IT team would describe as "our infrastructure" or "our workflow engine," it doesn't.

## What changed from v1

If you read the v1 ontology, the most visible changes:

- **40 tables → 49 tables; 10 domains → 7 domains.** v2 dropped some tables, added more, and reorganized domains.
- **Project as a first-class entity is gone.** Longitudinal-identity grouping is handled by `Proposal.Group_ID` + `Originating_Proposal_ID` (derived chain root) + `Award.Group_ID` (pre-filled from Proposal). See *Lineage mechanisms* below.
- **ProjectRole became three tables.** `AwardRole` (people on the work), `OrganizationRole` (people at an Organization), `ProtocolRole` (people on a compliance protocol). Each answers a different question.
- **Budget unified.** `ProposalBudget` + `AwardBudgetPeriod` + `AwardBudget` collapsed into a single `Budget` table with a `Lifecycle_Stage` discriminator (Proposed → Approved → Current → Actual).
- **Invoice became a Payment Lifecycle_Stage.** Same data, more disciplined modeling.
- **AwardDeliverable → Report.** Scope clarified.
- **ProposalChecklistItem → Action.** Generalized into a polymorphic worklist attachment.
- **ProjectCohort, CohortParticipation, ApplicationSystem, ServiceRequest, SubmissionAttachment, SubmissionEvent dropped from the canonical model.** Cohort tracking, IT inventory, ticketing, and granular submission audit events live in dedicated systems or local extensions.
- **New canonical entities added** — see *Domains* below.
- **Five new universal patterns** — Two-FK XOR attachment, Lifecycle_Stage discriminator with chain immutability, polymorphic attachment with enforcement contract, derived columns with documented recompute triggers, lineage mechanisms.
- **Cross-row constraint catalog** — about 70 explicit invariants documented in one place.

## Naming Conventions

### Tables: PascalCase

Table names use PascalCase with no separators. Tables are named as singular nouns.

```
Organization    AwardRole    ComplianceRequirement    OrganizationCapability
```

### Columns: Snake_Case

Column names use capitalized Snake_Case. Each word is capitalized and separated by underscores.

```
Award_Number    Start_Date    Is_Active    Sponsor_Organization_ID
```

### Primary Keys: `TableName_ID`

Every table's primary key follows the pattern `TableName_ID`. This makes joins predictable — you always know the PK name from the table name.

```
Personnel_ID    Award_ID    Organization_ID    ComplianceRequirement_ID
```

### Foreign Keys: Named by Role

When a table references another table, the foreign key is named to describe the *role* of that relationship, not just the target table.

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
| `_Date` | Date or datetime | `Start_Date`, `Due_Date`, `Decision_Date` |
| `_Status` | Current lifecycle state | `Award_Status`, `Payment_Status` |
| `_Type` | Classification | `Organization_Type`, `Rate_Type` |
| `_Amount` | Monetary value | `Transaction_Amount`, `Current_Total_Funded` |
| `_Percent` | Percentage | `FTE_Percent`, `Effort_Percent` |
| `_Number` | Sequential or reference number | `Award_Number`, `Version_Number` |
| `_Name` | Human-readable name | `Organization_Name`, `First_Name` |
| `_Code` | Short identifier | `Fund_Code`, `Account_Code` |
| `_Description` | Free-text description | `Activity_Description` |
| `Is_` | Boolean flag (prefix) | `Is_Active`, `Is_Primary`, `Is_Key_Personnel` |
| `_Level` | Assessment tier | `Risk_Level` |
| `_Text` | Long-form content | `Requirement_Text` |
| `_URL` | Web address or file path | `File_Path` |
| `_Value_ID` | FK into AllowedValues with implicit Value_Group filter | `Role_Value_ID`, `Mechanism_Value_ID` |

## Universal Patterns

These patterns recur throughout the schema. Recognizing them is the fastest path to reading the rest of the model.

### Audit and provenance columns

Every table includes a universal set of audit columns:

```
Created_At                  -- row creation time
Updated_At                  -- last modification time
Created_By_Personnel_ID     -- FK to Personnel (nullable for system rows)
Updated_By_Personnel_ID     -- FK to Personnel (nullable for system rows)
Source_System               -- originating source system (Banner, Cayuse, etc.)
Source_Record_ID            -- source system's record ID for provenance
Is_Active                   -- soft delete; true by default
```

These are not repeated in the per-table reference; assume them present everywhere.

### AllowedValues vs fixed Status enums

The schema uses two approaches for controlling enumerated values.

**AllowedValues table** — for values that vary by institution. Institutions populate this table with their own codes, labels, and descriptions. Tables that reference institution-defined enums use a `*_Value_ID` foreign key. AllowedValues also carries a `Canonical_Value_Code` column so cross-institution queries can normalize to a shared vocabulary even when local Value_Codes differ.

**Fixed Status enums** — for values that are universal standards. These are constrained directly on the column with a CHECK constraint or ENUM. Used for state machines that are consistent across institutions (Award_Status, Proposal.Decision_Status, Modification.Approval_Status, etc.).

**The decision rule:** a field is a fixed Status enum when (a) the value set is standardized across institutions (regulatory, GAAP, or industry standard), AND (b) the model's correctness depends on stable, known values. Otherwise it's an AllowedValues FK.

Recommended values are documented per column in the JSON. The complete status taxonomy reference is in [udm-v2-schema.md](udm-v2-schema.md#status-taxonomy-reference).

### Self-Referencing Hierarchies

Several tables reference themselves to model hierarchies via a `Parent_TableName_ID` column:

- `Organization.Parent_Organization_ID` — Department within College within University
- `Account.Parent_Account_Code` — chart-of-accounts hierarchy
- `Award.Parent_Award_ID` — incremental segments under one prime award
- `Subaward.Parent_Subaward_ID` — cascading or amended subawards under one prime
- `ComplianceRequirement.Parent_ComplianceRequirement_ID` — renewal chain
- `Document.Parent_Document_ID` — document version chain
- `Budget.Parent_Budget_ID`, `Effort.Parent_Effort_ID`, `CostShare.Parent_CostShare_ID`, `Payment.Parent_Payment_ID` — Lifecycle_Stage chain (see below)
- `Proposal.Previous_Proposal_ID`, `Award.Previous_Award_ID` — competing-renewal lineage

### Two-FK exclusive-or attachment

Some tables attach to one of two possible parents using two nullable FK columns with a constraint that exactly one is non-null. Used to keep Award and Subaward symmetrical without duplicating satellite tables.

Tables using this pattern:
- `Modification`, `Terms`, `Payment`, `Transaction`, `Equipment`, `Report`, `Closeout`, `AwardRole`, `ComplianceCoverage` — Award_ID XOR Subaward_ID
- `Budget`, `CostShare` — Award_ID XOR Subaward_ID at later Lifecycle_Stages
- `ContactDetails` — Personnel_ID XOR Organization_ID
- `Negotiation` — at-least-one of Proposal_ID / Award_ID / Subaward_ID

### Polymorphic attachment

Seven attachment tables can attach to any listed parent via two columns: `Related_Entity_Type` (the parent table name) and `Related_Entity_ID` (the parent row's PK). This generalizes the "attach a document to an award" idea to all the records that accumulate around an entity.

The seven attachment tables:
- `Document` — files
- `Communication` — inbound/outbound correspondence with external parties
- `Restriction` — operational constraints (CUI, CMMC, ITAR, etc.)
- `Deadline` — ad-hoc obligations that don't have a first-class entity
- `Classification` — subject tags and research-area codes
- `Action` — work items (deliverables, checklist items, service requests)
- `ActivityLog` — typed audit events

Each attachment table's allowed `Related_Entity_Type` list is enumerated in its column reference. Enforcement is left to the institution (triggers, application logic, scheduled checks) but minimum conformance behavior is documented: no dangling refs on write, parent removal preserves attachments (soft delete), type-stable references.

### Lifecycle_Stage discriminator

Four tables carry a `Lifecycle_Stage` column that distinguishes records of the same shape at different points in their lifecycle:

| Table | Stages (in order) |
|---|---|
| Budget | Proposed → Approved → Current → Actual |
| Effort | Proposed → Approved → Charged → Certified |
| CostShare | Proposed → Committed → Met → Waived |
| Payment | Scheduled → Invoiced → Received → Reconciled |

Later-stage rows store a `Parent_*_ID` pointing at the earlier-stage row they descend from. Stages may be skipped; when a stage is skipped, the later row points at the nearest existing earlier row.

**Chain immutability.** Once a row at stage S has a later-stage descendant, the row at stage S is immutable in the business sense. Corrections insert a new row at the same stage with its own descendant chain forward; the superseded row is marked `Is_Active = false`.

**No chain branching.** At any given time, a parent row has at most one descendant with `Is_Active = true`. This makes "the latest leaf" unambiguous.

### Bridge tables (M:N)

Many-to-many relationships use bridge tables that carry their own attributes:

- `AwardRole` — Personnel × (Award/Subaward) with role, FTE, credit allocation, dates
- `OrganizationRole` — Personnel × Organization with role and optional Award/Subaward/RFA scope
- `ProtocolRole` — Personnel × ComplianceRequirement with role and optional Award/Subaward scope
- `ComplianceCoverage` — ComplianceRequirement × (Award/Subaward) coverage periods
- `Effort` — AwardRole × time period × Lifecycle_Stage with certification data
- `OtherSupportDisclosure` — OtherSupport × Proposal/Award disclosure events

### Three parallel "person-in-role" tables

A core architectural decision in v2: three role tables, each answering a different question.

- **AwardRole** — "who is on the team performing this Award" (PI, Co_I, Coordinator, etc., with effort and credit allocation).
- **OrganizationRole** — "who holds a role at this Organization" (committee member, program officer at sponsor, Authorized Official at subrecipient, financial contact at vendor, institutional liaison). Optionally scoped to an Award, Subaward, or RFA.
- **ProtocolRole** — "who is on the team for this compliance protocol" (Primary_Investigator, Co_Investigator, study coordinator, lab manager, TCP-cleared personnel).

An external Co-Investigator at a subrecipient institution is recorded as both an AwardRole row (scientific role) and an OrganizationRole row (administrative role at the subrecipient). A person who is the responsible PI on an IRB protocol covering an Award has both an AwardRole row and a ProtocolRole row.

### Lineage mechanisms

Twelve lineage-adjacent columns exist across Proposal, Award, and Subaward. Each answers a different query — pick the column that matches the question.

| Question | Use |
|---|---|
| What proposal originated this Award? | `Award.Proposal_ID` (required FK) |
| What proposal originated this planned Subaward? | `Subaward.Proposal_ID` (persists past Prime_Award_ID) |
| What is the Prime Award for this Subaward? | `Subaward.Prime_Award_ID` |
| What is this Proposal a resubmission / renewal of? | `Proposal.Previous_Proposal_ID` |
| What is the root Proposal of a renewal chain? | `Proposal.Originating_Proposal_ID` (derived) |
| What is this Award a competing renewal of? | `Award.Previous_Award_ID` |
| What is the root Award of a renewal chain? | `Award.Originating_Award_ID` (derived) |
| What other Awards are incremental segments under the same prime? | walk `Award.Parent_Award_ID` |
| What is the predecessor Subaward in a renewal? | walk Prime Award chain + match Subrecipient_Organization_ID; no Previous_Subaward_ID column |
| What other Subawards cascade or were amended under the same prime? | walk `Subaward.Parent_Subaward_ID` |
| What institutional research-line group does this belong to? | `*.Group_ID` (Proposal / Award / Subaward, all user-maintained) |

`Group_ID` is a user-maintained label that ties related Proposals/Awards/Subawards under one longitudinal identity. It is independent of structural lineage: an institution may fork the Group at a renewal even when lineage continues, or merge two unrelated Awards under one Group.

### Derived columns

Some columns are computed from other data. The model specifies the rule; the implementation chooses recomputation timing (generated column, trigger, view, or application-layer compute on read).

Derivations include:
- `Award.Current_End_Date` — Original_End_Date adjusted by latest approved end-date-changing Modification
- `Award.Current_Total_Funded` — Original_Total_Funded plus sum of approved Funding_Change_Amounts
- `Award.Current_PI_Personnel_ID` — the active PI from AwardRole (null when in Multi_PI mode)
- `Award.Originating_Award_ID` — root of Previous_Award_ID chain
- `Award.Subject_To_Federal_Funding` — derived from Sponsor.Sponsor_Type and Prime Sponsor
- `Proposal.Originating_Proposal_ID` — root of Previous_Proposal_ID chain
- `Subaward.Current_End_Date`, `Subaward.Current_PI_Personnel_ID` — symmetric to Award

### Audit authority: Updated_At vs ActivityLog vs versioned storage

Three mechanisms answer "when did this change?", each at a different scope:

- **`Updated_At`** — the most recent write to the row. Answers: is this row stale.
- **`ActivityLog`** — curated typed business events (status transitions, operator actions, explicitly logged field changes). Append-only, not a CDC log. Answers: which curated business events touched this row.
- **Versioned storage** (Dolt, Iceberg, temporal tables) — raw column history. Answers: what did column X look like on date D.

---

## Domains

The 49 tables organize into 7 domains:

| Domain | Tables |
|---|---|
| **Actors** | Personnel, PersonnelCredential, Organization, OrganizationCapability, OrganizationIdentifier, OrganizationRole, ContactDetails |
| **Funding Cycle** | RFA, RFARequirement, Proposal, ProposalApproval, PreAwardAuthorization, Award, Modification, Subaward, Negotiation, Terms, Report, Closeout, SubmissionProfile, SubmissionPackage, SubmissionAttempt |
| **Effort** | AwardRole, Effort |
| **Money** | Budget, Fund, Account, FinanceCode, Transaction, RateAgreement, IndirectRate, Payment, CostShare, Equipment |
| **Compliance** | ComplianceRequirement, ComplianceCoverage, ProtocolRole, ConflictOfInterest, OtherSupport, OtherSupportDisclosure |
| **Reference** | AllowedValues, BudgetCategory |
| **Attachments** | Document, Communication, Restriction, Deadline, Classification, Action, ActivityLog |

## Actors

### Personnel

Individuals involved in research administration: faculty, staff, students, postdocs, fellows, external collaborators, and sponsor-side contacts. Identified by `Person_Type` (Faculty / Staff / Student / Postdoc / Resident / Fellow / External). External Personnel are disambiguated by the Organization their `Home_Organization_ID` points at — a sponsor program officer's Home_Organization is the sponsor; an industry collaborator's is the company.

PII-sensitive fields: `First_Name`, `Middle_Name`, `Last_Name`, `Primary_Email`, `ORCID`.

Deduplication priority: `ORCID` → `Primary_Email` → `(Home_Organization_ID, Home_Organization_Identifier)`. External Personnel without any of these may accumulate duplicates that the institution reconciles via batch matching.

### PersonnelCredential

Person-level credentials and identifiers the institution holds: eRA Commons ID, NSF FastLane ID, sponsor login IDs (always in scope); citizenship, visa status, training history, security clearances (in scope only for non-employee Personnel where HRIS does not apply). For employees, HR-domain credentials live in HRIS and the UDM does not duplicate.

### Organization

Institutional entities that participate in research funding flows: sponsors, academic units, subrecipients, vendors, committees. `Organization_Type` carries structural classification (Department / College / School / Institute / Center / External). Functional roles (Sponsor, Subrecipient, Vendor, Committee, etc.) are recorded as separate `OrganizationCapability` rows so a single Organization can play multiple roles.

Organizations form hierarchies via `Parent_Organization_ID`.

### OrganizationCapability

The functional roles an Organization plays. NIH is both a Sponsor and (in inter-agency review contexts) a Committee. A subrecipient organization that has been suspended for risk reasons keeps the Subrecipient capability with `Capability_Status = 'Suspended'`. `OrganizationCapability.Risk_Level` captures the standing risk profile of the Organization in that capacity (distinct from per-Subaward risk on `Subaward.Risk_Level`).

### OrganizationIdentifier

External identifiers an Organization carries: UEI, EIN, DUNS, CAGE, IPF, IPEDS, sponsor-issued codes. One row per identifier; an Organization usually carries several across federal and institutional registries. Parallels PersonnelCredential for people.

### OrganizationRole

A person's role at an Organization. Generalizes committee membership (IRB members, IACUC committee), sponsor-side contacts (program officers), subrecipient-side contacts (Authorized Officials, Subrecipient_Project_Lead), and vendor contacts. Optionally scoped to a specific Award, Subaward, or RFA.

### ContactDetails

Email, phone, fax, mobile, and address records. Each record attaches to exactly one of a Personnel or an Organization (two-FK XOR pattern).

## Funding Cycle

### RFA

Request for Applications, also known as funding opportunities or solicitations. Captures sponsor, deadlines (submission, LOI, pre-proposal, announcement), funding range, expected award count, maximum duration, and lifecycle status.

### RFARequirement

Specific requirements extracted from an RFA. Acts as a template; per-proposal completion is tracked via Action attachments on the Proposal.

### Proposal

A formal request for funding submitted to a sponsor. Tracks the full lifecycle: drafting, internal routing (via ProposalApproval), submission (via SubmissionPackage/SubmissionAttempt), and decision. Links to three distinct Organization roles: Sponsor, Submitting, Administering.

Carries lineage columns: `Previous_Proposal_ID` (resubmission/renewal/continuation), `Originating_Proposal_ID` (derived chain root), `Group_ID` (user-maintained grouping).

### ProposalApproval

A step in the institutional approval chain for a Proposal. PI, department chair, dean, OSP — each layer's signature is a row with an Approver_Personnel_ID and Approval_Status.

### PreAwardAuthorization

An institutional authorization to spend at-risk on a Proposal that has been favorably reviewed but not yet awarded. Tracks the spending ceiling, dates, authorizer, and conversion to the executed Award when funding arrives.

### Award

The central post-award entity. Funded grants, contracts, cooperative agreements. Every Award originates from a Proposal (`Proposal_ID` required). Carries:
- `Original_End_Date`, `Original_Total_Funded` (frozen at execution)
- `Current_End_Date`, `Current_Total_Funded`, `Current_PI_Personnel_ID` (derived from approved Modifications and active AwardRoles)
- Lineage: `Parent_Award_ID` (incremental segments), `Previous_Award_ID` (competing renewals), `Originating_Award_ID` (derived chain root), `Group_ID`

Status: Pending → Active → Closing → Closed / Suspended / Terminated.

### Modification

A change to an Award or Subaward after initial funding (XOR-attached). Covers NCEs, supplements, budget revisions, PI changes, scope changes, carryovers, rebudgets, sponsor transfers, and continuations. Sub-side amendments use the same table — no separate SubawardModification.

`Approval_Status` includes a `Reversed` value for approved Modifications later withdrawn or invalidated; Reversed Modifications fall out of derived rollups.

### Subaward

A subaward agreement between the institution and a subrecipient. Subaward exists at two scopes on a single row identity: a *planned* subaward (`Subaward_Status = 'Proposed'`, Proposal_ID set) and an *executed* subaward (`Subaward_Status ≥ 'Pending'`, Prime_Award_ID set). The transition is a status change on the same row; the originating Proposal_ID persists alongside the new Prime_Award_ID.

Subaward renewal lineage flows through the Prime Award chain — no dedicated `Previous_Subaward_ID` column. When the prime renews, a new Subaward at the same subrecipient is created under the new Prime.

### Negotiation

The bargaining lifecycle between the institution and a counterparty. Covers three counterparty cases uniformly: sponsor on a Proposal (pre-NoA terms), sponsor on an Award (mid-stream modifications), and subrecipient on a Subaward (subaward terms negotiation).

### Terms

The contractual terms and conditions of a funded agreement: payment method, invoicing frequency, reporting requirements, cost-sharing obligations, special conditions, property requirements, publication requirements, closeout requirements, record retention. One Terms row per parent agreement.

### Report

Scheduled or ad hoc deliverables to the sponsor: progress reports, RPPR, FFR (SF425), final reports, invention statements, data-sharing plan updates. Distinct from Action (generic worklist item) and Deadline (calendar metadata) because Reports have a reporting period, submission record, sponsor confirmation, and acceptance state.

### Closeout

The closeout workflow object for an Award or Subaward. Coordinates several subworkflows (final report, final invoice, equipment disposition, IP closeout, COI closeout, records retention). Structured rather than narrative because federal closeout reporting requires a defined end state.

### SubmissionProfile, SubmissionPackage, SubmissionAttempt

The submission infrastructure:
- **SubmissionProfile** — institution's connection configuration to a sponsor system (grants.gov, eRA Commons, etc.). Credentials are referenced by external secret-store path, not stored.
- **SubmissionPackage** — immutable snapshot of documents and metadata assembled for submission. Versioned per Proposal. `Package_Hash` is SHA-256 of the assembled package.
- **SubmissionAttempt** — one outbound transmission. Multiple attempts may reference the same package (retry, resubmit). Submission_System and Environment are denormalized at attempt creation for historical accuracy.

## Effort

### AwardRole

A person's role on an Award or Subaward (XOR-attached) with effort allocation, date range, credit attribution, and Multi_PI / Contact PI flags. Recommended Role values: PI / Co_PI / Co_I / Multi_PI / Coordinator / Key_Personnel / Cohort_Participant / Coach / Mentor / Trainee.

Constraints worth noting:
- **PI vs Multi_PI mode is exclusive.** An Award is in single-PI mode (exactly one active PI row) or Multi_PI mode (≥2 active Multi_PI rows) or neither (community-partner Subaward with no academic-PI structure). Cannot be both.
- **At most one Contact PI per Multi_PI agreement.** `Is_Contact_PI` identifies the NIH MPI Contact PI; null for non-Multi_PI rows.

### Effort

Per-period, per-stage effort detail for an AwardRole. The `Lifecycle_Stage` column distinguishes Proposed / Approved / Charged / Certified. Certified rows carry the verbatim `Certification_Statement_Text` because the legal force of effort certification depends on what the certifier saw and accepted.

## Money

### Budget

Detailed line items for a budget at a specific lifecycle stage. The `Lifecycle_Stage` discriminator (Proposed → Approved → Current → Actual) replaces v1's separate `ProposalBudget`, `AwardBudgetPeriod`, and `AwardBudget` tables.

`Proposal_ID` is required at every stage (stable chain identity); `Award_ID` or `Subaward_ID` (XOR) is added at Approved+ for the post-award anchor. The `Parent_Budget_ID` chain spans all stages.

Modification effect on the Budget chain is documented as a semantic convention: funding-changing events create a new Current row chained from the prior Current; end-date-changing events (NCE etc.) create a new Current row on the last period to extend `Period_End_Date`; award-state-only events (PI_Change, Scope_Change) create no new Budget row.

The Budget chain carries outer-edge coverage (MAX Period_End_Date = Award.Current_End_Date), inner-edge coverage (MIN Period_Start_Date = Award.Original_Start_Date), and no-gap invariants.

### Fund, Account, FinanceCode

The institutional accounting fabric:
- **Fund** — fund codes from the accounting system
- **Account** — chart-of-accounts entries
- **FinanceCode** — the institutional accounting string (FOAP or equivalent) that connects an Award to fund and account codes

### Transaction

Individual financial entries charged to an Award or Subaward (XOR). Carries `CostShare_ID` (required when Transaction_Type resolves to Cost_Share) so cost-share spending links back to its commitment.

### RateAgreement, IndirectRate

- **RateAgreement** — the negotiated F&A rate agreement (NICRA) between an institution and its cognizant federal agency
- **IndirectRate** — a single negotiated rate within an agreement (on-campus, off-campus, MTDC, etc.). Multiple rates per agreement.

`Budget.IndirectRate_ID` connects each budget period to the F&A rate that applies, supporting multi-year Awards where the rate changes per period.

### Payment

Payment records spanning Scheduled / Invoiced / Received / Reconciled stages (Lifecycle_Stage discriminator). The v1 `Invoice` entity is now `Payment` at `Lifecycle_Stage = 'Invoiced'`.

### CostShare

Cost-sharing commitments across the lifecycle (Proposed → Committed → Met / Waived). Carries `Proposal_ID` at every stage (stable chain identity) like Budget. `Waiver_Reason` distinguishes commitments waived because the work never happened vs commitments waived by sponsor or institutional decision.

### Equipment

A sponsor-purchased or institution-acquired capital asset associated with an Award or Subaward (XOR). Tracks acquisition, in-use, and disposition. Federal closeout requires title-disposition and asset-transfer records.

## Compliance

### ComplianceRequirement

A regulatory approval required for research: IRB, IACUC, IBC, radiation safety, export control, COI. A standalone entity with its own lifecycle (submission, approval, expiration, renewal), independent of any particular Award. The Awards a requirement covers are recorded in the `ComplianceCoverage` junction.

Renewal chaining via `Parent_ComplianceRequirement_ID`. Distinct Issuing Authority and Reviewing Authority Organization references. AllowedValues-backed Review_Pathway and Classification_Level vocabularies vary by Requirement_Type.

`Reviewing_Authority_Organization_ID` is required for IRB/IACUC/IBC (board-reviewed by definition), optional otherwise (self-certifications, etc.).

### ComplianceCoverage

The M:N relationship between a ComplianceRequirement and the Awards (or Subawards) it covers. One IRB protocol can cover three Awards from different sponsors. One Award can require IRB + IACUC + Export_Control determination.

### ProtocolRole

Personnel listed on a specific ComplianceRequirement (the responsible PI, IRB study staff, IACUC personnel, IBC investigators, TCP-cleared personnel). Optional Award/Subaward scoping narrows responsibility to a specific covered agreement when the protocol covers more than one.

Multi-PI protocols carry multiple `Primary_Investigator` ProtocolRole rows.

### ConflictOfInterest

Personal disclosures covering conflicts of interest and conflicts of commitment. Relationship_Type values: Financial / Consulting / Employment / Equity / Royalty / Board_Membership.

**Foreign-engagement disclosures are out of scope** for the canonical model — NSPM-33 foreign affiliations, foreign appointments, foreign talent-program participation, foreign funding sources, country codes, and Award-level foreign-component flags are deferred to a local extension. The ConflictOfInterest table handles traditional domestic conflicts.

### OtherSupport

A Personnel record's external research support (current, pending, in-kind). The *fact* of the outside support. Required by NIH and other sponsors for biosketch / Other Support pages and for research-security reporting.

### OtherSupportDisclosure

A single disclosure event of an OtherSupport row. The same outside appointment is typically disclosed many times across a researcher's career — at each proposal submission, at each annual report, at each JIT request. Each disclosure is its own row.

## Reference

### AllowedValues

Institution-specific controlled vocabularies. The `Value_Group` column names a family (e.g., `AwardRole`, `ContactType`, `TransactionType`); tables that reference institution-defined enums point at rows in this table via `*_Value_ID` foreign keys with an implicit filter on the appropriate Value_Group.

`Canonical_Value_Code` lets institutions map their local codes to a canonical cross-institution code; aggregating queries group on the canonical code to normalize across deployments.

### BudgetCategory

Standardized budget line item categories (SF-424 R&R standard): Senior Personnel, Other Personnel, Equipment, Travel, Participant Support, Other Direct Costs, etc.

## Attachments

All seven Attachment tables share polymorphic `Related_Entity_Type` + `Related_Entity_ID` columns. Each table's allowed target list is enumerated in its column reference. Enforcement is left to the institution; minimum conformance behavior is documented.

### Document

Files associated with any entity. `Document_Type_Value_ID` resolves to AllowedValues with recommended types (NOA / Biosketch / DMP / Budget_Justification / Other_Support / etc.). `Parent_Document_ID` supports a per-logical-document version chain.

### Communication

Inbound or outbound correspondence between the institution and an external party (sponsor program officer, subrecipient, committee, regulator). Distinct from Document (a file) and ActivityLog (a system audit event). Either `External_Personnel_ID` (preferred when the party is tracked as Personnel) or `External_Party_Name` (free text) identifies the external party.

### Restriction

Operational constraints attached to an entity (CUI, CMMC, EAR, ITAR, publication holds, foreign-personnel limits). Carries effective date range and reviewing authority document reference.

### Deadline

Ad-hoc obligations attached to an entity that don't have a first-class entity. If a Report, Closeout milestone, RFA submission deadline, or ComplianceRequirement expiration already has a due date column, the date lives on that entity — Deadline is only for one-off obligations.

### Classification

Subject tags and research-area codes attached to entities. Schemes include NSF Science Code, NIH MeSH, Institution Research Area, Free Tag.

### Action

Worklist items attached to entities: deliverables, checklist items, service requests, modification approvals, compliance renewals, training requirements, JIT requests, cost-transfer approvals, subrecipient risk reviews. Tells you *what* needs to be done and *who* is on it. Distinct from Deadline (which tells you *when*).

`Action_Type_Value_ID` resolves to AllowedValues; the recommended values list is documented per institution-extensibility.

### ActivityLog

Typed audit events. **Not a CDC log of every column update** — it records curated business events the institution chooses to surface: status transitions, operator actions, submission status changes, and explicitly logged field changes. Append-only.

ActivityLog does not log to itself; ActivityLog rows do not appear in `Related_Entity_Type`.

---

## Semantic Conventions

Beyond the universal patterns, the schema documents 17 semantic conventions covering rules that no column constraint can express. Highlights:

- **Modification vs Parent_Award_ID vs Previous_Award_ID** — when sponsor action issues a new Award_Number, it's a new Award; otherwise it's a Modification.
- **AwardRole role-bearer changes** — when a PI (or other role-bearer) changes, end-date the prior row and insert a new one. No mutation in place.
- **Group_ID and Originating_Proposal_ID** — independent grouping mechanisms; disagreement is informative.
- **JIT cycle** — composed of Action + Communication + OtherSupportDisclosure + Budget Proposed-stage revision + optional ComplianceRequirement.
- **Sponsor decision artifacts (NoA, decline letter, modification notice)** — three independent representations: Document + status update + Communication.
- **Lifecycle_Stage vs *_Status** — the criterion is whether the row's shape changes between states.
- **AwardRole vs OrganizationRole vs ProtocolRole** — distinct questions, distinct tables.
- **ConflictOfInterest vs OtherSupport vs ComplianceRequirement(COI)** — three tables touch outside-relationship facts; each answers a different question.
- **Internal funding represented as an Award** — the funding instrument is always an Award (or Subaward) regardless of internal vs external sponsor.

The full convention list is in [udm-v2-schema.md](udm-v2-schema.md#semantic-conventions).

## Deployment scope

UDM v2 is **single-tenant per institution by default**: each deployment serves one operating Organization. The word "institution" in scoped-uniqueness annotations (Award_Number, FAIN, Asset_Tag, Fund_Code, etc.) refers to that operating Organization.

Cross-institution analytics happen at a federation layer above the database, not in shared physical storage. Each participating deployment publishes its data through the same UDM schema; aggregators query across deployments and reconcile values through `Canonical_Value_Code` on AllowedValues.

## Reference Views

The companion JSON ships 10 worked CREATE VIEW examples in MySQL/MariaDB dialect.

| View | Purpose |
|---|---|
| `vw_Active_Awards` | Currently-active Awards with derived current-state columns |
| `vw_Award_Lineage` | Lineage root via COALESCE(Originating_Award_ID, Award_ID) |
| `vw_Subaward_With_Prime` | Subaward joined to its Prime Award (NULL when pre-award) |
| `vw_Active_IRB_Coverage` | Awards currently covered by an active IRB protocol |
| `vw_Overdue_Reports` | Reports past due, with days-overdue calculation |
| `vw_Award_PI_Timeline` | Full PI history per Award via AwardRole + AllowedValues |
| `vw_Award_Budget_Summary` | Original vs Current funding and end-date per Award |
| `vw_Effort_Certification_Status` | Per-period effort completeness, flagging Charged-but-not-Certified |
| `vw_Approved_Modifications` | Approved Modifications with resolved Event_Type (excludes Reversed) |
| `vw_Active_Restrictions` | Currently-in-force Restriction rows across all attachable entities |

## Optional Extensions

Areas the v2 model deliberately does not include in the canonical schema. Institutions that need these capabilities add local extensions and reference them from canonical entities.

- **Detailed Export Control workflow** — TCPs, ECCN classification, BIS/DDTC licenses, foreign-national screening events
- **Foreign-engagement and research-security disclosures (NSPM-33)** — foreign affiliations, foreign appointments, talent-program participation, foreign-component flags
- **Publications and research outputs** — publications, datasets, software releases
- **Invention disclosures and tech transfer** — patent filing, prosecution, licensing, royalty distribution
- **HR / payroll data** — academic rank, IBS, calendar type, benefits (lives in HRIS)
- **Detailed accounting / general ledger** — full GL detail (lives in ERP)
- **Cost transfer workflow** — institutional approval workflow beyond the Transaction + Action pattern
- **Data management plan compliance** — repository, license, retention details beyond the DMP Document attachment
- **IT inventory / application catalog** — formerly `ApplicationSystem`; now a local extension
- **Ticketing / service requests** — formerly `ServiceRequest`; now a local extension or external ticketing system
- **Faculty development cohorts** — formerly `ProjectCohort` / `CohortParticipation`; now a local extension
- **Audit and findings tracking** — sponsor audits, single audits, DCAA audits
- **Field-level audit / history tables** — relegated to versioned storage (Dolt, Iceberg, temporal tables) or a local extension for deployments without versioned storage
- **Clinical trial management** — ClinicalTrials.gov registration, NCT numbers, DSMB, enrollment, eCRF (lives in CTMS)
- **Human subjects participant payments** — per-participant compensation (lives in REDCap / OnCore)
- **Multi-currency awards and subawards** — per-row currency code and exchange rate
