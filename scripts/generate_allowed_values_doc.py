#!/usr/bin/env python3
"""Write vignettes/allowedvalues.md from udm_schema.json.

The lists in that document come from the schema, so they can't drift from it.
Run with --check to fail if the document is out of date instead of writing it.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "udm_schema.json"
OUTPUT = ROOT / "vignettes" / "allowedvalues.md"

INTRO = """# AllowedValues and fixed lists

This document is generated from `udm_schema.json` by `scripts/generate_allowed_values_doc.py`. Change the schema, then run the script.

The UDM controls the values of a column in one of two ways.

**Fixed lists** are the same at every institution. They define the model, so an institution can't add to them. They are enforced with a CHECK constraint or ENUM. Statuses and columns ending in `_Type` are fixed lists.

**AllowedValues lists** can vary by institution. Each list is a `Value_Group` in the `AllowedValues` table, and institutions can add values to it. A local value can set `Canonical_Value_Code` to the recommended value it corresponds to, so institutions stay comparable. Columns ending in `_Value_ID` use these lists.

**Which to use:** use a fixed list when a value changes what a rule does or has to mean the same thing everywhere. Use AllowedValues when institutions legitimately differ and no rule depends on a local value.
"""


def collect(schema):
    """Yield (module name, table name, table definition) for every table."""
    for module in schema["modules"]["core"].values():
        for name, table in module["tables"].items():
            yield module["name"], name, table
    for module in schema["modules"]["optional"].values():
        for name, table in module["tables"].items():
            yield f'{module["name"]} (optional)', name, table
    for name, table in schema.get("implementation_tables", {}).items():
        if isinstance(table, dict) and "columns" in table:
            yield "Implementation", name, table


def render(schema):
    groups = {}
    fixed = {}
    for module, table_name, table in collect(schema):
        for column_name, column in table["columns"].items():
            group = column.get("value_group")
            if group:
                entry = groups.setdefault(group, {"columns": [], "values": []})
                entry["columns"].append(f"{table_name}.{column_name}")
                for value in column.get("recommended_values") or []:
                    if value not in entry["values"]:
                        entry["values"].append(value)
            elif column.get("allowed_values"):
                fixed.setdefault(module, []).append((table_name, column_name, column["allowed_values"]))

    lines = [INTRO, "## AllowedValues lists", ""]
    lines += ["| Value_Group | Used by | Recommended values |", "|---|---|---|"]
    for name in sorted(groups):
        entry = groups[name]
        values = ", ".join(f"`{value}`" for value in entry["values"]) or "None. Institutions define their own"
        columns = ", ".join(f"`{column}`" for column in entry["columns"])
        lines.append(f"| {name} | {columns} | {values} |")

    lines += ["", "## Fixed lists", ""]
    for module, columns in fixed.items():
        lines += [f"### {module}", "", "| Column | Values |", "|---|---|"]
        for table_name, column_name, values in columns:
            rendered = ", ".join(f"`{value}`" for value in values)
            lines.append(f"| `{table_name}.{column_name}` | {rendered} |")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main():
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    document = render(schema)
    if "--check" in sys.argv[1:]:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if current != document:
            print("vignettes/allowedvalues.md is out of date; run scripts/generate_allowed_values_doc.py")
            return 1
        print("allowedvalues.md is up to date")
        return 0
    OUTPUT.write_text(document, encoding="utf-8")
    print("wrote vignettes/allowedvalues.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
