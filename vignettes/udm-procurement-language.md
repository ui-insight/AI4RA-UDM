# UDM Procurement Language

**Status:** Draft. Model language for institutions to adapt. Review with procurement and counsel before use.

An institution's influence over how a vendor handles its data is strongest at purchase and at renewal. These clauses ask a vendor to deliver and accept data in UDM form, and to show it with the published conformance checker (see [Conformance](udm-conformance.md)). Bracketed text is for the institution to set.

## Definitions

- **UDM**: the AI4RA Unified Data Model, version [2.3], published at https://github.com/ui-insight/AI4RA-UDM.
- **Checker**: the conformance checker published with the UDM for that version.
- **Declaration**: a conformance declaration in the format the Checker accepts.
- **Covered Tables**: the UDM tables for which the Product holds Institution data, listed in [Exhibit].

## Clauses for a source system

For a product that holds part of the institution's research administration data: an eRA platform, an ERP or finance system, an HR system, a compliance system. These use the provider profile.

1. **Conformant export.** The Product shall export all Institution data in the Covered Tables in UDM form. Vendor shall supply a Declaration under the provider profile that passes the Checker, and every export shall match that Declaration.
2. **Complete snapshots.** Vendor shall make a complete export of the Covered Tables available on demand and at least [daily]. Each export shall be a complete point-in-time copy, so that the Institution can retain and compare successive exports.
3. **Provenance.** Every exported row shall carry `Source_System` and `Source_Record_ID` identifying the originating record in the Product. These values shall be stable across exports.
4. **Conformant import.** The Product shall accept records for the Covered Tables in the same UDM form, matched on `Source_System` and `Source_Record_ID`, so that data entered in another system need not be entered again.
5. **Conformance through change.** Vendor shall maintain conformance across Product releases. Vendor shall give [30] days' notice of any release that changes the export, and shall supply an updated Declaration that passes the Checker before that release reaches the Institution.
6. **New UDM versions.** Within [180] days of a new UDM minor version, Vendor shall supply a conforming export for that version. Vendor shall continue to support the prior version for [12] months.
7. **Published crosswalk.** Vendor shall document the mapping from the Product's fields to UDM columns for the Covered Tables and keep it current.
8. **No additional charge.** Export, import, Declarations, and the crosswalk are included in the base fee.
9. **Remedy.** An export that does not match a passing Declaration is a defect under [the service level terms] and shall be corrected within [10] business days.
10. **Use of the name.** Vendor may describe the Product as an "AI4RA UDM [2.3] provider" for the Covered Tables only while its current Declaration passes the Checker.

## Clauses for a System of Record

For a data platform or warehouse built or operated for the institution as its System of Record. These use the implementation profile.

1. **Conformant implementation.** The System shall implement the UDM core and the optional modules [list]. Vendor shall supply a Declaration under the implementation profile that passes the Checker.
2. **Extensions.** Institution-specific needs shall be met with local extension tables that reference UDM tables. Vendor shall not add columns to UDM tables or change their constraints or closed vocabularies.
3. **History.** The System shall retain row history through versioned storage, so that the state of any record on any past date can be queried.
4. **Ownership.** The Institution owns the data and the schema of the implementation, and may export both in full at any time at no charge.
5. **Conformance through change.** Source-system clauses 5 and 6 apply to the System.

## Questions for an RFP

- Which UDM tables does the product hold data for? Provide a Declaration.
- Does the Declaration pass the published checker for UDM [2.3]? Provide the output.
- How are exports delivered, how often, and is each one a complete snapshot?
- Does the product accept data in UDM form? For which tables?
- How long after a new UDM version will a conforming export be available?
- Is any of this priced separately?
