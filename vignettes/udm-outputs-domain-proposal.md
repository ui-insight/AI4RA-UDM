# UDM Outputs Domain Proposal

**Status:** Draft for review
**Motivation:** Gap analysis against Snowball Metrics; confirmed absence of any first-class research output concept in UDM v2.

---

## Summary

UDM v2 tracks everything that goes *into* funded research — proposals, awards, budgets, effort, compliance. It tracks nothing that comes *out* of it. Publications, datasets, software, presentations, and prizes are the visible products of funded work; sponsors require reporting on them (NSF, NIH both mandate publication and dataset reporting against awards); and cross-institution benchmarking (e.g., Snowball Metrics) is built on them.

The gap is a full domain: **Outputs**. This proposal introduces it.

---

## Scope decision

**In scope:** Research outputs that are tracked in the research administration function and reported against funded awards.

**Out of scope:**
- Citation counts, journal rankings, field-weighted citation impact (FWCI) — derived bibliometric data; belongs in the System of Insight as views over Output data joined to external bibliometric sources (Scopus, Web of Science).
- Patent prosecution, licensing agreements, royalty distribution, spin-off companies — these activities belong in specialized tech transfer management systems. UDM covers the disclosure event and Bayh-Dole status via `InventionDisclosureDetail`; everything downstream of the institution's disposition decision is out of scope.
- PhD awards, PGR student counts — student records; not RA data.
- Total institutional staff FTE — HR system; not RA data.
- External author affiliations beyond name — too operational; institutions do not track co-author employment in RA systems.

---

## Proposed entities (5 core, 3 per-type sub-resources)

### Layer 1: Root entity

#### Output

The root entity for any research output produced by or associated with funded work.

| Column | Type | Required | Notes |
|---|---|---|---|
| Output_ID | ID | required | PK |
| Output_Type | Status | required | Constrained: Publication / Dataset / Software / Presentation / Prize / Creative_Work / Invention_Disclosure / Other |
| Title | MediumName | required | Title of the output |
| Year | Count | required | Year of publication, release, presentation, or award |
| Published_Date | Date | optional | Exact publication, release, or award date when known; Year is the required fallback |
| Canonical_Identifier | URL | optional | DOI, handle, arXiv ID, URL, or other resolvable identifier |
| Identifier_Type | ShortCode | conditional | Required when Canonical_Identifier is set. Recommended values: DOI / PMID / arXiv / URL / ISBN / Handle / Other |
| Open_Access_Status | Status | optional | Constrained: Open / Restricted / Embargoed. Applies primarily to Publications and Datasets. |
| Is_Active | Boolean | required | Standard soft-delete flag |
| Source_System | ShortCode | optional | Standard audit column |
| Source_Record_ID | MediumName | optional | Standard audit column |
| Created_At | Timestamp | required | Standard audit column |
| Updated_At | Timestamp | required | Standard audit column |
| Created_By_Personnel_ID | ID | optional | → Personnel |
| Updated_By_Personnel_ID | ID | optional | → Personnel |

`Output_Type` is a discriminator. The seven per-type sub-resource tables (Layer 3) hang flat off `Output_ID` with no cross-type coupling.

---

### Layer 2: Cross-cutting relations

#### OutputContributor

A person contributing to an Output, with their role and position in the contributor list.

| Column | Type | Required | Notes |
|---|---|---|---|
| OutputContributor_ID | ID | required | PK |
| Output_ID | ID | required | → Output |
| Personnel_ID | ID | optional | → Personnel. Null when the contributor is not in the institution's Personnel table (external collaborator, emeritus, student) |
| External_Contributor_Name | MediumName | conditional | Required when Personnel_ID is null. Free-text name for contributors not in system |
| Role | Status | required | Constrained: Author / Co-Author / Editor / Presenter / Recipient / Creator / Contributor |
| Contributor_Order | Count | optional | Position in the contributor list (1 = first author / lead). Null for unordered or prize recipients |

At most one of (`Personnel_ID`, `External_Contributor_Name`) is non-null per row. Both null is invalid; both non-null is invalid.

#### AwardOutput

A junction linking an Output to the Award or Subaward that funded or partially funded it. One Output can acknowledge multiple Awards; one Award produces multiple Outputs.

| Column | Type | Required | Notes |
|---|---|---|---|
| AwardOutput_ID | ID | required | PK |
| Output_ID | ID | required | → Output |
| Award_ID | ID | optional | → Award. Exactly one of Award_ID or Subaward_ID is non-null |
| Subaward_ID | ID | optional | → Subaward. Exactly one of Award_ID or Subaward_ID is non-null |
| Is_Acknowledged | Boolean | required | True when the output formally acknowledges this award in its published text or metadata |
| Reporting_Period_Start | Date | optional | The reporting period this output is attributed to (for NSF/NIH annual progress reports) |
| Reporting_Period_End | Date | optional | |

Cross-row constraint: exactly one of `Award_ID` or `Subaward_ID` is non-null per row (standard two-FK XOR pattern).

---

### Layer 3: Per-type sub-resources

Each sub-resource table has a 1:1 relationship with its parent `Output` row. All are optional; an Output row without a sub-resource is valid when detail is not tracked.

**Identifier-convention exception (must be documented in the conventions if adopted).** The detail tables use `Output_ID` as their primary key rather than a `TableName_ID` of their own. This is a deliberate "1:1 detail table" exception to the universal identifier convention: the detail row has no identity apart from its Output, and a synthetic key would add a column with no query value. This would be the second documented exception, after `AllowedValue_ID`.

#### PublicationDetail

| Column | Type | Required | Notes |
|---|---|---|---|
| Output_ID | ID | required | PK, FK → Output where Output_Type = 'Publication' |
| Publication_Type | Status | required | Constrained: Journal_Article / Book / Book_Chapter / Conference_Paper / Review / Technical_Report / Preprint / Thesis / Other |
| Venue_Name | MediumName | optional | Journal name, conference name, book title, or publisher |
| Venue_ISSN | ShortCode | optional | ISSN of the journal or series |
| Volume | ShortCode | optional | |
| Issue | ShortCode | optional | |
| Pages | ShortCode | optional | e.g., "123-145" or "e20241" |
| Publisher | MediumName | optional | |
| Open_Access_Type | Status | optional | Constrained: Gold / Green / Diamond / Bronze / Closed. More granular than Output.Open_Access_Status |

#### DatasetDetail

| Column | Type | Required | Notes |
|---|---|---|---|
| Output_ID | ID | required | PK, FK → Output where Output_Type = 'Dataset' |
| Repository_Name | MediumName | optional | e.g., Dryad, Zenodo, ICPSR, institutional repository |
| Repository_URL | URL | optional | |
| Access_Type | Status | optional | Constrained: Open / Restricted / Embargoed |
| Data_Management_Plan_Document_ID | ID | optional | → Document. The DMP this dataset fulfills |

#### SoftwareDetail

| Column | Type | Required | Notes |
|---|---|---|---|
| Output_ID | ID | required | PK, FK → Output where Output_Type = 'Software' |
| Repository_URL | URL | optional | GitHub, GitLab, Zenodo, etc. |
| License | ShortCode | optional | SPDX identifier (MIT, GPL-3.0, Apache-2.0, etc.) |
| Version | ShortCode | optional | Tagged release or commit reference |

#### InventionDisclosureDetail

The RA-relevant record of an invention disclosure. Captures the disclosure event, its Bayh-Dole status, and the institution's election decision. All columns here are genuinely 1:1 with the disclosure; patent filings, which are 1:N, live in `PatentFiling` below. Downstream patent prosecution, licensing, royalty distribution, and spinout tracking belong in a specialized tech transfer management system, not in UDM.

| Column | Type | Required | Notes |
|---|---|---|---|
| Output_ID | ID | required | PK, FK → Output where Output_Type = 'Invention_Disclosure' |
| Disclosure_Date | Date | required | Date the disclosure was submitted to the institution |
| Disclosure_Number | ShortCode | optional | Institution's internal disclosure reference number |
| Bayh_Dole_Reportable | Boolean | required | True when the invention was made under a federal award and must be reported under Bayh-Dole (37 CFR 401) |
| Agency_Disclosure_Date | Date | conditional | Date the invention was disclosed to the funding agency. Required path when Bayh_Dole_Reportable = true |
| Government_Interest_Statement | LongText | optional | The standard government interest clause, if applicable |
| Election_Status | Status | optional | Constrained: Under_Review / Title_Elected / Released_To_Inventor / Abandoned. The institution's election decision on the disclosure |
| Election_Date | Date | conditional | Required when Election_Status reaches a terminal value. Bayh-Dole election deadlines run from the agency disclosure date |

#### PatentFiling

A patent application or issued patent arising from a disclosed invention. One disclosure routinely yields several filings (provisional, utility, continuations, divisionals, foreign filings), so this is a 1:N sub-resource with its own primary key, following the standard identifier convention. Federal reporting (RPPR inventions section, Bayh-Dole utilization reporting) is per-filing, which is why these are structured rows rather than notes on the disclosure.

| Column | Type | Required | Notes |
|---|---|---|---|
| PatentFiling_ID | ID | required | PK |
| Output_ID | ID | required | → Output where Output_Type = 'Invention_Disclosure'. The disclosed invention this filing arises from |
| Filing_Type | Status | required | Constrained: Provisional / Utility / Continuation / Divisional / Continuation_In_Part / PCT / Foreign |
| Application_Serial_Number | ShortCode | optional | Patent office application serial number |
| Filing_Date | Date | required | |
| Jurisdiction | ShortCode | optional | Patent office or country code; null implies the institution's home jurisdiction |
| Patent_Number | ShortCode | conditional | Required when Filing_Status = Issued |
| Issue_Date | Date | conditional | Required when Filing_Status = Issued |
| Filing_Status | Status | required | Constrained: Pending / Issued / Abandoned / Expired |

Prosecution detail (claims, office actions, attorney dockets) and everything downstream of issuance (licensing, royalties) stay in the tech transfer system.

---

## Key design decisions

**One Output entity with a type discriminator, not separate Publication/Dataset/Software tables.** Follows the "polymorphic spines over per-concept tables" pattern established in v2. All output types share the same core fields (title, year, identifier, open access status, contributors, award links); the type discriminator and per-type sub-resources handle the variation. Adding a new output type adds one sub-resource; it does not require a new root entity.

**AwardOutput uses the standard two-FK XOR pattern.** The same Award-or-Subaward attachment used by Modification, Report, Budget, and others. An output tied to an inbound award uses Award_ID; an output tied to outbound work uses Subaward_ID.

**External contributors are captured by name only.** Research output authorship routinely includes people outside the institution (collaborators, emeritus faculty, students who have since graduated). Requiring Personnel_ID would make it impossible to record co-authorship accurately. A null Personnel_ID with a name string is the intentional design; ORCID or other persistent researcher IDs for external contributors are out of scope for v2.x.

**ORCID and persistent researcher IDs for institutional contributors belong in PersonnelCredential**, not in OutputContributor. The existing `Credential_Type = 'Other'` (or a future explicit ORCID value) on PersonnelCredential is the right place. No new column on OutputContributor.

**Citation counts, FWCI, and journal rankings are derived.** These require external bibliometric sources (Scopus, Web of Science) and are computed by joining Output.Canonical_Identifier against those sources. They belong in the System of Insight as views — not in UDM. UDM holds the identifier (DOI, PMID); the metric layer does the join.

**Open_Access_Status on Output is coarse (Open/Restricted/Embargoed); PublicationDetail.Open_Access_Type is granular (Gold/Green/Diamond/Bronze/Closed).** The coarse flag on Output is usable across all output types without knowing publication-specific vocabulary. Institutions that need full SHERPA/RoMEO-level detail use PublicationDetail.

**Prizes and recognition are Output rows with Output_Type = 'Prize'.** The recipient is an OutputContributor with Role = 'Recipient'. No PrizeDetail sub-resource proposed for v2.x; the base Output columns (title = prize name, year, identifier = citation URL) are sufficient for the RA reporting use case. Award-level tracking of prizes is in scope; institutional prize registries and external award databases are not.

**Presentations are in scope when they are reportable outputs.** Invited keynotes, plenary talks, and refereed conference presentations are often reported in annual progress reports. Routine departmental seminars are not. Institutions decide what to record; the schema makes no distinction in the type field.

---

## Snowball Metrics alignment

| Snowball Metric | UDM Outputs coverage |
|---|---|
| Total Publications | `SELECT COUNT(*) FROM Output WHERE Output_Type = 'Publication'` per award or institution |
| Journal Publications | Join to PublicationDetail where Publication_Type = 'Journal_Article' |
| Publications in top journals | Requires external journal ranking data joined on Venue_ISSN or Venue_Name |
| FWCI / citation impact | Requires external bibliometric source joined on Canonical_Identifier (DOI) |
| Awards and prizes | Output where Output_Type = 'Prize' |
| Invited keynotes / plenary | Output where Output_Type = 'Presentation' (institution decides what to record) |
| Editorships | Out of scope; editorial roles are professional service, not RA-tracked outputs |
| Research Income / Success Rate | Already covered by Award + Proposal (unchanged) |

---

## What's explicitly NOT included

- **Citation count column on Output.** Derived; belongs in System of Insight.
- **PrizeDetail sub-resource.** Base Output columns are sufficient for v2.x. Add if adopters show structured prize data needs.
- **PresentationDetail sub-resource.** Venue_Name on Output base entity is sufficient for most reporting needs; add if conference/event detail is demanded.
- **Conference as a first-class entity.** Conference details live in PublicationDetail.Venue_Name (free text) or Output.Canonical_Identifier (proceedings DOI). A Conference entity would require modeling event dates, locations, and sponsors -- out of scope.
- **External contributor affiliation.** Name only. Institutions do not maintain co-author employment records.
- **ORCID on OutputContributor.** Belongs in PersonnelCredential for institutional personnel; not tracked for external contributors.
- **Data Management Plan as a first-class entity.** The DMP is a Document; DatasetDetail carries a soft link to the Document via Data_Management_Plan_Document_ID. A full DMP entity is a future consideration if institutions need structured DMP lifecycle tracking.
- **Patent prosecution, licensing, royalty, spinout entities.** These belong in specialized tech transfer management systems. UDM covers the disclosure event via `InventionDisclosureDetail` and Bayh-Dole federal reporting via `Report.Report_Type = 'Invention_Statement'`; nothing downstream of the institution's disposition decision is in scope.

---

## Resolved questions

1. **Proposal linkage: decided against.** Outputs reported in research administration are obligations against funded work; pre-award outputs are not RA reporting obligations. `AwardOutput` links to Award or Subaward only. Recorded here so it is not re-litigated.

2. **`Published_Date` added.** `Year` (required) carries reporting-year attribution; `Published_Date` (optional) carries the exact date when known. Both are on the Output entity above.

3. **ORCID: resolved yes.** Add `ORCID` to the recommended `PersonnelCredential.Credential_Type` values as part of this module. OutputContributor carries no researcher-ID column; institutional contributors resolve through PersonnelCredential.

4. **`Patent` as an Output_Type: decided against, replaced by `PatentFiling`.** One disclosure yields N filings (provisionals, continuations, foreign filings), so a per-filing peer Output would double-count the invention in output metrics, duplicate the inventor roster, and require output-to-output lineage machinery that does not exist. Instead, filings are 1:N `PatentFiling` rows under the disclosure Output: patent numbers and dates are first-class and queryable (RPPR and Bayh-Dole reporting are per-filing), while the Output count stays one-per-invention.

## Open questions

1. **Should `Is_Acknowledged` on AwardOutput track the acknowledgment string?** Funders sometimes require exact acknowledgment language. The flag captures whether the award was acknowledged; an optional text column could capture the actual acknowledgment text for compliance verification.

---

## Entity count

Output (1), OutputContributor (1), AwardOutput (1), PublicationDetail (1), DatasetDetail (1), SoftwareDetail (1), InventionDisclosureDetail (1), PatentFiling (1) = **8 new entities** in a new Outputs domain.

Note on the identifier convention: the four 1:1 detail tables use `Output_ID` as PK (the documented exception); `PatentFiling` is 1:N and therefore carries its own `PatentFiling_ID` per the standard convention.

This brings the projected table count from 49 to **57 tables** (before v2.1 additions).
