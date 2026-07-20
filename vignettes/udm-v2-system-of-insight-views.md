# UDM System of Insight: Sample Views

The System of Insight is the layer of derived data built on top of the UDM System of Record. Findings, dashboards, reports, computed aggregates, and any other projection of UDM data live here, materialized as views in the query engine rather than as physical tables in UDM.

This document shows sample views to illustrate what the Insight layer looks like in practice. The views are not part of the UDM specification; they are reference examples. Adopters write their own views to serve their specific reporting, review-engine, and dashboard needs, conforming to the patterns documented in `vignettes/udm-v2-patterns.md` where relevant (e.g., the "Automated finding shape" pattern for review-engine views).

---

## Conventions for examples

- Examples are written in SQL-flavored pseudocode portable to any query engine supporting SQL (Trino, Postgres, DuckDB, etc.). The UDM specification itself is engine-agnostic; the choice of SQL syntax here is illustrative.
- Table and column names follow the UDM v2 convention (PascalCase with underscores).
- Views are named with a `v_` prefix to distinguish them from UDM source tables.
- Time-travel syntax assumes the storage layer supports it (`FOR VERSION AS OF`, `FOR TIMESTAMP AS OF`, or equivalent). Engines without time-travel can implement the same views against current state only.

---

## Sample 1: PI portfolio

**Purpose:** For each Personnel record who currently serves as PI on at least one Award, list their active awards with title, sponsor, period, and current funded amount.

```sql
CREATE VIEW v_pi_portfolio AS
SELECT
  p.Personnel_ID,
  p.First_Name,
  p.Last_Name,
  a.Award_ID,
  a.Award_Title,
  org.Organization_Name AS Sponsor_Name,
  a.Original_Start_Date,
  a.Current_End_Date,
  a.Current_Total_Funded,
  ar.Role_Value_ID,
  ar.FTE_Percent
FROM Personnel p
JOIN AwardRole ar ON ar.Personnel_ID = p.Personnel_ID
JOIN Award a ON a.Award_ID = ar.Award_ID
JOIN Organization org ON org.Organization_ID = a.Sponsor_Organization_ID
JOIN AllowedValues av ON av.AllowedValue_ID = ar.Role_Value_ID
WHERE av.Value_Code IN ('Primary_Investigator', 'Contact_PI', 'Multi_PI')
  AND a.Award_Status NOT IN ('Closed', 'Terminated')
  AND (ar.End_Date IS NULL OR ar.End_Date > CURRENT_DATE);
```

Consumed by: PI dashboards, departmental portfolio reports, F&A allocation summaries.

---

## Sample 2: Compliance coverage status per Award

**Purpose:** For each active Award, project whether it is currently covered by an active ComplianceRequirement of each required regime (IRB / IACUC / IBC), based on the Award's regulatory flags and existing ComplianceCoverage rows.

```sql
CREATE VIEW v_award_compliance_status AS
WITH active_coverage AS (
  SELECT
    cc.Award_ID,
    cr.Requirement_Type,
    cr.Compliance_Number,
    cr.Expiration_Date,
    cr.Requirement_Status
  FROM ComplianceCoverage cc
  JOIN ComplianceRequirement cr ON cr.ComplianceRequirement_ID = cc.ComplianceRequirement_ID
  WHERE cc.Coverage_End_Date IS NULL
    AND cr.Requirement_Status = 'Approved'
    AND (cr.Expiration_Date IS NULL OR cr.Expiration_Date > CURRENT_DATE)
)
SELECT
  a.Award_ID,
  a.Award_Title,
  MAX(CASE WHEN ac.Requirement_Type = 'IRB' THEN 'Covered' ELSE 'Missing' END) AS IRB_Status,
  MAX(CASE WHEN ac.Requirement_Type = 'IACUC' THEN 'Covered' ELSE 'Missing' END) AS IACUC_Status,
  MAX(CASE WHEN ac.Requirement_Type = 'IBC' THEN 'Covered' ELSE 'Missing' END) AS IBC_Status
FROM Award a
LEFT JOIN active_coverage ac ON ac.Award_ID = a.Award_ID
WHERE a.Award_Status NOT IN ('Closed', 'Terminated')
GROUP BY a.Award_ID, a.Award_Title;
```

Consumed by: compliance officer dashboards, pre-spending gate checks, award-activation readiness reports.

---

## Sample 3: Personnel eligibility findings (review engine)

**Purpose:** Produce a `v_personnel_eligibility_findings` view that conforms to the "Automated finding shape" pattern. Engine logic encodes APM 45.22 PI/Co-PI eligibility rules and accounts for any active PolicyException rows.

```sql
CREATE VIEW v_personnel_eligibility_findings AS
WITH role_eligibility AS (
  SELECT
    ar.AwardRole_ID,
    ar.Personnel_ID,
    ar.Award_ID,
    p.Appointment_Type,
    av.Value_Code AS Role_Code,
    CASE
      WHEN av.Value_Code IN ('Primary_Investigator', 'Contact_PI', 'Multi_PI')
       AND p.Appointment_Type NOT IN ('TENURED', 'TENURE_TRACK', 'RESEARCH_FACULTY')
      THEN 'apm_category_ineligible'
      ELSE NULL
    END AS Check_Code
  FROM AwardRole ar
  JOIN Personnel p ON p.Personnel_ID = ar.Personnel_ID
  JOIN AllowedValues av ON av.AllowedValue_ID = ar.Role_Value_ID
),
active_exceptions AS (
  SELECT
    Personnel_ID,
    Award_ID,
    Policy_Rule_Code
  FROM PolicyException
  WHERE Status = 'Approved'
    AND Policy_Rule_Code IN ('PI_Eligibility_Appointment_Type', 'Co_PI_Eligibility')
    AND (Effective_End_Date IS NULL OR Effective_End_Date > CURRENT_DATE)
)
SELECT
  re.AwardRole_ID AS Subject_ID,
  'AwardRole' AS Subject_Type,
  'personnel_eligibility' AS Check_Category,
  re.Check_Code,
  CASE
    WHEN ae.Personnel_ID IS NOT NULL THEN 'pass'
    ELSE 'fail'
  END AS Severity,
  CASE
    WHEN ae.Personnel_ID IS NOT NULL
    THEN 'Eligibility waived by active PolicyException'
    ELSE 'PI appointment type does not satisfy APM 45.22'
  END AS Message,
  false AS Is_AI_Generated,
  'eligibility_engine_v1' AS Engine_Identifier,
  CURRENT_TIMESTAMP AS Generated_At
FROM role_eligibility re
LEFT JOIN active_exceptions ae
  ON ae.Personnel_ID = re.Personnel_ID
 AND (ae.Award_ID = re.Award_ID OR ae.Award_ID IS NULL)
WHERE re.Check_Code IS NOT NULL;
```

Consumed by: personnel review workspace in the front-end, OSP pre-award screening, automated gate checks before approval routing.

---

## Sample 4: Award current state (canonical derivation)

**Purpose:** Project the current funded amount and current end date for each Award from the cumulative Modification chain. UDM v2 already exposes `Award.Current_Total_Funded` and `Award.Current_End_Date` as derived columns; this view shows the engine logic that maintains them and serves as the source of truth when those columns are not yet populated or when verifying their consistency.

```sql
CREATE VIEW v_award_current_state AS
SELECT
  a.Award_ID,
  a.Award_Title,
  a.Original_Total_Funded,
  COALESCE(
    a.Original_Total_Funded + SUM(m.Funding_Change_Amount) FILTER (WHERE m.Approval_Status = 'Approved'),
    a.Original_Total_Funded
  ) AS Calculated_Current_Total_Funded,
  COALESCE(
    MAX(m.Approved_End_Date) FILTER (WHERE m.Approval_Status = 'Approved' AND m.Event_Type_Value_ID = (SELECT AllowedValue_ID FROM AllowedValues WHERE Value_Code = 'NCE')),
    a.Original_End_Date
  ) AS Calculated_Current_End_Date,
  a.Current_Total_Funded AS Stored_Current_Total_Funded,
  a.Current_End_Date AS Stored_Current_End_Date
FROM Award a
LEFT JOIN Modification m ON m.Award_ID = a.Award_ID
GROUP BY a.Award_ID, a.Award_Title, a.Original_Total_Funded, a.Original_End_Date, a.Current_Total_Funded, a.Current_End_Date;
```

Consumed by: financial reconciliation, audit consistency checks, dashboards that want to surface mismatch between calculated and stored current state.

---

## Sample 5: Cost-share status

**Purpose:** For each CostShare commitment on an Award, project committed amount, amount met to date (from Transactions tagged as cost-share contributions), and remaining gap.

```sql
CREATE VIEW v_cost_share_status AS
SELECT
  cs.CostShare_ID,
  cs.Award_ID,
  a.Award_Title,
  cs.Lifecycle_Stage,
  cs.Committed_Amount,
  COALESCE(SUM(t.Amount) FILTER (WHERE t.Transaction_Type = 'cost_share_contribution'), 0) AS Amount_Met,
  cs.Committed_Amount - COALESCE(SUM(t.Amount) FILTER (WHERE t.Transaction_Type = 'cost_share_contribution'), 0) AS Amount_Remaining,
  cs.Committing_Organization_ID
FROM CostShare cs
JOIN Award a ON a.Award_ID = cs.Award_ID
LEFT JOIN Transaction t ON t.Award_ID = cs.Award_ID
GROUP BY cs.CostShare_ID, cs.Award_ID, a.Award_Title, cs.Lifecycle_Stage, cs.Committed_Amount, cs.Committing_Organization_ID;
```

Consumed by: cost-share monitoring dashboards, federal reporting, sponsor close-out reconciliation.

---

## Sample 6: Active deadlines

**Purpose:** All open Deadline rows attached to any UDM entity, ordered by due date, with the subject entity inlined for display.

```sql
CREATE VIEW v_active_deadlines AS
SELECT
  d.Deadline_ID,
  d.Deadline_Type_Value_ID,
  d.Related_Entity_Type,
  d.Related_Entity_ID,
  d.Description,
  d.Due_Date,
  d.Deadline_Status,
  d.Owner_Personnel_ID,
  CASE d.Related_Entity_Type
    WHEN 'Proposal' THEN (SELECT Proposal_Title FROM Proposal WHERE Proposal_ID = d.Related_Entity_ID)
    WHEN 'Award' THEN (SELECT Award_Title FROM Award WHERE Award_ID = d.Related_Entity_ID)
    WHEN 'ComplianceRequirement' THEN (SELECT Compliance_Number FROM ComplianceRequirement WHERE ComplianceRequirement_ID = d.Related_Entity_ID)
    WHEN 'Report' THEN (SELECT Report_Type FROM Report WHERE Report_ID = d.Related_Entity_ID)
    ELSE NULL
  END AS Subject_Display
FROM Deadline d
WHERE d.Deadline_Status = 'Open'
  AND d.Due_Date IS NOT NULL
ORDER BY d.Due_Date ASC;
```

Consumed by: my-deadlines page in the front-end, OSP overdue-report cron job, sponsor reporting reminders.

---

## Sample 7: Point-in-time Award state (time-travel view)

**Purpose:** Project the state of an Award and its key derived attributes (current_total_funded, current_end_date, current_PI) as of an arbitrary past timestamp, using the storage-layer history. Used for audit reconstruction, compliance attestation, "what did we believe at time T," and what-if analysis.

This view requires a System of Record implementation that supports time-travel queries (Iceberg snapshots, Dolt commit history, Postgres temporal tables, or equivalent). Syntax shown is Iceberg-flavored; equivalents exist in other engines.

```sql
CREATE VIEW v_award_state_at AS
SELECT
  a.Award_ID,
  a.Award_Title,
  a.Current_Total_Funded,
  a.Current_End_Date,
  a.Current_PI_Personnel_ID,
  a.Award_Status,
  '$AS_OF_TIMESTAMP' AS Snapshot_Timestamp
FROM Award FOR TIMESTAMP AS OF '$AS_OF_TIMESTAMP' a;

-- Usage:
-- SELECT * FROM v_award_state_at
-- WHERE Award_ID = 'AWARD-001' AND Snapshot_Timestamp = '2026-01-01 00:00:00';
```

Consumed by: audit reconstruction queries ("what did we report to NIH on the RPPR"), compliance attestation ("was IRB coverage in place when subject enrollment happened"), what-if reports.

---

## Sample 8: Submission pipeline

**Purpose:** For each Proposal currently in the internal approval pipeline, show the current pending approval step, the assignee, and how long the proposal has been at that step.

```sql
CREATE VIEW v_submission_pipeline AS
WITH current_step AS (
  SELECT
    pa.Proposal_ID,
    pa.Step_Order,
    pa.Step_Name,
    pa.Assignee_Personnel_ID,
    pa.Action_Date AS Assigned_Date,
    pa.Step_Status,
    ROW_NUMBER() OVER (PARTITION BY pa.Proposal_ID ORDER BY pa.Step_Order ASC) AS rn
  FROM ProposalApproval pa
  WHERE pa.Step_Status IN ('Pending', 'In_Review', 'Returned')
)
SELECT
  p.Proposal_ID,
  p.Proposal_Number,
  p.Proposal_Title,
  cs.Step_Name AS Current_Step,
  cs.Assignee_Personnel_ID,
  cs.Step_Status,
  cs.Assigned_Date,
  CURRENT_DATE - cs.Assigned_Date AS Days_At_Current_Step,
  p.Internal_Approval_Status
FROM Proposal p
JOIN current_step cs ON cs.Proposal_ID = p.Proposal_ID AND cs.rn = 1
WHERE p.Internal_Approval_Status = 'In Review';
```

Consumed by: OSP pipeline dashboards, bottleneck analysis, reviewer workload reports, automated reminders for stalled proposals.

---

## Sample 9: Proposal requirement satisfaction

**Purpose:** For each Proposal, project which RFA-derived requirements are met, which are missing, and which need attention. Composes RFARequirement (the canonical list of what's required by the funding opportunity), Document (whether the required attachment is present), and other UDM data that requirements can be evaluated against. This is the derived half of what an application might present as a "proposal preparation checklist"; combined with `Action` rows of `Action_Type = Checklist_Item` (manual reviewer work), the application assembles a unified checklist UI.

```sql
CREATE VIEW v_proposal_requirement_satisfaction AS
WITH proposal_docs AS (
  SELECT
    d.Related_Entity_ID AS Proposal_ID,
    av.Value_Code AS Document_Type_Code,
    COUNT(*) AS Document_Count
  FROM Document d
  JOIN AllowedValues av ON av.AllowedValue_ID = d.Document_Type_Value_ID
  WHERE d.Related_Entity_Type = 'Proposal'
  GROUP BY d.Related_Entity_ID, av.Value_Code
),
proposal_compliance AS (
  SELECT
    cc.Related_Entity_ID AS Proposal_ID,
    cr.Requirement_Type AS Regime
  FROM ComplianceCoverage cc
  JOIN ComplianceRequirement cr ON cr.ComplianceRequirement_ID = cc.ComplianceRequirement_ID
  WHERE cc.Related_Entity_Type = 'Proposal'
    AND cr.Requirement_Status = 'Approved'
    AND (cr.Expiration_Date IS NULL OR cr.Expiration_Date > CURRENT_DATE)
)
SELECT
  p.Proposal_ID,
  p.Proposal_Number,
  r.RFARequirement_ID,
  r.Requirement_Category,
  r.Requirement_Code,
  r.Requirement_Label,
  r.Is_Required,
  r.Sort_Order,
  CASE
    WHEN r.Requirement_Category = 'DOCUMENT' THEN
      CASE WHEN pd.Document_Count > 0 THEN 'Met' ELSE 'Not_Met' END
    WHEN r.Requirement_Category = 'COMPLIANCE' THEN
      CASE WHEN pc.Proposal_ID IS NOT NULL THEN 'Met' ELSE 'Not_Met' END
    ELSE 'Not_Evaluated'
  END AS Satisfaction_Status,
  CASE
    WHEN r.Requirement_Category = 'DOCUMENT' AND pd.Document_Count > 0
      THEN 'Document present (' || pd.Document_Count || ')'
    WHEN r.Requirement_Category = 'DOCUMENT' AND pd.Document_Count IS NULL
      THEN 'Required document not found'
    WHEN r.Requirement_Category = 'COMPLIANCE' AND pc.Proposal_ID IS NOT NULL
      THEN 'Active compliance approval (' || pc.Regime || ')'
    WHEN r.Requirement_Category = 'COMPLIANCE' AND pc.Proposal_ID IS NULL
      THEN 'Required compliance approval not in place'
    ELSE NULL
  END AS Detail
FROM Proposal p
JOIN RFARequirement r ON r.RFA_ID = p.RFA_ID
LEFT JOIN proposal_docs pd ON pd.Proposal_ID = p.Proposal_ID AND pd.Document_Type_Code = r.Requirement_Code
LEFT JOIN proposal_compliance pc ON pc.Proposal_ID = p.Proposal_ID
WHERE p.Internal_Approval_Status NOT IN ('Withdrawn', 'Rejected')
ORDER BY p.Proposal_ID, r.Sort_Order;
```

Consumed by: proposal preparation dashboards, submission readiness gates, OSP completeness reviews, the derived half of the unified checklist UI.

The view evaluates DOCUMENT-category and COMPLIANCE-category requirements directly. Additional categories (ELIGIBILITY, BUDGET_CONSTRAINT, etc.) are added as `CASE` branches following the same pattern, each composing the appropriate UDM source data.

A "block setup transition" workflow reads this view: `SELECT 1 FROM v_proposal_requirement_satisfaction WHERE Proposal_ID = ? AND Is_Required = true AND Satisfaction_Status = 'Not_Met'`. Non-empty result → block transition. The blocking logic lives in application workflow code; the view provides the data.

---

## Notes

- These views are illustrative. Adopters write the views their specific reporting and engine needs require, conforming to the patterns where applicable.
- Materialized views (where the engine supports them) are acceptable when query latency requires it; the source-of-truth still lives in UDM and the materialized view is refreshed.
- Engine logic in view definitions can be version-controlled and reviewed like any code artifact. This is the recommended location for review-engine logic; do not persist findings as physical tables.
- Some views combine UDM source tables with patterns documented in `vignettes/udm-v2-patterns.md` (notably the automated-finding view in Sample 3). Aligning view output to the documented shapes makes the view's output portable across consumers.
