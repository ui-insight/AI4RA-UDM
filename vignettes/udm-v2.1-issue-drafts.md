# UDM v2.1 Issue Drafts

Drafted from a cold-read gap analysis comparing UDM v2 against the OpenERA application schema (`vignettes/openera-model-inventory.md`). Each section below is a self-contained GitHub issue ready to file.

---

## 1. Compliance protocol detail extensions (IACUC/IRB/IBC)

**Title:** Add compliance protocol detail entities for IACUC/IRB/IBC

**Labels:** `scope:schema`, `domain:compliance`, `priority:high`, `status:design-complete`

**Body:**

### Summary
Generic `ComplianceRequirement` + `ProtocolRole` cannot represent regulatory-mandated protocol detail: animal species and counts, USDA pain category per procedure, IRB risk level and intervention type, IBC biological agents and containment level, amendment lineage, annual continuing review, adverse-event reporting, protocol deviations.

### Status
Design complete. Full proposal lives at [`vignettes/udm-v2.1-compliance-protocols-proposal.md`](../vignettes/udm-v2.1-compliance-protocols-proposal.md) (standalone-module framing used for cold-read review).

### Outcome

Three-layer organization with one composition pattern. **18 new entities total.**

**Layer 1: Core protocol entities (3).** `Protocol` (root, regime discriminator, lifecycle), `ProtocolCoverage` (M:N to Award/Subaward with exclusive-or), `ProtocolPersonnel` (people on protocol with training status, optional Award/Subaward scoping).

**Layer 2: Workflow infrastructure (5).** `ProtocolReviewStep` (single polymorphic review-step entity, parent is one of Protocol, Amendment, ContinuingReview, AdverseEvent, or Deviation), `ProtocolAmendment`, `ProtocolContinuingReview`, `ProtocolAdverseEvent`, `ProtocolDeviation`. All four event entities have their own approval lifecycles and are reviewed via the shared `ProtocolReviewStep`.

**Layer 3: Per-regime sub-resources (10).**
- Animal use: AnimalUseSpecies, AnimalUseProcedure, AnimalUseHazard, AnimalUseAlternativesSearch, AnimalUseClosureReport (5).
- Human subjects: HumanSubjectsPopulation, HumanSubjectsIntervention, HumanSubjectsConsent (3).
- Biosafety: BiologicalAgent, BiosafetyProcedure (2).

All hung flat off `Protocol_ID`. No cross-regime coupling.

**Composition pattern (no new compliance entities).** Notification cycles (e.g., DMR/FCR) use the structured-response-collection pattern composed of `Communication` + `Deadline` + `CommunicationResponse`. The pattern itself is documented at [`vignettes/udm-v2-patterns.md`](../vignettes/udm-v2-patterns.md). `CommunicationResponse` is a new Attachments-domain entity proposed in issue #9.

### Key design decisions

- **Single polymorphic `ProtocolReviewStep`** replaces what would otherwise be five parallel review-step tables (one each for protocol, amendment, continuing review, adverse event, deviation). Saves four tables; eliminates the byte-identical-tables drift problem.
- **Per-regime sub-resources are flat and not unified.** Species ≠ Population ≠ BiologicalAgent. Lifting common columns from regime-specific sub-resources is explicitly avoided because the regulators do not share semantics.
- **Committee operations are NOT in the compliance module.** Lifted to a cross-cutting Governance module (separate UDM addition; see follow-on issue).
- **Amendment, ContinuingReview, AdverseEvent, and Deviation are peer event entities**, not status values on Protocol. Each has its own lifecycle and is reviewed via the shared `ProtocolReviewStep`.
- **One Protocol, one regime, one reviewing authority.** Multi-regime work (animal use with biohazards) is modeled as multiple Protocols (one IACUC, one IBC) each covering the same funding instruments.

### What's explicitly NOT included (decided against)

- IRB reliance agreement entity. Handled via Document attachment + existing Reviewing_Authority FK.
- Protocol suspension justification columns. Handled via the AdverseEvent / Deviation determination flow or generic Action attachment.
- Cross-protocol hazard reference. AnimalUseHazard / BiologicalAgent overlap is institutionally managed, not modeled in schema.

### Follow-on issues

- Governance module for committee infrastructure (new issue, separate from compliance).
- Compliance-Committee bridge entities (MeetingProtocolReview, MemberRecusal) (new issue, depends on Governance).
- Issue #9: CommunicationResponse entity (required for notification-cycle composition pattern).

---

## 2. PolicyException for institutional policy waivers

**Title:** Add PolicyException entity for institutional policy waivers

**Labels:** `scope:schema`, `domain:compliance`, `priority:high`, `status:design-complete`

**Body:**

### Summary
UDM v2 has no first-class concept for an institutionally granted exception to a sponsor or institutional policy rule. Adopters routinely grant case-by-case waivers: a research staff member requesting Co-PI eligibility against an appointment-type rule; a researcher whose external consulting arrangement is normally COI-disqualifying being granted a management exception; a sponsor requiring 0% F&A while institutional policy requires standard recovery. Without a structured entity, these exceptions land in free-text notes or ad-hoc tables and become invisible to downstream review engines.

### Outcome

**One new entity in the Compliance domain: `PolicyException`.**

A single, general-purpose entity for institutionally granted exceptions to any sponsor or institutional policy rule. Scoped to a Personnel record, optionally narrowed to a specific Proposal, Award, or Subaward. Carries justification, decision authority, decision notes, and an effective period.

| Column | Type | Required | Notes |
|---|---|---|---|
| PolicyException_ID | string | required | PK |
| Personnel_ID | string | required | → Personnel. The person to whom the exception is granted |
| Policy_Rule_Code | controlled-vocabulary | required | Identifies the rule being excepted. Recommended values: PI_Eligibility_Appointment_Type / PI_Eligibility_Degree / PI_Eligibility_Years_Since_Degree / Co_PI_Eligibility / COI_Disqualifying_Engagement / COI_Management_Plan_Required / Cost_Share_Minimum / Indirect_Rate_Minimum / Foreign_Collaboration_Restriction / Sponsor_Specific_Other |
| Requested_Action | text | required | What the exception enables. E.g., "Serve as Co-PI on this proposal despite non-tenure-track appointment"; "Receive direct funding despite outside consulting arrangement" |
| Justification | text | required | Why the exception is requested |
| Proposal_ID | string | conditional | → Proposal. Scopes the exception to one proposal |
| Award_ID | string | conditional | → Award. Scopes the exception to one award |
| Subaward_ID | string | conditional | → Subaward. Scopes the exception to one subaward |
| Requested_Date | date | required | When the exception was requested |
| Requested_By_Personnel_ID | string | required | → Personnel. Who submitted the request |
| Status | status | required | Constrained: Pending / Approved / Denied / Withdrawn / Expired |
| Decided_By_Personnel_ID | string | conditional | → Personnel. Required when Status reaches a terminal value |
| Decision_Date | date | conditional | Required when Status reaches a terminal value |
| Decision_Notes | text | optional | Decision authority's rationale |
| Effective_Start_Date | date | optional | When the exception takes effect (often = Decision_Date) |
| Effective_End_Date | date | optional | Null means indefinite or until policy changes |

At most one of (`Proposal_ID`, `Award_ID`, `Subaward_ID`) is non-null per row. All three null means a blanket exception scoped to the person (e.g., "this researcher's reduced effort minimum applies to all proposals during their sabbatical year").

### Key design decisions

- **PolicyException rather than EligibilityOverride.** The pattern is broader than PI eligibility: it covers COI exceptions, cost-share waivers, indirect-rate exceptions, foreign-collaboration policy exceptions, and any other institutionally-granted rule exception. One entity, one pattern.
- **Substantive entity, not a subtype of `Action`.** A policy exception is a regulatory event with its own structured data (which rule, scope, decision authority, validity period), not a generic work item. Action's "assigned / completed" lifecycle does not map cleanly to "requested / approved / denied / withdrawn / expired."
- **Not folded into `ProposalApproval`.** Exception grants are independent of proposal-routing approvals. An exception may be granted before any proposal is submitted (blanket exception) and a single proposal goes through approval steps regardless of whether any exceptions exist.
- **One row per person, even when multiple personnel on one proposal need the same waiver.** Exceptions are personal even when they share a triggering context. Captures who decided what for whom.
- **`Policy_Rule_Code` is a bare controlled-vocabulary string for v2.1.** Issue #3 (structured sponsor eligibility and compliance rules) is still open. If that issue resolves to add a structured `Rule` entity, PolicyException can be enhanced later with an optional `Rule_ID` FK alongside the string code. The decision here does not block on issue #3.
- **Lives in the Compliance domain**, alongside ComplianceRequirement, ProtocolRole, and ConflictOfInterest. Policy exceptions are regulatory/policy machinery, not identity data.

### Worked examples

**Example 1: PI eligibility exception for a research scientist on one proposal.**

A research scientist (Personnel: jsmith) wants to serve as Co-PI on Proposal P-2026-104. Institutional APM 45.22 normally requires tenure-track appointment for Co-PI role. VPR grants exception for this proposal.

One PolicyException row: Personnel_ID = jsmith, Policy_Rule_Code = PI_Eligibility_Appointment_Type, Proposal_ID = P-2026-104, Requested_Action = "Serve as Co-PI", Justification = [career narrative], Status = Approved, Decided_By = VPR.

**Example 2: Blanket COI management exception.**

A faculty member (Personnel: kjones) has an ongoing consulting relationship with a company that would normally be disqualifying under institutional COI policy. The COI committee grants a managed exception covering all of the researcher's federally-funded work for the academic year, contingent on quarterly disclosure updates.

One PolicyException row: Personnel_ID = kjones, Policy_Rule_Code = COI_Disqualifying_Engagement, all three scope FKs null (blanket), Requested_Action = "Maintain consulting relationship while leading federally-funded research, subject to management plan", Justification = [management plan summary], Effective_Start_Date = 2026-08-15, Effective_End_Date = 2027-05-15, Status = Approved.

**Example 3: Cost-share waiver for one proposal.**

Institution requires 25% cost share on all proposals to sponsor X. For Proposal P-2026-211, the PI requests waiver due to limited departmental funds. Dean approves.

One PolicyException row: Policy_Rule_Code = Cost_Share_Minimum, Proposal_ID = P-2026-211, Requested_Action = "Waive 25% institutional cost-share requirement for this proposal", Status = Approved, Decided_By = dean's office personnel.

### What's explicitly NOT included

- A separate "PolicyExceptionRequest" entity distinct from PolicyException. Request and approval are the same row, lifecycle moves through Status values.
- Documents attached to the exception (justification supporting letters, evidence). Use the existing Document attachment polymorphically.
- Workflow steps for exception review. If the institution wants a multi-step review (e.g., department signs off, then dean, then VPR), use the existing `ProposalApproval` pattern with the PolicyException as parent. Do not invent a separate PolicyExceptionReviewStep.

### Follow-on issues

- Issue #3 (structured sponsor rules) — if resolved, PolicyException can reference structured Rule entities by ID alongside the Policy_Rule_Code string.
- Downstream review engines (personnel review, COI evaluation, budget review) that need to consume PolicyException to determine "is this person/proposal/award currently subject to an active exception" — implementation pattern, not a schema issue.

---

## 3. Structured sponsor eligibility and compliance rules (DEFERRED to v2.2)

**Title:** Defer structured sponsor / institutional rule entities to v2.2

**Labels:** `scope:schema`, `domain:compliance`, `domain:sponsors`, `priority:medium`, `status:deferred`

**Body:**

### Summary
`AllowedValues` covers controlled vocabularies but not parameterized rules. Sponsor-specific eligibility ("PI must hold a doctoral degree within 7 years", "Covered Individual = senior_key_personnel above 25% FTE", "MFTRP required", "RST required effective 2026-01-01") is structured logic, not enumeration. The question is whether UDM v2.1 should formalize a structured rule entity, or defer to v2.2 once adopter feedback shapes the parameter requirements.

### Decision

**Defer to v2.2.** No new entities in v2.1.

### Reasoning

1. **PolicyException (issue #2) is forward-compatible with any future rule-entity design.** Adding a structured rule entity later means one optional FK column on PolicyException alongside the existing `Policy_Rule_Code` string. No breaking change.
2. **The cost of getting the rule shape wrong is high.** Rule parameters encode regulatory regime specifics that vary by sponsor and evolve with policy. Locking in a structure now without real adopter pressure means probably redesigning it in v2.2 or v2.3 anyway. Better to design once with feedback than twice without.
3. **No concrete adopter use case beyond OpenERA exists yet.** OpenERA's `SponsorCompliancePolicy` and `SponsorEligibilityRule` shapes encode institutionally-specific assumptions (APM 45.22 categories, local appointment vocabulary). Lifting them into UDM without seeing how other institutions model the same data risks abstraction without evidence.
4. **PolicyException + Policy_Rule_Code is sufficient for most v2.1 institutional use.** It captures the exception event; the rule definition can live in application config or institutional documentation. The "which specific rule instance was excepted" ambiguity is real but minor (institutions usually have one rule per type, not multiple).
5. **Aligns with the bloat-resistance principle.** Adding 1-6 entities for speculative completeness is scope inflation worth resisting.

### Options considered (for v2.2 reference)

**A. No structured rule entity. AllowedValues only.** Cheapest. Rule definitions live in application logic. Review engines can't read rule parameters from UDM.

**B. Single `PolicyRule` entity with JSON parameter blob.** One generic entity, JSON column for type-specific parameters. Loses schema validation per rule type.

**C. Multiple typed rule entities (OpenERA's approach).** `SponsorEligibilityRule`, `SponsorCompliancePolicy`, `InstitutionalPolicyRule` with type-specific structured columns. Schema validation per type but adds 3-5 entities and proliferates with new rule types.

**D. Hybrid: `PolicyRule` root + per-rule-type parameter sub-resources.** Mirrors the compliance-protocol Layer 3 pattern. Universal root + flat per-type sub-resources hung off PolicyRule_ID. Adding a new rule type adds one sub-resource. 4-6 entities.

When v2.2 picks this up, Option D is the strongest candidate because it matches the established compliance-protocol pattern.

### v2.2 prerequisites

Before this can be designed responsibly:
- At least two adopter institutions (beyond OpenERA) modeling sponsor-specific rule data. Compare their shapes; identify what's truly universal vs. institutionally-specific.
- Real query patterns from review engines that consume the rules. Without knowing what queries the data must serve, the structure is guesswork.

### Open questions (deferred to v2.2)

- Where do RFA-specific overrides of sponsor defaults live? `RFARequirement` already handles RFA-specific structured rules via Structured_Rule_Type/Value. Cross-cutting design question.
- Does this overlap with `ComplianceRequirement` enough to be a subtype rather than a peer?
- How does a structured rule entity integrate with PolicyException (FK direction, cardinality)?

---

## 4. Automated review findings (PATTERN, not entity)

**Title:** Automated review findings shape documented as pattern; no new UDM entities

**Labels:** `scope:docs`, `domain:review`, `priority:medium`, `status:design-complete`

**Body:**

### Summary
Review engines (rule-based and AI-driven) evaluate UDM source data and produce findings: "biosketch missing for PI on this proposal," "protocol's animal count exceeds approved cap," "RFA requires a Data Management Plan that is not detected." Findings carry severity grading, stable check-code identity, AI-vs-rule provenance, and an acknowledgment workflow. UDM v2 has no first-class concept for these and `Action` does not cleanly carry the shape.

### Decision

**Document as a shape convention in the patterns catalog. No new UDM entities.**

Review findings are derived data: re-computable from source data plus engine logic. Per the UDM design principle that UDM tables are source-of-truth only (derived tables belong in downstream layers), findings do not warrant their own UDM entity. The canonical shape is documented in [`vignettes/udm-v2-patterns.md`](../vignettes/udm-v2-patterns.md) under "Automated finding shape" so adopters producing findings do so consistently and the data is portable across review engines.

### What the pattern specifies

- Canonical finding fields: subject reference, Check_Code (stable identifier), Check_Category, Severity (pass/warn/fail/info), Message, Details, Is_AI_Generated flag, Engine_Identifier, Generated_At.
- Persistence is an implementation choice (relational table, document store, search index, ephemeral computation). The pattern does not specify where findings live.
- Acknowledgment workflow IS source-of-truth and belongs in UDM: use the existing `Action` attachment with `Action_Type = Finding_Acknowledgment`, the original Check_Code captured in notes, the reviewer as assignee, and Action.Status reflecting the decision (Acknowledged / Overridden / Resolved). Attach the Action polymorphically to the UDM entity the finding is about.

### Key design decisions

- **Findings are derived; UDM holds source-of-truth.** Review findings can be regenerated by re-running the engines against source data. Audit data, by contrast, cannot be regenerated and remains under separate scope review.
- **Pattern, not entity.** A pattern entry in the catalog documents the shape; institutions implementing review engines conform to the shape. UDM stays lean.
- **Acknowledgments stay in UDM via Action.** The decision to accept or override a finding is institutional source-of-truth data and persists in UDM even when the finding itself does not.
- **Same shape for rule-based and AI-generated findings.** Distinguished by the `Is_AI_Generated` flag only. Unified shape simplifies cross-engine consumption.

### What's explicitly NOT included

- No `ReviewFinding` entity in UDM. The OpenERA implementation has one; UDM does not.
- No `Acknowledgment` entity. Acknowledgments reuse `Action`.
- No Check_Code namespace registry. Institutions choose their own convention; a shared registry can emerge later if cross-institution comparison is demanded.

### Follow-on issues

- None blocking. The pattern stands alone in the catalog.
- If a shared Check_Code namespace registry emerges as a need, a separate v2.2+ issue captures it.

---

## 5. Checklist / requirement-tracking primitive (NO ENTITY; pieces already have homes)

**Title:** No ChecklistItem entity; derived items become SoI views, manual items use existing Action

**Labels:** `scope:docs`, `domain:workflow`, `priority:medium`, `status:design-complete`

**Body:**

### Summary
A monolithic `ChecklistItem` entity (as OpenERA implemented it) conflates three different kinds of data: derived requirement satisfaction, manual reviewer work items, and gating logic. None of the three needs a new UDM entity; each piece already has a home under the three-layer architecture.

### Decision

**Do not add a `ChecklistItem` entity to UDM v2.1.** The three components decompose as follows:

1. **Derived requirement satisfaction** ("Biosketch required by RFA, Document present", "PI training current", "Compliance approval in hand"). These are re-computable from existing UDM data plus rule logic. By the regeneration test they are derived data, and belong in the System of Insight as views, not as UDM entities.

2. **Manual reviewer work items** ("Reviewer reviewed budget and marked complete" with assignee, due date, completion notes). These are source-of-truth events. UDM v2's existing `Action` entity already handles them, with `Checklist_Item` already in the recommended `ActionType` value list alongside Deliverable, Service_Request, Modification_Approval, etc.

3. **Gating logic** ("Is_Blocker = true blocks state transition X"). This is institutional workflow logic, not data shape. The application enforces it by reading the SoI view ("are all critical items satisfied?") before allowing the transition. UDM does not model gating rules.

### Analysis

The OpenERA `ChecklistItem` table works because OpenERA conflates three concerns at the application layer. In a layered architecture each concern has its own natural home:

- **Why derived items don't belong in UDM:** Per the principle "UDM tables hold source-of-truth data," derived data belongs in the SoI layer as views. A `ChecklistItem` row for "Biosketch missing" duplicates information already present in UDM (RFARequirement + absence of Document). Persisting the row creates drift risk (the row says Missing but a Document was just uploaded) and adds maintenance burden.
- **Why manual items don't need a new entity:** `Action` is the canonical UDM entity for source-of-truth work items. `Action_Type = Checklist_Item` is already in the recommended list. Adding a parallel `ChecklistItem` entity duplicates `Action`'s purpose.
- **Why gating logic isn't UDM:** Whether "Is_Blocker = true blocks the Ready_For_Setup → Sent_To_Banner transition" is an institutional workflow decision encoded in application code. Different institutions gate differently. UDM models the data the workflow reads, not the workflow itself.

### Where each piece lives

| Concern | Home | Mechanism |
|---|---|---|
| Derived requirement satisfaction | System of Insight | View over RFARequirement + Document + COI + ComplianceCoverage + PersonnelCredential. Sample view added to `vignettes/udm-v2-system-of-insight-views.md` |
| Manual checklist work items | System of Record (UDM) | Existing `Action` entity with `Action_Type = Checklist_Item` |
| Unified checklist UI | Application layer | Composes the SoI view output with Action rows of type Checklist_Item into a single list for display |
| Blocker gating | Application workflow code | Reads the SoI view; allows or blocks state transitions accordingly |

### Counter-argument addressed

**"OpenERA's UI shows a unified checklist; doesn't UDM need to model that view?"** No. UDM models the data; the UI is built by composing the SoI requirement-satisfaction view (derived items) with `Action` rows of `Action_Type = Checklist_Item` (manual items) into a single list. The presentation layer does the merge.

### Related changes

- A `v_proposal_requirement_satisfaction` sample view added to `vignettes/udm-v2-system-of-insight-views.md` demonstrating how derived checklist items project from UDM data.
- `Checklist_Item` already exists as a recommended `Action_Type` value (no change needed).
- No schema change to UDM.

### What's explicitly NOT proposed

- No `ChecklistItem` entity.
- No `Is_Blocker` column anywhere in UDM.
- No `RFARequirement` materialization into per-Proposal rows; the view JOINs in real time.
- No prescription of how the application composes the unified checklist UI.

### Open questions

None. Decision is settled: no UDM entity, use existing Action for manual items, SoI view for derived items, application workflow for gating.

---

## 6. Project entity distinct from Award (ALREADY RESOLVED in v2.0)

**Title:** Project as a first-class entity (resolved in v2.0; no v2.1 action)

**Labels:** `scope:schema`, `domain:awards`, `status:resolved-in-v2.0`

**Body:**

### Summary
The cold-read gap analysis flagged that OpenERA has a `Project` entity (with `Parent_Project_ID` self-reference for multi-component awards) while UDM does not. The flag is real, but the absence is intentional: UDM v2.0 explicitly dropped `Project` as a first-class entity in favor of lineage helpers on Proposal and Award.

### Resolution (from v2.0 CHANGELOG)

> **`Project` as a first-class entity.** Longitudinal-identity grouping is now handled by `Proposal.Group_ID` (user-maintained), `Proposal.Originating_Proposal_ID` (derived lineage root), and `Award.Group_ID` (pre-filled from originating Proposal at insert).

Multi-component awards and longitudinal program lineage are handled by:

- `Proposal.Group_ID` and `Award.Group_ID`: user-maintained grouping for cohorts of related funding instruments (program project grants, center awards, NSF cooperatives).
- `Proposal.Originating_Proposal_ID` and `Award.Originating_Award_ID`: derived lineage root pointing back to the first proposal in a renewal / continuation chain.
- `Proposal.Previous_Proposal_ID` and `Award.Previous_Award_ID`: immediate predecessor link.
- `Award.Parent_Award_ID`: for incremental funding segments under one prime award.

Together these capture the longitudinal "what is the funded research line" question without a separate `Project` entity. Fields that OpenERA's `Project` carries (Title, Abstract, Start/End Date, Lead Organization, Status) are already present on Award (or recoverable via the lineage helpers).

### Why this stays the design

- Adding a `Project` entity would duplicate fields already on Award and Proposal.
- The "what funded research line is this" question is answered by following lineage helpers, which were introduced specifically to replace Project.
- Multi-component awards are modeled by `Award.Parent_Award_ID` (incremental segments under one prime) and `Group_ID` (related but separately-funded components).
- Effort, Budget, ProtocolRole, and all other downstream entities attach to Award, not to a parallel Project, simplifying the model.

### Migration note for v2.0 adopters

OpenERA migrating to UDM v2 would replace `Project` rows with the appropriate combination of `Group_ID` + `Originating_*_ID` lineage on the corresponding Proposal/Award rows. The v2.0 CHANGELOG migration guidance covers this (item 1 in the migration list).

### What's NOT proposed for v2.1

No change. `Project` stays out of UDM. No new lineage helpers beyond what v2.0 introduced. If a real adopter case emerges where the lineage-helper approach is genuinely insufficient (and not just "we used to have a Project table"), revisit in a future version with adopter-driven evidence.

---

## 7. Worked example: encoding fixed approval chains on ProposalApproval

**Title:** Add worked example: encoding fixed approval chains on ProposalApproval

**Labels:** `scope:docs`, `priority:low`, `status:proposal`

**Body:**

### Summary
A cold reader of the v2 spec assumed UDM's generic `ProposalApproval` and a fixed N-step institutional chain were interchangeable. They are not: `ProposalApproval` is a configurable sign-off sequence. Implementations with fixed chains (e.g., PI Cert → Department → College → OSP) need guidance on how to encode "this step is always third" and how to auto-assign reviewers.

### Context
The OpenERA application's `ApprovalStep` is a fixed 4-step chain (step_order 1-4, step_name from a constants registry) auto-created on submission with reviewer auto-assignment based on user role. The mapping from this concrete pattern to UDM's generic model is not obvious from the spec.

### Proposal
Add a worked example to the v2 schema doc showing:
- How to encode a fixed chain (sort order, step name vocabulary, assignment policy).
- How to encode a configurable workflow (per-RFA or per-sponsor variation).
- How auto-assignment policies are layered on the model.

### Open questions
- Is there a known case where an institution needs to vary the chain per proposal? If so, capture that example too.

---

## 8. Worked example: composing Communication + Action for correspondence with follow-up

**Title:** Add worked example: correspondence with follow-up via Communication + Action

**Labels:** `scope:docs`, `priority:low`, `status:proposal`

**Body:**

### Summary
UDM v2 provides `Communication` and `Action` as separate polymorphic attachment types. A common real-world pattern (inbound sponsor letter requiring a response by date X, linked to the Modification it drove) requires composing both. The spec describes them in isolation; nothing shows the composition.

### Context
The OpenERA application has a dedicated `AwardCorrespondence` table with embedded action-item fields (Action_Required, Action_Due_Date, Action_Assignee_ID, Action_Resolved_At) and a separate `AwardCorrespondenceModification` junction. A UDM-native equivalent would use `Communication` for the message, `Action` for the follow-up, and cross-link from either to a `Modification`.

### Proposal
Add a worked example to the v2 schema doc showing:
- Inbound Communication recorded against an Award.
- Linked Action with assignee and due date.
- Cross-link from the Communication (or Action) to the Modification it drove.
- How "action required / action resolved" lifecycle reads off the Action.

### Open questions
- Do we need any new fields on Communication or Action to make this pattern work cleanly?
- Should there be a documented convention for cross-linking attachments to other attachments (Communication → Modification, Action → Communication)?

---

## 9. CommunicationResponse for structured response collection

**Title:** Add CommunicationResponse entity for structured response collection

**Labels:** `scope:schema`, `domain:attachments`, `priority:medium`, `status:proposal`

**Body:**

### Summary
Several research-administration workflows depend on collecting structured per-recipient responses to a notification within a deadline. UDM v2 has `Communication` for the message and `Deadline` for the response window, but no entity to capture each recipient's structured response. Adopters either repurpose `Action`, invent module-specific tables, or store responses as freeform text in `Communication.Body`. None of these support querying who responded with what.

### Context

This pattern recurs across many parts of research administration:

- **IACUC DMR/FCR notification cycle** (PHS Policy IV.C.2): the coordinator notifies the committee about a protocol under review; each member responds with No_Objection or Request_FCR; if any member requests FCR, the protocol escalates to full committee review.
- **RPPR sign-off**: the PI requests co-PI sign-off on a Research Performance Progress Report; each co-PI responds Signed / Declined / Pending.
- **COI annual disclosure reminders**: the COI office reminds investigators to complete annual disclosures; each investigator responds Submitted / Declined / Extension_Requested.
- **IRB Full Board concurrence requests**: the IRB chair polls members on an out-of-cycle decision; each responds Concur / Object / Abstain.
- **Just-in-Time response collection**: the OSP requests JIT-required information from multiple personnel on an award; each responds with their portion.
- **Sponsor effort-certification reminders**: the OSP reminds PIs of effort statements due; each PI responds Submitted / Declined.

Each instance shares the same shape: a Communication (the message), a Deadline (the response window), and a set of structured per-recipient responses with type-keyed enumerations.

### Proposal

Add a single generic entity to the Attachments domain.

#### CommunicationResponse

A per-recipient structured response to a Communication. The originating Communication carries the message; a polymorphic Deadline (attached to the Communication) carries the response window; each recipient's response is one row in this table.

| Column | Type | Required | Notes |
|---|---|---|---|
| CommunicationResponse_ID | ID | required | PK |
| Communication_ID | ID | required | → Communication. The originating notification |
| Respondent_Personnel_ID | ID | required | → Personnel. The person whose response this row captures |
| Response_Type_Value_ID | ID | required | → AllowedValues with `Value_Group = 'CommunicationResponseType'`. Identifies what kind of response was solicited. Recommended values: DMR_FCR / RPPR_Signoff / COI_Annual / IRB_Concurrence / JIT_Component / Effort_Certification |
| Response_Value_Value_ID | ID | conditional | → AllowedValues with `Value_Group` keyed by `Response_Type_Value_ID`. Required when Status = Responded. The actual response value (e.g., No_Objection for DMR_FCR; Signed for RPPR_Signoff) |
| Responded_At | Date | conditional | Required when Status = Responded. Date the respondent acted |
| Notes | LongText | optional | Free-text comment from the respondent |
| Status | Status | required | Constrained: Pending / Responded / Declined_To_Respond / Timed_Out / Withdrawn |

The host system is responsible for enforcing the `Response_Type` → valid `Response_Value` mapping (a `Response_Type_Value_ID` of DMR_FCR allows `Response_Value_Value_ID` values from the DMR_FCR value group only).

### Composition pattern

A typical cycle:

1. Sender creates a `Communication` (the notification message) attached to the parent entity that the notification is about (e.g., a Protocol for DMR/FCR, an Award for RPPR sign-off).
2. Sender attaches a `Deadline` to the Communication for the response window.
3. The system creates one `CommunicationResponse` row per intended recipient with Status = Pending and Respondent_Personnel_ID set.
4. As recipients respond, their rows update to Status = Responded with `Response_Value_Value_ID` and `Responded_At` populated.
5. When the Deadline passes, any remaining Pending rows transition to Timed_Out by trigger, application logic, or institutional policy. The transition mechanism is unspecified; the lifecycle is normative.
6. Workflow logic for the originating cycle (e.g., "if any DMR_FCR response is Request_FCR, escalate to full committee") reads the CommunicationResponse rows and acts.

### Worked example: DMR/FCR notification cycle

A coordinator notifies an animal-use committee (5 members) about Protocol P-2026-014 under DMR. Response window is 5 business days.

Rows produced:

- 1 `Communication` attached to Protocol P-2026-014 with the notification body.
- 1 `Deadline` attached to the Communication with End_Date = (sent date + 5 business days).
- 5 `CommunicationResponse` rows, one per committee member, `Response_Type = DMR_FCR`, Status = Pending.

Four members respond No_Objection within the window. One member responds Request_FCR.

- 4 rows update to Status = Responded, `Response_Value = No_Objection`.
- 1 row updates to Status = Responded, `Response_Value = Request_FCR`.
- Workflow logic sees the Request_FCR response and escalates the protocol to full committee review at the next meeting.

### Worked example: RPPR sign-off

PI submits an RPPR for Award A-2026-088 with 3 co-PIs. PI requests sign-off from each co-PI; deadline is 7 days before the sponsor due date.

- 1 `Communication` attached to Award A-2026-088 with the sign-off request body.
- 1 `Deadline` attached to the Communication.
- 3 `CommunicationResponse` rows, one per co-PI, `Response_Type = RPPR_Signoff`, Status = Pending.
- Each co-PI responds Signed (or Declined), updating their row to Responded with the chosen value.

Same pattern, different `Response_Type`, different valid `Response_Value` enumeration.

### Open questions

1. **Pre-create vs post-create response rows.** Pre-create on notification gives clean "who hasn't responded yet" queries; post-create only when respondent acts is less data but harder to query. Recommendation: pre-create on notification.
2. **Single value FK vs per-type tables.** `Response_Value_Value_ID` referencing a single AllowedValues table with type-keyed value groups is simpler but pushes the type/value validation responsibility to the host system. Per-type response tables (DMRResponse, RPPRSignoffResponse, etc.) give better schema validation but reintroduce the table proliferation this proposal is trying to avoid. Recommendation: single value FK with documented type-keyed value groups.
3. **Recipient list modeling.** Is the set of CommunicationResponse rows itself the recipient list, or do we need a separate `CommunicationRecipient` entity? If the latter, what does it carry beyond Personnel_ID? Recommendation: the CommunicationResponse rows are the recipient list. Add a CommunicationRecipient entity only if delivery-channel detail beyond Status is needed.
4. **Mid-cycle recipient changes.** When a recipient is added after the notification is sent, a new CommunicationResponse row is added. When a recipient is removed, the existing row transitions to Status = Withdrawn. Worth documenting explicitly.
5. **Per-recipient deadlines.** Currently the Deadline is on the Communication, so all recipients share one window. Some workflows might want per-recipient windows (e.g., extensions granted to specific personnel). Recommendation: defer until a real use case appears; in the meantime, a per-recipient extension can be modeled as a new Deadline attached to the specific CommunicationResponse row.

### Dependencies

- No dependency on the compliance protocol proposal. CommunicationResponse stands alone and is usable by any module that needs structured response collection.
- The compliance protocol proposal (issue #1) benefits: the DMR/FCR notification cycle no longer needs a compliance-specific extension. The cycle is just Communication + Deadline + CommunicationResponse following this pattern.

---

## 10. Document the three-layer architecture in the UDM spec

**Title:** Document three-layer architecture (UDM is the data model of the System of Record)

**Labels:** `scope:docs`, `priority:medium`, `status:proposal`

**Body:**

### Summary
**The UDM is the data model of the System of Record.** That single claim, missing from the v2 spec, is the architectural anchor for the rest of the model. Without it, design decisions about what belongs and what does not (no audit entity, findings as a pattern rather than an entity, no derived tables, no auth or session entities) look arbitrary. With it, they follow from the architecture.

This issue proposes adding a top-level architecture section to the UDM spec that names the three-layer architecture (System of Record / System of Insight / System of Engagement), defines each layer, and establishes UDM's position as the data model of the System of Record. The change is documentation only.

### The three layers

| Layer | Standard term | Tech profile | Holds | Examples |
|---|---|---|---|---|
| 1 | System of Record | OLAP, versioned storage with transaction metadata capture | UDM source-of-truth data | Iceberg + Nessie, Dolt, Postgres with temporal tables |
| 2 | System of Insight | View / projection layer in the OLAP engine | Derived data: review findings, dashboards, reports, computed aggregates | Trino views, materialized views |
| 3 | System of Engagement | OLTP, transactional, user-facing | Non-UDM application infrastructure: auth, session state, AI endpoint config, in-flight wizard drafts | PostgreSQL or equivalent |

Between layers 1 and 3, ETL or streaming pipelines (e.g., Debezium change-data-capture) carry finalized application data into the System of Record. Layer 2 is entirely inside the System of Record's query engine; it requires no data movement.

### What naming this in the spec accomplishes

- **Explains the source-of-truth-only principle.** UDM lives in the System of Record. Derived data and infrastructure data live in adjacent layers and do not bloat UDM.
- **Explains audit handling.** Audit data is source-of-truth historical data, captured by the versioned-storage layer's transaction metadata. The "Audit record shape" pattern in `vignettes/udm-v2-patterns.md` documents the canonical projected shape; UDM has no audit entity.
- **Explains review findings as a pattern.** Findings are derived (re-computable from UDM data plus engine logic) and live in the System of Insight layer as views. The "Automated finding shape" pattern documents the projected shape.
- **Frames what does NOT belong in UDM.** Auth, sessions, AI configuration, transient workflow state are System of Engagement concerns and do not warrant UDM entities.
- **Sets expectations for storage choices.** Any System of Record implementation must capture transaction details (actor, timestamp, context) for the audit pattern to project correctly. Vanilla snapshot-only versioning is insufficient.

### Proposed spec change

Add a top-level architecture section before or near the existing "Domains" section. Three or four pages. Names the three layers, defines each, describes the contract between them, and references the relevant patterns and design decisions that follow from the architecture.

### What's explicitly NOT proposed

- No prescription of a specific storage implementation. Iceberg+Nessie, Dolt, Postgres temporal, and other versioned-storage options all satisfy the System of Record contract.
- No prescription of a specific OLTP database. Postgres is the typical choice; any transactional database with appropriate semantics works.
- No prescription of a specific data-movement layer. Batch ETL or streaming CDC are both acceptable.
- No prescription of the application architecture above Engagement. UI choices, API design, framework selection are out of scope.

### Open questions

- Where in the spec does this section live? Before Domains, after Domains, or as its own preceding document?
- Should the spec name a reference implementation per layer (for cross-institution comparison), or stay implementation-neutral?
- Does the architecture section reference the patterns catalog, or vice versa? Probably both: architecture motivates patterns; patterns specify shapes that arise from the architecture.

---

## 11. Remove ActivityLog entity from UDM

**Title:** Remove ActivityLog entity from UDM (audit handled by storage layer; observability is System of Engagement)

**Labels:** `scope:schema`, `breaking-change`, `priority:medium`, `status:proposal`

**Body:**

### Summary
The `ActivityLog` entity (currently in the Attachments domain) does not belong in UDM under the three-layer architecture and the principle that UDM holds source-of-truth research-admin data, not derived or infrastructure data. Its `Activity_Type` values split into two categories, neither of which is UDM-appropriate.

### Analysis

`ActivityLog.Activity_Type` is constrained to: `data_change` / `submission_status_change` / `operator_action` / `field_change` / `status_transition`.

- **`data_change`, `field_change`, `status_transition`, `submission_status_change`:** these are row-history events. They are redundant with what versioned storage captures in transaction metadata. Per the "Audit record shape" pattern in `vignettes/udm-v2-patterns.md`, this content belongs at the storage layer and is recoverable via time-travel projections that conform to the documented shape. Persisting it as a UDM entity duplicates what the storage layer already provides.
- **`operator_action`:** explicit user events that are not row changes (e.g., "user viewed proposal", "user emailed PI"). These are observability and telemetry concerns, not source-of-truth research-admin data. They belong in the System of Engagement layer (application logs, telemetry pipelines, audit appliances).

Neither use case satisfies the test "is this data source-of-truth research-admin data that cannot be regenerated from other UDM data plus engine logic." Audit data is source-of-truth but lives in the storage layer; operator-action events are observability and live in the System of Engagement.

### Decision

**Remove `ActivityLog` from UDM v2.1.**

Replace with:
- Audit data: continue to use the storage-layer history (Iceberg snapshots, Dolt commits, Postgres temporal-table rows). The "Audit record shape" pattern documents the canonical projected shape.
- Operator action events: institutional concern, captured by the System of Engagement (application logs, telemetry). If a recurring shape emerges across institutions, document it as a pattern; do not add a UDM entity.

### Migration impact

This is a breaking change for adopters that wrote against `ActivityLog`. Migration guidance:
- For `data_change` / `field_change` / `status_transition` / `submission_status_change` consumers: switch to storage-layer history queries projecting the "Audit record shape" pattern.
- For `operator_action` consumers: move event capture to application logging infrastructure.

### What's explicitly NOT proposed

- No replacement entity in UDM for either use case.
- No retention or compaction policy in UDM (storage-layer concern).
- No prescription of which logging infrastructure handles operator-action events (System of Engagement concern).

### Open questions

- Should the spec carry a brief migration note for adopters with existing `ActivityLog` rows, or is that out of scope (storage-layer / adopter responsibility)?
- Is there value in adding an "Operator action shape" pattern to the patterns catalog, or is observability genuinely too institutional to standardize?

---

## 12. Remove submission-tooling entities from UDM

**Title:** Remove SubmissionProfile, SubmissionPackage, SubmissionAttempt; capture submission events via Action attachment

**Labels:** `scope:schema`, `breaking-change`, `priority:medium`, `status:proposal`

**Body:**

### Summary
The three submission-related entities (`SubmissionProfile`, `SubmissionPackage`, `SubmissionAttempt`) in the Funding Cycle domain are infrastructure and institution-specific. They model submission-tooling artifacts (assembled package hashes, retry mechanics, connection configuration) rather than source-of-truth research-admin data. Different institutions use different submission tooling (Cayuse, eRA-direct, in-house code, sponsor portals) and the artifacts of each tooling stack do not generalize.

The research-admin-relevant fact ("this proposal was submitted to this sponsor on this date with this confirmation number") is captured via the existing `Action` attachment using a documented `Action_Type = Sponsor_Submission` convention. No new UDM entities or columns; the `Action` entity already carries every needed field.

### Analysis

**`SubmissionProfile`** — connection configuration (Submission_System, Environment, Credential_Reference_Path). Pure System of Engagement: it tells the submission tooling where to connect and where credentials live. Different institutions use different tooling; none of this generalizes.

**`SubmissionPackage`** — assembled-snapshot artifact with Package_Hash and Package_Version. Submission-tooling internal; the hash is for integrity verification by the tooling, not a research-admin concern. No research-admin user asks "what was the SHA-256 of the package."

**`SubmissionAttempt`** — retry mechanics, including Attempt_Number and Attempt_Status. Captures whether the submission timed out, was re-pushed, etc. Tooling history, not research-admin history.

The three together model the mechanics of HOW a submission happened in the submission tooling, not the FACT that it happened. The fact is captured at the `Proposal` level by `Decision_Status` transitioning from Pending forward, plus by the `Action` attachment recording the submission event.

### Decision

**Remove `SubmissionProfile`, `SubmissionPackage`, and `SubmissionAttempt` from UDM v2.1.**

Add `Sponsor_Submission` as a recommended value in the `AllowedValues` group `ActionType`. Document the convention for using `Action` to record submission events.

### Action convention for submission events

Each submission event is one `Action` row attached to the Proposal:

| Action Column | Value for Submission Event |
|---|---|
| Related_Entity_Type | `Proposal` |
| Related_Entity_ID | The submitted Proposal's ID |
| Action_Type_Value_ID | → AllowedValues for `Sponsor_Submission` |
| Title | E.g., "Submitted to NSF via Research.gov (production)" |
| Description | Optional longer narrative; sponsor system, environment, package version, etc. |
| Requestor_Personnel_ID | Who initiated the submission |
| Assignee_Personnel_ID | Who is responsible (OSP officer, submission specialist) |
| Action_Status | `Pending` → `Completed` on success, or `Failed` |
| Completed_Date | The actual submission timestamp (or rejection timestamp) |
| Origin | `Internal` / `System_Generated` depending on whether the submission was operator-initiated or tooling-automated |
| Outcome_Description | Sponsor confirmation / tracking number, sponsor system messages, error detail if Failed |
| Linked_Document_ID | Optional → Document for the sponsor's confirmation email, NoA receipt, error message |

Re-submissions add additional `Action` rows with `Action_Type = Sponsor_Submission`. Re-submission history is preserved as the natural row sequence.

### Migration impact

Breaking change for adopters that wrote against the three entities.

- **For `SubmissionAttempt` consumers:** for each historical attempt, create an `Action` row with `Action_Type = Sponsor_Submission` carrying the equivalent data (Submitted_Timestamp → Completed_Date, Attempt_Status → Action_Status, Sponsor_Confirmation_Number → Outcome_Description).
- **For `SubmissionPackage` consumers:** package metadata (hash, version) was tooling-internal; it moves to the application's submission tooling. The institution's submission tooling persists package artifacts in its own database.
- **For `SubmissionProfile` consumers:** connection configuration moves to the System of Engagement (see the SoE doc for sample shapes). Submission tooling reads its own profile registry to know where to connect.

### Recommended Action_Type values to add

Add `Sponsor_Submission` to the `ActionType` AllowedValues group. The current recommended values in v2 are: Deliverable / Checklist_Item / Service_Request / Modification_Approval / Compliance_Renewal / Training_Required / Training_Completion / Subrecipient_Risk_Review / Cost_Transfer_Approval / JIT_Request / Other. Add `Sponsor_Submission` alongside.

### What's explicitly NOT proposed

- No new entity. The Action attachment handles the case.
- No new columns on Proposal. Submission state is captured by the Action row plus the existing Decision_Status lifecycle.
- No prescription of which submission tooling an institution uses. That stays at the SoE / application layer.
- No retention or deduplication policy for submission Action rows. Institutional choice.

### Confirmation-number storage (decided)

Sponsor confirmation / tracking numbers live in `Action.Outcome_Description` as free text. No new structured column on Action.

Rationale: keeps Action consistent with other Action types that already use `Outcome_Description` for results (Modification_Approval, Subrecipient_Risk_Review). Avoids type-specific column additions. The "find proposal by confirmation number" cross-system query, when needed, projects through a SoI view that extracts the confirmation from text and exposes it as a column. Add a structured `External_Reference_ID` column on Action in v2.2 if adopters demonstrate indexed-query need across multiple Action types; do not add for one type alone.

### Open questions

None. Submission-event capture is settled: persist as an `Action` row with `Action_Type = Sponsor_Submission`, confirmation number in `Outcome_Description`.

---

## 13. Add Governance domain with committee infrastructure

**Title:** Add Governance domain (Committee, CommitteeMember, Meeting, MeetingAttendance)

**Labels:** `scope:schema`, `domain:governance`, `priority:high`, `status:design-complete`

**Body:**

### Summary
Convened committees (IACUC, IRB, IBC, COI committees, research-security review boards, internal-grant review panels, institutional policy boards) are cross-cutting infrastructure in research administration. Multiple modules need to reference committees and their meetings: Compliance needs committee review of protocols; COI needs committee deliberation on disclosures; Research Security needs review of foreign collaborations; Internal Awards needs review panels for pilot grants. Modeling committees inside any one module would couple unrelated modules; modeling them generically lets every module reuse the same entities.

UDM v2 currently has no committee or meeting entities. This issue introduces a new Governance domain at the UDM level with four entities.

### Outcome

**Four new entities in a new `Governance` domain.**

#### Committee

A convened body within or across institutions: an IACUC, an IRB, an IBC, a COI committee, a research-security review board, an internal-grant review panel, an institutional policy committee.

| Column | Type | Required | Notes |
|---|---|---|---|
| Committee_ID | ID | required | PK |
| Committee_Name | MediumName | required | Human-readable name (e.g., "University IACUC", "IRB Panel B") |
| Organization_ID | ID | required | → Organization. The institution or unit that convenes this committee |
| Committee_Type | Status | required | Constrained: IACUC / IRB / IBC / COI / Research_Security / Internal_Award_Review / Policy_Board / Other |
| Charter_Description | LongText | optional | Brief description of the committee's mandate |
| Established_Date | Date | optional | When the committee was established |
| Status | Status | required | Constrained: Active / Suspended / Disbanded |

#### CommitteeMember

A person serving on a Committee with a role and appointment term. Regime-specific classifications (e.g., PHS Policy IV.A.3 scientist/nonscientist/unaffiliated flags for IACUC committees) are recorded as `Classification` attachments rather than as columns on this entity, to keep CommitteeMember generic across committee types.

| Column | Type | Required | Notes |
|---|---|---|---|
| CommitteeMember_ID | ID | required | PK |
| Committee_ID | ID | required | → Committee |
| Personnel_ID | ID | required | → Personnel |
| Role | controlled-vocabulary | required | Recommended values: Chair / Vice_Chair / Member / Ex_Officio_Member / Observer |
| Appointment_Term_Start | Date | required | |
| Appointment_Term_End | Date | optional | Null for indefinite appointments |
| Status | Status | required | Constrained: Active / On_Leave / Terminated |

#### Meeting

A convened meeting of a Committee with date, type, quorum tracking, and minutes.

| Column | Type | Required | Notes |
|---|---|---|---|
| Meeting_ID | ID | required | PK |
| Committee_ID | ID | required | → Committee |
| Meeting_Date | Date | required | Scheduled date |
| Meeting_Type | Status | required | Constrained: Regular / Special / Emergency / Subcommittee |
| Status | Status | required | Constrained: Scheduled / Convened / Cancelled / Adjourned |
| Quorum_Required | Count | required | Number of members required for a quorum |
| Quorum_Met | Boolean | conditional | Required when Status reaches Convened or later |
| Location_Description | MediumText | optional | Physical address, video conferencing details, or hybrid |
| Convened_Time | Timestamp | optional | When the meeting actually started |
| Adjourned_Time | Timestamp | optional | When the meeting ended |
| Minutes_Document_ID | ID | optional | → Document. Approved meeting minutes when available |

#### MeetingAttendance

Per-member attendance record for a specific Meeting, with arrival and departure timestamps for quorum verification.

| Column | Type | Required | Notes |
|---|---|---|---|
| MeetingAttendance_ID | ID | required | PK |
| Meeting_ID | ID | required | → Meeting |
| CommitteeMember_ID | ID | required | → CommitteeMember |
| Attendance_Status | Status | required | Constrained: Present / Absent / Excused / Partial |
| Arrival_Time | Timestamp | conditional | Required when Attendance_Status = Present or Partial |
| Departure_Time | Timestamp | optional | Recorded when a member leaves before adjournment |

Unique constraint on (Meeting_ID, CommitteeMember_ID): a member has exactly one attendance row per meeting.

### Key design decisions

- **Generic across committee types.** One `Committee` entity covers IACUC, IRB, IBC, COI, research security, and any future committee types. The `Committee_Type` discriminator and recommended values cover the known cases; new types are added by extending the recommended-values list.
- **Regime-specific classification via Classification attachment, not columns.** IACUC committees need to track PHS Policy IV.A.3 scientist/nonscientist/unaffiliated flags on members. IRB committees need to track community member designations. Rather than adding regime-specific columns to `CommitteeMember`, institutions attach `Classification` rows with appropriate `Classification_Scheme` (e.g., "PHS Policy IV.A.3") and `Classification_Value` (e.g., "Scientist"). Keeps the generic entity clean.
- **Reused across modules.** Compliance, COI, Research Security, Internal Awards, and any future module needing convened bodies reference the same Committee / Meeting / MeetingAttendance entities. No duplication.
- **No cross-module review junction on the core entities.** Module-specific review records (a meeting reviewed Protocol P, a meeting reviewed COI disclosure D) live in bridge entities defined per consuming module. Issue #14 introduces the compliance-committee bridge entities; future COI / research-security work can introduce their own bridges following the same pattern.
- **Quorum logic is application code, not data.** Quorum_Required and Quorum_Met capture the data; "is the meeting quorate" is computed by the application reading `MeetingAttendance` rows for the Meeting and comparing the count of Present + Partial members to Quorum_Required. UDM holds the data; the application enforces the rule.

### Worked example

The University IACUC is composed of 8 members (1 chair, 1 vice chair, 6 members). PHS Policy IV.A.3 requires the committee include at least one scientist, one nonscientist, and one unaffiliated member; the institution tracks these via Classification attachments. The IACUC meets monthly; a meeting on 2026-07-15 has 6 members present.

Rows produced:

- 1 row in `Committee` (Committee_Type = IACUC, Status = Active).
- 8 rows in `CommitteeMember`, one per member, each with their role and appointment term.
- ~3-5 rows in `Classification` (polymorphic attachments to CommitteeMember rows) recording PHS IV.A.3 designations.
- 1 row in `Meeting` for 2026-07-15 (Meeting_Type = Regular, Quorum_Required = 5).
- 8 rows in `MeetingAttendance` (6 Present, 1 Excused, 1 Absent). Application code computes Quorum_Met = true based on 6 ≥ 5.

### What's explicitly NOT included

- **No regime-specific committee subtypes.** No IACUCCommittee, IRBCommittee, IBCCommittee. The generic Committee with Committee_Type discriminator handles all regimes.
- **No meeting-agenda-item entity.** Agendas are application-layer; the substantive review records that come out of meetings live in bridge entities (see Issue #14).
- **No voting machinery on Meeting itself.** Votes are captured per-review-item in bridge entities, not aggregated at the meeting level.
- **No subcommittee modeling beyond the Meeting_Type value `Subcommittee`.** Persistent subcommittees with their own membership rosters are out of scope for v2.1; institutions that need them model them as separate Committee rows with a Charter_Description naming the parent.

### Follow-on issues

- Issue #14: Compliance-Committee bridge entities (MeetingProtocolReview, MemberRecusal). Depends on this issue.
- Future: COI-Committee bridge entities. Future: Research-Security-Committee bridge. Each follows the same bridge pattern.

---

## 14. Add Compliance-Committee bridge entities

**Title:** Add MeetingProtocolReview and MemberRecusal bridge entities

**Labels:** `scope:schema`, `domain:compliance`, `priority:high`, `status:design-complete`

**Body:**

### Summary
The compliance protocol module (Issue #1) and the Governance domain (Issue #13) are independently useful, but Compliance needs to record which Protocols were reviewed at which Meetings, with vote tallies and decisions. Compliance also needs to track committee-member recusals per Protocol. These bridges are compliance-specific (a Meeting reviewing a Protocol is meaningful only in the compliance regulatory context) and therefore live in the Compliance module rather than in Governance.

### Outcome

**Two new entities in the Compliance domain.**

#### MeetingProtocolReview

A junction linking a Meeting (from Governance) to a Protocol (from Compliance) reviewed at that meeting, with vote tally and committee decision.

| Column | Type | Required | Notes |
|---|---|---|---|
| MeetingProtocolReview_ID | ID | required | PK |
| Meeting_ID | ID | required | → Meeting |
| Protocol_ID | ID | required | → Protocol |
| Agenda_Sort_Order | Count | required | Position on the meeting agenda |
| Review_Decision | Status | required | Constrained: Approved / Approved_With_Modifications / Tabled / Returned / Disapproved / Deferred |
| Decision_Date | Date | required | Typically equals the Meeting's date but may be later for tabled-and-resumed reviews |
| Decision_Notes | LongText | optional | Committee's rationale, required modifications, etc. |
| Vote_For_Count | Count | optional | Members voting in favor |
| Vote_Against_Count | Count | optional | Members voting against |
| Vote_Abstain_Count | Count | optional | Members abstaining |

Unique constraint on (Meeting_ID, Protocol_ID): a Protocol appears at most once on a given Meeting's agenda for review. (Multiple meetings reviewing the same Protocol over time produce multiple rows, one per meeting.)

#### MemberRecusal

A record of a CommitteeMember recusing from review of a specific Protocol, with reason and scope.

| Column | Type | Required | Notes |
|---|---|---|---|
| MemberRecusal_ID | ID | required | PK |
| CommitteeMember_ID | ID | required | → CommitteeMember |
| Protocol_ID | ID | required | → Protocol |
| Recusal_Reason | LongText | required | Why the member is recused (e.g., financial conflict, personal relationship with PI) |
| Recused_Date | Date | required | When the recusal was declared |
| Is_Permanent | Boolean | required | True = recused from any meeting reviewing this Protocol; false = recused for a specific meeting only |
| Meeting_ID | ID | conditional | → Meeting. Required when Is_Permanent = false; null when Is_Permanent = true |

### Key design decisions

- **Bridge entities live in the consuming module, not in Governance.** Governance defines Committee / Meeting / MeetingAttendance generically. Module-specific review records (a meeting reviewed Protocol P, with vote 5-1-2, decision Approved_With_Modifications) live in the consuming module. This keeps Governance reusable without coupling it to Compliance specifics. Future COI-meeting-reviewed-disclosure bridge entities live in COI; future research-security-meeting-reviewed-collaboration bridges live in Research Security.
- **Vote tallies on the review row, not on the Meeting.** A single Meeting reviews multiple Protocols; each gets its own vote and decision. Aggregating votes on Meeting would be lossy.
- **Recusal scope is explicit.** `Is_Permanent` distinguishes "I have a permanent conflict on this Protocol; recuse me from every meeting reviewing it" from "I'm recused for this specific meeting only." The Meeting_ID FK is required for the latter case and forbidden for the former.
- **Recusal records influence quorum and committee composition.** Application logic reading these rows determines whether a Meeting's effective quorum (excluding recused members) meets the Committee's Quorum_Required threshold for a specific Protocol's review.

### Worked example

The IACUC meets on 2026-07-15 with 6 of 8 members present (quorum met). One agenda item is review of Protocol `IACUC-2026-014`. Member Dr. Smith has a permanent recusal from this Protocol because the Protocol's PI is her spouse. After deliberation, the committee approves the Protocol 4-0-1 (one abstention from a non-recused member).

Rows produced:

- 1 row in `MemberRecusal` (CommitteeMember_ID = Dr. Smith, Protocol_ID = IACUC-2026-014, Is_Permanent = true, Meeting_ID = null).
- 1 row in `MeetingProtocolReview` (Meeting_ID = the 2026-07-15 meeting, Protocol_ID = IACUC-2026-014, Review_Decision = Approved, Vote_For_Count = 4, Vote_Against_Count = 0, Vote_Abstain_Count = 1).

The Protocol's `ProtocolReviewStep` row for the Committee_Decision step (created when the Protocol entered review) transitions to Status = Approved with Action_Date = 2026-07-15. The MeetingProtocolReview row provides the historical detail (which meeting, what vote); the ProtocolReviewStep row provides the workflow state on the Protocol itself.

### What's explicitly NOT included

- **No bridge entities for non-compliance modules.** COI committees, research-security committees, and other future committee consumers introduce their own bridges following the same pattern. Cross-module bridges are not generalized prematurely.
- **No automatic quorum recomputation when a recusal is recorded.** Application logic reads MemberRecusal rows and computes effective quorum at meeting time; this is not a UDM concern.
- **No append-only enforcement on MeetingProtocolReview rows.** Once a vote and decision are recorded, they should not be edited (the storage layer's versioning provides the audit trail of any edits). UDM doesn't enforce immutability at the table level.

### Dependencies

- Depends on Issue #1 (Compliance protocol detail extensions) for `Protocol` entity.
- Depends on Issue #13 (Governance domain) for `Committee`, `CommitteeMember`, and `Meeting` entities.

---

## Explicitly not raised (per saved scope decisions)

- Universal audit and provenance columns (`Created_At`, `Updated_At`, `Created_By_Personnel_ID`, `Updated_By_Personnel_ID`, `Source_System`, `Source_Record_ID`, `Is_Active`). Versioned storage at the storage layer (Dolt, Trino+Iceberg, temporal tables) handles row history.
- `Row_Version` optimistic concurrency. Implementation-layer detail; UDM stays SQL-agnostic.
- `PII_Flag` enforcement (mask/redact/RBAC). UDM marks `pii=true` as a signal; institutional layer enforces.
- Export Control TCP / screening / license modeling. Stays inside `ComplianceRequirement`.
- `DataDictionary` metadata catalog. Institutional metadata governance.
- User authentication, JWT blacklist, LLM endpoint configuration, AI workflow mapping. Infrastructure, not domain.
- RFA AI analysis pipeline tables. Institutional AI plumbing.
