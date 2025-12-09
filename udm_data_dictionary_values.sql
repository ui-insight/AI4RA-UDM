INSERT INTO udm_data_dictionary (entity_name, entity_type, description, synonyms, context, category) VALUES
-- AllowedValues
('AllowedValues', 'Table', 'Stores allowed values for controlled vocabularies used in other tables', 'ValueList, LookupTable', 'AllowedValues', 'Reference Data'),
('Allowed_Value_ID', 'Column', 'Unique identifier for each allowed value', 'ValueID', 'AllowedValues', 'Reference Data'),
('Allowed_Value_Group', 'Column', 'Group or category for the allowed value', 'ValueGroup', 'AllowedValues', 'Reference Data'),
('Allowed_Value_Code', 'Column', 'Code representing the allowed value', 'ValueCode', 'AllowedValues', 'Reference Data'),
('Allowed_Value_Label', 'Column', 'Human-readable label for the allowed value', 'Label', 'AllowedValues', 'Reference Data'),
('Allowed_Value_Description', 'Column', 'Description of the allowed value', 'Description', 'AllowedValues', 'Reference Data'),

-- Organization
('Organization', 'Table', 'Stores information about organizations, departments, colleges, sponsors, and other units', 'Org', 'Organization', 'Organization Data'),
('Org_ID', 'Column', 'Unique identifier for an organization', 'OrganizationID', 'Organization', 'Organization Data'),
('Org_Name', 'Column', 'Full name of the organization', 'Organization Name', 'Organization', 'Organization Data'),
('Org_Type', 'Column', 'Type of organization (Department, College, Sponsor, etc.)', 'Organization Type', 'Organization', 'Organization Data'),
('Parent_Org_ID', 'Column', 'Reference to parent organization, if applicable', 'ParentOrg', 'Organization', 'Organization Data'),
('UEI', 'Column', 'Unique Entity Identifier for external organizations', 'Unique Entity ID', 'Organization', 'Organization Data'),

-- Personnel
('Personnel', 'Table', 'Stores information about individuals involved in projects and awards', 'Person, Employee', 'Personnel', 'People'),
('Personnel_ID', 'Column', 'Unique identifier for a person', 'PersonID', 'Personnel', 'People'),
('ORCID', 'Column', 'ORCID identifier for the person', NULL, 'Personnel', 'People'),
('First_Name', 'Column', 'Person’s first name', 'Given Name', 'Personnel', 'People'),
('Last_Name', 'Column', 'Person’s last name', 'Surname', 'Personnel', 'People'),
('Middle_Name', 'Column', 'Person’s middle name', NULL, 'Personnel', 'People'),
('Primary_Email', 'Column', 'Primary email address of the person', 'Email', 'Personnel', 'People'),
('Person_Type', 'Column', 'Role type of the person (Faculty, Staff, Student, etc.)', NULL, 'Personnel', 'People'),
('Department_Org_ID', 'Column', 'Reference to the department organization for the person', 'DepartmentID', 'Personnel', 'People'),

-- Contact
('Contact', 'Table', 'Stores contact information for personnel', 'ContactInfo', 'Contact', 'People'),
('Contact_ID', 'Column', 'Unique identifier for a contact entry', NULL, 'Contact', 'People'),
('Contact_Type_Value_ID', 'Column', 'Reference to AllowedValues for the type of contact', NULL, 'Contact', 'People'),
('Contact_Value', 'Column', 'The actual contact information (email, phone, etc.)', 'Contact Info', 'Contact', 'People'),
('Is_Primary', 'Column', 'Indicates if this is the primary contact', NULL, 'Contact', 'People'),

-- Project
('Project', 'Table', 'Represents research or training projects', NULL, 'Project', 'Project Data'),
('Project_ID', 'Column', 'Unique identifier for a project', 'ProjID', 'Project', 'Project Data'),
('Title', 'Column', 'Title of the project', 'Project Title', 'Project', 'Project Data'),
('Acronym', 'Column', 'Short acronym for the project', NULL, 'Project', 'Project Data'),
('Parent_Project_ID', 'Column', 'Reference to parent project, if applicable', 'Parent Project', 'Project', 'Project Data'),
('Project_Type', 'Column', 'Type of project (Research, Training, Service, etc.)', NULL, 'Project', 'Project Data'),
('Start_Date', 'Column', 'Official start date of the project', 'Project Start', 'Project', 'Project Data'),
('End_Date', 'Column', 'Official end date of the project', 'Project End', 'Project', 'Project Data'),
('Lead_Org_ID', 'Column', 'Organization leading the project', 'Lead Department', 'Project', 'Project Data'),
('Status', 'Column', 'Current status of the project', NULL, 'Project', 'Project Data'),

-- RFA
('RFA', 'Table', 'Represents Request for Applications or funding announcements', 'Funding Opportunity', 'RFA', 'Project Data'),
('RFA_ID', 'Column', 'Unique identifier for an RFA', NULL, 'RFA', 'Project Data'),
('Sponsor_Org_ID', 'Column', 'Organization sponsoring the RFA', 'SponsorID', 'RFA', 'Project Data'),
('RFA_Number', 'Column', 'Official number assigned to the RFA', NULL, 'RFA', 'Project Data'),
('RFA_Title', 'Column', 'Title of the RFA', NULL, 'RFA', 'Project Data'),
('Program_Code', 'Column', 'Sponsor program code for the RFA', NULL, 'RFA', 'Project Data'),

-- Proposal
('Proposal', 'Table', 'Represents submitted proposals for projects', NULL, 'Proposal', 'Project Data'),
('Proposal_ID', 'Column', 'Unique identifier for a proposal', NULL, 'Proposal', 'Project Data'),
('Proposal_Number', 'Column', 'Official proposal number', NULL, 'Proposal', 'Project Data'),
('Title', 'Column', 'Title of the proposal', 'Proposal Title', 'Proposal', 'Project Data'),
('Project_ID', 'Column', 'Associated project ID', 'ProjID', 'Proposal', 'Project Data'),
('Sponsor_Org_ID', 'Column', 'Sponsoring organization', 'SponsorID', 'Proposal', 'Project Data'),
('RFA_ID', 'Column', 'Associated RFA ID, if applicable', NULL, 'Proposal', 'Project Data'),
('Proposed_Start_Date', 'Column', 'Proposed start date for the project', NULL, 'Proposal', 'Project Data'),
('Proposed_End_Date', 'Column', 'Proposed end date for the project', NULL, 'Proposal', 'Project Data'),

-- Award
('Award', 'Table', 'Represents awarded funding for projects', NULL, 'Award', 'Award Data'),
('Award_ID', 'Column', 'Unique identifier for an award', NULL, 'Award', 'Award Data'),
('Award_Number', 'Column', 'Official award number', NULL, 'Award', 'Award Data'),
('Title', 'Column', 'Title of the award', NULL, 'Award', 'Award Data'),
('Project_ID', 'Column', 'Associated project ID', 'ProjID', 'Award', 'Award Data'),
('Sponsor_Org_ID', 'Column', 'Sponsoring organization', 'SponsorID', 'Award', 'Award Data'),
('RFA_ID', 'Column', 'Associated RFA ID, if applicable', NULL, 'Award', 'Award Data'),
('Original_Start_Date', 'Column', 'Original start date of the award', NULL, 'Award', 'Award Data'),
('Original_End_Date', 'Column', 'Original end date of the award', NULL, 'Award', 'Award Data'),
('Current_Total_Funded', 'Column', 'Current total funded amount', NULL, 'Award', 'Award Data'),
('Current_End_Date', 'Column', 'Current end date of the award', NULL, 'Award', 'Award Data'),
('Status', 'Column', 'Current award status', NULL, 'Award', 'Award Data'),

-- Subaward
('Subaward', 'Table', 'Represents subawards issued under prime awards', NULL, 'Subaward', 'Award Data'),
('Subaward_ID', 'Column', 'Unique identifier for a subaward', NULL, 'Subaward', 'Award Data'),
('Prime_Award_ID', 'Column', 'Reference to the prime award', 'Prime Award', 'Subaward', 'Award Data'),
('Subrecipient_Org_ID', 'Column', 'Organization receiving the subaward', 'Subrecipient', 'Subaward', 'Award Data'),
('Subaward_Number', 'Column', 'Official subaward number', NULL, 'Subaward', 'Award Data'),
('Amount', 'Column', 'Subaward funding amount', NULL, 'Subaward', 'Award Data'),
('Start_Date', 'Column', 'Subaward start date', NULL, 'Subaward', 'Award Data'),
('End_Date', 'Column', 'Subaward end date', NULL, 'Subaward', 'Award Data'),
('Status', 'Column', 'Subaward current status', NULL, 'Subaward', 'Award Data');
