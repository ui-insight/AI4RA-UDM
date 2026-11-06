#!/usr/bin/env python3
"""
Check glossary.json against udm_schema.json.

Fails when:
  - a term's "udm" reference names a table, column, or value the schema lacks
  - a status value on a lifecycle column has no glossary term
  - terms are duplicated, unsorted, missing a field, or in an undeclared domain
  - a definition states a dollar amount or a year
  - dashboard/src/data/glossary.ts is out of date

References use the forms Table, Table.Column, and Table.Column=Value.
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_glossary import ROOT, SOURCE, TS_OUT, render_ts  # noqa: E402

# Definitions say what a thing is. Amounts and dates change, so they stay in the cited source.
SPECIFICS = re.compile(r"\$\d|\b(?:19|20)\d{2}\b")

LIFECYCLE_COLUMNS = [
    ("Proposal", "Internal_Approval_Status"),
    ("Proposal", "Submission_Status"),
    ("Proposal", "Decision_Status"),
    ("Award", "Award_Status"),
    ("Subaward", "Subaward_Status"),
    ("PreAwardAuthorization", "Authorization_Status"),
    ("Modification", "Approval_Status"),
    ("Payment", "Lifecycle_Stage"),
    ("Payment", "Payment_Status"),
    ("Report", "Report_Status"),
    ("Action", "Action_Status"),
]


def collect_tables(node, tables):
    """Find every table definition in the schema."""
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, dict) and isinstance(value.get("columns"), dict):
                tables[key] = value
            collect_tables(value, tables)
    elif isinstance(node, list):
        for value in node:
            collect_tables(value, tables)


def column_values(column):
    return set(column.get("allowed_values") or []) | set(column.get("recommended_values") or [])


def check_reference(ref, tables):
    """Return an error message for a bad reference, or None."""
    target, _, value = ref.partition("=")
    table, _, column = target.partition(".")
    if table not in tables:
        return f"unknown table {table}"
    if not column:
        return None
    if column not in tables[table]["columns"]:
        return f"unknown column {table}.{column}"
    if value and value not in column_values(tables[table]["columns"][column]):
        return f"unknown value {table}.{column}={value}"
    return None


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    schema = json.loads((ROOT / "udm_schema.json").read_text(encoding="utf-8"))
    tables = {}
    collect_tables(schema, tables)
    errors = []
    names = [t["term"] for t in data["terms"]]
    for name in sorted({n for n in names if names.count(n) > 1}):
        errors.append(f"duplicate term: {name}")
    if names != sorted(names, key=str.lower):
        errors.append("terms are not sorted by name")
    referenced = set()
    for term in data["terms"]:
        for field in ("term", "definition", "domain"):
            if not term.get(field):
                errors.append(f"{term.get('term', '?')}: missing {field}")
        if term.get("domain") not in data["domains"]:
            errors.append(f"{term['term']}: undeclared domain {term.get('domain')}")
        if "—" in json.dumps(term, ensure_ascii=False):
            errors.append(f"{term['term']}: contains an em dash")
        if SPECIFICS.search(term.get("definition", "")):
            errors.append(f"{term['term']}: states an amount or year; define it and point to the source instead")
        for ref in term.get("udm", []):
            problem = check_reference(ref, tables)
            if problem:
                errors.append(f"{term['term']}: {problem}")
            referenced.add(ref)
    for table, column in LIFECYCLE_COLUMNS:
        for value in tables[table]["columns"][column].get("allowed_values", []):
            if f"{table}.{column}={value}" not in referenced:
                errors.append(f"no glossary term for {table}.{column}={value}")
    if TS_OUT.read_text(encoding="utf-8") != render_ts(data):
        errors.append("dashboard/src/data/glossary.ts is out of date; run scripts/generate_glossary.py")
    for error in errors:
        print(f"GLOSSARY: {error}")
    print(f"check_glossary: {len(names)} terms, {len(errors)} problem(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
