# UDM Changelog

All notable changes to the Unified Data Model are documented here.

The UDM follows [Semantic Versioning](https://semver.org/):
- **MAJOR** when incompatible schema changes are made
- **MINOR** when entities or columns are added in a backward-compatible way
- **PATCH** for documentation, convention clarifications, or fixes to non-load-bearing rules

While the UDM is in active development and has no production adopters, breaking changes can ship in a minor version. Each one is marked as breaking in the changelog. Major versions are reserved for stable releases.

## [Unreleased]

- **`Award.Acceptance_Status`: award acceptance as its own stage (breaking).** A new required column records whether the institution has accepted an award and its terms: Terms_Review, Negotiating, On_Hold, Accepted, or Not_Accepted. Not_Accepted can return to Negotiating. `Award_Status` can reach Active, Suspended, Closing, Closed, or Adjusting only once the award is Accepted; an award that is not accepted stays In_Setup or ends through Terminating. The `Negotiation` table still keeps each round of bargaining. The status chart gains a stage 4, Acceptance, between the sponsor decision and the award.
- **`No_Decision` in `Proposal.Decision_Status`.** The sponsor never decided, and the institution stopped waiting after its own cutoff. It comes from Pending or Changes_Requested, and a late sponsor decision still moves it to Intent_to_Award, Awarded, or Declined. It is the institution's own record, so it needs no sponsor Communication, and `Decision_Date` stays null.
- **Rejected covers a missed deadline.** `Internal_Approval_Status = Rejected` now also means the opportunity closed before the proposal was sent. The chart draws this as an arrow from Unsubmitted to Rejected.
- **Pre-award authorization can follow the award.** A `PreAwardAuthorization` can be Requested or Approved while the decision is Awarded and the award is not yet accepted. It becomes Converted_To_Award once the award is accepted.
- **MOU and MOA document types.** `Document.Document_Type_Value_ID` recommends `MOU` and `MOA` alongside `NOA`, and the Glossary defines memorandum of understanding and memorandum of agreement.
- **Status chart: optional ghost boxes.** A dashed box marks an optional step. Received and Validated are ghost boxes, since some sponsors don't report them, which removes the skip line in stage 2. Preliminary Setup, an at-risk account linked to `PreAwardAuthorization` Approved, appears after Awarded and before In Setup. Its hover says the award still goes through acceptance and setup. Stage 1 now has Rejected on the left and Returned on the right, so no arrow crosses a green line, and the Validated to Invalid arrow is left to the Validated hover.
- **Glossary.** New terms for No Decision, the acceptance statuses, Preliminary setup, and MOU and MOA; "grant award notice" is another name for Notice of Award.

## [5.2.0] - 2026-11-10

- **`Communication.Sets_Status`: the sponsor's date for each decision (breaking).** A communication attached to a Proposal can record the `Decision_Status` it moved the proposal to: Changes_Requested, Intent_to_Award, Awarded, Declined, Not_Reviewed, Pending (a walked-back intent to award), or Withdrawn (the only value set by an outbound communication). Each recorded decision has such a communication, so when a proposal moved, and from where, comes from the sponsor's own dates rather than the date someone entered it. `Proposal.Decision_Status` matches the newest one. `Proposal.Decision_Date` is now derived from it and kept as the one date most reports want. Breaking because each recorded decision now needs its communication, and `Decision_Date` is no longer entered directly. Edit history stays with the storage layer, and the Statuses tab says so.
- **Dashboard: download the proposal and award status path as a PDF.** A button on the Statuses tab downloads the chart. The deploy renders the PDF from the same SVG, so the two always match.
- **Dashboard: direct links to each tab.** Each tab has its own address, such as `#statuses` or `#data-dictionary`, so it can be shared, bookmarked, or opened in a new tab, and the back button moves between tabs.
- **Dashboard: Home feedback section reworded.** "Tell us what you think!" replaces "Help us evaluate it", with shorter questions.
- **Dashboard: "Where to start" card removed from Home.** The tabs already show where everything is.
- **Dashboard: shorter Home intro.** The text is condensed and the "Start here" heading is gone.
- **Dashboard: Home feedback section is easier to read.** It now uses the same white card as the rest of the page, and asks for input on the Glossary and Data Dictionary tabs.
- **Status chart: In Review shows several approval steps.** The In Review box is drawn as a stack. Its Glossary definition names the department and the sponsored programs office (OSP) as examples, and Approved now says every required approval step approved.
- **`Changes_Requested` in `Proposal.Decision_Status`.** A sponsor can ask for changes before deciding, such as just-in-time information. Pending moves to Changes Requested, then to Intent to Award, Awarded, or Declined, or back to Pending. `Proposal.Decision_Status` gains `Changes_Requested`, recorded from the sponsor's communication, with next statuses `Intent_to_Award`, `Awarded`, `Declined`, and `Pending`. `Intent_to_Award` can also go back to `Changes_Requested` when the sponsor asks for changes after signalling funding. The sponsor decision stage is redrawn so Intent to Award and Changes Requested sit between Pending and the outcomes, with one tight cross. It counts in the Pipeline metric and `v_pipeline`, and early setup can stay Requested or Approved while a proposal is in it.
- **Dashboard: two-color tooltips.** A split box's tooltip, such as Withdrawn's, takes its gradient's first color instead of a fixed amber.

## [5.1.1] - 2026-11-06

- **All feedback goes to the AI4RA list.** The survey link, its QR code, and the email option are removed from the Home page and `CONTRIBUTING.md`.

## [5.1.0] - 2026-11-06

- **Dashboard: status chart tooltips.** Hover over or tap a status on the Statuses tab to see its Glossary definition. Each tooltip matches its box's colors. `check_glossary.py` fails if a chart box has no term. The tab now says the charts show the main paths, not every possible status change.
- **Glossary: compliance, closeout, and lifecycle statuses.** Adds 25 terms, so every status on the charts has a definition.
- **Glossary sources.** Adds checked federal and sponsor sources to more terms, and corrects `Submission status`, `Software as a Service`, `IBC`, `NSF PAPPG`, and `Termination basis`, with matching wording for `Sponsor_Priorities` in the schema. `Approval of the material` is removed, since `Internal approval` covers it.
- **README rewritten.** It is shorter, puts the site and the AI4RA list first, and no longer repeats table counts. The hand-kept ERD and JSON walkthrough are gone, since the site covers them.
- **Code of Conduct added,** using the Contributor Covenant.
- **Cleanup.** Removes the old survey dictionary, which the glossary replaces, an unused image, and an old AI tool instructions file, and updates examples that still named older versions.
- **Versioning.** While the UDM is in active development, breaking changes can ship in a minor version and are marked as breaking here.
- **`Submission_Status` drops `Unapproved` (breaking).** `Internal_Approval_Status` already holds that fact, so a proposal that isn't approved is `Unsubmitted`. No attempt can be created until the proposal is approved.
- **`Submitting` is removed from `Submission_Status` and `Attempt_Status` (breaking).** A transmission takes moments and is the sending application's concern, so the UDM records the result, `Submitted` or `Failed`. The glossary keeps the term, and the chart shows it as an arrow label.
- **`Approved` means approval to pursue the opportunity.** `Signed_Off` means everything is in order to submit. A changed package voids only the sign-off, and returning to `Returned` means the institution reopened consideration of the opportunity.
- **`Sent_Back` is new on `Submission_Status` and `Attempt_Status`.** A proposal can come back before the sponsor considers it, because it was lost or rejected as incomplete. It moves from `Pending` to `Sent_Back`, the sign-off is voided, and the decision returns to `Unrequested`. `Failed` still means the attempt never reached the sponsor's system, and its sign-off stands.
- **`Intent_to_Award` can return to `Pending`.** A sponsor can walk the signal back without deciding, and `Decision_Date` is cleared.
- **Dashboard: proposal and award chart.** It removes `Unapproved` and the note under `Recalled`, and adds `Sent Back`.
- **Glossary sources.** `Award rate` and `Effective F&A rate` replace dead links, and `Award rate` now states only what NIH publishes. `Key personnel` credits NSF for its wording, `Export control` cites the regulation, and `Research Performance Progress Report` says agencies may use the format, not that they must.
- **Dashboard: landing page for research administrators.** Home opens with a short "Start here" section. "Help us evaluate it" replaces "Share your feedback", points to the AI4RA forum and `#UDM`, and moves above Core Modules. The GitHub button is gone, the survey and email remain, and the header's Give Feedback button goes to the forum. The tab bar and header no longer widen the page on a phone.
- **README and CONTRIBUTING: the list comes first.** Design conversations move to the AI4RA list under `#UDM`, so people without GitHub can join them. The guide now says the spec is written by hand and lists every check.
- **`FundingMechanism` wording.** The spec now says no government-wide list was found, not that none exists.
- **`vignettes/udm-architecture.md` is marked as the v2 design record.** Sections 2 to 10 name tables that aren't in the current model.

## [5.0.0] - 2026-11-06

- **`Award.Award_Date` is new and required (breaking).** It's the date the sponsor signed the award or a binding agreement was reached. Every existing award needs one.
- **`Modification.Action_Date` is new.** It holds the same date for a modification, and is required once an approved modification changes the funding.
- **`v_award_funding_events` uses the new dates.** Award dollars no longer depend on start dates and effective dates, which could put money in the wrong fiscal year.
- **`FundingMechanism` has recommended values.** They are grouped by purpose from NIH's and NSF's funding categories. Institutions keep the sponsor's code, such as R01, and map it with `Canonical_Value_Code`. `Cooperative_Agreement` and `Contract_BAA` are no longer examples of a mechanism, since `Instrument_Type` holds the legal kind of agreement.
- **Subaward invoice mapping.** Adds `Reconciled` for an invoice matched to the ledger, and `Cancelled` for a rejected invoice that won't be paid.
- **Glossary.** Adds `Award date` and `Action date`, and updates `Award dollars`, `Funding mechanism`, and `Instrument type`.

## [4.1.0] - 2026-11-06

- **`Modification.Requires_Peer_Review` is new and optional.** It separates NIH's administrative supplements from competitive revisions on a `Supplement` event, and stays empty where a sponsor doesn't distinguish them.
- **Glossary: research security and conflict terms.** Adds `Significant financial interest` and `Malign foreign talent recruitment program`.
- **Glossary sources.** 48 more terms are checked against primary sources, with sources added and definitions corrected where they differed, including `Adverse event`, `Key personnel`, and `Letter of credit`. `Unanticipated problem` is new. The schema synonym "Award Type" moves from `Mechanism_Value_ID` to `Instrument_Type`.

## [4.0.0] - 2026-11-06

### Compliance and closeout (breaking)

- **`Closeout.Final_Report_Status` is removed.** Final reports are `Deliverable` rows with their own status, and an award can owe several. `v_final_reports` in the sample views shows how to read them.
- **`Closeout_Status`: `Pending_Sponsor_Final_Audit` becomes `Awaiting_Sponsor`.** Most closeouts wait on the sponsor accepting final reports, with no audit involved.
- **Unsent attempts stay as history.** An attempt assembled and never sent no longer blocks a new one. Only one attempt can be `Submitting` at a time, `Submission_Version` counts only attempts that were sent, and `Submission_Status` reads the newest attempt that was sent.
- **A proposal dropped before it's sent is `Rejected`.** The PI or the office records a `Rejected` approval row, and `Internal_Approval_Status` can now reach `Rejected` from `Draft`, `Returned`, and `Approved`.
- **Partial suspensions and terminations are modifications.** `ModificationEventType` gains `Partial_Suspension` and `Partial_Termination`, and `Modification` gains `Termination_Basis`. The award stays `Active`.
- **`Requirement_Status` gains `Closed` and `Withdrawn`.** `Closed` is the normal ending when the work finishes. `Withdrawn` comes from `Submitted` or `In_Review`, and a new attempt is a new row.

### Documentation, dashboard, and CI

- **Dashboard: third status chart.** The Statuses tab now covers compliance, closeout, budget, effort, and cost share.
- **Metric queries.** `vignettes/udm-system-of-insight-views.md` adds samples 10 to 13, which calculate the Glossary's balance, burn rate, funding rate, award dollar, and operations metrics. Samples 3, 4, 5, 6, and 9 no longer use columns and values that aren't in the schema.
- **`vignettes/allowedvalues.md` is generated from the schema** by `scripts/generate_allowed_values_doc.py`, and CI fails if it's out of date. It replaces a document describing tables from before v2.
- **Dashboard: Design tab.** Ontology & Design is renamed Design. Its two pattern sections are merged, and it explains how the medallion layers relate to the System of Record and states the rules for keeping meaning consistent.
- **Dashboard: endpoints.** Home points to the list on Infrastructure, which now includes `example-views.json`.
- **`vignettes/ontology.md` is current.** It no longer names a fixed version, uses the current award statuses, lists every example view, and describes the schema as engine-neutral.
- **Workshop slide deck removed from the site.** It described an earlier version of the model. It's kept on the `presentation/2026-workshop-deck` branch to update later.
- **CI runs on pull requests.** The checks and build now run on pull requests into `main`, without deploying.

### Statuses (breaking)

Migrate by column, not by a find-and-replace on a word, because some words change column or meaning in this release.

**Proposal**

- **Approval of the material and sign-off to submit are separate gates.** `Internal_Approval_Status` no longer counts `Final_Sign_off` or `Release_to_Submit`, and `Submission_Status` gains `Signed_Off`. A voided sign-off returns the submission stage to `Unsubmitted` and leaves internal approval at `Approved`. `Approved` can move to `Returned`.
- **`Submission_Status` and `Attempt_Status`: `Unsent` becomes `Unsubmitted`.** `Decision_Status`: `Unsubmitted` becomes `Unrequested`. Update `Decision_Status` first.
- **`Submission_Status` and `Attempt_Status`: `Withdrawn` becomes `Recalled`.** It means one attempt was pulled back to be corrected and resent, and it requires `Decision_Status` to be `Unrequested` or `Pending`. Migration: decide for each `Withdrawn` attempt whether the proposal was being resent (the attempt becomes `Recalled`) or pulled for good (also set `Decision_Status` to `Withdrawn`).
- **`Decision_Status` gains `Withdrawn` and `Not_Reviewed`, and now means the outcome of the funding request.** `Not_Reviewed` means the sponsor removed the proposal from consideration without reviewing it. The institution either stops at `Withdrawn` or revises the proposal, which returns internal approval to `Returned` and the decision to `Unrequested`. `Intent_to_Award` no longer returns to `Unrequested`.
- **`Accepted` and `Failed` are redefined.** `Accepted` means the sponsor took the proposal in for consideration. `Failed` means the attempt did not reach the sponsor's system, and the same package can be resent. An `Invalid` or `Recalled` attempt returns to `Unsubmitted`.
- **A recorded sponsor outcome stays.** Re-approving material no longer returns `Intent_to_Award`, `Awarded`, `Declined`, or `Not_Reviewed` to `Unrequested`.
- **Package changes after sending.** While an attempt is in transmission or with the sponsor, changes on the institution's side leave `Submission_Status` alone. After `Failed`, `Invalid`, or `Recalled`, a changed package returns it to `Unsubmitted`, so `Failed` gains that move. `Package_Hash` is required once an attempt leaves `Unsubmitted`.
- **New attempt moves.** `Submitted` and `Received` can go directly to `Accepted`, for channels that report nothing in between, and `Validated` can go to `Invalid`.

**Award and subaward**

- **`Award_Status`: `Pending` becomes `In_Setup`.** `Subaward_Status`: `Pending` becomes `In_Setup`.
- **`Subaward_Status` gains `Not_Issued`.** A subaward planned or being set up whose agreement is never issued ends here, replacing `Terminated` as the exit from `Proposed` and `In_Setup`. It has no `Termination_Basis`, needs no `Prime_Award_ID`, and doesn't block its award from closing.
- **`Not_Required` modifications now count.** `Award.Current_End_Date`, `Award.Current_Total_Funded`, and `Subaward.Current_End_Date` count `Approved` and `Not_Required` modifications, so a change needing no approval moves the award's dates and totals. `Reversed` can undo either.
- **Early setup can convert.** The limit to `Pending` or `Intent_to_Award` now applies only while an authorization is `Requested` or `Approved`. `Converted_To_Award` requires `Awarded`.
- **Early setup requests no longer need an authorizer.** `Authorization_Date` and `Authorizing_Personnel_ID` are required once a request is approved.
- **`Award.Instrument_Type` is new and required**, with `Grant`, `Cooperative_Agreement`, `Contract`, `Other_Transaction`, and `Other`. `Mechanism_Value_ID` still holds the detailed code.
- **`FAIN` applies to grants and cooperative agreements**, using `Instrument_Type`. Federal contracts no longer need one.
- **Returning to `Active`.** People, compliance coverage, and subawards ended by closure or termination don't come back automatically. The institution sets them up again.
- **Rebudgets have their own budget rule.** A `Rebudget` has no `Funding_Change_Amount`, so total funding doesn't change, and it creates new Current budget rows for the categories it moves money between, netting to zero.
- **`Budget_Revision` is a catch-all.** It covers a budget change with no more specific value, and `Funding_Change_Amount` is required only when the total changes.
- **Closeout statuses match.** `Final_Report_Status` becomes `Not_Started`, `Submitted`, `Fulfilled`, and `Final_Invoice_Status` uses `Not_Started` and also fits subaward invoices. Records retention now typically starts when the final financial report is submitted, per 2 CFR 200.334.
- **`Modification.Continuation_Type` is removed.** A competing renewal is a new `Proposal` of type `Renewal`, a non-competing year is a `Modification` with event type `Incremental_Funding` (with a `Continuation` proposal if one is filed), and a supplement is a `Modification` with event type `Supplement`.
- **`Report` splits into `Deliverable` and `Report`.** `Deliverable` is new and holds anything owed to the sponsor, with `Deliverable_Type` (`Report`, `Work_Product`, `Other`), `Description`, `Deliverable_Status` (formerly `Report_Status`), due date, and submission and acceptance fields. `Report` becomes its child, holding `Report_Type` and the reporting period, and other kinds can have child tables later. `Related_Entity_Type` values, the xor attachment, and `vw_Overdue_Reports` (now `vw_Overdue_Deliverables`) move to `Deliverable`, and `Action_Type` loses `Deliverable`.
- **`Modification.Carryforward_Amount` is removed.** `Carryover_Amount` is the only home for carried-over money.
- **`Protocol` links to its core approval.** The optional module's `Protocol` gains a required `ComplianceRequirement_ID`, and the `ComplianceRequirement` is authoritative for the approval number and dates.
- **`Income_Treatment` gains `Cost_Sharing`**, the third use of program income under 2 CFR 200.307.
- **`PolicyException.Personnel_ID` is optional.** An exception can belong to a proposal, award, or subaward without naming a person, and each must name at least one of the four.
- **`TeamRole` loses the `Key_Personnel` role value.** `Is_Key_Personnel` is the only record of the designation.
- **`Activity_Type` is new and required on `Award` and `Proposal`**, with `Organized_Research`, `Instruction`, and `Other_Sponsored_Activity` from 2 CFR 200 Appendix III. It separates what the HERD survey counts as research.
- **`Award.Research_Character` is new and optional**, with the HERD survey's `Basic_Research`, `Applied_Research`, and `Experimental_Development`.
- **HERD reporting.** `vignettes/herd-report.md` shows where each HERD survey answer comes from, with new example views `vw_HERD_Expenditures` and `vw_HERD_Expenditures_By_Field`. `Sponsor_Type` now says only what kind of organization this is: `Foundation` becomes `Nonprofit`, `Higher_Ed_PassThrough` becomes `Higher_Ed`, `Foreign` becomes `Foreign_Government`, `Other` is new, and it is also required for subrecipients. New columns: `Organization.Is_Foreign`, `Organization.Is_Medical_School`, `Award.Is_Clinical_Trial`, `BudgetCategory.HERD_Cost_Type`, and `Classification.Allocation_Percent`. `Classification.Scheme` gains `HERD_Field`.
- **Both gain `Adjusting`.** A closed or terminated agreement can take a late correction, such as an audit finding or a late charge, without opening for spending, and then returns to the status it came from. Views that exclude closed awards now exclude this status too.
- **Reopening and reinstatement.** A `Closed` award or subaward reopens to `Active`, not `Closing`. `Terminated` can be reinstated to `Active`, and an award at `Terminating` can return to `Active`.
- **`Termination_Basis` is new on `Award` and `Subaward`.** Values are `Noncompliance`, `Mutual_Agreement`, `Recipient_Request`, and `Sponsor_Priorities`, which covers executive orders; `Subaward` adds `Prime_Terminated`. `Terminating` no longer requires a received notice.

**Other records**

- **`PreAwardAuthorization.Authorization_Status` and `Modification.Approval_Status`: `Pending` becomes `Requested`.** `Modification` can no longer move from `Requested` to `Reversed`, its `Approved` definition now says it counts from approval, and the new derived `Is_In_Effect` says whether it is in effect today.
- **`Report_Status`: `Pending` becomes `Not_Started`, and `Accepted` becomes `Fulfilled`.** `vw_Overdue_Reports` is updated. The `Acceptance_Date` column keeps its name.
- **`Payment`.** `Lifecycle_Stage`: `Received` becomes `Paid`, and `Scheduled` can go directly to `Paid`. `Payment_Status` is now `Clear`, `Disputed`, or `Cancelled`; migrate `Open`, `Submitted`, and `Paid` to `Clear`, with the stage recording progress. `Payment_Direction` (`Incoming` or `Outgoing`) is new and required; a refund is an `Outgoing` payment on an award or an `Incoming` payment on a subaward. Vendor and other ordinary expenses remain `Transaction` rows.
- **`Action_Status`: `Failed` becomes `Unsuccessful`, and `Cancelled` is redefined.** `ActionType` gains `Monitoring_Exception`.
- **Application status mapping in the spec.** A new section under Implementation guidance says how an application's more detailed statuses map to the UDM.

### Documentation

- **Architecture: System of Action added as a fourth layer.** Workflow logic, submission tooling, job runs, and notifications move there from the System of Engagement. The layers now run Record, Engagement, Insight, Action, and the spec states that the System of Insight reads only from the System of Record. No UDM tables change.
- **Dashboard: Example Views is generated from the schema.** It shows every view's purpose and SQL. It replaces hand-written sample data, which included four views that weren't in the schema.
- **Dashboard: corrected tab content.** Ontology & Design, Infrastructure, and Home had wrong counts, examples naming columns and tables that don't exist, and a claim of more DDL dialects than the generator supports.
- **`VERSION` file.** The version is set in `VERSION` at the repository root, and `scripts/bump_version.py` copies it to the files that repeat it. `scripts/validate_schema.py` fails if `metadata.version`, the README's current version, or the prose spec's version differs.
- **Dashboard: footer on every tab.** It states the author, AI4RA, the licenses, and the NSF award.
- **Dashboard: tabs reordered.** Glossary now follows Home, and a new Statuses tab holds the status charts.
- **Glossary.** The Glossary tab has 330 plain-language terms, searchable and filterable by domain. `glossary.json` is the single source, and `scripts/generate_glossary.py` builds the tab's data and a CSV copy. Terms link to the tables, columns, and values they describe, and `scripts/check_glossary.py` checks those links in CI. Facts from federal and sponsor rules cite their sources. The Infrastructure tab's Integration Glossary is merged into it. Metric terms state what is counted and name the published method they follow, including the NSF HERD survey, NIH and NSF rates, and the federal financial report. Similar counts have separate names.
- **README and dashboard home page: description rewritten as plain prose.** Both now use the same Mission text. No change to the UDM's scope or goals.
- **Dashboard: Statuses tab shows status paths.** One flow chart covers the proposal and award, including where each stage hands off to the next. A second covers early setup, modifications, subawards, payments, deliverables, and actions.
- **Dashboard: Infrastructure tab states the normalized position.** A short note under "Where the UDM Fits" says the UDM is normalized so it can be modular, and that adopters build star schemas over it for reporting.

## [3.0.0] - 2026-10-22

The sponsored-project lifecycle release. Breaking: `AwardRole` becomes `TeamRole` anchored on the proposal, `ProposalApproval` becomes the polymorphic `Approval`, and `Proposal_Status` splits into three stages. Adds `SubmissionAttempt`, per-value definitions on every closed vocabulary, abstract column types with per-engine mappings, the DDL and seed generators, and the reorganized schema file. Core: 46 tables plus 2 implementation tables; 6 optional modules, 24 tables. Implements issues #87, #88, #89.

### Sponsored project lifecycle (breaking)

- **A proposal has three status stages.** `Internal_Approval_Status` (Draft, In_Review, Returned, Approved, Rejected), the new derived `Submission_Status` (Unapproved, Unsent, then the newest attempt's status), and `Decision_Status` (Unsubmitted, Pending, Intent_to_Award, Awarded, Declined). Each stage's floor names the gate it waits on. `Decision_Status` loses Submitted, Under_Review, and Withdrawn, which were submission states; `Internal_Approval_Status` loses Withdrawn and gains Returned. Migration: Submitted and Under_Review become Pending with the corresponding attempt; a withdrawn proposal becomes Unsubmitted with a Withdrawn attempt.
- **`SubmissionAttempt`** (Funding Cycle) records each transmission of a proposal: attempt number, channel, who sent it, when, the sponsor's reported status, tracking identifier, acknowledgement, and the package hash. It supersedes the "Sponsor submission events" convention; `Sponsor_Submission` leaves the ActionType values. Migration: each such Action row becomes one attempt (Completed → Submitted, Failed → Failed, `Completed_Date` → `Submitted_At`, `Outcome_Description` → `Tracking_Identifier` or `Notes`).
- **Every closed vocabulary carries per-value definitions.** Each value on each of the 72 status and classification columns has a `definition`; lifecycle values also carry `set_by` (who or what sets it) and `next` (the values that may follow; empty for a terminal value). The validator requires the definitions to cover the allowed values exactly and the transitions to name allowed values. The data dictionary carries them.
- **The optional modules' 24 closed vocabularies are allowed values, not description text.** Their lists lived only in "Constrained: ..." sentences, so the conformance checker treated them as open and no DDL CHECK was emitted. They now carry `allowed_values` and `value_definitions` like the core.
- `Proposal.Submission_Version` and `Submission_Date` are derived from the attempts. A `PreAwardAuthorization` requires the Proposal's `Decision_Status` to be Pending or Intent_to_Award. Documents and Communications attach to a SubmissionAttempt. `SubmissionChannel` is a canonical value group.

### Roles (breaking)

- **`AwardRole` becomes `TeamRole`, anchored on the proposal.** `Proposal_ID` is required and stable; `Award_ID` or `Subaward_ID` is set once funded, both null at the proposal stage. On award creation the proposal-stage rows are copied as award-stage rows that point back through `Previous_TeamRole_ID`. The UDM could not say who was on an unfunded proposal, and the Effort `Proposed` stage was unreachable; both are fixed. Migration: every `AwardRole` row becomes a `TeamRole` row with `Proposal_ID` taken from its agreement's `Proposal_ID`; the `AwardRole` value group becomes `TeamRole`; `Effort.AwardRole_ID` becomes `Effort.TeamRole_ID`.
- **Staff assignments live on `OrganizationRole`**, which gains a `Proposal_ID` scope and the recommended roles `Sponsored_Programs_Administrator`, `Award_Administrator`, `Administrative_Contact`. Which person at the office is responsible for a record is a role at that office scoped to the record.
- **Standing authority is a credential.** `PersonnelCredential.Credential_Type` gains `Authorized_Organizational_Representative`, `Signatory_Delegate`, `Empowered_Official`. `ProposalApproval.Approval_Role` gains `Authorized_Organizational_Representative`: the sign-off that binds the institution is the AOR's act, and being central pre-award staff does not make someone an AOR.

### Approval chain (breaking)

- **`ProposalApproval` is retired and replaced by `Approval`, a polymorphic Records table** attached to Proposal, Modification, Subaward, PreAwardAuthorization, Closeout, or Report. Each step carries what is decided (`Step_Type_Value_ID`, new group `ApprovalStepType`), who decides (`Approval_Role`), the reviewing unit, a topic for supplementary reviews (new group `ReviewTopic`), a block order, a round, the assigned and acting persons, a delegate for release to submit, a status that includes `Voided`, the signed package hash, and the action date. Blocks run in parallel, returns rerun steps in a new round, and a sign-off is voided when the package it approved changes. The core had two approval-step shapes and a worked example that contradicted its own closed list; it now has one.
- `Proposal.Internal_Approval_Status` is derived from the Approval rows of the current round. Internal routing of a Modification is Approval rows; `Modification.Approval_Status` stays the sponsor's decision.
- Migration: every `ProposalApproval` row becomes one `Approval` row with `Related_Entity_Type = Proposal`, `Approval_Round = 1`, `Approval_Role` unchanged, and `Step_Type` from the role: PI → PI_Certification; Co_Investigator → Co_PI_Certification; Department_Chair and Center_Director → Department_Review; College_Dean → College_Review; Compliance_Office → Compliance_Review; OSP_Pre_Award → Pre_Award_Review; Authorized_Organizational_Representative → Final_Sign_off; VPR and Other → Supplementary_Review. `Related_Entity_Type` values `ProposalApproval` on Document, Deadline, and Action become `Approval`.
- `ProtocolReviewStep` stays in the compliance module for this release; a core release cannot change a module table. A later module release can retire it by declaring its parents as Records targets.

### Award statuses and enumerations

- **`Award_Status` gains `Terminating`**, parallel to `Closing`: a termination notice received and being processed, before `Terminated`.
- **`Priority` on Award and Modification** (`Low` / `Medium` / `High` / `Critical`, default `Medium`): someone records a rush, and turnaround reporting needs it.
- **`Subaward_Status` gains `Closing`**, restoring award/subaward symmetry. **`Modification.Approval_Status` gains `Withdrawn`** for a request withdrawn before a decision. **`ModificationEventType` gains `Advance_Funding`**; a prior-approval request is a Modification in `Pending`, not a kind of modification.

### Changed

- **The vignettes drop the `v2` from their names and titles.** `udm-v2-system-of-record.md` is `udm-system-of-record.md`, and likewise for architecture, conformance, patterns, procurement language, system of engagement, and system of insight views. `metadata.spec_source` and `metadata.conformance` point at the new names. The dashboard shows the version from the schema metadata instead of a hard-coded one.
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

## [2.3.0] - 2026-08-28

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

## [2.2.0] - 2026-08-28

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

## [2.1.0] - 2026-08-26

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

## [2.0.1] - 2026-08-26

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

## [2.0.0] - 2026-06-11

UDM v2 is a major refactor of the model. It supersedes UDM v1.

The JSON serialization lives at the repository root as [udm_schema.json](../udm_schema.json). (The v1 file carried that name beside `udm_schema_v2.json` until 2026-10-21, when the current schema took the name; v1 is read from the v2.0.0 release.) The canonical prose specification lives in [udm-system-of-record.md](udm-system-of-record.md); the architectural overview is in [ontology.md](ontology.md).

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

- [vignettes/udm-system-of-record.md](udm-system-of-record.md) — canonical prose specification.
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
