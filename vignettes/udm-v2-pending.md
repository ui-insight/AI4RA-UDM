# UDM v2 — pending work before next ask-a-child

Items in flight or planned since the last cold-read (commit `4721a66`, score 5/10).

## Done since last cold-read

- **Drop `Foreign_National_Screening` from `Action_Type`.** Detailed export control (including screening events) is fully scoped out; ComplianceRequirement.Requirement_Type='Export_Control' is the only export-control touchpoint.
- **Add `OrganizationIdentifier` junction table.** Carries UEI / EIN / DUNS / CAGE / IPF / IPEDS / Sponsor_Code / Other identifiers. Cross-row constraint: (Identifier_Type, Identifier_Value) unique within institution when active. Parallels PersonnelCredential.
- **Add `OrganizationCapability.Risk_Level`.** Standing risk of this Organization in this capacity (subrecipient general risk profile, vendor performance risk, sponsor payment risk). Distinct from per-Subaward risk on `Subaward.Risk_Level`.
- **Add `Personnel.Home_Organization_Identifier`.** Single ShortCode column. Unique within `(Home_Organization_ID, Home_Organization_Identifier)` when not null. Primary dedup key for Personnel rows. Works for internal (Banner ID, NetID, EmpID) and external (sponsor's internal PO ID) personnel symmetrically.
- **`Action_Type` → AllowedValues.** Converted from fixed Status to `Action_Type_Value_ID` → AllowedValues with Value_Group = 'ActionType'. Added to canonical Value_Group names list.
- **`Award.Current_End_Date` and `Subaward.Current_End_Date` declared derived.** Derivation rule: latest approved end-date-changing Modification's `New_End_Date`, falling back to Period_Of_Performance_End_Date / Original_End_Date when no qualifying Modification exists.

## Planned (remaining cold-read findings to address)

- **Same-stage chain forest semantics.** A stage-S row can have multiple stage-S descendants via `Parent_*_ID` under correction. The "latest leaf" rule is ambiguous when there are multiple leaves. Recommendation: forbid branching — require at most one non-superseded same-stage descendant per parent (others marked Is_Active=false). Needs user sign-off.

- **Budget anchor refactor — Option B.** Make `Budget.Proposal_ID` required at all Lifecycle_Stage values; keep `Award_ID`/`Subaward_ID` at later stages too. Chain identity becomes Proposal_ID (stable across stages); per-Award disambiguation stays via Award_ID/Subaward_ID for the multi-Award case. Resolves the Proposed→Approved anchor switch.

- **Credit_Percent sum during AwardRole transitions.** New PI inserted Day D, old PI end-dated Day D. Both rows visible on Day D. Tighten the constraint to "sum to 100 across credit-bearing roles active on any given date" (not all rows in the table).

## Cold-read defensive complaints we're NOT addressing

- "Canonical AllowedValues list isn't published as a separate document." Already addressed — Recommended values IN the column references ARE the canonical codes. Lines 424-428.
- Polymorphic attachment orphans on attachments. Deliberately punted to institutional policy.
- Four parallel time mechanisms (ActivityLog, Updated_At, Lifecycle chain, versioned storage). Each serves a different purpose; layering is intentional.

## Open architectural questions

- **Multi-tenant / consortium deployments.** Spec is single-tenant per institution. If a consortium ever wants shared storage with multiple institutions, every "unique within the institution" constraint needs an Institution_ID discriminator. Out of scope for v2 but flagged.

- **Currency.** Multi-currency support is in Optional Extensions. The canonical Money type assumes one institutional currency convention.
