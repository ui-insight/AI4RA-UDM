# OpenERA Data Model Inventory

**Sources:**
- Canonical: `ui-insight/OpenERA/docs/architecture/data-model.md` (fetched June 2026).
- Supplementary: OpenERA Data Model Audit, June 2026 (annotated below as "audit:" where it adds implementation detail such as index lists, STI merge dates, or missing constraints).

**Tagline (from source):** "OpenERA is built on a normalized relational schema designed for research administration."

**Total entity count:** ~99 ORM models per audit; canonical doc enumerates roughly the same. Compliance protocol modules account for 21 (IACUC) + 10 (IRB) + 7 (IBC) = 38 of those.

**Naming conventions:**
- Domain tables: PascalCase with underscores (`Proposal_ID`, `Sponsor_Organization_ID`).
- Operational tables (User, ApprovalStep, LLMEndpoint, AIWorkflowMapping): snake_case columns (`proposal_id`, `workflow_task`).
- Money: `Decimal` / `Decimal(18,2)` throughout. No `Float` (audit confirms).
- Concurrency: `Row_Version` integer columns on Proposal, ChecklistItem, AwardBudget, BannerSetup (optimistic concurrency, 409 on mismatch).
- Lookups: `AllowedValue` table with `*_Value_ID` FK pattern (e.g., `Role_Value_ID`, `Document_Type_Value_ID`).
- Polymorphic links: `Related_Entity_Type` + `Related_Entity_ID` string columns with no FK (Document, ActivityLog).

---

## 1. Core Entities

### Proposal
Central pre-award entity. Identifier: `Proposal_ID` (string PK, e.g., `PROP-DEV-001`).

Key columns:
- Identification: `Proposal_Number`, `Proposal_Title`.
- Org links: `Sponsor_Organization_ID` (FK Organization), `Submitting_Organization_ID` (FK Organization).
- Funding opportunity: `RFA_ID` (FK RFA, nullable).
- Period: `Proposed_Start_Date`, `Proposed_End_Date`.
- Budget totals: `Total_Proposed_Direct`, `Total_Proposed_Indirect`, `Total_Proposed_Budget` (Decimal).
- State: `Internal_Approval_Status` (Draft, In Review, Approved, Rejected, Returned), `Decision_Status` (Pending, Awarded, Declined, Withdrawn).
- Classification: `Proposal_Category`, `Proposal_Action_Type`, `Project_Type_Code`, `Agreement_Type`, `Campus_Type`, `Campus_Location`.
- Regulatory flags (mostly Boolean nullable): `Sponsor_Regulatory_Flags` (JSON), `NSF_Off_Campus_Flag`, `CHIPS_Act_Foreign_Cert`, `SFI_Disclosure_Required`, `RCR_Training_Certified`, `Export_Control_Flags` (JSON), `Publication_Restrictions`, `Potential_New_IP`, `Uses_Existing_UI_IP`, `Tribal_Collaboration`, `Institutional_LOC_Required`, `Capital_Equipment_Over_50K`, `CAES_Lab_Space`, `Space_Renovation`.
- Institutional context: `Research_Institute_Affiliations` (JSON), `Multi_College_FA_Split`, `FA_Split_Details` (JSON), `FA_Split_Rationale`.
- AI-generated: `Budget_Justification_Sections` (JSON, A-H matching NSF categories).
- Reporting classifications: `HERD_Field`, `HERD_Research_Type`, `HERD_Activity_Type`.
- NIH-specific: `NIH_Study_Type`, `NIH_Study_Type_Rationale`, `NIH_Has_Separate_Clinical_Trial`, `NIH_Policy_Basis`, `NIH_Policy_Basis_Frozen_At` (timestamp freezing applicable policy regime).
- Assignment: `SPA_Personnel_ID` (FK Personnel) for the Sponsored Projects Administrator.
- Concurrency: `Row_Version`.

Audit notes:
- No `Created_At` / `Updated_At` (canonical doc does not list them either; one of two root entities lacking timestamps).
- 13 relationships declared `lazy="selectin"` (budget items, team, approvals, subawards, etc.); every `select(Proposal)` hydrates the full aggregate.
- `Sponsor_Organization_ID` indexed via `ix_Proposal_Sponsor_Organization_ID`.

### Organization
Sponsors, institutions, departments, colleges, subawardees. Self-referential hierarchy.

Columns: `Organization_ID` (string PK, short code), `Organization_Name`, `Organization_Type` (School, College, Department, Institute, Sponsor, Subawardee), `Parent_Organization_ID` (FK Organization, nullable), `UEI` (12-char SAM.gov identifier, nullable).

Seed: 57 orgs in bootstrap.

### Personnel
Researchers, staff, students, external collaborators.

Columns: `Personnel_ID` (string PK, e.g., `brobison`), `First_Name`, `Last_Name`, `Middle_Name`, `Primary_Email`, `ORCID` (unique nullable), `Institutional_ID` (unique nullable), `Person_Type` (Faculty, Staff, Graduate Student, Undergraduate Student, External Collaborator), `Department_Organization_ID` (FK Organization, nullable; college derived at runtime), `Base_Salary` (Decimal), `Salary_Basis` (9-month or 12-month), `Salary_Effective_Date`, `Appointment_Type` (e.g., TENURED, TENURE_TRACK, RESEARCH_FACULTY for APM 45.22 eligibility), `Faculty_Rank`, `Is_Non_US_Person` (Boolean; drives MFTRP/RST covered-individual logic).

Seed: 87 personnel.

### RFA (Request for Applications)
Funding opportunities.

Columns: `RFA_ID` (string PK), `RFA_Title`, `Sponsor_Organization_ID` (FK), `RFA_Number`, `Program_Code`, `Announcement_URL`, `CFDA_Number`, `Opportunity_Number`, `Submission_Deadline`, `LOI_Deadline`, `Preproposal_Deadline`, `Announcement_Date`, `Funding_Floor` / `Funding_Ceiling` (Decimal), `Expected_Awards`, `Max_Duration_Months`, `Submission_Method`, `RFA_Status` (default `Active`).

Audit notes:
- Only index is `ix_rfa_grants_gov_opp_id`. `Sponsor_Organization_ID`, `CFDA_Number`, `Submission_Deadline`, `RFA_Status` unindexed despite list-page filters.

### RFARequirement
Structured requirements extracted from a funding announcement.

Columns: `RFARequirement_ID` (int PK), `RFA_ID` (FK), `Requirement_Category` (DOCUMENT, FORMATTING, ELIGIBILITY, REVIEW_CRITERION, BUDGET_CONSTRAINT, SUBMISSION, DEADLINE, COMPLIANCE, SPECIAL_CONDITION, PAPPG_DEVIATION), `Requirement_Code`, `Requirement_Label`, `Description`, `Page_Limit`, `Format_Spec`, `Is_Required`, `Sort_Order`, `Source_Section` (e.g., `sponsor_default` from Pass 1, `rfa_specific` from Pass 2, or RFA heading), `Structured_Rule_Type` (links to `SponsorEligibilityRule.Rule_Type`), `Structured_Rule_Value`.

Unique constraint: `(RFA_ID, Requirement_Category, Requirement_Code)`.

### ProjectRole
Links Personnel to a Proposal and/or Project with role information.

Columns: `ProjectRole_ID` (int PK), `Project_ID` (FK Project, nullable), `Proposal_ID` (FK Proposal, nullable), `Personnel_ID` (FK Personnel, nullable; null when `Is_TBD` is true), `Role_Value_ID` (FK AllowedValue: PI, Co-PI, Senior, Key, Tech), `Is_Key_Personnel`, `Funding_Award_ID` (string, nullable; not a FK per audit), `Start_Date`, `End_Date`, `FTE_Percent` (Decimal 0-100, CHECK), `Salary_Charged` (Decimal), `Is_TBD`, `TBD_Label`, `Default_Salary`, `Default_Salary_Basis`, `Role_Override_Requested`.

Audit notes:
- No UniqueConstraint on (Proposal_ID, Personnel_ID, Role_Value_ID). No presence CHECK requiring Proposal_ID OR Project_ID. Only two CHECKs: FTE range, date range.
- Both FKs `ondelete=CASCADE`.

### ProposalBudget
Budget line items by period and NSF category.

Columns: `ProposalBudget_ID` (int PK), `Proposal_ID` (FK), `Period_Number` (1-5 typically), `BudgetCategory_ID` (FK), `Line_Item_Description`, `Direct_Cost` (Decimal), `Indirect_Cost` (Decimal), `Total_Cost` (Decimal), `Quantity`, `Unit_Cost`, `Applied_Indirect_Rate_ID` (FK IndirectRate), `Rate_Base_Used`, `Version_No`.

Unique: `(Proposal_ID, Period_Number, BudgetCategory_ID, Line_Item_Description)`. Index: `(Proposal_ID, BudgetCategory_ID)`.

### ProposalSubaward
Pre-award subaward relationships, one per partner institution.

Columns: `Subaward_ID` (int PK), `Proposal_ID` (FK, CASCADE), `Subawardee_Organization_ID` (FK, SET NULL), `Subawardee_Name`, `Subawardee_PI_Name`, `Subawardee_PI_Email`, `Description`, `Total_Cost` (Decimal(18,2)), `Sort_Order`.

Documents link via `Document.Subaward_ID` for per-subaward upload slots (budget, scope of work).

### BudgetCategory
The 19 NSF-standard categories. Codes: A (Senior Personnel), B (Other Personnel), C (Fringe), D (Equipment), E (Travel), F1-F4 (Participant Support), G1-G7 (Other Direct), H (Total Direct), I (Indirect), J (Total).

### IndirectRate
Negotiated F&A rates per organization.

Columns: `IndirectRate_ID` (int PK), `Organization_ID` (FK), `Rate_Type` (On-Campus, Off-Campus, Other Sponsored Activities), `Rate_Percentage` (Decimal(5,2)), `Effective_Start_Date`, `Effective_End_Date`, `Base_Type` (typically MTDC), `Negotiated_Agreement_ID`.

### ComplianceRequirement
Regulatory compliance protocols at the proposal level (IRB, IACUC, IBC, Radiation Safety).

Columns: `ComplianceRequirement_ID` (string PK), `Proposal_ID` (FK), `Requirement_Type` (IRB, IACUC, IBC, Radiation), `Review_Type` (Exempt, Expedited, Full Board), `Risk_Level` (Minimal, Moderate, High), `Requirement_Status` (Pending, In Review, Approved).

### ConflictOfInterest
Financial interest disclosures.

Columns: `COI_ID` (int PK), `Proposal_ID` (FK), `Personnel_ID` (FK), `Relationship_Type_Value_ID` (FK AllowedValue), `Entity_Name`, `Financial_Interest_Amount` (Decimal), `Management_Plan`.

### Document
Polymorphic storage. Optional per-person link via `Personnel_ID` for biosketch / current & pending slots.

Columns: `Document_ID` (int PK), `Document_Type_Value_ID` (FK AllowedValue), `Related_Entity_Type` (string: Proposal, RFA, Personnel, Project, Organization), `Related_Entity_ID` (string, no FK), `Personnel_ID` (FK, nullable), `File_Name`, `Storage_Location`, `File_Size_Bytes`, `MIME_Type`, `File_Hash` (SHA-256), `Version_Number`. (Subaward_ID FK is implicit from ProposalSubaward section.)

Audit notes:
- Three divergent entity-type allowlists: DB CHECK permits 11 (adds IACUCProtocol, Award, AwardModification, AwardCorrespondence, AwardSubaward to the canonical 5), API allowlist permits 5 plus PersonnelComplianceRecord, frontend uploads IACUCProtocol and IBCProtocol.

Per-person doc matching strategy: (1) direct `Personnel_ID` link preferred; (2) last-name match in filename/description as legacy fallback.

### ApprovalStep
4-step internal review chain auto-created on proposal submission: PI Certification (auto-approved), Department Review, College Review, OSP Review.

Columns (snake_case): `id` (int PK), `proposal_id` (FK), `step_order` (1-4), `step_name` (stable identifier from approval workflow registry), `assignee_id` (FK Personnel, auto-populated), `status` (pending, approved, rejected, returned), `action_date`, `comments`. Computed: `assignee_name`.

Audit notes:
- Index: `ix_approval_step_proposal_status (proposal_id, status)`. Queue queries filter by status alone (no proposal_id), unindexed for that predicate.
- Status state machine codified in approval-workflow registry (audit cites as the precedent for cross-module status discipline).

### ReviewCheckItem
Structured substantive review ledger gating approval decisions. Some entries reviewer-owned, some source-driven roll-ups from specialist tabs (Personnel, Budget, Documents, Compliance).

Columns: `ReviewCheck_ID` (int PK), `Proposal_ID` (FK), `Section_Key` (eligibility, budget, routing, etc.), `Section_Label`, `Check_Code` (stable identifier), `Label`, `Description`, `Sort_Order`, `Auto_Status` (Not Checked, Pass, Fail, Flag, N/A), `Auto_Reason`, `Status` (effective approval-ledger status), `Routed_To`, `Route_Status` (Pending, Cleared, Flagged), `Reviewer_Notes` (required for source-driven overrides), `Reviewer_Personnel_ID` (FK), `Checked_Date`.

Unique: `(Proposal_ID, Section_Key, Check_Code)`.

### ChecklistItem (STI)
Unified proposal-prep and award-setup checklist items. Discriminator: `Checklist_Type` ∈ {`proposal`, `award`}. Both `Proposal_ID` and `Award_ID` are real nullable FKs (no polymorphic indirection).

Columns: `ChecklistItem_ID` (int PK), `Checklist_Type`, `Proposal_ID` (FK, nullable), `Award_ID` (FK, nullable), `RFARequirement_ID` (FK, nullable; for proposal items from RFA), `Requirement_Category`, `Requirement_Code`, `Label`, `Description`, `Page_Limit` (proposal), `Format_Spec` (proposal), `Is_Required`, `Is_Blocker` (award; gates Banner activation), `Sort_Order`, `Row_Version`, `Status` (Not Started, In Progress, Complete, Not Applicable), `Assignee_Personnel_ID` (FK), `Due_Date` (award), `Notes`, `Completed_Date`, `Document_ID` (FK).

Unique: `(Checklist_Type, Proposal_ID, Award_ID, Requirement_Category, Requirement_Code)`.

Audit notes:
- Merged June 2026 (migration `20260601_f2a3b4c5d6e7`) from `ProposalChecklistItem` and `AwardSetupChecklistItem`.
- Unique constraint silently unenforced for every row due to nullable columns + Postgres `NULLS DISTINCT` default.
- Only index: `ix_ChecklistItem_Checklist_Type`. Pre-merge `Award_ID`-leading unique index lost.

### User
Authentication/authorization accounts (snake_case operational table).

Columns: `id` (UUID PK), `username` (unique), `hashed_password` (bcrypt), `personnel_id` (FK), `role` (pi, dept_admin, college_admin, osp_admin, system_admin), `is_active`.

### ContactDetails
Polymorphic contact info for Personnel or Organizations.

Columns: `ContactDetails_ID` (int PK), `Personnel_ID` (FK, nullable), `Organization_ID` (FK, nullable), `AllowedValue_ID` (FK, contact type), `ContactDetails_Value` (string, the phone/email/address value).

CHECK ensures exactly one of `Personnel_ID` or `Organization_ID` is set.

### Project
Post-award funded research project.

Columns: `Project_ID` (string PK), `Project_Title`, `Acronym`, `Parent_Project_ID` (FK, self-ref for multi-component awards), `Project_Type_Value_ID` (FK AllowedValue), `Abstract`, `Start_Date`, `End_Date`, `Lead_Organization_ID` (FK), `Project_Status` (default `Active`).

### DataDictionary
Metadata governance catalog for tables, columns, views.

Columns: `DataDictionary_ID` (int PK), `Entity` (table/column/view name), `Entity_Type` (Table, Column, View), `Parent_Entity` (for columns), `Description`, `Synonyms` (comma-separated), `PII_Flag`, `Data_Classification` (Public, Internal, Sensitive, Restricted).

Unique: `(Entity, Entity_Type, Parent_Entity)`.

### ActivityLog
Audit trail. Model exists, comprehensive audit logging "not yet implemented" per canonical doc.

Columns: `Activity_ID` (int PK), `Table_Name`, `Record_ID`, `Action_Type` (CREATE, UPDATE, DELETE), `Action_Timestamp`, `User_ID`, `Old_Values` (JSON), `New_Values` (JSON), `IP_Address`, `Session_ID`.

Audit notes:
- Zero indexes beyond PK. No retention. Sole read path: `(Table_Name="Award", Record_ID=award_id) ORDER BY Action_Timestamp DESC LIMIT`. 54 write call sites; wizard auto-save fires every 800 ms.

### TokenBlacklist
Revoked JWT identifiers, persistent across server restart.

Columns: `JTI` (string PK), `Expires_At` (tz-aware), `Blacklisted_At` (tz-aware).

Audit: purge runs only at app startup; `Expires_At` unindexed.

---

## 2. RFA Analysis Entities

Pipeline: OCR + LLM extraction. Multiple runs per RFA supported for cross-evaluation.

### RFAAnalysisRun
Columns: `AnalysisRun_ID` (int PK), `RFA_ID` (FK), `Analysis_Type` (comprehensive_checklist, ffr_checklist, eligibility_review, budget_review, custom), `Run_Label`, `Adapter_Name`, `Model_Name`, `Prompt_Version`, `Source_Document_Hash`, `Source_Document_Name`, `Summary_Text`, `OCR_Markdown`, `Raw_Output`, `Status` (pending, completed, failed, superseded), `Items_Extracted`, `Sections_Extracted`, `Started_At`, `Completed_At`, `Created_By_User_ID` (FK User), `Is_Current` (active source-of-truth flag).

Index: `(RFA_ID, Analysis_Type, Is_Current)` for current-run lookups.

Audit: `Is_Current` is one of three application-enforced singletons (no partial unique index).

### RFAAnalysisSection
Columns: `AnalysisSection_ID` (int PK), `AnalysisRun_ID` (FK), `Section_Key`, `Section_Label`, `Section_Type` (key_value, table, rule_list, narrative, mixed), `Sort_Order`, `Summary_Text`.

Unique: `(AnalysisRun_ID, Section_Key)`.

### RFAAnalysisItem
Columns: `AnalysisItem_ID` (int PK), `AnalysisSection_ID` (FK), `Item_Key`, `Item_Label`, `Item_Value`, `Item_Detail`, `Item_Type` (text, date, currency, integer, boolean, duration, rule), `Parsed_Date`, `Parsed_Number` (Decimal(18,2)), `Parsed_Boolean`, `Is_Required`, `Sort_Order`, `RFARequirement_ID` (FK, materialized link).

---

## 3. Compliance Protocol Entities

All three modules share the structural pattern: root protocol + sub-resource tables + personnel + review-step tables + amendment tables with their own review steps.

### IACUC (21 models)

**Root:** `IACUCProtocol` — study description, USDA pain category (auto-classified), optional `Proposal_ID` linkage, `Renewal_Of_Protocol_ID` for triennial renewal lineage, terminal statuses Expired/Closed/Suspended. `PI_Personnel_ID` direct FK.

**Sub-resources:** `IACUCSpecies` (strain, count, USDA pain per species, justification), `IACUCProcedure` (pain category, anesthesia, survival status), `IACUCHazard` (biological/chemical/physical/radiation), `IACUCAlternativesSearch` (3Rs literature search), `IACUCProtocolPersonnel` (roles, training, species experience).

**Workflow:** `IACUCReviewStep` (Vet Pre-Review → Coordinator Triage → DMR/FCR → Committee Decision; per-step status, reviewer, timestamps), `IACUCAmendment`, `IACUCAmendmentReviewStep`.

**Lifecycle:** `IACUCAnnualReview` (PI certifies compliance, animal usage, adverse events; per PHS Policy), `IACUCAnnualReviewStep` (single Coordinator Review), `IACUCProtocolClosure` (final report: animals used vs. approved, disposition, outcomes, publications; one per protocol via unique constraint; approval moves protocol to Closed), `IACUCClosureReviewStep`.

**Committee:** `IACUCCommitteeMember` (role, appointment term, PHS Policy IV.A.3 flags `Is_Scientist`, `Is_Nonscientist`, `Is_Unaffiliated`; FK to Personnel), `IACUCMemberRecusal` (COI tracking; unique on `(Member_ID, Protocol_ID)`).

**Meetings:** `IACUCMeeting` (Regular/Special/Emergency, quorum, minutes, location), `IACUCMeetingProtocol` (junction; vote tallies for/against/abstain; committee decision), `IACUCMeetingAttendance` (per-member with arrival/departure for quorum), `IACUCMeetingActionItem` (assignee, status, optional Protocol_ID).

**DMR Notifications:** `IACUCDMRNotification` (PHS Policy IV.C.2 batch; response window, Open/Closed, FCR call-up), `IACUCDMRNotificationResponse` (per-member no_objection/request_fcr; unique on `(Notification_ID, Member_ID)`).

Audit notes:
- All ~9 protocol child relationships declared `lazy="selectin"`.
- `IACUCAmendment.Protocol_ID` indexed; child wizard tables (Species, ProtocolPersonnel, Procedure, Hazard, AlternativesSearch, DMRNotification) have unindexed Protocol_ID FKs despite CASCADE deletes.
- `PI_Personnel_ID` unindexed (vs. `Proposal_ID` and `Renewal_Of_Protocol_ID` which are indexed).
- PI is effectively stored twice: as `IACUCProtocol.PI_Personnel_ID` and as a row in `IACUCProtocolPersonnel`.
- `IACUCProtocolClosure.Transfer_Protocol_ID` stored as bare string, not a FK.

### IRB (10 models)

**Root:** `IRBProtocol` — study design, methodology, risk level (auto-assessed), review category (Exempt/Expedited/Full Board), optional Proposal_ID. `PI_Personnel_ID` FK.

**Sub-resources:** `IRBStudyPopulation` (age, vulnerability, inclusion/exclusion, recruitment), `IRBIntervention` (type, risk description), `IRBRiskCategory` (risk/benefit), `IRBConsentProcess` (written/verbal/waiver), `IRBLiteratureReview` (scientific justification), `IRBProtocolPersonnel` (roles, training).

**Workflow:** `IRBReviewStep` (Exempt = coordinator review; Expedited = chair/designee; Full Board = committee vote), `IRBAmendment`, `IRBAmendmentReviewStep`.

Audit: identical FK indexing gaps to IACUC. `PI_Personnel_ID` unindexed.

### IBC (7 models)

**Root:** `IBCProtocol` — project description, biosafety level (auto-classified from agents), containment, waste disposal, optional Proposal_ID. `PI_Personnel_ID` FK.

**Sub-resources:** `IBCBiologicalAgent` (organisms, toxins, recombinant DNA; risk group; source), `IBCProcedure` (containment, PPE), `IBCProtocolPersonnel` (roles, biosafety training).

**Workflow:** `IBCReviewStep` (Coordinator Triage → DMR/FCR → Committee Decision), `IBCAmendment`, `IBCAmendmentReviewStep`.

Audit: `IBCProtocol.Proposal_ID` is indexed (migration `20260325_749c6cab83d2`); IBC document-upload UI passes `'IBCProtocol'` but it is absent from both the Document CHECK and API allowlist.

---

## 4. Personnel Review Entities

The personnel review module auto-evaluates PI/Co-PI eligibility (APM 45.22), compliance status (SFI, MFTRP, RST), and sponsor-specific requirements. Budget and Compliance review workspaces share `ChecklistItem` infrastructure but persist progress via `Checklist_Type='proposal'` rather than `ReviewFinding`.

### EligibilityOverride
VPR override requests for personnel not meeting APM 45.22 PI/Co-PI eligibility.

Columns: `Override_ID` (int PK), `Personnel_ID` (FK), `Proposal_ID` (FK, nullable), `APM_Category`, `Requested_Role` (PI, Co-PI), `Request_Date`, `Status` (pending, approved, rejected), `Justification`, `Requested_By_Personnel_ID` (FK), `Decided_By_Personnel_ID` (FK), `Decision_Date`, `Decision_Notes`.

Audit: zero indexes on this table beyond PK. Only CHECK is `ck_eligibility_override_status`. Docstring promises `Related_Entity_Type='EligibilityOverride'` for evidence Document attachments but that value is in neither the CHECK nor the API allowlist.

### PersonnelComplianceRecord
Per-person SFI, MFTRP training, RST status.

Columns: `Record_ID` (int PK), `Personnel_ID` (FK), `Compliance_Type` (SFI, MFTRP_Training, RST), `Status` (current, expired, missing, not_required), `Completion_Date`, `Expiration_Date`, `Notes`.

Audit: no `UniqueConstraint (Personnel_ID, Compliance_Type)`. Duplicates allowed; review engine resolves nondeterministically.

### SponsorCompliancePolicy
Sponsor-specific covered-individual rules for MFTRP/RST. Seeded for DoD, DoE, NASA, NIH, NSF, USDA.

Columns: `Policy_ID` (int PK), `Sponsor_Organization_ID` (FK), `Policy_Label`, `Covered_Individual_Rule` (key_personnel, senior_key_personnel, all_ui_employed, fte_threshold, custom), `Covered_Individual_Description`, `FTE_Threshold_Percent` (Decimal(5,2)), `MFTRP_Required` (Boolean), `RST_Required` (yes, no, not_yet, if_required_in_foa), `RST_Effective_Date`, `Notes`.

### SponsorEligibilityRule
Sponsor-level PI/Co-PI eligibility constraints combined with RFA-specific rules.

Columns: `Rule_ID` (int PK), `Sponsor_Organization_ID` (FK), `Rule_Type` (degree_required, us_citizen_required, early_career, institution_type, senior_role_limit, custom), `Rule_Label`, `Applies_To_Role` (PI, CO_PI, PI_AND_CO_PI, ALL_SENIOR_KEY), `Degree_Types` (JSON), `Max_Years_Since_Degree` (for early_career), `Description`, `Is_Active`.

### ReviewFinding (STI)
Auto-evaluated findings from proposal review engines. Discriminator: `Review_Type` ∈ {`personnel`, `document`, `content`}. Persists across review sessions; OSP admins can acknowledge.

Columns: `Finding_ID` (int PK), `Review_Type`, `Proposal_ID` (FK, CASCADE), `Document_ID` (FK, nullable), `Personnel_ID` (FK, nullable), `Check_Category` (internal_eligibility, document_completeness, page_compliance, etc.), `Check_Code` (e.g., `apm_category_ineligible`, `sfi_expired`), `Severity` (pass, warn, fail, info), `Message`, `Details`, `Is_AI_Generated` (Boolean; personnel always false), `Can_Override` (Boolean), `Acknowledged`, `Acknowledged_By_Personnel_ID` (FK), `Acknowledged_At`, `Acknowledge_Notes`, `Created_At`.

Audit notes:
- Merged June 2026 (migration `20260601_e1f2a3b4c5d6`) from `PersonnelReviewFinding`, `DocumentReviewFinding`, `ContentReviewFinding`.
- Only indexed column: `Review_Type` (3-value discriminator). `Proposal_ID` unindexed despite per-proposal delete-and-recreate engine pattern.

### AllowedValue
System-wide lookup. Groups (with example values):
- ProjectRole: PI, Co-PI, Senior, Key, Tech.
- ProjectType: Research, Instruction, Fellowship, Equipment, Conference.
- DocumentType: Narrative, Budget Justification, Biosketch, Data Management Plan, etc.
- COIRelationship: Equity, Consulting, Board Membership, Royalties.
- ProposalCategory: Full Proposal, Preliminary/Pre-Proposal, Sub-Project.
- ProposalActionType: New, Renewal, Continuation, Supplement, Revision, Resubmission, Transfer-in.
- AgreementType: Grant, Cooperative Agreement, Contract, Subaward, Other.
- CampusType: On-Campus, Off-Campus, Ag & Forestry Research, Ag & Forestry Non-Research.
- CampusLocation: Moscow, Boise, Coeur d'Alene, Idaho Falls, Twin Falls.
- SponsorRegulatory: DoD, NIST SP 800-171, CMMC, CUI, DOE, NASA, NIH, NSF.
- ExportControl: Foreign Involvement, Military/Defense, Publication Restrictions, UAS/Drone, etc.
- ResearchInstitute: IIDS, IMCI, ARI, IWRRI, IGS, CAES, IHHE, ICS.
- AppointmentType: Tenured, Tenure-Track, Non-Tenure-Track, Research Faculty, Extension Faculty, Clinical Faculty, Postdoctoral Fellow, Staff, Graduate Student, etc.
- FacultyRank: Professor, Associate Professor, Assistant Professor, Lecturer, Senior Lecturer, Clinical Professor, Research Scientist I/II/III.
- SubmissionSystem: Grants.gov, Research.gov, eRA Commons, NSPIRES, Manual Submission, Other.
- SubmissionEnvironment: Training, Production.
- PackageAssemblyStatus: Pending Assembly, Assembled, Validated, Assembly Failed.
- SubmissionAttemptStatus: Submitting, Submitted, Received, Validated, Rejected, Accepted, Error.
- SubmissionEventType: Status Change, Agency Note, Operator Action, Error, Validation Result.
- SponsorDocumentType: Project Narrative (SF424), Budget Narrative/Justification, Biographical Sketch, Current & Pending Support, Facilities & Equipment, Data Management Plan, Letter of Support/Collaboration, Subaward Budget, Other Attachment.

---

## 5. AI Configuration Entities

### LLMEndpoint
Registered AI provider endpoints.

Columns (snake_case): `id` (int PK), `name`, `endpoint_url`, `api_key_env_var`, `model_name`, `provider_type` (default `openai_compatible`), `is_active`, `endpoint_kind` (ocr, llm, extraction; default llm), `purpose` (deprecated).

### AIWorkflowMapping
Maps workflow tasks to provider endpoints.

Columns: `id` (int PK), `workflow_task` (unique), `llm_endpoint_id` (FK, SET NULL).

Workflow tasks: `rfa_ocr`, `rfa_analysis`, `rfa_extraction`, `document_analysis`, `award_document_analysis`, `content_review`, `sponsor_doc_defaults` (Pass 1 of two-pass pipeline), `rfa_doc_requirements` (Pass 2), `budget_justification`, `budget_review` (AI-ready), `compliance_check` (AI-ready), `proposal_review` (AI-ready), `general` (fallback).

---

## 6. Sponsor Submission Entities

Lifecycle from internal approval through external transmission to Grants.gov, Research.gov, eRA Commons.

### SubmissionPackage
Immutable point-in-time snapshot of assembled documents.

Columns: `Submission_Package_ID` (int PK), `Proposal_ID` (FK, CASCADE), `Package_Version` (unique per proposal), `Assembly_Status` (pending, assembled, validated, failed), `Preflight_Results` (JSON), `Assembled_At`, `Package_Hash` (SHA-256), `Assembled_By_User_ID` (FK, SET NULL).

Unique: `(Proposal_ID, Package_Version)`.

### SubmissionAttachment
Package manifest entry.

Columns: `Submission_Attachment_ID` (int PK), `Submission_Package_ID` (FK, CASCADE), `Document_ID` (FK, RESTRICT), `Sponsor_Document_Type`, `File_Hash_At_Packaging` (SHA-256), `Sort_Order`.

Unique: `(Submission_Package_ID, Document_ID)`. RESTRICT on Document prevents deletion of documents in submitted packages.

### SubmissionAttempt
Each outbound transmission of a package.

Columns: `Submission_Attempt_ID` (int PK), `Submission_Package_ID` (FK, CASCADE), `Submission_System`, `Environment`, `Status` (submitting, submitted, received, validated, rejected, accepted, error), `External_Tracking_Number`, `Submitted_At`, `Response_Data` (JSON), `Error_Detail`, `Submitted_By_User_ID` (FK, SET NULL).

Indexes: `Submission_Package_ID`, `Status`, `External_Tracking_Number`.

### SubmissionEvent
Granular audit event per attempt.

Columns: `Submission_Event_ID` (int PK), `Submission_Attempt_ID` (FK, CASCADE), `Event_Type` (status_change, agency_note, operator_action, error, validation_result), `Event_Timestamp`, `Previous_Status`, `New_Status`, `External_Data` (JSON), `Description`, `User_ID` (FK, SET NULL).

Indexes: `Submission_Attempt_ID`, `Event_Type`.

---

## 7. Award Entities

Post-award lifecycle. Extends the pre-award entities (Proposal, Project, Organization, Personnel) rather than replacing them. Several entities are institution-specific extensions.

`Transaction` rows are read-only copies of Banner financial data. `AwardDocumentExtraction` and `AwardExtractedField` are LLM-produced; analysts confirm values but raw output is preserved.

### Award
Columns: `Award_ID` (string PK, e.g., `AWARD-001`), `Proposal_ID` (FK, unique, one award per proposal), `Project_ID` (FK), `Sponsor_Organization_ID` (FK), `Award_Title` (auto-populated from proposal), `Award_Number` (unique), `Sponsor_Award_Number`, `Award_Status` (13-state machine: Intake In Progress, JIT Pending, Under Review, Ready for Setup, Sent to Banner, Active, Setup Blocked, Modification Pending, NCE Pending, Suspended, Closeout Pending, Closed, Terminated), `Award_Received_Date`, `Start_Date`, `End_Date` (auto-updated on approved NCE).

Audit notes:
- `Proposal_ID` FK is NOT NULL with no `ondelete` specified. No `Created_At` / `Updated_At` (one of two timestampless root entities).

### AwardBudget
Columns: `Award_Budget_ID` (int PK), `Award_ID` (FK, unique), `Total_Obligated` (Decimal), `Total_Anticipated` (Decimal), `Row_Version`.

### AwardBudgetPeriod
Columns: `Budget_Period_ID` (int PK), `Award_Budget_ID` (FK), `Period_Number`, `Period_Label`, `Start_Date`, `End_Date`, `Obligated_Amount` (Decimal), `Direct_Cost_Budget` (Decimal), `Indirect_Cost_Budget` (Decimal), `Is_Current` (Boolean).

Unique: `(Award_Budget_ID, Period_Number)`.

### Transaction
Read-only financial transactions synced from Banner.

Columns: `Transaction_ID` (int PK), `Award_ID` (FK), `Budget_Period_ID` (FK, SET NULL on period delete), `Transaction_Type` (expenditure, encumbrance, revenue, transfer), `Transaction_Date`, `Posted_Date`, `Amount` (Decimal), `Description`, `Banner_Document_Number`, `Category_Code`, `Fund_Code`, `Account_Code`, `Sync_Source` (manual, lakehouse, api; default manual), `Synced_At`.

### AwardModification
Post-award modification requests. Submitting a mod auto-shifts award status to `Modification Pending` or `NCE Pending`; approving an NCE updates `End_Date`.

Columns: `Modification_ID` (UUID PK), `Award_ID` (FK), `Modification_Number` (unique), `Modification_Type_Value_ID` (FK AllowedValue; 7 values: NCE, supplemental, budget reallocation, PI change, scope change, reduction, termination), `Modification_Status` (Draft, Submitted, Under Review, Approved, Rejected, Withdrawn), `Summary`, `Justification`, `Requested_End_Date` (NCE), `Requested_Budget_Change` (Decimal), `Sponsor_Approval_Required` (Boolean), `Sponsor_Approval_Date`, `Submitted_At`, `Reviewed_At`, `Reviewer_Notes`, `Created_By`, `Reviewed_By` (actor usernames).

### Award setup checklist
Lives in `ChecklistItem` with `Checklist_Type='award'` (formerly `AwardSetupChecklistItem`). 20-item intake workflow. `Is_Blocker` items gate `Ready for Setup` → `Sent to Banner`.

### AwardCorrespondence
Sponsor/subawardee communications, tracked with action items.

Columns: `Correspondence_ID` (UUID PK), `Award_ID` (FK), `Direction` (Inbound, Outbound), `Correspondence_Type_Value_ID` (FK AllowedValue), `Channel` (Email, Portal, Letter, Phone, Fax, Other), `Subject`, `Summary`, `Correspondence_Date`, `Source_Organization_ID` (FK), `Source_Contact_Name`, `Source_Contact_Email`, `Action_Required` (Boolean), `Action_Due_Date`, `Action_Assignee_ID` (FK Personnel), `Action_Resolved_At`, `Status` (Draft, Active, Action Required, Resolved, Archived).

### AwardCorrespondenceModification
Many-to-many junction.

Columns: `Correspondence_ID` (PK, FK), `Modification_ID` (PK, FK).

### AwardDocumentExtraction
Read-only LLM extraction runs over award documents.

Columns: `Extraction_ID` (int PK), `Award_ID` (FK), `Document_ID` (FK), `Status` (pending, completed, failed, superseded), `OCR_Markdown`, `Raw_Output`, `Summary_Text`, `Adapter_Name`, `Model_Name`, `Prompt_Version`, `Source_Document_Hash`, `Fields_Extracted`, `Started_At`, `Completed_At`, `Created_By_User_ID` (FK), `Is_Current`.

Audit: `Is_Current` is application-enforced singleton (no partial unique index).

### AwardExtractedField
Individual extracted field with analyst confirmation.

Columns: `Field_ID` (int PK), `Extraction_ID` (FK), `Field_Key`, `Field_Label`, `Field_Value`, `Field_Type` (text, date, currency, integer, boolean, duration, list), `Confidence` (Decimal 0-1), `Is_Confirmed`, `Confirmed_Value`, `Confirmed_By_ID` (FK User), `Confirmed_At`, `Source_Page`, `Source_Text`, `Sort_Order`.

### BannerSetup
Four-code Banner handoff (Fund, Index, Account, Org). One per award.

Columns: `Banner_Setup_ID` (int PK), `Award_ID` (FK, unique), `Handoff_Status` (not_requested, requested, codes_received, confirmed, failed), `Banner_Fund_Code`, `Banner_Index_Code`, `Banner_Account_Code`, `Banner_Org_Code`, `Requested_At`, `Codes_Entered_At`, `Confirmed_At`, `Requested_By_ID`, `Codes_Entered_By_ID`, `Confirmed_By_ID` (FK User), `Notes`, `Row_Version`.

### AwardSubaward
Post-award subaward record, optionally linked to a `ProposalSubaward`.

Columns: `Award_Subaward_ID` (UUID PK), `Award_ID` (FK), `Proposal_Subaward_ID` (FK, nullable), `Subawardee_Organization_ID` (FK), `Subawardee_Name`, `Subawardee_PI_Name`, `Subawardee_PI_Email`, `Description`, `Subaward_Number`, `Subaward_Status` (Draft, Submitted, Under Review, Active, Closeout Pending, Closed), `Subaward_Type_Value_ID` (FK), `Start_Date`, `End_Date`, `Obligated_Amount` (Decimal), `Anticipated_Amount` (Decimal), `Submitted_At`, `Reviewed_At`, `Reviewed_By`, `Reviewer_Notes`.

Unique: `(Award_ID, Subaward_Number)`.

### AwardSubawardInvoice
Subawardee invoice tracking.

Columns: `Invoice_ID` (int PK), `Award_Subaward_ID` (FK), `Invoice_Number`, `Invoice_Date`, `Amount` (Decimal), `Invoice_Status` (Received, Under Review, Approved, Paid, Rejected), `Period_Start`, `Period_End`, `Received_Date`, `Approved_Date`, `Approved_By`, `Notes`.

Index: `(Award_Subaward_ID, Invoice_Date)`.

---

## 8. Cross-cutting patterns

### Single-table inheritance (STI)
- `ChecklistItem` (June 2026 merge): `Checklist_Type` ∈ {proposal, award}. Both `Proposal_ID` and `Award_ID` kept as real FKs.
- `ReviewFinding` (June 2026 merge): `Review_Type` ∈ {personnel, document, content}.
- `LLMEndpoint`: `endpoint_kind` ∈ {ocr, llm, extraction}.

### Polymorphic via string columns (no FK)
- `Document`: `Related_Entity_Type` (CHECK) + `Related_Entity_ID` (string).
- `ActivityLog`: `Table_Name` + `Record_ID`.

### Application-enforced singletons (`Is_Current`)
- `RFAAnalysisRun.Is_Current` (per RFA + Analysis_Type).
- `AwardDocumentExtraction.Is_Current` (per Award + Document).
- `AwardBudgetPeriod.Is_Current` (per AwardBudget).
- Plus (per audit) ResearchSecurityProgram.

### Optimistic concurrency
- `Row_Version` columns: Proposal, ChecklistItem, AwardBudget, BannerSetup. Clients must echo read value; 409 on mismatch.

### Read-only / immutable patterns
- `SubmissionPackage`: immutable once an attempt references it.
- `Transaction`: read-only from Banner.
- `AwardDocumentExtraction`, `AwardExtractedField`: raw LLM output preserved for audit even when analyst confirms.

### State machines
- Award: 13-state.
- Proposal: dual fields (`Internal_Approval_Status` ∪ `Decision_Status`).
- ApprovalStep: status vocabulary from approval workflow registry.
- 8 byte-identical review-step tables across IACUC/IRB/IBC (audit; Status CHECK on only 3 of 8).
- Audit cites ~48 status state machines validated under 5 regimes.

### "Person plays role on thing" (audit: 7 ways)
Visible: `ProjectRole`, `IACUCProtocolPersonnel`, `IRBProtocolPersonnel`, `IBCProtocolPersonnel`, plus `PI_Personnel_ID` direct FK on each protocol root and `IACUCCommitteeMember` for committee membership.

### Training currency tracked three ways (audit)
- `PersonnelComplianceRecord` (SFI, MFTRP_Training, RST).
- `IACUCProtocolPersonnel.training_status`, `IRBProtocolPersonnel.training_status`, `IBCProtocolPersonnel.training_status` (per-protocol).
- Third mechanism not named in surviving audit text.

### ondelete behavior observed
- CASCADE: ProposalSubaward → Proposal; SubmissionPackage → Proposal; SubmissionAttachment → SubmissionPackage; SubmissionAttempt → SubmissionPackage; SubmissionEvent → SubmissionAttempt; protocol child tables → protocol.
- SET NULL: ProposalSubaward.Subawardee_Organization_ID; Document.Subaward_ID; SubmissionPackage.Assembled_By_User_ID; SubmissionAttempt.Submitted_By_User_ID; SubmissionEvent.User_ID; AIWorkflowMapping.llm_endpoint_id; Transaction.Budget_Period_ID.
- RESTRICT: SubmissionAttachment.Document_ID (prevents document deletion when in a submitted package).
- Unspecified (audit flag): Award.Proposal_ID is NOT NULL with no ondelete; admin proposal deletes raise IntegrityError post-Award.

### Money handling
- `Decimal` / `Decimal(18,2)` throughout. No `Float` columns (audit).
- Audit: pre-award budget pipeline drifts ±$1.00 because schema/parser layers use non-Decimal types before quantizing.

---

## 9. Migration / schema metadata (audit)

- 51 Alembic revisions total.
- Initial schema: `20260227_2f07554ed03d`.
- Dedicated FK-index pass: `20260314_d260b1abb855` (indexed Proposal FKs, missed RFA's `Sponsor_Organization_ID` in the same file).
- IACUC/IRB compliance indexes: `20260326_db7f70749e5c` (added amendment + review-step composites, missed wizard child tables).
- IBC indexes: `20260325_749c6cab83d2` (`IBCProtocol.Proposal_ID`, amendment + review-step composites only).
- STI merges: `20260601_e1f2a3b4c5d6` (ReviewFinding), `20260601_f2a3b4c5d6e7` (ChecklistItem).
- Pre-merge Award checklist: `20260401_a2b3c4d5e6f7` (`uq_award_checklist_entry (Award_ID, Requirement_Category, Requirement_Code)`).
- No `MetaData(naming_convention=...)` (199 of 200 FK constraints unnamed).
- `compare_server_default` not enabled in `env.py`.
- Three timezone regimes coexist (`aware_utc_now()`, naive timestamps into tz-aware columns, plus a third unnamed).

---

## 10. Not visible from the source documents

- The 11th value in the Document `ck_document_entity_type` CHECK (audit cited 11 but enumerated 10).
- Full column list of Personnel beyond the audit-confirmed fields.
- Several entities referenced in the ERD but not detailed inline (BudgetCategory beyond the code/name table).
- "Four generations of audit-trail columns" (audit cited but did not enumerate).
- The 5 status-validation regimes underlying the ~48 state machines (only the approval-workflow registry is named).
- Complete list of `Document.Related_Entity_Type` values used at runtime (audit shows three divergent allowlists).
