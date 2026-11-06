# UDM System of Insight: Sample Views

The System of Insight is the layer of derived data built on top of the UDM System of Record. Findings, dashboards, reports, computed aggregates, and any other projection of UDM data live here, materialized as views in the query engine rather than as physical tables in UDM.

This document shows sample views to illustrate what the Insight layer looks like in practice. The views are not part of the UDM specification; they are reference examples. Adopters write their own views to serve their specific reporting, review-engine, and dashboard needs, conforming to the patterns documented in `vignettes/udm-patterns.md` where relevant (e.g., the "Automated finding shape" pattern for review-engine views).

---

## Conventions for examples

- Examples are written in SQL-flavored pseudocode portable to any query engine supporting SQL (Trino, Postgres, DuckDB, etc.). The UDM specification itself is engine-agnostic; the choice of SQL syntax here is illustrative.
- Table and column names follow the UDM convention (PascalCase with underscores).
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
JOIN TeamRole ar ON ar.Personnel_ID = p.Personnel_ID
JOIN Award a ON a.Award_ID = ar.Award_ID
JOIN Organization org ON org.Organization_ID = a.Sponsor_Organization_ID
JOIN AllowedValues av ON av.AllowedValue_ID = ar.Role_Value_ID
WHERE av.Value_Code IN ('Primary_Investigator', 'Contact_PI', 'Multi_PI')
  AND a.Award_Status NOT IN ('Closed', 'Adjusting', 'Terminated')
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
WHERE a.Award_Status NOT IN ('Closed', 'Adjusting', 'Terminated')
GROUP BY a.Award_ID, a.Award_Title;
```

Consumed by: compliance officer dashboards, pre-spending gate checks, award-activation readiness reports.

---

## Sample 3: Personnel eligibility findings (review engine)

**Purpose:** Produce a `v_personnel_eligibility_findings` view that conforms to the "Automated finding shape" pattern. Engine logic encodes institutional PI/Co-PI eligibility policy and accounts for any active PolicyException rows.

```sql
CREATE VIEW v_personnel_eligibility_findings AS
WITH role_eligibility AS (
  SELECT
    ar.TeamRole_ID,
    ar.Personnel_ID,
    ar.Award_ID,
    hr.Appointment_Type,
    av.Value_Code AS Role_Code,
    CASE
      WHEN av.Value_Code IN ('PI', 'Multi_PI')
       AND hr.Appointment_Type NOT IN ('TENURED', 'TENURE_TRACK', 'RESEARCH_FACULTY')
      THEN 'apm_category_ineligible'
      ELSE NULL
    END AS Check_Code
  FROM TeamRole ar
  JOIN Personnel p ON p.Personnel_ID = ar.Personnel_ID
  -- Appointment type is HR data outside the UDM, read from the HR system through integration
  JOIN hris_appointment hr ON hr.Personnel_ID = p.Personnel_ID
  JOIN AllowedValues av ON av.AllowedValue_ID = ar.Role_Value_ID
),
active_exceptions AS (
  SELECT
    Personnel_ID,
    Award_ID,
    Policy_Rule_Code
  FROM PolicyException
  WHERE Exception_Status = 'Approved'
    AND Policy_Rule_Code IN ('PI_Eligibility_Appointment_Type', 'Co_PI_Eligibility')
    AND (Effective_End_Date IS NULL OR Effective_End_Date > CURRENT_DATE)
)
SELECT
  re.TeamRole_ID AS Subject_ID,
  'TeamRole' AS Subject_Type,
  'personnel_eligibility' AS Check_Category,
  re.Check_Code,
  CASE
    WHEN ae.Personnel_ID IS NOT NULL THEN 'pass'
    ELSE 'fail'
  END AS Severity,
  CASE
    WHEN ae.Personnel_ID IS NOT NULL
    THEN 'Eligibility waived by active PolicyException'
    ELSE 'PI appointment type does not satisfy institutional eligibility policy'
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

**Purpose:** Project the current funded amount and current end date for each Award from the cumulative Modification chain. The UDM already exposes `Award.Current_Total_Funded` and `Award.Current_End_Date` as derived columns; this view shows the engine logic that maintains them and serves as the source of truth when those columns are not yet populated or when verifying their consistency.

```sql
CREATE VIEW v_award_current_state AS
SELECT
  a.Award_ID,
  a.Award_Title,
  a.Original_Total_Funded,
  COALESCE(
    a.Original_Total_Funded + SUM(m.Funding_Change_Amount) FILTER (WHERE m.Approval_Status IN ('Approved', 'Not_Required')),
    a.Original_Total_Funded
  ) AS Calculated_Current_Total_Funded,
  COALESCE(
    MAX_BY(m.New_End_Date, m.Effective_Date) FILTER (WHERE m.Approval_Status IN ('Approved', 'Not_Required') AND m.New_End_Date IS NOT NULL),
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
  cs.Amount_Committed,
  COALESCE(SUM(t.Transaction_Amount), 0) AS Amount_Met,
  cs.Amount_Committed - COALESCE(SUM(t.Transaction_Amount), 0) AS Amount_Remaining
FROM CostShare cs
JOIN Award a ON a.Award_ID = cs.Award_ID
LEFT JOIN Transaction t ON t.CostShare_ID = cs.CostShare_ID
GROUP BY cs.CostShare_ID, cs.Award_ID, a.Award_Title, cs.Lifecycle_Stage, cs.Amount_Committed;
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
  d.Responsible_Personnel_ID,
  CASE d.Related_Entity_Type
    WHEN 'Proposal' THEN (SELECT Proposal_Title FROM Proposal WHERE Proposal_ID = d.Related_Entity_ID)
    WHEN 'Award' THEN (SELECT Award_Title FROM Award WHERE Award_ID = d.Related_Entity_ID)
    WHEN 'ComplianceRequirement' THEN (SELECT Compliance_Number FROM ComplianceRequirement WHERE ComplianceRequirement_ID = d.Related_Entity_ID)
    WHEN 'Deliverable' THEN (SELECT Description FROM Deliverable WHERE Deliverable_ID = d.Related_Entity_ID)
    ELSE NULL
  END AS Subject_Display
FROM Deadline d
WHERE d.Deadline_Status IN ('Open', 'Approaching', 'Overdue')
  AND d.Due_Date IS NOT NULL
ORDER BY d.Due_Date ASC;
```

Consumed by: my-deadlines page in the front-end, overdue-deliverable reminders, sponsor reporting reminders.

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
WITH current_round AS (
  SELECT Related_Entity_ID AS Proposal_ID, MAX(Approval_Round) AS Approval_Round
  FROM Approval
  WHERE Related_Entity_Type = 'Proposal'
  GROUP BY Related_Entity_ID
),
open_step AS (
  SELECT
    a.Related_Entity_ID AS Proposal_ID,
    a.Approval_Step_Order,
    a.Step_Type_Value_ID,
    a.Assigned_Personnel_ID,
    a.Created_At AS Assigned_At,
    ROW_NUMBER() OVER (PARTITION BY a.Related_Entity_ID ORDER BY a.Approval_Step_Order ASC, a.Created_At ASC) AS rn
  FROM Approval a
  JOIN current_round cr ON cr.Proposal_ID = a.Related_Entity_ID AND cr.Approval_Round = a.Approval_Round
  WHERE a.Related_Entity_Type = 'Proposal' AND a.Approval_Status = 'Pending'
)
SELECT
  p.Proposal_ID,
  p.Proposal_Number,
  p.Proposal_Title,
  v.Value_Code AS Current_Step,
  os.Assigned_Personnel_ID,
  os.Assigned_At,
  CURRENT_DATE - CAST(os.Assigned_At AS DATE) AS Days_At_Current_Step,
  p.Internal_Approval_Status
FROM Proposal p
JOIN open_step os ON os.Proposal_ID = p.Proposal_ID AND os.rn = 1
JOIN AllowedValues v ON v.AllowedValue_ID = os.Step_Type_Value_ID
WHERE p.Internal_Approval_Status = 'In_Review';
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
    a.Proposal_ID,
    cr.Requirement_Type AS Regime
  FROM ComplianceCoverage cc
  JOIN Award a ON a.Award_ID = cc.Award_ID
  JOIN ComplianceRequirement cr ON cr.ComplianceRequirement_ID = cc.ComplianceRequirement_ID
  WHERE cr.Requirement_Status = 'Approved'
    AND (cr.Expiration_Date IS NULL OR cr.Expiration_Date > CURRENT_DATE)
)
SELECT
  p.Proposal_ID,
  p.Proposal_Number,
  r.RFARequirement_ID,
  r.Requirement_Category,
  r.Requirement_Code,
  r.Requirement_Text,
  CASE
    WHEN r.Requirement_Category = 'Document' THEN
      CASE WHEN pd.Document_Count > 0 THEN 'Met' ELSE 'Not_Met' END
    WHEN r.Requirement_Category = 'Compliance' THEN
      CASE WHEN pc.Proposal_ID IS NOT NULL THEN 'Met' ELSE 'Not_Met' END
    ELSE 'Not_Evaluated'
  END AS Satisfaction_Status,
  CASE
    WHEN r.Requirement_Category = 'Document' AND pd.Document_Count > 0
      THEN 'Document present (' || pd.Document_Count || ')'
    WHEN r.Requirement_Category = 'Document' AND pd.Document_Count IS NULL
      THEN 'Required document not found'
    WHEN r.Requirement_Category = 'Compliance' AND pc.Proposal_ID IS NOT NULL
      THEN 'Active compliance approval (' || pc.Regime || ')'
    WHEN r.Requirement_Category = 'Compliance' AND pc.Proposal_ID IS NULL
      THEN 'Required compliance approval not in place'
    ELSE NULL
  END AS Detail
FROM Proposal p
JOIN RFARequirement r ON r.RFA_ID = p.RFA_ID
LEFT JOIN proposal_docs pd ON pd.Proposal_ID = p.Proposal_ID AND pd.Document_Type_Code = r.Requirement_Code
LEFT JOIN proposal_compliance pc ON pc.Proposal_ID = p.Proposal_ID
WHERE p.Internal_Approval_Status <> 'Rejected'
  AND p.Decision_Status <> 'Withdrawn'
ORDER BY p.Proposal_ID, r.Requirement_Code;
```

Consumed by: proposal preparation dashboards, submission readiness gates, OSP completeness reviews, the derived half of the unified checklist UI.

Compliance coverage attaches to an Award or Subaward, not a Proposal, so a Compliance requirement shows as Not_Met until the proposal has an award with coverage. The view evaluates Document-category and Compliance-category requirements directly. Additional categories (Eligibility, Budget, and others) are added as `CASE` branches following the same pattern, each composing the appropriate UDM source data.

A "block setup transition" workflow reads this view: `SELECT 1 FROM v_proposal_requirement_satisfaction WHERE Proposal_ID = ? AND Is_Required = true AND Satisfaction_Status = 'Not_Met'`. Non-empty result → block transition. The blocking logic lives in application workflow code; the view provides the data.

---

## Sample 10: Award balances and burn rates

**Purpose:** Calculate the Glossary's balance and burn rate terms for each award: `Unspent balance`, `Available balance`, `Deficit`, `Burn rate`, `Committed burn rate`, and `Average monthly burn rate`. `Spent` follows the Glossary's `Spending`: expenses, plus or minus cost transfers, adjustments, and reversals. Encumbrances and cost share are not spending. Transactions on a subaward count toward its prime award.

```sql
CREATE VIEW v_award_financial_metrics AS
WITH typed_transaction AS (
  SELECT
    COALESCE(t.Award_ID, s.Prime_Award_ID) AS Award_ID,
    COALESCE(av.Canonical_Value_Code, av.Value_Code) AS Type_Code,
    t.Transaction_Amount
  FROM Transaction t
  JOIN AllowedValues av ON av.AllowedValue_ID = t.Transaction_Type_Value_ID
  LEFT JOIN Subaward s ON s.Subaward_ID = t.Subaward_ID
  WHERE t.Is_Active = true
),
totals AS (
  SELECT
    Award_ID,
    SUM(CASE WHEN Type_Code IN ('Expense', 'Cost_Transfer_In', 'Cost_Transfer_Out', 'Adjustment', 'Reversal')
             THEN Transaction_Amount ELSE 0 END) AS Spent,
    SUM(CASE WHEN Type_Code = 'Encumbrance' THEN Transaction_Amount ELSE 0 END) AS Encumbered
  FROM typed_transaction
  GROUP BY Award_ID
),
measures AS (
  SELECT
    a.Award_ID,
    a.Award_Number,
    a.Current_Total_Funded AS Funding,
    COALESCE(x.Spent, 0) AS Spent,
    COALESCE(x.Encumbered, 0) AS Encumbered,
    LEAST(GREATEST(DATE_DIFF('day', a.Original_Start_Date, CURRENT_DATE), 0),
          DATE_DIFF('day', a.Original_Start_Date, a.Current_End_Date)) AS Days_Elapsed,
    DATE_DIFF('day', a.Original_Start_Date, a.Current_End_Date) AS Days_Total
  FROM Award a
  LEFT JOIN totals x ON x.Award_ID = a.Award_ID
  WHERE a.Is_Active = true
)
SELECT
  Award_ID,
  Award_Number,
  Funding,
  Spent,
  Encumbered,
  Funding - Spent AS Unspent_Balance,
  Funding - Spent - Encumbered AS Available_Balance,
  Spent > Funding AS Is_Deficit,
  (Spent * 1.0 / NULLIF(Funding, 0)) / NULLIF(Days_Elapsed * 1.0 / NULLIF(Days_Total, 0), 0) AS Burn_Rate,
  ((Spent + Encumbered) * 1.0 / NULLIF(Funding, 0)) / NULLIF(Days_Elapsed * 1.0 / NULLIF(Days_Total, 0), 0) AS Committed_Burn_Rate,
  Spent * 1.0 / NULLIF(Days_Elapsed / 30.4375, 0) AS Average_Monthly_Burn_Rate
FROM measures;
```

Consumed by: post-award dashboards and monitoring. What counts as a high burn rate is the institution's call.

---

## Sample 11: Funding, success, and award rates

**Purpose:** Calculate the Glossary's `Funding rate`, `Success rate`, and `Award rate`. Each follows a sponsor's published method at the level the UDM can support, so check the sponsor's definition before comparing with its published figures. Filter by `Decision_Date` for the period you report.

```sql
CREATE VIEW v_proposal_outcomes AS
SELECT
  p.Proposal_ID,
  COALESCE(p.Originating_Proposal_ID, p.Proposal_ID) AS Application_Chain_ID,
  COALESCE(av.Canonical_Value_Code, av.Value_Code) AS Proposal_Type,
  p.Decision_Status,
  p.Decision_Date
FROM Proposal p
LEFT JOIN AllowedValues av ON av.AllowedValue_ID = p.Proposal_Type_Value_ID
WHERE p.Decision_Status IN ('Awarded', 'Declined')
  AND p.Is_Active = true;

-- Funding rate (NSF): new, competitively reviewed proposals with a final decision
SELECT SUM(CASE WHEN Decision_Status = 'Awarded' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS Funding_Rate
FROM v_proposal_outcomes
WHERE Proposal_Type IN ('New', 'Renewal', 'Resubmission');

-- Award rate (NIH): every application counted separately
SELECT SUM(CASE WHEN Decision_Status = 'Awarded' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS Award_Rate
FROM v_proposal_outcomes;

-- Success rate (NIH): an application and its resubmissions in one period count once
SELECT SUM(Was_Funded) * 1.0 / COUNT(*) AS Success_Rate
FROM (
  SELECT Application_Chain_ID, MAX(CASE WHEN Decision_Status = 'Awarded' THEN 1 ELSE 0 END) AS Was_Funded
  FROM v_proposal_outcomes
  GROUP BY Application_Chain_ID
) chains;
```

Over the same proposals, the funding and award rate queries differ only in the types they include. NIH and NSF also apply rules the UDM doesn't hold, such as NIH's funded carryovers and NSF's exclusion of preliminary proposals, contracts, and supplements.

---

## Sample 12: Award dollars and new awards

**Purpose:** Calculate the Glossary's `Award dollars`, `New award`, and `Renewal`. Award dollars count money when it is obligated: the initial funding, plus each Approved or Not_Required modification's change, which can be negative. Filter by `Funding_Date` for the period you report.

```sql
CREATE VIEW v_award_funding_events AS
SELECT a.Award_ID, a.Original_Start_Date AS Funding_Date, a.Original_Total_Funded AS Amount, 'Initial' AS Event
FROM Award a
WHERE a.Is_Active = true
UNION ALL
SELECT m.Award_ID, m.Effective_Date, m.Funding_Change_Amount, 'Modification'
FROM Modification m
WHERE m.Award_ID IS NOT NULL
  AND m.Funding_Change_Amount IS NOT NULL
  AND m.Approval_Status IN ('Approved', 'Not_Required')
  AND m.Is_Active = true;

-- New awards and renewals, counted separately
SELECT COALESCE(av.Canonical_Value_Code, av.Value_Code) AS Proposal_Type, COUNT(*) AS Awards
FROM Award a
JOIN Proposal p ON p.Proposal_ID = a.Proposal_ID
JOIN AllowedValues av ON av.AllowedValue_ID = p.Proposal_Type_Value_ID
WHERE COALESCE(av.Canonical_Value_Code, av.Value_Code) IN ('New', 'Renewal')
GROUP BY COALESCE(av.Canonical_Value_Code, av.Value_Code);
```

The UDM has no obligation date on `Award`, so this uses `Original_Start_Date` for the initial funding, and it can differ from the date the money was obligated. It also has no column saying an award was competed, so `Competitive award` is new awards plus renewals with any uncompeted ones removed by hand.

---

## Sample 13: Proposal and operations metrics

**Purpose:** Calculate the Glossary's `Pipeline`, `Proposal volume`, `Proposal dollars`, `Sponsor expenditures`, `Accounts receivable aging`, `Effective F&A rate`, and `Turnaround time`.

```sql
-- Pipeline: sent to a sponsor and still awaiting a final decision
CREATE VIEW v_pipeline AS
SELECT p.Proposal_ID, p.Proposal_Number, p.Total_Proposed_Budget, p.Submission_Status, p.Decision_Status
FROM Proposal p
WHERE p.Is_Active = true
  AND (p.Decision_Status IN ('Pending', 'Intent_to_Award')
       OR (p.Decision_Status = 'Unrequested' AND p.Submission_Status IN ('Submitted', 'Received', 'Validated')));

-- Proposal volume and proposal dollars: filter by Submission_Date. A proposal counts once however many attempts it took
SELECT COUNT(*) AS Proposal_Volume, SUM(p.Total_Proposed_Budget) AS Proposal_Dollars
FROM Proposal p
WHERE p.Submission_Date IS NOT NULL AND p.Is_Active = true;

-- Sponsor expenditures: filter by Transaction_Date. Includes direct and indirect costs, without encumbrances or cost share
SELECT SUM(t.Transaction_Amount) AS Sponsor_Expenditures
FROM Transaction t
JOIN AllowedValues av ON av.AllowedValue_ID = t.Transaction_Type_Value_ID
WHERE COALESCE(av.Canonical_Value_Code, av.Value_Code) IN ('Expense', 'Cost_Transfer_In', 'Cost_Transfer_Out', 'Adjustment', 'Reversal')
  AND t.Is_Active = true;

-- Accounts receivable aging: how long invoices sent to sponsors have gone unpaid
CREATE VIEW v_receivable_aging AS
SELECT pay.Payment_ID, pay.Award_ID, pay.Invoice_Number, pay.Scheduled_Amount,
       DATE_DIFF('day', pay.Submission_Date, CURRENT_DATE) AS Days_Unpaid
FROM Payment pay
WHERE pay.Payment_Direction = 'Incoming'
  AND pay.Lifecycle_Stage = 'Invoiced'
  AND pay.Payment_Status <> 'Cancelled'
  AND pay.Is_Active = true;

-- Effective F&A rate: filter by Transaction_Date. Needs Transaction.Budget_ID
SELECT SUM(CASE WHEN c.Is_Direct_Cost = false THEN t.Transaction_Amount ELSE 0 END) * 1.0
       / NULLIF(SUM(CASE WHEN c.Is_Direct_Cost = true THEN t.Transaction_Amount ELSE 0 END), 0) AS Effective_FA_Rate
FROM Transaction t
JOIN Budget b ON b.Budget_ID = t.Budget_ID
JOIN BudgetCategory c ON c.BudgetCategory_ID = b.Budget_Category_ID
JOIN AllowedValues av ON av.AllowedValue_ID = t.Transaction_Type_Value_ID
WHERE COALESCE(av.Canonical_Value_Code, av.Value_Code) IN ('Expense', 'Cost_Transfer_In', 'Cost_Transfer_Out', 'Adjustment', 'Reversal')
  AND t.Is_Active = true;

-- Turnaround time: calendar days for each finished approval step
SELECT ap.Approval_ID, ap.Related_Entity_Type, ap.Related_Entity_ID,
       DATE_DIFF('day', CAST(ap.Created_At AS DATE), ap.Action_Date) AS Turnaround_Days
FROM Approval ap
WHERE ap.Action_Date IS NOT NULL;
```

To see where an award's final reports stand during closeout, read its `Deliverable` rows. An award with no final report has no rows:

```sql
CREATE VIEW v_final_reports AS
SELECT d.Award_ID, d.Subaward_ID, r.Report_Type, d.Due_Date, d.Deliverable_Status
FROM Deliverable d
JOIN Report r ON r.Deliverable_ID = d.Deliverable_ID
WHERE r.Report_Type IN ('Final_Progress', 'Final_Financial', 'Invention_Statement')
  AND d.Is_Active = true;
```

To find active awards with part of the work stopped, read their modifications, because `Award_Status` stays `Active`:

```sql
CREATE VIEW v_partial_actions AS
SELECT a.Award_ID, a.Award_Number, COALESCE(av.Canonical_Value_Code, av.Value_Code) AS Event_Type,
       m.Effective_Date, m.Termination_Basis, m.Funding_Change_Amount, m.Description
FROM Modification m
JOIN Award a ON a.Award_ID = m.Award_ID
JOIN AllowedValues av ON av.AllowedValue_ID = m.Event_Type_Value_ID
WHERE COALESCE(av.Canonical_Value_Code, av.Value_Code) IN ('Partial_Suspension', 'Partial_Termination')
  AND m.Approval_Status IN ('Approved', 'Not_Required')
  AND a.Award_Status = 'Active'
  AND m.Is_Active = true;
```

For the HERD survey's figures, including `R&D expenditures` and `Source of funds`, see [herd-report.md](herd-report.md).

---

## Notes

- These views are illustrative. Adopters write the views their specific reporting and engine needs require, conforming to the patterns where applicable.
- Materialized views (where the engine supports them) are acceptable when query latency requires it; the source-of-truth still lives in UDM and the materialized view is refreshed.
- Engine logic in view definitions can be version-controlled and reviewed like any code artifact. This is the recommended location for review-engine logic; do not persist findings as physical tables.
- Some views combine UDM source tables with patterns documented in `vignettes/udm-patterns.md` (notably the automated-finding view in Sample 3). Aligning view output to the documented shapes makes the view's output portable across consumers.
