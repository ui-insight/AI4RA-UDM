# UDM Changelog

All notable changes to the Unified Data Model are documented here.

The UDM follows [Semantic Versioning](https://semver.org/):
- **MAJOR** when incompatible schema changes are made
- **MINOR** when entities or columns are added in a backward-compatible way
- **PATCH** for documentation, convention clarifications, or fixes to non-load-bearing rules

## [Unreleased]

### Sponsored project lifecycle (3.0, breaking)

- **A proposal has three status stages.** `Internal_Approval_Status` (Draft, In_Review, Returned, Approved, Rejected), the new derived `Submission_Status` (Unapproved, Unsent, then the newest attempt's status), and `Decision_Status` (Unsubmitted, Pending, Intent_to_Award, Awarded, Declined). Each stage's floor names the gate it waits on. `Decision_Status` loses Submitted, Under_Review, and Withdrawn, which were submission states; `Internal_Approval_Status` loses Withdrawn and gains Returned. Migration: Submitted and Under_Review become Pending with the corresponding attempt; a withdrawn proposal becomes Unsubmitted with a Withdrawn attempt.
- **`SubmissionAttempt`** (Funding Cycle) records each transmission of a proposal: attempt number, channel, who sent it, when, the sponsor's reported status, tracking identifier, acknowledgement, and the package hash. It supersedes the "Sponsor submission events" convention; `Sponsor_Submission` leaves the ActionType values. Migration: each such Action row becomes one attempt (Completed → Submitted, Failed → Failed, `Completed_Date` → `Submitted_At`, `Outcome_Description` → `Tracking_Identifier` or `Notes`).
- **Every closed vocabulary carries per-value definitions.** Each value on each of the 72 status and classification columns has a `definition`; lifecycle values also carry `set_by` (who or what sets it) and `next` (the values that may follow; empty for a terminal value). The validator requires the definitions to cover the allowed values exactly and the transitions to name allowed values. The data dictionary carries them.
- **The optional modules' 24 closed vocabularies are allowed values, not description text.** Their lists lived only in "Constrained: ..." sentences, so the conformance checker treated them as open and no DDL CHECK was emitted. They now carry `allowed_values` and `value_definitions` like the core.
- `Proposal.Submission_Version` and `Submission_Date` are derived from the attempts. A `PreAwardAuthorization` requires the Proposal's `Decision_Status` to be Pending or Intent_to_Award. Documents and Communications attach to a SubmissionAttempt. `SubmissionChannel` is a canonical value group.

### Roles (3.0, breaking)

- **`AwardRole` becomes `TeamRole`, anchored on the proposal.** `Proposal_ID` is required and stable; `Award_ID` or `Subaward_ID` is set once funded, both null at the proposal stage. On award creation the proposal-stage rows are copied as award-stage rows that point back through `Previous_TeamRole_ID`. The UDM could not say who was on an unfunded proposal, and the Effort `Proposed` stage was unreachable; both are fixed. Migration: every `AwardRole` row becomes a `TeamRole` row with `Proposal_ID` taken from its agreement's `Proposal_ID`; the `AwardRole` value group becomes `TeamRole`; `Effort.AwardRole_ID` becomes `Effort.TeamRole_ID`.
- **Staff assignments live on `OrganizationRole`**, which gains a `Proposal_ID` scope and the recommended roles `Sponsored_Programs_Administrator`, `Award_Administrator`, `Administrative_Contact`. Which person at the office is responsible for a record is a role at that office scoped to the record.
- **Standing authority is a credential.** `PersonnelCredential.Credential_Type` gains `Authorized_Organizational_Representative`, `Signatory_Delegate`, `Empowered_Official`. `ProposalApproval.Approval_Role` gains `Authorized_Organizational_Representative`: the sign-off that binds the institution is the AOR's act, and being central pre-award staff does not make someone an AOR.

### Approval chain (3.0, breaking)

- **`ProposalApproval` is retired and replaced by `Approval`, a polymorphic Records table** attached to Proposal, Modification, Subaward, PreAwardAuthorization, Closeout, or Report. Each step carries what is decided (`Step_Type_Value_ID`, new group `ApprovalStepType`), who decides (`Approval_Role`), the reviewing unit, a topic for supplementary reviews (new group `ReviewTopic`), a block order, a round, the assigned and acting persons, a delegate for release to submit, a status that includes `Voided`, the signed package hash, and the action date. Blocks run in parallel, returns rerun steps in a new round, and a sign-off is voided when the package it approved changes. The core had two approval-step shapes and a worked example that contradicted its own closed list; it now has one.
- `Proposal.Internal_Approval_Status` is derived from the Approval rows of the current round. Internal routing of a Modification is Approval rows; `Modification.Approval_Status` stays the sponsor's decision.
- Migration: every `ProposalApproval` row becomes one `Approval` row with `Related_Entity_Type = Proposal`, `Approval_Round = 1`, `Approval_Role` unchanged, and `Step_Type` from the role: PI → PI_Certification; Co_Investigator → Co_PI_Certification; Department_Chair and Center_Director → Department_Review; College_Dean → College_Review; Compliance_Office → Compliance_Review; OSP_Pre_Award → Pre_Award_Review; Authorized_Organizational_Representative → Final_Sign_off; VPR and Other → Supplementary_Review. `Related_Entity_Type` values `ProposalApproval` on Document, Deadline, and Action become `Approval`.
- `ProtocolReviewStep` stays in the compliance module for this release; a core release cannot change a module table. A later module release can retire it by declaring its parents as Records targets.

### Award statuses and enumerations (3.0)

- **`Award_Status` gains `Terminating`**, parallel to `Closing`: a termination notice received and being processed, before `Terminated`.
- **`Priority` on Award and Modification** (`Low` / `Medium` / `High` / `Critical`, default `Medium`): someone records a rush, and turnaround reporting needs it.
- **`Subaward_Status` gains `Closing`**, restoring award/subaward symmetry. **`Modification.Approval_Status` gains `Withdrawn`** for a request withdrawn before a decision. **`ModificationEventType` gains `Advance_Funding`**; a prior-approval request is a Modification in `Pending`, not a kind of modification.

### Changed

- **The DDL and seed generators enforce module dependencies.** Declaring a module without one it requires (for example `animal_research` without `compliance_protocols`) stops with an error naming the missing module. The DDL generator used to emit the tables with a comment where the cross-module foreign key should have been.
- **Seven polymorphic Records tables again.** Approval attaches polymorphically, and the prose section introducing the Records tables and the summary list now say so; the README example of `Award_Status` lists the current values; the conformance specification describes the declaration's flat `tables` key by where a table sits in the schema file.
- **The schema file is reorganized.** Everything specified is a module, and a rule lives on the thing it governs. Five top-level keys replace twenty-five: `metadata`, `types` (the abstract vocabulary and one mapping per engine), `conventions`, `modules` (`core` and `optional`, every module the same shape: name, story, tables, conventions, example views), and `implementation_tables`. Constraints sit on their table, derivation rules and synonyms on their column, status vocabularies only on the column that carries them. The narrative blocks (scope, architecture prose, summary, local-extension guidance) leave the JSON; the prose specification is authoritative on intent and already carries them. The file is written in canonical machine layout. No table, column, constraint, rule, synonym, convention, or view is added, removed, or changed in meaning. Consumers of the old layout must update their paths; the validator, the sync checker, the conformance checker, the data generator, and the metaschema are updated.
- **`PolicyException.Exception_Status` and `CommunicationResponse.Response_Status`** carry their closed vocabularies as allowed values on the column. Both lists existed only in the status-taxonomy block, so the conformance checker treated the two columns as open.
- **Six polymorphic Records tables, not seven.** The attachment convention said seven and listed six; CommunicationResponse is the seventh Records table but attaches by a plain foreign key.
- **Conditional rules name value sets, not orderings.** "Report_Status ≥ Submitted" and "Subaward_Status ≥ Pending" compared statuses that have no order; the Lifecycle_Stage rules on Budget and CostShare now also name their stages outright. Every such rule lists the values it means.
- **Document versions increment.** `Version_Number` is 1 for the first version and the predecessor's number plus one along the `Parent_Document_ID` chain; the rule is a constraint on Document.
- **PI exclusivity and the single Contact PI hold on every date.** The structured forms anchored their active-row filter to today, so a tool enforcing them would have allowed two people to hold PI on a past date. The filter is now bound to a date D and the rule holds for every D; the constraint vocabulary says what `for_every` means.
- **The hierarchy convention no longer lists the lifecycle-chain tables.** Budget, Effort, CostShare, and Payment carry a `Parent_TableName_ID` column that is a stage chain, and ComplianceRequirement's is a renewal chain, not a hierarchy. The convention lists the five true hierarchies and names the chains separately.
- **Vocabulary columns carry `value_group` and `recommended_values` as fields.** Thirty-two `*_Value_ID` columns had both only inside their description text, the same pattern that let the Deadline target list drift. The description now says what the column means; the group and the recommended codes are machine-readable, and the validator checks every group against the declared canonical and module groups and that every declared group is used.
- **`IndirectRateType` leaves the canonical value groups.** No column references it; `IndirectRate.Rate_Type` is a closed list on the column.
- **The current-end-date derivation breaks ties.** Two approved modifications with the same effective date resolve by the higher `Modification_Number`.
- **`Effort.Person_Months` is person-months.** Its description and a constraint said it stored the months-per-year denominator (12, 9, or 3), which `Calendar_Type` already determines. The column holds the person-months figure sponsors report, derived from `Effort_Percent` and `Calendar_Type`.
- **Lineage chains are acyclic.** `Previous_Proposal_ID` and `Previous_Award_ID` gain the rule that following the chain reaches a root; the originating-record derivations walk these chains.
- **"Resolves to" is defined once.** A vocabulary column resolves to a canonical code through the referenced row's `Canonical_Value_Code`, falling back to `Value_Code`. Dozens of rules used the phrase without a definition.
- **Derivations read active modifications only.** `Current_End_Date` and `Current_Total_Funded` exclude Modifications with `Is_Active = false` and recompute when that flag changes; the rules named only `Approval_Status`.
- **A same-stage successor deactivates its predecessor.** The chain conventions said a superseded row "may" be marked inactive; an Effort recertification that left the old Certified row active would violate the per-stage non-overlap rule. The predecessor is marked inactive, so the two rules compose.
- **Budget `Version_Number` is scoped per stage.** It starts at 1 within each `Lifecycle_Stage` and increments per revision; the uniqueness key already implied this.
- **`metadata` points at the conformance rules and checker**, alongside the spec source and changelog.
- **Column types are the abstract vocabulary; the file names no engine.** Every column's `type` is now `ID`, `Money`, `Status`, and so on, taken from the prose specification, which already used them. `types.dialects` carries one mapping per engine (MySQL and PostgreSQL to start); `metadata.dialect` is gone. The conversion found the two artifacts had drifted: the prose vocabulary table and the JSON mapping disagreed on three lengths, twenty-eight module columns were narrower than the mapping, and the Status mapping was a sentence rather than a type.
- **`LongName` joins the type vocabulary** for titles and long names. The five title columns and a free-text description had been typed `URL` for want of a long-string type; the description is `LongText`.
- **`scripts/generate_ddl.py`** resolves a dialect mapping into CREATE TABLE statements, with keys and CHECK constraints for closed vocabularies. The build publishes generated DDL for every mapped dialect under `/ddl/`. A reference implementation under the code license, not part of the standard.
- **Chain pointers are named `Previous_*_ID`; `Parent_*_ID` is a hierarchy only.** Six columns are renamed: `Budget.Parent_Budget_ID`, `Effort.Parent_Effort_ID`, `CostShare.Parent_CostShare_ID`, `Payment.Parent_Payment_ID`, `ComplianceRequirement.Parent_ComplianceRequirement_ID`, and `Document.Parent_Document_ID` become `Previous_*_ID`. Each points at an earlier row of the same table (an earlier stage, a prior renewal, a prior version), which is what `Previous_Proposal_ID` and `Previous_Award_ID` already meant. `Parent_*_ID` now means a hierarchy and nothing else: Organization, Account, Award segments, Subaward, AllowedValues. One name no longer carries two meanings. Breaking for consumers of the renamed columns; a one-to-one rename.
- **`Quantity` joins the type vocabulary** for plain decimals. `Effort.Person_Months` and `OtherSupport.Annual_Effort_Months_Calendar` were typed `Percent` because no other decimal type existed.
- **`Closeout.Records_Retention_End_Date` carries its derivation rule** instead of saying "computed from" in prose.
- **A declared Records target is accepted by every attachment table.** The registry rule never said which of the six tables honored a module's declared targets.
- **Conventions, audit columns included, apply to every module.** The statement that optional modules follow every core convention was lost in the reorganization and is restored on `modules` and on the audit-columns convention.
- **ProtocolCoverage's open-coverage rule is declared with the type that means it.** It used `at_most_one_true_in_partition` with no boolean column; it is a conditional `unique_scope`, and the vocabulary now allows a condition.
- **Reversing a Modification unwinds its Budget rows.** The Current-stage rows it created are marked inactive and the prior Current row becomes the leaf again; the derivations already excluded the reversed Modification, and the chain now agrees with them.
- **Three stale statements corrected.** The prose architecture table omitted PolicyException from Compliance; the prose summary still named the pre-2.2 domains "Money" and "Attachments"; the README's table count read as 47 core plus 2 when it is 45 plus 2.
- **Cross-artifact drift found by reading the set together.** `Late` is removed from the statuses that require a submission date: a late report is overdue, not submitted. `Source_Record_ID` is typed `ID` in both artifacts (the JSON said `ShortCode`). Negotiation leaves the two-FK exclusive-or convention; its rule is at-least-one-of three parents and lives on the table. Each example view declares `dialect: mysql`. The prose said "three mechanisms" and listed two, and dated a column addition to a past release. The README's sample code read the pre-reorganization layout. The 2.3.0 release date in `metadata` matches the changelog.
- **Three prose corrections.** The role-bearer convention claimed there is no denormalized PI column on Award while `Current_PI_Personnel_ID` exists as a documented derived column; the ActionType recommended list omitted `Sponsor_Submission`, which the submission convention requires; a constraint-catalog row ran into the next heading.
- **Lifecycle closure is a complete rule set, not two examples.** When an award or subaward becomes Closed or Terminated: open roles and open compliance coverage are end-dated, active restrictions expire or are lifted, a prime closes only after its subawards and terminates them when it terminates, and actions, deadlines, and reports are unchanged because closeout is what generates them. Anything not named is unchanged. The mechanism stays the adopter's choice. Previously two illustrative rules read as the whole list.
- **`scripts/generate_seed.py`** emits the reference rows a new database needs: one AllowedValues row per recommended code in each value group, with the canonical code set, and the SF-424 R&R budget categories, which the schema described but never listed. The build publishes seed files beside the DDL. Reference data, not sample data; a reference implementation under the code license.
- **The DDL generator consumes the structured constraints.** Exclusive-or, at-least-one, at-most-one, same-row conditional-required, and unique scopes are emitted as CHECK and UNIQUE constraints (partial unique indexes on PostgreSQL). Every rule it cannot express, and every derivation rule, is listed at the end of the generated file table by table, so the DDL carries the list of what the adopter still owes.
- **Timestamp semantics across engines.** The type vocabulary states that an engine whose mapped type carries no zone stores UTC.
- **Twelve status columns get real descriptions.** They said "See Status taxonomy", which pointed at the block the reorganization removed; each now says what the column means and what its non-obvious values signify.

Five fixes from a cold read of the schema file, each at the cause. No table is renamed or removed.


- **`Deadline.Related_Entity_Type`** gains `Communication`. The column description and `CommunicationResponse` already required it; the allowed-values list did not carry it.
- **`Action_Status`** gains `Failed`: the action was attempted and did not achieve its outcome. The sponsor-submission convention has used the value since 2.1 without the taxonomy carrying it. `Completed_Date` is required for either terminal outcome.
- **End-date change is signalled by `New_End_Date`, not by an event-type list.** `Award.Current_End_Date` and `Subaward.Current_End_Date` derive from approved Modifications with a non-null `New_End_Date`. The Budget-chain convention discriminates on `Funding_Change_Amount` and `New_End_Date` rather than on event classes. The old lists named `Continuation`, which is not a modification event type, and classified `Supplement` by a data-dependent qualifier.
- **`AllowedValues.Parent_AllowedValue_ID`** (new, self-referencing) carries two-level vocabularies. `CommunicationResponse.Response_Value_Value_ID` now references a `CommunicationResponseValue` row whose parent is the `CommunicationResponseType` row it answers. The type-to-value-set mapping was previously left to the host system with no specification.
- **Canonical value groups** gain `CommunicationResponseType` and `CommunicationResponseValue`.

## [2.3.0] — 2026-08-28

The optional-modules debut: the first release where the module taxonomy is exercised. The core is unchanged at 47 tables; six optional modules specify 24 additional tables, adopted by declaration. Implements roadmap issues #60, #69, #70.

### Added

- **`optional_modules`** top-level key in the JSON artifact: each module self-describes its story, dependencies (`requires`), Records target registry declarations, AllowedValues group declarations, tables, and cross-row constraints. Module prose specifications live in `vignettes/modules/`, one file per module, generated from and sync-checked against the artifact.
- **Compliance Protocols** (spine, 8 tables): Protocol, ProtocolCoverage, ProtocolPersonnel, the polymorphic ProtocolReviewStep, and four peer event entities (Amendment, ContinuingReview, AdverseEvent, Deviation), each with its own approval lifecycle. Notification cycles compose from core Communication + Deadline + CommunicationResponse.
- **Animal Research** (5 tables, requires the spine): species with USDA pain categories, procedures, hazards, 3Rs alternatives searches, closure reports.
- **Human Subjects** (3 tables, requires the spine): populations with vulnerable-population flags, interventions, consent approaches.
- **Biosafety** (2 tables, requires the spine): biological agents with risk groups, containment procedures.
- **Governance** (4 tables): Committee, CommitteeMember, Meeting, MeetingAttendance. Member classifications attach as core Classification rows; quorum logic is application code.
- **Committee Protocol Review** (2 tables, requires spine + Governance): MeetingProtocolReview with per-review vote tallies, MemberRecusal with permanent or per-meeting scope.
- Validator now enforces the encapsulation rule structurally: module FKs may target only the core, the module's own tables, or declared dependencies; module tables may not collide with core; records_targets must be module-owned. Sync checker covers module vignettes.

### Conformance

An implementation declares its modules, e.g. "UDM 2.3 core + modules: compliance_protocols, human_subjects, governance." An IRB-only institution never carries an animal-use table.

## [2.2.0] — 2026-08-28

Taxonomy release. No tables added or removed; the model's organizing structure and vocabulary are unified. Machine-readable and human-readable lingo now match exactly.

### The module taxonomy (normative)

Everything specified is a **module**: a named, fully specified, versioned slice of research administration capability. **Core modules** (formerly "domains") are the universal capabilities, required of every implementation. **Optional modules** (formerly "standard modules") are adopted by declaration. **Local extensions** (formerly "optional extensions") are institution-specific and unspecified. Implementation tables remain outside the capability taxonomy. Two laws govern every module:

1. **Capability criterion.** A module must be a capability an institution recognizably exercises ("we do X"); universality decides the tier; modules are carved by story, never by abstraction depth.
2. **Encapsulation rule.** A module adds only its own tables, referencing the core by foreign key; it never adds columns to, alters constraints of, or extends the closed vocabularies of the core or other modules. Sanctioned extension points: the Records target registry and AllowedValues value groups. Anything more is a core change in a core minor release, with the module declaring a minimum core version.

### Renamed (breaking for artifact consumers)

- JSON keys: `domain_membership` → `core_module_membership`; per-table `domain` → `core_module`; `optional_extensions` → `local_extensions`; `architecture.conformance_tiers` → `architecture.module_taxonomy`. The generated data-dictionary field `domain` → `core_module`.
- Core modules: **Money → Finance**; **Attachments → Records** (the records that accumulate around the work).
- All prose, dashboard, and README language moves from "domain" to "core module."

### Roadmap renumbering

Optional modules (Compliance Protocols spine + Animal Research / Human Subjects / Biosafety regime modules, Governance, IP) target v2.3; the Outputs core module targets v2.4.

## [2.1.0] — 2026-08-26

Cleanup release: the model sheds infrastructure entities that belong to other architectural layers and gains two small, broadly useful entities. 49 → 47 tables. Implements roadmap issues #66, #67, #68, #61, #65, #63, #64.

### Architectural changes

- **Three-layer architecture documented in the spec** (issue #66). A top-level Architecture section names System of Record / System of Insight / System of Engagement, states that the UDM is the data model of the System of Record, defines the regeneration test, and introduces conformance tiers (core / standard modules / local extensions).

### Entities removed (breaking)

- **`ActivityLog`** (issue #67). Row-history events are redundant with the storage layer's versioned history; operator-action events are observability and belong in the System of Engagement. Migration: `data_change` / `field_change` / `status_transition` / `submission_status_change` consumers switch to storage-layer history queries projecting the "Audit record shape" pattern; `operator_action` consumers move capture to application logging.
- **`SubmissionProfile`, `SubmissionPackage`, `SubmissionAttempt`** (issue #68). Submission-tooling artifacts, not research-administration source-of-truth. The RA fact ("submitted to this sponsor on this date with this confirmation number") is captured as an `Action` row with `Action_Type = 'Sponsor_Submission'` per the new semantic convention. Migration: each historical attempt becomes one Action row (Submitted timestamp → Completed_Date, status → Action_Status, confirmation number → Outcome_Description); package metadata and connection profiles move to the institution's submission tooling.

### Entities added

- **`PolicyException`** (Compliance, issue #61). Institutionally granted exceptions to sponsor or institutional policy rules (PI eligibility, COI management, cost share, indirect rate), scoped to a person and optionally to one Proposal / Award / Subaward.
- **`CommunicationResponse`** (Attachments, issue #65). Per-recipient structured responses to a Communication, composing with a Deadline on the Communication for response windows. Covers designated-member-review polling, RPPR sign-off, COI reminders, JIT collection, effort-certification reminders.

### Other changes

- `Sponsor_Submission` added to recommended ActionType values; new "Sponsor submission events" semantic convention (20 conventions total).
- `Communication` added to Deadline's allowed polymorphic targets (response windows attach to notifications).
- Worked examples added to the spec: encoding fixed approval chains on ProposalApproval, and correspondence-with-follow-up via Communication + Action (issues #63, #64).
- Audit-authority guidance simplified to two mechanisms (Updated_At, versioned storage).
- Cross-row constraints for the new entities; 71 constraints total.

## [2.0.1] — 2026-08-26

Documentation and hygiene release. No structural changes to tables, columns, or constraints.

### Changed
- Filled in 289 previously blank column descriptions across all 49 tables.
- Dissolved the `Reference` domain: `AllowedValues` and `BudgetCategory` are now classed as implementation tables (a new `implementation_tables` key in the JSON) rather than a domain. The model has 6 domains plus two implementation tables.
- Marked `PersonnelCredential.Credential_Value` and `ContactDetails.Contact_Value` as PII.
- Added `CostShare` to the documented two-FK exclusive-or list; documented the `AllowedValue_ID` identifier exception and the ActivityLog target-enumeration exception; expanded the Boolean naming note.
- Added 'project' and 'grant' to Award entity synonyms; adjusted `Award_ID` and `Award_Title` synonym lists.
- Removed commercial product names from all descriptions, synonyms, examples, and extension entries. Source systems are now described by role (ERP financial system, eRA platform, HR system). Federal sponsor systems (Grants.gov, eRA Commons, Research.gov) remain named because integrating with them is itself a research administration requirement.
- Reframed the v2.1 issue drafts requirement-first.

### Added
- `Unfunded agreements` entry in the optional-extensions registry (MTA, DUA, NDA, teaming agreements, MOUs).
- Validation tooling: a formal metaschema for the JSON artifact (`schemas/udm_schema.metaschema.json`), a structural and referential validator (`scripts/validate_schema.py`), and a prose/JSON sync checker (`scripts/check_spec_sync.py`), all wired into CI.

## [2.0.0] — 2026-06-11

UDM v2 is a major refactor of the model. It supersedes UDM v1.

The JSON serialization lives at the repository root as [udm_schema.json](../udm_schema.json). (The v1 file carried that name beside `udm_schema_v2.json` until 2026-10-21, when the current schema took the name; v1 is read from the v2.0.0 release.) The canonical prose specification lives in [udm-v2-system-of-record.md](udm-v2-system-of-record.md); the architectural overview is in [ontology.md](ontology.md).

### Architectural changes

#### Entities dropped
- **`Project` as a first-class entity.** "Project" means different things to different users depending on their current eRA and finance systems (a proposal, an award, a chart string, a longitudinal research effort), so keeping it as a first-class entity created dissonance with users; the term is avoided rather than redefined. Longitudinal-identity grouping is now handled by `Proposal.Group_ID` (user-maintained), `Proposal.Originating_Proposal_ID` (derived lineage root), and `Award.Group_ID` (pre-filled from originating Proposal at insert).
- **`ProjectRole`** → split into three parallel role tables: `AwardRole`, `OrganizationRole`, `ProtocolRole`. Each answers a different question (people on the work, people at an Organization, people on a protocol).
- **`ProposalBudget`, `AwardBudget`, `AwardBudgetPeriod`** → unified into a single `Budget` table with a `Lifecycle_Stage` discriminator (Proposed → Approved → Current → Actual).
- **`Invoice`** → subsumed by `Payment` with `Lifecycle_Stage = 'Invoiced'`.
- **`AwardDeliverable`** → renamed `Report` with broader scope (Progress, RPPR, FFR, Final, Invention Statement, Data Sharing, etc.).
- **`ProposalChecklistItem`** → generalized into the polymorphic `Action` attachment.
- **`SubmissionAttachment`, `SubmissionEvent`** → subsumed by `Document` polymorphic attachment + `ActivityLog`.
- **`ApplicationSystem`, `ServiceRequest`** → removed from canonical model; documented in Optional Extensions. Service tickets recommended as `Action` rows with `Action_Type = 'Service_Request'`.
- **`ProjectCohort`, `CohortParticipation`** → removed. Faculty-development cohorts deferred to local extensions.
- **`InventionDisclosure`, `InventionDisclosureInventor`** → removed. Invention disclosures, patent prosecution, licensing, royalty distribution, and spinout tracking live in specialized tech transfer management systems; Bayh-Dole touchpoint via `Report.Report_Type = 'Invention_Statement'`. (These two entities existed only in v1-era prose drafts, not in the v1 schema; listed here so the design decision is on record.)

#### Entities added
- `PersonnelCredential` — sponsor-system IDs (eRA Commons, NSF FastLane) and HR-domain credentials for non-employee Personnel.
- `OrganizationCapability` — functional roles an Organization plays, separate from structural `Organization_Type`.
- `OrganizationIdentifier` — UEI, EIN, DUNS, CAGE, IPF, IPEDS, sponsor-issued codes.
- `OrganizationRole` — people in roles at an Organization (committee members, program officers, AOs, vendor contacts).
- `ProposalApproval` — institutional routing chain (PI, Chair, Dean, OSP).
- `PreAwardAuthorization` — at-risk spending decisions before Award execution.
- `Negotiation` — bargaining lifecycle separate from agreed `Terms`.
- `Closeout` — multi-subworkflow closeout state object.
- `RateAgreement` — F&A rate agreement (NICRA) separate from individual `IndirectRate` line items.
- `Equipment` — capital asset tracking for closeout title-disposition.
- `Payment` — supersedes Invoice; carries Scheduled / Invoiced / Received / Reconciled stages.
- `ProtocolRole` — protocol-scoped personnel roster (responsible PI plus study staff).
- `ComplianceCoverage` — M:N junction between ComplianceRequirement and Award/Subaward.
- `OtherSupport`, `OtherSupportDisclosure` — biosketch Other Support and per-disclosure events.
- `Communication`, `Restriction`, `Deadline`, `Classification`, `Action` — polymorphic attachment tables.

#### Universal patterns added
- **Lifecycle_Stage discriminator** with chain immutability and no-branching rules. Used by Budget, Effort, CostShare, Payment.
- **Two-FK XOR attachment.** Eleven satellite tables (Budget, Payment, Modification, Transaction, Equipment, Report, Closeout, Terms, AwardRole, ComplianceCoverage, CostShare) attach to Award OR Subaward via two nullable FK columns; ContactDetails (Personnel or Organization) and Negotiation (Proposal, Award, or Subaward) use the same two-parent mechanics with different targets. On Budget and CostShare the exclusive-or applies only at post-award Lifecycle_Stages. Keeps Award and Subaward symmetric without duplicate sub-side tables.
- **Polymorphic attachment** with documented minimum-conformance behavior (no dangling refs on write, parent removal preserves attachments via soft delete, type-stable references).
- **Derived columns** with documented recompute triggers (Current_End_Date, Current_Total_Funded, Current_PI_Personnel_ID, Originating_*_ID, Subject_To_Federal_Funding).
- **Lineage mechanisms overview** — 12-column query-to-column map across Proposal / Award / Subaward.

#### Rule catalogs added
- **19 semantic conventions** covering rules that no column constraint can express (Modification vs Parent_Award_ID vs Previous_Award_ID, AwardRole role-bearer changes, Group_ID prefill, JIT cycle composition, Sponsor decision artifacts, etc.).
- **~70 cross-row constraints** with 11 typed structured forms (`xor`, `at_least_one_of`, `at_most_one_of`, `conditional_required`, `unique_scope`, `non_overlap_ranges`, `aggregate_equality`, `no_gap_periods`, `mutual_exclusion_by_canonical_role`, `at_most_one_true_in_partition`, `referenced_has_capability`, `referenced_status_is`). Code generators can emit deferrable constraints or trigger templates directly.
- **8 derived value rules** with recompute triggers documented in the spec.

### Scope changes

The v2 model adds an explicit scope statement separating what the spec covers (entities, relationships, cross-row constraints, semantic conventions, vocabularies) from what it does not (storage engine, enforcement mechanism, query patterns, numeric precision, UI/ETL).

Moved to Optional Extensions:
- Detailed Export Control workflow (TCPs, ECCN, BIS/DDTC licenses, foreign-national screening).
- Foreign-engagement and research-security disclosures (NSPM-33).
- Publications and research outputs.
- Invention disclosures and tech transfer.
- HR/payroll data (lives in HRIS).
- Detailed accounting / general ledger (lives in ERP).
- Cost transfer workflow (modeled via Transaction + Action).
- Data management plan compliance.
- IT inventory / application catalog (formerly `ApplicationSystem`).
- Service tickets and request tracking (formerly `ServiceRequest`; recommended as Action rows).
- Audit and findings tracking.
- Field-level audit / history tables (deferred to versioned storage).
- Clinical trial management.
- Human subjects participant payments.
- Multi-currency awards and subawards.

### Deployment & federation

- Documented single-tenant-per-institution deployment scope. Each deployment serves one operating Organization.
- Documented federation pattern: cross-institution analytics happen at a federation layer above the database, not in shared physical storage; reconciled via `Canonical_Value_Code` on AllowedValues.

### Documentation deliverables

- [vignettes/udm-v2-system-of-record.md](udm-v2-system-of-record.md) — canonical prose specification.
- [udm_schema.json](../udm_schema.json) — MySQL/MariaDB serialization at the repository root with structured constraints, derived values, 12 example views, ~200-entry column synonyms sidecar.
- [vignettes/ontology.md](ontology.md) — architectural overview describing v2.

### Migration from v1

Institutions migrating from v1 to v2 should:

1. **Replace Project** with `Group_ID` + `Originating_Proposal_ID` lineage on Proposal/Award.
2. **Replace ProjectRole** with the appropriate v2 role table (AwardRole for award-side staffing, OrganizationRole for organizational contacts, ProtocolRole for compliance protocols).
3. **Migrate budget tables** (ProposalBudget + AwardBudget + AwardBudgetPeriod) to the unified Budget table with Lifecycle_Stage. Preserve revisions via Parent_Budget_ID.
4. **Convert Invoice rows** to Payment with `Lifecycle_Stage = 'Invoiced'`.
5. **Rename AwardDeliverable** to Report; map deliverable types to the Report_Type taxonomy.
6. **Convert ProposalChecklistItem** to Action with `Action_Type = 'Checklist_Item'` polymorphically attached to the Proposal.
7. **Move ApplicationSystem, ServiceRequest, ProjectCohort, CohortParticipation, InventionDisclosure** to local extensions if needed.
8. **Build OrganizationCapability rows** for every Organization that participates in funding flows; cross-row constraints reference capability (e.g., Award.Sponsor_Organization_ID references an Organization with Capability='Sponsor').
9. **Populate Canonical_Value_Code** on AllowedValues rows for institutional roles that the spec's load-bearing constraints depend on (PI, Co_PI, Co_I, Multi_PI, Sponsor, Subrecipient, JIT_Request, Cost_Share, etc.).
10. **Convert sponsor-side and subrecipient-side contact tables** to OrganizationRole rows scoped to the relevant Award / Subaward / RFA.

A more detailed v1-to-v2 entity mapping is documented in [ontology.md](ontology.md) under "What changed from v1".

## [1.0.0] — prior

The pre-v2 model. Its schema file was removed from the repository on 2026-10-21 and is read from the [v2.0.0 release](https://github.com/ui-insight/AI4RA-UDM/blob/v2.0.0/udm_schema.json); the prior [ontology.md](ontology.md) revision is in git history before commit `92e21ed`.
