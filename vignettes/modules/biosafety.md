# Optional module: Biosafety

**Story:** "We have an IBC."
**Requires:** core >=2.3.0, modules: compliance_protocols
**Records targets declared:** none
**AllowedValues groups declared:** none

This module is governed by the module taxonomy's two laws (capability criterion, encapsulation rule); see the Architecture section of the core specification. Canonical machine-readable definition: `modules.optional.biosafety` in `udm_schema.json`. Module tables carry the universal audit columns; they are omitted below as in the core spec.

Per-regime detail for `Regime = 'Biosafety'`: biological agents with risk groups, and procedures with containment and decontamination requirements. All rows hang flat off Protocol_ID.

## Table reference

#### BiologicalAgent

A biological agent in use under a biosafety protocol.

| Column | Type | Required | Notes |
|---|---|---|---|
| BiologicalAgent_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Agent_Name | MediumName | required | Name of the biological agent |
| Agent_Type | Status | required | Constrained: Organism / Toxin / Recombinant_DNA / Cell_Line |
| Risk_Group | Status | required | Constrained: RG1 / RG2 / RG3 / RG4 |
| Source_Description | MediumName | optional | Where the agent comes from |
| Quantity_Description | MediumName | optional | Volumes, titers, or counts in use |

#### BiosafetyProcedure

A procedure performed with biological agents, with containment and decontamination requirements.

| Column | Type | Required | Notes |
|---|---|---|---|
| BiosafetyProcedure_ID | ID | required | PK |
| Protocol_ID | ID | required | → Protocol. The parent protocol |
| Procedure_Description | LongText | required | What the procedure involves |
| Required_Containment_Level | Status | required | Constrained: BL1 / BL2 / BL3 / BL4 |
| Required_PPE_Description | LongText | required | Personal protective equipment required |
| Decontamination_Protocol | LongText | required | How work surfaces and waste are decontaminated |
