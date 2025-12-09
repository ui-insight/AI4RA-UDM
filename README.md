# AI4RA-UDM

A standardized data model for research administration that provides universal terms and definitions, helping institutions map their local data to a common schema for dashboards and analytics.

## Schema Overview

The AI4RA Unified Data Model (UDM) covers all major domains of research administration:

- **Core Entities**: Organization, Personnel, Contact, AllowedValues
- **Project Management**: Project, RFA, Proposal, ProposalBudget
- **Award Management**: Award, Modification, Terms, AwardBudgetPeriod, AwardBudget, Subaward
- **Financial Tracking**: Fund, Account, FinanceCode, ActivityCode, Transaction, IndirectRate
- **Deliverables**: Invoice, AwardDeliverable
- **Personnel & Effort**: ProjectRole, Effort
- **Compliance**: ComplianceRequirement, ConflictOfInterest
- **Documentation**: Document, ActivityLog, DataDictionary

### Naming Conventions

The UDM follows consistent naming conventions throughout the schema:

**Table Names**: PascalCase
- Examples: `AllowedValues`, `ProjectRole`, `ComplianceRequirement`, `AwardBudgetPeriod`
- Multi-word tables use no separators: `AwardDeliverable`, `ConflictOfInterest`

**Column Names**: Snake_case
- Examples: `Allowed_Value_ID`, `Project_ID`, `Is_Active`, `Date_Created`
- Primary keys: `TableName_ID` format (e.g., `Personnel_ID`, `Award_ID`, `Organization_ID`)
- Foreign keys: Match the referenced primary key name (e.g., `Parent_Organization_ID` references `Organization.Organization_ID`)
- Boolean flags: Prefixed with `Is_` (e.g., `Is_Active`, `Is_Primary`)
- Audit fields: `Date_Created`, `Last_Modified_Date`, `Last_Modified_By`, `Created_By_Personnel_ID`

**Rationale**: This mixed approach (PascalCase for tables, Snake_case for columns) is a common and widely-accepted convention in MySQL/Dolt environments. Snake_case for columns provides better readability and case-insensitive matching, while PascalCase for tables clearly distinguishes entity names.

### Key Design Principles

1. **Referential Integrity**: All foreign keys include proper constraints with CASCADE or SET NULL behaviors
2. **Audit Trails**: Timestamps and user tracking on critical tables
3. **Flexible Lookups**: `AllowedValues` table provides configurable controlled vocabularies
4. **Self-Referencing Hierarchies**: Support for organizational and project hierarchies
5. **Comprehensive Financial Tracking**: Detailed budget periods, transactions, and cost tracking
6. **Compliance Support**: Built-in tables for IRB, IACUC, COI, and other regulatory requirements

<!-- ERD_START -->
## Entity Relationship Diagram

```mermaid
erDiagram

    Organization {
        VARCHAR Org_ID PK
        VARCHAR Parent_Org_ID FK
        VARCHAR Org_Name
        VARCHAR Org_Type
        VARCHAR UEI
        BOOL Is_Active
        TIMESTAMP Date_Created
        TIMESTAMP Last_Modified_Date
        string ... 2 more columns
    }

    Personnel {
        VARCHAR Personnel_ID PK
        VARCHAR Department_Org_ID FK
        VARCHAR ORCID
        VARCHAR First_Name
        VARCHAR Last_Name
        VARCHAR Middle_Name
        VARCHAR Institutional_ID
        VARCHAR Primary_Email
        string ... 6 more columns
    }

    Contact {
        INT Contact_ID PK
        VARCHAR Personnel_ID FK
        INT Contact_Type_Value_ID FK
        VARCHAR Contact_Value
        BOOL Is_Primary
        BOOL Is_Active
        TIMESTAMP Date_Created
    }

    AllowedValues {
        INT Allowed_Value_ID PK
        INT Parent_Value_ID FK
        VARCHAR Allowed_Value_Group
        VARCHAR Allowed_Value_Code
        VARCHAR Allowed_Value_Label
        TEXT Allowed_Value_Description
        INT Display_Order
        BOOL Is_Active
        string ... 1 more columns
    }

    DataDictionary {
        INT entity_id PK
        VARCHAR entity_name
        VARCHAR entity_type
        VARCHAR description
        VARCHAR synonyms
        VARCHAR context
        VARCHAR notes
        VARCHAR category
        string ... 3 more columns
    }

    Project {
        VARCHAR Project_ID PK
        VARCHAR Parent_Project_ID FK
        VARCHAR Lead_Org_ID FK
        VARCHAR Title
        VARCHAR Status
        VARCHAR Acronym
        VARCHAR Project_Type
        TEXT Abstract
        string ... 6 more columns
    }

    RFA {
        VARCHAR RFA_ID PK
        VARCHAR Sponsor_Org_ID FK
        VARCHAR RFA_Number
        VARCHAR RFA_Title
        VARCHAR Program_Code
        VARCHAR Announcement_URL
        VARCHAR Opportunity_Number
        VARCHAR CFDA_Number
        string ... 2 more columns
    }

    Proposal {
        VARCHAR Proposal_ID PK
        VARCHAR Project_ID FK
        VARCHAR Sponsor_Org_ID FK
        VARCHAR RFA_ID FK
        VARCHAR Title
        VARCHAR Proposal_Number
        DATE Proposed_Start_Date
        DATE Proposed_End_Date
        string ... 13 more columns
    }

    ProposalBudget {
        INT Budget_ID PK
        VARCHAR Proposal_ID FK
        INT Period_Number
        VARCHAR Budget_Category
        VARCHAR Line_Item_Description
        DECIMAL Direct_Cost
        DECIMAL Indirect_Cost
        DECIMAL Total_Cost
        string ... 3 more columns
    }

    Award {
        VARCHAR Award_ID PK
        VARCHAR Project_ID FK
        VARCHAR Sponsor_Org_ID FK
        VARCHAR RFA_ID FK
        VARCHAR Proposal_ID FK
        VARCHAR Prime_Sponsor_Org_ID FK
        VARCHAR Title
        VARCHAR Status
        string ... 13 more columns
    }

    Modification {
        VARCHAR Event_ID PK
        VARCHAR Award_ID FK
        VARCHAR Affected_Personnel_ID FK
        VARCHAR Approved_By_Personnel_ID FK
        VARCHAR Created_By_Personnel_ID FK
        VARCHAR Modification_Number
        VARCHAR Event_Type
        TIMESTAMP Event_Timestamp
        string ... 9 more columns
    }

    Terms {
        INT Terms_ID PK
        VARCHAR Award_ID FK
        VARCHAR Payment_Method
        VARCHAR Invoicing_Frequency
        INT Invoice_Submission_Days
        TEXT Reporting_Requirements
        TEXT Special_Conditions
        TEXT Property_Requirements
        string ... 5 more columns
    }

    AwardBudgetPeriod {
        INT Period_ID PK
        VARCHAR Award_ID FK
        VARCHAR Status
        INT Period_Number
        DATE Start_Date
        DATE End_Date
        DECIMAL Direct_Costs
        DECIMAL Indirect_Costs
        string ... 4 more columns
    }

    AwardBudget {
        INT Award_Budget_ID PK
        VARCHAR Award_ID FK
        INT Period_ID FK
        VARCHAR Budget_Category
        VARCHAR Line_Item_Description
        DECIMAL Approved_Direct_Cost
        DECIMAL Approved_Indirect_Cost
        DECIMAL Approved_Total_Cost
        string ... 6 more columns
    }

    Subaward {
        VARCHAR Subaward_ID PK
        VARCHAR Prime_Award_ID FK
        VARCHAR Subrecipient_Org_ID FK
        DECIMAL Amount
        VARCHAR Status
        VARCHAR Subaward_Number
        DATE Start_Date
        DATE End_Date
        string ... 7 more columns
    }

    CostShare {
        INT CostShare_ID PK
        VARCHAR Award_ID FK
        VARCHAR Source_Org_ID FK
        VARCHAR Status
        DECIMAL Committed_Amount
        VARCHAR Commitment_Type
        VARCHAR Source_Fund_Code
        VARCHAR Source_Description
        string ... 4 more columns
    }

    Invoice {
        VARCHAR Invoice_ID PK
        VARCHAR Award_ID FK
        INT Period_ID FK
        VARCHAR Status
        VARCHAR Invoice_Number
        DATE Invoice_Date
        DATE Period_Start_Date
        DATE Period_End_Date
        string ... 9 more columns
    }

    AwardDeliverable {
        INT Deliverable_ID PK
        VARCHAR Award_ID FK
        INT Period_ID FK
        VARCHAR Responsible_Personnel_ID FK
        VARCHAR Reviewed_By_Personnel_ID FK
        VARCHAR Status
        VARCHAR Deliverable_Type
        VARCHAR Deliverable_Number
        string ... 5 more columns
    }

    ProjectRole {
        INT Role_ID PK
        VARCHAR Project_ID FK
        VARCHAR Personnel_ID FK
        INT Role_Value_ID FK
        VARCHAR Funding_Award_ID FK
        BOOL Is_Key_Personnel
        DATE Start_Date
        DATE End_Date
        string ... 5 more columns
    }

    Effort {
        INT Effort_ID PK
        INT Role_ID FK
        VARCHAR Certified_By_Personnel_ID FK
        DATE Period_Start_Date
        DATE Period_End_Date
        DECIMAL Committed_Percent
        DECIMAL Committed_Person_Months
        DECIMAL Actual_Percent
        string ... 8 more columns
    }

    Fund {
        VARCHAR Fund_Code PK
        INT Fund_Type_Value_ID FK
        VARCHAR Org_ID FK
        VARCHAR Fund_Name
        BOOL Is_Active
        TIMESTAMP Date_Created
    }

    Account {
        VARCHAR Account_Code PK
        VARCHAR Parent_Account_Code FK
        VARCHAR Account_Name
        VARCHAR Natural_Classification
        VARCHAR Account_Type
        BOOL Is_Active
        TIMESTAMP Date_Created
    }

    FinanceCode {
        VARCHAR Finance_Code PK
        VARCHAR Award_ID FK
        VARCHAR Org_ID FK
        VARCHAR Finance_Name
        VARCHAR Purpose
        BOOL Is_Active
        TIMESTAMP Date_Created
        TIMESTAMP Last_Modified_Date
    }

    ActivityCode {
        VARCHAR Activity_Code PK
        VARCHAR Activity_Name
        VARCHAR Activity_Type
        BOOL Is_Active
        TIMESTAMP Date_Created
    }

    IndirectRate {
        INT Rate_ID PK
        VARCHAR Org_ID FK
        VARCHAR Rate_Type
        DECIMAL Rate_Percentage
        DATE Effective_Start_Date
        DATE Effective_End_Date
        VARCHAR Base_Type
        VARCHAR Negotiated_Agreement_ID
        string ... 2 more columns
    }

    Transaction {
        VARCHAR Transaction_ID PK
        VARCHAR Fund_Code FK
        VARCHAR Account_Code FK
        VARCHAR Finance_Code FK
        VARCHAR Activity_Code FK
        VARCHAR Award_ID FK
        VARCHAR Project_ID FK
        INT Period_ID FK
        string ... 14 more columns
    }

    ComplianceRequirement {
        VARCHAR Requirement_ID PK
        VARCHAR Project_ID FK
        VARCHAR Principal_Investigator_ID FK
        VARCHAR Title
        VARCHAR Status
        VARCHAR Requirement_Number
        VARCHAR Requirement_Type
        VARCHAR Review_Type
        string ... 7 more columns
    }

    ConflictOfInterest {
        INT COI_ID PK
        VARCHAR Personnel_ID FK
        VARCHAR Project_ID FK
        VARCHAR Award_ID FK
        VARCHAR Reviewed_By_Personnel_ID FK
        VARCHAR Status
        DATE Disclosure_Date
        VARCHAR Relationship_Type
        string ... 7 more columns
    }

    Document {
        INT Document_ID PK
        VARCHAR Uploaded_By_Personnel_ID FK
        VARCHAR Title
        VARCHAR Status
        VARCHAR Document_Type
        VARCHAR Related_Entity_Type
        VARCHAR Related_Entity_ID
        VARCHAR File_Name
        string ... 11 more columns
    }

    ActivityLog {
        INT Activity_ID PK
        VARCHAR Table_Name
        VARCHAR Record_ID
        VARCHAR Action_Type
        TIMESTAMP Action_Timestamp
        VARCHAR User_ID
        TEXT Old_Values
        TEXT New_Values
        string ... 2 more columns
    }

    %% Relationships
    Account ||--o{ Account : has
    AllowedValues ||--o{ AllowedValues : has
    Organization ||--o{ Award : has
    Project ||--o{ Award : has
    Proposal ||--o{ Award : has
    RFA ||--o{ Award : has
    Award ||--o{ AwardBudget : has
    AwardBudgetPeriod ||--o{ AwardBudget : has
    Award ||--o{ AwardBudgetPeriod : has
    Award ||--o{ AwardDeliverable : has
    AwardBudgetPeriod ||--o{ AwardDeliverable : has
    Personnel ||--o{ AwardDeliverable : has
    Personnel ||--o{ ComplianceRequirement : has
    Project ||--o{ ComplianceRequirement : has
    Award ||--o{ ConflictOfInterest : has
    Personnel ||--o{ ConflictOfInterest : has
    Project ||--o{ ConflictOfInterest : has
    AllowedValues ||--o{ Contact : has
    Personnel ||--o{ Contact : has
    Award ||--o{ CostShare : has
    Organization ||--o{ CostShare : has
    Personnel ||--o{ Document : has
    Personnel ||--o{ Effort : has
    ProjectRole ||--o{ Effort : has
    Award ||--o{ FinanceCode : has
    Organization ||--o{ FinanceCode : has
    AllowedValues ||--o{ Fund : has
    Organization ||--o{ Fund : has
    Organization ||--o{ IndirectRate : has
    Award ||--o{ Invoice : has
    AwardBudgetPeriod ||--o{ Invoice : has
    Personnel ||--o{ Modification : has
    Award ||--o{ Modification : has
    Organization ||--o{ Organization : has
    Organization ||--o{ Personnel : has
    Organization ||--o{ Project : has
    Project ||--o{ Project : has
    Award ||--o{ ProjectRole : has
    Personnel ||--o{ ProjectRole : has
    Project ||--o{ ProjectRole : has
    AllowedValues ||--o{ ProjectRole : has
    Project ||--o{ Proposal : has
    RFA ||--o{ Proposal : has
    Organization ||--o{ Proposal : has
    Proposal ||--o{ ProposalBudget : has
    Organization ||--o{ RFA : has
    Award ||--o{ Subaward : has
    Organization ||--o{ Subaward : has
    Award ||--o{ Terms : has
    Account ||--o{ Transaction : has
    ActivityCode ||--o{ Transaction : has
    Award ||--o{ Transaction : has
    FinanceCode ||--o{ Transaction : has
    Fund ||--o{ Transaction : has
    AwardBudgetPeriod ||--o{ Transaction : has
    Personnel ||--o{ Transaction : has
    Project ||--o{ Transaction : has
```
<!-- ERD_END -->
