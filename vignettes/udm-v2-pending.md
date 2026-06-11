# UDM v2 — pending work before next ask-a-child

Items completed since the last cold-read (commit `fc3ad03`, score 6/10). Many of these were uncovered while working through the original pending list and pushed in alongside.

## Done since last cold-read

### Scope and meta

- [x] **Scope statement added.** Goal section now lists what the spec covers (entities, relationships, cross-row constraints, semantic conventions, vocabularies) and what it does NOT (enforcement mechanism, query patterns, performance tuning, numeric precision / rounding, UI / ETL, data-quality remediation).

### Original numbered priorities

- [x] **#1 NCE → Budget Period_End_Date.** Retaxonomized Modification effect on Budget chain — funding-changing vs end-date-changing vs award-state-only events. NCE-class events create a new Current-stage Budget row chained from the prior latest Current for the last period, with `Period_End_Date` matching the new `Current_End_Date`. Added outer-edge coverage invariant: `MAX(Period_End_Date)` across active Current-stage rows equals the anchor's `Current_End_Date`.
- [x] **#2 Semantic-convention bundle.**
  - [x] A1 — JIT IRB approval (ComplianceRequirement + Document attachment + Action.Linked_Document_ID).
  - [x] A2 — Proposed → Approved Budget transition (Approved row chains from latest active Proposed via Parent_Budget_ID).
  - [x] A4 — AwardRole.End_Date during NCE (open AwardRole rows stay open; end-dating only at role-bearer changes or Award closure).
  - [x] C2 — Removing one Award from multi-Award ComplianceCoverage (end-date the specific Coverage row; distinct from renewal cascade).
- [x] **#3 Relationship / enumeration fixes.**
  - [x] F2 — Foreign-engagement scope-out absorbed this: ConflictOfInterest no longer carries Foreign_*. The non-foreign Proposal_ID gap is the same item handled now.
  - [x] F3 — ConflictOfInterest → ComplianceRequirement(COI) regime: documented in updated semantic convention.
  - [x] F5 — Entity_Country_Code constraint: column removed (foreign-engagement scope-out makes the conditional moot).
- [x] **#4 ProtocolRole Award scoping.** Added optional `Award_ID` and `Subaward_ID` (XOR) for protocol-staff responsibility scoping when a requirement covers multiple agreements.
- [x] **#5 FTE_Percent per-person constraint.** Reclassified as runtime data-invariant rather than model constraint (consistent with scope statement). FTE_Percent and Credit_Percent both noted in column descriptions as institutional invariants the spec does not enforce. The hard `Credit_Percent sums to 100` cross-row constraint was also dropped on the same basis.
- [x] **#6 Small fixes.**
  - [x] S2 — "anchor switch" prose fixed inside the Modification-effect-on-Budget-chain rewrite.

### Lineage review (new thread)

- [x] **Subaward.Group_ID added** for symmetry with Proposal.Group_ID and Award.Group_ID. Pre-filled from Prime Award's Group_ID (or originating Proposal at Proposed stage).
- [x] **Subaward.Previous_Subaward_ID dropped.** Subaward renewal lineage flows through Prime Award chain (`Subaward.Prime_Award_ID → Award.Previous_Award_ID + same Subrecipient_Organization_ID`). Subaward goes from 5 lineage columns to 4.
- [x] **Lineage mechanisms overview added** as a semantic convention. Question-to-column mapping covering all 12 lineage-adjacent columns (Proposal 3, Award 5, Subaward 4).

### Foreign-engagement scope-out

- [x] ConflictOfInterest table slimmed: dropped `Entity_Country_Code`; removed foreign-* Relationship_Type recommended values (Foreign_Affiliation, Foreign_Appointment, Foreign_Talent_Program, Foreign_Funding); table description updated.
- [x] *ConflictOfInterest vs OtherSupport vs ComplianceRequirement(COI)* semantic convention updated: examples now use Consulting / Equity / Royalty / Board_Membership rather than Foreign_Appointment. Closing paragraph defers foreign engagements to local extension.
- [x] Optional Extensions section gained *Foreign-engagement and research-security disclosures (NSPM-33)*: explicitly out of scope, institutions running NSPM-33 / NSF research-security / DoD reviews add a local extension.

### PI / role modeling

- [x] **PI vs Multi_PI mode is exclusive** cross-row constraint added: at any active date, an agreement is in single-PI mode (exactly one active PI row) OR multi-PI mode (≥2 active Multi_PI rows) OR neither (community-partner case), never both.
- [x] **Credit-bearing role definition** retained inside the PI vs Multi_PI constraint (institutions still need to identify credit-bearing roles to apply the exclusion correctly).

## Closed architectural questions

- **Multi-tenant / consortium deployments.** Decided: **one deployment per institution.** Documented in *Deployment scope and the "institution"* section.

## Open architectural questions

- **Currency.** Multi-currency support is in Optional Extensions.

### Minor doc fixes

- [x] **S3.** ActivityLog `Related_Entity_Type` column note replaced with "any UDM table name except ActivityLog itself" — no inline enumeration, no drift hazard.
- [x] **Q9.** Sponsor-side Personnel dedup convention added to *Disambiguating "External" personnel* — ORCID > Primary_Email > (Home_Organization_ID, Home_Organization_Identifier), with explicit acknowledgement that batch matching is the fallback.

## Still open from this session

- Commit the recent batch of edits (this whole pile is uncommitted since `fc3ad03`).
- Re-run ask-a-child for fresh feedback.
