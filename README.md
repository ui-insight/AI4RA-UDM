# AI4RA Unified Data Model (UDM)

A universal data model for research administration. The UDM provides a common schema that any institution can adopt to standardize how research administration data is structured, described, and shared — regardless of what systems they use internally.

**Current version: v2.2.0** (released 2026-08-28; v2.0.0 released 2026-06-11). The v1 model is preserved for reference; see [Versions](#versions) below.

## Mission

Research administration data is fragmented across institutions, locked in proprietary systems with inconsistent naming, structures, and definitions. The AI4RA UDM aims to:

- **Standardize** the language and structure of research administration data across institutions
- **Be generic enough** to accommodate the diverse needs of universities, research institutes, and funding agencies
- **Enable interoperability** between systems by providing a shared framework that institutions map their local data to
- **Support FAIR data principles** — making research administration data Findable, Accessible, Interoperable, and Reusable

The UDM is a **specification**, not a database. It defines what tables, columns, relationships, and constraints should exist. Institutions implement it in whatever database technology fits their environment and map their local data to the common model.

## How the UDM Is Defined

### Sources of Truth

The UDM v2 is defined in two complementary artifacts:

- [`vignettes/udm-v2-system-of-record.md`](vignettes/udm-v2-system-of-record.md) — the canonical prose specification: every entity, column, constraint, semantic convention, and design rationale, written database-engine agnostic.
- [`udm_schema_v2.json`](udm_schema_v2.json) — a machine-readable MySQL/MariaDB-dialect serialization of the spec: tables, columns, types, foreign keys, allowed values, PII flags, column synonyms, cross-row constraints, derived-value rules, and example views. Use this to generate DDL, build crosswalk tooling, or feed schema context to LLMs.

The two are kept in exact sync; the prose spec is authoritative on intent, the JSON on machine-consumable detail. An architectural overview lives in [`vignettes/ontology.md`](vignettes/ontology.md), and the version history in [`vignettes/CHANGELOG.md`](vignettes/CHANGELOG.md).

### Core Modules

The model's 47 tables are organized into six core modules (the universal capabilities of research administration), plus two implementation tables:

| Core module | Tables | Purpose |
|--------|--------|---------|
| **Actors** | Personnel, PersonnelCredential, Organization, OrganizationCapability, OrganizationIdentifier, OrganizationRole, ContactDetails | People, organizations, their roles, credentials, and contact information |
| **Funding Cycle** | RFA, RFARequirement, Proposal, ProposalApproval, PreAwardAuthorization, Award, Modification, Subaward, Negotiation, Terms, Report, Closeout | The full lifecycle from funding opportunity through proposal, award, and closeout |
| **Effort** | AwardRole, Effort | Roles on funded work and effort certification |
| **Finance** | Budget, Fund, Account, FinanceCode, Transaction, RateAgreement, IndirectRate, Payment, CostShare, Equipment | Budgets, accounting, transactions, rates, and capital assets |
| **Compliance** | ComplianceRequirement, ComplianceCoverage, ProtocolRole, ConflictOfInterest, OtherSupport, OtherSupportDisclosure, PolicyException | IRB/IACUC protocols, COI, other support, policy exceptions, and regulatory tracking |
| **Records** | Document, Communication, Restriction, Deadline, Classification, Action, CommunicationResponse | The records that accumulate around the work, attached across all core modules |

**Implementation tables** (not a core module): `AllowedValues` (institution-specific controlled vocabularies with cross-institution canonical codes) and `BudgetCategory` (shared budget category reference). Core modules are research-administration capabilities; these two tables support the model's mechanics.

The model also includes **12 example views** (e.g., `vw_Active_Awards`, `vw_Award_Lineage`, `vw_Overdue_Reports`) as reference query implementations that institutions can adopt or adapt for dashboards and reporting.

Browse the full model interactively at the [UDM Dashboard](https://ui-insight.github.io/AI4RA-UDM/).

### Naming Conventions (Ontology)

The UDM follows consistent, predictable naming patterns:

- **Tables**: PascalCase, singular — `AwardRole`, `ComplianceCoverage`, `Personnel`
- **Columns**: Snake_Case — `Award_Number`, `Start_Date`, `Is_Active`
- **Primary keys**: `TableName_ID` — `Personnel_ID`, `Award_ID`, `Organization_ID` (one deliberate exception: `AllowedValues` uses the singular `AllowedValue_ID`)
- **Foreign keys**: Named by role, not generically — `Sponsor_Organization_ID`, `Administering_Organization_ID`, `Subrecipient_Organization_ID` (not just `Organization_ID`)
- **Standard suffixes**: `_ID`, `_Date`, `_Status`, `_Type`, `_Amount`, `_Percent`, `_Number`, `_Name`, `_Description`
- **Booleans**: Prefixed with `Is_` (`Is_Active`, `Is_Flow_Through`) or a similarly interrogative form (`Subject_To_Federal_Funding`, `Requires_Prior_Approval`)

For full ontology documentation, see [`vignettes/ontology.md`](vignettes/ontology.md).

### Design Patterns

v2 rests on a small set of universal patterns applied consistently across the model:

- **Lifecycle_Stage discriminator** — one table carries a record through its whole life (Budget: Proposed → Approved → Current → Actual; likewise Effort, CostShare, Payment), with revisions chained through `Parent_*_ID`.
- **Two-FK exclusive-or attachment** — satellite tables (Modification, Report, Transaction, Terms, Closeout, and others) attach to either an Award or a Subaward via two nullable FKs, keeping inbound and outbound funding symmetric.
- **Polymorphic attachment** — six Records tables reference any permitted entity via `Related_Entity_Type` + `Related_Entity_ID`, with documented minimum-conformance enforcement behavior.
- **Flexible vs. fixed enumerations** — institution-specific vocabularies live in the `AllowedValues` table (with `Canonical_Value_Code` for cross-institution normalization); universal standards use CHECK constraints. See [allowedvalues.md](vignettes/allowedvalues.md).
- **Derived columns with recompute triggers** — convenience columns like `Award.Current_End_Date` are documented as derived, with the rules to recompute them.
- **Audit and provenance columns** on every table (`Created_At`, `Updated_At`, `Source_System`, `Source_Record_ID`, `Is_Active`).

For a detailed explanation of every table, pattern, and design decision, see the [prose specification](vignettes/udm-v2-system-of-record.md).

### JSON Format

The `udm_schema_v2.json` structure (abbreviated):

```json
{
  "metadata": {
    "name": "UDM",
    "version": "2.2.0",
    "dialect": "MySQL",
    "spec_source": "vignettes/udm-v2-system-of-record.md",
    "abstract_type_mapping": { "ID": "VARCHAR(50)", "Money": "DECIMAL(15,2)", "...": "..." }
  },
  "core_module_membership": { "Actors": ["Personnel", "..."], "...": ["..."] },
  "architecture": { "module_taxonomy": { "criterion": "...", "encapsulation": "..." }, "...": "..." },
  "column_synonyms": { "values": { "Award.Award_Number": "Sponsor Award Number, NoA Number, Grant Number", "...": "..." } },
  "tables": {
    "Award": {
      "core_module": "Funding Cycle",
      "description": "Funded agreements...",
      "columns": {
        "Award_ID": { "type": "VARCHAR(50)", "primary_key": true, "required": true, "description": "PK" },
        "Sponsor_Organization_ID": {
          "type": "VARCHAR(50)",
          "references": { "table": "Organization", "column": "Organization_ID" },
          "description": "Organization providing funding"
        }
      }
    }
  },
  "status_taxonomies": { "Award_Status": ["Pending", "Active", "Closing", "Closed", "Suspended", "Terminated"] },
  "cross_row_constraints": [ { "location": "Budget", "rule": "..." } ],
  "derived_values": [ { "table": "Award", "column": "Current_End_Date", "rule": "...", "recompute_triggers": "..." } ],
  "example_views": { "views": [ { "name": "vw_Active_Awards", "sql": "SELECT ..." } ] }
}
```

## Accessing the UDM

The UDM is served as static JSON via GitHub Pages. These endpoints define the **framework** — the structure and conventions of the data model. They do not contain populated data; institutions implement the model and populate it with their own data.

| Endpoint | Description |
|----------|-------------|
| [`/data/udm_schema_v2.json`](https://ui-insight.github.io/AI4RA-UDM/data/udm_schema_v2.json) | **Complete v2 schema (current)** — tables, columns, types, constraints, descriptions, synonyms, PII flags, cross-row constraints, example views |
| [`/data/data-dictionary.json`](https://ui-insight.github.io/AI4RA-UDM/data/data-dictionary.json) | Human-readable descriptions, synonyms, and PII flags |
| [`/data/relationships.json`](https://ui-insight.github.io/AI4RA-UDM/data/relationships.json) | Foreign key relationships |
| [`/data/udm_schema.json`](https://ui-insight.github.io/AI4RA-UDM/data/udm_schema.json) | UDM v1 schema, preserved for reference |

Most consumers only need the primary endpoint (`udm_schema_v2.json`) — it contains everything.

```javascript
// Fetch the full UDM v2 schema
const response = await fetch('https://ui-insight.github.io/AI4RA-UDM/data/udm_schema_v2.json');
const udm = await response.json();

// Browse tables
Object.keys(udm.tables);  // ["Account", "Action", "Award", ...]

// Get a table's columns and descriptions
udm.tables.Award.columns;

// Find all foreign key relationships
for (const [table, data] of Object.entries(udm.tables)) {
  for (const [col, def] of Object.entries(data.columns)) {
    if (def.references) {
      console.log(`${table}.${col} → ${def.references.table}.${def.references.column}`);
    }
  }
}
```

## Implementing the UDM

The UDM is database-agnostic. The JSON serialization uses MySQL/MariaDB types as its concrete dialect; adapt as needed:

| Technology | Notes |
|------------|-------|
| **MySQL / MariaDB** | Generate CREATE TABLE statements directly from `udm_schema_v2.json` |
| **PostgreSQL** | Same approach; `VARCHAR` works as-is, adjust date functions |
| **SQLite** | Good for lightweight/embedded deployments; adapt constraints to SQLite syntax |
| **SQL Server** | Adjust type names (`VARCHAR` → `NVARCHAR`, date functions) |
| **MongoDB / NoSQL** | Use the JSON schema directly as collection definitions; embed related documents where appropriate instead of FK joins |
| **Data Warehouse (Snowflake, BigQuery, Redshift)** | Use as a staging/canonical layer; adapt types to platform-specific variants |

Institutions are expected to:
1. **Map** their local field names to UDM column names (every column carries a `description`, and the `column_synonyms` sidecar lists common alternate names, to help matchers identify equivalent concepts)
2. **Populate** the AllowedValues table with their institution-specific lookup values, including `Canonical_Value_Code` mappings for cross-institution comparability
3. **Adapt** the example views to their reporting needs

### Crosswalks

A **crosswalk** is a declarative mapping between a source system's vocabulary and the UDM's — one row per source field, listing the target UDM column, any value-translation rules, and transformation notes. Crosswalks are the concrete artifact that operationalizes step 1 above.

| Source Column | UDM Column | Value Translation |
|---------------|------------|-------------------|
| `grantNumber` | `Award.Award_Number` | direct |
| `pi_email` | `ContactDetails.Contact_Value` (with `Contact_Type = "Email"`) | pivot |
| `STATUS_CD = 'A'` | `Award.Award_Status = 'Active'` | enum lookup |
| `proj_start` (MM/DD/YYYY) | `Proposal.Proposed_Start_Date` | parse to DATE |

The UDM supports crosswalk authoring in two places:

- **`column_synonyms`** — a sidecar map of common alternate names for columns, so matchers can identify equivalent concepts without a hand-built dictionary.
- **`description`** on every table and column — plain-language purpose that ML or LLM matchers can use alongside the column name to disambiguate near-duplicates.

In a medallion lakehouse, the crosswalk *is* the Silver layer: each source gets its own Silver schema that renames/pivots/coerces its raw Bronze data into UDM-shaped columns. The Gold layer then unions the Silver views across sources.

See the [Infrastructure tab](https://ui-insight.github.io/AI4RA-UDM/) of the dashboard for diagrams of both the Silver crosswalk layer and the surrounding medallion architecture.

## Versions

| Version | Status | Artifacts |
|---------|--------|-----------|
| **v2.2** | Current | [`udm_schema_v2.json`](udm_schema_v2.json), [prose spec](vignettes/udm-v2-system-of-record.md) |
| v1.0 | Preserved for reference | [`udm_schema.json`](udm_schema.json) |

v2 is a major refactor: 47 tables (from 40), six core modules (from ten domains), unified lifecycle modeling, Award/Subaward symmetry, and rule catalogs for cross-row constraints and semantic conventions. See the [CHANGELOG](vignettes/CHANGELOG.md) for the full delta and migration guidance from v1.

## Roadmap: Core and Optional Modules

The UDM grows by a hub-and-spoke plan under one taxonomy: everything specified is a **module**. **Core modules** are the universal capabilities, required of every implementation; **optional modules** are declared per implementation ("UDM core + modules: governance, IP"); **local extensions** are unspecified. Two laws govern every module. The **capability criterion**: a module must be a capability an institution recognizably exercises ("we do X"), with universality deciding the tier; modules are carved by story, never by abstraction depth. The **encapsulation rule**: a module adds only its own tables, referencing the core by foreign key; it never adds columns to, alters constraints of, or extends the closed vocabularies of the core, with two sanctioned extension points (the Records target registry and AllowedValues value groups).

```mermaid
graph TD
    CORE(["UDM Core — core modules<br/>Actors · Funding Cycle · Effort · Finance<br/>Compliance · Records · Outputs"])
    CP["Compliance Protocols<br/>shared protocol spine"]
    AR["Animal Research"]
    HS["Human Subjects"]
    BIO["Biosafety"]
    GOV["Governance<br/>committees & meetings"]
    IP["IP<br/>invention disclosures & patent filings"]
    CT["Clinical Trials"]
    AGR["Agreements<br/>MTA / DUA / NDA"]

    CORE --- CP
    CP --- AR
    CP --- HS
    CP --- BIO
    CORE --- GOV
    CORE --- IP
    CORE -.->|future candidate| CT
    CORE -.->|future candidate| AGR
    GOV -.->|bridge entities| CP

    style CORE fill:#667eea,color:#fff,stroke:#4c51bf
    style CT stroke-dasharray: 5 5
    style AGR stroke-dasharray: 5 5
```

| Piece | Contents | Status |
|---|---|---|
| **Outputs (core module 7)** | Output, OutputContributor, AwardOutput, PublicationDetail, DatasetDetail, SoftwareDetail — what funded work produced, reported against awards | Designed ([#71](https://github.com/ui-insight/AI4RA-UDM/issues/71)) |
| **IP module** | InventionDisclosureDetail, PatentFiling — disclosure events, Bayh-Dole election, filing records | Designed |
| **Governance module** | Committee, CommitteeMember, Meeting, MeetingAttendance | Designed ([#69](https://github.com/ui-insight/AI4RA-UDM/issues/69)) |
| **Compliance Protocols (shared spine)** | Protocol, coverage, personnel, review workflow, amendments, continuing review, adverse events, deviations | Designed ([#60](https://github.com/ui-insight/AI4RA-UDM/issues/60)) |
| **Animal Research / Human Subjects / Biosafety modules** | Per-regime protocol detail on the spine | Designed within [#60](https://github.com/ui-insight/AI4RA-UDM/issues/60) |
| **Clinical Trials, Agreements** | Registration/enrollment records; MTA / DUA / NDA lifecycles | Future candidates |

## Contributing

The UDM improves through community input. There are several ways to participate:

- **Suggest changes or report issues**: Open a [GitHub Issue](https://github.com/ui-insight/AI4RA-UDM/issues) describing the table, column, or convention you'd like to add, change, or discuss
- **Join the discussion**: Use [GitHub Discussions](https://github.com/ui-insight/AI4RA-UDM/discussions) for broader questions about the model's direction, new capability coverage, or adoption experiences
- **Take the survey**: A short [practitioner survey](https://bit.ly/4b5b21q) on what your institution needs from a shared model

When `udm_schema_v2.json` is updated on `main`, CI automatically regenerates the dashboard data files served via GitHub Pages.

<!-- ERD_START -->
## Entity Relationship Diagram

```mermaid
graph TD

    Action-->AllowedValues
    Action-->Document
    Action-->Personnel
    Award-->AllowedValues
    Award-->Award
    Award-->Organization
    Award-->Personnel
    Award-->Proposal
    Award-->RFA
    AwardRole-->AllowedValues
    AwardRole-->Award
    AwardRole-->Organization
    AwardRole-->Personnel
    AwardRole-->Subaward
    Budget-->Award
    Budget-->Budget
    Budget-->BudgetCategory
    Budget-->IndirectRate
    Budget-->Proposal
    Budget-->Subaward
    Closeout-->Award
    Closeout-->Subaward
    Communication-->Organization
    Communication-->Personnel
    CommunicationResponse-->AllowedValues
    CommunicationResponse-->Communication
    CommunicationResponse-->Personnel
    ComplianceCoverage-->Award
    ComplianceCoverage-->ComplianceRequirement
    ComplianceCoverage-->Subaward
    ComplianceRequirement-->AllowedValues
    ComplianceRequirement-->ComplianceRequirement
    ComplianceRequirement-->Organization
    ConflictOfInterest-->AllowedValues
    ConflictOfInterest-->Award
    ConflictOfInterest-->Organization
    ConflictOfInterest-->OtherSupport
    ConflictOfInterest-->Personnel
    ContactDetails-->AllowedValues
    ContactDetails-->Organization
    ContactDetails-->Personnel
    CostShare-->AllowedValues
    CostShare-->Award
    CostShare-->CostShare
    CostShare-->Proposal
    CostShare-->Subaward
    Deadline-->AllowedValues
    Deadline-->Personnel
    Document-->AllowedValues
    Document-->Document
    Document-->Personnel
    Effort-->AwardRole
    Effort-->Effort
    Effort-->Personnel
    Equipment-->Award
    Equipment-->Organization
    Equipment-->Personnel
    Equipment-->Subaward
    FinanceCode-->Account
    FinanceCode-->AllowedValues
    FinanceCode-->Award
    FinanceCode-->Fund
    Fund-->AllowedValues
    Fund-->Organization
    IndirectRate-->RateAgreement
    Modification-->AllowedValues
    Modification-->Award
    Modification-->Subaward
    Negotiation-->Award
    Negotiation-->Organization
    Negotiation-->Personnel
    Negotiation-->Proposal
    Negotiation-->Subaward
    Organization-->Organization
    OrganizationCapability-->AllowedValues
    OrganizationCapability-->Organization
    OrganizationIdentifier-->Organization
    OrganizationRole-->AllowedValues
    OrganizationRole-->Award
    OrganizationRole-->Organization
    OrganizationRole-->Personnel
    OrganizationRole-->RFA
    OrganizationRole-->Subaward
    OtherSupport-->Organization
    OtherSupport-->Personnel
    OtherSupportDisclosure-->Award
    OtherSupportDisclosure-->Organization
    OtherSupportDisclosure-->OtherSupport
    OtherSupportDisclosure-->Proposal
    Payment-->Award
    Payment-->Budget
    Payment-->Payment
    Payment-->Subaward
    Personnel-->Organization
    PersonnelCredential-->Organization
    PersonnelCredential-->Personnel
    PolicyException-->Award
    PolicyException-->Personnel
    PolicyException-->Proposal
    PolicyException-->Subaward
    PreAwardAuthorization-->Award
    PreAwardAuthorization-->Personnel
    PreAwardAuthorization-->Proposal
    Proposal-->AllowedValues
    Proposal-->Organization
    Proposal-->Proposal
    Proposal-->RFA
    ProposalApproval-->Personnel
    ProposalApproval-->Proposal
    ProtocolRole-->AllowedValues
    ProtocolRole-->Award
    ProtocolRole-->ComplianceRequirement
    ProtocolRole-->Personnel
    ProtocolRole-->Subaward
    RFA-->AllowedValues
    RFA-->Organization
    RFARequirement-->RFA
    RateAgreement-->Organization
    Report-->Award
    Report-->Document
    Report-->Personnel
    Report-->Subaward
    Restriction-->AllowedValues
    Restriction-->Personnel
    Subaward-->Award
    Subaward-->Organization
    Subaward-->Personnel
    Subaward-->Proposal
    Subaward-->Subaward
    Terms-->Award
    Terms-->Subaward
    Transaction-->Account
    Transaction-->AllowedValues
    Transaction-->Award
    Transaction-->Budget
    Transaction-->CostShare
    Transaction-->FinanceCode
    Transaction-->Fund
    Transaction-->Subaward
```
<!-- ERD_END -->
