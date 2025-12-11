# Todo

- [x] The `Natural_Classification` column name in Account doesn't seem very transparent
- [x] Update data_dictionary_values.sql to fill the data dictionary with all the stuff from the schema but don't include anything from the views. Just table names and columns of all tables except the data dictionary one.
- [x] Once that's been done remove udm_data_dictionary_complete.sql
- [x] What is ActivityCode table for? Should it be a table?
- [x] Update allowedvalues column as follows:
 1. For each business‑logic enum (e.g., Organization.Organization_Type), add a stored generated
 column that returns the constant domain literal (e.g., Organization_Type_Group VARCHAR(50)
 GENERATED ALWAYS AS ('Organization_Type') STORED).
 2. Populate AllowedValues with every distinct code currently present in those enum columns, using
 the same domain literal as Allowed_Value_Group.
 3. Drop the original CHECK … IN (…) constraint on the enum column.
 4. Create a composite foreign key on the child table that references
 AllowedValues(Allowed_Value_Code, Allowed_Value_Group) — FOREIGN KEY (enum_code, enum_group)
 REFERENCES AllowedValues (Allowed_Value_Code, Allowed_Value_Group).

 Apply this pattern to all mutable enums (organization type, person type, project type, requirement
  type, deliverable type, transaction type, account type); status columns remain unchanged. This
 converts the enums into data‑driven lookups that can be extended by inserting rows into
 AllowedValues without further schema changes.
- [x] What is `Display_Order` in `BudgetCategory` table
- [x] COI_Status should be ConflictOfInterest_Status to stick with naming scheme
- [x] Do we really need `Is_Primary` in the ContactDetails table? Could there be more than one primary contact per person or organization? Shouldn't primary contact be a property of person or organization and not of the contact method itself?
- [x] Document table is too complex
- [x] Date_Created and Date_Modified aren't necessary for Dolt across any tables
- [x] `Applicable_Organization_ID` should be `Organization_ID` to match naming ontology in the `IndirectRate` table
