# Claude Instructions for AI4RA-UDM Project

## Repository Information

- **GitHub Repository**: `https://github.com/nate-layman/AI4RA-UDM`
- **DoltHub Repository**: `n8layman/AI4RA-UDM`

**CRITICAL WARNING**: The DoltHub database and GitHub repository have the SAME NAME. When performing delete operations:
- ONLY delete Dolt TABLES (via `DROP TABLE` in Dolt SQL)
- NEVER run commands that could delete the entire GitHub repository
- NEVER run `rm -rf` or similar destructive file system commands on the repo directory
- When in doubt, verify you're working with Dolt SQL commands, not GitHub/git commands

## Critical Rules

1. **NEVER ALTER THE DOLT DATABASE DIRECTLY**:

   - No `ALTER TABLE`, `DROP TABLE`, or any direct database modifications
   - This is schema development, not a live database
   - The Dolt database is only for testing the schema files

2. **NEVER CREATE NEW FILENAMES**:

   - Don't make backup files like `udm_schema_backup.sql` or `udm_schema_fixed.sql` or `udm_schema.sql.backup`
   - Don't create new files unless explicitly asked
   - Use git for version control - commit before and after changes
   - Only modify the actual files: `udm_schema.sql`, `udm_views.sql`, `udm_testing.sql`

3. **NEVER CREATE MIGRATION SCRIPTS**:
   - No `migrations/` folder
   - No numbered migration files like `001_*.sql`
   - Always work directly on the source schema files

## Workflow for Schema Changes

**Important**: The Dolt database is located in the `dolt_db/` directory. Clone it ONCE and NEVER delete it.
Always work on the `test` branch for schema development.

1. **Commit current state to Git**: `git add -A && git commit -m "Description"`
2. **Edit the schema file directly**: Modify `udm_schema.sql`, `udm_views.sql`, or other schema files
3. **Switch to dolt_db directory**: `cd dolt_db`
4. **Ensure you're on test branch**: `dolt checkout test`
5. **Drop only the relevant tables** (not all tables):
   ```bash
   dolt sql << 'EOF'
   SET FOREIGN_KEY_CHECKS = 0;
   DROP TABLE IF EXISTS TableName1, TableName2, etc;
   DROP VIEW IF EXISTS ViewName1, ViewName2, etc;
   SET FOREIGN_KEY_CHECKS = 1;
   EOF
   ```
6. **Recreate from schema**: `dolt sql < ../udm_schema.sql` (or the specific file with your changes)
7. **Load views if needed**: `dolt sql < ../udm_views.sql`
8. **Run tests**: `dolt sql < ../udm_testing.sql`
9. **If tests pass, commit to both**:
   - Git: `git add -A && git commit -m "Description"`
   - Dolt: `dolt add -A && dolt commit -m "Description" && dolt push origin test`
10. **Return to project root**: `cd ..`

## DoltHub Workflow

When working with the DoltHub repository (`n8layman/AI4RA-UDM`):

1. **Initial Setup** (done once):
   ```bash
   dolt clone n8layman/AI4RA-UDM dolt_db
   cd dolt_db
   dolt checkout test
   cd ..
   ```

2. **Push to DoltHub**: After schema changes are tested (from `dolt_db/` directory)
   ```bash
   cd dolt_db
   dolt add -A
   dolt commit -m "Description"
   dolt push origin test
   cd ..
   ```

3. **Pull from DoltHub**: To sync with remote changes (from `dolt_db/` directory)
   ```bash
   cd dolt_db
   dolt pull origin test
   cd ..
   ```

4. **Branch-based proposals**: For Data Dictionary updates via the dashboard
   - Dashboard will create branches in DoltHub for proposed changes
   - Review branches before merging to main
   - Use `dolt checkout <branch-name>` to review proposals locally

5. **Never confuse**:
   - `git push` → GitHub repository (source .sql files)
   - `dolt push` → DoltHub database (actual database state)
   - Git works at project root, Dolt works in `dolt_db/` directory

## Schema Design Principles

- **Dolt Native Features**: Dolt provides native version control and audit tracking. Do not add `Last_Modified_By`, `Last_Modified_Date`, `Created_By`, or `Created_Date` columns - Dolt tracks all changes through its git-like commit history.

## Naming Conventions

- **Tables**: PascalCase (e.g., `Project`, `Award`, `Personnel`)
- **Columns**: Snake_case (e.g., `Project_ID`, `Award_Number`, `Start_Date`)
- **Avoid Ambiguous Names**: Prefix ambiguous column names with table context:
  - Use `Project_Title`, `Award_Title` instead of just `Title`
  - Use `Project_Status`, `Award_Status` instead of just `Status`
  - Avoid abbreviations like `Org` (use `Organization`)

## Files in This Project

- `udm_schema.json`: **Single Source of Truth (SSOT)** — unified schema with tables, columns, types, constraints, descriptions, synonyms, PII flags, and views
- `udm_schema.sql`: SQL table definitions (input to SSOT generation)
- `udm_views.sql`: SQL view definitions (input to SSOT generation)
- `udm_data_dictionary_values.sql`: Table/column descriptions, synonyms, PII flags (input to SSOT generation)
- `udm_values.sql`: Sample data for testing
- `scripts/generate_unified_schema.py`: Generates `udm_schema.json` from the three SQL source files
- `scripts/generate_dashboard_data.py`: Generates dashboard data files from `udm_schema.json`
- `docs/`: Dashboard and GitHub Pages site
- `docs/data/`: Generated JSON files served as API endpoints
