# UDM v2 — pending work before next ask-a-child

Items in flight or planned since the last cold-read (commit `7cccdb0`, score 6/10).

## Done since last cold-read

- **`Award.Originating_Award_ID` added.** Derived, stored column pointing at the root of the Previous_Award_ID chain. Parallels Proposal.Originating_Proposal_ID. Derivation rule documented; Summary updated.
- **Credit_Percent constraint relaxed for zero-credit-bearing-roles case.** Community-partner Subawards with no academic-PI structure are explicitly allowed; the sum-to-100 constraint applies only when at least one credit-bearing role is active.
- **CostShare persists `Proposal_ID` at all stages.** Parallel to the Budget refactor. Chain identity is stable across Proposed → Committed → Met/Waived.
- **PI_Change Modification vs AwardRole authority clarified.** Modification documents sponsor-side approval/notice; AwardRole row history is authoritative for "who held the role on date D." Not all PI changes require a Modification.

## Cold-read overreach to keep ignoring

- **ConflictOfInterest no `Proposal_ID`.** COI propagates via Award.Proposal_ID after the Award materializes.
- **"Canonical_Value_Code list not published."** Recommended values lists in column references ARE the canonical codes.
- **Polymorphic FK enforcement mechanism not prescribed.** Minimum behavior expectations added; spec stays platform-agnostic by design.

## Open architectural questions

- **Multi-tenant / consortium deployments.** Spec is single-tenant per institution.
- **Currency.** Multi-currency support is in Optional Extensions.
