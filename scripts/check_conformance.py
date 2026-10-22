#!/usr/bin/env python3
"""Check a conformance declaration against udm_schema.json.

A declaration describes the shape a consumer reads from an implementation
or a data provider (see vignettes/udm-v2-conformance.md). Dependency-free.

Two profiles:

- implementation: a System of Record. Carries every core table plus the
  tables of each declared optional module.
- provider: a source system's export. Carries a declared subset of tables,
  with provenance (Source_System, Source_Record_ID) on every row.

Checks, for every specified table the declaration carries:

1. Columns: exactly the specified columns plus the universal audit columns.
   Added columns are an encapsulation violation; extend with new tables.
2. Per column: type family, required flag, primary key, foreign-key target,
   closed vocabulary.
3. Modules: dependencies declared, minimum core version met, no module
   table carried without declaring its module, Related_Entity_Type lists
   extended only through declared Records targets.

Rules a declaration cannot show (the constraints on each table, the
derivation rules on columns, the minimum conformance behavior under
conventions.polymorphic_attachment.enforcement) are attested by the
declarer through `rules_attested`; they are not verified here.

Usage:
  check_conformance.py DECLARATION.json [--schema PATH]
  check_conformance.py --template [--profile P] [--modules a,b] [--tables T,U]
  check_conformance.py --self-check

Exit status: 0 = conforms, 1 = does not conform.
"""

import argparse
import json
import re
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "udm_schema.json"

PROFILES = ("implementation", "provider")
DECLARED_KEYS = ("type", "required", "primary_key", "references", "allowed_values")
PROVENANCE_COLUMNS = ("Source_System", "Source_Record_ID")
POLYMORPHIC_TYPE_COLUMN = "Related_Entity_Type"

# The spec's abstract type vocabulary plus common native type names, by family.
# Length, precision, and scale are outside the spec and are not compared.
TYPE_FAMILIES = {
    "id": ("ID",),
    "uuid": ("UUID", "UNIQUEIDENTIFIER"),
    "boolean": ("BOOLEAN", "BOOL", "BIT"),
    "timestamp": ("TIMESTAMP", "DATETIME", "DATETIME2", "DATETIMEOFFSET", "TIMESTAMPTZ",
                  "TIMESTAMP_NTZ", "TIMESTAMP_LTZ", "TIMESTAMP_TZ"),
    "date": ("DATE",),
    "decimal": ("MONEY", "PERCENT", "QUANTITY", "DECIMAL", "NUMERIC", "NUMBER"),
    "integer": ("COUNT", "LARGECOUNT", "INT", "INTEGER", "BIGINT", "SMALLINT", "TINYINT"),
    "string": ("SHORTCODE", "SHORTNAME", "MEDIUMNAME", "LONGNAME", "URL", "LONGTEXT", "STATUS", "HASH",
               "VARCHAR", "NVARCHAR", "VARCHAR2", "NVARCHAR2", "CHAR", "NCHAR", "TEXT",
               "STRING", "CLOB", "NCLOB", "MEDIUMTEXT"),
}
FAMILY_BY_NAME = {name: family for family, names in TYPE_FAMILIES.items() for name in names}
# An ID maps to VARCHAR, UUID, or BIGINT depending on platform and ID strategy.
ID_FAMILIES = {"id", "uuid", "string", "integer"}

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def type_family(type_name):
    if not isinstance(type_name, str):
        return None
    compact = type_name.upper().replace(" ", "")
    if compact.startswith("TINYINT(1)"):
        return "boolean"
    head = re.match(r"[A-Z0-9_]+", compact)
    return FAMILY_BY_NAME.get(head.group(0)) if head else None


def version_tuple(version):
    try:
        return tuple(int(part) for part in str(version).split(".")[:3])
    except ValueError:
        return None


def is_id_column(cname, cdef):
    return bool(cdef.get("primary_key")) or "references" in cdef or cname.endswith("_ID")


def reference_pair(cdef):
    ref = cdef.get("references")
    if isinstance(ref, dict):
        return (ref.get("table"), ref.get("column"))
    return None


def optional_modules(schema):
    return schema["modules"]["optional"]


def specified_tables(schema, modules):
    """Tables a declaration is checked against: core, implementation, declared modules."""
    out = {}
    for mkey, mod in schema["modules"]["core"].items():
        for tname, tdef in mod["tables"].items():
            out[tname] = (tdef, f"core {mkey}")
    for tname, tdef in schema["implementation_tables"]["tables"].items():
        out[tname] = (tdef, "implementation")
    om = optional_modules(schema)
    for mkey in modules:
        for tname, tdef in om.get(mkey, {}).get("tables", {}).items():
            out[tname] = (tdef, f"module {mkey}")
    return out


def expected_columns(tdef, audit):
    return {**audit, **tdef.get("columns", {})}


def check_column(tname, cname, spec, decl, profile, records_targets):
    where = f"{tname}.{cname}"
    if not isinstance(decl, dict):
        err(f"{where}: column entry must be an object")
        return

    # --- Type family ---
    if "type" not in decl:
        err(f"{where}: missing 'type'")
    else:
        family = type_family(decl["type"])
        if family is None:
            warn(f"{where}: type '{decl['type']}' not recognized; type family not checked")
        elif is_id_column(cname, spec):
            if family not in ID_FAMILIES:
                err(f"{where}: identifier column declared as '{decl['type']}'")
        elif family != type_family(spec.get("type")):
            err(f"{where}: type '{decl['type']}' does not match specified type '{spec.get('type')}'")

    # --- Required flag ---
    spec_required = bool(spec.get("required"))
    decl_required = bool(decl.get("required"))
    if profile == "provider" and cname in PROVENANCE_COLUMNS:
        if not decl_required:
            err(f"{where}: a provider must mark provenance columns required")
    elif spec_required and not decl_required:
        err(f"{where}: required by the specification but declared optional")
    elif decl_required and not spec_required and profile == "implementation":
        warn(f"{where}: optional in the specification but declared required")

    # --- Keys ---
    if bool(spec.get("primary_key")) != bool(decl.get("primary_key")):
        err(f"{where}: primary_key flag disagrees with the specification")
    if reference_pair(spec) != reference_pair(decl):
        want, got = reference_pair(spec), reference_pair(decl)
        want_s = f"{want[0]}.{want[1]}" if want else "no reference"
        got_s = f"{got[0]}.{got[1]}" if got else "no reference"
        err(f"{where}: references {got_s}; the specification has {want_s}")

    # --- Closed vocabulary ---
    spec_values = spec.get("allowed_values")
    decl_values = decl.get("allowed_values")
    if spec_values is None:
        if decl_values and profile == "implementation":
            warn(f"{where}: declares a closed vocabulary the specification leaves open")
        return
    if not isinstance(decl_values, list):
        err(f"{where}: closed vocabulary not declared")
        return
    added = set(decl_values) - set(spec_values)
    missing = set(spec_values) - set(decl_values)
    if cname == POLYMORPHIC_TYPE_COLUMN:
        added -= records_targets
    if added:
        err(f"{where}: extends a closed vocabulary with {sorted(added)}")
    if missing and profile == "implementation":
        err(f"{where}: closed vocabulary is missing {sorted(missing)}")


def check_table(tname, spec_tdef, decl_tdef, audit, profile, records_targets):
    cols = decl_tdef.get("columns") if isinstance(decl_tdef, dict) else None
    if not isinstance(cols, dict) or not cols:
        err(f"{tname}: columns must be a non-empty object")
        return
    expected = expected_columns(spec_tdef, audit)
    for cname in expected:
        if cname not in cols:
            err(f"{tname}: missing column '{cname}'")
    for cname in cols:
        if cname not in expected:
            err(f"{tname}: column '{cname}' is not in the specification (encapsulation violation)")
    for cname, spec in expected.items():
        if cname in cols:
            check_column(tname, cname, spec, cols[cname], profile, records_targets)


def check(decl, schema):
    """Run every check. Returns the claim the declaration supports."""
    info = decl.get("conformance_declaration")
    if not isinstance(info, dict):
        err("missing required top-level key: conformance_declaration")
        return None
    tables = decl.get("tables")
    if not isinstance(tables, dict) or not tables:
        err("tables must be a non-empty object")
        return None

    profile = info.get("profile")
    if profile not in PROFILES:
        err(f"profile must be one of {list(PROFILES)}")
        return None

    # --- Version ---
    spec_version = schema["metadata"]["version"]
    spec_tuple = version_tuple(spec_version)
    if spec_tuple is None or len(spec_tuple) < 2:
        err(f"schema metadata.version '{spec_version}' is not a version")
        return None
    declared = version_tuple(info.get("udm_version"))
    if declared is None or len(declared) < 2:
        err("udm_version must be a version such as '2.3.0'")
    elif declared[:2] != spec_tuple[:2]:
        err(f"declaration targets UDM {info.get('udm_version')}; checked against {spec_version}")

    # --- Modules: existence, dependencies, minimum core version ---
    om = optional_modules(schema)
    modules = info.get("modules", [])
    if not isinstance(modules, list):
        err("modules must be a list")
        modules = []
    for mkey in modules:
        if mkey not in om:
            err(f"module '{mkey}' is not a specified optional module")
            continue
        requires = om[mkey].get("requires", {})
        for dep in requires.get("modules", []):
            if dep not in modules:
                err(f"module '{mkey}' requires module '{dep}', which is not declared")
        minimum = re.match(r">=\s*(\S+)", requires.get("core", ""))
        floor = version_tuple(minimum.group(1)) if minimum else None
        if floor and spec_tuple < floor:
            err(f"module '{mkey}' requires core {requires['core']}")
    modules = [m for m in modules if m in om]

    module_owner = {t: mkey for mkey, mod in om.items() for t in mod.get("tables", {})}
    records_targets = {t for mkey in modules for t in om[mkey].get("records_targets", [])}
    audit = schema["conventions"]["audit_columns"]["columns"]
    spec = specified_tables(schema, modules)

    # --- Tables ---
    carried, local = [], []
    for tname, decl_tdef in tables.items():
        if tname in spec:
            carried.append(tname)
            check_table(tname, spec[tname][0], decl_tdef, audit, profile, records_targets)
        elif tname in module_owner:
            err(f"{tname}: belongs to optional module '{module_owner[tname]}', which is not declared")
        else:
            local.append(tname)
    if profile == "implementation":
        for tname, (_, origin) in spec.items():
            if tname not in tables:
                err(f"missing table '{tname}' ({origin})")
    elif not carried:
        err("a provider must carry at least one specified table")

    # --- Foreign keys agree in type family with the key they reference ---
    for tname in carried:
        cols = tables[tname].get("columns") if isinstance(tables[tname], dict) else None
        if not isinstance(cols, dict):
            continue
        for cname, cdef in cols.items():
            ref = reference_pair(cdef) if isinstance(cdef, dict) else None
            if not ref or not isinstance(tables.get(ref[0]), dict):
                continue
            target = tables[ref[0]].get("columns", {}).get(ref[1])
            if not isinstance(target, dict):
                continue
            here, there = type_family(cdef.get("type")), type_family(target.get("type"))
            if here and there and "id" not in (here, there) and here != there:
                err(f"{tname}.{cname}: type '{cdef.get('type')}' differs from the key it references "
                    f"({ref[0]}.{ref[1]}: '{target.get('type')}')")

    # --- Attestation ---
    if info.get("rules_attested") is not True:
        err("rules_attested must be true: the declarer attests the rules a declaration cannot show")

    version = ".".join(str(n) for n in spec_tuple[:2])
    with_modules = f" + modules: {', '.join(modules)}" if modules else ""
    if profile == "implementation":
        claim = f"AI4RA UDM {version} core{with_modules}"
    else:
        claim = f"AI4RA UDM {version} provider{with_modules}: {', '.join(sorted(carried))}"
    if local:
        claim += f"\n  local extension tables (not checked): {', '.join(sorted(local))}"
    return claim


def template(schema, profile, modules, table_names):
    """A declaration that mirrors the specification, for the declarer to edit."""
    audit = schema["conventions"]["audit_columns"]["columns"]
    spec = specified_tables(schema, modules)
    names = table_names if profile == "provider" else list(spec)
    tables = {}
    for tname in names:
        if tname not in spec:
            raise SystemExit(f"FATAL: '{tname}' is not a core table or a table of a declared module")
        cols = {}
        for cname, cdef in expected_columns(spec[tname][0], audit).items():
            entry = {k: cdef[k] for k in DECLARED_KEYS if k in cdef}
            if profile == "provider" and cname in PROVENANCE_COLUMNS:
                entry["required"] = True
            cols[cname] = entry
        tables[tname] = {"columns": cols}
    return {
        "conformance_declaration": {
            "udm_version": schema["metadata"]["version"],
            "profile": profile,
            "declarer": "",
            "product": "",
            "modules": modules,
            "rules_attested": False,
        },
        "tables": tables,
    }


def self_check(schema):
    """The specification must conform to itself under both profiles."""
    all_modules = list(optional_modules(schema))
    cases = [
        ("implementation, core only", "implementation", [], None),
        ("implementation, all modules", "implementation", all_modules, None),
        ("provider, every table", "provider", all_modules, list(specified_tables(schema, all_modules))),
    ]
    failed = 0
    for label, profile, modules, table_names in cases:
        errors.clear()
        warnings.clear()
        decl = template(schema, profile, modules, table_names)
        decl["conformance_declaration"]["rules_attested"] = True
        check(decl, schema)
        print(f"{'ok  ' if not errors else 'FAIL'} {label}")
        for e in errors:
            print(f"  ERROR: {e}")
        failed += bool(errors)
    print(f"\ncheck_conformance self-check: {failed} failing case(s)")
    return 1 if failed else 0


def report(claim):
    for w in warnings:
        print(f"WARN: {w}")
    for e in errors:
        print(f"ERROR: {e}")
    n_err = len(errors)
    print(f"\ncheck_conformance: {n_err} error(s), {len(warnings)} warning(s)")
    if n_err or claim is None:
        print("DOES NOT CONFORM")
        return 1
    print(f"CONFORMS: {claim}")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Check a UDM conformance declaration.")
    parser.add_argument("declaration", nargs="?", help="path to a conformance declaration (JSON)")
    parser.add_argument("--schema", default=str(SCHEMA_PATH), help="path to udm_schema.json")
    parser.add_argument("--template", action="store_true", help="print a declaration template")
    parser.add_argument("--profile", choices=PROFILES, default="implementation")
    parser.add_argument("--modules", default="", help="comma-separated optional modules")
    parser.add_argument("--tables", default="", help="comma-separated tables (provider template)")
    parser.add_argument("--self-check", action="store_true",
                        help="verify the specification conforms to itself")
    args = parser.parse_args()

    try:
        schema = json.loads(Path(args.schema).read_text())
    except (OSError, json.JSONDecodeError) as e:
        print(f"FATAL: cannot read schema {args.schema}: {e}")
        return 1

    if args.self_check:
        return self_check(schema)

    if args.template:
        modules = [m for m in args.modules.split(",") if m]
        table_names = [t for t in args.tables.split(",") if t]
        if args.profile == "provider" and not table_names:
            parser.error("--template --profile provider requires --tables")
        print(json.dumps(template(schema, args.profile, modules, table_names), indent=2))
        return 0

    if not args.declaration:
        parser.error("a declaration path is required")
    try:
        decl = json.loads(Path(args.declaration).read_text())
    except (OSError, json.JSONDecodeError) as e:
        print(f"FATAL: cannot read declaration {args.declaration}: {e}")
        return 1
    if not isinstance(decl, dict):
        print("FATAL: declaration must be a JSON object")
        return 1
    return report(check(decl, schema))


if __name__ == "__main__":
    sys.exit(main())
