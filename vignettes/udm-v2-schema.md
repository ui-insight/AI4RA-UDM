# UDM v2 Schema Specification

## Goal

The Unified Data Model (UDM) is a vendor-neutral data specification for research administration. It defines the entities, relationships, constraints, and patterns an institution uses to track the lifecycle of sponsored work: from funding opportunity, through proposal preparation and submission, through award management and compliance, to closeout.

The specification is **deliberately implementation-agnostic**. It does not prescribe a database engine, SQL dialect, or storage technology. Concepts are expressed as abstract rules (*"is required"*, *"is unique"*, *"is constrained to a set of values"*, *"must reference an existing record"*) that any relational store can implement using its native mechanisms. An institution adopts the UDM by mapping its source systems (Banner, Cayuse, InfoEd, Workday, Kuali, custom systems) to the entities and constraints described here, then runs queries, dashboards, and integrations against a common shape.

The model has 53 tables organized into 7 domains.

---

## Domains

| Domain | Tables |
|---|---|
| **Actors** | Personnel, PersonnelCredential, Organization, OrganizationCapability, ContactDetails, CommitteeMembership, ExternalPartyContact |
| **Funding Cycle** | RFA, RFARequirement, Proposal, ProposalApproval, PreAwardAuthorization, Award, Modification, Subaward, Negotiation, Terms, Report, Closeout, SubmissionProfile, SubmissionPackage, SubmissionAttempt |
| **Effort** | AwardRole, Effort |
| **Money** | Budget, Fund, Account, FinanceCode, Transaction, RateAgreement, IndirectRate, Payment, CostShare, Equipment |
| **Compliance** | ComplianceRequirement, ComplianceCoverage, ComplianceRequirementStaff, ConflictOfInterest, InventionDisclosure, InventionDisclosureInventor, OtherSupport, OtherSupportDisclosure |
| **Reference** | AllowedValues, BudgetCategory |
| **Attachments** | Document, Communication, Restriction, Deadline, Classification, Action, ActivityLog |

---

## Universal patterns

These patterns recur throughout the schema. Recognizing them is the fastest path to reading the table reference.

### Identifier convention

Every table has a primary key named `TableName_ID`. The primary key is opaque (no business meaning is implied by the value) and unique across the table.

### Hierarchy

Self-referencing parent/child relationships use a `Parent_TableName_ID` column. Used by Organization, Account, Award, Subaward, Budget, Effort, CostShare, Payment, ComplianceRequirement.

### Role-named foreign keys

A foreign key whose name carries the *role* of the relationship rather than just the target table. Used on tables that reference the same target table in multiple roles. Examples:

- `Award.Sponsor_Organization_ID`
- `Award.Prime_Sponsor_Organization_ID`
- `Award.Administering_Organization_ID`
- `Proposal.Submitting_Organization_ID`
- `Subaward.Subrecipient_Organization_ID`

### Polymorphic attachment

Seven tables in the Attachments domain can attach to *any* listed parent table via two columns:

- `Related_Entity_Type`: the name of the table being attached to, constrained to a per-attachment list of allowed table names.
- `Related_Entity_ID`: the primary key value in that table.

The Attachments domain generalizes the everyday RA concept of "attaching a document to an award" to all the things that accumulate around a record: files, correspondence, restrictions, deadlines, tags, work items, and audit events.

The model requires that the referenced record exists. See *Implementation guidance* for enforcement options.

### Lifecycle_Stage discriminator

Four tables carry a `Lifecycle_Stage` column that distinguishes records of the same shape at different points in their lifecycle:

| Table | Stages (in order) |
|---|---|
| Budget | Proposed → Approved → Current → Actual |
| Effort | Proposed → Approved → Charged → Certified |
| CostShare | Proposed → Committed → Met → Waived |
| Payment | Scheduled → Invoiced → Received → Reconciled |

Later-stage rows store a `Parent_*_ID` value pointing at the earlier-stage row they descend from. The stage order is canonical; stages may be skipped (e.g., Effort may jump from Proposed straight to Charged if no separate Approved record exists). When a stage is skipped, the later-stage row's `Parent_*_ID` points at the nearest existing earlier row. A row with no earlier-stage predecessor has `Parent_*_ID` set to null.

**Chain immutability.** Once a row at stage S has a later-stage descendant row referencing it through `Parent_*_ID`, the row at stage S is immutable in the business sense; its primary fields (amount, dates, mode-specific columns) do not change. Corrections after a descendant exists are made by inserting a new row at stage S (with its own descendant chain forward) rather than by editing the existing row. The superseded row is retained for history and may be marked `Is_Active = false`. The `Updated_At` and audit columns on a frozen row may still be touched (e.g., to record a tombstone or a re-classification of `Is_Active`); those columns are metadata and not subject to the immutability rule.

### Two-FK exclusive-or attachment

Some tables attach to one of two possible parents. The pattern is most commonly used for Award or Subaward, but also for Personnel or Organization on ContactDetails and Proposal or Award on Negotiation. The pattern uses two nullable foreign key columns and a constraint that exactly one is non-null. Used by:

- ContactDetails (Personnel_ID or Organization_ID)
- Negotiation (at least one of Proposal_ID, Award_ID, or Subaward_ID; counterparty is the sponsor for the first two, the subrecipient for the third)
- AwardRole (Award_ID or Subaward_ID)
- ComplianceCoverage (Award_ID or Subaward_ID)
- Terms (Award_ID or Subaward_ID)
- Budget (Award_ID or Subaward_ID; only when Lifecycle_Stage ≥ Approved)
- Payment (Award_ID or Subaward_ID)
- Modification (Award_ID or Subaward_ID)
- Transaction (Award_ID or Subaward_ID)
- Equipment (Award_ID or Subaward_ID)
- Report (Award_ID or Subaward_ID)
- Closeout (Award_ID or Subaward_ID)

The pattern keeps Award and Subaward symmetrical (an Award is an inbound funded agreement, a Subaward is outbound) without requiring duplicate satellite tables.

### Extensibility via AllowedValues

The AllowedValues table holds institution-specific enumerated values. Tables that reference institution-defined enums use a `*_Value_ID` foreign key. Tables that need *universal* enumerations (federal standards, GAAP categories, lifecycle states) use a fixed value list whose allowed values are enforced by the database's enumeration mechanism (CHECK constraint, ENUM type, lookup table, whichever the platform provides).

**When to use a fixed Status enum vs an AllowedValues FK:** A field is a fixed Status enum when (a) the value set is standardized across institutions (regulatory, GAAP, or industry standard), AND (b) the model's correctness (including cross-row constraints and cross-institution interop) depends on stable, known values. A field is an AllowedValues FK when (a) institutions need to add or retire local values, OR (b) no canonical interop list exists, OR (c) the field is local classification not consulted by the model's constraints. New fields added in future revisions follow the same rule.

### Boolean naming

Boolean columns are prefixed `Is_` (e.g. `Is_Active`, `Is_Flow_Through`, `Is_Key_Personnel`).

### Audit and provenance pattern

Every table includes the following columns. They are not repeated in the per-table reference; assume them present everywhere unless explicitly overridden.

| Column | Type | Required | Purpose |
|---|---|---|---|
| `Created_At` | Timestamp | required | Row creation time |
| `Updated_At` | Timestamp | required | Last modification time |
| `Created_By_Personnel_ID` | ID | optional | → Personnel; nullable for system-initiated rows |
| `Updated_By_Personnel_ID` | ID | optional | → Personnel; nullable for system-initiated rows |
| `Source_System` | ShortCode | optional | The originating source system (Banner, Cayuse, InfoEd, Workday, Kuali, etc.) |
| `Source_Record_ID` | ID | optional | The originating record's identifier in the source system; preserves provenance for downstream reconciliation |
| `Is_Active` | Boolean | required | Default true; used for soft-delete and to distinguish currently-valid records from historical ones. Tables with their own lifecycle/status fields may rely on those instead and treat Is_Active as always true |

### Audit authority: Updated_At vs ActivityLog

Two fields appear to answer "when did this change?" but they answer different questions:

- `Updated_At` marks the moment of the most recent write to the row. It is a single timestamp, overwritten on every update; it does not preserve history.
- `ActivityLog` records the history of changes: who changed what, when, with old and new values. It is append-only.

Consumers asking "is this row stale" or "what's the latest version" use `Updated_At`. Consumers asking "when did the status flip from X to Y" or "who changed this field" use `ActivityLog`. When the two appear to conflict (a recent `Updated_At` with no corresponding `ActivityLog` entry, or vice versa), `ActivityLog` is authoritative for the history of the row's content; `Updated_At` is authoritative for "has anything touched this row, including metadata."

### Is_Active vs status-field authority

Tables that carry their own primary lifecycle/status field (Award_Status, Subaward_Status, Requirement_Status, Action_Status, Restriction_Status, Deadline_Status, Payment_Status, Negotiation_Status, RFA_Status) treat that status field as authoritative for "what state is this record in," and use `Is_Active` only to hide rows from operational queries (without losing them).

A row may be `Is_Active = false` while its status field still records a meaningful state (e.g., a soft-deleted Award still carries `Award_Status = 'Closed'`). When the two conflict, operational consumers use `Is_Active`; auditors use the status field.

### Semantic conventions

Rules that the schema can't express as a column constraint but that consumers should follow for the model to be queryable consistently.

**Modification vs Parent_Award_ID vs Previous_Award_ID.** The discriminator is *whether the sponsor issues a new Award_Number*.

- If the sponsor action does **not** issue a new Award_Number, it is a **Modification** on the existing Award (no-cost extension, administrative supplement, budget revision, scope change, PI change, rebudget).
- If the sponsor action issues a **new Award_Number** that is part of an incremental segment under the same prime (e.g., separately-numbered annual increments under one funded program), it is a **new Award** with `Parent_Award_ID` set to the predecessor.
- If the sponsor action issues a **new Award_Number** through a **competing renewal** that supersedes a prior award identity, it is a **new Award** with `Previous_Award_ID` set to the predecessor (parallel to `Proposal.Previous_Proposal_ID`).

The same rule applies to Subaward (Modification vs new Subaward with Parent_Subaward_ID or Previous_Subaward_ID).

**Group_ID and Originating_Proposal_ID.** Two independent mechanisms answer "what group does this Award or Proposal belong to":

- `Proposal.Originating_Proposal_ID` is the derived root of the `Previous_Proposal_ID` lineage chain. It auto-updates if the lineage is corrected.
- `Proposal.Group_ID` is a user-maintained grouping label. The institution sets it deliberately and lineage edits do not change it.

These can agree or disagree, and the disagreement is informative: lineage may continue while the institution chooses to fork the Group identity (or vice versa). On Award insert, `Award.Group_ID` is pre-filled from the originating Proposal's `Group_ID` as a default; it may be overridden afterward and is not constrained to remain equal to its Proposal's value.

**Modification effect on the Budget chain.** A funding-changing Modification (Incremental_Funding, Supplement, Budget_Revision, Rebudget) creates a new Budget row at `Lifecycle_Stage = 'Current'` chained via `Parent_Budget_ID` to the prior Current row (or to the Approved row if no Current exists yet). The prior Current row becomes immutable once a Current descendant exists; the latest Current row (the one with no Current descendant) is the working budget that Actual-stage rows reconcile against. `Version_Number` increments per revision on the same `(parent agreement, Period_Start_Date)` key. Non-funding-changing Modifications (No_Cost_Extension, PI_Change, Scope_Change) do not create a new Budget row; they change Award/Subaward state only. Chain immutability extends to same-stage parenting on Current: once a Current row has a Current descendant via `Parent_Budget_ID`, the predecessor's amounts are frozen.

**ComplianceCoverage on protocol renewal.** When a ComplianceRequirement is renewed (a new ComplianceRequirement row is created with `Parent_ComplianceRequirement_ID` pointing at the predecessor), the predecessor's open ComplianceCoverage rows are end-dated (`Coverage_End_Date` set to the renewal date) and new ComplianceCoverage rows are created pointing at the renewed ComplianceRequirement with `Coverage_Start_Date` equal to the renewal date. Each Award's coverage is thus continuous in queries; the ComplianceRequirement row identity advances on every annual renewal cycle.

**Lifecycle_Stage vs *_Status.** The criterion for choosing between the patterns is whether the **row's shape changes between states**:

- **Lifecycle_Stage** is used when different stages require **different columns** to be populated (Budget at Modular vs Approved-with-period, Effort at Charged adds Charged_Amount, Effort at Certified adds Statement/Signature, Payment at Invoiced adds Invoice_Number). The Parent_*_ID chain plus chain immutability is justified by the row's shape changing as the stage advances.
- **A bare Status enum** is used when the row carries the **same columns** at every state (Award_Status, Subaward_Status, ComplianceRequirement.Requirement_Status, Report.Report_Status, Modification.Approval_Status). No chain immutability is required because corrections at a status point don't conflict with later rows of different shape.

New tables added to the spec follow the same rule.

**AwardRole vs ExternalPartyContact.** The two are distinct because they answer different questions:

- **AwardRole** answers "who is on the team performing this work" (PI, Co_I, Coordinator, etc., with effort and credit allocation).
- **ExternalPartyContact** answers "who at an external organization is administratively connected to this scope" (program officer, authorized official, financial contact).

An external Co-Investigator at a subrecipient institution is recorded as **both**: an AwardRole row (their scientific role on the Award or Subaward, with credit allocation if applicable) and an ExternalPartyContact row scoped to the Subaward (their administrative role at the subrecipient organization for that subaward). Queries about "the science" use AwardRole; queries about "the administrative contact" use ExternalPartyContact.

**Sponsor decision artifacts (NoA, decline letter, modification notice).** Sponsor-issued decision documents have three independent representations:

- The **document** itself (the NoA PDF, the modification notice email) is a `Document` row with the appropriate Document_Type (NOA / Modification_Notice / Decline_Letter / etc.) attached to the relevant entity (Proposal, Award, Modification).
- The **decision's effect on schema state** is captured by updating the relevant status field (Proposal.Decision_Status='Awarded', Modification.Approval_Status='Approved') and recording the transition in ActivityLog.
- The **accompanying correspondence** (program officer's email transmitting the decision) is a `Communication` row attached to the same parent.

No single entity captures "the decision" abstractly; the three representations together do.

**CommitteeMembership vs ComplianceRequirementStaff.** Two distinct concepts:

- **CommitteeMembership** = membership on the *reviewing committee* (the IRB, the IACUC) that approves protocols. Members are the people reviewing other people's submissions.
- **ComplianceRequirementStaff** = personnel on a specific *submitted protocol* (the PI's study team, coordinators, lab manager). Staff are the people whose work is reviewed.

The same person may appear in both tables in different roles (an IRB board member can also be a Co-Investigator on someone else's protocol). The relationships are independent.

**Deadline vs first-class due dates.** Several entities carry their own due-date columns (Report.Due_Date, Closeout milestones, RFA.Submission_Deadline, RFA.LOI_Deadline, ComplianceRequirement.Expiration_Date). The Deadline attachment is for *ad-hoc obligations that don't have a first-class entity*. If the obligation is already modeled by a first-class entity with a due date, the due date lives on that entity and is not duplicated as a Deadline row. Use Deadline only for obligations that don't otherwise have a structured home (a one-off reporting commitment from a sponsor letter; an internal milestone tied to an Award; a reminder attached to an RFA that isn't a sponsor deadline).

**Recurring compliance renewals.** Annual continuing reviews (IRB), annual COI attestations, annual export-control reaffirmations, and similar recurring obligations live on the current ComplianceRequirement row itself: `Expiration_Date` is the date the current approval lapses, and the next continuing review must complete before that date. Consumers compute "what's due next" by querying for ComplianceRequirements with upcoming `Expiration_Date` values. When the renewal completes, a new ComplianceRequirement row is created with `Parent_ComplianceRequirement_ID` pointing at the predecessor (per the chain pattern). For ComplianceRequirements that don't expire (an Export Control Fundamental_Research determination), `Expiration_Date` is null and the row remains active until facts change and a new determination supersedes it.

**Attachments vs row properties.** Restriction and Classification look like properties of the parent entity but are modeled as polymorphic attachments because they recur across many parent types (an ITAR Restriction can attach to an Award, a Subaward, a Proposal, or a Personnel record). Promoting them to per-parent property columns would require duplicating the same columns on five or more parent tables and maintaining them in lockstep. The polymorphic attachment is the relational compromise: one table, one set of columns, attaching anywhere it makes sense. Treat them as "first-class records that happen to attach polymorphically" rather than as system metadata.

**Internal funding represented as an Award.** An internally-funded pilot is modeled as an Award row whose `Sponsor_Organization_ID` is the internal sponsor (the VPR's office, the dean's office, etc.). Budget, Transaction, Payment, CostShare, Equipment, FinanceCode, Modification, and Closeout all attach to that Award using the same structures as for an externally-funded Award. The funding instrument is always an Award (or Subaward) regardless of whether the sponsor is external or internal.

**Action.Outcome_Description.** When an Action records a structured workflow with a substantive result (Subrecipient_Risk_Review, Foreign_National_Screening, Modification_Approval, Cost_Transfer_Approval), the outcome lives in `Outcome_Description` plus an optional `Linked_Document_ID` for the formal report.

---

## Data type vocabulary

The specification uses an abstract vocabulary for column types. Each institution maps these to its database engine's native types.

| Abstract type | Intent | Platform mapping (example) |
|---|---|---|
| `ID` | Opaque primary or foreign key identifier | VARCHAR(50), UUID, or BIGINT depending on platform and ID strategy |
| `ShortCode` | Short institutional code | VARCHAR(20) |
| `ShortName` | Short personal or unit name | VARCHAR(100) |
| `MediumName` | Title, organization name, file name | VARCHAR(255) |
| `URL` | URL, file path, long identifier | VARCHAR(500) |
| `LongText` | Description, narrative, requirement text | TEXT / CLOB |
| `Status` | Enumerated state value | VARCHAR(20) with platform enumeration enforcement |
| `Date` | Calendar date with no time component | DATE |
| `Timestamp` | Date and time, time zone preserved | TIMESTAMP WITH TIME ZONE / DATETIME2 |
| `Money` | Monetary amount; institutions select currency convention | DECIMAL(18,2) |
| `Percent` | 0.00 through 100.00 | DECIMAL(5,2) |
| `Count` | Small integer | INT |
| `Boolean` | True / false | BOOLEAN / BIT |
| `Hash` | Cryptographic hash (SHA-256) | VARCHAR(64) or BYTEA |
| `LargeCount` | Large integer (file sizes) | BIGINT |

Length and precision are guidelines; institutions may widen them. Narrowing them risks losing valid data and is discouraged.

---

## Constraint vocabulary

Constraints are expressed abstractly in this specification. Each phrase maps to the equivalent native mechanism on the implementing platform.

| Constraint phrase | Meaning |
|---|---|
| **Required** | Column must always have a value (NOT NULL) |
| **Optional** | Column may be null |
| **Unique within X** | Column value is unique within the scope X (whole table, parent, institution) |
| **Constrained to a value set** | Column value must come from a fixed list of allowed values |
| **References** (→ TableName) | Column value must match an existing row in TableName's primary key |
| **Exactly one of X or Y non-null** | One and only one of two columns may be non-null |
| **At least one of X or Y non-null** | One or both of two columns must be non-null |
| **Derived** | Column value is computed from other data; see Implementation guidance for recomputation timing |
| **Conditional-required** | Column is required only when a stated condition on other columns holds |
| **Sums to N across rows** | The sum of the column's value across a logical group of rows equals N |

Implementations enforce these abstractly-stated rules using whatever mechanisms the platform provides (NOT NULL constraints, unique indexes, CHECK constraints, foreign keys, triggers, application logic). The *Implementation guidance* section catalogs the rules that typically require enforcement beyond simple column declarations.

---

## Status taxonomy reference

Universal status taxonomies are listed here in one place. Each is enforced wherever the column appears. Institution-specific enums use AllowedValues and are described in their consuming table's reference.

| Field | Allowed values |
|---|---|
| `Award_Status` | Pending, Active, Closing, Closed, Suspended, Terminated |
| `Subaward_Status` | Proposed, Pending, Active, Closed, Terminated, Suspended |
| `Proposal.Internal_Approval_Status` | Draft, In_Review, Approved, Rejected, Withdrawn |
| `Proposal.Decision_Status` | Pending, Submitted, Under_Review, Awarded, Declined, Withdrawn |
| `RFA_Status` | Active, Closed, Superseded, Cancelled |
| `Negotiation_Status` | Pending, Active, On_Hold, Resolved, Abandoned |
| `Modification.Approval_Status` | Pending, Approved, Rejected, Not_Required |
| `Modification.Continuation_Type` (optional) | Competing, Non_Competing, Supplement, Other |
| `Payment_Status` | Open, Submitted, Paid, Disputed, Cancelled (dispositional; see note below) |
| `Requirement_Status` (Compliance) | Draft, Submitted, In_Review, Approved, Expired, Conditional_Approval, Disapproved, Terminated, Suspended, Not_Applicable |
| `Risk_Level` (Award, Proposal, Subaward) | Low, Medium, High |
| `Restriction_Status` | Active, Expired, Lifted, Pending_Review |
| `Deadline_Status` | Open, Approaching, Overdue, Met, Waived |
| `Action_Status` | Open, In_Progress, Blocked, Completed, Cancelled |
| `Package_Status` (Submission) | Assembled, Submitted, Withdrawn |
| `Attempt_Status` (Submission) | submitting, submitted, received, validated, accepted, rejected, error |

**Lifecycle_Stage vs *_Status (Payment).** The Lifecycle_Stage discriminator on Payment names which *shape* of payment data a row holds (Scheduled → Invoiced → Received → Reconciled). Payment_Status names the row's *disposition* (whether the payment is on-track, contested, or withdrawn). The two are orthogonal: a Payment at Lifecycle_Stage = 'Invoiced' may carry Payment_Status = 'Disputed' (the invoice was submitted and the sponsor pushed back) or Payment_Status = 'Cancelled' (the invoice was withdrawn). Query writers filter by Lifecycle_Stage to select a row shape and by Payment_Status to filter healthy vs problem rows.

CostShare has no separate `*_Status` column; CostShare.Lifecycle_Stage is authoritative for its state.

---

## Polymorphic attachment enforcement

The seven Attachment tables (Document, Communication, Restriction, Deadline, Classification, Action, ActivityLog) use a polymorphic foreign key (`Related_Entity_Type` + `Related_Entity_ID`) that no single declarative reference can fully enforce.

The model requires two enforcement properties:

1. **`Related_Entity_Type` is constrained** to a per-attachment allowed list of target table names (enumerated in each attachment's table reference).
2. **`Related_Entity_ID` references an existing row** in the table named by `Related_Entity_Type`.

Implementations satisfy (1) using the platform's enumeration mechanism. Implementations satisfy (2) using whatever the platform provides: database triggers, application-layer hooks, scheduled integrity checks, or other mechanisms appropriate to the institution's stack. The *Implementation guidance* section discusses common approaches; the schema does not prescribe one. Removal behavior (what happens to attached rows when the parent is removed) is an institutional choice and is not specified.

---

## Implementation guidance

This section documents the rules in the schema that require enforcement beyond simple column declarations, and describes how to satisfy them platform-agnostically. The specification does not include SQL DDL; implementers translate these rules to their platform's mechanisms.

### Polymorphic FK existence

For every Attachment table and every allowed target type, the implementation must verify that `Related_Entity_ID` refers to an existing row in the target table. Approaches:

- **Database triggers** that branch on `Related_Entity_Type` and verify existence in the matching table.
- **Application-layer enforcement** in every code path that writes to an Attachment table.
- **Per-target join tables** (one bridge table per Attachment × target pair), at the cost of more tables and more join paths.
- **Scheduled integrity checks** that detect and report orphan Attachment rows.

The institution chooses; the model is silent on which.

### Derived values

Some columns are derived from other data. The model specifies the rule; the implementation chooses recomputation timing.

| Derived column | Rule | Recomputation triggers |
|---|---|---|
| `Award.Subject_To_Federal_Funding` | True if the Award's Sponsor has Sponsor_Type='Federal', OR Is_Flow_Through is true and the Prime Sponsor has Sponsor_Type='Federal' | On insert/update of Award, Sponsor's Sponsor_Type, Prime Sponsor's Sponsor_Type |

Common implementation choices: generated column, trigger that maintains the value, view that computes it, or application-layer compute on read. The model accepts any approach that produces the correct value at the moment a consumer reads it.

### Cross-row constraint catalog

The following rules require enforcement beyond what a single column declaration can express. Each implementation chooses a mechanism (trigger, application logic, deferrable constraint, scheduled check). The schema's correctness depends on these holding.

| Location | Rule |
|---|---|
| Organization | `Sponsor_Type` is required when the Organization has an OrganizationCapability row with `Capability_Value` resolving to `Sponsor` |
| Personnel | `Primary_Email` is unique across the table when not null |
| Personnel | `ORCID` is unique across the table when not null |
| ContactDetails | Exactly one of `Personnel_ID` or `Organization_ID` is non-null |
| ContactDetails | At most one row per (referenced entity, `Contact_Type_Value_ID`) has `Is_Primary = true` |
| Proposal | `Decision_Status = 'Awarded'` only when `Internal_Approval_Status = 'Approved'` |
| Award | `FAIN` is required when the Sponsor's `Sponsor_Type = 'Federal'`; `FAIN` is unique within the institution when not null |
| Award | Referenced `Sponsor_Organization_ID` has an OrganizationCapability with Capability resolving to `Sponsor` |
| Award | Referenced `Prime_Sponsor_Organization_ID` has an OrganizationCapability with Capability resolving to `Sponsor` (or `Prime_Sponsor`) |
| Modification | `Prior_Approval_Granted_Date` is required when `Requires_Prior_Approval = true` and `Approval_Status = 'Approved'` |
| Modification | `Carryover_Amount` is required when the Event_Type value resolves to a carryover event |
| Modification | `Funding_Change_Amount` is required for funding-changing event types (Incremental_Funding, Budget_Revision, Supplement); null is permitted for non-financial event types (No_Cost_Extension, PI_Change, Scope_Change). When the modification does not change funding, the value is null (not zero) |
| Modification | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Modification | `Modification_Number` is unique within the parent agreement (Award or Subaward) |
| Subaward | Referenced `Subrecipient_Organization_ID` has an OrganizationCapability with Capability resolving to `Subrecipient` |
| Negotiation | At least one of `Proposal_ID`, `Award_ID`, or `Subaward_ID` is non-null |
| Negotiation | `Negotiation_End_Date` is required when `Negotiation_Status` is `Resolved` or `Abandoned` |
| Terms | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Terms | One Terms row per parent agreement |
| SubmissionAttempt | `Attempt_Number` is unique within (`SubmissionPackage_ID`, `SubmissionProfile_ID`) |
| AwardRole | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| AwardRole | `FTE_Percent` is between 0.00 and 100.00 |
| AwardRole | `Credit_Percent` values sum to 100 across credit-bearing roles on the parent agreement (the Award or Subaward identified by `Award_ID`/`Subaward_ID`). Credit-bearing roles are those whose `Role_Value_ID` resolves (via `Canonical_Value_Code`) to one of: `PI`, `Co_PI`, `Co_I`, `Multi_PI`. Institutions extend the set by populating `Canonical_Value_Code` on their local Role values |
| Effort | `Effort_Percent` is between 0.00 and 100.00 |
| Effort | `Charged_Amount` and `Over_Cap_Amount` are required when `Lifecycle_Stage = 'Charged'` |
| Effort | `Certification_Method`, `Certifier_Personnel_ID`, `Certification_Date` are required when `Lifecycle_Stage = 'Certified'` |
| Effort | `Person_Months` semantics: months-per-year denominator is 12 for `Calendar_Type='Calendar'`, 9 for `Academic`, 3 for `Summer` |
| Budget | Exactly one of `Award_ID` or `Subaward_ID` is non-null when `Lifecycle_Stage ≥ Approved`; `Proposal_ID` is required when `Lifecycle_Stage = 'Proposed'` |
| Budget | Mode-specific required columns: `Module_Count` and `Module_Size_Amount` when `Budget_Mode = 'Modular'`; `Budget_Category_ID` and `Amount` when `Budget_Mode = 'Itemized'` |
| Budget | At most one row per (parent anchor, `Lifecycle_Stage`, `Period_Start_Date`, `Version_Number`, `Budget_Category_ID`), where the parent anchor is the non-null one of `Proposal_ID`, `Award_ID`, or `Subaward_ID`. For the uniqueness key, null `Budget_Category_ID` values are treated as a single distinct value |
| Payment | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Payment | `Scheduled_Date` and `Scheduled_Amount` are required when `Lifecycle_Stage = 'Scheduled'` |
| Payment | `Invoice_Number` is required when `Lifecycle_Stage = 'Invoiced'` and later; unique within the parent agreement (Award or Subaward) |
| Payment | `Actual_Date` and `Actual_Amount` are required when `Lifecycle_Stage = 'Received'` and later |
| CostShare | Exactly one of `Award_ID` or `Subaward_ID` is non-null when `Lifecycle_Stage ≥ Committed`; `Proposal_ID` is required when `Lifecycle_Stage = 'Proposed'` |
| CostShare | `Amount_Actual` is required when `Lifecycle_Stage = 'Met'` |
| Transaction | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Transaction | `Income_Treatment` is required when `Transaction_Type` resolves to project income |
| Equipment | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Equipment | `Disposition_Date` is required when `Equipment_Status` is one of: Surplused, Transferred, Disposed, Lost |
| Report | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Report | `Submitted_Date` and `Submitted_By_Personnel_ID` are required when `Report_Status` ∈ {Submitted, Accepted, Returned_for_Revision, Late}; `Acceptance_Date` is required when `Report_Status = 'Accepted'` |
| Closeout | Exactly one of `Award_ID` or `Subaward_ID` is non-null; one Closeout per parent agreement |
| Closeout | `Final_Closeout_Date` is required when `Closeout_Status = 'Complete'` |
| Subaward | `Proposal_ID` required when `Subaward_Status = 'Proposed'`; `Prime_Award_ID` required when `Subaward_Status ≥ 'Pending'`. Both columns may be non-null at the same time after transition so the originating-proposal link persists alongside the prime-award link |
| Effort | When `Lifecycle_Stage = 'Certified'`, all of: `Certification_Method`, `Certifier_Personnel_ID`, `Certification_Date`, `Certification_Statement_Text` are required |
| InventionDisclosureInventor | When any `Inventor_Share_Percent` is non-null for a disclosure, all rows for that disclosure must have non-null shares summing to 100 |
| InventionDisclosureInventor | `Inventor_Order` is unique within `InventionDisclosure_ID` |
| ComplianceRequirement | `Approved_Date` is required when `Requirement_Status = 'Approved'` |
| ComplianceRequirement | Referenced `Reviewing_Authority_Organization_ID` has an OrganizationCapability appropriate to the Requirement_Type: `Committee` for IRB/IACUC/IBC; `Program_Office` (or other institution-defined capability) for Export_Control/Radiation/etc. |
| ComplianceCoverage | Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| ComplianceCoverage | A given (`ComplianceRequirement_ID`, parent anchor) pair appears at most once with a null `Coverage_End_Date`, where the parent anchor is the non-null one of `Award_ID` or `Subaward_ID` |
| ConflictOfInterest | `Management_Plan_Description` is required when `Review_Outcome` is `Manageable_Conflict` or `Management_Plan_Required` |
| AllowedValues | `Value_Code` is unique within `Value_Group` |
| ExternalPartyContact | At most one of `Award_ID`, `Subaward_ID`, `RFA_ID` is non-null. All null indicates a general institutional contact at the Organization, not scoped to a specific funding artifact |
| OtherSupport | `External_Sponsor_Name` is required when `External_Sponsor_Organization_ID` is null |
| ConflictOfInterest | `Entity_Name` is required when `Entity_Organization_ID` is null |
| Attachment tables | The polymorphic-FK rules listed in *Polymorphic attachment enforcement* |

### Lifecycle closure

When a parent entity's status transitions to a closing state, dependent records do not auto-cascade; closure is a workflow concern. The model leaves these decisions to the institution. Examples of typical institutional rules (not enforced by the schema):

- When `Award_Status` becomes `Closed`, set `End_Date` on open AwardRoles and transition any Active Restrictions on the Award to Expired or Lifted.
- When `Subaward_Status` becomes `Closed`, expect a corresponding ComplianceRequirement renewal cycle to be reviewed.

The institution chooses whether to enforce these via triggers, scheduled jobs, or application workflow. The schema records the resulting state; it does not orchestrate the transitions.

### Source-system mapping

The provenance columns (`Source_System`, `Source_Record_ID`) preserve the link from each UDM row back to its originating record. The schema does not prescribe a system-of-record per field; each institution decides which source system is authoritative for each piece of data. When two sources hold the same logical entity, the institution chooses one as authoritative and either represents the others as historical/informational copies or relies on integration logic to reconcile.

Recommended identifier strategy for UDM IDs: institutions choose either opaque UUIDs (preserves no source meaning) or source-prefixed identifiers (e.g., `BANNER_<source_id>`, `CAYUSE_<source_id>`) for traceability. The schema accepts either approach; ID values are opaque from the model's perspective.

### Cross-institution value normalization

For vendor-neutral cross-institution queries to work, `Value_Group` names in AllowedValues are canonical (see the list in the AllowedValues table reference). Individual institutions populate their own `Value_Code` rows. Where cross-institution queries need to compare codes (e.g., "show all travel-category transactions across institutions"), the spec recommends:

- A `Canonical_Value_Code` column on AllowedValues that institutions populate with the canonical code their local `Value_Code` maps to (when one exists).
- Queries that aggregate across institutions group by `Canonical_Value_Code` rather than `Value_Code`.

Semantic contract:

- A null `Canonical_Value_Code` means the local code has no canonical equivalent. Cross-institution queries that group on `Canonical_Value_Code` exclude such rows.
- A `Value_Code` marked `Is_Active = false` is retired. Existing rows that reference a retired code retain their FK (historical accuracy is preserved); the schema does not require historical rows to be re-coded.
- The canonical code set itself (which codes are canonical, what they mean) is maintained outside the schema by the adopting consortium or working group; the schema records the mapping but does not publish the canonical reference list.

The spec includes `Canonical_Value_Code` in the AllowedValues table reference below.

---

## Table reference

Tables are listed alphabetically within each domain. Every table also includes the universal audit columns described in *Audit and provenance pattern*; they are not repeated per table.

### Actors

#### Personnel

Individuals involved in research administration: faculty, staff, students, postdocs, fellows, external collaborators, and sponsor-side contacts.

| Column | Type | Required | Notes |
|---|---|---|---|
| Personnel_ID | ID | required | PK |
| Honorific | ShortCode | optional | Dr., Prof., etc. |
| First_Name | ShortName | required | PII |
| Middle_Name | ShortName | optional | PII |
| Last_Name | ShortName | required | PII |
| Suffix | ShortCode | optional | |
| Primary_Email | MediumName | optional | PII; unique when not null |
| ORCID | ShortCode | optional | PII; format 0000-0000-0000-0000; unique when not null |
| Home_Organization_ID | ID | required | → Organization. The Organization the person primarily affiliates with: their academic department for internal Personnel; their employing institution for external Personnel (a program officer at NSF references NSF; an industry collaborator references the company). Renamed from Department_Organization_ID to clarify that the field covers both internal departmental affiliation and external employer affiliation |
| Person_Type | Status | required | Constrained: Faculty / Staff / Student / Postdoc / Resident / Fellow / External |

**Disambiguating "External" personnel.** A sponsor program officer, an industry collaborator, and an external committee member all carry `Person_Type = 'External'`. Their affiliation is disambiguated by the Organization their `Home_Organization_ID` points at. That Organization's OrganizationCapability rows declare its functional role. A sponsor PO's Home_Organization points at an Organization with Capability = 'Sponsor'; an industry collaborator's points at an Organization with Capability = 'Vendor' (or just an external Organization with `Organization_Type = 'External'`); an external committee member's points at an Organization with Capability = 'Committee'. The Personnel row does not duplicate this classification.

#### PersonnelCredential

A person-level credential or identifier the institution needs to hold itself. Two scope rules:

- **Sponsor-system identifiers** (eRA Commons ID, NSF FastLane ID, Sponsor_Login_ID): always in scope for any Personnel, employee or external. These are RA-domain identifiers; HRIS does not hold them.
- **HR-domain credentials** (Citizenship, Visa_Status, training history, security clearances): in scope only for non-employee Personnel where HRIS does not apply (external Co-Investigators, sponsor program officers, subrecipient PIs, visiting scholars, community-partner contacts). For employees, these live in HRIS and the UDM does not duplicate.

| Column | Type | Required | Notes |
|---|---|---|---|
| PersonnelCredential_ID | ID | required | PK |
| Personnel_ID | ID | required | → Personnel |
| Credential_Type | Status | required | Constrained: Citizenship / Visa_Status / Permanent_Resident_Status / eRA_Commons_ID / NSF_FastLane_ID / Sponsor_Login_ID / CITI_Training / IRB_Training / IACUC_Training / Biosafety_Training / Export_Control_Training / Security_Clearance / Background_Check / Other |
| Credential_Value | MediumName | required | The credential's value (ISO 3166 country code for Citizenship, the eRA Commons username, a clearance level, etc.) |
| Issuing_Authority_Organization_ID | ID | optional | → Organization. The issuing or attesting authority |
| Issued_Date | Date | optional | |
| Expiration_Date | Date | optional | Null when the credential does not expire |
| Verification_Date | Date | optional | When the institution last verified this credential |
| Credential_Status | Status | required | Constrained: Active / Expired / Revoked / Pending_Verification |
| Notes | LongText | optional | |

#### Organization

Institutional entities that participate in research funding flows: sponsors, academic units, subrecipients, vendors, committees.

| Column | Type | Required | Notes |
|---|---|---|---|
| Organization_ID | ID | required | PK |
| Organization_Name | MediumName | required | |
| Organization_Type | Status | required | Structural classification. Constrained: Department / College / School / Institute / Center / External. Functional roles (sponsor, subrecipient, vendor, committee) are recorded as OrganizationCapability rows, not as Organization_Type values |
| Parent_Organization_ID | ID | optional | → Organization (self-referencing) |
| Sponsor_Type | Status | conditional | Constrained when present: Federal / State / Local / Foundation / Industry / Higher_Ed_PassThrough / Foreign / Tribal / Internal. Required when the Organization has an OrganizationCapability row with Capability = 'Sponsor' |

#### OrganizationCapability

The functional roles an Organization plays. An Organization may carry multiple capabilities (NIH is both a Sponsor and, in some contexts, a Committee for inter-agency review). The capability set is what cross-table constraints check; `Organization.Organization_Type` is the structural classification and is not consulted for these constraints.

| Column | Type | Required | Notes |
|---|---|---|---|
| OrganizationCapability_ID | ID | required | PK |
| Organization_ID | ID | required | → Organization |
| Capability_Value_ID | ID | required | → AllowedValues with `Value_Group = 'OrganizationCapability'`. Recommended values: Sponsor / Prime_Sponsor / Subrecipient / Vendor / Committee / Program_Office / Pass_Through_Entity |
| Capability_Status | Status | required | Constrained: Active / Suspended / Terminated / Probationary. Distinguishes a capability that is currently in good standing from one that has been suspended (e.g., a subrecipient suspended for risk reasons) or terminated. Distinct from `Is_Active` row-level soft delete |
| Effective_Start_Date | Date | optional | When the organization began playing this role (used for historical orgs no longer active in this capability) |
| Effective_End_Date | Date | optional | When the organization stopped playing this role |
| Notes | LongText | optional | |

A given (Organization, Capability) pair appears at most once with no Effective_End_Date (an organization is not concurrently two of "the same" capability).

#### ContactDetails

Email, phone, fax, mobile, and address records. Each record attaches to exactly one of a Personnel or an Organization.

| Column | Type | Required | Notes |
|---|---|---|---|
| ContactDetails_ID | ID | required | PK |
| Personnel_ID | ID | optional | → Personnel. Exactly one of `Personnel_ID` or `Organization_ID` is non-null |
| Organization_ID | ID | optional | → Organization. Exactly one of `Personnel_ID` or `Organization_ID` is non-null |
| Contact_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'ContactType'`. Recommended values: Email / Phone / Mobile / Fax / Mailing_Address |
| Contact_Value | URL | required | The actual email / phone / address text |
| Is_Primary | Boolean | required | At most one primary per (referenced entity, Contact_Type) |

#### CommitteeMembership

A person's seat on a committee Organization (an Organization carrying Capability = 'Committee'). Used for IRB, IACUC, IBC, scientific review committees, and institutional standing committees.

| Column | Type | Required | Notes |
|---|---|---|---|
| CommitteeMembership_ID | ID | required | PK |
| Personnel_ID | ID | required | → Personnel |
| Committee_Organization_ID | ID | required | → Organization. Referenced Organization has an OrganizationCapability with Capability = 'Committee' |
| Membership_Role | Status | required | Constrained: Chair / Vice_Chair / Member / Ex_Officio / Alternate |
| Start_Date | Date | required | |
| End_Date | Date | optional | Null for current members |

#### ExternalPartyContact

A person's role at any external Organization (sponsor, subrecipient, vendor, prime, program office). Generalizes the sponsor-side and subrecipient-side contact-person patterns: a program officer at NSF, an Authorized Official at a community-partner subrecipient, a financial contact at a vendor, etc. Distinct from AwardRole (which is institutional staff on an institutional project).

| Column | Type | Required | Notes |
|---|---|---|---|
| ExternalPartyContact_ID | ID | required | PK |
| Personnel_ID | ID | required | → Personnel (the external individual) |
| External_Organization_ID | ID | required | → Organization. Referenced Organization is external (carries OrganizationCapability resolving to one of: Sponsor / Prime_Sponsor / Subrecipient / Vendor / Program_Office / Pass_Through_Entity / Committee) |
| Award_ID | ID | optional | → Award. When the contact is assigned to a specific award. At most one of Award_ID, Subaward_ID, RFA_ID is non-null (all null means a general institutional contact at the Organization, not scoped to one funding artifact) |
| Subaward_ID | ID | optional | → Subaward. When the contact is assigned to a specific subaward |
| RFA_ID | ID | optional | → RFA. When the contact is assigned to a specific funding opportunity |
| Contact_Role | Status | required | Constrained: Program_Officer / Grants_Management_Specialist / Contract_Officer / Scientific_Review_Officer / Authorized_Official / Signing_Official / Technical_Contact / Financial_Contact / Compliance_Contact / Subrecipient_PI_Contact / Subrecipient_Project_Lead / Other |
| Start_Date | Date | optional | When the contact became responsible for this scope |
| End_Date | Date | optional | When the contact stopped being responsible |

---

### Funding Cycle

#### RFA

A funding opportunity announcement (program announcement, solicitation, BAA, RFP).

| Column | Type | Required | Notes |
|---|---|---|---|
| RFA_ID | ID | required | PK |
| RFA_Number | ShortCode | required | Sponsor-issued opportunity number |
| RFA_Title | URL | required | |
| Sponsor_Organization_ID | ID | required | → Organization. Referenced Organization has an OrganizationCapability with Capability = 'Sponsor' |
| Mechanism_Value_ID | ID | optional | → AllowedValues with `Value_Group = 'FundingMechanism'`. The funding mechanism / activity code the opportunity uses |
| Funding_Mechanism_Description | MediumName | optional | Free-text description for mechanisms not in the canonical taxonomy |
| Assistance_Listing_Number | ShortCode | optional | Federal program identifier (formerly CFDA) |
| Announcement_Date | Date | optional | |
| LOI_Deadline | Date | optional | |
| Pre_Proposal_Deadline | Date | optional | |
| Submission_Deadline | Date | required | |
| Funding_Floor_Amount | Money | optional | |
| Funding_Ceiling_Amount | Money | optional | |
| Expected_Award_Count | Count | optional | |
| Maximum_Duration_Months | Count | optional | |
| RFA_Status | Status | required | See Status taxonomy |
| Submission_Portal_URL | URL | optional | |

#### RFARequirement

A specific requirement extracted from an RFA. Acts as a template; per-proposal completion is tracked via an Action.

| Column | Type | Required | Notes |
|---|---|---|---|
| RFARequirement_ID | ID | required | PK |
| RFA_ID | ID | required | → RFA |
| Requirement_Code | ShortCode | required | Unique within an RFA |
| Requirement_Text | LongText | required | |
| Requirement_Category | Status | required | Constrained: Eligibility / Budget / Format / Compliance / Reporting / Personnel / Document / Review_Criterion / Submission / Deadline / Special_Condition / PAPPG_Deviation / Other |
| Page_Reference | ShortName | optional | Where in the RFA the requirement appears |
| Format_Specification | MediumName | optional | |
| Structured_Rule_Type | ShortCode | optional | For machine-checkable rules |
| Structured_Rule_Value | LongText | optional | Rule expression in the Type's format |

#### Proposal

A formal request for funding submitted to a sponsor.

| Column | Type | Required | Notes |
|---|---|---|---|
| Proposal_ID | ID | required | PK |
| Proposal_Number | ShortCode | required | Unique within the institution |
| Proposal_Title | URL | required | |
| RFA_ID | ID | optional | → RFA. Not all proposals respond to a formal RFA |
| Sponsor_Organization_ID | ID | required | → Organization (the funder) |
| Submitting_Organization_ID | ID | required | → Organization (the unit preparing the proposal) |
| Administering_Organization_ID | ID | required | → Organization (the unit managing finances) |
| Previous_Proposal_ID | ID | optional | → Proposal. Lineage for resubmissions, renewals, continuations |
| Originating_Proposal_ID | ID | optional | → Proposal. The root of this Proposal's `Previous_Proposal_ID` chain. Derived, stored. Null when this Proposal is itself the root (no predecessor). Auto-updates if `Previous_Proposal_ID` is ever corrected. Used for lineage queries without recursive CTE traversal |
| Group_ID | ShortCode | optional | A user-maintained grouping label that ties related Proposals together under one longitudinal scientific or scholarly identity. Independent of the lineage chain: the institution may persist a Group across renewals or fork to a new Group while lineage continues, deliberately. Not auto-updated by lineage edits |
| Submission_Version | Count | required | Default 1 |
| Proposed_Start_Date | Date | required | |
| Proposed_End_Date | Date | required | |
| Total_Proposed_Direct | Money | optional | |
| Total_Proposed_Indirect | Money | optional | |
| Total_Proposed_Budget | Money | optional | |
| Submission_Deadline | Date | optional | The sponsor deadline this proposal targets |
| Submission_Date | Date | optional | When the proposal was actually submitted |
| Internal_Approval_Status | Status | required | See Status taxonomy |
| Decision_Status | Status | required | See Status taxonomy |
| Decision_Date | Date | optional | |
| Risk_Level | Status | optional | See Status taxonomy |
| Proposal_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'ProposalType'`. Recommended values: New / Resubmission / Renewal / Continuation / Revision / Task_Order |
| Mechanism_Value_ID | ID | optional | → AllowedValues with `Value_Group = 'FundingMechanism'`. The funding mechanism / activity code the proposal targets |

#### ProposalApproval

A step in the institutional approval chain for a Proposal. Most universities require sign-off from PI, department chair, dean, and OSP (and sometimes additional layers) before a Proposal can be submitted to the sponsor. ProposalApproval rows capture each step's approver, action, and timing as a structured chain.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProposalApproval_ID | ID | required | PK |
| Proposal_ID | ID | required | → Proposal |
| Approval_Step_Order | Count | required | Sequence within the routing chain (1 = first signature, etc.) |
| Approval_Role | Status | required | Constrained: PI / Co_Investigator / Department_Chair / College_Dean / Center_Director / OSP_Pre_Award / Compliance_Office / VPR / Other. The institutional role that performs this step |
| Approver_Personnel_ID | ID | required | → Personnel. The specific person who performs (or is expected to perform) this step |
| Approval_Status | Status | required | Constrained: Pending / Approved / Rejected / Bypassed / Returned_for_Revision |
| Action_Date | Date | conditional | Required when Approval_Status is not Pending |
| Notes | LongText | optional | |

#### PreAwardAuthorization

An institutional pre-award authorization to spend at-risk on a Proposal that has been favorably reviewed but not yet officially awarded. The institution accepts the financial risk in exchange for not delaying the work. Distinct from a Modification with `Pre_Award_Costs_Amount` (which captures retrospective pre-award costs on an executed Award).

| Column | Type | Required | Notes |
|---|---|---|---|
| PreAwardAuthorization_ID | ID | required | PK |
| Proposal_ID | ID | required | → Proposal |
| Maximum_Amount | Money | required | The institution-approved at-risk spending ceiling |
| Authorization_Date | Date | required | |
| Effective_Start_Date | Date | required | |
| Effective_End_Date | Date | required | |
| Authorizing_Personnel_ID | ID | required | → Personnel. The institutional officer who authorized the at-risk spending |
| Authorization_Status | Status | required | Constrained: Pending / Approved / Revoked / Converted_To_Award / Expired_Unused |
| Converted_To_Award_ID | ID | optional | → Award. Populated once the Proposal becomes an Award and the pre-award authorization is folded into the executed funding |
| Notes | LongText | optional | |

#### Award

A funded grant, contract, or cooperative agreement. The central post-award entity. Award represents inbound funding (your institution receives money); Subaward represents the outbound symmetric case.

| Column | Type | Required | Notes |
|---|---|---|---|
| Award_ID | ID | required | PK |
| Award_Number | ShortCode | required | The sponsor-issued award number. Unique within the institution |
| Internal_Award_Number | ShortCode | optional | The institution's own internal award/project identifier when the institution issues one (PeopleSoft project string, internal grant number, etc.). Distinct from Award_Number, which is sponsor-issued |
| Award_Title | URL | required | |
| Group_ID | ShortCode | optional | A grouping label that ties related Awards together under one longitudinal scientific or scholarly identity. Pre-filled at Award insert from the originating Proposal's `Group_ID` as a convenience. The institution may override afterward; there is no enforced equality with the Proposal's value after insert |
| Proposal_ID | ID | required | → Proposal. Every Award originates from a Proposal |
| Sponsor_Organization_ID | ID | required | → Organization. Referenced Organization has an OrganizationCapability with Capability = 'Sponsor' |
| Prime_Sponsor_Organization_ID | ID | optional | → Organization. The original funder for pass-through awards |
| Administering_Organization_ID | ID | required | → Organization. The institutional unit managing finances |
| Parent_Award_ID | ID | optional | → Award (self-referencing). Incremental segments or supplements under the same prime. Distinct from Previous_Award_ID: Parent_Award_ID groups segments under one award identity |
| Previous_Award_ID | ID | optional | → Award (self-referencing). Competing renewal lineage: when a new award supersedes an earlier award through a competing renewal, the new award references its predecessor. Parallels Proposal.Previous_Proposal_ID |
| RFA_ID | ID | optional | → RFA |
| FAIN | ShortCode | conditional | Federal Award Identification Number. Required when the Sponsor has Sponsor_Type = 'Federal'. Unique within the institution when not null |
| Assistance_Listing_Number | ShortCode | optional | Federal program identifier (formerly CFDA) |
| Mechanism_Value_ID | ID | optional | → AllowedValues with `Value_Group = 'FundingMechanism'`. The funding mechanism / activity code (R01, R21, R03, P01, P30, U54, K01, K23, K99, T32, F31, F32, Cooperative_Agreement, Contract_BAA, Contract_RFP, OT_Other_Transaction, etc.). A major analytics dimension; institutions populate with their sponsor-recognized mechanism taxonomy |
| Funding_Mechanism_Description | MediumName | optional | Free-text description for mechanisms not in the canonical taxonomy |
| Original_Start_Date | Date | required | |
| Original_End_Date | Date | required | |
| Period_Of_Performance_Start_Date | Date | required | Total span of authorized work; distinct from a single budget period |
| Period_Of_Performance_End_Date | Date | required | |
| Current_End_Date | Date | required | Current end after modifications |
| Current_Total_Funded | Money | required | |
| Total_Anticipated_Funding | Money | optional | |
| Award_Status | Status | required | See Status taxonomy |
| Risk_Level | Status | optional | See Status taxonomy |
| Is_Flow_Through | Boolean | required | True when money flows from a prime sponsor through the direct sponsor |
| Subject_To_Federal_Funding | Boolean | derived | Derivation rule and recomputation triggers documented in *Implementation guidance* |

#### Modification

A change to an Award or Subaward after initial funding. Modification is XOR-attached to either Award or Subaward (one of `Award_ID` or `Subaward_ID` is non-null), so the same table covers prime-award modifications (NCE, supplement, budget revision, PI change on the prime) and subaward modifications (subaward NCE, scope change at the subrecipient, budget realignment at the sub) symmetrically. Sub-side amendments do not require a separate table.

| Column | Type | Required | Notes |
|---|---|---|---|
| Modification_ID | ID | required | PK |
| Award_ID | ID | optional | → Award. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Modification_Number | ShortCode | required | Unique within the parent agreement |
| Effective_Date | Date | required | |
| Event_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'ModificationEventType'`. Recommended values: Incremental_Funding / No_Cost_Extension / Budget_Revision / PI_Change / Scope_Change / Carryover / Rebudget / Sponsor_Transfer / Supplement / Cost_Transfer_Authorization |
| Continuation_Type | Status | optional | Constrained when present: Competing / Non_Competing / Supplement / Other |
| Approval_Status | Status | required | See Status taxonomy |
| Requires_Prior_Approval | Boolean | required | |
| Prior_Approval_Granted_Date | Date | conditional | Required when Requires_Prior_Approval is true and Approval_Status is Approved |
| Funding_Change_Amount | Money | conditional | Positive for adds, negative for reductions. Required for funding-changing event types; null for non-financial event types |
| Carryover_Amount | Money | conditional | Required when the Event_Type resolves to Carryover |
| Carryforward_Amount | Money | optional | Companion of Carryover depending on accounting policy |
| Pre_Award_Costs_Amount | Money | optional | At-risk spending captured at the modification level |
| Description | LongText | optional | Free-text description of the change |

#### Subaward

A subaward agreement between the institution and a subrecipient. Subaward exists at two scopes: a *planned* subaward referenced from a Proposal at the pre-award stage, and an *executed* subaward referenced from the Prime Award post-award. The transition is a status change on the same row when the prime award is received; the Subaward row identity is preserved and the originating Proposal_ID persists alongside the new Prime_Award_ID. Subaward is a first-class parent for Terms, Budget, Payment, Modification, Transaction, CostShare, Equipment, and all Attachment tables.

| Column | Type | Required | Notes |
|---|---|---|---|
| Subaward_ID | ID | required | PK |
| Proposal_ID | ID | conditional | → Proposal. The proposal that planned this subaward. Required when Subaward_Status = 'Proposed'. Persists after the transition to Pending/Active so the originating-proposal link is preserved across the subaward lifecycle |
| Prime_Award_ID | ID | conditional | → Award (the parent inbound award). Required when Subaward_Status ≥ 'Pending' (i.e., the prime award has been received). Null while Subaward_Status = 'Proposed' |
| Parent_Subaward_ID | ID | optional | → Subaward (self-referencing). For cascading or amended subawards where one subaward succeeds another under the same prime |
| Previous_Subaward_ID | ID | optional | → Subaward (self-referencing). Competing-renewal lineage on the subaward side. When a renewed prime produces a new Subaward replacing the predecessor at the same subrecipient, the new Subaward points back at the predecessor. Parallels Award.Previous_Award_ID |
| Subrecipient_Organization_ID | ID | required | → Organization. Referenced Organization has an OrganizationCapability with Capability = 'Subrecipient' |
| Administering_Organization_ID | ID | required | → Organization. The institutional unit responsible for monitoring this subaward |
| Subaward_Number | ShortCode | required | Unique within the institution |
| Subaward_Title | URL | required | |
| Total_Subaward_Amount | Money | required | Current obligated amount (planned amount at Proposed stage) |
| Total_Anticipated_Amount | Money | optional | |
| Original_Start_Date | Date | required | |
| Original_End_Date | Date | required | |
| Current_End_Date | Date | required | Current end after modifications |
| Risk_Level | Status | required | See Status taxonomy |
| Subaward_Status | Status | required | See Status taxonomy. Subaward_Status = 'Proposed' indicates a pre-award planned subaward |
| Monitoring_Frequency_Months | Count | optional | How often subrecipient monitoring is performed |

#### Negotiation

The contract or agreement bargaining lifecycle between the institution and a counterparty before final terms are accepted. Covers three counterparty cases uniformly: sponsor on a Proposal (pre-NoA terms), sponsor on an Award (mid-stream modifications and supplements being negotiated), and subrecipient on a Subaward (subaward terms negotiation with the subrecipient). Distinct from Terms (the agreed result).

| Column | Type | Required | Notes |
|---|---|---|---|
| Negotiation_ID | ID | required | PK |
| Proposal_ID | ID | optional | → Proposal. At least one of `Proposal_ID`, `Award_ID`, or `Subaward_ID` is non-null |
| Award_ID | ID | optional | → Award. For modifications or terms being negotiated mid-award |
| Subaward_ID | ID | optional | → Subaward. For subaward terms being negotiated with the subrecipient |
| Counterparty_Organization_ID | ID | required | → Organization. The party the institution is negotiating with. For sponsor-side negotiations, the referenced Organization has an OrganizationCapability with Capability = 'Sponsor' or 'Prime_Sponsor'. For subaward-side negotiations, the referenced Organization has Capability = 'Subrecipient' |
| Institutional_Lead_Personnel_ID | ID | required | → Personnel. The institution's lead negotiator |
| Counterparty_Contact_Personnel_ID | ID | optional | → Personnel. The counterparty's lead negotiator |
| Negotiation_Start_Date | Date | required | |
| Negotiation_End_Date | Date | conditional | Required when Negotiation_Status is Resolved or Abandoned |
| Negotiation_Status | Status | required | See Status taxonomy |
| Outcome_Description | LongText | optional | |

#### Terms

The contractual terms and conditions of a funded agreement. One Terms row per parent agreement (Award or Subaward).

| Column | Type | Required | Notes |
|---|---|---|---|
| Terms_ID | ID | required | PK |
| Award_ID | ID | optional | → Award. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Payment_Method | Status | required | Constrained: Reimbursement / Advance / Cost_Reimbursement / Fixed_Price / Letter_of_Credit / Payment_Request |
| Invoicing_Frequency | Status | required | Constrained: Monthly / Quarterly / Semi_Annual / Annual / Upon_Request / Milestone |
| Invoice_Submission_Days | Count | optional | Days after period close that invoices are due |
| Reporting_Requirements | LongText | optional | |
| Special_Conditions | LongText | optional | |
| Property_Requirements | LongText | optional | Equipment, property, and inventions provisions |
| Publication_Requirements | LongText | optional | Pre-publication review windows, attribution |
| Closeout_Requirements | LongText | optional | Final reports, equipment disposition, records retention |
| Record_Retention_Years | Count | optional | |

#### Report

A scheduled or ad hoc deliverable to the sponsor: progress report, RPPR, federal financial report (FFR), final report, invention statement, data-sharing plan update. Distinct from Action (generic work item) and Deadline (calendar metadata) because reports have a reporting period, a submission record, a sponsor confirmation, and a defined acceptance state.

| Column | Type | Required | Notes |
|---|---|---|---|
| Report_ID | ID | required | PK |
| Award_ID | ID | optional | → Award. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Report_Type | Status | required | Constrained: Progress / RPPR / Financial / FFR_SF425 / Final_Progress / Final_Financial / Invention_Statement / Data_Sharing / Equipment_Inventory / Audit_Response / Other |
| Reporting_Period_Start_Date | Date | required | |
| Reporting_Period_End_Date | Date | required | |
| Due_Date | Date | required | |
| Submitted_Date | Date | conditional | Required when Report_Status ≥ 'Submitted' |
| Submitted_By_Personnel_ID | ID | conditional | → Personnel. Required when Report_Status ≥ 'Submitted' |
| Sponsor_Confirmation_Number | ShortName | optional | Sponsor-issued upon receipt |
| Report_Status | Status | required | Constrained: Pending / Drafted / Submitted / Accepted / Returned_for_Revision / Late / Waived |
| Acceptance_Date | Date | conditional | Required when Report_Status = 'Accepted' |
| Linked_Document_ID | ID | optional | → Document (the report file itself) |

#### Closeout

The closeout workflow object for an Award or Subaward. Each closeout coordinates several subworkflows (final report, final invoice, equipment disposition, IP closeout, COI closeout, records retention start). Closeout is structured rather than narrative because federal closeout reporting requires a defined end state.

| Column | Type | Required | Notes |
|---|---|---|---|
| Closeout_ID | ID | required | PK |
| Award_ID | ID | optional | → Award. Exactly one of `Award_ID` or `Subaward_ID` is non-null. One Closeout row per parent agreement |
| Subaward_ID | ID | optional | → Subaward. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Closeout_Initiated_Date | Date | required | |
| Final_Report_Status | Status | required | Constrained: Not_Required / Pending / Submitted / Accepted |
| Final_Invoice_Status | Status | required | Constrained: Not_Required / Pending / Submitted / Paid |
| Equipment_Disposition_Status | Status | required | Constrained: Not_Applicable / In_Progress / Complete |
| IP_Closeout_Status | Status | required | Constrained: Not_Applicable / In_Progress / Complete |
| COI_Closeout_Status | Status | required | Constrained: Not_Applicable / In_Progress / Complete |
| Records_Retention_Start_Date | Date | optional | Beginning of the retention window (typically the date the final FFR is accepted) |
| Records_Retention_End_Date | Date | optional | Computed end of retention; derived from Records_Retention_Start_Date and Terms.Record_Retention_Years |
| Final_Closeout_Date | Date | conditional | Required when Closeout_Status = 'Complete' |
| Closeout_Status | Status | required | Constrained: In_Progress / Pending_Sponsor_Final_Audit / Complete / Reopened |

#### SubmissionProfile

Configuration of an institution's connection to a sponsor's electronic submission system.

| Column | Type | Required | Notes |
|---|---|---|---|
| SubmissionProfile_ID | ID | required | PK |
| Organization_ID | ID | required | → Organization (the sponsor) |
| Submission_System | Status | required | Constrained: grants_gov / research_gov / era_commons / nspires / manual / other |
| Environment | Status | required | Constrained: training / production |
| Credential_Reference_Path | URL | optional | External secret-store path; credentials are NOT stored in the schema |

#### SubmissionPackage

An immutable snapshot of the documents and metadata assembled for submission.

| Column | Type | Required | Notes |
|---|---|---|---|
| SubmissionPackage_ID | ID | required | PK |
| Proposal_ID | ID | required | → Proposal |
| Package_Version | Count | required | Default 1; increments per snapshot |
| Package_Hash | Hash | required | SHA-256 of the assembled package |
| Assembled_Date | Timestamp | required | |
| Package_Status | Status | required | See Status taxonomy |

#### SubmissionAttempt

One outbound transmission of a SubmissionPackage to an external sponsor system.

| Column | Type | Required | Notes |
|---|---|---|---|
| SubmissionAttempt_ID | ID | required | PK |
| SubmissionPackage_ID | ID | required | → SubmissionPackage |
| SubmissionProfile_ID | ID | required | → SubmissionProfile |
| Submission_System | Status | required | Denormalized from the profile at attempt creation for historical accuracy |
| Environment | Status | required | Same; constrained to: training / production |
| Attempt_Number | Count | required | Unique within (SubmissionPackage, SubmissionProfile) |
| Submitted_Timestamp | Timestamp | required | |
| Attempt_Status | Status | required | See Status taxonomy |
| Sponsor_Confirmation_Number | ShortName | optional | Sponsor-issued upon acceptance |

---

### Effort

#### AwardRole

A person's role on an Award (or Subaward), with effort allocation, date range, and credit attribution. Limited to award-side staffing roles (PI, Co_PI, Co_I, Multi_PI, Coordinator, Key_Personnel, Cohort_Participant, Coach, Mentor, Trainee). Other Person-on-Thing relationships have their own homes:

- Committee membership → **CommitteeMembership**
- External-party roles (sponsor program officer, subrecipient AO, vendor contact) → **ExternalPartyContact**
- Protocol staff on a compliance protocol → **ComplianceRequirementStaff**
- Trainee appointment metadata (slot, eligibility, payback) lives outside this model; see Optional Extensions
- Inventor on an invention disclosure → **InventionDisclosureInventor**

Roles attach to the funding instrument (Award or Subaward). Cross-Award team queries (the persistent research team across competing renewals) join through `Award.Group_ID` to aggregate AwardRole rows whose parent Awards share a Group.

| Column | Type | Required | Notes |
|---|---|---|---|
| AwardRole_ID | ID | required | PK |
| Personnel_ID | ID | required | → Personnel |
| Award_ID | ID | optional | → Award. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Role_Value_ID | ID | required | → AllowedValues with `Value_Group = 'AwardRole'`. Recommended values: PI / Co_PI / Co_I / Multi_PI / Coordinator / Key_Personnel / Cohort_Participant / Coach / Mentor / Trainee |
| Coach_Personnel_ID | ID | optional | → Personnel. For cohort participation |
| FTE_Percent | Percent | optional | Committed effort percentage (0.00–100.00). The authoritative "what was promised" figure |
| Credit_Percent | Percent | optional | Investigator credit allocation. Sums to 100 across credit-bearing roles on the Award (or Subaward) |
| Credit_Unit_Organization_ID | ID | optional | → Organization. Unit receiving the credit |
| Is_Key_Personnel | Boolean | required | |
| Start_Date | Date | required | |
| End_Date | Date | optional | |

**Authoritative source for effort questions:** `AwardRole.FTE_Percent` is the authoritative committed-effort figure for an Award. The `Effort` table carries per-period, per-stage detail and is authoritative for actual effort questions (Charged, Certified). Queries for "committed effort" use `AwardRole.FTE_Percent`. Queries for lifecycle-stage detail use `Effort`.

#### Effort

Per-stage effort detail for a AwardRole. The Lifecycle_Stage column distinguishes proposed, approved, charged, and certified effort numbers.

| Column | Type | Required | Notes |
|---|---|---|---|
| Effort_ID | ID | required | PK |
| AwardRole_ID | ID | required | → AwardRole (the assignment) |
| Lifecycle_Stage | Status | required | Constrained: Proposed / Approved / Charged / Certified |
| Parent_Effort_ID | ID | optional | → Effort. Later-stage rows point at the nearest existing earlier-stage row |
| Period_Start_Date | Date | required | |
| Period_End_Date | Date | required | |
| Effort_Percent | Percent | required | Authoritative for this Lifecycle_Stage |
| Person_Months | Percent | optional | Months-per-year denominator: 12 for Calendar, 9 for Academic, 3 for Summer (see Implementation guidance) |
| Calendar_Type | Status | required | Constrained: Calendar / Academic / Summer |
| Charged_Amount | Money | conditional | Required when Lifecycle_Stage = 'Charged' |
| Over_Cap_Amount | Money | conditional | Required when Lifecycle_Stage = 'Charged' (zero when not over cap) |
| Certification_Method | Status | conditional | Constrained when present: PAR / Activity_Report / Timesheet / Other. Required when Lifecycle_Stage = 'Certified' |
| Certifier_Personnel_ID | ID | conditional | → Personnel. Required when Lifecycle_Stage = 'Certified' |
| Certification_Date | Date | conditional | Required when Lifecycle_Stage = 'Certified' |
| Certification_Statement_Text | LongText | conditional | The legal attestation text the certifier accepted. Required when Lifecycle_Stage = 'Certified'. Recorded verbatim because the legal force of effort certification depends on what the certifier saw and accepted |
| Certification_Signature_Reference | URL | optional | Reference to a stored signature artifact (signed PDF, e-signature service record, IDP claim). Optional but expected when audit traceability of the signature event matters |
| Recertification_Of_Effort_ID | ID | optional | → Effort. When a Certified row is later recertified (correction to a previously-certified period), the new row references the row it supersedes |

---

### Money

#### Budget

Detailed line items for a budget at a specific lifecycle stage. Each Budget row attaches to a Proposal at the Proposed stage or to an Award/Subaward at later stages.

| Column | Type | Required | Notes |
|---|---|---|---|
| Budget_ID | ID | required | PK |
| Lifecycle_Stage | Status | required | Constrained: Proposed / Approved / Current / Actual |
| Budget_Mode | Status | required | Constrained: Itemized / Modular |
| Parent_Budget_ID | ID | optional | → Budget. Later-stage rows point back to earlier-stage rows (revisions chain) |
| Proposal_ID | ID | conditional | → Proposal. Required when Lifecycle_Stage = 'Proposed' |
| Award_ID | ID | conditional | → Award. Exactly one of Award_ID or Subaward_ID is non-null when Lifecycle_Stage ≥ Approved |
| Subaward_ID | ID | conditional | → Subaward. Exactly one of Award_ID or Subaward_ID is non-null when Lifecycle_Stage ≥ Approved |
| Period_Start_Date | Date | required | |
| Period_End_Date | Date | required | |
| Version_Number | Count | required | Default 1 |
| Module_Count | Count | conditional | Required when Budget_Mode = 'Modular' |
| Module_Size_Amount | Money | conditional | Required when Budget_Mode = 'Modular' (typically $25,000 for NIH modular) |
| Budget_Category_ID | ID | conditional | → BudgetCategory. Required when Budget_Mode = 'Itemized'; one Budget row per line item |
| Amount | Money | conditional | The line-item amount. Required when Budget_Mode = 'Itemized' |

#### Fund

Fund codes from the institutional accounting system.

| Column | Type | Required | Notes |
|---|---|---|---|
| Fund_ID | ID | required | PK |
| Fund_Code | ShortCode | required | Unique within the institution |
| Fund_Name | MediumName | required | |
| Organization_ID | ID | required | → Organization (owning unit) |
| Fund_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'FundType'`. Recommended values: Restricted / Unrestricted / Endowment / Sponsored_Program |

#### Account

Chart-of-accounts entry for general ledger coding.

| Column | Type | Required | Notes |
|---|---|---|---|
| Account_ID | ID | required | PK |
| Account_Code | ShortCode | required | Unique within the institution |
| Account_Name | MediumName | required | |
| Parent_Account_Code | ShortCode | optional | → Account.Account_Code (self-referencing) |
| Account_Type | Status | required | Constrained: Asset / Liability / Equity / Revenue / Expense |

#### FinanceCode

The institutional accounting string that connects an Award to fund and account codes.

| Column | Type | Required | Notes |
|---|---|---|---|
| FinanceCode_ID | ID | required | PK |
| Award_ID | ID | required | → Award |
| Fund_ID | ID | required | → Fund |
| Account_ID | ID | required | → Account |
| Purpose_Value_ID | ID | required | → AllowedValues with `Value_Group = 'FinanceCodePurpose'`. Recommended values: Direct_Costs / Cost_Share / Indirect_Costs / Subcontract |
| Finance_Code_String | ShortName | required | The full FOAP (or equivalent) string as represented in the institutional accounting system |

#### Transaction

An individual financial entry charged to an Award or Subaward.

| Column | Type | Required | Notes |
|---|---|---|---|
| Transaction_ID | ID | required | PK |
| Award_ID | ID | optional | → Award. Exactly one of Award_ID or Subaward_ID is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of Award_ID or Subaward_ID is non-null |
| Budget_ID | ID | optional | → Budget (the budget period the transaction lands in) |
| Fund_ID | ID | optional | → Fund |
| Account_ID | ID | optional | → Account |
| FinanceCode_ID | ID | optional | → FinanceCode |
| Transaction_Date | Date | required | |
| Transaction_Amount | Money | required | Sign convention: positive for charges/encumbrances, negative for reversals/transfers-out |
| Transaction_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'TransactionType'`. Recommended values: Expense / Revenue / Encumbrance / Transfer / Adjustment / Reversal / Cost_Share / Project_Income / Cost_Transfer_In / Cost_Transfer_Out |
| Income_Treatment | Status | conditional | Constrained when present: Offset / Additive. Required when Transaction_Type resolves to project income |
| Activity_Description | LongText | optional | |

#### RateAgreement

The negotiated F&A (indirect cost) rate agreement (NICRA) between an institution and its cognizant federal agency. Each agreement covers a span of time and contains one or more IndirectRate rows (the rate line items). The agreement is the negotiated artifact; the rate is the line.

| Column | Type | Required | Notes |
|---|---|---|---|
| RateAgreement_ID | ID | required | PK |
| Institution_Organization_ID | ID | required | → Organization (the institution the agreement covers) |
| Cognizant_Agency_Organization_ID | ID | required | → Organization (the federal agency that negotiated the agreement, typically DHHS or ONR). Referenced Organization has Capability = 'Sponsor' |
| Agreement_Number | ShortCode | required | The agreement reference number |
| Agreement_Date | Date | required | Date the agreement was executed |
| Effective_Start_Date | Date | required | First date the agreement's rates apply |
| Effective_End_Date | Date | optional | Last date the agreement's rates apply; null for open-ended agreements |
| Agreement_Status | Status | required | Constrained: Active / Expired / Superseded / Provisional |

#### IndirectRate

A single negotiated rate within a RateAgreement (one agreement typically contains several rates: on-campus, off-campus, MTDC, etc.).

| Column | Type | Required | Notes |
|---|---|---|---|
| IndirectRate_ID | ID | required | PK |
| RateAgreement_ID | ID | required | → RateAgreement (the parent agreement) |
| Rate_Type | Status | required | Constrained: On_Campus / Off_Campus / MTDC / TDC / Clinical_Trial / Fringe_Benefits / Facilities / Administrative |
| Base_Type | Status | required | Constrained: MTDC / TDC / Salaries_and_Wages / Direct_Salaries |
| Rate_Percent | Percent | required | |
| Effective_Start_Date | Date | required | When this rate becomes effective (may be a sub-period of the agreement) |
| Effective_End_Date | Date | optional | Null for open-ended current rates |

#### Equipment

A sponsor-purchased or institution-acquired capital asset associated with an Award or Subaward. Tracked through acquisition, in-use, and disposition (sponsor closeout requires title disposition and asset transfer records).

| Column | Type | Required | Notes |
|---|---|---|---|
| Equipment_ID | ID | required | PK |
| Asset_Tag | ShortCode | required | Institution-issued asset tag. Unique within the institution |
| Equipment_Name | MediumName | required | |
| Award_ID | ID | optional | → Award. Exactly one of Award_ID or Subaward_ID is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of Award_ID or Subaward_ID is non-null |
| Acquisition_Date | Date | required | |
| Acquisition_Amount | Money | required | |
| Title_Vesting | Status | required | Constrained: Institution / Sponsor / Vendor / Shared / To_Be_Determined |
| Location_Organization_ID | ID | optional | → Organization (the unit physically housing the equipment) |
| Custodian_Personnel_ID | ID | optional | → Personnel (the responsible custodian) |
| Description | LongText | optional | |
| Equipment_Status | Status | required | Constrained: In_Use / In_Storage / Surplused / Transferred / Disposed / Lost |
| Disposition_Date | Date | conditional | Required when Equipment_Status is Surplused, Transferred, Disposed, or Lost |

#### Payment

Payment records covering scheduled, invoiced, received, and reconciled stages. Each Payment row attaches to an Award or a Subaward.

| Column | Type | Required | Notes |
|---|---|---|---|
| Payment_ID | ID | required | PK |
| Lifecycle_Stage | Status | required | Constrained: Scheduled / Invoiced / Received / Reconciled |
| Parent_Payment_ID | ID | optional | → Payment. Later-stage rows point at the earlier-stage row they descend from |
| Award_ID | ID | optional | → Award. Exactly one of Award_ID or Subaward_ID is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of Award_ID or Subaward_ID is non-null |
| Budget_ID | ID | optional | → Budget. Optional period reference |
| Scheduled_Date | Date | conditional | Required when Lifecycle_Stage = 'Scheduled' |
| Scheduled_Amount | Money | conditional | Required when Lifecycle_Stage = 'Scheduled' |
| Invoice_Number | ShortCode | conditional | Required when Lifecycle_Stage = 'Invoiced' or later; unique within the parent agreement |
| Submission_Date | Date | conditional | Required when Lifecycle_Stage = 'Invoiced' |
| Actual_Date | Date | conditional | Required when Lifecycle_Stage = 'Received' or later |
| Actual_Amount | Money | conditional | Required when Lifecycle_Stage = 'Received' or later |
| Payment_Status | Status | required | See Status taxonomy |

#### CostShare

Cost-sharing commitments across the lifecycle (proposed → committed → met / waived). Each CostShare row attaches to a Proposal at the Proposed stage and to an Award or Subaward at later stages.

| Column | Type | Required | Notes |
|---|---|---|---|
| CostShare_ID | ID | required | PK |
| Lifecycle_Stage | Status | required | Constrained: Proposed / Committed / Met / Waived |
| Parent_CostShare_ID | ID | optional | → CostShare. Later-stage rows point back to earlier ones |
| Proposal_ID | ID | conditional | → Proposal. Required when Lifecycle_Stage = 'Proposed' |
| Award_ID | ID | conditional | → Award. Exactly one of Award_ID or Subaward_ID is non-null when Lifecycle_Stage ≥ Committed |
| Subaward_ID | ID | conditional | → Subaward. Exactly one of Award_ID or Subaward_ID is non-null when Lifecycle_Stage ≥ Committed |
| Commitment_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'CostShareCommitmentType'`. Recommended values: Cash / In_Kind / Third_Party / Waived_IDC / Effort_Only |
| Amount_Committed | Money | required | |
| Amount_Actual | Money | conditional | Required when Lifecycle_Stage = 'Met' |

---

### Compliance

#### ComplianceRequirement

A regulatory approval required for research: IRB, IACUC, IBC, radiation safety, export control, etc. ComplianceRequirement is a standalone entity with its own lifecycle (submission, approval, expiration, renewal), independent of any particular Award that may use it. The Awards a requirement covers are recorded in the `ComplianceCoverage` junction; the same requirement may cover multiple Awards (one PI's IRB protocol supporting three related grants). Additional staff are recorded as ComplianceRequirementStaff rows.

The table is intentionally generic across regulatory regimes. AllowedValues-backed Review_Pathway and Classification_Level carry regime-specific vocabularies (per-Requirement_Type values listed in the column notes below).

| Column | Type | Required | Notes |
|---|---|---|---|
| ComplianceRequirement_ID | ID | required | PK |
| Parent_ComplianceRequirement_ID | ID | optional | → ComplianceRequirement (self-referencing). A renewal or amendment references the predecessor; null for an initial requirement |
| Requirement_Type | Status | required | Constrained: IRB / IACUC / IBC / COI / Radiation / Export_Control / Other. Determines which Reviewing Authority pattern applies (committee vs Empowered Official vs other) |
| Compliance_Number | ShortCode | optional | The authority-issued identifier (IRB protocol number, IACUC protocol number, Export Control determination number, radiation registration number, etc.). Unique within (`Issuing_Authority_Organization_ID`, `Requirement_Type`) when not null. Scope of uniqueness is the issuing authority, not the institution: two different IRBs at the same institution might issue the same protocol number |
| Issuing_Authority_Organization_ID | ID | optional | → Organization. The body that issues the Compliance_Number. May be the same as `Reviewing_Authority_Organization_ID` (the IRB issues its own protocol numbers) or different (DOE issues a radiation materials license while the internal Radiation Safety Committee reviews specific uses) |
| Reviewing_Authority_Organization_ID | ID | optional | → Organization. The body that reviews and approves this requirement. May be a Committee (IRB, IACUC, IBC), an Export Control Office, a Radiation Safety Office, etc. Referenced Organization carries an OrganizationCapability appropriate to the Requirement_Type (Committee for IRB/IACUC/IBC; Program_Office or similar for export control and radiation safety) |
| Review_Pathway_Value_ID | ID | optional | → AllowedValues with `Value_Group = 'ComplianceReviewPathway'`. The pathway/category that classifies how the requirement was determined or processed. Recommended values vary by Requirement_Type. For IRB: Exempt / Expedited / Full_Board / Not_Human_Subjects / Administrative. For Export Control: Fundamental_Research_Exclusion / Determination_Only / TCP_Required / License_Required. For COI: Annual / Event_Based. For IBC: Exempt / BL1 / BL2 / BL3 / BL4 (containment level functions as the pathway). Each Requirement_Type's reviewer brings its own vocabulary |
| Submitted_Date | Date | optional | |
| Approved_Date | Date | conditional | Required when Requirement_Status = 'Approved' |
| Expiration_Date | Date | optional | The date the approval expires. Null when the requirement is non-expiring (e.g., an Export Control Fundamental_Research determination remains valid until the underlying facts change). Null Expiration_Date with `Is_Active = true` means "in force indefinitely" |
| Requirement_Status | Status | required | See Status taxonomy |
| Compliance_Classification_Level_Value_ID | ID | optional | → AllowedValues with `Value_Group = 'ComplianceClassificationLevel'`. Recommended values vary by Requirement_Type. For IRB (Common Rule): Minimal / More_Than_Minimal / High. For Export Control: Fundamental_Research / EAR_Controlled / ITAR_Controlled / OFAC_Restricted. For IBC: BL1 / BL2 / BL3 / BL4 (overloads with Review_Pathway when containment is the principal classifier). For Radiation: Sealed_Source / Unsealed_Source / Open_Beam_Device. Distinct from the Low/Medium/High Risk_Level used on funding entities |
| Primary_Investigator_Personnel_ID | ID | required | → Personnel. The responsible person on the requirement (study PI for IRB; principal investigator for IACUC; responsible PI for Export Control determinations) |

#### ComplianceCoverage

The M:N relationship between a ComplianceRequirement and the Awards (or Subawards) it covers. A single requirement may cover multiple Awards (one IRB protocol supporting three related grants from different sponsors, one export-control determination spanning a center's awards). A single Award may require multiple requirements (an R01 needing both IRB and IACUC, plus an Export_Control determination for a foreign collaborator). Each Award carries its own compliance documentation; an Award is "IRB-covered" by virtue of having one or more ComplianceCoverage rows linking it to an active IRB ComplianceRequirement.

| Column | Type | Required | Notes |
|---|---|---|---|
| ComplianceCoverage_ID | ID | required | PK |
| ComplianceRequirement_ID | ID | required | → ComplianceRequirement |
| Award_ID | ID | optional | → Award. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of `Award_ID` or `Subaward_ID` is non-null |
| Coverage_Start_Date | Date | optional | When the protocol began covering this Award (or Subaward) |
| Coverage_End_Date | Date | optional | When the protocol stopped covering this Award (or Subaward); null while still in effect |

A given (ComplianceRequirement_ID, Award_ID) pair (or (ComplianceRequirement_ID, Subaward_ID) pair) appears at most once with a null Coverage_End_Date.

#### ComplianceRequirementStaff

Personnel listed on a specific ComplianceRequirement (IRB study staff, IACUC personnel, IBC investigators, cleared personnel under a Technology Control Plan). Scoped to the requirement, not to the Award: the same requirement may cover several Awards, and different requirements on one Award have different staff rosters.

| Column | Type | Required | Notes |
|---|---|---|---|
| ComplianceRequirementStaff_ID | ID | required | PK |
| ComplianceRequirement_ID | ID | required | → ComplianceRequirement |
| Personnel_ID | ID | required | → Personnel |
| Staff_Role | Status | required | Constrained: Co_Investigator / Study_Coordinator / Research_Staff / Consenting_Personnel / Lab_Manager / Veterinary_Staff / Biosafety_Officer / Radiation_Worker / TCP_Cleared_Personnel / Other |
| Training_Completion_Date | Date | optional | The date required compliance training (CITI, etc.) was completed |
| Start_Date | Date | required | |
| End_Date | Date | optional | |

#### ConflictOfInterest

Personal disclosures covering conflicts of interest, conflicts of commitment, and foreign engagements (NSPM-33). The Relationship_Type discriminates the disclosure category.

| Column | Type | Required | Notes |
|---|---|---|---|
| ConflictOfInterest_ID | ID | required | PK |
| Personnel_ID | ID | required | → Personnel |
| Award_ID | ID | optional | → Award. Required for project-specific disclosures; null for annual general disclosures |
| Relationship_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'COIRelationshipType'`. Recommended values: Financial / Consulting / Employment / Equity / Royalty / Board_Membership / Foreign_Affiliation / Foreign_Appointment / Foreign_Talent_Program / Foreign_Funding |
| Entity_Name | MediumName | conditional | The entity the personnel has the relationship with, as free text. Required when Entity_Organization_ID is null; optional when an Organization FK is set (the Organization.Organization_Name is the canonical source) |
| Entity_Organization_ID | ID | optional | → Organization. Set when the entity is tracked as an Organization in the model; null when it is an outside party not otherwise tracked |
| Entity_Country_Code | ShortCode | optional | ISO 3166-1 alpha-3 country code. Required for foreign-engagement relationship types |
| Financial_Interest_Amount | Money | optional | |
| Disclosure_Date | Date | required | |
| Disclosure_Period_Start_Date | Date | optional | The period the disclosure covers (annual disclosures span the prior year) |
| Disclosure_Period_End_Date | Date | optional | |
| Review_Outcome | Status | required | Constrained: Under_Review / No_Conflict / Manageable_Conflict / Unmanageable_Conflict / Management_Plan_Required / Cleared |
| Management_Plan_Description | LongText | conditional | Required when Review_Outcome is Manageable_Conflict or Management_Plan_Required |

#### InventionDisclosure

Disclosure of an invention, copyrightable work, or software for institutional tech-transfer review. Captures the disclosure itself; downstream tech-transfer operations (patent filing, prosecution, licensing, royalty distribution) live in a dedicated tech-transfer system and are out of scope for this model.

| Column | Type | Required | Notes |
|---|---|---|---|
| InventionDisclosure_ID | ID | required | PK |
| Disclosure_Number | ShortCode | required | Institution-issued. Unique within the institution |
| Disclosure_Title | MediumName | required | |
| Award_ID | ID | optional | → Award. The funding source supporting the invention, when known |
| Subaward_ID | ID | optional | → Subaward. When the inventor is on the subrecipient side |
| Disclosure_Date | Date | required | |
| Disclosure_Type | Status | required | Constrained: Patent / Copyright / Software / Tangible_Material / Plant_Variety / Other |
| Description | LongText | required | Brief description of the invention |
| Government_Funding_Acknowledged | Boolean | required | True when federal funding contributed (triggers Bayh-Dole reporting) |
| Disclosure_Status | Status | required | Constrained: Submitted / Under_Review / Elected / Waived / Released_to_Inventor / Closed |

Inventors are recorded as InventionDisclosureInventor rows. The junction lets a single project carry multiple disclosures with different inventor rosters.

#### InventionDisclosureInventor

Inventors named on a specific InventionDisclosure. Junction table because a project may carry multiple disclosures with different inventor groups, and an inventor may appear on multiple disclosures.

| Column | Type | Required | Notes |
|---|---|---|---|
| InventionDisclosureInventor_ID | ID | required | PK |
| InventionDisclosure_ID | ID | required | → InventionDisclosure |
| Personnel_ID | ID | required | → Personnel |
| Inventor_Order | Count | required | Display order on the disclosure (1 = first-named inventor) |
| Inventor_Share_Percent | Percent | optional | The inventor's share of any future revenue distribution. When populated for one row, must sum to 100 across all rows for the disclosure |

#### OtherSupport

A Personnel record's external research support (current, pending, in-kind). The row captures the *fact* of the outside support: who has it, where, what, when, how much. The same OtherSupport row is disclosed across many Proposals and Awards over time; each disclosure event is recorded in `OtherSupportDisclosure`. Required by NIH and other sponsors for biosketch / Other Support pages and for research-security reporting.

| Column | Type | Required | Notes |
|---|---|---|---|
| OtherSupport_ID | ID | required | PK |
| Personnel_ID | ID | required | → Personnel |
| External_Sponsor_Name | MediumName | conditional | The funding source for the disclosed support, as free text. Required when External_Sponsor_Organization_ID is null; optional when an Organization FK is set (the Organization.Organization_Name is the canonical source) |
| External_Sponsor_Organization_ID | ID | optional | → Organization. Set when the external sponsor is tracked as an Organization in the model |
| External_Project_Title | MediumName | required | The title of the externally-funded project as known at the external sponsor (the *other* institution's vocabulary) |
| Support_Type | Status | required | Constrained: Current / Pending / In_Kind |
| Annual_Effort_Months_Calendar | Percent | optional | Months per year of committed effort, expressed on the calendar (12-month) basis |
| Total_Award_Amount | Money | optional | The total funded amount of the disclosed support |
| Effective_Start_Date | Date | required | |
| Effective_End_Date | Date | optional | Null when the support is open-ended |

#### OtherSupportDisclosure

A single disclosure event of an OtherSupport row. The same outside appointment is typically disclosed many times across a researcher's career: at each proposal submission, at each annual report, at each JIT request, at each research-security reaffirmation. Each disclosure is its own row.

| Column | Type | Required | Notes |
|---|---|---|---|
| OtherSupportDisclosure_ID | ID | required | PK |
| OtherSupport_ID | ID | required | → OtherSupport |
| Disclosure_Date | Date | required | When this specific disclosure event occurred |
| Disclosure_Type | Status | required | Constrained: Initial / Annual / JIT / Progress_Report / Research_Security_Reaffirmation / Other |
| Triggering_Proposal_ID | ID | optional | → Proposal. The proposal whose submission triggered this disclosure event (null when the disclosure is not proposal-triggered) |
| Triggering_Award_ID | ID | optional | → Award. The award whose reporting cycle triggered this disclosure event (null when the disclosure is not award-triggered) |
| Disclosed_To_Sponsor_Organization_ID | ID | optional | → Organization. The sponsor that received this disclosure |
| Notes | LongText | optional | |

---

### Reference

#### AllowedValues

Institution-specific controlled vocabularies. The `Value_Group` column names a family; tables that reference institution-defined enums point at rows in this table via `*_Value_ID` foreign keys with an implicit filter on the appropriate `Value_Group`.

| Column | Type | Required | Notes |
|---|---|---|---|
| AllowedValue_ID | ID | required | PK |
| Value_Group | ShortCode | required | The lookup family name. Canonical groups listed below. Institutions may add new groups; cross-institution interop depends on using shared `Value_Group` names |
| Value_Code | ShortCode | required | Unique within Value_Group. Stable code used in queries |
| Value_Label | MediumName | required | Human-readable label |
| Value_Description | LongText | optional | |
| Canonical_Value_Code | ShortCode | optional | The canonical code (across institutions) that this local code maps to. Null when the local code has no canonical equivalent. Used by cross-institution queries to normalize values |

**Canonical Value_Group names:** ContactType, OrganizationCapability, AwardRole, FundType, TransactionType, ModificationEventType, DocumentType, FinanceCodePurpose, COIRelationshipType, IndirectRateType, CostShareCommitmentType, RestrictionType, DeadlineType, ProposalType, FundingMechanism, ComplianceReviewPathway, ComplianceClassificationLevel.

#### BudgetCategory

Standardized budget line item categories (SF-424 R&R standard).

| Column | Type | Required | Notes |
|---|---|---|---|
| BudgetCategory_ID | ID | required | PK |
| Category_Code | ShortCode | required | Unique. Examples: SR_PERSONNEL, OTH_PERSONNEL, EQUIPMENT, TRAVEL, PARTICIPANT_SUPPORT, OTHER_DIRECT |
| Category_Name | MediumName | required | |
| Category_Order | Count | required | Display order |
| Is_Direct_Cost | Boolean | required | True for direct-cost categories; false for indirect-cost categories |

---

### Attachments

All seven Attachment tables share the polymorphic columns `Related_Entity_Type` and `Related_Entity_ID`. Enforcement rules are described in *Polymorphic attachment enforcement* above. Each table's allowed `Related_Entity_Type` values are listed in its Notes column.

**Deadline vs Action.** Both Deadline and Action carry a due date, a responsible person, and a status. They differ in what they primarily describe:

- **Deadline** is a calendar entry: a date by which an obligation comes due. The Deadline tells you *when*. Use it for miscellaneous future-dated obligations that do not need worklist tracking (annual COI disclosure due, IRB renewal due, F&A rate expiration).
- **Action** is a worklist item: a discrete piece of work that needs to be done. The Action tells you *what* and *who*. Use it for things you assign and track to completion (checklist items, service requests, modification approvals).
- Many real workflows have both: a sponsor report has a structured **Report** row (the report itself), an associated Deadline (the calendar entry), and an Action (the worklist item to draft and submit it). The three are independent attachments on the same parent.

#### Document

Files associated with any entity.

| Column | Type | Required | Notes |
|---|---|---|---|
| Document_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained: Award / Subaward / Proposal / ProposalApproval / PreAwardAuthorization / Personnel / PersonnelCredential / ComplianceRequirement / InventionDisclosure / SubmissionPackage / Modification / Action / Restriction / Budget / Negotiation / Terms / Report / Closeout / Equipment |
| Related_Entity_ID | ID | required | The PK value in the table named by Related_Entity_Type |
| Document_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'DocumentType'`. Recommended values: NOA / Biosketch / DMP / Budget_Justification / Other_Support / Public_Access_Plan / LOI / Sponsor_Agreement / Subaward_Agreement / Modification_Notice / Approved_Items_Schedule / Closeout_Document / Compliance_Approval_Letter / Restriction_Authority_Document / Training_Certificate |
| File_Name | MediumName | required | |
| File_Path | URL | required | Path or URI to the file in object storage / content management |
| File_Hash | Hash | required | SHA-256 of the file content |
| File_Size_Bytes | LargeCount | required | |
| Version_Number | Count | required | Default 1 |
| Uploaded_By_Personnel_ID | ID | required | → Personnel |
| Uploaded_Timestamp | Timestamp | required | |

#### Communication

Inbound or outbound correspondence between the institution and an external party (sponsor program officer, subrecipient, committee, regulator). Distinct from Document (which is a file) and from ActivityLog (which is a system audit event). A Communication may have one or more Document rows attached when the correspondence includes file attachments.

| Column | Type | Required | Notes |
|---|---|---|---|
| Communication_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained: Award / Subaward / Proposal / RFA / Modification / Negotiation / Terms / ComplianceRequirement / Personnel / Closeout / Report |
| Related_Entity_ID | ID | required | |
| Communication_Type | Status | required | Constrained: Email / Phone_Call / Meeting / Letter / Portal_Message / Other |
| Direction | Status | required | Constrained: Inbound / Outbound |
| Communication_Date | Timestamp | required | The moment the communication occurred (or the email's sent-at timestamp) |
| Subject | MediumName | optional | The subject line for emails, the topic for meetings |
| Body_Text | LongText | optional | The full text of the correspondence; null when the body lives only in an attached Document |
| Internal_Personnel_ID | ID | optional | → Personnel. The institution-side participant (sender for outbound, recipient for inbound) |
| External_Personnel_ID | ID | optional | → Personnel. The external participant when tracked in Personnel; null when the external party is not maintained as a Personnel record |
| External_Party_Name | MediumName | optional | Free-text name of the external party when no Personnel record exists |
| External_Organization_ID | ID | optional | → Organization. The external party's organization |

#### Restriction

Operational constraints attached to an entity (CUI, CMMC, export control, publication holds, foreign-personnel limits).

| Column | Type | Required | Notes |
|---|---|---|---|
| Restriction_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained: Award / Subaward / Proposal / Personnel / Equipment / InventionDisclosure |
| Related_Entity_ID | ID | required | |
| Restriction_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'RestrictionType'`. Recommended values: CUI / CMMC_Level_1 / CMMC_Level_2 / CMMC_Level_3 / EAR / ITAR / Publication_Hold / Foreign_Personnel_Limit / Site_Restriction |
| Restriction_Level | ShortCode | optional | Free-form qualifier (e.g., a specific ITAR category) |
| Effective_Start_Date | Date | required | |
| Effective_End_Date | Date | optional | Null for restrictions in effect indefinitely |
| Authority_Document_Reference | URL | optional | The regulation or contract clause this restriction comes from |
| Certified_By_Personnel_ID | ID | optional | → Personnel (the OSP or compliance officer who certified the restriction) |
| Restriction_Status | Status | required | See Status taxonomy |

**Active restriction query rule:** A restriction is considered currently active when Restriction_Status = 'Active' and Effective_Start_Date is on or before the query date and (Effective_End_Date is null or on or after the query date).

#### Deadline

Future-dated obligations attached to an entity.

| Column | Type | Required | Notes |
|---|---|---|---|
| Deadline_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained: Award / Subaward / Proposal / ProposalApproval / ComplianceRequirement / Modification / RFA / Closeout / Report |
| Related_Entity_ID | ID | required | |
| Deadline_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'DeadlineType'` |
| Due_Date | Date | required | |
| Reminder_Lead_Days | Count | optional | Default 14; the number of days before Due_Date that a reminder fires |
| Responsible_Personnel_ID | ID | optional | → Personnel |
| Deadline_Status | Status | required | See Status taxonomy |
| Description | URL | optional | |

#### Classification

Subject tags and research-area codes attached to entities.

| Column | Type | Required | Notes |
|---|---|---|---|
| Classification_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained: Proposal / Award / Subaward / ComplianceRequirement |
| Related_Entity_ID | ID | required | |
| Scheme | Status | required | Constrained: NSF_Science_Code / NIH_MeSH / Institution_Research_Area / Free_Tag |
| Value_Code | ShortName | required | The code or term within the scheme (e.g., NSF science code 40101) |
| Value_Label | MediumName | optional | Human-readable label |
| Sort_Order | Count | optional | When the entity carries multiple classifications, the order to display them |

#### Action

Work items attached to entities: deliverables, checklist items, service requests, modification approvals, compliance renewals, training requirements.

| Column | Type | Required | Notes |
|---|---|---|---|
| Action_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained: Award / Subaward / Proposal / ProposalApproval / PreAwardAuthorization / Personnel / ComplianceRequirement / Modification / Negotiation / Terms / Closeout / Report / Equipment |
| Related_Entity_ID | ID | required | |
| Action_Type | Status | required | Constrained: Deliverable / Checklist_Item / Service_Request / Modification_Approval / Compliance_Renewal / Training_Required / Training_Completion / Subrecipient_Risk_Review / Foreign_National_Screening / Cost_Transfer_Approval / JIT_Request / Other |
| Title | MediumName | required | |
| Description | LongText | optional | |
| Assignee_Personnel_ID | ID | optional | → Personnel |
| Requestor_Personnel_ID | ID | optional | → Personnel |
| Due_Date | Date | optional | |
| Action_Status | Status | required | See Status taxonomy |
| Priority | Status | required | Constrained: Low / Medium / High / Critical |
| Completed_Date | Date | conditional | Required when Action_Status = 'Completed' |
| Origin | Status | required | Constrained: Sponsor_Required / Internal / System_Generated / Manual |
| Outcome_Description | LongText | optional | Free-text outcome when the Action records a structured workflow with a result (subrecipient risk review outcome, foreign-national screening decision, modification approval rationale, training completion notes). Used together with `Linked_Document_ID` when the formal outcome lives in an attached document |
| Linked_Document_ID | ID | optional | → Document (e.g., the deliverable file, training certificate when Completed, the formal subrecipient risk review report) |

#### ActivityLog

Typed audit events on entities.

| Column | Type | Required | Notes |
|---|---|---|---|
| ActivityLog_ID | ID | required | PK |
| Related_Entity_Type | Status | required | Constrained to any UDM table name except ActivityLog itself. Enumerated values: Personnel / PersonnelCredential / Organization / OrganizationCapability / ContactDetails / CommitteeMembership / ExternalPartyContact / RFA / RFARequirement / Proposal / ProposalApproval / PreAwardAuthorization / Award / Modification / Subaward / Negotiation / Terms / Report / Closeout / SubmissionProfile / SubmissionPackage / SubmissionAttempt / AwardRole / Effort / Budget / Fund / Account / FinanceCode / Transaction / RateAgreement / IndirectRate / Payment / CostShare / Equipment / ComplianceRequirement / ComplianceCoverage / ComplianceRequirementStaff / ConflictOfInterest / InventionDisclosure / InventionDisclosureInventor / OtherSupport / OtherSupportDisclosure / AllowedValues / BudgetCategory / Document / Communication / Restriction / Deadline / Classification / Action |
| Related_Entity_ID | ID | required | |
| Activity_Type | Status | required | Constrained: data_change / submission_status_change / operator_action / field_change / status_transition. (Agency / sponsor correspondence lives in Communication, not here.) |
| Activity_Timestamp | Timestamp | required | |
| Actor_Personnel_ID | ID | optional | → Personnel. Null for system-initiated events |
| Old_Value | LongText | optional | For Activity_Type = 'field_change' |
| New_Value | LongText | optional | For Activity_Type = 'field_change' |
| Description | LongText | optional | Free-text description; for field changes, includes the field name |

ActivityLog does not log to itself; ActivityLog rows do not appear in `Related_Entity_Type`.

---

## Optional extensions

Areas the UDM deliberately does not model in v2. Institutions that need these capabilities add local extension tables and reference them from the canonical entities listed below. These are not gaps in the model; they are scope decisions.

**Detailed Export Control workflow.** ComplianceRequirement.Requirement_Type = 'Export_Control' captures the determination as a regulated approval, and Action.Action_Type includes Foreign_National_Screening. The model does not include dedicated entities for Technology Control Plans (the TCP document lives as a Document attachment on the ComplianceRequirement), per-shipment determinations, ECCN / commodity classification details, BIS or DDTC license records, or visit-by-visit foreign national clearances. Institutions running active export control programs layer those records on top of ComplianceRequirement.

**Publications and research outputs.** Publications, presentations, datasets, software releases, and other research outputs beyond inventions are not modeled. InventionDisclosure captures the IP-flagged outputs that go through tech transfer; the broader output portfolio (NSPM-33 reporting, public access mandates, RPPR publication lists, institutional bibliographic systems) is left to specialized publication systems (Symplectic Elements, ORCID-integrated CRIS systems, institutional repositories). Cross-references to those systems live in Document attachments or in local extensions keyed to Personnel.

**Detailed tech transfer pipeline.** Beyond the initial InventionDisclosure record, the full tech transfer lifecycle (patent filing, prosecution, prior-art search records, licensing negotiations, license agreements, royalty distribution, spinout / equity tracking) lives in specialized tech transfer systems (Wellspring, Inteum, Sophia). UDM stops at the disclosure boundary.

**HR / payroll data.** Academic rank, institutional base salary (IBS), appointment calendar type, joint appointments, benefits, tax withholdings, leave balances, performance reviews, supervisory chains. All of this lives in HRIS (Workday, Banner HR, PeopleSoft HR) and is not duplicated in UDM. RA queries needing rank, IBS, or calendar type pull from HRIS via integration. UDM does not include a PersonnelAppointment entity. For non-employee Personnel where HRIS does not apply (external Co-Is, visiting scholars, community-partner contacts), institutional credentials can be captured in `PersonnelCredential`.

**Detailed accounting / general ledger.** Fund, Account, FinanceCode, and Transaction connect UDM to the institutional ledger. Full GL detail (chart of accounts hierarchies beyond Account, automated journal entry rules, period-close workflows, multi-entity consolidation) lives in the institutional ERP and is not duplicated in UDM.

**Cost transfer workflow.** The financial movement is a Transaction with `Transaction_Type = 'Cost_Transfer_In'` or `'Cost_Transfer_Out'`. The institutional approval workflow (justification text, late-transfer flag, approver routing, signed forms) is captured as an Action with `Action_Type = 'Cost_Transfer_Approval'`, `Outcome_Description` carrying the justification, and `Linked_Document_ID` pointing at the signed form. UDM does not include a dedicated CostTransfer entity; institutions running heavy cost-transfer operations may add a local extension.

**Data management plan compliance.** The DMP document lives as a Document attachment with `Document_Type = 'DMP'`. Ongoing public-access / data-sharing compliance status is tracked as an Action with `Action_Type` indicating the compliance check. Repository, license, retention details are not modeled as a first-class DataManagementPlan entity; institutions with active public-access compliance programs may add a local extension.

**IT inventory / application catalog.** Catalog of operational systems, portals, and tools used by the RA office (Cayuse, Kuali Research, OnCore, etc.). This data lives in the IT inventory or service-management system, not in UDM. UDM does not include an ApplicationSystem entity.

**Audit and findings tracking.** Sponsor audits, Uniform Guidance single audits, DCAA audits, internal audits, and IG audits carry fieldwork lifecycles, findings, and resolution timing. Institutions running active audit functions add a local extension entity (Audit with notification date, fieldwork dates, draft / final report dates, lead liaison Personnel, findings summary) plus per-finding rows for response tracking. UDM does not include an Audit entity in the canonical model.

**Field-level audit / history tables.** The UDM is designed to run on versioned storage (Dolt, Trino on Apache Iceberg, temporal tables in Postgres / SQL Server, or similar) where row history is queryable at the storage layer. Time-travel queries against past commits or snapshots reconstruct any field's prior value without application-level audit infrastructure. Institutions deploying UDM on storage that does not support row versioning add their own field-level audit tables (one history row per change, with the old value, new value, change timestamp, and changing actor) and link them by record ID to the canonical UDM tables. UDM does not include these audit tables in the canonical model.

**Clinical trial management.** ClinicalTrials.gov / ISRCTN registration records, NCT numbers, IND / IDE numbers, DSMB structures, trial phase, enrollment counts, per-participant case report forms, adverse event reports, protocol deviations, drug accountability logs, monitoring visit reports, eCRF builds. The full clinical trial management workflow lives in dedicated CTMS systems (OnCore, Velos, REDCap, Veeva). Institutions that need to surface a few headline identifiers (the NCT number for sponsor reporting) typically attach the CT.gov registration as a Document on the Award. UDM does not include a ClinicalTrialRegistration entity.

**Human subjects participant payments.** Per-participant compensation records (anonymized participant IDs, payment dates and amounts, IRB-approved payment structures, cumulative-by-participant tax-reporting thresholds) live in study-team-managed systems (REDCap, OnCore, dedicated participant payment systems). The institutional ledger sees only the bulk drawdown as a Transaction. UDM does not include a ParticipantPayment entity; institutions that centrally track participant payments add a local extension that links to Transaction and ComplianceRequirement.

**Multi-currency awards and subawards.** All Money-typed columns in v2 carry a single institutional currency convention; there is no per-row currency code. Institutions with sponsor activity in non-base currencies (foreign sponsors paying in Euros, international subrecipients invoicing in local currency) add a local extension to track per-row currency, exchange rate at posting, and reporting-currency conversion. UDM does not include currency-code columns in the canonical model.

---

## Summary

- 51 tables across 7 domains.
- 7 universal patterns: identifier convention, hierarchy, role-named foreign keys, polymorphic attachment, two-FK exclusive-or attachment, Lifecycle_Stage discriminator, AllowedValues extensibility.
- Audit and provenance columns (Created_At, Updated_At, Created_By_Personnel_ID, Updated_By_Personnel_ID, Source_System, Source_Record_ID, Is_Active) are universal across every table.
- Hub entities: Personnel, Organization, Proposal, Award, AllowedValues.
- Lifecycle_Stage tables: Budget, Effort, CostShare, Payment. Lifecycle_Stage is authoritative for these tables' state; once a row has a later-stage descendant, its primary fields are immutable.
- Polymorphic Attachment tables: Document, Communication, Restriction, Deadline, Classification, Action, ActivityLog. These generalize the everyday "attach a document to an award" idea to all the records that accumulate around an entity. Deadline tracks *when* an obligation is due; Action tracks *what* work to do.
- Subaward spans pre-award (Proposal_ID, Subaward_Status='Proposed') and post-award (Prime_Award_ID, Subaward_Status≥Pending) on a single row identity. Subaward is a first-class parent for Terms, Budget, Payment, Modification, Transaction, CostShare, Equipment, Report, Closeout, and all Attachment tables via the two-FK exclusive-or attachment pattern. Subaward carries Administering_Organization_ID and Parent_Subaward_ID to match Award's structure.
- Award.Parent_Award_ID groups incremental segments under one award identity; Award.Previous_Award_ID points at the predecessor on a competing renewal (parallel to Proposal.Previous_Proposal_ID and Subaward.Previous_Subaward_ID). The discriminator between Modification, Parent_Award_ID, and Previous_Award_ID is documented in *Semantic conventions*.
- Organization_Type carries structural classification (Department / College / School / Institute / Center / External). Functional roles (Sponsor, Subrecipient, Vendor, Committee, Prime_Sponsor, Program_Office, Pass_Through_Entity) are recorded as OrganizationCapability rows so a single Organization can play multiple roles across contexts.
- Personnel-to-Organization relationships beyond home affiliation are explicit: CommitteeMembership (Personnel on a committee Organization) and ExternalPartyContact (Personnel at any external Organization: sponsor, subrecipient, vendor, program office) keep AwardRole focused on the award-side staffing roles.
- AwardRole is limited to award-side staffing (PI / Co_PI / Co_I / Multi_PI / Coordinator / Key_Personnel / Cohort_Participant / Coach / Mentor / Trainee). Protocol staff live in ComplianceRequirementStaff. Inventors live in InventionDisclosureInventor. Sponsor-side and other external roles live in ExternalPartyContact. Trainee appointment metadata (slot, eligibility, payback obligations) is in Optional Extensions.
- Compliance covers regulatory requirements across regimes (ComplianceRequirement is intentionally generic across IRB / IACUC / IBC / COI / Radiation / Export_Control / Other, with renewal chaining via Parent_ComplianceRequirement_ID, AllowedValues-backed Review_Pathway and Classification_Level vocabularies that vary by Requirement_Type, separate Issuing_Authority and Reviewing_Authority Organization references, and nullable Expiration_Date for non-expiring determinations). ComplianceCoverage is the M:N junction between requirements and Awards (or Subawards); ComplianceRequirementStaff is the protocol-scoped staff roster. Personal disclosures live in ConflictOfInterest (extended for foreign-engagement disclosures). Invention disclosures live in InventionDisclosure with InventionDisclosureInventor as the M:N junction. External research support is split into OtherSupport (the *fact* of outside support, person-anchored) and OtherSupportDisclosure (the *event* of disclosing that fact, with optional triggering Proposal or Award).
- Award is the fundamental unit of sponsored work. Every Award originates from a Proposal (`Award.Proposal_ID` is required). The PI on an Award is captured in AwardRole (`Role_Value_ID` resolving to PI), not denormalized onto Award; the same applies to Subaward.
- Grouping of related Awards under one longitudinal identity (a multi-year research line, a center program, a cohort training sequence, alternating-lead joint ventures) is supported by two independent mechanisms on Proposal plus a pre-fill on Award: `Proposal.Originating_Proposal_ID` (derived root of the `Previous_Proposal_ID` chain, auto-updates with lineage edits), `Proposal.Group_ID` (user-maintained label, stable against lineage edits), and `Award.Group_ID` (pre-filled from the originating Proposal's `Group_ID` at Award insert; may be overridden afterward). The two Proposal mechanisms are independent: the disagreement between lineage and Group_ID is informative (it signals a deliberate fork or merge by the institution).
- Funding Cycle includes structured reporting (Report: per-period sponsor deliverables with submission and acceptance tracking), closeout (Closeout: the multi-subworkflow closeout state object for an Award or Subaward), pre-award authorization (PreAwardAuthorization: the institutional at-risk spending decision before an Award is executed), and proposal routing (ProposalApproval: the institutional sign-off chain on a Proposal). Award and Proposal carry a Mechanism_Value_ID referencing the canonical FundingMechanism vocabulary (R01, R21, P01, T32, Cooperative_Agreement, Contract_BAA, etc.).
- The Money domain includes RateAgreement (the NICRA) that owns its rate line items (IndirectRate), and Equipment (capital asset attached XOR-style to Award or Subaward for closeout title-disposition tracking).
- Universal status taxonomies enumerated in *Status taxonomy reference*; institution-specific enums extend via AllowedValues with cross-institution normalization through Canonical_Value_Code.
- The specification is database-engine agnostic; constraints are stated abstractly and *Implementation guidance* documents the rules that require enforcement mechanisms beyond simple column declarations.
