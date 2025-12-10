# UDM Testing Protocol

**EVERY TIME YOU TEST: Create fresh DB → Load schema → Run tests → Delete DB**

## Critical Rules

1. **NEVER test in `dolt_db/`** - That's connected to DoltHub
2. **ALWAYS create a fresh temporary database** for each test run
3. **ALWAYS delete the test database** when done
4. **Start from scratch every single time**

## Step 1: Create Fresh Test Database

```bash
cd /Users/nlayman/Documents/osp/granted/repos/AI4RA-UDM

# Remove any existing test database
rm -rf test_db

# Create brand new Dolt database
dolt init test_db
cd test_db
```

## Step 2: Load Schema and Views

```bash
# Load schema
dolt sql < ../udm_schema.sql

# Load views
dolt sql < ../udm_views.sql
```

## Step 3: Run Tests

```bash
# Run test suite
dolt sql < ../udm_testing.sql 2>&1
```

Review output for errors. All test sections should complete successfully.

## Step 4: Clean Up

```bash
# Return to project root
cd /Users/nlayman/Documents/osp/granted/repos/AI4RA-UDM

# Delete the test database completely
rm -rf test_db
```

## Notes

- **test_db/** is temporary and NOT tracked in Git (should be in .gitignore)
- **test_db/** has NO connection to DoltHub
- **dolt_db/** should NEVER be used for testing
- If any step fails, delete test_db and start over from Step 1
