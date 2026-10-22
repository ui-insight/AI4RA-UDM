#!/usr/bin/env python3
"""Validate the structure and internal consistency of udm_schema.json.

Dependency-free. Two layers of checking:

1. Structural: required top-level keys, module/table/column entry shape.
   (The formal JSON Schema for external tooling lives at
   schemas/udm_schema.metaschema.json; this script enforces the same
   rules without requiring the jsonschema package.)
2. Referential: every foreign key targets an existing table and column,
   no table is defined twice, primary keys follow the TableName_ID
   convention (documented exceptions allowed), every column type is abstract and
   mapped in every dialect, and the module laws hold (a module's tables
   may reference only the core, the module itself, or a declared
   dependency; a module's Records targets are its own tables).

Exit status: 0 = valid, 1 = errors found. Warnings do not fail the run.
"""

import json
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "udm_schema.json"

REQUIRED_TOP_LEVEL = ["metadata", "types", "conventions", "modules", "implementation_tables"]
REQUIRED_CONVENTIONS = [
    "identifier", "hierarchy", "role_named_foreign_keys", "polymorphic_attachment",
    "lifecycle_stage", "two_fk_exclusive_or", "allowed_values", "boolean_naming",
    "audit_columns", "audit_authority", "is_active_vs_status", "constraint_vocabulary",
    "value_normalization", "lifecycle_closure", "semantic",
]
CORE_MODULE_KEYS = ("name", "story", "tables")
OPTIONAL_MODULE_KEYS = ("name", "story", "requires", "records_targets", "allowed_value_groups", "tables")

# Documented exceptions to the TableName_ID primary-key convention.
PK_EXCEPTIONS = {"AllowedValues": "AllowedValue_ID"}

errors = []
warnings = []
ABSTRACT_TYPES = set()


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def check_vocabulary(label, tname, cols, allowed_groups, used_groups):
    """Every column that references AllowedValues names its value group; the group is declared."""
    for cname, cdef in cols.items():
        ref = cdef.get("references") if isinstance(cdef, dict) else None
        if not (isinstance(ref, dict) and ref.get("table") == "AllowedValues") or tname == "AllowedValues":
            continue  # the parent pointer on AllowedValues itself is a hierarchy link, not a vocabulary
        where = f"{label}{tname}.{cname}"
        group = cdef.get("value_group")
        if not isinstance(group, str) or not group:
            err(f"{where}: references AllowedValues but has no value_group")
            continue
        used_groups.add(group)
        if group not in allowed_groups:
            err(f"{where}: value_group '{group}' is not a canonical group or a group declared by this module")
        rv = cdef.get("recommended_values")
        if rv is not None and (not isinstance(rv, list) or not all(isinstance(v, str) and v for v in rv)):
            err(f"{where}: recommended_values must be a list of non-empty strings")


def check_table(label, tname, tdef, expected_pk=None):
    """Shape of one table entry. Returns its columns dict (possibly empty)."""
    if not isinstance(tdef, dict):
        err(f"{label}{tname}: table entry must be an object")
        return {}
    for key in ("description", "columns"):
        if key not in tdef:
            err(f"{label}{tname}: missing required key '{key}'")
    cols = tdef.get("columns", {})
    if not isinstance(cols, dict) or not cols:
        err(f"{label}{tname}: columns must be a non-empty object")
        return {}
    pk_cols = []
    for cname, cdef in cols.items():
        where = f"{label}{tname}.{cname}"
        if not isinstance(cdef, dict):
            err(f"{where}: column entry must be an object")
            continue
        if "type" not in cdef:
            err(f"{where}: missing 'type'")
        elif cdef["type"] not in ABSTRACT_TYPES:
            err(f"{where}: type '{cdef['type']}' is not in the abstract type vocabulary")
        if not cdef.get("description"):
            warn(f"{where}: empty or missing description")
        if cdef.get("primary_key"):
            pk_cols.append(cname)
        ref = cdef.get("references")
        if ref is not None and (not isinstance(ref, dict) or "table" not in ref or "column" not in ref):
            err(f"{where}: references must be an object with 'table' and 'column'")
        av = cdef.get("allowed_values")
        if av is not None and (not isinstance(av, list) or not all(isinstance(v, str) for v in av)):
            err(f"{where}: allowed_values must be a list of strings")
        if "synonyms" in cdef and not isinstance(cdef["synonyms"], str):
            err(f"{where}: synonyms must be a string")
        der = cdef.get("derived")
        if der is not None and (not isinstance(der, dict) or "rule" not in der or "recompute_triggers" not in der):
            err(f"{where}: derived must be an object with 'rule' and 'recompute_triggers'")
    expected_pk = expected_pk or PK_EXCEPTIONS.get(tname, f"{tname}_ID")
    if expected_pk not in cols:
        err(f"{label}{tname}: expected primary-key column '{expected_pk}' not found")
    elif not cols[expected_pk].get("primary_key"):
        err(f"{label}{tname}: column '{expected_pk}' exists but is not marked primary_key")
    for pk in pk_cols:
        if pk != expected_pk:
            err(f"{label}{tname}: unexpected primary-key column '{pk}' (convention: {expected_pk})")
    for i, c in enumerate(tdef.get("constraints", [])):
        if not isinstance(c, dict) or not c.get("rule"):
            err(f"{label}{tname}: constraints[{i}] must be an object with a 'rule'")
    return cols


def check_references(label, tname, cols, visible):
    """Every foreign key resolves to a visible table and an existing column."""
    for cname, cdef in cols.items():
        ref = cdef.get("references")
        if not (isinstance(ref, dict) and "table" in ref and "column" in ref):
            continue
        rt, rc = ref["table"], ref["column"]
        if rt not in visible:
            err(f"{label}{tname}.{cname}: references '{rt}', which is not visible from here")
        elif rc not in visible[rt].get("columns", {}):
            err(f"{label}{tname}.{cname}: references unknown column '{rt}.{rc}'")


def main():
    try:
        schema = json.loads(SCHEMA_PATH.read_text())
    except json.JSONDecodeError as e:
        print(f"FATAL: {SCHEMA_PATH.name} is not valid JSON: {e}")
        return 1

    for key in REQUIRED_TOP_LEVEL:
        if key not in schema:
            err(f"missing required top-level key: {key}")
    meta = schema.get("metadata", {})
    for key in ("name", "version", "released"):
        if key not in meta:
            err(f"metadata missing required key: {key}")

    # --- Types: every abstract type is mapped in every dialect ---
    types = schema.get("types", {})
    abstract = types.get("abstract", [])
    ABSTRACT_TYPES.update(abstract if isinstance(abstract, list) else [])
    dialects = types.get("dialects", {})
    if not isinstance(abstract, list) or not abstract:
        err("types.abstract must be a non-empty list")
    if not isinstance(dialects, dict) or not dialects:
        err("types.dialects must be a non-empty object")
    for dname, mapping in (dialects.items() if isinstance(dialects, dict) else []):
        for a in abstract:
            if a not in mapping:
                err(f"types.dialects.{dname}: no mapping for abstract type '{a}'")

    # --- Conventions ---
    conv = schema.get("conventions", {})
    for key in REQUIRED_CONVENTIONS:
        if key not in conv:
            err(f"conventions missing required key: {key}")
    for i, s in enumerate(conv.get("semantic", [])):
        if not isinstance(s, dict) or "name" not in s:
            err(f"conventions.semantic[{i}]: must be an object with a 'name'")
    canonical_groups = set(conv.get("value_normalization", {}).get("canonical_value_groups", []))
    used_groups = set()

    # --- Modules ---
    modules = schema.get("modules", {})
    for key in ("description", "laws", "core", "optional"):
        if key not in modules:
            err(f"modules missing required key: {key}")
    for key in ("capability_criterion", "encapsulation_rule"):
        if key not in modules.get("laws", {}):
            err(f"modules.laws missing required key: {key}")
    core_mods = modules.get("core", {})
    opt_mods = modules.get("optional", {})
    impl = schema.get("implementation_tables", {})
    if not isinstance(core_mods, dict) or not core_mods:
        err("modules.core must be a non-empty object")
        report()
        return 1

    # Core tables: every core module's tables plus the implementation tables.
    core_tables = {}
    owner = {}
    for mkey, mod in core_mods.items():
        for key in CORE_MODULE_KEYS:
            if key not in mod:
                err(f"modules.core.{mkey}: missing required key '{key}'")
        for tname, tdef in mod.get("tables", {}).items():
            if tname in owner:
                err(f"table '{tname}' defined in both '{owner[tname]}' and 'core.{mkey}'")
            owner[tname] = f"core.{mkey}"
            core_tables[tname] = tdef
            check_table(f"core.{mkey}: ", tname, tdef)
        for i, s in enumerate(mod.get("conventions", [])):
            if not isinstance(s, dict) or "name" not in s:
                err(f"modules.core.{mkey}.conventions[{i}]: must be an object with a 'name'")
        for i, v in enumerate(mod.get("example_views", [])):
            for key in ("name", "purpose", "sql"):
                if key not in v:
                    err(f"modules.core.{mkey}.example_views[{i}]: missing '{key}'")
    for key in ("description", "tables"):
        if key not in impl:
            err(f"implementation_tables missing required key: {key}")
    for tname, tdef in impl.get("tables", {}).items():
        if tname in owner:
            err(f"table '{tname}' defined in both '{owner[tname]}' and implementation_tables")
        owner[tname] = "implementation_tables"
        core_tables[tname] = tdef
        check_table("implementation: ", tname, tdef)
    for tname, tdef in core_tables.items():
        check_references("", tname, tdef.get("columns", {}), core_tables)
        check_vocabulary("", tname, tdef.get("columns", {}), canonical_groups, used_groups)

    # Optional modules: shape, dependencies, and the encapsulation rule.
    all_module_tables = {}
    for mkey, mod in opt_mods.items():
        for key in OPTIONAL_MODULE_KEYS:
            if key not in mod:
                err(f"modules.optional.{mkey}: missing required key '{key}'")
        for dep in mod.get("requires", {}).get("modules", []):
            if dep not in opt_mods:
                err(f"module {mkey}: requires unknown module '{dep}'")
        for tname in mod.get("tables", {}):
            if tname in core_tables:
                err(f"module {mkey}: table '{tname}' collides with a core table (encapsulation violation)")
            if tname in all_module_tables:
                err(f"module {mkey}: table '{tname}' also defined by module '{all_module_tables[tname]}'")
            all_module_tables[tname] = mkey
        for target in mod.get("records_targets", []):
            if target not in mod.get("tables", {}):
                err(f"module {mkey}: records_target '{target}' is not one of the module's own tables")
    for mkey, mod in opt_mods.items():
        visible = dict(core_tables)
        visible.update(mod.get("tables", {}))
        for dep in mod.get("requires", {}).get("modules", []):
            visible.update(opt_mods.get(dep, {}).get("tables", {}))
        module_groups = canonical_groups | set(mod.get("allowed_value_groups", []))
        module_used = set()
        for tname, tdef in mod.get("tables", {}).items():
            cols = check_table(f"module {mkey}.", tname, tdef, expected_pk=f"{tname}_ID")
            check_references(f"module {mkey}.", tname, cols, visible)
            check_vocabulary(f"module {mkey}.", tname, cols, module_groups, module_used)
        for g in mod.get("allowed_value_groups", []):
            if g not in module_used:
                err(f"module {mkey}: declares value group '{g}' that none of its columns uses")
        used_groups |= module_used
    for g in sorted(canonical_groups - used_groups):
        err(f"canonical value group '{g}' is not used by any column")

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
