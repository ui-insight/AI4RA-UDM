# Compliance Module: Regulatory Protocol Management

A self-contained module for managing standing regulatory protocols (the records a research institution holds with bodies like an IACUC, IRB, or IBC), the people listed on each protocol, the multi-step review workflows that govern them, and the regime-specific data each regulator requires.

This document describes the data model only: entities, attributes, relationships, and lifecycle behavior. Storage, indexing, query patterns, API surface, and language-level binding are intentionally unspecified.

---

## Host system assumptions

The module attaches to a host system that already provides:

- **Personnel.** A record for each person the institution tracks (PIs, study staff, committee members). The module references personnel by ID.
- **Organization.** A record for each institution, sponsor, regulatory body, and internal department. The module references organizations by ID.
- **Funding instruments.** Records for the funding agreements that protocols cover. The host system distinguishes prime awards from subawards: an `Award` is a direct funding agreement between the institution and a sponsor; a `Subaward` is a downstream agreement passing funds from a prime award to a partner institution. The module references both types separately and never conflates them. Where a protocol or person can be associated with either type, the module uses two FK columns (`Award_ID` and `Subaward_ID`) with an exactly-one-non-null constraint.

For adopters using the notification-cycle composition pattern described later in this document, the host system additionally provides:

- **Communication.** A polymorphic message entity (sender, body, timestamp, parent entity reference).
- **Deadline.** A polymorphic due-date entity (start date, end date, status, optional reminder schedule, parent entity reference).
- **CommunicationResponse.** A per-recipient structured response to a Communication (respondent personnel reference, response type, response value, status, response timestamp).

Adopters that do not use the notification-cycle pattern can ignore these three. The module does not define how any of these host-system entities are modeled and references all of them by opaque string ID.

---

## Conventions

- **IDs** are opaque strings.
- **Status fields** are strings constrained to a documented enumeration. Status enumerations are normative: implementations accept only the listed values.
- **Controlled-vocabulary fields** are foreign keys to a lookup table the host system provides; the module documents the value sets it expects under conventional group names. Controlled-vocabulary value sets are recommended rather than normative: implementations may extend them with additional values, but the listed values should be present for cross-system compatibility.
- **Dates** are calendar dates unless noted.
- **Foreign keys** are denoted with a `→` arrow.
- **Required / optional / conditional**: conditional means required when a stated rule is met.
- **Deletion behavior**: deleting a Protocol cascades to its dependent rows in this module (ProtocolCoverage, ProtocolPersonnel, ProtocolReviewStep, ProtocolAmendment, ProtocolContinuingReview, and all Layer 3 sub-resources). Deleting an Amendment or ContinuingReview cascades to its ProtocolReviewStep rows. Deletion of host-system entities (Personnel, Organization, funding instruments) is the host system's concern; references from this module become dangling unless the host system blocks the deletion.

Entity names use a `Protocol` prefix throughout to make the module's surface visible at a glance when dropped into a larger system.

---

## Module structure

The module organizes entities into three layers, plus a composition pattern described after Layer 3 that several adopters will need but that introduces no compliance-specific entities.

### Layer 1: Core protocol entities

Three entities. Present and used by every regulatory regime.

#### Protocol

The standing regulatory record. A Protocol exists independently of any single funded project; the same approved Protocol can cover many awards over time, and an institution maintains a Protocol across multiple renewal cycles.

| Column | Type | Required | Notes |
|---|---|---|---|
| Protocol_ID | string | required | PK |
| Parent_Protocol_ID | string | optional | → Protocol (self-referencing). A renewal points to the predecessor; null for the first instance |
| Regime | status | required | Constrained: Animal_Use / Human_Subjects / Biosafety / Other |
| Protocol_Number | string | optional | The authority-issued identifier (the IACUC number, IRB number, IBC registration number). Unique within (Reviewing_Authority_Organization_ID, Regime) when not null |
| Title | string | required | Human-readable title |
| Reviewing_Authority_Organization_ID | string | required | → Organization. The body that reviews and approves this protocol (the IACUC, the IRB, the IBC) |
| Review_Pathway | controlled-vocabulary | optional | The category that classifies how this protocol was reviewed. Regime-specific. For Animal_Use: USDA pain category for the protocol as a whole. For Human_Subjects: Exempt / Expedited / Full_Board / Not_Human_Subjects. For Biosafety: BL1 / BL2 / BL3 / BL4 |
| Classification_Level | controlled-vocabulary | optional | Regime-specific risk classification distinct from Review_Pathway. For Human_Subjects: Minimal / More_Than_Minimal / High |
| Submitted_Date | date | optional | When the protocol was submitted for review |
| Approved_Date | date | conditional | Required when Status = Approved |
| Expiration_Date | date | optional | When the approval expires. Null means non-expiring |
| Status | status | required | Constrained: Draft / Submitted / Under_Review / Approved / Active / Suspended / Expired / Closed / Withdrawn / Rejected |

**One protocol, one regime, one reviewing authority.** A Protocol carries exactly one `Regime` and exactly one `Reviewing_Authority_Organization_ID`. Research that requires approval from multiple regulatory bodies (e.g., animal-use work involving biohazardous agents requires both IACUC and IBC approval) is modeled as multiple Protocols, one per regime, each covering the same funding instruments via separate `ProtocolCoverage` rows.

**Status transitions.** Status is updated as the lifecycle progresses; the module specifies when each transition occurs but not the mechanism (trigger, application logic, or other) used to perform it.

- A new Protocol is created in `Draft`.
- Status moves `Draft` → `Submitted` when the PI submits it for review; `Submitted_Date` is set at the same time.
- Status moves `Submitted` → `Under_Review` when the first `ProtocolReviewStep` reaches `In_Review`.
- Status moves `Under_Review` → `Approved` when every `ProtocolReviewStep` in the chain has reached `Approved`; `Approved_Date` is set at the same time. Status moves `Under_Review` → `Rejected` when any required step reaches `Rejected`.
- Status moves `Approved` → `Active` when the first `ProtocolCoverage` row is created (the Protocol is now covering at least one funding instrument). A Protocol can remain `Approved` indefinitely if no coverage is recorded.
- Status moves `Approved` or `Active` → `Expired` automatically when `Expiration_Date` passes.
- Status moves to `Suspended`, `Closed`, or `Withdrawn` by explicit administrative action. `Withdrawn` is used when the PI rescinds a Protocol that has not yet reached `Approved`; `Closed` is used at the end of the Protocol's useful life; `Suspended` is a temporary halt that may be reversed back to `Active`.

#### ProtocolCoverage

The M:N junction between a Protocol and the funding instruments it covers. A single Protocol may cover many funded projects (one IRB protocol supporting three related grants). A single funded project may be covered by many Protocols (an animal-use grant needing both an IACUC and an IBC protocol).

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolCoverage_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Award_ID | string | conditional | → Award. Set when this coverage row links the Protocol to a prime award |
| Subaward_ID | string | conditional | → Subaward. Set when this coverage row links the Protocol to a subaward |
| Coverage_Start_Date | date | optional | When the Protocol began covering this funding instrument |
| Coverage_End_Date | date | optional | When the Protocol stopped covering this funding instrument; null while still in effect |

Exactly one of (`Award_ID`, `Subaward_ID`) is non-null per row. A given (Protocol_ID, Award_ID) pair (or (Protocol_ID, Subaward_ID) pair) appears at most once with a null Coverage_End_Date.

#### ProtocolPersonnel

A person listed on a Protocol with a role and training status. Scoped primarily to the Protocol; optional `Award_ID` or `Subaward_ID` narrows responsibility when the Protocol covers multiple funded projects.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolPersonnel_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Personnel_ID | string | required | → Personnel |
| Award_ID | string | optional | → Award. Scopes this person's responsibility to one covered prime award when the Protocol covers many |
| Subaward_ID | string | optional | → Subaward. Scopes this person's responsibility to one covered subaward when the Protocol covers many |
| Role | controlled-vocabulary | required | Recommended values: Primary_Investigator / Co_Investigator / Study_Coordinator / Research_Staff / Consenting_Personnel / Lab_Manager / Veterinary_Staff / Biosafety_Officer / Other |
| Training_Completion_Date | date | optional | Date required compliance training (CITI, biosafety, etc.) was completed |
| Start_Date | date | required | |
| End_Date | date | optional | Null while still active |

At most one of (`Award_ID`, `Subaward_ID`) is non-null per row. Both null means responsibility spans every funded project the Protocol currently covers.

### Layer 2: Workflow infrastructure

Five entities. Shared by every regulatory regime and reusable for any future regime. Four of them (`ProtocolAmendment`, `ProtocolContinuingReview`, `ProtocolAdverseEvent`, and `ProtocolDeviation`) are events that occur on an approved Protocol with their own approval lifecycles; all four are reviewed via `ProtocolReviewStep`.

#### ProtocolReviewStep

A single step in a review chain. The same entity is used to model the steps in an initial protocol review, an amendment review, a continuing review, an adverse-event determination, and a deviation determination. Exactly one of (Protocol_ID, ProtocolAmendment_ID, ProtocolContinuingReview_ID, ProtocolAdverseEvent_ID, ProtocolDeviation_ID) is non-null per row.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolReviewStep_ID | string | required | PK |
| Protocol_ID | string | conditional | → Protocol. Set when reviewing the initial protocol |
| ProtocolAmendment_ID | string | conditional | → ProtocolAmendment. Set when reviewing an amendment |
| ProtocolContinuingReview_ID | string | conditional | → ProtocolContinuingReview. Set when reviewing a continuing review |
| ProtocolAdverseEvent_ID | string | conditional | → ProtocolAdverseEvent. Set when reviewing an adverse-event report |
| ProtocolDeviation_ID | string | conditional | → ProtocolDeviation. Set when reviewing a protocol deviation |
| Step_Order | integer | required | Sequence within the chain (1, 2, 3, ...) |
| Step_Name | controlled-vocabulary | required | Regime-specific. For Animal_Use: Vet_Pre_Review / Coordinator_Triage / DMR / FCR / Committee_Decision. For Human_Subjects: Coordinator_Review / Designated_Member_Review / Full_Board / Committee_Decision. For Biosafety: Coordinator_Triage / DMR / FCR / Committee_Decision |
| Assigned_Personnel_ID | string | optional | → Personnel. The reviewer for this step |
| Status | status | required | Constrained: Pending / In_Review / Approved / Rejected / Returned / Withdrawn |
| Action_Date | date | optional | When the step's reviewer acted |
| Comments | text | optional | Reviewer comments |

#### ProtocolAmendment

A request to modify an approved Protocol. Has its own approval lifecycle distinct from the underlying Protocol and its own review chain via ProtocolReviewStep.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolAmendment_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol. The protocol being amended |
| Amendment_Number | string | optional | Authority-assigned identifier when applicable |
| Submitted_Date | date | optional | |
| Approved_Date | date | conditional | Required when Status = Approved |
| Effective_Date | date | optional | Date the amendment takes effect once approved |
| Status | status | required | Constrained: Draft / Submitted / Under_Review / Approved / Rejected / Withdrawn |
| Summary | string | required | Brief description of what is changing |
| Justification | text | optional | Why the change is needed |

#### ProtocolContinuingReview

A periodic (typically annual) continuing review event on an approved Protocol. Required by PHS Policy for animal-use protocols. Optional for some human-subjects categories. Rare for biosafety. Reviewed via ProtocolReviewStep.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolContinuingReview_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Review_Cycle_Number | integer | required | Sequence (1 = first continuing review, 2 = second, etc.) |
| Reporting_Period_Start_Date | date | required | |
| Reporting_Period_End_Date | date | required | |
| Submitted_Date | date | optional | |
| Decision_Date | date | conditional | Required when Status reaches a terminal value |
| Status | status | required | Constrained: Pending_Submission / Submitted / Under_Review / Approved / Approved_With_Modifications / Suspended / Closed |
| Adverse_Events_Reported | boolean | optional | Whether adverse events occurred during the reporting period |
| Adverse_Events_Description | text | conditional | Required when Adverse_Events_Reported = true |

#### ProtocolAdverseEvent

A reported adverse event, unanticipated problem, or incident on an approved Protocol. Used across regimes: an unanticipated problem involving risk to subjects (IRB), an unexpected mortality or morbidity event (IACUC), or a containment breach / exposure / spill (IBC). Reviewed via `ProtocolReviewStep`.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolAdverseEvent_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Event_Date | date | required | When the event occurred. Drives the regulator-mandated reporting clock |
| Event_Type | controlled-vocabulary | required | Regime-specific. For Human_Subjects: Unanticipated_Problem / Serious_Adverse_Event / Adverse_Event / Subject_Complaint / Protocol_Related_Injury. For Animal_Use: Unexpected_Mortality / Morbidity / Pain_Distress / Containment_Breach / Other. For Biosafety: Exposure / Spill / Release / Containment_Breach / Other |
| Event_Description | text | required | Narrative of what happened |
| Severity | status | required | Constrained: Minor / Moderate / Serious / Life_Threatening |
| Relatedness | status | conditional | Constrained: Related / Possibly_Related / Unrelated / Indeterminate. Required when Regime = Human_Subjects; optional otherwise |
| Affected_Count | integer | optional | Number of subjects, animals, or personnel affected |
| Affected_Description | text | optional | Free-text detail on who was affected (e.g., "2 mice, both euthanized"; "1 subject withdrew from study") |
| Reported_Date | date | required | When the event was reported to the reviewing authority |
| Reported_By_Personnel_ID | string | required | → Personnel. Who filed the report |
| Status | status | required | Constrained: Reported / Under_Review / Determination_Made / Corrective_Action_In_Progress / Closed / Withdrawn |
| Determination | controlled-vocabulary | conditional | Required when Status reaches Determination_Made or later. Recommended values: No_Action_Required / Continuing_Review_Required / Modification_Required / Protocol_Suspension / Protocol_Termination / Reporting_Only |
| Determination_Date | date | conditional | Required when Determination is set |
| Determination_Notes | text | optional | Committee rationale for the determination |
| Closed_Date | date | conditional | Required when Status = Closed |

#### ProtocolDeviation

A departure from the approved Protocol procedure. Major deviations affect subject safety or data integrity and require committee review; minor deviations are administrative and may not. Reviewed via `ProtocolReviewStep` when committee review is required.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolDeviation_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Deviation_Date | date | required | When the deviation occurred |
| Deviation_Description | text | required | What deviated from the approved procedure |
| Reason | text | required | Why the deviation happened |
| Category | status | required | Constrained: Major / Minor. Major deviations affect subject safety, animal welfare, biosafety containment, or data integrity and require committee review. Minor deviations are administrative |
| Affected_Subjects_Or_Animals | boolean | required | Whether the deviation affected research subjects (human studies) or animals (animal studies) |
| Affected_Data_Integrity | boolean | required | Whether the deviation potentially affected data integrity |
| Reported_Date | date | required | When the deviation was reported to the reviewing authority |
| Reported_By_Personnel_ID | string | required | → Personnel |
| Status | status | required | Constrained: Reported / Under_Review / Acknowledged / Corrective_Action_Required / Corrective_Action_In_Progress / Closed |
| Determination_Date | date | conditional | When the committee acknowledged or required action |
| Corrective_Action_Description | text | conditional | Required when Status involves corrective action |
| Closed_Date | date | conditional | Required when Status = Closed |

### Layer 3: Per-regime sub-resources

Flat tables hung off Protocol_ID. Each sub-resource is regime-specific because the data shape is genuinely different. The pattern of attaching them is identical across regimes.

**Layer 3 pattern.** Every Layer 3 sub-resource entity carries, at minimum:
- A primary-key column following the `<EntityName>_ID` convention.
- A `Protocol_ID` column foreign-keyed to `Protocol`.

The default cardinality is one Protocol to many sub-resource rows (e.g., a Protocol has many `AnimalUseSpecies`). One-to-one sub-resources (e.g., `AnimalUseClosureReport`) are signaled by the cardinality note "Unique" on the `Protocol_ID` column.

The remaining columns are regime-specific and shaped to capture what the regulator requires. There is no shared "common columns" pattern beyond the PK and the parent FK; lifting common columns from regime-specific sub-resources is intentionally avoided because the regulators do not share semantics.

#### Animal use (Regime = Animal_Use)

**AnimalUseSpecies**

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseSpecies_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Species_Common_Name | string | required | e.g., "Mouse", "Zebrafish" |
| Species_Scientific_Name | string | optional | e.g., "Mus musculus" |
| Strain | string | optional | |
| Animal_Count | integer | required | Number of animals approved for the protocol |
| USDA_Pain_Category | status | required | Constrained: B / C / D / E |
| Justification | text | optional | Scientific justification for species choice |

**AnimalUseProcedure**

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseProcedure_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Procedure_Description | text | required | |
| Pain_Category | status | required | Constrained: B / C / D / E |
| Is_Survival | boolean | required | Whether the procedure is survival or non-survival |
| Anesthesia_Description | text | conditional | Required when Pain_Category in {D, E} |
| Analgesia_Description | text | optional | |

**AnimalUseHazard**

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseHazard_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Hazard_Type | status | required | Constrained: Biological / Chemical / Physical / Radiation |
| Agent_Or_Substance | string | required | |
| Exposure_Control_Description | text | required | |

**AnimalUseAlternativesSearch**

Documents the 3Rs literature search required by the Animal Welfare Act. Required for any procedure with Pain_Category in {D, E}.

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseAlternativesSearch_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Search_Date | date | required | |
| Databases_Searched | text | required | e.g., "PubMed, AGRICOLA, Web of Science" |
| Keywords_Used | text | required | |
| Years_Covered | string | required | e.g., "2015-2025" |
| Alternatives_Found_Description | text | required | Findings narrative |

**AnimalUseClosureReport**

The final report submitted when a Protocol is being closed. One per closed Protocol.

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseClosureReport_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol. Unique |
| Submitted_Date | date | required | |
| Animals_Approved_Count | integer | required | Total approved across the protocol's lifetime |
| Animals_Used_Count | integer | required | Total actually used |
| Disposition_Description | text | required | What happened to remaining animals (transferred / euthanized / rehomed) |
| Outcomes_Description | text | optional | Scientific outcomes and publications generated |

#### Human subjects (Regime = Human_Subjects)

**HumanSubjectsPopulation**

| Column | Type | Required | Notes |
|---|---|---|---|
| HumanSubjectsPopulation_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Population_Description | text | required | |
| Age_Range_Description | string | required | e.g., "18-65", "Children 5-17" |
| Includes_Children | boolean | required | |
| Includes_Pregnant_Women | boolean | required | |
| Includes_Prisoners | boolean | required | |
| Includes_Cognitively_Impaired | boolean | required | |
| Inclusion_Criteria | text | required | |
| Exclusion_Criteria | text | required | |
| Recruitment_Method | text | required | |
| Estimated_Enrollment_Count | integer | optional | |

**HumanSubjectsIntervention**

| Column | Type | Required | Notes |
|---|---|---|---|
| HumanSubjectsIntervention_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Intervention_Description | text | required | |
| Intervention_Type | controlled-vocabulary | required | Recommended values: Survey / Interview / Observation / Drug / Device / Behavioral / Surgical / Biospecimen / Other |
| Risk_Description | text | required | |

**HumanSubjectsConsent**

| Column | Type | Required | Notes |
|---|---|---|---|
| HumanSubjectsConsent_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Consent_Method | status | required | Constrained: Written / Verbal / Waiver / Short_Form / Assent_Only |
| Documentation_Required | boolean | required | Whether signed documentation is required |
| Waiver_Justification | text | conditional | Required when Consent_Method = Waiver |
| Special_Population_Accommodations | text | optional | Accommodations for children, non-English speakers, etc. |
| Consent_Language_Description | text | optional | Reading level, translations available |

#### Biosafety (Regime = Biosafety)

**BiologicalAgent**

| Column | Type | Required | Notes |
|---|---|---|---|
| BiologicalAgent_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Agent_Name | string | required | |
| Agent_Type | status | required | Constrained: Organism / Toxin / Recombinant_DNA / Cell_Line |
| Risk_Group | status | required | Constrained: RG1 / RG2 / RG3 / RG4 |
| Source_Description | string | optional | Where the agent comes from |
| Quantity_Description | string | optional | Volumes, titers, or counts in use |

**BiosafetyProcedure**

| Column | Type | Required | Notes |
|---|---|---|---|
| BiosafetyProcedure_ID | string | required | PK |
| Protocol_ID | string | required | → Protocol |
| Procedure_Description | text | required | |
| Required_Containment_Level | status | required | Constrained: BL1 / BL2 / BL3 / BL4 |
| Required_PPE_Description | text | required | |
| Decontamination_Protocol | text | required | |

## Composition pattern: notification cycles

Some regulatory regimes require a notification cycle in which a coordinator polls committee members about a Protocol and collects structured responses within a deadline. The most common case is the IACUC Designated Member Review / Full Committee Review cycle under PHS Policy IV.C.2: the coordinator notifies the committee about a Protocol under review; each member responds No_Objection or Request_FCR; if any member responds Request_FCR, the Protocol escalates to full committee review at the next meeting.

This module does not define entities for notification cycles. The cycle composes from three host-system-provided entities:

- **Communication.** The notification message itself. The host system provides a polymorphic Communication entity (sender, body, sent timestamp) that attaches to any other entity in the system; the compliance module attaches it to the Protocol the notification is about.
- **Deadline.** The response window. The host system provides a polymorphic Deadline entity (start date, end date, status, optional reminder schedule) that attaches to any other entity; the compliance module attaches it to the Communication. When the Deadline passes, any unresponded recipients transition to Timed_Out by host-system mechanism.
- **CommunicationResponse.** A per-recipient structured response. The host system provides one row per intended recipient with `Respondent_Personnel_ID`, a typed `Response_Value` (e.g., No_Objection / Request_FCR), a `Responded_At` date, and a status (Pending / Responded / Declined_To_Respond / Timed_Out / Withdrawn).

The composition reads naturally: a Communication (with a Deadline) collects CommunicationResponse rows, one per recipient.

**Lifecycle.** The cycle is normative regardless of which regime uses it:

1. Coordinator creates a Communication attached to the Protocol.
2. Coordinator attaches a Deadline to the Communication for the response window.
3. The host system creates one CommunicationResponse row per intended committee member, Status = Pending.
4. As members respond, their rows transition to Status = Responded with `Response_Value` populated.
5. When the Deadline passes, remaining Pending rows transition to Timed_Out.
6. Workflow logic for the originating cycle reads the CommunicationResponse rows and determines the outcome of the relevant `ProtocolReviewStep` (for DMR/FCR: any Request_FCR escalates; otherwise DMR proceeds).

**Why this is a composition pattern and not a Layer 3 sub-resource.** Notification cycles are not specific to compliance. The same pattern is used for RPPR co-PI sign-off, COI annual disclosure reminders, IRB Full Board concurrence polls, JIT response collection, and effort-certification reminders. Defining DMR-specific entities here would duplicate generic infrastructure. Adopters running animal-use programs use this pattern; adopters that do not, ignore it. No compliance-specific entities are introduced either way.

**Committee operations.** Convened committee infrastructure (committee rosters, scheduled meetings, attendance records for quorum verification) is similarly cross-cutting: COI committees, research-security committees, and internal-award review panels use the same shape as IACUC/IRB/IBC committees. The compliance module does not define committee infrastructure. Adopters that need it consume committee, meeting, and attendance entities from the host system and reference them by ID where compliance-specific linkage is needed (e.g., a junction row recording which Protocols were reviewed at a given meeting with vote tallies). The specific bridge entities for that linkage are out of scope for this module.

---

## Worked examples

### Example 1: An animal-use protocol

A PI submits a new animal-use protocol covering rodent studies. The protocol uses two species, includes survival surgery with isoflurane anesthesia, and one biological hazard. Initial review goes through Vet Pre-Review, Coordinator Triage, DMR, then Committee Decision. After approval the PI submits an amendment in year 2 to add a third species. The protocol is in year 2 of a 3-year cycle and has had one continuing review.

Rows produced:

- 1 row in `Protocol` (Regime = Animal_Use, Status = Approved).
- 2 rows in `ProtocolPersonnel` (the PI and one research staff).
- 2 rows in `AnimalUseSpecies`.
- 3 rows in `AnimalUseProcedure`.
- 1 row in `AnimalUseHazard`.
- 1 row in `AnimalUseAlternativesSearch`.
- 4 rows in `ProtocolReviewStep` for the initial review (all linked via Protocol_ID).
- 1 row in `ProtocolAmendment` for the year-2 species addition.
- 4 rows in `ProtocolReviewStep` for the amendment (all linked via ProtocolAmendment_ID).
- 1 row in `AnimalUseSpecies` for the newly added third species.
- 1 row in `ProtocolContinuingReview` for year 2.
- 1 row in `ProtocolReviewStep` for the continuing review (linked via ProtocolContinuingReview_ID).

If the institution runs the DMR notification cycle described above, the DMR review step's outcome is determined by a separate composition of host-system Communication, Deadline, and CommunicationResponse rows attached to the Protocol. No compliance-specific rows are added.

### Example 2: A human-subjects protocol

An Expedited human-subjects protocol for a survey study. One adult population, one intervention (online survey), waived signed consent.

Rows produced:

- 1 row in `Protocol` (Regime = Human_Subjects, Review_Pathway = Expedited, Classification_Level = Minimal).
- 1 row in `ProtocolPersonnel` (the PI).
- 1 row in `HumanSubjectsPopulation`.
- 1 row in `HumanSubjectsIntervention`.
- 1 row in `HumanSubjectsConsent` (Consent_Method = Waiver).
- 2 rows in `ProtocolReviewStep` (Coordinator Review, Designated Member Review).
- No `ProtocolContinuingReview` rows unless the IRB requires annual review for this category.

### Example 3: A biosafety protocol

A BL2 protocol covering work with adenovirus vectors.

Rows produced:

- 1 row in `Protocol` (Regime = Biosafety, Review_Pathway = BL2).
- 2 rows in `ProtocolPersonnel` (PI, biosafety officer).
- 1 row in `BiologicalAgent` (adenovirus vector, RG2).
- 2 rows in `BiosafetyProcedure`.
- 3 rows in `ProtocolReviewStep` (Coordinator Triage, DMR, Committee Decision).

---

## Adding a new regulatory regime

To add a new regulatory regime (e.g., radiation safety, stem-cell oversight, drone operations):

1. **Register the regime.** Add the value to the `Regime` enumeration on `Protocol`.
2. **Define regime-specific vocabularies.** Register the regime's Review_Pathway and Classification_Level values in the controlled-vocabulary lookup. Register the regime's Step_Name values for `ProtocolReviewStep`.
3. **Define regime-specific sub-resources.** Create flat tables hung off `Protocol_ID` following the Layer 3 pattern. Two or three sub-resources is typical. Example for radiation safety: `RadiationSource` (isotope, activity, location) and `RadiationProcedure` (procedure description, shielding, dosimetry).
4. **Workflow comes for free.** `ProtocolReviewStep`, `ProtocolAmendment`, `ProtocolContinuingReview`, `ProtocolAdverseEvent`, and `ProtocolDeviation` work without modification.
5. **Reuse the notification-cycle composition pattern** if the regime polls members about a Protocol within a deadline. The pattern uses host-system Communication, Deadline, and CommunicationResponse entities and adds no compliance-specific tables.
6. **Reuse committee infrastructure from the host system** if the regime uses convened committees. The compliance module does not define committee entities.

A new regime that fits the pattern adds 0 entities to Layers 1 and 2, and 2-3 entities to a new Layer 3 sub-resource section.
