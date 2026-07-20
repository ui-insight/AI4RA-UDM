# UDM v2 Architecture

A ground-up design document for the next iteration of the Unified Data Model. Captures principles, structural decisions, and the consolidation moves that keep the schema lean while expanding what it can express.

The intent: a tight, careful specification rather than a weedy garden of accumulated tables. Every entity earns its place, every relationship has a clear shape, and the patterns are few enough to be memorized.

---

## 1. Design principles

These rules govern every decision below. They are the lens for resolving "should this be a new table?"

### 1.1 The morphology question

> If a designer started from scratch with this schema in front of them, would they represent two adjacent tables as one with a discriminator, or as two?

Applied to every pair of tables, this question collapses lookalikes that exist today only because they evolved separately. ProposalBudget and AwardBudget are the same shape. Committee and Organization are the same shape. Subaward and Award are the same shape (with opposite direction). Naming what's structurally one thing once, then disambiguating by role or type, is the single largest lever for keeping the model lean.

### 1.2 Name a thing once; disambiguate by role or type

Where multiple concepts share a morphology, use one table with a discriminator (`*_Type` or `Role_Value_ID`) and role-named foreign keys to express the differences. The existing Organization table is the model: one entity with `Organization_Type` plus role-named FKs (`Sponsor_Organization_ID`, `Submitting_Organization_ID`, `Subrecipient_Organization_ID`). This pattern extends to Committee, to outbound funded agreements, and elsewhere.

### 1.3 Polymorphic spines over per-concept tables

Concepts that *attach to* other entities (files, restrictions, deadlines, classifications, work items) should live in a small number of polymorphic tables that ride the existing `Related_Entity_Type` + `Related_Entity_ID` pattern. The alternative — a new top-level table per concept — is the path to a 1,200-table schema.

Two spine families exist:
- **Annotation spine** — things attached to entities (Document, Restriction, Deadline, Classification).
- **Action spine** — work to be done on entities (Action).

A third pattern, the **Lifecycle_Stage discriminator**, runs through the financial and effort tables: Budget, Effort, CostShare, and Payment all use it to express the same morphology at different lifecycle stages (Proposed / Approved / Charged / Actual / etc.). This is not a spine, it is a shape applied to specific tables.

### 1.4 Six patterns, used everywhere

A tight specification uses a small number of shapes. These are the only allowed ones:

| Pattern | Convention |
|---|---|
| Identifier | `TableName_ID` |
| Hierarchy | `Parent_TableName_ID` (self-referencing) |
| Role-disambiguation | Role-named FK on a single typed entity |
| Polymorphic attachment | `Related_Entity_Type` + `Related_Entity_ID` |
| Extensibility | `AllowedValues` for institution-specific enums |
| State machine | `*_Status` field + CHECK list for universal taxonomies |

If a piece of the model uses something else, it should be rewritten to fit one of these.

### 1.5 The UDM is for research-administration data, not for the systems that hold it

If the data is a record of work an OSP or research office does, it belongs. If it's metadata about an IT system or a workflow engine, it doesn't. ServiceRequest belongs because OSP tickets are operational records of work; the underlying TDX schema does not.

---

## 2. Hub topology

The schema has a small set of central entities that everything orbits. Hub status is earned by inbound reference count *and* by being the natural answer to "what is this domain about?"

### 2.1 Core hubs

| Hub | Role |
|---|---|
| **Personnel** | Every individual actor |
| **Organization** | Every institutional entity, role-disambiguated by FK name and Organization_Type |
| **Project** | The long-lived research effort that may span multiple proposals and awards |
| **Proposal** | The pre-award gravity well |
| **Award** | The post-award gravity well |
| **AllowedValues** | The single extensibility surface for institution-specific enumerations |

### 2.2 Two additional first-class concepts in v2

| Concept | Role |
|---|---|
| **Action** | The work-to-be-done backbone: every OSP, sponsor-required, and internal deadline-bearing task |
| **Funding Cycle** | The lifecycle relationship RFA → Proposal → Award → Modification → Closeout as a coherent domain rather than three separate ones |

Action becomes the most-queried table in the schema for OSP operations. Funding Cycle is a conceptual reorganization (see Section 5), not a new table.

---

## 3. The polymorphic spines

Two spine families absorb most of the "we need a new table for X" requests without requiring new tables.

### 3.1 Annotation spine

Things attached to entities. All ride the `Related_Entity_Type` + `Related_Entity_ID` pattern.

| Table | Purpose | Replaces / absorbs |
|---|---|---|
| **Document** | Files attached to anything | Existing; expand `Related_Entity_Type` allowed values to include SubmissionPackage and Budget |
| **Restriction** | Operational constraints (CUI, CMMC, EAR/ITAR, publication holds, foreign-personnel limits) | New; closes the gap surfaced in issue #51 |
| **Deadline** | Future-dated obligations with type, lead time, and status | New; closes the gap surfaced in issue #44 |
| **Classification** | Subject tags and research-area codes attached to entities (NSF science codes, NIH MeSH, institutional research areas, free tags) | New; closes the federal-reporting gap for HERD and science-code classification |

These are four tables, period. New restriction categories, new deadline kinds, new classification schemes: all become *values*, not tables. Free-form notes are intentionally absent (see Section 10.3).

### 3.2 Action spine

Work to be done on entities. Today's schema has several action-shaped tables that don't know they're siblings. v2 consolidates them.

| Today | v2 |
|---|---|
| `AwardDeliverable` (action owed to a sponsor) | `Action` with `Action_Type='Deliverable'` |
| `ProposalChecklistItem` (action owed during proposal prep) | `Action` with `Action_Type='Checklist_Item'` |
| `ServiceRequest` (action owed to an OSP team member) | `Action` with `Action_Type='Service_Request'` |
| Modification approvals (implicit) | `Action` with `Action_Type='Modification_Approval'` |
| Compliance renewals (implicit) | `Action` with `Action_Type='Compliance_Renewal'` |

```
Action
├── Action_ID
├── Action_Type            (Deliverable / Checklist_Item / Service_Request /
│                           Modification_Approval / Compliance_Renewal / Other)
├── Title
├── Description
├── Related_Entity_Type    (polymorphic)
├── Related_Entity_ID
├── Assignee_Personnel_ID
├── Requestor_Personnel_ID
├── Due_Date
├── Action_Status          (Open / In_Progress / Blocked / Completed / Cancelled)
├── Priority               (CHECK)
├── Completed_Date
├── Origin                 (Sponsor_Required / Internal / System_Generated / Manual)
└── Linked_Document_ID
```

Type-specific extensions (sponsor-required submission format on a Deliverable, requirement code on a Checklist Item) live in small sub-tables that reference `Action_ID` when their attributes genuinely don't generalize. The spine — and the entire OSP work surface — is one table.

#### What this unifies in practice

- "What does my team owe sponsors this quarter?" → single-table query.
- "What's stuck in OSP review?" → single-table query.
- "How much OSP labor does each award generate?" → single-table aggregation.
- "Who in OSP is overloaded?" → single-table aggregation.

None of these queries work cleanly today.

---

## 4. Consolidation decisions

Each decision below applies the principles above to a specific cluster of tables.

### 4.1 Budget family (3 tables → 1)

**Decision:** Collapse `ProposalBudget`, `AwardBudget`, `AwardBudgetPeriod` into a single `Budget` table.

**Rationale:** All three are line items keyed by period and category. The difference is the lifecycle stage and which entity they hang off. A revision of an approved budget is the same shape as an approved budget; a proposal budget is the same shape as an award budget after the proposal becomes an award.

```
Budget
├── Budget_ID
├── Lifecycle_Stage        (Proposed / Approved / Current / Actual)
├── Budget_Mode            (Itemized / Modular)
├── Parent_Budget_ID       (revisions chain)
├── Project_ID
├── Proposal_ID            (nullable; required if Lifecycle_Stage='Proposed')
├── Award_ID               (nullable; required if Lifecycle_Stage in 'Approved','Current','Actual')
├── Period_Start_Date
├── Period_End_Date
├── Version_Number
├── Module_Count           (when Budget_Mode='Modular')
├── Module_Size_Amount     (when Budget_Mode='Modular')
├── line items by BudgetCategory  (when Budget_Mode='Itemized')
```

The "three amounts" (proposed/approved/current) become snapshots in the same lineage rather than separate columns on a different table. `Budget_Mode` distinguishes line-item budgets from NIH-style modular budgets without spawning a parallel table.

### 4.2 Faculty Development domain (2 tables → 0 dedicated)

**Decision:** Collapse `ProjectCohort` into `Project` (as a Project with `Project_Type = "Cohort"`) and `CohortParticipation` into `ProjectRole` (with `Role_Value_ID = "Cohort_Participant"` and Coach as a `Personnel_ID` field).

**Rationale:** The Faculty Development tables are a parallel structure to the core Project + ProjectRole pattern. Collapsing them gives cohort programs the same hierarchy, role, and effort tooling for free. The domain disappears as a separate concept; its substance becomes Project type values.

### 4.3 Committee → Organization specialization

**Decision:** Model IRB, IACUC, IBC, and other regulatory committees as `Organization` rows with `Organization_Type = "Committee"`. Committee membership uses an existing `ProjectRole`-shaped pattern or a small membership extension if the standard pattern doesn't fit.

**Rationale:** A committee is an institutional entity with members and a meeting schedule. The Organization pattern already handles "institutional entity with members" via role-named FKs. No new top-level table; the polymorphic role pattern handles the roster.

### 4.4 Subaward as outbound funded agreement

**Decision:** Keep `Subaward` as its own table but document the structural symmetry with `Award`. Award is an inbound funded agreement (your institution receives money); Subaward is an outbound funded agreement (your institution disburses money). The two share most fields and lifecycle states; both can have their own modifications, periods, and reporting.

**Rationale:** A full merger into a single `FundedAgreement` with a direction discriminator loses too much readability for too little structural gain. The symmetry is worth *naming*, not collapsing.

### 4.5 Compliance dual-entity (keep separate, document morphology)

**Decision:** Keep `ComplianceRequirement` and `ConflictOfInterest` as separate tables. Document them as siblings of the same morphology so future compliance categories (research security, foreign engagement disclosure) don't spawn a third sibling.

**Rationale:** COI carries enough COI-specific fields (relationship type, financial details, federal regulatory citation) that merging into a generic ComplianceRecord loses too much. The morphology guidance prevents future drift.

### 4.6 Submission family (5 tables → 3)

**Decision:** Drop `SubmissionEvent` and `SubmissionAttachment`. Keep `SubmissionProfile`, `SubmissionPackage`, `SubmissionAttempt`.

**Rationale:**
- `SubmissionEvent` is an event log on a SubmissionAttempt. That's what `ActivityLog` is for — with an added `Activity_Type` column it absorbs submission events without losing audit functionality.
- `SubmissionAttachment` is a join between SubmissionPackage and Document. With `Document.Related_Entity_Type='SubmissionPackage'` it disappears.

### 4.7 ApplicationSystem — keep with clarification

**Decision:** Keep `ApplicationSystem` as a small reference catalog. Document that it exists so Actions can reference "the system this work pertains to" (e.g., "fix Banner integration for award #12345").

**Rationale:** Without it, queries like "how many tickets are about Banner integration this quarter?" require text matching. The catalog is institutional reference data, not IT inventory.

### 4.8 ServiceRequest — absorbed into Action

**Decision:** ServiceRequest disappears as a top-level table. Tickets become `Action` rows with `Action_Type='Service_Request'`, optionally linked to an ApplicationSystem.

**Rationale:** ServiceRequest is one of several action-shaped tables that didn't know they were siblings. The Action spine unifies them.

### 4.9 Effort family collapse (mirror of Budget)

**Decision:** Restructure `Effort` to use a `Lifecycle_Stage` discriminator, the same way `Budget` does. `ProjectRole` remains the long-lived assignment record; `Effort` carries the per-stage detail.

**Rationale:** Federal effort reporting distinguishes four stages that today's schema either inlines or loses:

1. **Proposed** — what was in the proposal budget.
2. **Approved** — what the sponsor authorized (may differ from proposed).
3. **Charged** — what was billed via salary transactions.
4. **Certified** — what the person attests to spending after the fact.

These four can all be different numbers for the same person on the same project in the same period. They are the same morphology — percent + period + person + role + person-months — at different lifecycle stages.

```
Effort
├── Effort_ID
├── Lifecycle_Stage        (Proposed / Approved / Charged / Certified)
├── Parent_Effort_ID       (revisions chain)
├── ProjectRole_ID         (the assignment)
├── Period_Start_Date / Period_End_Date
├── Effort_Percent
├── Person_Months          (stored for federal forms that ask explicitly)
├── Calendar_Type          (Calendar / Academic / Summer)
├── Charged_Amount         (when Lifecycle_Stage='Charged')
├── Over_Cap_Amount        (salary-cap surplus)
├── Certification_Method
├── Certifier_Personnel_ID
├── Cert_Date
```

Committed-vs-actual queries become single-table aggregations. Other Support / Current and Pending Support reports become a SELECT across stages = Proposed and Charged for a given Personnel_ID.

### 4.10 Sponsor-side personnel

**Decision:** Sponsor contacts (Program Officer, Grants Management Specialist, Contract Officer) are `Personnel` rows with `Department_Organization_ID` pointing at the sponsor Organization. Their relationship to a specific Award is a `ProjectRole`-like entry with `Role_Value_ID` set to the appropriate sponsor-role value.

**Rationale:** No new entity is needed. The Personnel + ProjectRole pattern already handles "person in a role on an entity"; the role list extends to cover sponsor-side functions.

### 4.11 ActivityLog — keep with broader role

**Decision:** Keep `ActivityLog` and expand its role to absorb SubmissionEvent. Add `Activity_Type` (CHECK list with `data_change`, `submission_status_change`, `agency_note`, `operator_action`, `field_change`, etc.) and Old_Value / New_Value columns.

**Rationale:** Audit trails are research-administration concerns under federal compliance rules. ActivityLog earns its place when it's a typed event log rather than just a generic data-change log. Typed entries also let it absorb sponsor-transfer field changes (Section 4.14) without spawning a transfer-specific table.

### 4.12 Payment family collapse (Invoice absorbed)

**Decision:** Collapse `Invoice` into a new `Payment` table with a `Lifecycle_Stage` discriminator. Payment schedules, sponsor invoices, payment receipts, and reconciliations are the same morphology at different lifecycle stages.

**Rationale:** Schedule (planned), Invoice (sent to sponsor), Receipt (money arrived), and Reconciliation (matched and closed) are the same shape — date + amount + period + status — at successive points. The Lifecycle_Stage pattern that handles Budget and Effort handles Payment too.

```
Payment
├── Payment_ID
├── Lifecycle_Stage       (Scheduled / Invoiced / Received / Reconciled)
├── Parent_Payment_ID     (revisions chain; later stages chain back to earlier ones)
├── Award_ID
├── Budget_ID             (optional period reference after Budget collapse)
├── Scheduled_Date / Scheduled_Amount
├── Invoice_Number        (sponsor-side identifier; populated when Lifecycle_Stage='Invoiced')
├── Submission_Date
├── Actual_Date / Actual_Amount
├── Payment_Status        (CHECK list)
```

### 4.13 CostShare family collapse

**Decision:** Restructure `CostShare` with a `Lifecycle_Stage` discriminator. Cost share commitments exist from proposal stage through award-stage commitment, fulfillment, and waiver.

**Rationale:** Cost share at proposal time is the same morphology as cost share at award time. Today's `CostShare` is award-attached, which loses the proposal-stage commitment. Applying the Lifecycle_Stage pattern fixes that and parallels Budget, Effort, and Payment.

```
CostShare
├── CostShare_ID
├── Lifecycle_Stage           (Proposed / Committed / Met / Waived)
├── Parent_CostShare_ID
├── Proposal_ID               (nullable; required when Lifecycle_Stage='Proposed')
├── Award_ID                  (nullable; required for later stages)
├── Project_ID
├── Commitment_Type_Value_ID  (AllowedValues; closes issue #52 with the AllowedValues conversion)
├── Amount_Committed
├── Amount_Actual
├── CostShare_Status
```

### 4.14 Sponsor transfer as Modification event

**Decision:** Sponsor transfer (an award's sponsor identity changes) is a `Modification.Event_Type` value, not a new entity. The Award's `Sponsor_Organization_ID` updates on completion; `ActivityLog` captures the old and new values.

**Rationale:** Modification already represents formal changes to an award. Sponsor transfer is one kind. The field-level change record lives in the typed ActivityLog (Section 4.11); the formal event lives in Modification with the new event-type value.

---

## 5. Domain re-organization (11 → 7)

The current 11 domains are functional groupings. v2 reorganizes around conceptual ones.

| v2 Domain | Tables |
|---|---|
| **Actors** | Personnel, Organization, ContactDetails |
| **Funding Cycle** | RFA, RFARequirement, Proposal, Award, Modification, Subaward, Negotiation, Terms, SubmissionProfile, SubmissionPackage, SubmissionAttempt |
| **Project & Effort** | Project, ProjectRole, Effort |
| **Money** | Budget, Fund, Account, FinanceCode, Transaction, IndirectRate, Payment, CostShare |
| **Compliance** | ComplianceRequirement, ConflictOfInterest |
| **Reference** | AllowedValues, BudgetCategory, ApplicationSystem |
| **Spines** | Document, Restriction, Deadline, Classification, Action, ActivityLog |

**Key shifts:**
- **Pre-Award + Submission + Post-Award merge into Funding Cycle.** They were always one lifecycle described in pieces.
- **Faculty Development disappears.** Cohort programs are Projects.
- **Operations disappears.** ServiceRequest becomes an Action; ApplicationSystem becomes Reference.
- **System becomes Spines.** Document, Restriction, Deadline, Classification, Action, and ActivityLog are the cross-cutting infrastructure.
- **Project & Effort** is a small, focused domain — the people-on-projects substrate.
- **Invoice disappears into Payment.** Payment carries the lifecycle from schedule to reconciliation.

---

## 6. Field-level changes

Schema improvements that don't require structural moves.

### 6.1 Naming consistency

| Current | v2 | Rationale |
|---|---|---|
| `Award.Federal_Award_ID` | `Award.FAIN` | Universal term in federal RA practice |
| `Award.CFDA_Number` | `Award.Assistance_Listing_Number` | Federal language moved in 2018 |
| `Award.Flow_Through_Indicator` | `Award.Is_Flow_Through` | Match the `Is_` boolean convention |

### 6.2 Award additions

| Field | Purpose |
|---|---|
| `Award.Parent_Award_ID` | Award Hierarchy; self-referencing |
| `Award.Subject_To_Federal_Funding` | Derived flag; cascades compliance obligations |
| `Award.Period_Of_Performance_Start_Date` / `_End_Date` | Distinct from a single budget period |

### 6.3 Modification additions

| Field | Purpose |
|---|---|
| `Modification.Continuation_Type` | Competing / Non-Competing / Supplement / Other |
| `Modification.Carryover_Amount` | Unspent funds moved between periods |
| `Modification.Carryforward_Amount` | Synonym/companion of Carryover depending on accounting policy |
| `Modification.Requires_Prior_Approval` | Flag triggering sponsor approval workflow |
| `Modification.Prior_Approval_Granted_Date` | Closure date for approval |
| `Modification.Pre_Award_Costs_Amount` | At-risk spending captured at the modification level |

**Event_Type AllowedValues expansion:**
- `Incremental_Funding`, `No_Cost_Extension`, `Budget_Revision`, `PI_Change`, `Scope_Change`, `Carryover`, `Rebudget` (existing-style values)
- `Sponsor_Transfer` (Section 4.14)
- `Supplement`, `Cost_Transfer_Authorization` (other types as needed)

### 6.4 Organization additions

| Field | Purpose |
|---|---|
| `Organization.Sponsor_Type` | Federal / State / Foundation / Industry / etc. (CHECK) |

### 6.5 Personnel & Effort additions

| Field | Purpose |
|---|---|
| `ProjectRole.Credit_Percent` | Investigator credit allocation (drives F&A distribution) |
| `ProjectRole.Credit_Unit_Organization_ID` | Unit that receives credit |

Credit splits do not need a separate table; ProjectRole already carries the right relationship.

### 6.6 Document type taxonomy

`Document.Document_Type` should ship with a recommended starting set covering the common research-administration artifacts. Institutions extend the list via `AllowedValues`, but starting consistent matters for cross-institution queries.

Recommended starting types:

| Type | Attached to |
|---|---|
| `NOA` | Award |
| `Sponsor_Agreement` | Award |
| `Subaward_Agreement` | Subaward |
| `Modification_Notice` | Modification |
| `Biosketch` | Personnel / Proposal |
| `Budget_Justification` | Proposal / Budget |
| `DMP` | Proposal / Award |
| `Public_Access_Plan` | Proposal / Award |
| `Other_Support` | Personnel / Proposal |
| `LOI` | Proposal |
| `IP_Review` | Proposal |
| `Approved_Items_Schedule` | Award |
| `Closeout_Document` | Award |
| `Compliance_Approval_Letter` | ComplianceRequirement |
| `Restriction_Authority_Document` | Restriction |
| `Training_Certificate` | Personnel / Action (when Action_Type='Training_Completion') |

This is descriptive, not exhaustive. The point is to give institutions a starting taxonomy without forcing it, and to make "where does a biosketch go?" obvious.

### 6.7 RFA / Award additions for Funding Source

| Field | Purpose |
|---|---|
| `RFA.Funding_Mechanism_Description` | Free-text label for the funding program |
| `RFA.Assistance_Listing_Number` | Federal program identifier |
| `Award.Funding_Mechanism_Description` | Carries forward when no formal RFA exists |
| `Award.Assistance_Listing_Number` | Closes the federal reporting gap |

A separate FundingSource table is not necessary; these fields cover the common cases.

### 6.8 Transaction additions for project income

| Field | Purpose |
|---|---|
| `Transaction.Income_Treatment` | CHECK: `Offset` / `Additive`. Required when `Transaction_Type` is project income; describes whether the income reduces sponsor amount or adds to project value. |

**Transaction_Type AllowedValues expansion:** `Project_Income`, `Cost_Transfer_In`, `Cost_Transfer_Out` (added to the existing CHECK / AllowedValues list).

---

## 7. What gets cut

Removing concepts from the schema is a positive design move when the concept either belongs at a different layer or was never doing real work.

| Cut | Reason |
|---|---|
| `ProjectCohort` | Becomes `Project` with `Project_Type = "Cohort"` |
| `CohortParticipation` | Becomes `ProjectRole` with cohort-participant role |
| `ProposalBudget` | Absorbed by unified `Budget` |
| `AwardBudget` | Absorbed by unified `Budget` |
| `AwardBudgetPeriod` | Absorbed by unified `Budget` |
| `SubmissionEvent` | Absorbed by typed `ActivityLog` |
| `SubmissionAttachment` | Absorbed by `Document` |
| `ServiceRequest` | Absorbed by `Action` |
| `AwardDeliverable` | Absorbed by `Action` |
| `ProposalChecklistItem` | Absorbed by `Action` |
| `Invoice` | Absorbed by `Payment` with `Lifecycle_Stage='Invoiced'` |

---

## 8. Net table count

| | Today | v2 |
|---|---|---|
| Tables cut | — | 11 |
| Tables added | — | 7 (Action, Restriction, Deadline, Classification, Budget, Payment, Negotiation) |
| **Net** | 40 | **36** |

Smaller schema, more expressive power. The shrink comes from collapsing morphologically identical tables (Budget family, Faculty Development domain, Invoice into Payment) and from absorbing per-concept "annotation" tables into the polymorphic spine. The expressive gain comes from naming Action, formalizing the four-table annotation spine, applying Lifecycle_Stage to four financial/effort tables (Budget, Effort, CostShare, Payment), and giving cross-cutting concepts (restrictions, deadlines, classifications) a real home.

If the open question on Proposal-to-Award cardinality (Section 9.1) resolves toward a bridge table, the count rises to **37**.

---

## 9. Open questions

Decisions that need resolution before implementation begins.

### 9.1 Proposal-to-Award cardinality

Today `Award.Proposal_ID` is a single FK. Real institutions have proposals that yield multiple awards (e.g. a planning grant followed by an R01) and awards funded by multiple proposals (collaborative submissions). Options:

1. Bridge table `AwardProposalLink` with optional metadata (funding fraction, role on award).
2. Keep the single FK and document the limitation.

Recommendation: bridge table. It is the one new table beyond the polymorphic spine that genuinely earns its place.

### 9.2 Budget collapse — strict or graceful?

Strict collapse means dropping `ProposalBudget`, `AwardBudget`, `AwardBudgetPeriod` and migrating all data to the new `Budget` table. Graceful means keeping the existing tables as deprecated views over the new one for one release cycle. Operational decision.

### 9.3 Negotiation as table or as Proposal/Modification status

Two paths:

1. **Negotiation as its own table** — distinct from `Terms` (the agreed result). Has its own start/end, parties, status machine.
2. **Negotiation as a state range** on Proposal (Decision_Status = "In Negotiation") and on Modification.

Recommendation: own table. Negotiation has stakeholders (sponsor contract officer, institutional sponsored programs officer), document trails, and outcomes that don't fit Proposal's shape.

### 9.4 Personnel — split identity from contact?

ContactDetails today covers email, phone, fax, mobile for both Personnel and Organization. Personnel separately carries a Primary_Email. Two options:

1. Keep as-is — Primary_Email is the most-queried contact field and lives directly on Personnel for performance; everything else is in ContactDetails.
2. Move all contact information into ContactDetails — Personnel carries only identity.

Recommendation: keep as-is. The convenience of a single Primary_Email join is worth the small redundancy.

### 9.5 Restriction — table or AllowedValues + flags?

A `Restriction` table with type/level/dates/authority is the right shape if restrictions need their own lifecycle, audit trail, and per-restriction approval. If restrictions are mostly static flags ("this award is CUI"), they could be boolean fields on Award. The right answer depends on whether OSP needs to track who certified a restriction, when it was applied, and when it expires.

Recommendation: table. The metadata requirements (effective dates, authority, certifying personnel) justify it.

### 9.6 ActivityLog enrichment depth

A typed ActivityLog can replace SubmissionEvent and absorb status-change history. The question is how much metadata it carries: just type and old/new values, or also affected fields, request payload, response payload, etc.

Recommendation: minimum viable. Type + actor + timestamp + old/new value + free-text description. Heavier audit needs can come later without restructuring.

---

## 10. Explicitly out of scope

The discipline of a tight model is as much about what it refuses to hold as what it does. The following are deliberately not modeled in the UDM. Each is named here so future "should this be a table?" questions land with a definitive answer.

### 10.1 Identity, access control, and permissions

Authentication, RBAC, role-to-permission mappings, group membership for system access, login sessions, password policies, MFA enrollment. These are institutional IAM concerns and vary enormously by institution. The UDM models *who is on a project* (ProjectRole), not *who can log in and edit what*.

### 10.2 Workflow engine internals

Routing rules, approval chains, route nodes, action requests, ad-hoc routing, recall and disapproval mechanics, workflow definitions, approval-state machines beyond an entity's own `*_Status` field. These belong in process management tools. The UDM records the *outcome* of routing (status reached, document approved on date X) but not the routing engine that produced it.

### 10.3 Free-form notes and ad-hoc commentary

Personal sticky notes, ad-hoc commentary, comment threads, conversation logs. These are user-generated content best handled by the tool layer. The UDM holds *structured* data; free-form text belongs in document attachments or external collaboration tools. If a note is important enough to query against, it should be a structured field or an Action with a Description.

### 10.4 Award templates and reusable boilerplate

Reusable templates for award terms, reporting cadences, standard contact lists, boilerplate language. These are application-layer concerns. The schema stores the *per-award outcome* of applying a template; the template library lives in the institution's ERA or document management system.

### 10.5 Communications and notifications

Email queues, notification preferences, alert delivery, in-app inbox state, subscription preferences. The UDM does not model how reminders are delivered. A `Deadline` row says when something is due; a notification system decides whom to ping.

### 10.6 UI and application state

Tab preferences, dashboard layout, view configurations, saved searches, draft form state. These are application-specific.

### 10.7 External system internals

Banner's financial posting tables, Cayuse's submission logs, TDX's ticket queues, Workday's HR transactions. The UDM models the *records that flow through* these systems (a Transaction is research-admin data even though Banner holds it), not the systems' internal metadata.

### 10.8 Reporting engine configuration

Report definitions, scheduled report jobs, output template files, distribution lists. Reports query the UDM; their configuration is not stored in it.

### 10.9 Document content (file blobs)

Document metadata (path, name, hash, size, type, related entity) is in. File contents themselves are stored elsewhere (object storage, content management system) and referenced by path or URI. The UDM is a metadata layer over content, not a content repository.

### 10.10 Generic data-engine audit

Schema migrations, query logs, index maintenance, replication lag, backup history. `ActivityLog` records research-admin-meaningful events (submission status changes, sponsor notes, modification approvals). Database operational telemetry is the platform's concern.

### 10.11 Generic financial-engine internals

General ledger balancing rules, fiscal-period close mechanics, journal entry workflow, bank reconciliation state. The UDM models the financial records *attached to research administration* (Transactions on Awards) and the chart of accounts they reference, not the institutional finance system's operational metadata.

### 10.12 Anything that varies by institution as configuration rather than as data

Custom dashboard themes, per-user preferences, institution branding, navigation menus. Configuration belongs in configuration; the UDM is for shared data.

---

## 11. What this document is not

- It is not the schema itself; that work happens in `udm_schema.json`.
- It is not a migration plan; sequencing comes after the structural decisions are confirmed.
- It is not final; the open questions in Section 9 need answers before implementation.

The intent is to capture the design thinking in one place so the implementation work becomes "execute the document" rather than "remember the thread."
