# UDM v2 — pending work before next ask-a-child

Items in flight or planned since the last cold-read (commit `797e2d1`, score 6/10).

## Done since last cold-read

- **Polymorphic FK existence — minimum behavior expectations.** Added three rules: no dangling refs on write, parent removal preserves attachments (soft delete), type-stable references.
- **POP_End_Date contradiction resolved.** Dropped redundant `Period_Of_Performance_Start_Date` / `Period_Of_Performance_End_Date`; `Original_Start_Date` / `Original_End_Date` are frozen-at-execution values, `Current_End_Date` is the derived live value.
- **Budget anchor refactor (Option B).** `Budget.Proposal_ID` required at every Lifecycle_Stage. Chain identity is stable across stages; no anchor switch.
- **Credit_Percent active-on-date.** Tightened to active-on-date semantics.
- **Budget and Effort period non-overlap constraints.**
- **No chain branching rule.** Single Is_Active=true descendant per parent.
- **`Modification.New_End_Date` column added.** Was referenced in the Current_End_Date derivation rule but missing from the table.
- **`Award.Current_Total_Funded` declared derived.** Symmetric with Current_End_Date. Added `Original_Total_Funded` (frozen at execution). Derivation rule: Original + sum of approved Funding_Change_Amount.
- **PI transition formula fixed.** Predecessor.End_Date is the day BEFORE successor.Start_Date; no overlap on transition day; credit-percent constraint holds without double-counting.
- **Table count corrected.** Goal section now says 49 (was 53).

## Cold-read overreach to keep ignoring

- **No `Originating_Award_ID` on Award.** User explicitly rejected; Award → Proposal → Originating_Proposal_ID handles lineage queries.
- **ConflictOfInterest no `Proposal_ID`.** COI propagates via Award.Proposal_ID after the Award materializes.
- **"Canonical_Value_Code list not published."** Recommended values lists in column references ARE the canonical codes (per *Cross-institution value normalization*).

## Real gaps surfaced but not yet addressed

- **Project Lead at non-academic subrecipients.** Community-partner subaward with no PI/Co_PI/Co_I/Multi_PI role. AwardRole.Credit_Percent constraint expects credit-bearing roles to sum to 100; the spec doesn't say what happens when there are zero credit-bearing rows on a Subaward.
- **CostShare doesn't persist Proposal_ID like Budget does.** Could benefit from a parallel refactor.
- **PI_Change Modification vs AwardRole history.** Is the Modification row required when AwardRole rows change PI? Spec is silent on whether both must exist.

## Open architectural questions

- **Multi-tenant / consortium deployments.** Spec is single-tenant per institution.
- **Currency.** Multi-currency support is in Optional Extensions.
