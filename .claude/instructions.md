# Claude Instructions for AI4RA-UDM Project

## Repository Information

- **GitHub Repository**: `https://github.com/ui-insight/AI4RA-UDM`

## Single Source of Truth

`udm_schema.json` is the **sole authoritative definition** of the UDM. All other files (dashboard, API endpoints, documentation) are derived from it. Changes to the data model are made to `udm_schema.json` directly.

## Critical Rules

1. **NEVER create backup or temporary files** — use git for version control
2. **NEVER create migration scripts** — edit `udm_schema.json` directly
3. **NEVER create new files unless explicitly asked**

## Naming Conventions

- **Tables**: PascalCase (e.g., `Project`, `Award`, `Personnel`)
- **Columns**: Snake_case (e.g., `Project_ID`, `Award_Number`, `Start_Date`)
- **Primary keys**: `TableName_ID` (e.g., `Award_ID`, `Personnel_ID`)
- **Foreign keys**: Named by role (e.g., `Sponsor_Organization_ID`, not generic `Organization_ID`)
- **Booleans**: Prefixed with `Is_` (e.g., `Is_Active`, `Is_Primary`)
- **Avoid Ambiguous Names**: Prefix with table context:
  - Use `Project_Title`, `Award_Title` instead of just `Title`
  - Use `Project_Status`, `Award_Status` instead of just `Status`
  - Avoid abbreviations like `Org` (use `Organization`)

## Files in This Project

- `udm_schema.json`: **Single Source of Truth (SSOT)** — complete schema with tables, columns, types, constraints, descriptions, synonyms, PII flags, and views
- `scripts/generate_dashboard_data.py`: Generates dashboard data files from `udm_schema.json`
- `docs/`: Dashboard and GitHub Pages site
- `docs/data/`: Generated JSON files served as API endpoints
- `vignettes/`: Detailed documentation (ontology, AllowedValues pattern)
