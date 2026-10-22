#!/usr/bin/env python3
"""
Generate dashboard JSON files from udm_schema.json.

Reads the authoritative udm_schema.json and produces the JSON files
that the dashboard (docs/index.html) needs:
  - docs/data/data-dictionary.json: table/column descriptions for browsing
  - docs/data/relationships.json: foreign key relationships for navigation
  - docs/data/udm_schema.json: copy of full v2 schema for API endpoint
  - docs/schemas/udm_schema.metaschema.json: copy of the metaschema, so its $id URL resolves

Per-column synonyms in v2 live in the top-level column_synonyms.values map
keyed by "TableName.Column_Name"; this script merges that sidecar back into
each column row so the dashboard's existing UI (which expects a per-column
"synonyms" field) keeps working without code changes.
"""

import json
import shutil
from pathlib import Path


def main():
    base_dir = Path(__file__).parent.parent
    schema_file = base_dir / 'udm_schema.json'
    output_dir = base_dir / 'docs' / 'data'
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(schema_file) as f:
        schema = json.load(f)

    synonyms_map = schema.get('column_synonyms', {}).get('values', {})

    dd_tables = {}
    for table_name, table_data in schema['tables'].items():
        columns = []
        for col_name, col_def in table_data['columns'].items():
            syn_key = f'{table_name}.{col_name}'
            columns.append({
                'name': col_name,
                'description': col_def.get('description', ''),
                'synonyms': synonyms_map.get(syn_key),
                'pii': col_def.get('pii', False),
            })
        dd_tables[table_name] = {
            'name': table_name,
            'description': table_data.get('description', ''),
            'synonyms': None,
            'core_module': table_data.get('core_module'),
            'columns': columns,
        }

    dd_output = {'tables': dd_tables, 'table_count': len(dd_tables)}
    with open(output_dir / 'data-dictionary.json', 'w') as f:
        json.dump(dd_output, f, indent=2)
    print(f"Generated data-dictionary.json ({len(dd_tables)} tables)")

    relationships = []
    for table_name, table_data in schema['tables'].items():
        for col_name, col_def in table_data['columns'].items():
            if 'references' in col_def:
                relationships.append({
                    'from_table': table_name,
                    'from_column': col_name,
                    'to_table': col_def['references']['table'],
                    'to_column': col_def['references']['column'],
                })

    rel_output = {'relationships': relationships, 'relationship_count': len(relationships)}
    with open(output_dir / 'relationships.json', 'w') as f:
        json.dump(rel_output, f, indent=2)
    print(f"Generated relationships.json ({len(relationships)} relationships)")

    shutil.copy2(schema_file, output_dir / 'udm_schema.json')
    print("Copied udm_schema.json to docs/data/")

    metaschema_file = base_dir / 'schemas' / 'udm_schema.metaschema.json'
    metaschema_out = base_dir / 'docs' / 'schemas'
    metaschema_out.mkdir(parents=True, exist_ok=True)
    shutil.copy2(metaschema_file, metaschema_out / metaschema_file.name)
    print("Copied udm_schema.metaschema.json to docs/schemas/")

    print("\nDone.")


if __name__ == '__main__':
    main()
