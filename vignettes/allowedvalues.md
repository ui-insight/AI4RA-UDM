# AllowedValues and fixed lists

This document is generated from `udm_schema.json` by `scripts/generate_allowed_values_doc.py`. Change the schema, then run the script.

The UDM controls the values of a column in one of two ways.

**Fixed lists** are the same at every institution. They define the model, so an institution can't add to them. They are enforced with a CHECK constraint or ENUM. Statuses and columns ending in `_Type` are fixed lists.

**AllowedValues lists** can vary by institution. Each list is a `Value_Group` in the `AllowedValues` table, and institutions can add values to it. A local value can set `Canonical_Value_Code` to the recommended value it corresponds to, so institutions stay comparable. Columns ending in `_Value_ID` use these lists.

**Which to use:** use a fixed list when a value changes what a rule does or has to mean the same thing everywhere. Use AllowedValues when institutions legitimately differ and no rule depends on a local value.

## AllowedValues lists

| Value_Group | Used by | Recommended values |
|---|---|---|
| ActionType | `Action.Action_Type_Value_ID` | `Checklist_Item`, `Service_Request`, `Modification_Approval`, `Compliance_Renewal`, `Training_Required`, `Training_Completion`, `Subrecipient_Risk_Review`, `Monitoring_Exception`, `Cost_Transfer_Approval`, `JIT_Request`, `Other` |
| AdverseEventDetermination | `ProtocolAdverseEvent.Determination_Value_ID` | `No_Action_Required`, `Continuing_Review_Required`, `Modification_Required`, `Protocol_Suspension`, `Protocol_Termination`, `Reporting_Only` |
| AdverseEventType | `ProtocolAdverseEvent.Event_Type_Value_ID` | None. Institutions define their own |
| ApprovalStepType | `Approval.Step_Type_Value_ID` | `Budget_Review`, `Compliance_Review`, `Supplementary_Review`, `PI_Certification`, `Co_PI_Certification`, `Department_Review`, `College_Review`, `Pre_Award_Review`, `Final_Sign_off`, `Release_to_Submit`, `Post_Award_Review`, `Other` |
| COIRelationshipType | `ConflictOfInterest.Relationship_Type_Value_ID` | `Financial`, `Consulting`, `Employment`, `Equity`, `Royalty`, `Board_Membership` |
| CommitteeMemberRole | `CommitteeMember.Role_Value_ID` | `Chair`, `Vice_Chair`, `Member`, `Ex_Officio_Member`, `Observer` |
| CommunicationResponseType | `CommunicationResponse.Response_Type_Value_ID` | `DMR_FCR`, `RPPR_Signoff`, `COI_Annual`, `IRB_Concurrence`, `JIT_Component`, `Effort_Certification` |
| CommunicationResponseValue | `CommunicationResponse.Response_Value_Value_ID` | None. Institutions define their own |
| ComplianceClassificationLevel | `ComplianceRequirement.Compliance_Classification_Level_Value_ID` | None. Institutions define their own |
| ComplianceReviewPathway | `ComplianceRequirement.Review_Pathway_Value_ID` | None. Institutions define their own |
| ContactType | `ContactDetails.Contact_Type_Value_ID` | `Email`, `Phone`, `Mobile`, `Fax`, `Mailing_Address` |
| CostShareCommitmentType | `CostShare.Commitment_Type_Value_ID` | `Cash`, `In_Kind`, `Third_Party`, `Waived_IDC`, `Effort_Only` |
| DeadlineType | `Deadline.Deadline_Type_Value_ID` | None. Institutions define their own |
| DocumentType | `Document.Document_Type_Value_ID` | `NOA`, `Biosketch`, `DMP`, `Budget_Justification`, `Other_Support`, `Public_Access_Plan`, `LOI`, `Sponsor_Agreement`, `Subaward_Agreement`, `Modification_Notice`, `Approved_Items_Schedule`, `Closeout_Document`, `Compliance_Approval_Letter`, `Restriction_Authority_Document`, `Training_Certificate` |
| FinanceCodePurpose | `FinanceCode.Purpose_Value_ID` | `Direct_Costs`, `Cost_Share`, `Indirect_Costs`, `Subcontract` |
| FundType | `Fund.Fund_Type_Value_ID` | `Restricted`, `Unrestricted`, `Endowment`, `Sponsored_Program` |
| FundingMechanism | `RFA.Mechanism_Value_ID`, `Proposal.Mechanism_Value_ID`, `Award.Mechanism_Value_ID` | `Research_Project`, `Center_Or_Program`, `Career_Development`, `Fellowship`, `Training`, `Small_Business`, `Equipment_Infrastructure`, `Conference`, `Planning`, `Construction`, `Other` |
| HumanSubjectsInterventionType | `HumanSubjectsIntervention.Intervention_Type_Value_ID` | `Survey`, `Interview`, `Observation`, `Drug`, `Device`, `Behavioral`, `Surgical`, `Biospecimen`, `Other` |
| ModificationEventType | `Modification.Event_Type_Value_ID` | `Incremental_Funding`, `No_Cost_Extension`, `Budget_Revision`, `PI_Change`, `Scope_Change`, `Carryover`, `Rebudget`, `Sponsor_Transfer`, `Supplement`, `Cost_Transfer_Authorization`, `Advance_Funding`, `Partial_Suspension`, `Partial_Termination` |
| OrganizationCapability | `OrganizationCapability.Capability_Value_ID` | `Sponsor`, `Prime_Sponsor`, `Subrecipient`, `Vendor`, `Committee`, `Program_Office`, `Pass_Through_Entity` |
| OrganizationRole | `OrganizationRole.Role_Value_ID` | `Chair`, `Vice_Chair`, `Member`, `Ex_Officio`, `Alternate`, `Program_Officer`, `Grants_Management_Specialist`, `Contract_Officer`, `Scientific_Review_Officer`, `Authorized_Official`, `Signing_Official`, `Technical_Contact`, `Financial_Contact`, `Compliance_Contact`, `Subrecipient_PI_Contact`, `Subrecipient_Project_Lead`, `Sponsored_Programs_Administrator`, `Award_Administrator`, `Administrative_Contact` |
| ProposalType | `Proposal.Proposal_Type_Value_ID` | `New`, `Resubmission`, `Renewal`, `Continuation`, `Revision`, `Task_Order` |
| ProtocolClassificationLevel | `Protocol.Classification_Level_Value_ID` | None. Institutions define their own |
| ProtocolPersonnelRole | `ProtocolPersonnel.Role_Value_ID` | `Primary_Investigator`, `Co_Investigator`, `Study_Coordinator`, `Research_Staff`, `Consenting_Personnel`, `Lab_Manager`, `Veterinary_Staff`, `Biosafety_Officer`, `Other` |
| ProtocolReviewPathway | `Protocol.Review_Pathway_Value_ID` | None. Institutions define their own |
| ProtocolReviewStepName | `ProtocolReviewStep.Step_Name_Value_ID` | None. Institutions define their own |
| ProtocolRole | `ProtocolRole.Role_Value_ID` | `Primary_Investigator`, `Co_Investigator`, `Study_Coordinator`, `Research_Staff`, `Consenting_Personnel`, `Lab_Manager`, `Veterinary_Staff`, `Biosafety_Officer`, `Radiation_Worker`, `TCP_Cleared_Personnel`, `Other` |
| RestrictionType | `Restriction.Restriction_Type_Value_ID` | `CUI`, `CMMC_Level_1`, `CMMC_Level_2`, `CMMC_Level_3`, `EAR`, `ITAR`, `Publication_Hold`, `Foreign_Personnel_Limit`, `Site_Restriction` |
| ReviewTopic | `Approval.Review_Topic_Value_ID` | `Export_Control`, `Cost_Share`, `Indirect_Rate_Waiver`, `Conflict_Of_Interest`, `Human_Subjects`, `Animal_Use`, `Biosafety`, `Data_Management`, `Subrecipient`, `Other` |
| SubmissionChannel | `SubmissionAttempt.Channel_Value_ID` | `Federal_Portal`, `Sponsor_Portal`, `Email`, `Paper`, `Other` |
| TeamRole | `TeamRole.Role_Value_ID` | `PI`, `Co_PI`, `Co_I`, `Multi_PI`, `Coordinator`, `Cohort_Participant`, `Coach`, `Mentor`, `Trainee` |
| TransactionType | `Transaction.Transaction_Type_Value_ID` | `Expense`, `Revenue`, `Encumbrance`, `Transfer`, `Adjustment`, `Reversal`, `Cost_Share`, `Project_Income`, `Cost_Transfer_In`, `Cost_Transfer_Out` |

## Fixed lists

### Actors

| Column | Values |
|---|---|
| `Personnel.Person_Type` | `Faculty`, `Staff`, `Student`, `Postdoc`, `Resident`, `Fellow`, `External` |
| `PersonnelCredential.Credential_Type` | `Citizenship`, `Visa_Status`, `Permanent_Resident_Status`, `eRA_Commons_ID`, `NSF_FastLane_ID`, `Sponsor_Login_ID`, `CITI_Training`, `IRB_Training`, `IACUC_Training`, `Biosafety_Training`, `Export_Control_Training`, `Security_Clearance`, `Background_Check`, `Authorized_Organizational_Representative`, `Signatory_Delegate`, `Empowered_Official`, `Other` |
| `PersonnelCredential.Credential_Status` | `Active`, `Expired`, `Revoked`, `Pending_Verification` |
| `Organization.Organization_Type` | `Department`, `College`, `School`, `Institute`, `Center`, `External` |
| `Organization.Sponsor_Type` | `Federal`, `State`, `Local`, `Nonprofit`, `Industry`, `Higher_Ed`, `Foreign_Government`, `Tribal`, `Internal`, `Other` |
| `OrganizationCapability.Capability_Status` | `Active`, `Suspended`, `Terminated`, `Probationary` |
| `OrganizationCapability.Risk_Level` | `Low`, `Medium`, `High` |
| `OrganizationIdentifier.Identifier_Type` | `UEI`, `EIN`, `DUNS`, `CAGE`, `IPF`, `IPEDS`, `Sponsor_Code`, `Other` |

### Funding Cycle

| Column | Values |
|---|---|
| `RFA.RFA_Status` | `Active`, `Closed`, `Superseded`, `Cancelled` |
| `RFARequirement.Requirement_Category` | `Eligibility`, `Budget`, `Format`, `Compliance`, `Reporting`, `Personnel`, `Document`, `Review_Criterion`, `Submission`, `Deadline`, `Special_Condition`, `PAPPG_Deviation`, `Other` |
| `Proposal.Internal_Approval_Status` | `Draft`, `In_Review`, `Returned`, `Approved`, `Rejected` |
| `Proposal.Submission_Status` | `Unsubmitted`, `Signed_Off`, `Submitted`, `Received`, `Validated`, `Invalid`, `Accepted`, `Failed`, `Recalled` |
| `Proposal.Decision_Status` | `Unrequested`, `Pending`, `Intent_to_Award`, `Awarded`, `Declined`, `Not_Reviewed`, `Withdrawn` |
| `Proposal.Risk_Level` | `Low`, `Medium`, `High` |
| `Proposal.Activity_Type` | `Organized_Research`, `Instruction`, `Other_Sponsored_Activity` |
| `SubmissionAttempt.Attempt_Status` | `Unsubmitted`, `Submitted`, `Received`, `Validated`, `Invalid`, `Accepted`, `Failed`, `Recalled` |
| `PreAwardAuthorization.Authorization_Status` | `Requested`, `Approved`, `Revoked`, `Converted_To_Award`, `Expired_Unused` |
| `Award.Instrument_Type` | `Grant`, `Cooperative_Agreement`, `Contract`, `Other_Transaction`, `Other` |
| `Award.Activity_Type` | `Organized_Research`, `Instruction`, `Other_Sponsored_Activity` |
| `Award.Research_Character` | `Basic_Research`, `Applied_Research`, `Experimental_Development` |
| `Award.Award_Status` | `In_Setup`, `Active`, `Suspended`, `Closing`, `Closed`, `Adjusting`, `Terminating`, `Terminated` |
| `Award.Termination_Basis` | `Noncompliance`, `Mutual_Agreement`, `Recipient_Request`, `Sponsor_Priorities` |
| `Award.Risk_Level` | `Low`, `Medium`, `High` |
| `Award.Priority` | `Low`, `Medium`, `High`, `Critical` |
| `Modification.Approval_Status` | `Requested`, `Approved`, `Rejected`, `Withdrawn`, `Not_Required`, `Reversed` |
| `Modification.Priority` | `Low`, `Medium`, `High`, `Critical` |
| `Modification.Termination_Basis` | `Noncompliance`, `Mutual_Agreement`, `Recipient_Request`, `Sponsor_Priorities`, `Prime_Terminated` |
| `Subaward.Risk_Level` | `Low`, `Medium`, `High` |
| `Subaward.Subaward_Status` | `Proposed`, `In_Setup`, `Active`, `Suspended`, `Closing`, `Closed`, `Adjusting`, `Terminated`, `Not_Issued` |
| `Subaward.Termination_Basis` | `Noncompliance`, `Mutual_Agreement`, `Recipient_Request`, `Sponsor_Priorities`, `Prime_Terminated` |
| `Negotiation.Negotiation_Status` | `Pending`, `Active`, `On_Hold`, `Resolved`, `Abandoned` |
| `Terms.Payment_Method` | `Reimbursement`, `Advance`, `Cost_Reimbursement`, `Fixed_Price`, `Letter_of_Credit`, `Payment_Request` |
| `Terms.Invoicing_Frequency` | `Monthly`, `Quarterly`, `Semi_Annual`, `Annual`, `Upon_Request`, `Milestone` |
| `Deliverable.Deliverable_Type` | `Report`, `Work_Product`, `Other` |
| `Deliverable.Deliverable_Status` | `Not_Started`, `Drafted`, `Submitted`, `Fulfilled`, `Returned_for_Revision`, `Late`, `Waived` |
| `Report.Report_Type` | `Progress`, `RPPR`, `Financial`, `FFR_SF425`, `Final_Progress`, `Final_Financial`, `Invention_Statement`, `Data_Sharing`, `Equipment_Inventory`, `Audit_Response`, `Other` |
| `Closeout.Final_Invoice_Status` | `Not_Required`, `Not_Started`, `Submitted`, `Paid` |
| `Closeout.Equipment_Disposition_Status` | `Not_Applicable`, `In_Progress`, `Complete` |
| `Closeout.IP_Closeout_Status` | `Not_Applicable`, `In_Progress`, `Complete` |
| `Closeout.COI_Closeout_Status` | `Not_Applicable`, `In_Progress`, `Complete` |
| `Closeout.Closeout_Status` | `In_Progress`, `Awaiting_Sponsor`, `Complete`, `Reopened` |

### Effort

| Column | Values |
|---|---|
| `Effort.Lifecycle_Stage` | `Proposed`, `Approved`, `Charged`, `Certified` |
| `Effort.Calendar_Type` | `Calendar`, `Academic`, `Summer` |
| `Effort.Certification_Method` | `PAR`, `Activity_Report`, `Timesheet`, `Other` |

### Finance

| Column | Values |
|---|---|
| `Budget.Lifecycle_Stage` | `Proposed`, `Approved`, `Current`, `Actual` |
| `Budget.Budget_Mode` | `Itemized`, `Modular` |
| `Account.Account_Type` | `Asset`, `Liability`, `Equity`, `Revenue`, `Expense` |
| `Transaction.Income_Treatment` | `Offset`, `Additive`, `Cost_Sharing` |
| `RateAgreement.Agreement_Status` | `Active`, `Expired`, `Superseded`, `Provisional` |
| `IndirectRate.Rate_Type` | `On_Campus`, `Off_Campus`, `MTDC`, `TDC`, `Clinical_Trial`, `Fringe_Benefits`, `Facilities`, `Administrative` |
| `IndirectRate.Base_Type` | `MTDC`, `TDC`, `Salaries_and_Wages`, `Direct_Salaries` |
| `Payment.Lifecycle_Stage` | `Scheduled`, `Invoiced`, `Paid`, `Reconciled` |
| `Payment.Payment_Direction` | `Incoming`, `Outgoing` |
| `Payment.Payment_Status` | `Clear`, `Disputed`, `Cancelled` |
| `CostShare.Lifecycle_Stage` | `Proposed`, `Committed`, `Met`, `Waived` |
| `CostShare.Waiver_Reason` | `Effort_Not_Materialized`, `Sponsor_Approved_Removal`, `Sponsor_Removed_Requirement`, `Recategorized_To_Other_Funding`, `Other` |
| `Equipment.Title_Vesting` | `Institution`, `Sponsor`, `Vendor`, `Shared`, `To_Be_Determined` |
| `Equipment.Equipment_Status` | `In_Use`, `In_Storage`, `Surplused`, `Transferred`, `Disposed`, `Lost` |

### Compliance

| Column | Values |
|---|---|
| `ComplianceRequirement.Requirement_Type` | `IRB`, `IACUC`, `IBC`, `COI`, `Radiation`, `Export_Control`, `Other` |
| `ComplianceRequirement.Requirement_Status` | `Draft`, `Submitted`, `In_Review`, `Approved`, `Expired`, `Conditional_Approval`, `Disapproved`, `Terminated`, `Suspended`, `Not_Applicable`, `Closed`, `Withdrawn` |
| `ConflictOfInterest.Review_Outcome` | `Under_Review`, `No_Conflict`, `Manageable_Conflict`, `Unmanageable_Conflict`, `Management_Plan_Required`, `Cleared` |
| `OtherSupport.Support_Type` | `Current`, `Pending`, `In_Kind` |
| `OtherSupportDisclosure.Disclosure_Type` | `Initial`, `Annual`, `JIT`, `Progress_Report`, `Research_Security_Reaffirmation`, `Other` |
| `PolicyException.Exception_Status` | `Pending`, `Approved`, `Denied`, `Withdrawn`, `Expired` |

### Records

| Column | Values |
|---|---|
| `Document.Related_Entity_Type` | `Award`, `Subaward`, `Proposal`, `SubmissionAttempt`, `Approval`, `PreAwardAuthorization`, `Personnel`, `PersonnelCredential`, `ComplianceRequirement`, `Modification`, `Action`, `Restriction`, `Budget`, `Negotiation`, `Terms`, `Deliverable`, `Closeout`, `Equipment` |
| `Communication.Related_Entity_Type` | `Award`, `Subaward`, `Proposal`, `SubmissionAttempt`, `RFA`, `Modification`, `Negotiation`, `Terms`, `ComplianceRequirement`, `Personnel`, `Closeout`, `Deliverable` |
| `Communication.Communication_Type` | `Email`, `Phone_Call`, `Meeting`, `Letter`, `Portal_Message`, `Other` |
| `Communication.Direction` | `Inbound`, `Outbound` |
| `Restriction.Related_Entity_Type` | `Award`, `Subaward`, `Proposal`, `Personnel`, `Equipment` |
| `Restriction.Restriction_Status` | `Active`, `Expired`, `Lifted`, `Pending_Review` |
| `Deadline.Related_Entity_Type` | `Award`, `Subaward`, `Proposal`, `Approval`, `ComplianceRequirement`, `Modification`, `RFA`, `Closeout`, `Deliverable`, `Communication` |
| `Deadline.Deadline_Status` | `Open`, `Approaching`, `Overdue`, `Met`, `Waived` |
| `Classification.Related_Entity_Type` | `Proposal`, `Award`, `Subaward`, `ComplianceRequirement` |
| `Classification.Scheme` | `NSF_Science_Code`, `HERD_Field`, `NIH_MeSH`, `Institution_Research_Area`, `Free_Tag` |
| `Action.Related_Entity_Type` | `Award`, `Subaward`, `Proposal`, `Approval`, `PreAwardAuthorization`, `Personnel`, `ComplianceRequirement`, `Modification`, `Negotiation`, `Terms`, `Closeout`, `Deliverable`, `Equipment` |
| `Action.Action_Status` | `Open`, `In_Progress`, `Blocked`, `Completed`, `Cancelled`, `Unsuccessful` |
| `Action.Priority` | `Low`, `Medium`, `High`, `Critical` |
| `Action.Origin` | `Sponsor_Required`, `Internal`, `System_Generated`, `Manual` |
| `Approval.Related_Entity_Type` | `Proposal`, `Modification`, `Subaward`, `PreAwardAuthorization`, `Closeout`, `Deliverable` |
| `Approval.Approval_Role` | `PI`, `Co_Investigator`, `Department_Chair`, `College_Dean`, `Center_Director`, `OSP_Pre_Award`, `Compliance_Office`, `VPR`, `Authorized_Organizational_Representative`, `Other` |
| `Approval.Approval_Status` | `Pending`, `Approved`, `Rejected`, `Bypassed`, `Returned_for_Revision`, `Voided` |
| `CommunicationResponse.Response_Status` | `Pending`, `Responded`, `Declined_To_Respond`, `Timed_Out`, `Withdrawn` |

### Compliance Protocols (optional)

| Column | Values |
|---|---|
| `Protocol.Regime` | `Animal_Use`, `Human_Subjects`, `Biosafety`, `Other` |
| `Protocol.Protocol_Status` | `Draft`, `Submitted`, `Under_Review`, `Approved`, `Active`, `Suspended`, `Expired`, `Closed`, `Withdrawn`, `Rejected` |
| `ProtocolReviewStep.Step_Status` | `Pending`, `In_Review`, `Approved`, `Rejected`, `Returned`, `Withdrawn` |
| `ProtocolAmendment.Amendment_Status` | `Draft`, `Submitted`, `Under_Review`, `Approved`, `Rejected`, `Withdrawn` |
| `ProtocolContinuingReview.Review_Status` | `Pending_Submission`, `Submitted`, `Under_Review`, `Approved`, `Approved_With_Modifications`, `Suspended`, `Closed` |
| `ProtocolAdverseEvent.Severity` | `Minor`, `Moderate`, `Serious`, `Life_Threatening` |
| `ProtocolAdverseEvent.Relatedness` | `Related`, `Possibly_Related`, `Unrelated`, `Indeterminate` |
| `ProtocolAdverseEvent.Event_Status` | `Reported`, `Under_Review`, `Determination_Made`, `Corrective_Action_In_Progress`, `Closed`, `Withdrawn` |
| `ProtocolDeviation.Category` | `Major`, `Minor` |
| `ProtocolDeviation.Deviation_Status` | `Reported`, `Under_Review`, `Acknowledged`, `Corrective_Action_Required`, `Corrective_Action_In_Progress`, `Closed` |

### Animal Research (optional)

| Column | Values |
|---|---|
| `AnimalUseSpecies.USDA_Pain_Category` | `B`, `C`, `D`, `E` |
| `AnimalUseProcedure.Pain_Category` | `B`, `C`, `D`, `E` |
| `AnimalUseHazard.Hazard_Type` | `Biological`, `Chemical`, `Physical`, `Radiation` |

### Human Subjects (optional)

| Column | Values |
|---|---|
| `HumanSubjectsConsent.Consent_Method` | `Written`, `Verbal`, `Waiver`, `Short_Form`, `Assent_Only` |

### Biosafety (optional)

| Column | Values |
|---|---|
| `BiologicalAgent.Agent_Type` | `Organism`, `Toxin`, `Recombinant_DNA`, `Cell_Line` |
| `BiologicalAgent.Risk_Group` | `RG1`, `RG2`, `RG3`, `RG4` |
| `BiosafetyProcedure.Required_Containment_Level` | `BL1`, `BL2`, `BL3`, `BL4` |

### Governance (optional)

| Column | Values |
|---|---|
| `Committee.Committee_Type` | `IACUC`, `IRB`, `IBC`, `COI`, `Research_Security`, `Internal_Award_Review`, `Policy_Board`, `Other` |
| `Committee.Committee_Status` | `Active`, `Suspended`, `Disbanded` |
| `CommitteeMember.Member_Status` | `Active`, `On_Leave`, `Terminated` |
| `Meeting.Meeting_Type` | `Regular`, `Special`, `Emergency`, `Subcommittee` |
| `Meeting.Meeting_Status` | `Scheduled`, `Convened`, `Cancelled`, `Adjourned` |
| `MeetingAttendance.Attendance_Status` | `Present`, `Absent`, `Excused`, `Partial` |

### Committee Protocol Review (optional)

| Column | Values |
|---|---|
| `MeetingProtocolReview.Review_Decision` | `Approved`, `Approved_With_Modifications`, `Tabled`, `Returned`, `Disapproved`, `Deferred` |
