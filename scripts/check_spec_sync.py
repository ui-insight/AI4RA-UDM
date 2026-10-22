#!/usr/bin/env python3
"""Verify that the prose spec and the JSON serialization agree.

Compares vignettes/udm-v2-system-of-record.md against udm_schema.json:

1. Table sets match: every JSON table has a `#### TableName` section in the
   prose, and every prose table section names a JSON table.
2. Column sets match per table: the first markdown column table in each
   prose section lists the same column names as the JSON entry.

Universal audit columns are excluded from the comparison on both sides
(the prose documents them once, centrally). Dependency-free.

Exit status: 0 = in sync, 1 = drift found.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "udm_schema.json"
PROSE_PATH = ROOT / "vignettes" / "udm-v2-system-of-record.md"

AUDIT_COLUMNS = {
    "Created_At",
    "Updated_At",
    "Created_By_Personnel_ID",
    "Updated_By_Personnel_ID",
    "Source_System",
    "Source_Record_ID",
    "Is_Active",
}


def parse_prose(text, table_names):
    """Return {table: set(columns)} for every #### heading naming a JSON table."""
    sections = {}
    heading_re = re.compile(r"^####\s+`?(\w+)`?\s*$", re.M)
    matches = list(heading_re.finditer(text))
    for i, m in enumerate(matches):
        name = m.group(1)
        if name not in table_names:
            continue
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[m.end():end]
        cols = parse_first_column_table(body)
        if cols is not None:
            sections[name] = cols
    return sections


def parse_first_column_table(body):
    """Extract first-cell values from the first markdown table whose header row
    starts with 'Column'. Returns a set, or None if no such table exists."""
    lines = body.splitlines()
    cols = set()
    in_table = False
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("|"):
            if in_table:
                break
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        first = cells[0].strip("`* ")
        if not in_table:
            if first.lower() == "column":
                in_table = True
            continue
        if set(first) <= {"-", ":", " "}:  # separator row
            continue
        if first:
            cols.add(first)
    return cols if in_table else None


def compare(tables, prose_text, label, drift):
    """Compare a {table: {columns}} dict against one prose document. Returns matched count."""
    prose_sections = parse_prose(prose_text, set(tables))
    for tname in sorted(tables):
        json_cols = set(tables[tname]["columns"]) - AUDIT_COLUMNS
        if tname not in prose_sections:
            drift.append(f"[{label}] {tname}: no `#### {tname}` column-table section found")
            continue
        prose_cols = prose_sections[tname] - AUDIT_COLUMNS
        for c in sorted(json_cols - prose_cols):
            drift.append(f"[{label}] {tname}.{c}: in JSON, missing from prose")
        for c in sorted(prose_cols - json_cols):
            drift.append(f"[{label}] {tname}.{c}: in prose, missing from JSON")
    return len(prose_sections)


def main():
    schema = json.loads(SCHEMA_PATH.read_text())
    drift = []

    matched = compare(schema["tables"], PROSE_PATH.read_text(), "core", drift)
    total = len(schema["tables"])

    modules_dir = ROOT / "vignettes" / "modules"
    for mkey, mod in schema.get("optional_modules", {}).get("modules", {}).items():
        mpath = modules_dir / (mkey.replace("_", "-") + ".md")
        if not mpath.exists():
            drift.append(f"[{mkey}] module vignette missing: {mpath.name}")
            total += len(mod["tables"])
            continue
        matched += compare(mod["tables"], mpath.read_text(), mkey, drift)
        total += len(mod["tables"])

    for d in drift:
        print(f"DRIFT: {d}")
    n = len(drift)
    print(f"\ncheck_spec_sync: {matched}/{total} tables matched in prose, {n} drift finding(s)")
    return 1 if n else 0


if __name__ == "__main__":
    sys.exit(main())
