# Optional module: Human Subjects

**Story:** "We have an IRB."
**Requires:** core >=2.3.0, modules: compliance_protocols
**Records targets declared:** none
**AllowedValues groups declared:** HumanSubjectsInterventionType

This module is governed by the module taxonomy's two laws (capability criterion, encapsulation rule); see the Architecture section of the core specification. Canonical machine-readable definition: `optional_modules.human_subjects` in `udm_schema.json`. Module tables carry the universal audit columns; they are omitted below as in the core spec.

Per-regime detail for `Regime = 'Human_Subjects'`: study populations with vulnerable-population flags, interventions, and consent approaches. All rows hang flat off Protocol_ID.

## Table reference

#### HumanSubjectsPopulation

A study population on a human-subjects protocol, with vulnerable-population flags and enrollment criteria.

| Column | Type | Required | Notes |
|---|---|---|---|
| HumanSubjectsPopulation_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Population_Description | LongText | required | Who the study population is |
| Age_Range_Description | ID | required | e.g. '18-65', 'Children 5-17' |
| Includes_Children | Boolean | required | Vulnerable-population flag |
| Includes_Pregnant_Women | Boolean | required | Vulnerable-population flag |
| Includes_Prisoners | Boolean | required | Vulnerable-population flag |
| Includes_Cognitively_Impaired | Boolean | required | Vulnerable-population flag |
| Inclusion_Criteria | LongText | required | Criteria for including subjects |
| Exclusion_Criteria | LongText | required | Criteria for excluding subjects |
| Recruitment_Method | LongText | required | How subjects are recruited |
| Estimated_Enrollment_Count | Count | optional | Expected number of subjects enrolled |

#### HumanSubjectsIntervention

An intervention or interaction with subjects under the protocol.

| Column | Type | Required | Notes |
|---|---|---|---|
| HumanSubjectsIntervention_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Intervention_Description | LongText | required | What the intervention involves |
| Intervention_Type_Value_ID | ID | required | → AllowedValues. AllowedValues Value_Group = 'HumanSubjectsInterventionType'. Recommended values: Survey / Interview / Observation / Drug / Device / Behavioral / Surgical / Biospecimen / Other |
| Risk_Description | LongText | required | Risks the intervention poses to subjects |

#### HumanSubjectsConsent

The consent approach for a protocol population.

| Column | Type | Required | Notes |
|---|---|---|---|
| HumanSubjectsConsent_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Consent_Method | Status | required | Constrained: Written / Verbal / Waiver / Short_Form / Assent_Only |
| Documentation_Required | Boolean | required | Whether signed documentation is required |
| Waiver_Justification | LongText | optional | Required when Consent_Method = 'Waiver' |
| Special_Population_Accommodations | LongText | optional | Accommodations for children, non-English speakers, etc. |
| Consent_Language_Description | LongText | optional | Reading level, translations available |

## Cross-row constraints

- **HumanSubjectsConsent**: Waiver_Justification is required when Consent_Method = 'Waiver'.
