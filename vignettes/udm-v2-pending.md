# UDM v2 — pending work before next ask-a-child

Items in flight or planned since the last cold-read (commit `acd8790`, score 6/10).

## Done since last cold-read

- **Polymorphic FK existence — minimum behavior expectations.** Added three rules to *Implementation guidance > Polymorphic FK existence*: no dangling refs on write, parent removal preserves attachments (soft delete), type-stable references (Related_Entity_Type not edited after insert).
- **POP_End_Date contradiction resolved.** Dropped redundant `Period_Of_Performance_Start_Date` / `Period_Of_Performance_End_Date`; `Original_Start_Date` / `Original_End_Date` are the frozen-at-execution values, `Current_End_Date` is the derived live value. Derivation rule updated to reference `Original_End_Date`.
- **Budget anchor refactor (Option B).** `Budget.Proposal_ID` is now required at every Lifecycle_Stage. `Award_ID` / `Subaward_ID` XOR stays at Approved+ for per-Award disambiguation. Chain identity is Proposal_ID throughout; no anchor switch. Updated cross-row constraints (uniqueness key, period non-overlap) and the "Modification effect on the Budget chain" semantic convention.
- **Credit_Percent active-on-date.** Tightened the AwardRole sum-to-100 constraint to active-on-date semantics. Holds at every point in time during PI transitions.
- **Budget period non-overlap.** Added cross-row constraint: for a given (Proposal_ID, post-award anchor, Lifecycle_Stage) and active rows, (Period_Start_Date, Period_End_Date) ranges are non-overlapping.
- **Effort period non-overlap.** Added cross-row constraint: for a given (AwardRole_ID, Lifecycle_Stage) and active rows, (Period_Start_Date, Period_End_Date) ranges are non-overlapping.
- **No chain branching.** Added to Universal patterns: at any given time, a parent row has at most one Is_Active=true descendant. Multiple concurrent active siblings are a data error.

## Cold-read overreach to keep ignoring

- **No `Originating_Award_ID` on Award.** User explicitly rejected last round; Award → Proposal → Originating_Proposal_ID handles lineage queries.
- **ConflictOfInterest no `Proposal_ID`.** Discussed; COI propagates via Award.Proposal_ID after the Award materializes.
- **Polymorphic attachment "no reference implementation."** Spec is database-engine agnostic by design; minimum-behavior expectations now address consistency.

## Open architectural questions

- **Multi-tenant / consortium deployments.** Spec is single-tenant per institution. If a consortium ever wants shared storage with multiple institutions, every "unique within the institution" constraint needs an Institution_ID discriminator. Out of scope for v2 but flagged.

- **Currency.** Multi-currency support is in Optional Extensions. The canonical Money type assumes one institutional currency convention.
