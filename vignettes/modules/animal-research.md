# Optional module: Animal Research

**Story:** "We have an IACUC."
**Requires:** core >=2.3.0, modules: compliance_protocols
**Records targets declared:** none
**AllowedValues groups declared:** none

This module is governed by the module taxonomy's two laws (capability criterion, encapsulation rule); see the Architecture section of the core specification. Canonical machine-readable definition: `optional_modules.animal_research` in `udm_schema_v2.json`. Module tables carry the universal audit columns; they are omitted below as in the core spec.

Per-regime detail for `Regime = 'Animal_Use'`: species and counts with USDA pain categories, procedures, hazards, the 3Rs alternatives search the Animal Welfare Act requires, and the closure report. All rows hang flat off Protocol_ID.

## Table reference

#### AnimalUseSpecies

A species approved on an animal-use protocol, with count and USDA pain category.

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseSpecies_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Species_Common_Name | MediumName | required | e.g. 'Mouse', 'Zebrafish' |
| Species_Scientific_Name | MediumName | optional | e.g. 'Mus musculus' |
| Strain | MediumName | optional | Strain designation when applicable |
| Animal_Count | Count | required | Number of animals approved |
| USDA_Pain_Category | Status | required | Constrained: B / C / D / E |
| Justification | LongText | optional | Scientific justification for species choice |

#### AnimalUseProcedure

A procedure performed on animals under the protocol.

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseProcedure_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Procedure_Description | LongText | required | What the procedure involves |
| Pain_Category | Status | required | Constrained: B / C / D / E |
| Is_Survival | Boolean | required | Survival or non-survival procedure |
| Anesthesia_Description | LongText | optional | Required when Pain_Category is 'D' or 'E' |
| Analgesia_Description | LongText | optional | Analgesia provided, when applicable |

#### AnimalUseHazard

A hazard used in conjunction with animals under the protocol.

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseHazard_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Hazard_Type | Status | required | Constrained: Biological / Chemical / Physical / Radiation |
| Agent_Or_Substance | MediumName | required | The hazardous agent or substance |
| Exposure_Control_Description | LongText | required | How personnel exposure is controlled |

#### AnimalUseAlternativesSearch

The 3Rs literature search required by the Animal Welfare Act for any procedure with Pain_Category 'D' or 'E'.

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseAlternativesSearch_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Search_Date | Date | required | When the literature search was run |
| Databases_Searched | LongText | required | e.g. 'PubMed, AGRICOLA, Web of Science' |
| Keywords_Used | LongText | required | Search keywords used |
| Years_Covered | ID | required | e.g. '2015-2025' |
| Alternatives_Found_Description | LongText | required | Findings narrative |

#### AnimalUseClosureReport

The final report submitted when a protocol closes. One per closed protocol (Protocol_ID unique).

| Column | Type | Required | Notes |
|---|---|---|---|
| AnimalUseClosureReport_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. Unique: one closure report per protocol |
| Submitted_Date | Date | required | When submitted to the reviewing authority |
| Animals_Approved_Count | Count | required | Total approved across the protocol's lifetime |
| Animals_Used_Count | Count | required | Total actually used |
| Disposition_Description | LongText | required | What happened to remaining animals |
| Outcomes_Description | LongText | optional | Scientific outcomes generated |

## Cross-row constraints

- **AnimalUseClosureReport**: Protocol_ID is unique: one closure report per protocol.
- **AnimalUseProcedure**: Anesthesia_Description is required when Pain_Category is 'D' or 'E'.
