#!/usr/bin/env python3
"""
Parse udm_schema.sql to generate JSON files for the dashboard visualization.
Generates:
- schema.json: Table and column definitions
- relationships.json: Foreign key relationships
"""

import re
import json
from pathlib import Path

def parse_schema_sql(sql_file):
    """Parse SQL schema file and extract tables, columns, and relationships."""

    with open(sql_file, 'r') as f:
        content = f.read()

    tables = {}
    relationships = []

    # Split into CREATE TABLE statements
    table_pattern = r'CREATE TABLE (\w+)\s*\((.*?)\);'
    table_matches = re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE)

    for match in table_matches:
        table_name = match.group(1)
        table_body = match.group(2)

        # Parse columns
        columns = []

        # Extract foreign keys from the full table body (handles multi-line)
        fk_pattern = r'CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\((\w+)\)\s*REFERENCES\s*(\w+)\s*\((\w+)\)'
        for fk_match in re.finditer(fk_pattern, table_body, re.IGNORECASE | re.DOTALL):
            relationships.append({
                'from_table': table_name,
                'from_column': fk_match.group(1),
                'to_table': fk_match.group(2),
                'to_column': fk_match.group(3)
            })

        # Parse columns line by line
        lines = table_body.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('--'):
                continue

            # Skip constraints
            if line.upper().startswith('CONSTRAINT') or line.upper().startswith('PRIMARY KEY'):
                continue

            # Extract column name and type
            col_match = re.match(r'(\w+)\s+(\w+(?:\([^)]+\))?)', line)
            if col_match:
                col_name = col_match.group(1)
                col_type = col_match.group(2)

                # Check for PRIMARY KEY
                is_pk = 'PRIMARY KEY' in line.upper()

                # Check for NOT NULL
                is_required = 'NOT NULL' in line.upper() and not is_pk

                # Check for UNIQUE
                is_unique = 'UNIQUE' in line.upper()

                # Check for AUTO_INCREMENT
                is_auto = 'AUTO_INCREMENT' in line.upper()

                columns.append({
                    'name': col_name,
                    'type': col_type,
                    'primary_key': is_pk,
                    'required': is_required,
                    'unique': is_unique,
                    'auto_increment': is_auto
                })

        tables[table_name] = {
            'name': table_name,
            'columns': columns
        }

    return tables, relationships

def generate_cytoscape_data(tables, relationships):
    """Generate Cytoscape.js compatible data structure."""

    nodes = []
    edges = []

    # Define node categories and colors
    core_tables = ['Organization', 'Award', 'Project', 'Personnel']
    financial_tables = ['Transaction', 'Invoice', 'Fund', 'Account', 'FinanceCode', 'AwardBudget', 'AwardBudgetPeriod']
    proposal_tables = ['RFA', 'Proposal', 'ProposalBudget']
    compliance_tables = ['ComplianceRequirement', 'ConflictOfInterest']

    for table_name, table_data in tables.items():
        # Determine category and color
        if table_name in core_tables:
            category = 'core'
            if table_name == 'Organization':
                color = '#4A90E2'  # Blue
            elif table_name == 'Award':
                color = '#7ED321'  # Green
            elif table_name == 'Project':
                color = '#BD10E0'  # Purple
            else:  # Personnel
                color = '#F5A623'  # Orange
        elif table_name in financial_tables:
            category = 'financial'
            color = '#7ED321'  # Green
        elif table_name in proposal_tables:
            category = 'proposal'
            color = '#4A90E2'  # Blue
        elif table_name in compliance_tables:
            category = 'compliance'
            color = '#D0021B'  # Red
        else:
            category = 'supporting'
            color = '#D8D8D8'  # Gray

        nodes.append({
            'data': {
                'id': table_name,
                'label': table_name,
                'category': category,
                'color': color,
                'columns': table_data['columns']
            }
        })

    # Add edges for relationships
    for i, rel in enumerate(relationships):
        edges.append({
            'data': {
                'id': f"edge_{i}",
                'source': rel['from_table'],
                'target': rel['to_table'],
                'label': f"{rel['from_column']} → {rel['to_column']}"
            }
        })

    return {
        'nodes': nodes,
        'edges': edges
    }

def main():
    # Paths
    base_dir = Path(__file__).parent.parent
    schema_file = base_dir / 'udm_schema.sql'
    output_dir = base_dir / 'docs' / 'data'

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Parsing {schema_file}...")
    tables, relationships = parse_schema_sql(schema_file)

    print(f"Found {len(tables)} tables and {len(relationships)} relationships")

    # Generate schema.json
    schema_output = {
        'tables': tables,
        'table_count': len(tables)
    }

    with open(output_dir / 'schema.json', 'w') as f:
        json.dump(schema_output, f, indent=2)
    print(f"✓ Generated {output_dir / 'schema.json'}")

    # Generate relationships.json
    rel_output = {
        'relationships': relationships,
        'relationship_count': len(relationships)
    }

    with open(output_dir / 'relationships.json', 'w') as f:
        json.dump(rel_output, f, indent=2)
    print(f"✓ Generated {output_dir / 'relationships.json'}")

    # Generate cytoscape-data.json (combined for easy loading)
    cytoscape_data = generate_cytoscape_data(tables, relationships)

    with open(output_dir / 'cytoscape-data.json', 'w') as f:
        json.dump(cytoscape_data, f, indent=2)
    print(f"✓ Generated {output_dir / 'cytoscape-data.json'}")

    print("\nDone! JSON files ready for dashboard.")

if __name__ == '__main__':
    main()
