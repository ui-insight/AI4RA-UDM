# UDM Design Review

**Date:** 2026-08-26
**Reviewed:** `udm_schema_v2.json` (v2.0.0), `udm-v2-system-of-record.md`, `ontology.md`, `udm-v2-architecture.md`, `udm-v2.1-issue-drafts.md` (14 issues), `udm-outputs-domain-proposal.md`, README, optional-extensions registry, dashboard source, presentation.
**Goal tested against:** a comprehensive, powerful, flexible, and simple universal data model for research administration. A solid core; some coverage deliberately left to extensions. Designed from the ground up for the research administration function itself, not to match any existing product.

This is a suggestions document only. No repo artifacts were changed as part of this review.

---

## 0. Design authority principle

Adopted as a standing directive: **the UDM is designed from requirements, not from products.** Requirements come from the research administration function itself: federal regulation (Uniform Guidance, Bayh-Dole, PHS Policy), sponsor requirements (application guides, progress reporting, financial reporting), and institutional process (proposal routing, effort certification, cost share, compliance review). Existing commercial or institutional systems are never design anchors, never cited as justification, and never named as recommended alternatives.

Three consequences for the repo:

1. **No commercial product names anywhere.** Not in descriptions, synonyms, worked examples, extension entries, dashboard text, or presentations.
2. **No framing that derives UDM design from another system's schema.** A design decision is justified by the RA requirement it serves, never by "system X models it this way."
3. **Categories that remain legitimate to name:** federal sponsor systems (Grants.gov, eRA Commons, Research.gov) because integrating with them is itself an RA requirement, and open-source infrastructure technologies in implementation guidance (storage engines, query layers) because they describe how to implement, not what RA is.

---

## 1. External-reference remediation worklist

A scan on 2026-08-26 found commercial product references in the files below. Names are deliberately omitted here; the worklist is by file and context.

| File | Hits | Context |
|---|---|---|
| `udm_schema_v2.json` | 7 | `Source_System` column description lists example products; two out-of-scope extension entries name products; two column-synonym entries include product-branded identifier names |
| `vignettes/udm-v2-system-of-record.md` | 8 | Same content mirrored in prose, plus worked-example text |
| `vignettes/udm-v2-architecture.md` | 1 | A worked example uses a product name in sample ticket text |
| `vignettes/ontology.md` | 1 | `Source_System` example list |
| `vignettes/udm-v2.1-issue-drafts.md` | 1 | Example state-transition name embeds a product name |
| `docs/presentation/index.html` | 2 | Presentation slides |
| `dashboard/src/components/Infrastructure/InfrastructureTab.tsx` | 2 | Dashboard text |
| `docs/data/*.json` | (generated) | Regenerate after source fixes |

Remediation guidance:

- Replace product-example lists with role descriptions: "the originating source system (ERP financial system, eRA platform, HR system)".
- Synonyms: keep functional vocabulary that practitioners use generically (FOAP, FOAPAL, Chart String, NetID, EmpID); drop product-branded variants of the same concepts. The cost to crosswalk matching is small; descriptions carry the semantics.
- Out-of-scope extension entries: "live in specialized [tech transfer / HR / publication] management systems", no names.
- One pass, all files, then regenerate `docs/data`.

**Note on current working tree:** three uncommitted edits already remove product names from one location but simultaneously add forward references to the unratified Outputs domain. Recommend splitting: fold the name removals into the remediation pass; hold the Outputs references until that domain is approved.

---

## 2. The affiliated-project references

One referenced system is an affiliated project under the same initiative, with a settled authority direction: **the UDM is the guiding document for that project, not the other way around.** The preference is still to avoid naming it in this repo.

The current repo state inverts the authority relationship. The v2.1 issue drafts describe themselves as a gap analysis derived from that project's application schema, a dedicated inventory vignette documents that project's entities in detail, a script applies extensions derived from it, and several issue bodies justify UDM decisions by reference to what that project does. A reader would reasonably conclude the UDM follows the application, which is backwards.

Recommended handling:

1. **Reframe every v2.1 issue requirement-first.** Each issue already contains the real justification (regulatory mandates, institutional workflows); the cross-references are removable without weakening any argument. Do the rewrite when filing the issues publicly on GitHub (section 10 recommends filing anyway), so the public roadmap states requirements, not provenance.
2. **Remove or archive the inventory vignette and the extension script.** They served their purpose as validation input. Cross-checks against the affiliated project can continue privately; the artifacts stay out of this repo.
3. **Purge the remaining scattered references** (patterns vignette, changelog, issue-draft example text).

The affiliated project should consume the UDM (implement it, map to it, file adopter feedback as issues like any other institution). Nothing in this repo needs to consume the affiliated project.

---

## 3. What is working. Protect these.

- **Pattern economy.** Eight universal patterns carry all 49 tables. This is the model's best feature and the reason it can stay simple while growing. Treat the pattern list as frozen: new proposals must compose existing patterns.
- **Rule catalogs.** 19 semantic conventions, ~70 cross-row constraints in 11 typed structured forms, derived-value rules with recompute triggers. Machine-consumable constraints are the "powerful and transparent" differentiator over prose-only standards.
- **The regeneration test.** The three-layer architecture (Record / Insight / Engagement) gives a principled inclusion test, already doing real work in issues #4, #5, #11, #12. Write it into the spec (issue #10) and cite it in every scope decision.
- **Dual sources of truth with distinct jobs.** Prose authoritative on intent, JSON on machine detail.

---

## 4. Highest-leverage structural recommendation: a three-tier conformance model

The current structure is binary: canonical model or local extension. The roadmap breaks that. v2.1 as drafted adds ~25 entities; Outputs adds 7 more; the model lands near 76 tables. An institution with no animal research would still see five animal-use tables in the "core." A flat core that size is no longer simple.

| Tier | Contents | Conformance meaning |
|---|---|---|
| **Core** | The ~47-49 universal tables | Required for any UDM implementation |
| **Standard modules** | Compliance Protocols (18), Governance (6), Outputs (7). Fully specified, versioned, optional | Declared per implementation: "UDM 2.x core + modules: outputs, governance" |
| **Local extensions** | The existing registry | Institution-specific, not specified by UDM |

This resolves the project goal's tension directly: comprehensive (modules are fully specified) and simple (core stays ~50). It also gives adopters an honest conformance vocabulary, which interoperability needs anyway.

---

## 5. Version and sync discipline

1. **The published v2.0.0 artifact has drifted.** Since the 2026-06-11 release, the same version number has absorbed: 289 new column descriptions, dissolution of one domain (7 to 6), a new top-level `implementation_tables` key, synonym changes. Bump now (the domain restructure justifies at least 2.0.1) and adopt the rule that any published JSON change bumps the version.
2. **No metaschema.** Publish a JSON Schema for `udm_schema_v2.json` itself; add a validation step to the existing CI workflow.
3. **Prose/JSON sync is asserted, not verified.** A CI script comparing table and column sets between the JSON and the prose spec would make the README's "kept in exact sync" claim true by construction.

---

## 6. Other consistency findings

| # | Finding | Recommendation |
|---|---|---|
| 1 | Issue #11 removes ActivityLog, yet the spec recently gained prose documenting ActivityLog's enforcement exception | Decide the removal first; do not invest spec prose in an entity slated for deletion |
| 2 | `Report.Sponsor_Confirmation_Number` and `SubmissionAttempt.Sponsor_Confirmation_Number` overlap | Resolves itself if issue #12 ships; an argument for sequencing removals early |
| 3 | The out-of-scope extension registry entry for publications/outputs disclaims exactly what the proposed Outputs module adds | Rewrite that entry (and the invention-disclosure entry) in the same release that adopts Outputs |

---

## 7. Release sequencing

Ship subtractive and hygiene changes before additive modules, while the adopter base is small and migration is cheap.

- **v2.0.1 (hygiene):** version-bump discipline, external-reference remediation pass (sections 1 and 2), metaschema + CI validation, file the 14 issues publicly in requirement-first form.
- **v2.1 (cleanup + small additions):** remove ActivityLog and the submission trio with migration notes (#11, #12); add the architecture section (#10) and worked examples (#7, #8); add CommunicationResponse (#9) and PolicyException (#2). Net: roughly 49 − 4 + 2 = 47 tables. A breaking release this small is easy to absorb.
- **v2.2 (first standard modules):** Compliance Protocols (#1) and Governance (#13, #14).
- **v2.3 (module):** Outputs.

Issues #3, #4, #5, #6 are already correctly resolved as deferred / pattern / no-action.

---

## 8. Outputs proposal critique

Sound in shape (root + contributors + award junction + per-type details, all composed from existing patterns). Before it advances:

1. **PK convention violation.** The detail tables use `Output_ID` as their primary key; the identifier convention requires `TableName_ID`. Recommend documenting a "1:1 detail table" exception in the conventions (simpler than synthetic IDs), noting it as the second deliberate exception after `AllowedValue_ID`.
2. **Drop `Patent` as an Output_Type.** A patent is a disposition of a disclosure (`InventionDisclosureDetail.Disposition`), not an independent RA output. Two representations of one fact invite drift.
3. **Resolve the Proposal-linkage open question as "decided against."** RA-reported outputs are obligations against funded work. Record the decision explicitly.
4. **Resolve ORCID as "yes":** add it to the recommended `PersonnelCredential.Credential_Type` values as part of the module.
5. **Adopt both `Year` (required) and `Published_Date` (optional).**

---

## 9. Coverage check

**Missing from both core and the extension registry:**

- **Agreements (MTA, DUA, NDA, teaming agreements, MOUs).** The largest genuinely-RA workload with no home in the model and no extension entry. `Negotiation` covers award negotiation only. Add an extension-registry entry at minimum; treat as a candidate standard module after Outputs.

**Rightly excluded; hold the line:** student records, HR/payroll, bibliometrics (Insight layer), the tech transfer pipeline beyond the disclosure event, editorships and professional service.

**Covered adequately despite temptation:** internal funding (existing semantic convention), service tickets (Action), checklists (issue #5), review findings (issue #4).

---

## 10. Strategic items for the author

1. **License.** GPL-3.0 on a specification is unusual; copyleft on schema artifacts can deter implementers generating DDL from the JSON. If maximum adoption is the mission, consider CC-BY-4.0 for prose and a permissive license for the JSON artifacts. Deliberate choice either way.
2. **File the issues.** The 14 drafts live only in a vignette. Filing them (requirement-first, per section 2) makes the roadmap public and gives the community something concrete to react to.
3. **Define conformance.** "Implements the UDM" is currently unfalsifiable. A short conformance section (MUST: tables, columns, FKs, XOR and lifecycle constraints; SHOULD: derived columns, views) plus the module-declaration vocabulary from section 4 makes interoperability claims testable. Cheapest high-value addition to the spec.

---

## Priority shortlist

1. Run the external-reference remediation pass and decide the external-model inventory question (sections 1 and 2). This gates everything public-facing.
2. Adopt the three-tier core / module / extension structure before v2.1 ships (section 4).
3. Bump the published version and adopt version-bump discipline (section 5).
4. Re-sequence releases: hygiene, then cleanup, then modules (section 7).
5. Resolve the Outputs-proposal items before advancing it (section 8).
