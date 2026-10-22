#!/usr/bin/env python3
"""Generate CREATE TABLE statements from udm_schema.json for one SQL dialect.

The specification names no database engine. Column types are the abstract
vocabulary (ID, Money, Date, ...), and types.dialects maps every abstract
type to a native type per engine. This script resolves one mapping into
DDL: tables, columns, NOT NULL, primary keys, CHECK constraints for closed
vocabularies, foreign keys, column comments carrying each description, and
every table rule a single-row CHECK or a UNIQUE constraint can express
(exclusive-or, at-least-one, at-most-one, same-row conditional-required,
unique scopes). Those come from the structured form of each constraint.

What it cannot emit it lists at the end of the output, table by table:
the cross-row rules, the derivation rules, polymorphic attachment
enforcement, and the Lifecycle_Stage chain behaviour. The specification
states those rules and leaves the enforcement mechanism (triggers,
application code, scheduled checks) to the adopter; the list is what the
adopter still owes. Indexes are not emitted. This is a reference
implementation under the code license, not part of the standard.

Usage:
  generate_ddl.py --dialect mysql
  generate_ddl.py --dialect postgresql --modules governance,compliance_protocols
  generate_ddl.py --dialect postgresql --all-modules
  generate_ddl.py --list-dialects

Output goes to stdout. Dependency-free.
"""

import argparse
import json
import sys
from pathlib import Path

SCHEMA_PATH = Path(__file__).resolve().parent.parent / "udm_schema.json"

# Per-dialect syntax. Everything else comes from the schema's type mapping.
DIALECTS = {
    "mysql": {
        "quote": lambda name: f"`{name}`",
        "literal": lambda text: "'" + text.replace("\\", "\\\\").replace("'", "''") + "'",
        "comment_inline": True,      # ... COMMENT 'text' on the column
        "comment_statement": False,
        "table_suffix": " ENGINE=InnoDB",
    },
    "postgresql": {
        "quote": lambda name: f'"{name}"',
        "literal": lambda text: "'" + text.replace("'", "''") + "'",
        "comment_inline": False,
        "comment_statement": True,   # COMMENT ON COLUMN ... IS 'text'
        "table_suffix": "",
    },
}


def specified_tables(schema, modules):
    """(name, definition, origin) for core, implementation, and declared module tables, in file order."""
    out = []
    for mkey, mod in schema["modules"]["core"].items():
        for tname, tdef in mod["tables"].items():
            out.append((tname, tdef, f"core module {mod['name']}"))
    for tname, tdef in schema["implementation_tables"]["tables"].items():
        out.append((tname, tdef, "implementation table"))
    om = schema["modules"]["optional"]
    for mkey in modules:
        if mkey not in om:
            raise SystemExit(f"FATAL: '{mkey}' is not a specified optional module (have: {', '.join(om)})")
        for tname, tdef in om[mkey]["tables"].items():
            out.append((tname, tdef, f"optional module {om[mkey]['name']}"))
    return out


def resolve(mapping, abstract):
    if abstract not in mapping:
        raise SystemExit(f"FATAL: dialect has no mapping for abstract type '{abstract}'")
    return mapping[abstract]


def column_ddl(cname, cdef, mapping, syn):
    parts = [syn["quote"](cname), resolve(mapping, cdef["type"])]
    if cdef.get("required") or cdef.get("primary_key"):
        parts.append("NOT NULL")
    if "default" in cdef and cdef["default"] is not None:
        dv = cdef["default"]
        parts.append("DEFAULT " + (syn["literal"](dv) if isinstance(dv, str) else ("TRUE" if dv is True else "FALSE" if dv is False else str(dv))))
    if syn["comment_inline"] and cdef.get("description"):
        parts.append("COMMENT " + syn["literal"](cdef["description"]))
    return " ".join(parts)


def is_plain_column(expr, cols):
    return isinstance(expr, str) and expr in cols


def value_literal(syn, value):
    """A SQL literal for a string, boolean, or number taken from the schema."""
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return syn["literal"](str(value))


def rule_ddl(tname, index, constraint, cols, syn, dialect):
    """Table-level DDL for one structured rule, or None when a single row cannot express it.

    Returns (inline_clause, after_statement): the clause goes inside CREATE TABLE,
    the statement runs after it (partial unique indexes)."""
    st = constraint.get("structured")
    if not st:
        return None
    q = syn["quote"]
    name = q(f"ck_{tname}_{index}")
    kind = st.get("type")
    names = st.get("columns", [])
    if kind in ("xor", "at_least_one_of", "at_most_one_of"):
        if not names or not all(is_plain_column(c, cols) for c in names):
            return None
        count = " + ".join(f"CASE WHEN {q(c)} IS NOT NULL THEN 1 ELSE 0 END" for c in names)
        op = {"xor": "= 1", "at_least_one_of": ">= 1", "at_most_one_of": "<= 1"}[kind]
        return (f"CONSTRAINT {name} CHECK (({count}) {op})", None)
    if kind == "conditional_required" and "condition_column" in st:
        cond, vals, req = st["condition_column"], st.get("condition_values", []), st.get("required_columns", [])
        if not (is_plain_column(cond, cols) and vals and req and all(is_plain_column(c, cols) for c in req)):
            return None
        in_list = ", ".join(value_literal(syn, v) for v in vals)
        required = " AND ".join(f"{q(c)} IS NOT NULL" for c in req)
        return (f"CONSTRAINT {name} CHECK ({q(cond)} IS NULL OR {q(cond)} NOT IN ({in_list}) OR ({required}))", None)
    if kind == "unique_scope":
        if not names or not all(is_plain_column(c, cols) for c in names):
            return None
        cond = st.get("condition")
        if not cond:
            return (f"CONSTRAINT {name} UNIQUE (" + ", ".join(q(c) for c in names) + ")", None)
        if dialect == "postgresql":
            return (None, f"CREATE UNIQUE INDEX {q(f'ux_{tname}_{index}')} ON {q(tname)} (" + ", ".join(q(c) for c in names) + f") WHERE {cond};")
        return None  # MySQL has no partial unique index; the rule is listed as owed
    return None


def table_ddl(tname, tdef, origin, audit, mapping, syn, dialect, owed):
    q = syn["quote"]
    cols = {**tdef["columns"], **audit}
    lines = [column_ddl(c, d, mapping, syn) for c, d in cols.items()]
    pks = [c for c, d in tdef["columns"].items() if d.get("primary_key")]
    if pks:
        lines.append("PRIMARY KEY (" + ", ".join(q(c) for c in pks) + ")")
    for c, d in cols.items():
        av = d.get("allowed_values")
        if av:
            lines.append(f"CONSTRAINT {q('ck_' + tname + '_' + c)} CHECK ({q(c)} IN (" + ", ".join(syn["literal"](v) for v in av) + "))")
    after = []
    for i, c in enumerate(tdef.get("constraints", []), start=1):
        emitted = rule_ddl(tname, i, c, cols, syn, dialect)
        if emitted is None:
            owed.setdefault(tname, []).append(("rule", c["rule"]))
            continue
        clause, statement = emitted
        if clause:
            lines.append(clause)
        if statement:
            after.append(statement)
    for c, d in tdef["columns"].items():
        if d.get("derived"):
            owed.setdefault(tname, []).append(("derived", f"{c}: {d['derived']['rule']} Recompute: {d['derived']['recompute_triggers']}"))
    body = ",\n  ".join(lines)
    out = [f"-- {tname}: {origin}", f"CREATE TABLE {q(tname)} (\n  {body}\n){syn['table_suffix']};"] + after
    if syn["comment_statement"]:
        if tdef.get("description"):
            out.append(f"COMMENT ON TABLE {q(tname)} IS {syn['literal'](tdef['description'])};")
        for c, d in cols.items():
            if d.get("description"):
                out.append(f"COMMENT ON COLUMN {q(tname)}.{q(c)} IS {syn['literal'](d['description'])};")
    return "\n".join(out)


def foreign_keys(tables, audit, syn):
    """One ALTER TABLE per foreign key, emitted after every table exists, so creation order and cycles do not matter."""
    q = syn["quote"]
    names = {t for t, _, _ in tables}
    out = []
    for tname, tdef, _ in tables:
        cols = {**tdef["columns"], **audit}
        for c, d in cols.items():
            ref = d.get("references")
            if not ref:
                continue
            if ref["table"] not in names:
                out.append(f"-- {tname}.{c} references {ref['table']}.{ref['column']}, which is not in this output (undeclared module); no constraint emitted")
                continue
            out.append(f"ALTER TABLE {q(tname)} ADD CONSTRAINT {q('fk_' + tname + '_' + c)} "
                       f"FOREIGN KEY ({q(c)}) REFERENCES {q(ref['table'])} ({q(ref['column'])});")
    return "\n".join(out)


def generate(schema, dialect, modules):
    if dialect not in DIALECTS:
        raise SystemExit(f"FATAL: unknown dialect '{dialect}' (have: {', '.join(DIALECTS)})")
    mapping = schema["types"]["dialects"].get(dialect)
    if mapping is None:
        raise SystemExit(f"FATAL: udm_schema.json has no type mapping for dialect '{dialect}'")
    syn = DIALECTS[dialect]
    audit = schema["conventions"]["audit_columns"]["columns"]
    tables = specified_tables(schema, modules)
    meta = schema["metadata"]
    head = [
        f"-- {meta['name']} {meta['version']} ({meta['released']}): {dialect} DDL generated by scripts/generate_ddl.py",
        f"-- Tables: {len(tables)} (core, implementation" + (f", modules: {', '.join(modules)}" if modules else "") + ")",
        "-- Single-row rules and unique scopes are emitted as constraints. The rules this file cannot",
        "-- express are listed at the end; the enforcement mechanism for those is the adopter's choice.",
        "",
    ]
    owed = {}
    body = [table_ddl(t, d, o, audit, mapping, syn, dialect, owed) for t, d, o in tables]
    tail = ["", "-- Rules this DDL does not enforce. The specification states them; enforce each with a trigger,",
            "-- application code, or a scheduled check. Polymorphic attachment enforcement and the",
            "-- Lifecycle_Stage chain behaviour (conventions.polymorphic_attachment, conventions.lifecycle_stage)",
            f"-- apply as well. Tables with owed rules: {len(owed)}; rules owed: {sum(len(v) for v in owed.values())}."]
    for tname, items in owed.items():
        tail.append(f"-- {tname}")
        for kind, text in items:
            tail.append(f"--   [{kind}] {text}")
    return "\n".join(head) + "\n\n".join(body) + "\n\n-- Foreign keys\n" + foreign_keys(tables, audit, syn) + "\n" + "\n".join(tail) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Generate DDL from udm_schema.json for one dialect.")
    parser.add_argument("--schema", default=str(SCHEMA_PATH))
    parser.add_argument("--dialect", help="a key of types.dialects in the schema")
    parser.add_argument("--modules", default="", help="comma-separated optional modules to include")
    parser.add_argument("--all-modules", action="store_true", help="include every optional module")
    parser.add_argument("--list-dialects", action="store_true")
    args = parser.parse_args()
    schema = json.loads(Path(args.schema).read_text())
    if args.list_dialects:
        print("\n".join(schema["types"]["dialects"]))
        return 0
    if not args.dialect:
        parser.error("--dialect is required")
    modules = list(schema["modules"]["optional"]) if args.all_modules else [m for m in args.modules.split(",") if m]
    sys.stdout.write(generate(schema, args.dialect, modules))
    return 0


if __name__ == "__main__":
    sys.exit(main())
