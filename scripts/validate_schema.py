#!/usr/bin/env python3
"""Validate the structure and internal consistency of udm_schema_v2.json.

Dependency-free. Two layers of checking:

1. Structural: required top-level keys, table/column entry shape.
   (The formal JSON Schema for external tooling lives at
   schemas/udm_schema_v2.metaschema.json; this script enforces the same
   rules without requiring the jsonschema package.)
2. Referential: every foreign key targets an existing table and column,
   domain_membership and implementation_tables exactly cover the table set,
   primary keys follow the TableName_ID convention (documented exceptions
   allowed), and column_synonyms keys resolve to real columns.

Exit status: 0 = valid, 1 = errors found. Warnings do not fail the run.
"""

import json
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "udm_schema_v2.json"

REQUIRED_TOP_LEVEL = [
    "metadata",
    "column_synonyms",
    "scope",
    "domain_membership",
    "universal_patterns",
    "audit_columns",
    "status_taxonomies",
    "semantic_conventions",
    "polymorphic_attachment_enforcement",
    "derived_values",
    "constraint_vocabulary",
    "cross_row_constraints",
    "tables",
    "optional_extensions",
    "example_views",
    "summary",
    "implementation_tables",
]

# Documented exceptions to the TableName_ID primary-key convention.
PK_EXCEPTIONS = {"AllowedValues": "AllowedValue_ID"}

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def main():
    try:
        schema = json.loads(SCHEMA_PATH.read_text())
    except json.JSONDecodeError as e:
        print(f"FATAL: {SCHEMA_PATH.name} is not valid JSON: {e}")
        return 1

    # --- Structural: top level ---
    for key in REQUIRED_TOP_LEVEL:
        if key not in schema:
            err(f"missing required top-level key: {key}")

    meta = schema.get("metadata", {})
    for key in ("name", "version", "released", "dialect"):
        if key not in meta:
            err(f"metadata missing required key: {key}")

    tables = schema.get("tables", {})
    if not isinstance(tables, dict) or not tables:
        err("tables must be a non-empty object")
        report()
        return 1

    # --- Structural: tables and columns ---
    for tname, tdef in tables.items():
        if not isinstance(tdef, dict):
            err(f"{tname}: table entry must be an object")
            continue
        for key in ("domain", "description", "columns"):
            if key not in tdef:
                err(f"{tname}: missing required key '{key}'")
        cols = tdef.get("columns", {})
        if not isinstance(cols, dict) or not cols:
            err(f"{tname}: columns must be a non-empty object")
            continue
        pk_cols = []
        for cname, cdef in cols.items():
            if not isinstance(cdef, dict):
                err(f"{tname}.{cname}: column entry must be an object")
                continue
            if "type" not in cdef:
                err(f"{tname}.{cname}: missing 'type'")
            if not cdef.get("description"):
                warn(f"{tname}.{cname}: empty or missing description")
            if cdef.get("primary_key"):
                pk_cols.append(cname)
            ref = cdef.get("references")
            if ref is not None:
                if not isinstance(ref, dict) or "table" not in ref or "column" not in ref:
                    err(f"{tname}.{cname}: references must be an object with 'table' and 'column'")

        # --- Primary-key convention ---
        expected_pk = PK_EXCEPTIONS.get(tname, f"{tname}_ID")
        if expected_pk not in cols:
            err(f"{tname}: expected primary-key column '{expected_pk}' not found")
        elif not cols[expected_pk].get("primary_key"):
            err(f"{tname}: column '{expected_pk}' exists but is not marked primary_key")
        for pk in pk_cols:
            if pk != expected_pk:
                err(f"{tname}: unexpected primary-key column '{pk}' (convention: {expected_pk})")

    # --- Referential: foreign keys ---
    for tname, tdef in tables.items():
        for cname, cdef in tdef.get("columns", {}).items():
            ref = cdef.get("references")
            if isinstance(ref, dict) and "table" in ref and "column" in ref:
                rt, rc = ref["table"], ref["column"]
                if rt not in tables:
                    err(f"{tname}.{cname}: references unknown table '{rt}'")
                elif rc not in tables[rt].get("columns", {}):
                    err(f"{tname}.{cname}: references unknown column '{rt}.{rc}'")

    # --- Referential: domain membership exactly covers the table set ---
    dm = schema.get("domain_membership", {})
    impl = schema.get("implementation_tables", {}).get("tables", [])
    assigned = []
    for domain, members in dm.items():
        for t in members:
            assigned.append(t)
            if t not in tables:
                err(f"domain_membership[{domain}]: unknown table '{t}'")
    for t in impl:
        assigned.append(t)
        if t not in tables:
            err(f"implementation_tables: unknown table '{t}'")
    dupes = {t for t in assigned if assigned.count(t) > 1}
    for t in sorted(dupes):
        err(f"table '{t}' assigned more than once across domain_membership/implementation_tables")
    for t in tables:
        if t not in assigned:
            err(f"table '{t}' not assigned to any domain or implementation_tables")

    # --- Referential: per-table domain field agrees with domain_membership ---
    for tname, tdef in tables.items():
        declared = tdef.get("domain")
        if tname in impl:
            if declared != "Implementation":
                err(f"{tname}: in implementation_tables but domain is '{declared}' (expected 'Implementation')")
        else:
            home = next((d for d, ms in dm.items() if tname in ms), None)
            if home is not None and declared != home:
                err(f"{tname}: domain '{declared}' disagrees with domain_membership ('{home}')")

    # --- Referential: column_synonyms resolve ---
    syn = schema.get("column_synonyms", {})
    syn_values = syn.get("values", syn) if isinstance(syn, dict) else {}
    for key in syn_values:
        if not isinstance(key, str) or "." not in key:
            continue
        st, sc = key.split(".", 1)
        if st not in tables:
            err(f"column_synonyms: unknown table in key '{key}'")
        elif sc not in tables[st].get("columns", {}):
            err(f"column_synonyms: unknown column in key '{key}'")

    return report()


def report():
    for w in warnings:
        print(f"WARN: {w}")
    for e in errors:
        print(f"ERROR: {e}")
    n_err = len(errors)
    print(f"\nvalidate_schema: {n_err} error(s), {len(warnings)} warning(s)")
    return 1 if n_err else 0


if __name__ == "__main__":
    sys.exit(main())
