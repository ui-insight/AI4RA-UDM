#!/usr/bin/env python3
"""
Build the glossary outputs from glossary.json, the single source of terms.

Writes:
  - dashboard/src/data/glossary.ts: the data behind the dashboard's Glossary tab
  - docs/data/glossary.csv: a spreadsheet copy served with the site

Edit glossary.json and run this script. Do not edit the outputs by hand.
"""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "glossary.json"
TS_OUT = ROOT / "dashboard" / "src" / "data" / "glossary.ts"
CSV_OUT = ROOT / "docs" / "data" / "glossary.csv"

TS_HEADER = """// Generated from glossary.json by scripts/generate_glossary.py. Do not edit by hand.

export interface GlossaryTerm {
  term: string;
  also: string;
  definition: string;
  domain: string;
  udm: string[];
  source: string;
  sourceUrl: string;
}
"""


def render_ts(data):
    """Return the text of the TypeScript data file."""
    domains = ",\n".join(f"  {json.dumps(d, ensure_ascii=False)}" for d in data["domains"])
    rows = "\n".join(
        "  " + json.dumps(
            {
                "term": t["term"],
                "also": t.get("also", ""),
                "definition": t["definition"],
                "domain": t["domain"],
                "udm": t.get("udm", []),
                "source": t.get("source", ""),
                "sourceUrl": t.get("source_url", ""),
            },
            ensure_ascii=False,
        ) + ","
        for t in data["terms"]
    )
    return (
        f"{TS_HEADER}\nexport const glossaryDomains: string[] = [\n{domains}\n];\n\n"
        f"export const glossary: GlossaryTerm[] = [\n{rows}\n];\n"
    )


def write_csv(data):
    """Write the spreadsheet copy of the glossary."""
    CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with CSV_OUT.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Term", "Also called", "Definition", "Domain", "In the UDM", "Source", "Source URL"])
        for t in data["terms"]:
            writer.writerow([
                t["term"], t.get("also", ""), t["definition"], t["domain"],
                "; ".join(t.get("udm", [])), t.get("source", ""), t.get("source_url", ""),
            ])


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    TS_OUT.write_text(render_ts(data), encoding="utf-8")
    write_csv(data)
    print(f"generate_glossary: {len(data['terms'])} terms written")


if __name__ == "__main__":
    main()
