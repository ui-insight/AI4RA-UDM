# UDM: Architecture and Worked Examples

Three additions to the UDM specification. Each section is independent and can be inserted into the spec at the location noted.

---

## Section 1: Three-Layer Deployment Architecture

(Recommended location in the spec: a new top-level section, after the introduction and before the "Domains" section.)

Research-administration deployments using UDM commonly organize data across three layers. Naming the architecture explicitly clarifies what data UDM holds, what data is intentionally absent from UDM, and how UDM data interacts with surrounding systems.

### The three layers

| Layer | Standard term | Workload profile | What it holds |
|---|---|---|---|
| 1 | **System of Record** | OLAP, versioned storage with transaction metadata capture | Source-of-truth research-administration data |
| 2 | **System of Insight** | View / projection layer in the same OLAP query engine | Derived data: review findings, dashboards, reports, computed aggregates |
| 3 | **System of Engagement** | OLTP, transactional, user-facing | Non-UDM application infrastructure: authentication, session state, AI configuration, in-flight wizard drafts, application observability |

**UDM is the data model of the System of Record.** The entities, attributes, and relationships defined in this specification describe what an institution's canonical research-administration source-of-truth holds. The other two layers consume UDM data and contribute their own data shapes; they do not define UDM.

### What each layer holds

**System of Record (UDM).** The canonical record of every research-administration entity: people and organizations, funding opportunities and proposals, awards and modifications, compliance protocols, budgets and transactions, attachments. Source-of-truth. Versioned by the storage layer so that history is recoverable. Every entity defined in the rest of this specification lives here.

**System of Insight.** Derived data, projected from UDM source data plus engine logic. Review findings produced by rule-based or AI engines, computed dashboards, periodic reports, point-in-time projections, and any other data that is fundamentally re-computable from UDM. Materialized as views in the query engine over UDM tables; the engine logic lives in the view definitions rather than in persisted derived tables. Materialized views are acceptable when query latency requires them; the source-of-truth still lives in UDM and the materialized view is refreshed.

**System of Engagement.** Application infrastructure that is not source-of-truth research-administration data and is not derivable from UDM: user accounts and credentials, session state, AI endpoint configurations, in-flight wizard drafts that exist before they materialize into UDM on submission, application observability events (page views, operator actions), notification queues, job-queue state. The shape of the System of Engagement varies by institution and application stack; UDM does not specify it.

### The storage-layer contract for the System of Record

To serve as the System of Record for UDM, the storage implementation must satisfy three properties:

1. **Versioned storage.** Every change to a UDM row is captured as historical state, queryable via time-travel (e.g., snapshot reads, temporal queries, commit-based history).
2. **Transaction metadata capture.** Every commit records the committer's identity, the commit timestamp, and (optionally) commit context such as a transaction reason. Snapshot-only versioning without committer identity is insufficient because audit reconstruction requires actor attribution.
3. **Schema evolution.** UDM evolves between versions. The storage layer supports adding columns, renaming columns, evolving controlled vocabularies, and (where applicable) partition evolution without breaking historical queries.

Examples of implementations satisfying all three: Apache Iceberg with a commit-aware catalog (e.g., Nessie); Dolt; PostgreSQL with system-versioned temporal tables configured for actor capture.

### The data-movement contract

- **System of Engagement to System of Record.** Finalized application data (a wizard draft on submission, an OLTP-staged record being committed) flows into UDM via ETL or streaming change-data-capture. The System of Engagement is the staging ground for transient state; UDM is the canonical store of finalized data.
- **System of Record to System of Insight.** No data movement. Views in the OLAP engine project UDM data on demand. Materialized views may be cached, but the source-of-truth remains in UDM.
- **Cross-layer references.** References from the System of Engagement to UDM entities are opaque string IDs. Foreign-key enforcement does not cross the layer boundary. Application-layer cleanup handles orphan references.

### Implications for what UDM does and does not model

The three-layer architecture explains several decisions in this specification:

- **Audit-trail entities are not in UDM.** Historical row state is captured by the storage layer's versioning machinery (System of Record). The canonical shape of an audit record is documented as a pattern that storage-layer projections and any application-layer audit table both conform to. UDM does not define an `AuditRecord` entity.
- **Automated review findings are not UDM entities.** Findings are derived from UDM data plus engine logic and live as views in the System of Insight. The canonical finding shape is documented as a pattern; persistence (view, materialized view, search index) is an implementation choice. Acknowledgments of findings are source-of-truth and are recorded as `Action` rows in UDM.
- **Authentication, sessions, and AI configuration are not in UDM.** These belong to the System of Engagement. UDM defines no `User`, `Session`, or `LLMEndpoint` entities.
- **Derived columns are accepted in UDM when justified.** A small number of columns (such as `Award.Current_End_Date` derived from approved Modifications, `Award.Current_Total_Funded` from cumulative Modifications, `Personnel.college_id` derived from Organization hierarchy traversal) live in UDM as denormalization for query convenience. The derivation rule is documented next to the column. Derived TABLES are not accepted; derived projections that need persistence belong in the System of Insight.

---

## Section 2: Worked Example — Encoding Fixed Approval Chains on `ProposalApproval`

(Recommended location in the spec: as a worked example near the `ProposalApproval` entity definition.)

The `ProposalApproval` entity models a multi-step internal review pipeline as a sequence of approval steps on a Proposal. The entity is intentionally generic: an institution chooses how many steps, what each step is called, who reviews each, and what triggers progression. This generality means that two reasonable institutional setups produce different row layouts even though they share the entity.

This example shows how an institution with a fixed four-step approval chain (PI Certification → Department Review → College Review → OSP Review) encodes the chain on `ProposalApproval`. The same pattern handles any fixed sequence; longer or shorter chains substitute their own step names.

### The institutional setup

The institution requires every proposal to pass through four steps in fixed order:

1. **PI Certification.** The proposing PI certifies their submission is complete and accurate. Auto-approved on submission.
2. **Department Review.** The Department Chair (or designee) reviews and approves.
3. **College Review.** The Dean's office (or designee) reviews and approves.
4. **OSP Review.** The Office of Sponsored Programs performs the final pre-submission review.

Each step has a single reviewer. A rejection or return at any step blocks progression. Approval at the final step transitions the Proposal to Approved status.

### Encoding

For each Proposal submitted for internal review, four `ProposalApproval` rows are created at submission time, one per step:

| Step_Order | Step_Name | Approval_Role | Reviewer_Personnel_ID | Step_Status |
|---|---|---|---|---|
| 1 | PI_Certification | PI | (the submitting PI) | Pending |
| 2 | Department_Review | Department_Chair | (auto-assigned: Chair of submitting Department) | Pending |
| 3 | College_Review | College_Approver | (auto-assigned: Dean's-office designee for college) | Pending |
| 4 | OSP_Review | OSP_Reviewer | (auto-assigned: OSP intake officer) | Pending |

The `Approval_Role` column is a controlled-vocabulary identifier (an `AllowedValues` row in the `ApprovalRole` group) that names the role responsible for each step. Reviewer auto-assignment is application logic that reads the Proposal's Submitting_Organization, walks the Organization hierarchy, and finds the appropriate Personnel for each role. The reviewer identity is captured on the row at assignment time and may be reassigned manually.

### Lifecycle

As each step is reviewed, the row's `Step_Status` transitions. Sample lifecycle for Step 1:

| Step_Order | Step_Name | Step_Status | Action_Date | Comments |
|---|---|---|---|---|
| 1 | PI_Certification | Pending | — | — |
| 1 | PI_Certification | Approved | 2026-06-23 | PI certified at submission |

The Proposal's `Internal_Approval_Status` field transitions to `Approved` once every `ProposalApproval` row for the proposal reaches `Approved`. Rejection at any step transitions the Proposal to `Rejected`; return transitions to `Returned` and allows the PI to edit and re-submit.

### Encoding institutional variation

Institutions with different chains substitute their own `Step_Name` and `Approval_Role` values:

- A two-step chain: Department_Review → OSP_Review (two rows per Proposal).
- A five-step chain that includes Risk_Office_Review before OSP: PI_Certification → Department_Review → College_Review → Risk_Office_Review → OSP_Review.
- A configurable chain per sponsor type: institutions encode the configuration in application logic that creates the appropriate set of `ProposalApproval` rows on submission.

The generic `ProposalApproval` entity accommodates all of these because Step_Order, Step_Name, Approval_Role, and Reviewer_Personnel_ID together describe any fixed or institutionally-routed chain.

---

## Section 3: Worked Example — Correspondence with Follow-up via `Communication` + `Action`

(Recommended location in the spec: as a worked example near the `Communication` and `Action` entity definitions.)

A common real-world pattern in research administration: an external party sends correspondence to the institution that requires a response by a specific date. The sponsor sends a request for additional information that drives a modification request; a subawardee asks a contractual question that needs to be answered before invoicing can proceed; a regulatory body sends a determination that requires institutional follow-up.

The pattern composes two existing UDM entities: `Communication` records the incoming or outgoing message, and `Action` records the work item that the message generates. Both attach polymorphically to whatever UDM entity the correspondence is about (Award, Proposal, Subaward, Modification, etc.).

### The situation

The sponsor of Award `AWARD-2026-104` sends an email to the institution requesting clarification on the Year 2 budget reallocation. The email is received on 2026-06-15. Institutional policy is to respond within 10 business days, and the response will likely drive a Modification request.

### Rows produced

**One `Communication` row** for the inbound email, attached to the Award:

| Related_Entity_Type | Related_Entity_ID | Direction | Communication_Type | Sender_Description | Subject | Body | Received_Timestamp |
|---|---|---|---|---|---|---|---|
| Award | AWARD-2026-104 | Inbound | Email | "Jane Smith, NSF Program Officer (jane.smith@nsf.gov)" | "Clarification needed on Year 2 budget reallocation" | (full email body) | 2026-06-15 09:47 |

**One `Action` row** for the work item, attached to the same Award:

| Related_Entity_Type | Related_Entity_ID | Action_Type | Title | Description | Assignee_Personnel_ID | Requestor_Personnel_ID | Due_Date | Action_Status | Origin | Linked_Document_ID |
|---|---|---|---|---|---|---|---|---|---|---|
| Award | AWARD-2026-104 | Sponsor_Response | "Respond to NSF clarification request on Y2 reallocation" | (summary of what the sponsor asked) | (OSP officer assigned) | (PI Personnel_ID) | 2026-06-29 | Pending | Sponsor_Required | (Document_ID of the sponsor email PDF, if archived) |

The Action's `Due_Date` reflects the institutional 10-business-day response policy. The `Action_Type` identifies the kind of work; `Origin = Sponsor_Required` indicates this work was driven by external correspondence rather than internal initiative.

### Cross-linking to a downstream Modification

If the response drives a Modification, a `Modification` row is created on the Award. The Communication and the Action can both reference the Modification by cross-linking:

- The Communication can be cross-referenced from the Modification's `Origin_Communication_ID` field (when present) to trace which sponsor message drove the modification.
- The Action transitions to `Action_Status = Completed` when the response is sent; `Outcome_Description` captures the resolution ("Responded with revised Y2 budget; Modification M-2026-104-03 submitted").

This composition pattern (Communication for the message, Action for the work item, cross-link to any downstream entity the work produced) handles inbound and outbound correspondence uniformly. Outbound correspondence works the same way: the Communication row carries `Direction = Outbound`, and the Action may pre-exist (capturing the internal decision to send) or post-exist (capturing follow-up the outbound message generates).

### Notes

- A single Communication may generate multiple Actions if the message requires several follow-ups (a sponsor letter requesting both a budget revision and a personnel change generates two Action rows). The Communication is the source; the Actions are the work products.
- A single Action may relate to multiple Communications if the work is informed by an ongoing thread (an Action to resolve a recurring subawardee billing question may reference a sequence of Communications). The cross-references are application-layer; UDM provides the entities and the polymorphic attachment.
- The pattern handles "action required" and "action completed" lifecycle on the Action; the Communication remains an immutable historical record of the message itself.
