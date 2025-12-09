1.  Pull any changes made on dolthub
2.  Remove all tables matching the pattern with "DataDictionary\_\*" keeping only the base "DataDictionary" table
3.  Evaluate the data_dictionary_schema.sql and data_dictionary_values.sql against udm_schema.sql
4.  Make sure Dolt database has appropriate values in DataDictionary table
5.  Set up a udm_testing.sql with a series of insert and select statements to verify that the udm_schema is set up correctly and that all tables and views and relationships are working
6.  Commit and push both to dolt and github
7.  Evaluate the udm_testing.sql report on any issues that arise then drop changes instead of commiting to dolt. This is just for testing.
8.  Create a python script in the script/ folder to generate mermaid ERD from the dolt db. Use an appropriate python library. Insert the resulting mermaind diagram code into the README.md in a mermaid block and commit to github.
