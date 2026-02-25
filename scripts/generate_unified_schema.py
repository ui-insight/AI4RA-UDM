#!/usr/bin/env python3
"""
Generate a single unified UDM schema JSON file from udm_schema.sql.
Produces udm_schema.json with tables, columns, types, constraints,
foreign key references, and CHECK constraint allowed values.
"""

import re
import json
from pathlib import Path


def parse_unified_schema(sql_file):
    """Parse SQL schema and produce a unified schema dict."""

    with open(sql_file, 'r') as f:
        content = f.read()

    tables = {}

    # Split into CREATE TABLE statements
    table_pattern = r'CREATE TABLE (\w+)\s*\((.*?)\);'
    table_matches = re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE)

    for match in table_matches:
        table_name = match.group(1)
        table_body = match.group(2)

        columns = {}

        # Extract foreign keys: column -> (ref_table, ref_column)
        fk_map = {}
        fk_pattern = r'CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s*(\w+)\s*\((\w+)\)'
        for fk_match in re.finditer(fk_pattern, table_body, re.IGNORECASE | re.DOTALL):
            fk_map[fk_match.group(1)] = {
                'table': fk_match.group(2),
                'column': fk_match.group(3)
            }

        # Extract CHECK constraints with IN (...) lists
        # Map column name -> list of allowed values
        check_map = {}
        # Match CHECK constraints that use column_name IN ('val1','val2',...)
        # Handle both single-line and multi-line IN lists
        check_pattern = r'CONSTRAINT\s+\w+\s+CHECK\s*\(\s*(\w+)\s+IN\s*\((.*?)\)\s*\)'
        for ck_match in re.finditer(check_pattern, table_body, re.IGNORECASE | re.DOTALL):
            col_name = ck_match.group(1)
            values_str = ck_match.group(2)
            # Extract quoted values
            values = re.findall(r"'([^']*)'", values_str)
            if values:
                check_map[col_name] = values

        # Parse columns line by line
        lines = table_body.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            # Skip constraint lines and FK continuation lines
            first_word = line.split()[0].upper().rstrip(',') if line.split() else ''
            skip_keywords = {
                'CONSTRAINT', 'PRIMARY', 'REFERENCES', 'ON', 'UNIQUE',
                'INDEX', 'CHECK', 'FOREIGN',
            }
            if first_word in skip_keywords:
                continue

            col_match = re.match(r'(\w+)\s+(\w+(?:\([^)]+\))?)', line)
            if col_match:
                col_name = col_match.group(1)
                col_type = col_match.group(2)

                is_pk = 'PRIMARY KEY' in line.upper()
                is_required = 'NOT NULL' in line.upper() and not is_pk
                is_unique = 'UNIQUE' in line.upper()
                is_auto = 'AUTO_INCREMENT' in line.upper()

                col_def = {
                    'type': col_type,
                    'primary_key': is_pk,
                    'required': is_required,
                    'unique': is_unique,
                    'auto_increment': is_auto,
                }

                # Add default value if present
                default_match = re.search(r'DEFAULT\s+(\S+)', line, re.IGNORECASE)
                if default_match:
                    default_val = default_match.group(1).rstrip(',')
                    # Clean up quotes
                    if default_val.startswith("'") and default_val.endswith("'"):
                        default_val = default_val[1:-1]
                    elif default_val.upper() == 'FALSE':
                        default_val = False
                    elif default_val.upper() == 'TRUE':
                        default_val = True
                    elif default_val.upper() == 'CURRENT_TIMESTAMP':
                        default_val = 'CURRENT_TIMESTAMP'
                    else:
                        try:
                            default_val = int(default_val)
                        except ValueError:
                            try:
                                default_val = float(default_val)
                            except ValueError:
                                pass
                    col_def['default'] = default_val

                # Add FK reference if this column has one
                if col_name in fk_map:
                    col_def['references'] = fk_map[col_name]

                # Add allowed values from CHECK constraints
                if col_name in check_map:
                    col_def['allowed_values'] = check_map[col_name]

                columns[col_name] = col_def

        tables[table_name] = {
            'columns': columns
        }

    return tables


def main():
    base_dir = Path(__file__).parent.parent
    schema_file = base_dir / 'udm_schema.sql'
    output_file = base_dir / 'udm_schema.json'

    print(f"Parsing {schema_file}...")
    tables = parse_unified_schema(schema_file)

    # Count FK references
    fk_count = sum(
        1
        for t in tables.values()
        for c in t['columns'].values()
        if 'references' in c
    )

    output = {
        'tables': tables,
        'table_count': len(tables),
        'relationship_count': fk_count
    }

    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Found {len(tables)} tables with {fk_count} foreign key relationships")
    print(f"Generated {output_file}")


if __name__ == '__main__':
    main()
