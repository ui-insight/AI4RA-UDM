# Producing the HERD survey from UDM data

The [NSF Higher Education Research and Development (HERD) survey](https://ncses.nsf.gov/surveys/higher-education-research-development) asks institutions for their research and development spending each year. This guide shows where each answer comes from in data organized by the UDM. It follows the FY 2025 questionnaire, so check the current questionnaire for changes before using it.

Sponsored spending can be calculated from the UDM. Some inputs come from elsewhere, and they are listed under [What comes from outside the UDM](#what-comes-from-outside-the-udm).

## What you need to populate

These columns exist mainly so that the survey can be answered from the data:

| Column | Used for |
|---|---|
| `Award.Activity_Type` | Which awards count as research (`Organized_Research`) |
| `Award.Instrument_Type` | Contracts versus grants and other agreements |
| `Award.Research_Character` | Basic research, applied research, or experimental development |
| `Award.Is_Clinical_Trial` | Phase I, II, or III clinical trials with human patients |
| `Award.Prime_Sponsor_Organization_ID`, `Award.Is_Flow_Through` | The original source of the money |
| `Organization.Sponsor_Type`, `Organization.Is_Foreign` | Source of funds and foreign sources |
| `Organization.Is_Medical_School` | Spending in the medical school |
| `BudgetCategory.HERD_Cost_Type` | Types of costs |
| `Classification` with `Scheme = 'HERD_Field'` | Field of R&D, with `Allocation_Percent` to prorate |

`Transaction.Budget_ID` is optional, but a transaction without it can't be assigned a cost type. The views report those as `Unmapped`, so check that total before using the cost type results.

## The views

`vw_HERD_Expenditures` has one row per R&D spending transaction, with the survey's categories already worked out. `vw_HERD_Expenditures_By_Field` adds the field of R&D and prorates each amount. Both are in `udm_schema.json` as example views.

Neither view limits the dates, because fiscal years differ by institution. Add your fiscal year when you query them, and divide by 1,000, since the survey reports dollars in thousands:

```sql
SELECT Source_Of_Funds, SUM(Amount) / 1000 AS Thousands
FROM vw_HERD_Expenditures
WHERE Transaction_Date BETWEEN '2024-07-01' AND '2025-06-30'
GROUP BY Source_Of_Funds;
```

The views count expenses and their corrections, such as cost transfers, adjustments, and reversals, along with cost share transactions. They leave out encumbrances, because those aren't spending.

## Question by question

| Question | How to answer it |
|---|---|
| **Q1** Source of funds | Group `vw_HERD_Expenditures` by `Source_Of_Funds`. Add unrecovered indirect costs to institutional funds (see below) |
| **Q1.1** Types of institutional funding | Answered by a person |
| **Q2** Foreign sources | Group by `Foreign_Source`, leaving out nulls |
| **Q3** Types of agreement | Leave out `Institutional`, then group by `Agreement_Group` |
| **Q4** Medical school | Sum where `Is_Medical_School` is true |
| **Q5** Clinical trials | Sum where `Is_Clinical_Trial` is true, split by `Is_Federal` |
| **Q6** Type of research | Group by `Research_Character`, split by `Is_Federal`. Estimate if one award spans several kinds, which the survey allows |
| **Q7** Received as a subrecipient | Sum where `Is_Flow_Through` is true, grouped by `Passing_Sponsor_Type` and split by `Is_Federal` |
| **Q8** Passed to subrecipients | Sum where `HERD_Cost_Type = 'Pass_Through'`, grouped by `Subrecipient_Sponsor_Type` and split by `Is_Federal` |
| **Q9, Q10** Federal spending by field and agency | Group `vw_HERD_Expenditures_By_Field` by `HERD_Field` and `Origin_Organization_ID` where `Is_Federal` is true. Roll agencies up with `Organization.Parent_Organization_ID` |
| **Q11** Nonfederal spending by field and source | Group the same view by `HERD_Field` and `Source_Of_Funds` where `Is_Federal` is false |
| **Q12** Types of costs | Group by `HERD_Cost_Type`. `Indirect` is recovered indirect costs. Report unrecovered indirect costs separately (see below) |
| **Q13** Capitalization thresholds | From institutional policy |
| **Q14** Equipment by field | Group the by-field view where `HERD_Cost_Type = 'Capitalized_Equipment'`, split by `Is_Federal` |
| **Q15** Personnel headcounts | Mostly from the HR system (see below) |

## How source of funds maps

The survey reports the original source of the money. For a flow-through award, that is the prime sponsor, and the views use it automatically.

| `Sponsor_Type` of the original source | `Source_Of_Funds` | `Foreign_Source` when `Is_Foreign` is true |
|---|---|---|
| Federal | Federal | |
| State, Local | State_Local | |
| Industry | Business | Business |
| Nonprofit | Nonprofit | Nonprofit |
| Internal | Institutional | |
| Higher_Ed | All_Other | Higher_Education |
| Foreign_Government | All_Other | Foreign_Government (always) |
| Tribal, Other | All_Other | All_Other |

The questionnaire doesn't mention tribal governments, so `All_Other` is a judgment. Check how your institution has reported them.

## Calculating unrecovered indirect costs

The survey asks for this on externally funded R&D only, preferably project by project:

1. Multiply the negotiated rate by its base, using `IndirectRate` and the award's direct costs.
2. Subtract the recovered indirect costs for that award.

Don't count amounts above what the negotiated rate would give. Add the result to institutional funds in Q1 and report it in Q12.

## What comes from outside the UDM

| Input | Where it comes from |
|---|---|
| Q1.1 and Q13 policy answers | A person, from institutional policy |
| Q15 sex, citizenship, and education | The HR system, because the UDM doesn't copy HR data |
| Q15 researcher, technician, or support staff function | A judgment about each person's main work, usually made with the HR system |
| Institutional research spending not recorded on awards, such as startup or departmental funds | The financial system. Internal awards with `Sponsor_Type = 'Internal'` are covered by the views |
