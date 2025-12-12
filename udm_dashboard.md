# UDM Dashboard Visualization Plan

## Organization-Centric View

### Concept
The most natural way to understand research administration is through **Organizations** and their multiple roles:
- Sponsors give money
- Departments receive and manage money
- Subrecipients receive portions of money
- People belong to organizations and work on projects

### Main View - The Hub

```
                        ┌─────────────────┐
                        │  ORGANIZATION   │
                        │   [Expandable]  │
                        └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼─────┐           ┌─────▼──────┐         ┌──────▼──────┐
   │ SPONSOR  │           │ RECIPIENT  │         │SUBRECIPIENT │
   │   Role   │           │    Role    │         │    Role     │
   └────┬─────┘           └─────┬──────┘         └──────┬──────┘
        │                       │                        │
    Gives Awards          Receives Awards        Receives Subawards
        │                       │                        │
        │                 ┌─────┴─────┐                 │
        │                 │           │                 │
        │            ┌────▼───┐  ┌───▼──────┐          │
        │            │PROJECT │  │PERSONNEL │          │
        │            └────┬───┘  └───┬──────┘          │
        │                 │          │                 │
        └─────────→ ┌─────▼──────────▼─────┐ ─────────┘
                    │       AWARD          │
                    │   (Financial Core)   │
                    └──────────────────────┘
```

## Tier 1: Always Visible (Main Tables)

### 1. Organization (Center Hub)
**Display:**
- Organization_Name
- Organization_Type
- Hierarchy indicator (if has Parent_Organization)
- UEI (if applicable)

**Click to expand:** Shows all organizational roles (see Tier 2)

### 2. Award (Primary Artifact)
**Display:**
- Award_Number
- Award_Title
- Award_Status
- Current_Total_Funded
- Original_Start_Date → Current_End_Date

**Connections:**
- FROM: Sponsor_Organization
- TO: Submitting_Organization / Administering_Organization
- FUNDS: Project

**Click to expand:** Shows financial details (see Tier 2)

### 3. Project (The Work)
**Display:**
- Project_Title
- Acronym
- Project_Status
- Start_Date → End_Date
- Project_Type

**Connections:**
- LED BY: Lead_Organization
- FUNDED BY: Award(s)
- TEAM: Personnel (via ProjectRole)
- PARENT: Parent_Project (if hierarchical)

**Click to expand:** Shows team, compliance, outputs (see Tier 2)

### 4. Personnel (The People)
**Display:**
- First_Name Last_Name
- Person_Type
- Primary_Email
- ORCID (if available)

**Connections:**
- WORKS FOR: Department_Organization
- ASSIGNED TO: Projects (via ProjectRole)

**Click to expand:** Shows roles, effort, compliance (see Tier 2)

---

## Tier 2: Expandable Details

### Expand Organization

#### Organizational Structure
- **Hierarchy Tree:** Parent/Child organization relationships
- **ContactDetails:** Phone, email, address
- **IndirectRate:** F&A rates (if applicable)

#### As Sponsor (Outbound Flow)
- **RFA:** Funding opportunities published
  - RFA_Number, RFA_Title, Program_Code, CFDA_Number
- **Proposals Received:** Proposals submitted to this sponsor
- **Awards Given:** Awards funded by this sponsor

#### As Recipient (Inbound Flow)
- **Proposals Submitted:** To sponsors
  - Shows Proposal status, amounts, decision
- **Awards Received:** From sponsors
  - Links to Projects funded
- **Projects Managed:** Research conducted

#### As Department/College (Internal)
- **Personnel Employed:** Staff in this department
- **Projects Led:** Research led by this unit
- **Funds Managed:** Financial accounts

#### As Subrecipient (Partner)
- **Subawards Received:** From prime recipients
  - Subaward_Number, Amount, Status, Monitoring_Plan

---

### Expand Award

#### Award Overview
- **From:** Sponsor_Organization_ID
- **To:** Submitting_Organization, Administering_Organization
- **Prime Sponsor:** Prime_Sponsor_Organization (if flow-through)
- **Supports:** Project_ID
- **Originated From:** Proposal_ID → RFA_ID
- **CFDA_Number, Federal_Award_ID**

#### Financial Management
**AwardBudgetPeriod** (Timeline View)
- Period_Number, Start_Date → End_Date
- Direct_Costs, Indirect_Costs, Total_Costs
- Period_Status
- Click period → **AwardBudget** line items
  - BudgetCategory breakdown
  - Approved vs Current costs
  - Rate_Base_Used

**Modification** (Change History)
- Modification_Number, Event_Type
- Funding_Amount_Change
- New_End_Date
- Change_Description, Approval_Status

**CostShare** (Institutional Commitment)
- Committed_Amount, Met_Amount
- Commitment_Type (Cash, In-Kind, etc.)
- Source_Organization, Status

**Terms** (Award Terms & Conditions)
- Payment_Method, Invoicing_Frequency
- Reporting_Requirements
- Special_Conditions
- Closeout_Requirements

#### Execution & Reporting
**Invoice** (Billing)
- Invoice_Number, Invoice_Date
- Direct_Costs, Indirect_Costs, Total_Amount
- Invoice_Status (Draft → Submitted → Paid)
- Payment_Date, Payment_Amount

**AwardDeliverable** (Reports & Outputs)
- Deliverable_Type, Deliverable_Number
- Due_Date, Submission_Date
- Deliverable_Status
- Responsible_Personnel, Reviewer

**Subaward** (Flow-Through to Partners)
- Subrecipient_Organization
- Subaward_Number, Subaward_Amount
- Start_Date → End_Date
- PI_Name, Risk_Level, Monitoring_Plan

#### Financial Transactions
**Transaction** (Money Movement)
- Transaction_Date, Transaction_Amount
- Transaction_Type (Expense, Revenue, etc.)
- Fund_Code, Account_Code, Finance_Code
- Description, Document_Number
- Is_Reconciled

**FinanceCode** (Accounting)
- Finance_Code, Finance_Name
- Purpose (from AllowedValues)
- Links to Award, Organization

---

### Expand Project

#### Project Team
**ProjectRole** (Personnel Assignments)
- Personnel_ID
- Role (PI, Co-I, Coordinator, etc. from AllowedValues)
- Is_Key_Personnel
- Start_Date → End_Date
- FTE_Percent, Salary_Charged
- Funding_Award_ID

**Click Role → Effort** (Time Tracking)
- Period_Start_Date → Period_End_Date
- Committed_Percent, Actual_Percent, Variance_Percent
- Is_Certified, Certification_Date, Certification_Method
- Certified_By_Personnel

#### Compliance
**ComplianceRequirement** (IRB, IACUC, etc.)
- Requirement_Number, Requirement_Title
- Requirement_Type (IRB, IACUC, IBC, COI, Radiation, Other)
- Review_Type (Exempt, Expedited, Full Board)
- Initial_Approval_Date, Expiration_Date
- Requirement_Status
- Principal_Investigator, Approval_Body
- Risk_Level

**ConflictOfInterest** (Disclosures)
- Personnel disclosures related to this project
- Relationship_Type, Entity_Name
- Financial_Interest_Amount
- ConflictOfInterest_Status, Management_Plan

#### Funding Sources
**Award(s)** funding this project
- Multiple awards can fund one project
- Shows Award_Number, amounts, periods

**ProposalBudget** (What Was Proposed)
- Original budget by period and category
- Compare to AwardBudget (approved vs proposed)

#### Outputs & Documentation
**Document** (Attachments)
- File_Name, Storage_Location
- Document_Type (from AllowedValues)
- Version_Number, Description
- File_Size_Bytes, MIME_Type, File_Hash

**AwardDeliverable** (linked to awards)
- Reports, publications, data deliverables

#### Project Structure
**Parent/Child Projects**
- Parent_Project_ID (if this is a subproject)
- Child Projects (if this has subprojects)
- Shows hierarchical research structure

---

### Expand Personnel

#### Identity & Contact
- **Name:** First_Name, Middle_Name, Last_Name
- **ORCID:** Researcher identifier
- **Institutional_ID:** Employee/Student ID
- **Primary_Email**
- **ContactDetails:** Additional phone, mobile, fax
  - Contact_Type (from AllowedValues)
  - ContactDetails_Value

#### Organizational Affiliation
- **Department:** Department_Organization_ID
- **Person_Type:** Faculty, Staff, Student, Postdoc, etc.

#### Project Assignments
**ProjectRole** (All Projects)
- List of projects this person works on
- Role on each project (PI, Co-I, etc.)
- FTE commitment
- Active date ranges

**For Each Role → Effort Tracking**
- Time periods
- Committed vs actual effort
- Certification status

#### Compliance & Disclosures
**ComplianceRequirement** (As Principal Investigator)
- IRB/IACUC protocols where this person is PI
- Approval status, expiration dates

**ConflictOfInterest** (Personal Disclosures)
- All COI disclosures by this person
- Related to which projects/awards
- Disclosure_Date, Status
- Entity_Name, Relationship_Type
- Management_Plan

#### Responsibilities
**AwardDeliverable** (As Responsible Person)
- Deliverables assigned to this person
- Due dates, submission status

**Modification** (As Approver or Affected)
- Award modifications this person approved
- Modifications affecting this person (e.g., role changes)

---

## Tier 3: Supporting Infrastructure (Toggle Layer)

### Proposal Flow (Pre-Award Process)
```
┌─────┐    ┌──────────┐    ┌────────────────┐
│ RFA │ → │ Proposal │ → │ ProposalBudget │
└──┬──┘    └────┬─────┘    └────────────────┘
   │            │
   ↓            ↓
 Award      Project
```

**RFA** (Request for Applications)
- Sponsor_Organization
- RFA_Number, RFA_Title
- Program_Code, Opportunity_Number
- CFDA_Number, Announcement_URL

**Proposal**
- Proposal_Number, Proposal_Title
- Project_ID (proposed research)
- Sponsor_Organization (submitting to)
- Submitting_Organization, Administering_Organization
- Internal_Approval_Status, Decision_Status
- Total_Proposed_Budget (Direct + Indirect)
- Submission_Date, Decision_Date
- Previous_Proposal_ID (resubmissions)

**ProposalBudget**
- Budget by Period_Number and BudgetCategory
- Direct_Cost, Indirect_Cost, Total_Cost
- Quantity, Unit_Cost
- Applied_Indirect_Rate

### Financial Plumbing (Accounting Structure)
```
┌──────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐
│ Fund │→│ FinanceCode │→│ Transaction │→│ Account │
└──────┘   └──────┬──────┘   └──────┬──────┘   └─────────┘
                  │                  │
                  ↓                  ↓
                Award          Reconciliation
```

**Fund**
- Fund_Code, Fund_Name
- Fund_Type (from AllowedValues)
- Organization_ID

**Account** (Chart of Accounts)
- Account_Code, Account_Name
- Account_Type (Expense, Revenue, Asset, Liability, Equity)
- Account_Category
- Parent_Account_Code (hierarchical)

**Transaction** (Already described under Award)
- Links: Fund, Account, FinanceCode, Award, Project

**FinanceCode** (Already described under Award)
- Award-specific accounting codes

### Reference & Metadata Tables

**AllowedValues** (Enumeration Management)
- Allowed_Value_Group (domain)
- Allowed_Value_Code (key)
- Allowed_Value_Label (display)
- Allowed_Value_Description
- Used for: Contact types, project types, roles, transaction types, etc.

**BudgetCategory** (Expense Classifications)
- Category_Code (e.g., SENIOR_PERSONNEL, TRAVEL, EQUIPMENT)
- Category_Name
- Category_Description
- Used in: ProposalBudget, AwardBudget

**Document** (Attachments Throughout)
- Can attach to: Award, Proposal, Project, ComplianceRequirement, Subaward, Organization, Personnel, Invoice, AwardDeliverable, ConflictOfInterest
- Document_Type (from AllowedValues)
- Related_Entity_Type, Related_Entity_ID
- Storage metadata: File_Name, Storage_Location, File_Size_Bytes, MIME_Type, File_Hash
- Version_Number (document versioning)

**IndirectRate** (F&A Rate Agreements)
- Organization_ID
- Rate_Type (On-Campus, Off-Campus, Fringe Benefits, etc.)
- Rate_Percentage
- Effective_Start_Date → Effective_End_Date
- Base_Type (MTDC, TDC, Salaries and Wages)
- Negotiated_Agreement_ID

**ActivityLog** (Audit Trail)
- Table_Name, Record_ID
- Action_Type (INSERT, UPDATE, DELETE, SELECT)
- Action_Timestamp
- User_ID, Session_ID, IP_Address
- Old_Values, New_Values (change tracking)

---

## Visual Design Specifications

### Node Colors
- **Blue (#4A90E2):** Organization (all types)
- **Green (#7ED321):** Award (active money)
- **Purple (#BD10E0):** Project (research)
- **Orange (#F5A623):** Personnel (people)
- **Gray (#D8D8D8):** Supporting tables (budget categories, terms, reference data)
- **Red (#D0021B):** Compliance issues or overdue items

### Node Sizes
- **Large:** High-connectivity nodes (Award with many transactions, Project with many personnel)
- **Medium:** Standard entities (Organization, Personnel)
- **Small:** Reference data (BudgetCategory, AllowedValues)
- **Dynamic:** Size proportional to number of connections or dollar amounts

### Edge Types
- **Solid arrow (→):** Direct foreign key relationship
- **Dashed line (⤏):** Optional/nullable relationship
- **Bold line (═>):** Financial flow (money movement)
- **Double line (⇒):** One-to-many relationship
- **Color-coded:** Match the source node color

### Node Badges & Indicators
- **Status badges:** Active/Pending/Closed (color-coded)
- **Count badges:** Number of connected records (e.g., "12 Awards")
- **Alert icons:** Overdue deliverables, expiring compliance, low balance
- **Currency:** Dollar amounts formatted (e.g., "$1.2M")

### Interaction Behaviors

#### Click Node
- **Single click:** Expand to show directly connected tables
- **Animation:** Smooth expansion with connected nodes sliding into view
- **Highlight:** Dim non-related nodes to focus on connections

#### Double Click
- **Navigate:** Drill into detailed table view (full record list)
- **Modal/Panel:** Show data grid with sorting, filtering

#### Hover
- **Tooltip:** Quick stats
  - Organization: # of awards, total funding
  - Award: Balance, end date, status
  - Project: Team size, funding sources
  - Personnel: Current roles, FTE total
- **Highlight:** Light up all connected paths

#### Right Click (Context Menu)
- **View Details:** Open detailed record
- **Export Data:** Download as CSV/JSON
- **Create New:** Add related record (e.g., from Award → Create Invoice)
- **Navigate To:** Jump to connected entity

#### Drag & Drop
- **Rearrange:** Manually position nodes for custom layouts
- **Associate:** Drag to create relationships (if permitted by schema)

### Layout Algorithms

#### Initial View
- **Center:** Organization node (selected or user's default)
- **Radial layout:** Roles branch out radially
- **Hierarchical:** Sub-nodes in layers by type

#### Expanded View
- **Force-directed graph:** Let physics simulation position nodes naturally
- **Hierarchical:** Time-based layouts (proposals → awards → deliverables)
- **Clustering:** Group by organization type, project status, etc.

#### Filters & Views
- **Time filter:** Show entities within date range
- **Status filter:** Active only, closed only, all
- **Role filter:** View as Sponsor, Recipient, Department, etc.
- **Search:** Full-text search to highlight matching nodes

---

## Implementation Plan

### Architecture: Static GitHub Pages

**Deployment:**
- **Hosting:** GitHub Pages (static site)
- **No backend required:** All data embedded in JSON files
- **No persistence:** Interactive but read-only visualization
- **Build process:** Python script parses SQL schema and generates JSON data files

**How it works:**
1. Run `scripts/parse_schema.py` to parse udm_schema.sql
2. Generates static JSON files containing schema structure and relationships
3. Client-side JavaScript in docs/index.html renders interactive visualization from JSON
4. Deploy docs/ folder to GitHub Pages

### Technology Stack

**Current Implementation:**
- **Hosting:** GitHub Pages (docs/ folder)
- **Visualization:** Cytoscape.js v3.28.1 with Cola layout algorithm
- **UI:** Vanilla JavaScript with embedded CSS
- **Data:** Static JSON files (cytoscape-data.json)
- **Layout Engine:** WebCola for force-directed graph layout

**File Structure:**
```
docs/                           # GitHub Pages root
├── index.html                  # Main dashboard (single-file app)
└── data/
    ├── schema.json            # Table and column definitions (29 tables)
    ├── relationships.json     # Foreign key relationships (72 relationships)
    └── cytoscape-data.json    # Combined graph data (nodes + edges)

scripts/
└── parse_schema.py            # SQL parser to generate JSON files
```

### Progressive Disclosure Pattern

**Core Principle:** Start simple, reveal complexity through interaction

**Initial State:**
- Only 4 core tables visible: Organization, Award, Project, Personnel
- Shows direct relationships between these core tables only
- Clean, non-overwhelming starting view

**Expansion Rules (tableHierarchy):**
```javascript
const tableHierarchy = {
    'Organization': ['RFA', 'Proposal', 'Award', 'Project', 'Personnel',
                     'IndirectRate', 'Fund', 'Subaward', 'ContactDetails'],
    'Award': ['Proposal', 'Project', 'Terms', 'Modification', 'AwardBudgetPeriod',
              'Invoice', 'AwardDeliverable', 'Subaward', 'CostShare', 'FinanceCode', 'Transaction'],
    'Project': ['Award', 'Proposal', 'ProjectRole', 'ComplianceRequirement',
                'ConflictOfInterest', 'Document'],
    'Personnel': ['Organization', 'ProjectRole', 'Effort', 'ComplianceRequirement',
                  'ConflictOfInterest', 'AwardDeliverable', 'Modification', 'ContactDetails'],
    // ... more mappings for other tables
};
```

**Interaction Flow:**
1. User clicks any table (node)
2. `expandNode()` function looks up related tables in `tableHierarchy`
3. Adds new nodes and edges to the graph
4. Re-runs Cola layout to position new tables smoothly
5. Highlights new tables with green border for 2 seconds
6. Updates sidebar with clicked table's details and connections

**Visual Feedback:**
- New nodes get temporary `.new-node` class with green border
- Selected node gets purple border (`border-color: #667eea`)
- Connected edges highlighted when table is selected
- Sidebar shows clickable connections list

### Interactive Features

**Control Buttons:**
- **Fit to Screen:** Zoom/pan to show all currently visible tables
- **+ Expand One Level:** Expand all currently visible tables simultaneously
- **⊖ Collapse All:** Reset view to 4 core tables
- **Show All Tables:** Reveal entire schema (all 29 tables, 72 relationships)

**Sidebar Information:**
1. **Getting Started Panel:**
   - Explains the 4 core tables
   - Provides usage tips

2. **Table Details Panel** (appears when table clicked):
   - Table name and category
   - Clickable connections list (click to navigate to related table)
   - Full column list with types and constraints (PK, Required badges)

3. **Legend Panel:**
   - Color-coded categories
   - Always visible for reference

**Node Interaction:**
- **Click:** Expand table to show related tables + show details in sidebar
- **Click connection in sidebar:** Navigate to and expand that related table
- **Click background:** Clear selection and hide table details
- **Mouse wheel:** Zoom in/out

### Data Generation Script

**Script: `scripts/parse_schema.py`**

Parses `udm_schema.sql` and generates three JSON files:

1. **schema.json:**
   - Table definitions with column metadata
   - Column types, constraints (PK, NOT NULL, UNIQUE, AUTO_INCREMENT)

2. **relationships.json:**
   - All foreign key relationships extracted via regex
   - Format: `{from_table, from_column, to_table, to_column}`

3. **cytoscape-data.json:**
   - Nodes: Tables with category, color, columns
   - Edges: Relationships with labels
   - Categories: core, financial, proposal, compliance, supporting
   - Color-coded by category for visual grouping

**Key Implementation Detail:**
The regex pattern handles multi-line CONSTRAINT...FOREIGN KEY statements:
```python
fk_pattern = r'CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s*(\w+)\s*\((\w+)\)'
for fk_match in re.finditer(fk_pattern, table_body, re.IGNORECASE | re.DOTALL):
    relationships.append({
        'from_table': table_name,
        'from_column': fk_match.group(1),
        'to_table': fk_match.group(2),
        'to_column': fk_match.group(3)
    })
```

### Visual Design Implementation

**Color Scheme:**
- Organization: `#4A90E2` (Blue) - The hub
- Award/Financial: `#7ED321` (Green) - Money flow
- Project/Proposal: `#BD10E0` (Purple) - Research work
- Personnel: `#F5A623` (Orange) - People
- Compliance: `#D0021B` (Red) - Risk/oversight
- Supporting: `#D8D8D8` (Gray) - Reference data

**Node Styling:**
- Core tables: 90px diameter, bold font
- Regular tables: 70px diameter
- 3px white border for contrast
- Selected: 5px purple border
- New: 5px green border (temporary)

**Edge Styling:**
- 2px gray lines with triangle arrows
- Bezier curves for smooth connections
- Highlighted: 3px purple when connected to selected node
- 60% opacity by default, 100% when highlighted

**Layout Algorithm:**
- **Cola (Constraint-Based Layout):** Force-directed with constraints
- Node spacing: 40-50px
- Edge length: 120-150px
- Animate: true (smooth transitions)
- Max simulation time: 1.5-3 seconds depending on node count

### Responsive Design
- **Desktop:** Full interactive graph with sidebar
- **Tablet/Mobile (< 768px):** Flexbox column layout
  - Graph on top
  - Sidebar below (max-height: 40vh, scrollable)

### Running Locally

To view the dashboard on your local machine:

1. **Start a local web server** (required due to CORS restrictions):
   ```bash
   cd docs
   python3 -m http.server 8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Alternative (VS Code):**
   - Install "Live Server" extension
   - Right-click `docs/index.html` → "Open with Live Server"

**Note:** Opening `index.html` directly with `file://` protocol will fail due to browser CORS security restrictions on fetch() requests. A web server is required to load the JSON data files.

---

## Future Enhancements

### Analytics Layer
- **Financial dashboards:** Spending trends, burn rate
- **Effort analytics:** Overcommitment detection
- **Compliance monitoring:** Expiration tracking, overdue reports
- **Portfolio view:** All awards/projects at a glance

### AI/ML Features
- **Predictive:** Forecast award closeout dates, spending patterns
- **Anomaly detection:** Flag unusual transactions
- **Recommendations:** Suggest optimal indirect rate usage

### Collaboration
- **Annotations:** Comments on nodes/edges
- **Sharing:** Save and share custom views
- **Permissions:** Role-based access control (PI sees their projects, OSP sees all)

### Integration
- **Export:** Generate reports, proposals, budgets from graph
- **Import:** Bulk upload from Excel, other systems
- **Sync:** Two-way sync with external systems (financial, HR)
