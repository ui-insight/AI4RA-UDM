# Todo

- [x] The `Natural_Classification` column name in Account doesn't seem very transparent
- [x] Update data_dictionary_values.sql to fill the data dictionary with all the stuff from the schema but don't include anything from the views. Just table names and columns of all tables except the data dictionary one.
- [x] Once that's been done remove udm_data_dictionary_complete.sql
- [x] What is ActivityCode table for? Should it be a table?
- [ ] Review AllowedValues table. Maybe we should make that more granular
- [x] What is `Display_Order` in `BudgetCategory` table
- [x] COI_Status should be ConflictOfInterest_Status to stick with naming scheme
- [ ] Can there be multiple Is_Primary ContactDetails per project?
- [ ] Document table is too complex
- [x] Date_Created and Date_Modified aren't necessary for Dolt across any tables
- [x] `Applicable_Organization_ID` should be `Organization_ID` to match naming ontology in the `IndirectRate` table
