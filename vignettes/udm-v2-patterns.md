# UDM Design Patterns

A catalog of design patterns that recur across UDM modules. Each pattern names either a composition of existing UDM entities, or a canonical shape for data produced by layers built on top of UDM (review engines, audit infrastructure, etc.), that solves a class of problem. New patterns are added as they emerge from module design work.

Composition patterns are not entities or schema definitions. They are normative compositions of existing entities. An adopter following a pattern can rely on the named behavior; a module author adding entities can reference a pattern instead of re-explaining the composition each time.

Shape conventions are not UDM entities either. They document canonical shapes for derived or downstream data (data that is not source-of-truth) so that the layers built on UDM produce portable, interoperable data without requiring every implementation to invent its own structure.

## Pattern format

Each pattern includes:

- **Name and one-line summary.**
- **Problem.** The class of need it addresses.
- **Composition.** The entities involved and how they assemble.
- **Lifecycle.** Normative state transitions, where applicable.
- **Recurrences.** Concrete places this pattern shows up across modules.
- **Notes.** Caveats, variants, related patterns.

---

## Pattern: Structured response collection

**One-line:** Collect structured per-recipient responses to a notification within a deadline, using generic Attachments-domain entities.

### Problem

A workflow needs to notify a set of recipients about something, give them a deadline to respond, and capture each recipient's structured response (typed enumeration, not freeform text). The workflow then acts on the collected responses.

Without a pattern, modules either repurpose `Action`, invent module-specific notification + response tables, or stuff responses into freeform text. None of these support querying who responded with what across modules.

### Composition

Four existing or newly-defined entities, no module-specific tables required:

- **Communication** (Attachments domain). The notification message. Polymorphically attached to the parent entity that the notification is about.
- **Deadline** (Attachments domain). The response window. Polymorphically attached to the Communication.
- **CommunicationResponse** (Attachments domain). One row per intended recipient, with status and structured response value. References the originating Communication.
- **AllowedValues** (Reference domain). Provides the controlled-vocabulary value sets for `Response_Type` and for each type's allowed `Response_Value` values.

The composition reads naturally: a `Communication` (with a `Deadline`) collects `CommunicationResponse` rows.

### Lifecycle

1. Sender creates a `Communication` attached to the parent entity.
2. Sender attaches a `Deadline` to the Communication for the response window.
3. The system creates one `CommunicationResponse` row per intended recipient, with `Status = Pending` and `Respondent_Personnel_ID` set. (Pre-creation gives clean "who has not responded" queries.)
4. As recipients respond, their rows transition to `Status = Responded` with `Response_Value` and `Responded_At` populated.
5. When the `Deadline` passes, any remaining `Pending` rows transition to `Status = Timed_Out`. The transition mechanism (trigger, application logic, scheduled job) is unspecified; the lifecycle is normative.
6. Workflow logic for the originating cycle reads the `CommunicationResponse` rows and acts (escalates, proceeds, blocks, notifies).

### Recurrences

- **IACUC DMR/FCR notification cycle** (PHS Policy IV.C.2). Coordinator notifies committee members about a Protocol; each responds No_Objection or Request_FCR; any Request_FCR escalates to full committee review.
- **RPPR sign-off.** PI requests co-PI sign-off on a progress report; each responds Signed / Declined / Pending.
- **COI annual disclosure reminders.** COI office reminds investigators; each responds Submitted / Declined / Extension_Requested.
- **IRB Full Board concurrence requests.** IRB chair polls members on an out-of-cycle decision; each responds Concur / Object / Abstain.
- **Just-in-Time response collection.** OSP requests JIT-required information from multiple personnel on an Award.
- **Sponsor effort-certification reminders.** OSP reminds PIs of effort statements due; each responds Submitted / Declined.

### Notes

- The same pattern is reused with different `Response_Type` values. The shape stays identical; only the controlled-vocabulary values change.
- Per-recipient deadlines (when one recipient gets an extension) are modeled as a new `Deadline` attached to the specific `CommunicationResponse` row rather than the parent `Communication`. The parent Deadline governs the cohort; per-recipient Deadlines override.
- This pattern composes with the **Polymorphic attachment** pattern (Communication and Deadline both attach polymorphically).

---

## Pattern: Polymorphic parent FK with exclusive-or constraint

**One-line:** A child entity references one of several possible parent entity types, using N optional FKs with an exactly-one-non-null constraint.

### Problem

A child entity has a semantically uniform role but multiple legitimate parent types. The set of parent types is small and known (two to four, typically), and parent-type-specific behavior is rare enough that one shared child entity is preferable to N parallel child tables.

A `Related_Entity_Type` + `Related_Entity_ID` string-based polymorphic ref (the alternative pattern) loses referential integrity and is rejected for these cases.

### Composition

One child entity. N optional FK columns, one per possible parent type. A CHECK constraint that exactly one of the N FK columns is non-null per row.

Each FK column references its parent table directly. Referential integrity is preserved.

### Lifecycle

Not applicable as a lifecycle pattern; this is a structural pattern. The child entity's lifecycle is whatever the child entity defines independently.

### Recurrences

- **Negotiation** (Funding Cycle domain). `Proposal_ID` XOR `Award_ID` XOR `Subaward_ID`. A negotiation attaches to whichever funding stage it concerns.
- **ContactDetails** (Actors domain). `Personnel_ID` XOR `Organization_ID`. Contact info belongs to either a person or an institution.
- **ProtocolReviewStep** (Compliance module). `Protocol_ID` XOR `ProtocolAmendment_ID` XOR `ProtocolContinuingReview_ID`. The same review-step entity is used for initial protocol review, amendment review, and continuing review.
- **AwardRole** (Effort domain). `Award_ID` XOR `Subaward_ID`. A role exists on either the prime award or a subaward but not both.

### Notes

- Use this pattern when the set of parent types is small (two to four) and known at design time.
- For larger or open-ended parent-type sets, use the **Polymorphic attachment** pattern (separate `Related_Entity_Type` + `Related_Entity_ID` with documented enumeration) instead.
- The exactly-one-non-null CHECK is normative. Implementations may enforce via DB constraint, trigger, application logic, or any combination; the constraint is required.
- When a new parent type is added later (e.g., a future entity that should also be reviewable), this pattern requires a schema change (a new optional FK column plus an updated CHECK). The polymorphic-attachment pattern does not.

---

## Pattern: Automated finding shape

**One-line:** A canonical shape for findings produced by automated review engines (rule-based or AI-driven) evaluating UDM data, so findings are portable across engines and across institutions. This is a shape convention for the layer above UDM, not a UDM entity.

### Problem

Review engines evaluate UDM source data against rules or AI checks and produce findings: "biosketch is missing for the PI on this proposal", "this protocol's animal count exceeds the approved cap", "this RFA requires a Data Management Plan that is not detected in the submission." Findings are derived (re-computable from source data plus engine logic), not source-of-truth themselves. If you deleted all findings, you could regenerate them by re-running the engines. You cannot regenerate a Protocol or a Proposal.

Without a canonical shape, every review engine invents its own structure for findings. Acknowledgment workflows are duplicated. An institution migrating from one engine to another loses findings continuity. Cross-institution comparison of findings is impossible.

### Scope

This is a shape convention for derived data produced by layers built on UDM. Findings themselves are not UDM entities. Persistence (relational table, document store, search index, ephemeral computation) is an implementation choice.

Acknowledgments of findings are source-of-truth data and DO belong in UDM. See the acknowledgment workflow section below.

### Canonical finding shape

A finding row, however persisted, carries these fields:

- **Subject reference.** The UDM entity the finding is about: typically a Proposal, Award, Protocol, Personnel, or Document, by ID. Implementations may use one column per possible subject type with exclusive-or, a discriminator + ID pair, or whatever the persistence layer prefers.
- **Check_Code** (required). A stable string identifier for the specific check that produced this finding. Same check producing the same finding on the next run produces the same Check_Code. Examples: `personnel.sfi_expired`, `document.biosketch_missing_for_pi`, `budget.indirect_rate_mismatch`, `content.page_limit_likely_exceeded`.
- **Check_Category** (required). The category of check. Examples: `personnel_eligibility`, `document_completeness`, `budget_validation`, `content_review`, `requirement_satisfaction`.
- **Severity** (required). Constrained: `pass` / `warn` / `fail` / `info`.
- **Message** (required). Human-readable finding description.
- **Details** (optional). Machine-readable or expanded detail (often JSON or structured text).
- **Is_AI_Generated** (required). Boolean. Distinguishes deterministic rule-based findings from probabilistic AI-derived findings.
- **Engine_Identifier** (optional). The review engine and version that produced the finding, for reproducibility.
- **Generated_At** (required). Timestamp when the finding was produced.

### Acknowledgment workflow

Acknowledgment of a finding (reviewer accepts the finding as-is, overrides it, or marks it as resolved) is source-of-truth data and belongs in UDM proper. Recommended pattern:

- Use the existing `Action` attachment entity to record each acknowledgment. One `Action` row per acknowledgment with:
  - `Action_Type = Finding_Acknowledgment`
  - The original Check_Code captured in `Action.Notes` or a structured field
  - `Assignee_Personnel_ID` set to the reviewer
  - `Status` reflecting the acknowledgment decision (Acknowledged / Overridden / Resolved)
- Attach the `Action` polymorphically to the same UDM entity the finding is about (the Proposal, Award, Protocol, etc.).

The finding itself stays derived (regeneratable from source data plus engine logic). The acknowledgment persists in UDM, recoverable independently of which engine produced the original finding.

### Recurrences

- **OpenERA `ReviewFinding`** (rule-based and AI-generated review engines). Uses STI on Review_Type with values personnel / document / content; carries Severity, Check_Code, Is_AI_Generated, and acknowledgment columns. Shape conforms to this pattern except acknowledgment is recorded on the finding row itself rather than a separate Action.
- **Future review engines** in adopters' systems. Shape conformance recommended for portability.

### Notes

- Findings are derivable from source data plus engine logic. Persisting them is optional: some institutions persist for historical comparison; others recompute on demand.
- The pattern does not specify a Check_Code namespace. Institutions choose their own convention (`institution.module.check_name`) or adopt a shared registry if cross-institution comparison is needed.
- AI-generated findings carry the same shape as rule-based findings; only the `Is_AI_Generated` flag distinguishes them. This unifies engine output regardless of the engine's internal mechanics.
- Multiple engines may produce findings against the same subject. Findings carry no uniqueness constraint at the pattern level. Implementations choose their own deduplication or aggregation strategy.

---

## Pattern: Audit record shape

**One-line:** A canonical shape for change-history records about UDM source-of-truth data, so audit data is portable across implementations regardless of whether history is captured by versioned storage or by an application-layer audit table. This is a shape convention for the layer that captures change history, not a UDM entity.

### Problem

UDM holds current-state source-of-truth data. Many regulatory and institutional contexts require historical reconstruction: who changed what, when, from what value to what value. The history itself is source-of-truth (it cannot be regenerated from current state), but it is captured by a layer outside UDM proper.

That layer takes different forms in different deployments:

- **Versioned storage** (Dolt, Trino + Apache Iceberg, temporal tables in Postgres/SQL Server) captures history natively via time-travel queries.
- **Application-layer audit tables** (a single AuditRecord table written to by application code on each change) capture history explicitly.
- **Event streams** (Kafka, Debezium change-data-capture) capture history as an event log.

Without a canonical shape, these layers produce incompatible data. An institution migrating from one approach to another loses continuity. Cross-system audit analysis is impossible.

### Scope

This is a shape convention for the change-history layer above UDM, not a UDM entity. UDM tables remain current-state-focused. Audit data is captured by storage-layer history, dedicated audit tables, event streams, or any combination, depending on deployment. Persistence and capture mechanism are implementation choices.

### Canonical audit record shape

A single change-history record, however persisted, carries these fields:

- **Subject_Table** (required). The UDM table the change occurred in (e.g., `Protocol`, `Award`, `Personnel`).
- **Subject_Record_ID** (required). The PK value of the row that changed, as a string.
- **Action_Type** (required). Constrained: `CREATE` / `UPDATE` / `DELETE` / `RESTORE`. `RESTORE` is for soft-delete reversal where applicable.
- **Action_Timestamp** (required). When the change occurred. UTC, with timezone awareness.
- **Actor_Personnel_ID** (required). The person who made the change. Null only when the change is system-initiated (data migration, scheduled job), in which case a stable system identifier is documented.
- **Old_Values** (conditional). The field-level prior state. Required for `UPDATE` and `DELETE`. JSON object keyed by column name, or a structured equivalent. Implementations may capture full row state or field-level deltas.
- **New_Values** (conditional). The field-level new state. Required for `CREATE` and `UPDATE`. Same shape as Old_Values.
- **Context** (optional). Free-form structured context: session identifier, request identifier, IP address, reason for change. Carried as a JSON object or named columns at implementation choice.

### Mapping from storage-layer history

Versioned-storage deployments do not explicitly write audit records. The shape is recoverable via time-travel queries:

- `Subject_Table` and `Subject_Record_ID` identify the row.
- `Action_Type` derives from whether the row exists in the prior snapshot (CREATE), changed (UPDATE), or is gone (DELETE).
- `Action_Timestamp` is the commit timestamp.
- `Actor_Personnel_ID` is the committer identity (provided the storage layer captures it).
- `Old_Values` and `New_Values` are the projections of the row at prior and current snapshots.
- `Context` is the commit message or transaction metadata, if captured.

An institution using Dolt or Iceberg satisfies the pattern via query projection; an institution using an application-layer audit table satisfies it via direct INSERT on each change. Both produce data conforming to the same shape.

### Recurrences

- **Storage-layer versioning** in Dolt, Trino + Iceberg, Postgres temporal tables, SQL Server temporal tables, and similar implementations. Shape recovered via time-travel queries.
- **Application-layer audit tables** in institutions running plain Postgres or similar. OpenERA's `ActivityLog` table is one example (Table_Name, Record_ID, Action_Type, Action_Timestamp, User_ID, Old_Values, New_Values, IP_Address, Session_ID). Shape conforms with field-name differences.
- **Event-stream change-data-capture** pipelines feeding downstream consumers. Shape conforms to the field set; persistence is the stream.

### Notes

- Granularity is an implementation choice. Row-level audit captures the full row on each change; field-level audit captures only the columns that changed. The pattern accommodates both: Old_Values and New_Values may be full rows or column-level deltas. The granularity choice is documented per deployment.
- Retention is not specified by the pattern. Institutional and regulatory requirements drive retention; implementations choose accordingly.
- System-initiated changes (data migrations, scheduled jobs) record a stable system identifier in `Actor_Personnel_ID` (e.g., `system.migration.v2025_06_15`). The identifier convention is institutional.
- Soft-delete restoration (undelete) is captured as `Action_Type = RESTORE`. Implementations that do not support soft delete need not implement this value.
- This pattern complements the principle that UDM tables hold current-state primary data. Audit data is primary historical data; the pattern lets it be captured outside UDM in a portable shape.

---

## Adding a new pattern

When a recurring pattern emerges from module design work, add it here. Criteria:

1. **Recurrence.** The pattern shows up in at least two existing or proposed modules. Single-use compositions are not patterns; they are entity designs.
2. **Composition or canonical shape.** The pattern either assembles existing UDM entities (composition pattern) or documents a canonical shape for derived data produced by layers built on UDM (shape convention). New entities introduced solely to make a composition pattern work belong in their own module spec first; the pattern document references them after.
3. **Normative behavior.** The pattern specifies what implementations must do (the lifecycle, the constraint, the composition, the field set). Variants and optional behavior are documented in the Notes section.
4. **Concrete recurrences.** Each pattern lists the specific places it appears, by entity and module (for composition patterns) or by engine and institution (for shape conventions). Hand-waving "this could be used for X" does not count.
