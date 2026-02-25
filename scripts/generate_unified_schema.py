#!/usr/bin/env python3
"""
Generate the authoritative UDM schema JSON from SQL source files.

Merges three sources into a single udm_schema.json:
  - udm_schema.sql: tables, columns, types, constraints, foreign keys
  - udm_data_dictionary_values.sql: descriptions, synonyms, PII flags
  - udm_views.sql: view definitions

Output: udm_schema.json (the single source of truth for the UDM)
"""

import re
import json
from pathlib import Path


def parse_tables(sql_content):
    """Parse CREATE TABLE statements into structured dict."""
    tables = {}

    table_pattern = r'CREATE TABLE (\w+)\s*\((.*?)\);'
    for match in re.finditer(table_pattern, sql_content, re.DOTALL | re.IGNORECASE):
        table_name = match.group(1)
        table_body = match.group(2)

        columns = {}

        # Extract foreign keys: column -> {table, column}
        fk_map = {}
        fk_pattern = r'CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s*(\w+)\s*\((\w+)\)'
        for fk in re.finditer(fk_pattern, table_body, re.IGNORECASE | re.DOTALL):
            fk_map[fk.group(1)] = {'table': fk.group(2), 'column': fk.group(3)}

        # Extract CHECK IN constraints: column -> [values]
        check_map = {}
        check_pattern = r'CONSTRAINT\s+\w+\s+CHECK\s*\(\s*(\w+)\s+IN\s*\((.*?)\)\s*\)'
        for ck in re.finditer(check_pattern, table_body, re.IGNORECASE | re.DOTALL):
            values = re.findall(r"'([^']*)'", ck.group(2))
            if values:
                check_map[ck.group(1)] = values

        # Parse columns
        for line in table_body.split('\n'):
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            first_word = line.split()[0].upper().rstrip(',') if line.split() else ''
            if first_word in {'CONSTRAINT', 'PRIMARY', 'REFERENCES', 'ON', 'UNIQUE',
                              'INDEX', 'CHECK', 'FOREIGN'}:
                continue

            col_match = re.match(r'(\w+)\s+(\w+(?:\([^)]+\))?)', line)
            if not col_match:
                continue

            col_name = col_match.group(1)
            col_def = {
                'type': col_match.group(2),
                'primary_key': 'PRIMARY KEY' in line.upper(),
                'required': 'NOT NULL' in line.upper() and 'PRIMARY KEY' not in line.upper(),
                'unique': 'UNIQUE' in line.upper(),
                'auto_increment': 'AUTO_INCREMENT' in line.upper(),
            }

            # Default values
            default_match = re.search(r'DEFAULT\s+(\S+)', line, re.IGNORECASE)
            if default_match:
                val = default_match.group(1).rstrip(',')
                if val.startswith("'") and val.endswith("'"):
                    val = val[1:-1]
                elif val.upper() == 'FALSE':
                    val = False
                elif val.upper() == 'TRUE':
                    val = True
                elif val.upper() == 'CURRENT_TIMESTAMP':
                    val = 'CURRENT_TIMESTAMP'
                else:
                    try:
                        val = int(val)
                    except ValueError:
                        try:
                            val = float(val)
                        except ValueError:
                            pass
                col_def['default'] = val

            if col_name in fk_map:
                col_def['references'] = fk_map[col_name]
            if col_name in check_map:
                col_def['allowed_values'] = check_map[col_name]

            columns[col_name] = col_def

        tables[table_name] = {'columns': columns}

    return tables


def parse_data_dictionary(sql_content):
    """Parse INSERT statements for table/column descriptions, synonyms, PII."""
    table_meta = {}  # table_name -> {description, synonyms}
    column_meta = {}  # (table_name, col_name) -> {description, synonyms, pii}

    pattern = r"\('([^']+)',\s*'(Table|Column)',\s*(?:'([^']*)'|NULL),\s*'([^']*)',\s*(?:'([^']*)'|NULL),\s*(TRUE|FALSE)\)"
    for m in re.finditer(pattern, sql_content):
        entity = m.group(1)
        entity_type = m.group(2)
        parent = m.group(3)
        description = m.group(4)
        synonyms = m.group(5)
        pii = m.group(6) == 'TRUE'

        if entity_type == 'Table':
            table_meta[entity] = {'description': description, 'synonyms': synonyms}
        elif entity_type == 'Column' and parent:
            column_meta[(parent, entity)] = {
                'description': description,
                'synonyms': synonyms,
                'pii': pii,
            }

    return table_meta, column_meta


def parse_views(sql_content):
    """Parse CREATE VIEW statements."""
    views = {}
    view_pattern = r'CREATE VIEW (\w+)\s+AS\s+(.*?)(?=CREATE VIEW|\Z)'
    for m in re.finditer(view_pattern, sql_content, re.DOTALL | re.IGNORECASE):
        name = m.group(1)
        sql = m.group(2).strip().rstrip(';').strip()
        views[name] = {'sql': sql}
    return views


# View descriptions (not in any SQL file, currently only in README)
VIEW_DESCRIPTIONS = {
    'vw_All_ContactDetails': 'Unified view of all contact details from both Personnel and Organizations',
    'vw_Active_Awards': 'Summary of active awards with sponsor information, funding, expenses, and available balance',
    'vw_Active_Personnel_Roles': 'Current personnel roles on active projects with effort and award information',
    'vw_Award_Financial_Summary': 'Financial summary by award and budget period showing budgeted vs actual amounts',
    'vw_Expiring_Awards': 'Awards expiring within 90 days with sponsor and PI contact information',
    'vw_Overdue_Deliverables': 'Deliverables past their due date with days overdue and responsible person',
    'vw_ComplianceRequirement_Status': 'Active compliance requirements with expiration tracking and PI information',
    'vw_Budget_Comparison': 'Proposed vs approved vs current vs actual spending by award, period, and category',
}


def main():
    base_dir = Path(__file__).parent.parent

    # Read source files
    schema_sql = (base_dir / 'udm_schema.sql').read_text()
    dd_sql = (base_dir / 'udm_data_dictionary_values.sql').read_text()
    views_sql = (base_dir / 'udm_views.sql').read_text()

    # Parse
    tables = parse_tables(schema_sql)
    table_meta, column_meta = parse_data_dictionary(dd_sql)
    views = parse_views(views_sql)

    # Merge data dictionary into tables
    for table_name, table_data in tables.items():
        meta = table_meta.get(table_name, {})
        if meta.get('description'):
            table_data['description'] = meta['description']
        if meta.get('synonyms'):
            table_data['synonyms'] = meta['synonyms']

        for col_name, col_def in table_data['columns'].items():
            cmeta = column_meta.get((table_name, col_name), {})
            if cmeta.get('description'):
                col_def['description'] = cmeta['description']
            if cmeta.get('synonyms'):
                col_def['synonyms'] = cmeta['synonyms']
            if cmeta.get('pii'):
                col_def['pii'] = True

    # Add view descriptions
    for view_name, view_data in views.items():
        if view_name in VIEW_DESCRIPTIONS:
            view_data['description'] = VIEW_DESCRIPTIONS[view_name]

    # Stats
    fk_count = sum(
        1 for t in tables.values()
        for c in t['columns'].values()
        if 'references' in c
    )

    output = {
        'tables': tables,
        'views': views,
        'table_count': len(tables),
        'view_count': len(views),
        'relationship_count': fk_count,
    }

    output_file = base_dir / 'udm_schema.json'
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Tables: {len(tables)}, Views: {len(views)}, FK relationships: {fk_count}")
    print(f"Generated {output_file}")


if __name__ == '__main__':
    main()
