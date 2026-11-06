#!/usr/bin/env python3
"""Copy the version in VERSION to every file that repeats it.

To change the version, edit VERSION, then run this script. It updates the
schema metadata, the README, the prose spec, and the conformance example, and
moves the changelog's Unreleased entries under the new version. The release
date is today unless --released says otherwise.

If those files already carry the version in VERSION, nothing changes, so the
script is safe to run twice. The release date changes only with the version,
or when --released is given.
"""

import argparse
import datetime
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = re.compile(r"\d+\.\d+\.\d+")
DATE = re.compile(r"\d{4}-\d{2}-\d{2}")


def replace_once(path, pattern, replacement):
    """Apply one required substitution to a file. Return True if the text changed."""
    file = ROOT / path
    text = file.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.M)
    if count != 1:
        sys.exit(f"bump_version: could not find the version in {path}")
    if updated == text:
        return False
    file.write_text(updated, encoding="utf-8")
    print(f"updated {path}")
    return True


def current_schema_values():
    text = (ROOT / "udm_schema.json").read_text(encoding="utf-8")
    match = re.search(r'"version": "([^"]+)",\s*"released": "([^"]+)"', text)
    if not match:
        sys.exit("bump_version: could not find the version in udm_schema.json")
    return match.group(1), match.group(2)


def main():
    parser = argparse.ArgumentParser(description="Copy the version in VERSION to every file that repeats it.")
    parser.add_argument("--released", help="release date as YYYY-MM-DD; defaults to today for a new version")
    args = parser.parse_args()

    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if not VERSION.fullmatch(version):
        sys.exit(f"bump_version: VERSION must look like 1.2.3, not '{version}'")
    if args.released and not DATE.fullmatch(args.released):
        sys.exit(f"bump_version: --released must look like 2026-01-31, not '{args.released}'")

    old_version, old_released = current_schema_values()
    if version == old_version:
        released = args.released or old_released
    else:
        released = args.released or datetime.date.today().isoformat()

    changed = [
        replace_once(
            "udm_schema.json",
            r'"version": "[^"]+",(\s*)"released": "[^"]+"',
            rf'"version": "{version}",\g<1>"released": "{released}"',
        ),
        replace_once(
            "README.md",
            r"\*\*Current version: v[^*]+\*\* \(released [^)]+\)",
            f"**Current version: v{version}** (released {released})",
        ),
        replace_once("vignettes/udm-system-of-record.md", r"^\*\*Version:\*\* [^ ]+\.", f"**Version:** {version}."),
        replace_once("vignettes/udm-conformance.md", r'("udm_version": ")[^"]+"', rf'\g<1>{version}"'),
    ]

    changelog = ROOT / "vignettes" / "CHANGELOG.md"
    text = changelog.read_text(encoding="utf-8")
    heading = f"## [{version}] - {released}"
    if "## [Unreleased]" in text:
        if f"## [{version}]" in text:
            sys.exit(f"bump_version: the changelog has Unreleased entries and already has {version}. Raise VERSION first")
        changelog.write_text(text.replace("## [Unreleased]", heading, 1), encoding="utf-8")
        print("updated vignettes/CHANGELOG.md")
        changed.append(True)
    elif f"## [{version}]" not in text:
        print(f"warning: the changelog has no Unreleased entries and no {version} heading", file=sys.stderr)
    elif args.released:
        updated = re.sub(rf"^## \[{re.escape(version)}\] - .*$", heading, text, count=1, flags=re.M)
        if updated != text:
            changelog.write_text(updated, encoding="utf-8")
            print("updated vignettes/CHANGELOG.md")
            changed.append(True)

    print(f"UDM {version}, released {released}" if any(changed) else f"already at {version}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
