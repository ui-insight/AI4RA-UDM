-- Views for URADM Enhanced Schema

CREATE VIEW vw_All_ContactDetails AS
SELECT
    cd.ContactDetails_ID,
    'Personnel' AS Entity_Type,
    cd.Personnel_ID AS Entity_ID,
    CONCAT(p.First_Name, ' ', p.Last_Name) AS Entity_Name,
    av.Allowed_Value_Label AS Contact_Type,
    cd.ContactDetails_Value AS Contact_Value
FROM ContactDetails cd
JOIN Personnel p ON cd.Personnel_ID = p.Personnel_ID
LEFT JOIN AllowedValues av ON cd.AllowedValue_ID = av.Allowed_Value_ID
WHERE cd.Personnel_ID IS NOT NULL

UNION ALL

SELECT
    cd.ContactDetails_ID,
    'Organization' AS Entity_Type,
    cd.Organization_ID AS Entity_ID,
    o.Organization_Name AS Entity_Name,
    av.Allowed_Value_Label AS Contact_Type,
    cd.ContactDetails_Value AS Contact_Value
FROM ContactDetails cd
JOIN Organization o ON cd.Organization_ID = o.Organization_ID
LEFT JOIN AllowedValues av ON cd.AllowedValue_ID = av.Allowed_Value_ID
WHERE cd.Organization_ID IS NOT NULL;

CREATE VIEW vw_Active_Awards AS
SELECT
    a.Award_ID,
    a.Award_Number,
    a.Award_Title,
    a.Award_Status,
    a.Current_Total_Funded,
    a.Original_Start_Date,
    a.Current_End_Date,
    o.Organization_Name AS Sponsor_Name,
    p.Project_Title AS Project_Title,
    COALESCE(SUM(CASE WHEN t.Transaction_Type = 'Expense' THEN t.Transaction_Amount ELSE 0 END), 0) AS Total_Expenses,
    COALESCE(SUM(CASE WHEN t.Transaction_Type = 'Encumbrance' THEN t.Transaction_Amount ELSE 0 END), 0) AS Total_Encumbrances,
    a.Current_Total_Funded -
        COALESCE(SUM(CASE WHEN t.Transaction_Type IN ('Expense','Encumbrance') THEN t.Transaction_Amount ELSE 0 END), 0) AS Available_Balance,
    DATEDIFF(a.Current_End_Date, CURRENT_DATE) AS Days_Until_End
FROM Award a
LEFT JOIN Organization o ON a.Sponsor_Organization_ID = o.Organization_ID
LEFT JOIN Project p ON a.Project_ID = p.Project_ID
LEFT JOIN Transaction t ON a.Award_ID = t.Award_ID
WHERE a.Award_Status = 'Active'
GROUP BY a.Award_ID, a.Award_Number, a.Award_Title, a.Award_Status, a.Current_Total_Funded,
         a.Original_Start_Date, a.Current_End_Date, o.Organization_Name, p.Project_Title;

CREATE VIEW vw_Active_Personnel_Roles AS
SELECT
    pers.Personnel_ID,
    pers.First_Name,
    pers.Last_Name,
    pers.Primary_Email,
    pers.Person_Type,
    proj.Project_ID,
    proj.Project_Title,
    proj.Project_Status AS Project_Status,
    av.Allowed_Value_Label AS Role,
    pr.Is_Key_Personnel,
    pr.Start_Date,
    pr.End_Date,
    pr.FTE_Percent,
    a.Award_Number,
    a.Award_ID,
    a.Award_Status AS Award_Status
FROM Personnel pers
JOIN ProjectRole pr ON pers.Personnel_ID = pr.Personnel_ID
JOIN Project proj ON pr.Project_ID = proj.Project_ID
JOIN AllowedValues av ON pr.Role_Value_ID = av.Allowed_Value_ID
LEFT JOIN Award a ON pr.Funding_Award_ID = a.Award_ID
WHERE (pr.End_Date IS NULL OR pr.End_Date >= CURRENT_DATE)
  AND proj.Project_Status IN ('Active','Planning');

CREATE VIEW vw_Award_Financial_Summary AS
SELECT
    a.Award_ID,
    a.Award_Number,
    a.Award_Title,
    a.Current_Total_Funded,
    bp.Period_Number,
    bp.Start_Date AS Period_Start,
    bp.End_Date AS Period_End,
    bp.Total_Costs AS Period_Budget,
    COALESCE(SUM(CASE WHEN t.Transaction_Type = 'Expense' THEN t.Transaction_Amount ELSE 0 END), 0) AS Period_Expenses,
    COALESCE(SUM(CASE WHEN t.Transaction_Type = 'Encumbrance' THEN t.Transaction_Amount ELSE 0 END), 0) AS Period_Encumbrances,
    bp.Total_Costs -
        COALESCE(SUM(CASE WHEN t.Transaction_Type IN ('Expense','Encumbrance') THEN t.Transaction_Amount ELSE 0 END), 0) AS Period_Available
FROM Award a
LEFT JOIN AwardBudgetPeriod bp ON a.Award_ID = bp.Award_ID
LEFT JOIN Transaction t ON bp.AwardBudgetPeriod_ID = t.AwardBudgetPeriod_ID
WHERE a.Award_Status = 'Active'
GROUP BY a.Award_ID, a.Award_Number, a.Award_Title, a.Current_Total_Funded,
         bp.Period_Number, bp.Start_Date, bp.End_Date, bp.Total_Costs;

CREATE VIEW vw_Expiring_Awards AS
SELECT
    a.Award_ID,
    a.Award_Number,
    a.Award_Title,
    a.Current_End_Date,
    DATEDIFF(a.Current_End_Date, CURRENT_DATE) AS Days_Until_Expiration,
    o.Organization_Name AS Sponsor_Name,
    CONCAT(pers.First_Name, ' ', pers.Last_Name) AS PI_Name,
    pers.Primary_Email AS PI_Email
FROM Award a
JOIN Organization o ON a.Sponsor_Organization_ID = o.Organization_ID
LEFT JOIN ProjectRole pr ON a.Award_ID = pr.Funding_Award_ID
LEFT JOIN AllowedValues av ON pr.Role_Value_ID = av.Allowed_Value_ID
LEFT JOIN Personnel pers ON pr.Personnel_ID = pers.Personnel_ID
WHERE a.Award_Status = 'Active'
  AND a.Current_End_Date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 90 DAY)
  AND av.Allowed_Value_Code = 'PI';

CREATE VIEW vw_Overdue_Deliverables AS
SELECT
    d.AwardDeliverable_ID,
    d.Deliverable_Type,
    d.Due_Date,
    DATEDIFF(CURRENT_DATE, d.Due_Date) AS Days_Overdue,
    a.Award_Number,
    a.Award_Title AS Award_Title,
    CONCAT(pers.First_Name, ' ', pers.Last_Name) AS Responsible_Person,
    pers.Primary_Email
FROM AwardDeliverable d
JOIN Award a ON d.Award_ID = a.Award_ID
LEFT JOIN Personnel pers ON d.Responsible_Personnel_ID = pers.Personnel_ID
WHERE d.Deliverable_Status IN ('Pending','In Progress','Overdue')
  AND d.Due_Date < CURRENT_DATE
ORDER BY d.Due_Date;

CREATE VIEW vw_ComplianceRequirement_Status AS
SELECT
    cr.ComplianceRequirement_ID,
    cr.Requirement_Number,
    cr.Requirement_Type,
    cr.Requirement_Title,
    cr.Requirement_Status,
    cr.Initial_Approval_Date,
    cr.Expiration_Date,
    DATEDIFF(cr.Expiration_Date, CURRENT_DATE) AS Days_Until_Expiration,
    CONCAT(pers.First_Name, ' ', pers.Last_Name) AS PI_Name,
    pers.Primary_Email AS PI_Email,
    proj.Project_Title
FROM ComplianceRequirement cr
JOIN Personnel pers ON cr.Principal_Investigator_ID = pers.Personnel_ID
LEFT JOIN Project proj ON cr.Project_ID = proj.Project_ID
WHERE cr.Requirement_Status IN ('Approved','Conditional Approval')
  AND cr.Expiration_Date IS NOT NULL;

CREATE VIEW vw_Budget_Comparison AS
SELECT
    a.Award_ID,
    a.Award_Number,
    bp.Period_Number,
    bc.Category_Name AS Budget_Category,
    ab.Line_Item_Description,
    pb.Total_Cost AS Proposed_Amount,
    ab.Approved_Total_Cost AS Approved_Amount,
    ab.Current_Total_Cost AS Current_Budget,
    COALESCE(SUM(t.Transaction_Amount), 0) AS Actual_Spent,
    ab.Current_Total_Cost - COALESCE(SUM(t.Transaction_Amount), 0) AS Remaining_Budget,
    CASE
        WHEN ab.Approved_Total_Cost IS NOT NULL AND pb.Total_Cost IS NOT NULL
        THEN ((ab.Approved_Total_Cost - pb.Total_Cost) / pb.Total_Cost * 100)
        ELSE NULL
    END AS Percent_Change_From_Proposal
FROM Award a
JOIN AwardBudgetPeriod bp ON a.Award_ID = bp.Award_ID
LEFT JOIN AwardBudget ab ON bp.AwardBudgetPeriod_ID = ab.AwardBudgetPeriod_ID
LEFT JOIN BudgetCategory bc ON ab.BudgetCategory_ID = bc.BudgetCategory_ID
LEFT JOIN Proposal p ON a.Proposal_ID = p.Proposal_ID
LEFT JOIN ProposalBudget pb ON p.Proposal_ID = pb.Proposal_ID
    AND bp.Period_Number = pb.Period_Number
    AND ab.BudgetCategory_ID = pb.BudgetCategory_ID
    AND (ab.Line_Item_Description = pb.Line_Item_Description
         OR (ab.Line_Item_Description IS NULL AND pb.Line_Item_Description IS NULL))
LEFT JOIN Transaction t ON ab.Award_ID = t.Award_ID
    AND ab.AwardBudgetPeriod_ID = t.AwardBudgetPeriod_ID
WHERE a.Award_Status = 'Active'
GROUP BY a.Award_ID, a.Award_Number, bp.Period_Number, bc.Category_Name,
         ab.Line_Item_Description, pb.Total_Cost, ab.Approved_Total_Cost, ab.Current_Total_Cost;
