#!/usr/bin/env python3
"""
Update udm_schema.sql with high-priority improvements
- Add foreign keys for audit columns
- Add date range constraints
- Fix nullability
- Add email validation
"""

import re

def read_file(filepath):
    with open(filepath, 'r') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w') as f:
        f.write(content)

def add_fk_after_last_constraint(table_create, fk_constraint):
    """Add FK constraint before the closing parenthesis"""
    # Find the last constraint or column definition
    lines = table_create.split('\n')
    insert_pos = -1

    for i in range(len(lines) - 1, -1, -1):
        line = lines[i].strip()
        if line.startswith('CONSTRAINT') or line.startswith('KEY'):
            insert_pos = i + 1
            break
        elif ')' in line and 'ENGINE' not in line:
            # This is the closing paren
            insert_pos = i
            break

    if insert_pos > 0:
        # Add comma to previous line if needed
        if not lines[insert_pos - 1].rstrip().endswith(','):
            lines[insert_pos - 1] = lines[insert_pos - 1].rstrip() + ','

        lines.insert(insert_pos, fk_constraint)

    return '\n'.join(lines)

def main():
    schema_file = 'udm_schema.sql'
    content = read_file(schema_file)

    # 1. Fix Personnel Primary_Email nullability
    content = re.sub(
        r'Primary_Email VARCHAR\(255\)',
        'Primary_Email VARCHAR(320) NOT NULL',
        content
    )

    # 2. Fix Project Start_Date nullability
    content = re.sub(
        r'(\n\s+Start_Date DATE),',
        r'\1 NOT NULL,',
        content,
        count=1  # Only first occurrence (Project table)
    )

    # 3. Add email validation to Personnel
    personnel_pattern = r'(CREATE TABLE Personnel \(.*?CONSTRAINT chk_orcid_format[^\)]+\))'
    def add_email_check(match):
        text = match.group(1)
        email_check = ",\n    CONSTRAINT chk_personnel_email_format CHECK (Primary_Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$')"
        return text + email_check

    content = re.sub(personnel_pattern, add_email_check, content, flags=re.DOTALL)

    # 4. Add date range constraints
    date_constraints = {
        'Project': "    CONSTRAINT chk_project_date_range CHECK (End_Date IS NULL OR End_Date >= Start_Date)",
        'Award': "    CONSTRAINT chk_award_date_range CHECK (Current_End_Date >= Original_Start_Date),\n    CONSTRAINT chk_award_original_dates CHECK (Original_End_Date >= Original_Start_Date)",
        'Proposal': "    CONSTRAINT chk_proposal_date_range CHECK (Proposed_End_Date IS NULL OR Proposed_End_Date >= Proposed_Start_Date)",
        'Subaward': "    CONSTRAINT chk_subaward_date_range CHECK (End_Date IS NULL OR End_Date >= Start_Date)",
        'AwardBudgetPeriod': "    CONSTRAINT chk_period_date_range CHECK (End_Date >= Start_Date)",
        'Effort': "    CONSTRAINT chk_effort_date_range CHECK (Period_End_Date >= Period_Start_Date)",
        'Invoice': "    CONSTRAINT chk_invoice_period_range CHECK (Period_End_Date >= Period_Start_Date)",
        'IndirectRate': "    CONSTRAINT chk_rate_date_range CHECK (Effective_End_Date IS NULL OR Effective_End_Date >= Effective_Start_Date)",
    }

    for table, constraint in date_constraints.items():
        # Add constraint before closing paren
        pattern = rf'(CREATE TABLE {table} \(.*?)(\n\);)'
        def add_constraint(match):
            table_def = match.group(1)
            closing = match.group(2)
            # Add comma to last line if needed
            if not table_def.rstrip().endswith(','):
                table_def = table_def.rstrip() + ','
            return table_def + '\n' + constraint + closing

        content = re.sub(pattern, add_constraint, content, flags=re.DOTALL, count=1)

    # 5. Add foreign keys for audit columns
    audit_fks = {
        'Organization': [
            "    CONSTRAINT fk_organization_modified_by FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
            "    CONSTRAINT fk_organization_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Personnel': [
            "    CONSTRAINT fk_personnel_modified_by FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
            "    CONSTRAINT fk_personnel_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Project': [
            "    CONSTRAINT fk_project_modified_by FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
            "    CONSTRAINT fk_project_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Proposal': [
            "    CONSTRAINT fk_proposal_modified_by FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
            "    CONSTRAINT fk_proposal_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Award': [
            "    CONSTRAINT fk_award_modified_by FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
            "    CONSTRAINT fk_award_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'AwardBudget': [
            "    CONSTRAINT fk_awardbudget_modified_by FOREIGN KEY (Last_Modified_By) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'ComplianceRequirement': [
            "    CONSTRAINT fk_compliancereq_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Invoice': [
            "    CONSTRAINT fk_invoice_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Modification': [
            "    CONSTRAINT fk_modification_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON UPDATE CASCADE",
        ],
        'ProjectRole': [
            "    CONSTRAINT fk_projectrole_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Subaward': [
            "    CONSTRAINT fk_subaward_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
        'Transaction': [
            "    CONSTRAINT fk_transaction_created_by FOREIGN KEY (Created_By_Personnel_ID) REFERENCES Personnel(Personnel_ID) ON DELETE SET NULL ON UPDATE CASCADE",
        ],
    }

    for table, constraints in audit_fks.items():
        for constraint in constraints:
            pattern = rf'(CREATE TABLE {table} \(.*?)(\n\);)'
            def add_fk(match):
                table_def = match.group(1)
                closing = match.group(2)
                if not table_def.rstrip().endswith(','):
                    table_def = table_def.rstrip() + ','
                return table_def + '\n' + constraint + ',' + closing

            content = re.sub(pattern, add_fk, content, flags=re.DOTALL, count=1)

    # Fix trailing commas before closing paren
    content = re.sub(r',(\n\);)', r'\1', content)

    write_file(schema_file, content)
    print(f"Updated {schema_file}")
    print("\nChanges applied:")
    print("✓ Fixed Primary_Email nullability (NOT NULL, increased to VARCHAR(320))")
    print("✓ Fixed Project.Start_Date nullability (NOT NULL)")
    print("✓ Added email format validation to Personnel")
    print("✓ Added date range constraints to 8 tables")
    print("✓ Added foreign keys for audit columns (17 FK constraints)")

if __name__ == '__main__':
    main()
