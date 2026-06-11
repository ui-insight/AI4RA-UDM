# UDM Changelog

All notable changes to the Unified Data Model are documented here.

The UDM follows [Semantic Versioning](https://semver.org/):
- **MAJOR** when incompatible schema changes are made
- **MINOR** when entities or columns are added in a backward-compatible way
- **PATCH** for documentation, convention clarifications, or fixes to non-load-bearing rules

## [2.0.0] — 2026-06-11

UDM v2 is a major refactor of the model. It supersedes UDM v1.

Both versions of the JSON serialization are kept side-by-side at the repository root: [udm_schema.json](../udm_schema.json) (v1, preserved for reference) and [udm_schema_v2.json](../udm_schema_v2.json) (v2). The canonical prose specification lives in [udm-v2-schema.md](udm-v2-schema.md); the architectural overview is in [ontology.md](ontology.md).

### Architectural changes

#### Entities dropped
- **`Project` as a first-class entity.** Longitudinal-identity grouping is now handled by `Proposal.Group_ID` (user-maintained), `Proposal.Originating_Proposal_ID` (derived lineage root), and `Award.Group_ID` (pre-filled from originating Proposal at insert).
- **`ProjectRole`** → split into three parallel role tables: `AwardRole`, `OrganizationRole`, `ProtocolRole`. Each answers a different question (people on the work, people at an Organization, people on a protocol).
- **`ProposalBudget`, `AwardBudget`, `AwardBudgetPeriod`** → unified into a single `Budget` table with a `Lifecycle_Stage` discriminator (Proposed → Approved → Current → Actual).
- **`Invoice`** → subsumed by `Payment` with `Lifecycle_Stage = 'Invoiced'`.
- **`AwardDeliverable`** → renamed `Report` with broader scope (Progress, RPPR, FFR, Final, Invention Statement, Data Sharing, etc.).
- **`ProposalChecklistItem`** → generalized into the polymorphic `Action` attachment.
- **`SubmissionAttachment`, `SubmissionEvent`** → subsumed by `Document` polymorphic attachment + `ActivityLog`.
- **`ApplicationSystem`, `ServiceRequest`** → removed from canonical model; documented in Optional Extensions. Service tickets recommended as `Action` rows with `Action_Type = 'Service_Request'`.
- **`ProjectCohort`, `CohortParticipation`** → removed. Faculty-development cohorts deferred to local extensions.
- **`InventionDisclosure`, `InventionDisclosureInventor`** → removed. Tech transfer deferred to specialized systems (Wellspring, Inteum, Sophia); Bayh-Dole touchpoint via `Report.Report_Type = 'Invention_Statement'`.

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
- **Two-FK XOR attachment.** Twelve satellite tables (Budget, Payment, Modification, Transaction, Equipment, Report, Closeout, Terms, AwardRole, ComplianceCoverage, etc.) attach to Award OR Subaward via two nullable FK columns. Keeps Award and Subaward symmetric without duplicate sub-side tables.
- **Polymorphic attachment** with documented minimum-conformance behavior (no dangling refs on write, parent removal preserves attachments via soft delete, type-stable references).
- **Derived columns** with documented recompute triggers (Current_End_Date, Current_Total_Funded, Current_PI_Personnel_ID, Originating_*_ID, Subject_To_Federal_Funding).
- **Lineage mechanisms overview** — 12-column query-to-column map across Proposal / Award / Subaward.

#### Rule catalogs added
- **17 semantic conventions** covering rules that no column constraint can express (Modification vs Parent_Award_ID vs Previous_Award_ID, AwardRole role-bearer changes, Group_ID prefill, JIT cycle composition, Sponsor decision artifacts, etc.).
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

- [vignettes/udm-v2-schema.md](udm-v2-schema.md) — canonical prose specification (~1500 lines).
- [udm_schema_v2.json](../udm_schema_v2.json) — MySQL/MariaDB serialization at the repository root with structured constraints, derived values, 12 example views, ~200-entry column synonyms sidecar.
- [vignettes/ontology.md](ontology.md) — updated architectural overview describing v2.
- Three rounds of comparative cold-read evaluation against the v1 schema; v2 scored 8.5/10 against v1's 5/10 in the final round.

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

The pre-v2 model. See [udm_schema.json](../udm_schema.json) at the repository root and the prior [ontology.md](ontology.md) revision (git history before commit `92e21ed`).
