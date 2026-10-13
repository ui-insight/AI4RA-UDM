# Optional module: Compliance Protocols

**Story:** "We run protocol-based compliance review."
**Requires:** core >=2.3.0, no module dependencies
**Records targets declared:** Protocol, ProtocolAmendment, ProtocolContinuingReview, ProtocolAdverseEvent, ProtocolDeviation
**AllowedValues groups declared:** ProtocolPersonnelRole, ProtocolReviewPathway, ProtocolClassificationLevel, ProtocolReviewStepName, AdverseEventType, AdverseEventDetermination

This module is governed by the module taxonomy's two laws (capability criterion, encapsulation rule); see the Architecture section of the core specification. Canonical machine-readable definition: `optional_modules.compliance_protocols` in `udm_schema_v2.json`. Module tables carry the universal audit columns; they are omitted below as in the core spec.

The shared protocol spine: the standing regulatory record (Protocol), its funding linkage (ProtocolCoverage), its roster (ProtocolPersonnel), and the workflow entities every regime shares: a single polymorphic review step plus four peer event entities (amendments, continuing reviews, adverse events, deviations), each with its own approval lifecycle.

One Protocol carries exactly one Regime and one reviewing authority; work needing multiple regulatory bodies is modeled as multiple Protocols covering the same funding instruments. Notification cycles (designated-member-review polling and similar) compose from the core: a Communication attached to the Protocol, a Deadline attached to the Communication, and CommunicationResponse rows per recipient; this module adds no notification entities. With this module adopted, protocol rosters live in ProtocolPersonnel; core ProtocolRole remains for requirement-scoped staffing where the module is not in play.

## Table reference

#### Protocol

The standing regulatory record. Exists independently of any single funded project; one approved Protocol can cover many awards over time and persists across renewal cycles.

| Column | Type | Required | Notes |
|---|---|---|---|
| Protocol_ID | ID | required | PK |
| Parent_Protocol_ID | ID | optional | → Protocol. Self-referencing renewal chain; a renewal points to its predecessor, null for the first instance |
| Regime | Status | required | Constrained: Animal_Use / Human_Subjects / Biosafety / Other |
| Protocol_Number | ID | optional | The authority-issued identifier (IACUC number, IRB number, IBC registration). Unique within (Reviewing_Authority_Organization_ID, Regime) when not null |
| Title | MediumName | required | Human-readable title |
| Reviewing_Authority_Organization_ID | ID | required | → Organization. The body that reviews and approves this protocol (the IACUC, the IRB, the IBC) |
| Review_Pathway_Value_ID | ID | optional | → AllowedValues. AllowedValues Value_Group = 'ProtocolReviewPathway'. Regime-specific: Animal_Use uses USDA pain category for the protocol as a whole; Human_Subjects uses Exempt / Expedited / Full_Board / Not_Human_Subjects; Biosafety uses BL1-BL4 |
| Classification_Level_Value_ID | ID | optional | → AllowedValues. AllowedValues Value_Group = 'ProtocolClassificationLevel'. Regime-specific risk classification distinct from Review_Pathway (e.g. Human_Subjects: Minimal / More_Than_Minimal / High) |
| Submitted_Date | Date | optional | When the protocol was submitted for review |
| Approved_Date | Date | optional | Required when Protocol_Status = 'Approved' or later approval states |
| Expiration_Date | Date | optional | When the approval expires; null means non-expiring |
| Protocol_Status | Status | required | Constrained: Draft / Submitted / Under_Review / Approved / Active / Suspended / Expired / Closed / Withdrawn / Rejected |

#### ProtocolCoverage

M:N junction between a Protocol and the funding instruments it covers. One protocol may cover many funded projects; one project may need several protocols (one per regime).

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolCoverage_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The covering protocol |
| Award_ID | ID | optional | → Award. Exactly one of Award_ID / Subaward_ID is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of Award_ID / Subaward_ID is non-null |
| Coverage_Start_Date | Date | optional | When coverage began |
| Coverage_End_Date | Date | optional | Null while coverage is still in effect |

#### ProtocolPersonnel

A person listed on a Protocol with a role and training status. Optionally scoped to one covered Award or Subaward when the Protocol covers several.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolPersonnel_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Personnel_ID | ID | required | → Personnel. The person |
| Award_ID | ID | optional | → Award. At most one of Award_ID / Subaward_ID non-null; both null means responsibility spans all covered instruments |
| Subaward_ID | ID | optional | → Subaward. At most one of Award_ID / Subaward_ID is non-null |
| Role_Value_ID | ID | required | → AllowedValues. AllowedValues Value_Group = 'ProtocolPersonnelRole'. Recommended values: Primary_Investigator / Co_Investigator / Study_Coordinator / Research_Staff / Consenting_Personnel / Lab_Manager / Veterinary_Staff / Biosafety_Officer / Other |
| Training_Completion_Date | Date | optional | Date required compliance training was completed |
| Start_Date | Date | required | When this row takes effect |
| End_Date | Date | optional | Null while still active |

#### ProtocolReviewStep

A single step in a review chain. One polymorphic entity models the steps of initial protocol review, amendment review, continuing review, adverse-event determination, and deviation determination. Exactly one parent FK is non-null per row.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolReviewStep_ID | ID | required | PK |
| Protocol_ID | ID | optional | → Protocol. Set when reviewing the initial protocol |
| ProtocolAmendment_ID | ID | optional | → ProtocolAmendment. Set when reviewing an amendment |
| ProtocolContinuingReview_ID | ID | optional | → ProtocolContinuingReview. Set when reviewing a continuing review |
| ProtocolAdverseEvent_ID | ID | optional | → ProtocolAdverseEvent. Set when reviewing an adverse-event report |
| ProtocolDeviation_ID | ID | optional | → ProtocolDeviation. Set when reviewing a protocol deviation |
| Step_Order | Count | required | Sequence within the chain (1, 2, 3, ...) |
| Step_Name_Value_ID | ID | required | → AllowedValues. AllowedValues Value_Group = 'ProtocolReviewStepName'. Regime-specific: e.g. Vet_Pre_Review / Coordinator_Triage / DMR / FCR / Committee_Decision (Animal_Use); Coordinator_Review / Designated_Member_Review / Full_Board / Committee_Decision (Human_Subjects) |
| Assigned_Personnel_ID | ID | optional | → Personnel. The reviewer for this step |
| Step_Status | Status | required | Constrained: Pending / In_Review / Approved / Rejected / Returned / Withdrawn |
| Action_Date | Date | optional | When the step's reviewer acted |
| Comments | LongText | optional | Reviewer comments |

#### ProtocolAmendment

A request to modify an approved Protocol, with its own approval lifecycle and its own review chain via ProtocolReviewStep.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolAmendment_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The protocol being amended |
| Amendment_Number | ID | optional | Authority-assigned identifier when applicable |
| Submitted_Date | Date | optional | When submitted to the reviewing authority |
| Approved_Date | Date | optional | Required when Amendment_Status = 'Approved' |
| Effective_Date | Date | optional | Date the amendment takes effect once approved |
| Amendment_Status | Status | required | Constrained: Draft / Submitted / Under_Review / Approved / Rejected / Withdrawn |
| Summary | MediumName | required | Brief description of what is changing |
| Justification | LongText | optional | Why the change is needed |

#### ProtocolContinuingReview

A periodic (typically annual) continuing-review event on an approved Protocol. Reviewed via ProtocolReviewStep.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolContinuingReview_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Review_Cycle_Number | Count | required | Sequence (1 = first continuing review) |
| Reporting_Period_Start_Date | Date | required | Start of the period this review covers |
| Reporting_Period_End_Date | Date | required | End of the period this review covers |
| Submitted_Date | Date | optional | When submitted to the reviewing authority |
| Decision_Date | Date | optional | Required when Review_Status reaches a terminal value |
| Review_Status | Status | required | Constrained: Pending_Submission / Submitted / Under_Review / Approved / Approved_With_Modifications / Suspended / Closed |
| Adverse_Events_Reported | Boolean | optional | Whether adverse events occurred during the reporting period |
| Adverse_Events_Description | LongText | optional | Required when Adverse_Events_Reported = true |

#### ProtocolAdverseEvent

A reported adverse event, unanticipated problem, or incident on an approved Protocol: an unanticipated problem involving risk to subjects, an unexpected mortality event, a containment breach. Reviewed via ProtocolReviewStep.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolAdverseEvent_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Event_Date | Date | required | When the event occurred; drives the regulator-mandated reporting clock |
| Event_Type_Value_ID | ID | required | → AllowedValues. AllowedValues Value_Group = 'AdverseEventType'. Regime-specific: e.g. Unanticipated_Problem / Serious_Adverse_Event (Human_Subjects); Unexpected_Mortality / Morbidity (Animal_Use); Exposure / Spill / Release (Biosafety) |
| Event_Description | LongText | required | Narrative of what happened |
| Severity | Status | required | Constrained: Minor / Moderate / Serious / Life_Threatening |
| Relatedness | Status | optional | Constrained: Related / Possibly_Related / Unrelated / Indeterminate. Required when the protocol's Regime = 'Human_Subjects' |
| Affected_Count | Count | optional | Number of subjects, animals, or personnel affected |
| Affected_Description | LongText | optional | Free-text detail on who was affected |
| Reported_Date | Date | required | When the event was reported to the reviewing authority |
| Reported_By_Personnel_ID | ID | required | → Personnel. Who filed the report |
| Event_Status | Status | required | Constrained: Reported / Under_Review / Determination_Made / Corrective_Action_In_Progress / Closed / Withdrawn |
| Determination_Value_ID | ID | optional | → AllowedValues. AllowedValues Value_Group = 'AdverseEventDetermination'. Required when Event_Status reaches 'Determination_Made' or later. Recommended values: No_Action_Required / Continuing_Review_Required / Modification_Required / Protocol_Suspension / Protocol_Termination / Reporting_Only |
| Determination_Date | Date | optional | Required when Determination_Value_ID is set |
| Determination_Notes | LongText | optional | Committee rationale |
| Closed_Date | Date | optional | Required when Event_Status = 'Closed' |

#### ProtocolDeviation

A departure from the approved Protocol procedure. Major deviations affect safety, welfare, containment, or data integrity and require committee review; minor deviations are administrative.

| Column | Type | Required | Notes |
|---|---|---|---|
| ProtocolDeviation_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Deviation_Date | Date | required | When the deviation occurred |
| Deviation_Description | LongText | required | What deviated from the approved procedure |
| Reason | LongText | required | Why the deviation happened |
| Category | Status | required | Constrained: Major / Minor |
| Affected_Subjects_Or_Animals | Boolean | required | Whether the deviation affected research subjects or animals |
| Affected_Data_Integrity | Boolean | required | Whether the deviation potentially affected data integrity |
| Reported_Date | Date | required | When reported to the reviewing authority |
| Reported_By_Personnel_ID | ID | required | → Personnel. Reported By Personnel ID |
| Deviation_Status | Status | required | Constrained: Reported / Under_Review / Acknowledged / Corrective_Action_Required / Corrective_Action_In_Progress / Closed |
| Determination_Date | Date | optional | When the committee acknowledged or required action |
| Corrective_Action_Description | LongText | optional | Required when Deviation_Status involves corrective action |
| Closed_Date | Date | optional | Required when Deviation_Status = 'Closed' |

## Cross-row constraints

- **ProtocolCoverage**: Exactly one of Award_ID, Subaward_ID is non-null.
- **ProtocolCoverage**: A given (Protocol_ID, Award_ID) or (Protocol_ID, Subaward_ID) pair appears at most once with a null Coverage_End_Date.
- **ProtocolPersonnel**: At most one of Award_ID, Subaward_ID is non-null.
- **ProtocolReviewStep**: Exactly one of Protocol_ID, ProtocolAmendment_ID, ProtocolContinuingReview_ID, ProtocolAdverseEvent_ID, ProtocolDeviation_ID is non-null.
- **Protocol**: Protocol_Number is unique within (Reviewing_Authority_Organization_ID, Regime) when not null.
- **Protocol**: Approved_Date is required when Protocol_Status is 'Approved', 'Active', 'Suspended', 'Expired', or 'Closed'.
