# UDM v2 Conformance

**Status:** Draft.

Conformance is how an implementation or a product shows that it follows the UDM without changing it. A conformance claim is a declaration that passes the published checker, [`scripts/check_conformance.py`](../scripts/check_conformance.py), for a named UDM version. The names "AI4RA Unified Data Model" and "AI4RA UDM" are reserved for conforming versions (see [NAME-POLICY.md](../NAME-POLICY.md)).

## Profiles

| Profile | Who it is for | What it carries | Example claim |
|---|---|---|---|
| **Implementation** | A System of Record | Every core table, plus the tables of each declared optional module | AI4RA UDM 2.3 core + modules: governance |
| **Provider** | A source system (eRA platform, ERP, HR system) that delivers data to a System of Record | A declared subset of tables, with provenance on every row | AI4RA UDM 2.3 provider: Award, Modification, Proposal |

A source system holds part of the model and is not a System of Record. The provider profile lets it deliver the part it holds in UDM form, so an institution can load it without building a crosswalk for that vendor.

## The declaration

A declaration is a JSON file describing the shape a consumer reads: tables, columns, types, keys, and closed vocabularies. It describes the logical shape, not the storage. A derived column served by a view is declared like any other column.

```json
{
  "conformance_declaration": {
    "udm_version": "2.3.0",
    "profile": "provider",
    "declarer": "Example Vendor",
    "product": "Example eRA 12",
    "modules": [],
    "rules_attested": true
  },
  "tables": {
    "Award": {
      "columns": {
        "Award_ID": { "type": "ID", "required": true, "primary_key": true }
      }
    }
  }
}
```

The example is abbreviated. `tables` mirrors the `tables` key of `udm_schema.json`, with the universal audit columns written out on every table. Each column carries `type`, `required`, and, where the specification has them, `primary_key`, `references`, and `allowed_values`. The checker prints a complete starting file with `--template`.

Types may be written in the specification's abstract vocabulary (`ID`, `Money`, `Date`) or as native type names (`VARCHAR(50)`, `NUMERIC(18,2)`).

## What the checker verifies

For every specified table the declaration carries:

- **Columns.** Exactly the specified columns plus the universal audit columns. An added column fails under the encapsulation rule: extend with new tables, not new columns.
- **Type family.** String, integer, decimal, date, timestamp, or boolean matches the specification. Length, precision, and scale are not compared. An identifier may be a string, an integer, or a UUID, and a foreign key matches the family of the key it references.
- **Required.** A column the specification requires is required.
- **Keys.** Primary keys and foreign-key targets match the specification.
- **Closed vocabularies.** Allowed values match the specification. A `Related_Entity_Type` list may add only the Records targets of declared modules.
- **Modules.** Each declared module's dependencies are declared, and a module's table is carried only when its module is declared.

Per profile:

- **Implementation.** Every core table and every table of each declared module is present.
- **Provider.** At least one specified table is carried. `Source_System` and `Source_Record_ID` are required on every carried table. A closed vocabulary may be a subset of the specified values.

Tables outside the specification are local extensions. The checker lists them and does not check them.

A declaration names a UDM version and is checked against the schema file of the same major and minor version.

## What is attested

Some rules cannot be read from a declaration. Setting `rules_attested` to `true` is the declarer's statement that they hold:

- the cross-row constraints (`cross_row_constraints` in the schema file);
- derived values are correct at the moment a consumer reads them (`derived_values`);
- for implementations, the minimum conformance behavior for polymorphic attachments (`polymorphic_attachment_enforcement`).

The checker requires the attestation and does not verify it. A template starts with `rules_attested` set to `false`, so it does not pass until the declarer sets it.

## Running the checker

```
# Start from a template
python scripts/check_conformance.py --template --modules governance > declaration.json
python scripts/check_conformance.py --template --profile provider --tables Proposal,Award > declaration.json

# Check a declaration
python scripts/check_conformance.py declaration.json
```

The output lists each finding and ends with `CONFORMS:` followed by the claim the declaration supports, or `DOES NOT CONFORM`. Pass `--schema` to check against the schema file of a specific UDM version.
