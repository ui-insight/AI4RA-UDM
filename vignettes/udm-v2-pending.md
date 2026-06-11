# UDM v2 — pending work before next ask-a-child

Items in flight or planned since the last cold-read (commit `4721a66`, score 5/10).

## Done since last cold-read

- **Drop `Foreign_National_Screening` from `Action_Type`.** Detailed export control (including screening events) is fully scoped out; ComplianceRequirement.Requirement_Type='Export_Control' is the only export-control touchpoint.
- **Add `OrganizationIdentifier` junction table.** Carries UEI / EIN / DUNS / CAGE / IPF / IPEDS / Sponsor_Code / Other identifiers. Cross-row constraint: (Identifier_Type, Identifier_Value) unique within institution when active. Parallels PersonnelCredential.
- **Add `OrganizationCapability.Risk_Level`.** Standing risk of this Organization in this capacity (subrecipient general risk profile, vendor performance risk, sponsor payment risk). Distinct from per-Subaward risk on `Subaward.Risk_Level`.
- **Add `Personnel.Home_Organization_Identifier`.** Single ShortCode column. Unique within `(Home_Organization_ID, Home_Organization_Identifier)` when not null. Primary dedup key for Personnel rows. Works for internal (Banner ID, NetID, EmpID) and external (sponsor's internal PO ID) personnel symmetrically.

## Planned (remaining cold-read findings to address)

- **`Action_Type` as AllowedValues, not fixed Status.** Per the spec's own rule at line 98, fixed Status enums are for cross-institution standards. `Subrecipient_Risk_Review`, `Cost_Transfer_Approval`, `JIT_Request`, `Service_Request` are institution-customized workflows — should be AllowedValues with a canonical recommended-values list.

- **Same-stage chain forest semantics.** A stage-S row can have multiple stage-S descendants via `Parent_*_ID` under correction. The "latest leaf" rule is ambiguous when there are multiple leaves. Needs a structural constraint ("at most one un-superseded same-stage descendant per anchor/period") or a tie-breaking convention.

- **NCE Modification → `Award.Current_End_Date` derivation.** The narrative says Current_End_Date reflects modifications; nothing in the schema enforces or derives it. Either declare it `derived` with a rule (latest approved NCE wins) or remove the narrative claim and let consumers compute it.

- **Subaward Proposed→Pending Budget anchor switch.** Budget at Proposed has `Proposal_ID`; at Approved it has `Subaward_ID`. When the Subaward transitions and the Budget chain advances, the anchor switches across the chain. Needs a semantic convention paragraph.

- **Credit_Percent sum during AwardRole transitions.** New PI inserted Day D, old PI end-dated Day D. Both rows visible on Day D. Does the sum-to-100 constraint apply to all rows or active-on-date rows? Needs to specify temporal slicing.

## Cold-read defensive complaints we're NOT addressing

- "Canonical AllowedValues list isn't published as a separate document." Already addressed — Recommended values IN the column references ARE the canonical codes. Lines 424-428.
- Polymorphic attachment orphans on attachments. Deliberately punted to institutional policy.
- Four parallel time mechanisms (ActivityLog, Updated_At, Lifecycle chain, versioned storage). Each serves a different purpose; layering is intentional.

## Open architectural questions

- **Multi-tenant / consortium deployments.** Spec is single-tenant per institution. If a consortium ever wants shared storage with multiple institutions, every "unique within the institution" constraint needs an Institution_ID discriminator. Out of scope for v2 but flagged.

- **Currency.** Multi-currency support is in Optional Extensions. The canonical Money type assumes one institutional currency convention.
