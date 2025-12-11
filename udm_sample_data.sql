-- Complete Sample Data for Research Administration Unified Data Model
-- This file provides realistic sample data for ALL tables in the UDM schema
-- AllowedValues and DataDictionary are already populated separately
-- Load order respects all foreign key dependencies

-- =============================================================================
-- BudgetCategory
-- =============================================================================
INSERT INTO BudgetCategory (Category_Code, Category_Name, Category_Description) VALUES
('SENIOR_PERSONNEL', 'Senior Personnel', 'Salaries and wages for senior personnel including faculty and senior researchers'),
('OTHER_PERSONNEL', 'Other Personnel', 'Salaries and wages for staff, students, and other personnel'),
('FRINGE_BENEFITS', 'Fringe Benefits', 'Fringe benefits for all personnel categories'),
('EQUIPMENT', 'Equipment', 'Equipment costing $5,000 or more per unit'),
('TRAVEL', 'Travel', 'Domestic and foreign travel expenses'),
('PARTICIPANT_SUPPORT', 'Participant Support', 'Direct costs for training participants or conference attendees'),
('OTHER_DIRECT', 'Other Direct Costs', 'Materials, supplies, publication costs, consultant services'),
('SUBCONTRACT', 'Subcontract Costs', 'Costs for subrecipient organizations'),
('IDC', 'Indirect Costs', 'Facilities and administrative costs'),
('CONSULTANT', 'Consultant Services', 'Professional consultant fees'),
('MATERIALS', 'Materials and Supplies', 'Lab supplies, chemicals, and research materials'),
('PUBLICATION', 'Publication Costs', 'Journal fees, printing, and dissemination costs');

-- =============================================================================
-- Organization
-- =============================================================================
INSERT INTO Organization (Organization_ID, Organization_Name, Organization_Type, Parent_Organization_ID, UEI) VALUES
('INST001', 'State University', 'Institute', NULL, 'ABC123456789'),
('COLL001', 'College of Engineering', 'College', 'INST001', NULL),
('COLL002', 'College of Medicine', 'College', 'INST001', NULL),
('COLL003', 'College of Arts and Sciences', 'College', 'INST001', NULL),
('DEPT001', 'Department of Computer Science', 'Department', 'COLL001', NULL),
('DEPT002', 'Department of Biomedical Engineering', 'Department', 'COLL001', NULL),
('DEPT003', 'Department of Internal Medicine', 'Department', 'COLL002', NULL),
('DEPT004', 'Department of Chemistry', 'Department', 'COLL003', NULL),
('CENT001', 'Center for Data Science Research', 'Center', 'INST001', NULL),
('SPON001', 'National Institutes of Health', 'Sponsor', NULL, 'NIH234567890'),
('SPON002', 'National Science Foundation', 'Sponsor', NULL, 'NSF345678901'),
('SPON003', 'Department of Defense', 'Sponsor', NULL, 'DOD456789012'),
('SPON004', 'Department of Energy', 'Sponsor', NULL, 'DOE567890123'),
('SPON005', 'Acme Research Foundation', 'Sponsor', NULL, 'ARF678901234'),
('SPON006', 'TechCorp Industries', 'Sponsor', NULL, 'TCI789012345'),
('SUBRE001', 'Tech Research Institute', 'Subrecipient', NULL, 'TRI890123456'),
('SUBRE002', 'Metro University', 'Subrecipient', NULL, 'MET901234567'),
('SUBRE003', 'Coastal Medical Center', 'Subrecipient', NULL, 'CMC012345678'),
('VEND001', 'Lab Equipment Supply Co', 'Vendor', NULL, NULL),
('VEND002', 'Office Supplies Plus', 'Vendor', NULL, NULL);

-- =============================================================================
-- Personnel
-- =============================================================================
INSERT INTO Personnel (Personnel_ID, ORCID, First_Name, Last_Name, Middle_Name, Institutional_ID, Primary_Email, Person_Type, Department_Organization_ID) VALUES
('P001', '0000-0001-2345-6789', 'Jane', 'Smith', 'A', 'JS12345', 'jane.smith@stateuniversity.edu', 'Faculty', 'DEPT001'),
('P002', '0000-0002-3456-7890', 'John', 'Doe', 'B', 'JD23456', 'john.doe@stateuniversity.edu', 'Faculty', 'DEPT002'),
('P003', '0000-0003-4567-8901', 'Maria', 'Garcia', NULL, 'MG34567', 'maria.garcia@stateuniversity.edu', 'Faculty', 'DEPT003'),
('P004', '0000-0004-5678-9012', 'David', 'Chen', 'L', 'DC45678', 'david.chen@stateuniversity.edu', 'Faculty', 'DEPT004'),
('P005', NULL, 'Sarah', 'Johnson', 'M', 'SJ56789', 'sarah.johnson@stateuniversity.edu', 'Staff', 'DEPT001'),
('P006', '0000-0005-6789-0123', 'Michael', 'Brown', NULL, 'MB67890', 'michael.brown@stateuniversity.edu', 'Postdoc', 'DEPT002'),
('P007', NULL, 'Emily', 'Davis', 'R', 'ED78901', 'emily.davis@stateuniversity.edu', 'Student', 'DEPT001'),
('P008', NULL, 'Robert', 'Wilson', NULL, 'RW89012', 'robert.wilson@stateuniversity.edu', 'Staff', 'INST001'),
('P009', '0000-0006-7890-1234', 'Linda', 'Martinez', 'K', 'LM90123', 'linda.martinez@stateuniversity.edu', 'Faculty', 'DEPT003'),
('P010', NULL, 'James', 'Taylor', NULL, 'JT01234', 'james.taylor@external.org', 'External', NULL),
('P011', '0000-0007-8901-2345', 'Patricia', 'Anderson', NULL, 'PA12345', 'patricia.anderson@stateuniversity.edu', 'Faculty', 'DEPT002'),
('P012', NULL, 'Thomas', 'White', 'J', 'TW23456', 'thomas.white@stateuniversity.edu', 'Staff', 'INST001'),
('P013', NULL, 'Jennifer', 'Lee', NULL, 'JL34567', 'jennifer.lee@stateuniversity.edu', 'Student', 'DEPT003'),
('P014', '0000-0008-9012-3456', 'William', 'Harris', 'M', 'WH45678', 'william.harris@stateuniversity.edu', 'Faculty', 'DEPT001');

-- =============================================================================
-- ContactDetails
-- =============================================================================
INSERT INTO ContactDetails (Personnel_ID, Organization_ID, AllowedValue_ID, ContactDetails_Value) VALUES
('P001', NULL, 14, 'jane.smith@stateuniversity.edu'),
('P001', NULL, 15, '555-0101'),
('P001', NULL, 17, '555-0151'),
('P002', NULL, 14, 'john.doe@stateuniversity.edu'),
('P002', NULL, 15, '555-0102'),
('P003', NULL, 14, 'maria.garcia@stateuniversity.edu'),
('P003', NULL, 15, '555-0103'),
('P004', NULL, 14, 'david.chen@stateuniversity.edu'),
('P004', NULL, 15, '555-0104'),
('P009', NULL, 14, 'linda.martinez@stateuniversity.edu'),
('P009', NULL, 15, '555-0109'),
(NULL, 'SPON001', 14, 'grants@nih.gov'),
(NULL, 'SPON001', 15, '301-496-4000'),
(NULL, 'SPON001', 16, '301-496-9000'),
(NULL, 'SPON002', 14, 'info@nsf.gov'),
(NULL, 'SPON002', 15, '703-292-5111'),
(NULL, 'SPON003', 14, 'research@dod.mil'),
(NULL, 'SUBRE001', 14, 'contracts@techresearch.org'),
(NULL, 'SUBRE001', 15, '555-0201');

-- =============================================================================
-- IndirectRate
-- =============================================================================
INSERT INTO IndirectRate (Organization_ID, Rate_Type, Rate_Percentage, Effective_Start_Date, Effective_End_Date, Base_Type, Negotiated_Agreement_ID) VALUES
('INST001', 'On-Campus', 55.50, '2023-07-01', '2026-06-30', 'MTDC', 'NICRA-2023-001'),
('INST001', 'Off-Campus', 26.00, '2023-07-01', '2026-06-30', 'MTDC', 'NICRA-2023-001'),
('INST001', 'Clinical Trial', 30.00, '2023-07-01', '2026-06-30', 'MTDC', 'NICRA-2023-001'),
('INST001', 'Fringe Benefits', 32.00, '2024-01-01', NULL, 'Salaries and Wages', 'FB-2024-001'),
('INST001', 'Administrative', 15.50, '2024-01-01', '2025-12-31', 'TDC', 'ADMIN-2024-001');

-- =============================================================================
-- Project
-- =============================================================================
INSERT INTO Project (Project_ID, Project_Title, Acronym, Parent_Project_ID, Project_Type_Value_ID, Abstract, Start_Date, End_Date, Lead_Organization_ID, Project_Status) VALUES
('PRJ001', 'Machine Learning for Medical Diagnosis', 'ML-MED', NULL, 49, 'Developing advanced machine learning algorithms for early disease detection using medical imaging data and electronic health records', '2023-09-01', '2026-08-31', 'DEPT001', 'Active'),
('PRJ002', 'Sustainable Energy Storage Systems', 'SESS', NULL, 49, 'Research into next-generation renewable energy storage and distribution systems using novel battery technologies', '2024-01-01', '2027-12-31', 'DEPT002', 'Active'),
('PRJ003', 'Cancer Immunotherapy Clinical Trial', 'CICT', NULL, 52, 'Phase II clinical trial evaluating novel immunotherapy approach for metastatic melanoma patients', '2023-06-01', '2028-05-31', 'DEPT003', 'Active'),
('PRJ004', 'Advanced Materials Chemistry', 'AMC', NULL, 49, 'Synthesis and characterization of novel polymer materials with applications in drug delivery and tissue engineering', '2024-03-01', '2027-02-28', 'DEPT004', 'Active'),
('PRJ005', 'Graduate Training Program in Data Science', 'GTPDS', NULL, 50, 'Comprehensive training program for graduate students in data science methods and computational research', '2023-08-15', '2028-08-14', 'DEPT001', 'Active'),
('PRJ006', 'Quantum Computing Applications', 'QCA', 'PRJ001', 49, 'Exploring quantum computing applications in medical data analysis', '2024-06-01', '2027-05-31', 'DEPT001', 'Active');

-- =============================================================================
-- RFA (Request for Applications)
-- =============================================================================
INSERT INTO RFA (RFA_ID, Sponsor_Organization_ID, RFA_Number, RFA_Title, Program_Code, Announcement_URL, Opportunity_Number, CFDA_Number) VALUES
('RFA001', 'SPON001', 'RFA-CA-24-001', 'Novel Approaches to Cancer Treatment', 'CA-TREAT', 'https://grants.nih.gov/grants/guide/rfa-files/RFA-CA-24-001.html', 'PA-24-001', '93.395'),
('RFA002', 'SPON002', 'NSF-24-500', 'Artificial Intelligence Research Institutes', 'AI-INST', 'https://www.nsf.gov/pubs/2024/nsf24500/nsf24500.htm', 'NSF-24-500', '47.070'),
('RFA003', 'SPON003', 'DOD-BAA-24-100', 'Advanced Battery Technologies', 'ENERGY-BAA', 'https://www.grants.gov/web/grants/view-opportunity.html?oppId=348765', 'DOD-BAA-24-100', NULL),
('RFA004', 'SPON001', 'PAR-23-300', 'Ruth L. Kirschstein National Research Service Awards', 'NRSA-PRED', 'https://grants.nih.gov/grants/guide/pa-files/PAR-23-300.html', 'PA-23-300', '93.220');

-- =============================================================================
-- Proposal
-- =============================================================================
INSERT INTO Proposal (Proposal_ID, Proposal_Number, Proposal_Title, Project_ID, Sponsor_Organization_ID, Submitting_Organization_ID, Administering_Organization_ID, RFA_ID, Previous_Proposal_ID, Submission_Version, Proposed_Start_Date, Proposed_End_Date, Total_Proposed_Direct, Total_Proposed_Indirect, Total_Proposed_Budget, Submission_Deadline, Submission_Date, Internal_Approval_Status, Decision_Status, Decision_Date, PAF_Routing_Status) VALUES
('PROP001', 'SU-2023-0101', 'Machine Learning for Medical Diagnosis', 'PRJ001', 'SPON002', 'INST001', 'INST001', 'RFA002', NULL, 14, '2023-09-01', '2026-08-31', 750000.00, 413250.00, 1163250.00, '2023-07-15', '2023-07-14', 'Approved', 'Awarded', '2023-08-25', 'Complete'),
('PROP002', 'SU-2024-0102', 'Sustainable Energy Storage Systems', 'PRJ002', 'SPON004', 'INST001', 'INST001', 'RFA003', NULL, 14, '2024-01-01', '2027-12-31', 1200000.00, 312000.00, 1512000.00, '2023-11-30', '2023-11-29', 'Approved', 'Awarded', '2023-12-20', 'Complete'),
('PROP003', 'SU-2023-0103', 'Cancer Immunotherapy Clinical Trial', 'PRJ003', 'SPON001', 'INST001', 'INST001', 'RFA001', NULL, 14, '2023-06-01', '2028-05-31', 2500000.00, 750000.00, 3250000.00, '2023-04-15', '2023-04-14', 'Approved', 'Awarded', '2023-05-20', 'Complete'),
('PROP004', 'SU-2024-0104', 'Advanced Materials Chemistry', 'PRJ004', 'SPON002', 'INST001', 'INST001', NULL, NULL, 14, '2024-03-01', '2027-02-28', 450000.00, 249750.00, 699750.00, '2024-01-20', '2024-01-19', 'Approved', 'Awarded', '2024-02-15', 'Complete'),
('PROP005', 'SU-2023-0105', 'Graduate Training Program in Data Science', 'PRJ005', 'SPON001', 'INST001', 'INST001', 'RFA004', NULL, 14, '2023-08-15', '2028-08-14', 1500000.00, 0.00, 1500000.00, '2023-06-01', '2023-05-30', 'Approved', 'Awarded', '2023-07-15', 'Complete'),
('PROP006', 'SU-2024-0201', 'Quantum Computing Applications', 'PRJ006', 'SPON006', 'INST001', 'INST001', NULL, NULL, 14, '2024-06-01', '2027-05-31', 350000.00, 193375.00, 543375.00, '2024-04-30', NULL, 'In Review', 'Pending', NULL, 'Pending');

-- =============================================================================
-- ProposalBudget
-- =============================================================================
INSERT INTO ProposalBudget (Proposal_ID, Period_Number, BudgetCategory_ID, Line_Item_Description, Direct_Cost, Indirect_Cost, Total_Cost, Quantity, Unit_Cost, Applied_Indirect_Rate_ID, Rate_Base_Used, Version_No) VALUES
('PROP001', 14, 1, 'PI Jane Smith - 2 summer months', 20000.00, 0.00, 20000.00, 2.00, 10000.00, NULL, NULL, 1),
('PROP001', 14, 15, 'Graduate Research Assistant', 35000.00, 0.00, 35000.00, 12.00, 2916.67, NULL, NULL, 1),
('PROP001', 14, 16, 'Fringe Benefits', 17600.00, 0.00, 17600.00, 1.00, 17600.00, 17, 'Salaries and Wages', 1),
('PROP001', 14, 18, 'Conference Travel', 5000.00, 0.00, 5000.00, 2.00, 2500.00, NULL, NULL, 1),
('PROP001', 14, 11, 'Lab Materials and Supplies', 15000.00, 0.00, 15000.00, 1.00, 15000.00, NULL, NULL, 1),
('PROP001', 14, 9, 'Indirect Costs', 0.00, 48600.00, 48600.00, 1.00, 48600.00, 14, 'MTDC', 1),
('PROP002', 14, 1, 'PI John Doe - 2 summer months', 22000.00, 0.00, 22000.00, 2.00, 11000.00, NULL, NULL, 1),
('PROP002', 14, 15, 'Postdoctoral Researcher', 55000.00, 0.00, 55000.00, 12.00, 4583.33, NULL, NULL, 1),
('PROP002', 14, 16, 'Fringe Benefits', 24640.00, 0.00, 24640.00, 1.00, 24640.00, 17, 'Salaries and Wages', 1),
('PROP002', 14, 17, 'Battery Testing Equipment', 75000.00, 0.00, 75000.00, 1.00, 75000.00, NULL, NULL, 1),
('PROP002', 14, 11, 'Battery Materials', 25000.00, 0.00, 25000.00, 1.00, 25000.00, NULL, NULL, 1),
('PROP002', 14, 9, 'Indirect Costs', 0.00, 98360.00, 98360.00, 1.00, 98360.00, 14, 'MTDC', 1),
('PROP003', 14, 1, 'PI Maria Garcia - 3 calendar months', 45000.00, 0.00, 45000.00, 3.00, 15000.00, NULL, NULL, 1),
('PROP003', 14, 15, 'Clinical Research Coordinator', 65000.00, 0.00, 65000.00, 12.00, 5416.67, NULL, NULL, 1),
('PROP003', 14, 16, 'Fringe Benefits', 35200.00, 0.00, 35200.00, 1.00, 35200.00, 17, 'Salaries and Wages', 1),
('PROP003', 14, 19, 'Patient Care Costs', 250000.00, 0.00, 250000.00, 50.00, 5000.00, NULL, NULL, 1),
('PROP003', 14, 20, 'Laboratory Testing', 100000.00, 0.00, 100000.00, 1.00, 100000.00, NULL, NULL, 1),
('PROP003', 14, 9, 'Indirect Costs', 0.00, 148560.00, 148560.00, 1.00, 148560.00, 16, 'MTDC', 1);

-- =============================================================================
-- Award
-- =============================================================================
INSERT INTO Award (Award_ID, Award_Number, Award_Title, Project_ID, Sponsor_Organization_ID, RFA_ID, Proposal_ID, Original_Start_Date, Original_End_Date, Current_Total_Funded, Current_End_Date, Total_Anticipated_Funding, Award_Status, CFDA_Number, Federal_Award_ID, Prime_Sponsor_Organization_ID, Flow_Through_Indicator) VALUES
('AWD001', '1R01CA123456-01', 'Machine Learning for Medical Diagnosis', 'PRJ001', 'SPON002', 'RFA002', 'PROP001', '2023-09-01', '2026-08-31', 1163250.00, '2026-08-31', 1163250.00, 'Active', '47.070', 'NSF-23-12345', NULL, FALSE),
('AWD002', 'DE-FG02-2024-001', 'Sustainable Energy Storage Systems', 'PRJ002', 'SPON004', 'RFA003', 'PROP002', '2024-01-01', '2025-12-31', 500000.00, '2025-12-31', 1512000.00, 'Active', '81.049', 'DOE-2024-001', NULL, FALSE),
('AWD003', '5P01CA987654-01', 'Cancer Immunotherapy Clinical Trial', 'PRJ003', 'SPON001', 'RFA001', 'PROP003', '2023-06-01', '2028-05-31', 3250000.00, '2028-05-31', 3250000.00, 'Active', '93.395', 'CA123456', NULL, FALSE),
('AWD004', 'NSF-DMS-2401234', 'Advanced Materials Chemistry', 'PRJ004', 'SPON002', NULL, 'PROP004', '2024-03-01', '2027-02-28', 699750.00, '2027-02-28', 699750.00, 'Active', '47.049', 'DMS-2401234', NULL, FALSE),
('AWD005', '5T32GM123456-01', 'Graduate Training Program in Data Science', 'PRJ005', 'SPON001', 'RFA004', 'PROP005', '2023-08-15', '2028-08-14', 1500000.00, '2028-08-14', 1500000.00, 'Active', '93.220', 'GM123456', NULL, FALSE);

-- =============================================================================
-- Modification
-- =============================================================================
INSERT INTO Modification (Modification_ID, Award_ID, Modification_Number, Event_Type_Value_ID, Event_Timestamp, Effective_Date, Funding_Amount_Change, New_End_Date, Affected_Personnel_ID, Change_Description, Justification, Impact_on_Budget, Requires_Prior_Approval, Approval_Status, Approved_By_Personnel_ID, Approval_Date) VALUES
('MOD001', 'AWD001', '00', 26, '2023-08-25 10:00:00', '2023-09-01', 387750.00, NULL, NULL, 'Initial award setup - Year 1 funding', 'Original award notice from sponsor', TRUE, FALSE, 'Not Required', NULL, NULL),
('MOD002', 'AWD002', '00', 26, '2023-12-20 14:30:00', '2024-01-01', 500000.00, NULL, NULL, 'Initial award setup - Incremental funding Year 1', 'Original award notice with incremental funding plan', TRUE, FALSE, 'Not Required', NULL, NULL),
('MOD003', 'AWD003', '00', 26, '2023-05-20 09:15:00', '2023-06-01', 650000.00, NULL, NULL, 'Initial award setup - Year 1 funding', 'Program project award initial funding', TRUE, FALSE, 'Not Required', NULL, NULL),
('MOD004', 'AWD002', '01', 27, '2024-11-15 11:00:00', '2025-01-01', 500000.00, NULL, NULL, 'Incremental funding - Year 2', 'Continued funding based on progress report', TRUE, FALSE, 'Not Required', NULL, NULL),
('MOD005', 'AWD001', '01', 29, '2024-12-01 13:00:00', '2025-01-01', 0.00, NULL, NULL, 'Budget reallocation - shift funds from travel to equipment', 'COVID-19 restrictions limit travel, need computing resources', TRUE, TRUE, 'Approved', 'P008', '2024-12-05'),
('MOD006', 'AWD003', '01', 31, '2024-09-10 10:30:00', '2024-10-01', 0.00, NULL, 'P009', 'Addition of Co-Investigator Linda Martinez', 'Expertise needed for new study arm', FALSE, TRUE, 'Approved', 'P008', '2024-09-20');

-- =============================================================================
-- Terms
-- =============================================================================
INSERT INTO Terms (AwardTerms_ID, Award_ID, Payment_Method, Invoicing_Frequency, Invoice_Submission_Days, Reporting_Requirements, Special_Conditions, Property_Requirements, Publication_Requirements, Closeout_Requirements, Record_Retention_Years) VALUES
(1, 'AWD001', 'Reimbursement', 'Quarterly', 30, 'Annual technical progress reports due 60 days after anniversary date. Final report due 90 days after project end.', 'Prior approval required for budget reallocations exceeding 25% of any budget category.', 'Equipment purchased with award funds remains property of institution. Must maintain equipment inventory.', 'Acknowledge NSF support in all publications. Submit copies of publications to NSF.', 'Submit final financial report within 120 days of award end. Return unused funds.', 3),
(2, 'AWD002', 'Letter-of-Credit', 'Monthly', 15, 'Quarterly progress reports required. Annual financial status report due within 90 days of budget period end.', 'All data must be made publicly available within 12 months of publication.', 'Equipment title vests with institution upon purchase. Disposition instructions required at closeout.', 'Acknowledge DOE support. Provide preprints of publications to DOE OSTI.', 'Final technical and financial reports due within 120 days. Patent reporting required.', 5),
(3, 'AWD003', 'Cost-Reimbursement', 'Quarterly', 53, 'Annual progress reports with patient enrollment data. Safety monitoring reports as required by DSMB. NIH Research Performance Progress Report (RPPR) required annually.', 'IRB approval required before patient enrollment. Annual IRB continuing review required. Adverse event reporting within 24 hours.', 'Clinical supplies must be stored according to FDA requirements. Inventory tracking required.', 'Clinical trial registration on ClinicalTrials.gov required. Publications must acknowledge NIH support.', 'Final RPPR due 120 days after project end. Closeout of patient records per HIPAA requirements.', 7),
(4, 'AWD004', 'Reimbursement', 'Semi-Annual', 30, 'Annual progress reports required through FastLane. Project outcomes report required within 90 days of completion.', 'Data management plan must be followed. Broader impacts activities must be documented.', 'Equipment inventory must be maintained. Final equipment inventory due at closeout.', 'Acknowledge NSF support in all publications and presentations. Upload publications to NSF Public Access Repository.', 'Final project report due 90 days after end date. Financial report due 120 days after end.', 3),
(5, 'AWD005', 'Advance', 'Annual', 60, 'Annual progress reports including trainee information. RPPR with trainee appointments table. Final program evaluation report required.', 'Trainee eligibility must be verified. Annual updates on trainee progress required. Post-training outcome tracking for 10 years.', 'Training materials become property of institution. Curriculum materials may need to be shared.', 'Training grant acknowledgment required in trainee publications. Annual publication list required.', 'Final trainee roster and outcomes report due 120 days after award end. Return unspent stipend funds.', 3);

-- =============================================================================
-- AwardBudgetPeriod
-- =============================================================================
INSERT INTO AwardBudgetPeriod (Award_ID, Period_Number, Start_Date, End_Date, Direct_Costs, Indirect_Costs, Total_Costs, Cost_Share_Amount, Period_Status) VALUES
('AWD001', 14, '2023-09-01', '2024-08-31', 250000.00, 137750.00, 387750.00, 0.00, 'Active'),
('AWD001', 15, '2024-09-01', '2025-08-31', 250000.00, 137750.00, 387750.00, 0.00, 'Released'),
('AWD001', 16, '2025-09-01', '2026-08-31', 250000.00, 137750.00, 387750.00, 0.00, 'Pending'),
('AWD002', 14, '2024-01-01', '2024-12-31', 385000.00, 115000.00, 500000.00, 0.00, 'Closed'),
('AWD002', 15, '2025-01-01', '2025-12-31', 385000.00, 115000.00, 500000.00, 0.00, 'Active'),
('AWD002', 16, '2026-01-01', '2026-12-31', 385000.00, 115000.00, 500000.00, 10000.00, 'Pending'),
('AWD002', 17, '2027-01-01', '2027-12-31', 45000.00, 12000.00, 57000.00, 0.00, 'Pending'),
('AWD003', 14, '2023-06-01', '2024-05-31', 500000.00, 150000.00, 650000.00, 0.00, 'Closed'),
('AWD003', 15, '2024-06-01', '2025-05-31', 500000.00, 150000.00, 650000.00, 0.00, 'Active'),
('AWD003', 16, '2025-06-01', '2026-05-31', 500000.00, 150000.00, 650000.00, 0.00, 'Pending'),
('AWD003', 17, '2026-06-01', '2027-05-31', 500000.00, 150000.00, 650000.00, 0.00, 'Pending'),
('AWD003', 18, '2027-06-01', '2028-05-31', 500000.00, 150000.00, 650000.00, 0.00, 'Pending'),
('AWD004', 14, '2024-03-01', '2025-02-28', 233250.00, 129542.50, 362792.50, 0.00, 'Active'),
('AWD004', 15, '2025-03-01', '2026-02-28', 233250.00, 129542.50, 362792.50, 0.00, 'Pending'),
('AWD004', 16, '2026-03-01', '2027-02-28', 233250.00, 129542.50, 362792.50, 0.00, 'Pending'),
('AWD005', 14, '2023-08-15', '2024-08-14', 300000.00, 0.00, 300000.00, 0.00, 'Closed'),
('AWD005', 15, '2024-08-15', '2025-08-14', 300000.00, 0.00, 300000.00, 0.00, 'Active'),
('AWD005', 16, '2025-08-15', '2026-08-14', 300000.00, 0.00, 300000.00, 0.00, 'Pending'),
('AWD005', 17, '2026-08-15', '2027-08-14', 300000.00, 0.00, 300000.00, 0.00, 'Pending'),
('AWD005', 18, '2027-08-15', '2028-08-14', 300000.00, 0.00, 300000.00, 0.00, 'Pending');

-- =============================================================================
-- AwardBudget
-- =============================================================================
INSERT INTO AwardBudget (Award_ID, AwardBudgetPeriod_ID, BudgetCategory_ID, Line_Item_Description, Approved_Direct_Cost, Approved_Indirect_Cost, Approved_Total_Cost, Current_Direct_Cost, Current_Indirect_Cost, Current_Total_Cost, Rate_Base_Used) VALUES
('AWD001', 14, 1, 'PI Jane Smith - 2 summer months', 20000.00, 0.00, 20000.00, 20000.00, 0.00, 20000.00, NULL),
('AWD001', 14, 15, 'Graduate Research Assistant', 35000.00, 0.00, 35000.00, 35000.00, 0.00, 35000.00, NULL),
('AWD001', 14, 16, 'Fringe Benefits', 17600.00, 0.00, 17600.00, 17600.00, 0.00, 17600.00, 'Salaries and Wages'),
('AWD001', 14, 18, 'Conference Travel', 5000.00, 0.00, 5000.00, 2000.00, 0.00, 2000.00, NULL),
('AWD001', 14, 17, 'GPU Computing Cluster', 0.00, 0.00, 0.00, 8000.00, 0.00, 8000.00, NULL),
('AWD001', 14, 11, 'Lab Materials and Supplies', 15000.00, 0.00, 15000.00, 12000.00, 0.00, 12000.00, NULL),
('AWD001', 14, 9, 'Indirect Costs', 0.00, 137750.00, 137750.00, 0.00, 137750.00, 137750.00, 'MTDC'),
('AWD002', 14, 1, 'PI John Doe - 2 summer months', 22000.00, 0.00, 22000.00, 22000.00, 0.00, 22000.00, NULL),
('AWD002', 14, 15, 'Postdoctoral Researcher', 55000.00, 0.00, 55000.00, 55000.00, 0.00, 55000.00, NULL),
('AWD002', 14, 16, 'Fringe Benefits', 24640.00, 0.00, 24640.00, 24640.00, 0.00, 24640.00, 'Salaries and Wages'),
('AWD002', 14, 17, 'Battery Testing Equipment', 75000.00, 0.00, 75000.00, 75000.00, 0.00, 75000.00, NULL),
('AWD002', 14, 11, 'Battery Materials', 25000.00, 0.00, 25000.00, 28000.00, 0.00, 28000.00, NULL),
('AWD002', 14, 9, 'Indirect Costs', 0.00, 115000.00, 115000.00, 0.00, 115000.00, 115000.00, 'MTDC'),
('AWD003', 14, 1, 'PI Maria Garcia - 3 calendar months', 45000.00, 0.00, 45000.00, 45000.00, 0.00, 45000.00, NULL),
('AWD003', 14, 15, 'Clinical Research Coordinator', 65000.00, 0.00, 65000.00, 65000.00, 0.00, 65000.00, NULL),
('AWD003', 14, 16, 'Fringe Benefits', 35200.00, 0.00, 35200.00, 35200.00, 0.00, 35200.00, 'Salaries and Wages'),
('AWD003', 14, 19, 'Patient Care Costs', 250000.00, 0.00, 250000.00, 245000.00, 0.00, 245000.00, NULL),
('AWD003', 14, 20, 'Laboratory Testing', 100000.00, 0.00, 100000.00, 105000.00, 0.00, 105000.00, NULL),
('AWD003', 14, 9, 'Indirect Costs', 0.00, 150000.00, 150000.00, 0.00, 150000.00, 150000.00, 'MTDC');

-- =============================================================================
-- Subaward
-- =============================================================================
INSERT INTO Subaward (Subaward_ID, Prime_Award_ID, Subrecipient_Organization_ID, Subaward_Number, Subaward_Amount, Start_Date, End_Date, Subaward_Status, Statement_of_Work, PI_Name, Monitoring_Plan, Risk_Level) VALUES
('SUB001', 'AWD001', 'SUBRE001', 'AWD001-SUB-001', 150000.00, '2023-10-01', '2026-08-31', 'Active', 'Tech Research Institute will provide specialized software development and algorithm optimization services for the machine learning platform. Deliverables include custom neural network architectures and performance benchmarking reports.', 'Dr. Robert Johnson', 'Quarterly progress reports required. Annual site visit. Monthly financial review.', 'Low'),
('SUB002', 'AWD002', 'SUBRE002', 'AWD002-SUB-001', 200000.00, '2024-03-01', '2027-12-31', 'Active', 'Metro University will conduct electrochemical characterization of battery materials and provide testing facilities. Deliverables include materials characterization reports and performance testing data.', 'Prof. Sarah Williams', 'Semi-annual progress reports. Financial reports quarterly. Risk assessment annual.', 'Medium'),
('SUB003', 'AWD003', 'SUBRE003', 'AWD003-SUB-001', 450000.00, '2023-09-01', '2028-05-31', 'Active', 'Coastal Medical Center will serve as clinical trial site for patient enrollment and treatment. Responsible for 25 patient enrollments, adverse event reporting, and clinical data collection per protocol.', 'Dr. Michael Chen', 'Monthly enrollment reports. Real-time adverse event reporting. Quarterly site monitoring visits. Annual audit.', 'High');

-- =============================================================================
-- CostShare
-- =============================================================================
INSERT INTO CostShare (Award_ID, Committed_Amount, Commitment_Type, Source_Organization_ID, Source_Fund_Code, Source_Description, Is_Mandatory, CostShare_Status, Met_Amount) VALUES
('AWD002', 50000.00, 'Cash', 'DEPT002', 'DEPT-2024-CS', 'Department commitment for graduate student support', TRUE, 'In Progress', 35000.00),
('AWD003', 75000.00, 'In-Kind', 'DEPT003', NULL, 'Clinical facility usage and nursing support', FALSE, 'In Progress', 50000.00),
('AWD002', 10000.00, 'Waived IDC', 'INST001', NULL, 'Waived indirect costs on subcontract', TRUE, 'Committed', 0.00);

-- =============================================================================
-- Invoice
-- =============================================================================
INSERT INTO Invoice (Invoice_ID, Award_ID, Invoice_Number, AwardBudgetPeriod_ID, Invoice_Date, Period_Start_Date, Period_End_Date, Direct_Costs, Indirect_Costs, Cost_Share, Total_Amount, Invoice_Status, Submission_Date, Payment_Date, Payment_Amount) VALUES
('INV001', 'AWD001', 'AWD001-INV-001', 14, '2023-12-31', '2023-09-01', '2023-12-31', 85000.00, 47175.00, 0.00, 132175.00, 'Paid', '2024-01-15', '2024-02-10', 132175.00),
('INV002', 'AWD001', 'AWD001-INV-002', 14, '2024-03-31', '2024-01-01', '2024-03-31', 80000.00, 44400.00, 0.00, 124400.00, 'Paid', '2024-04-12', '2024-05-05', 124400.00),
('INV003', 'AWD001', 'AWD001-INV-003', 14, '2024-06-30', '2024-04-01', '2024-06-30', 75000.00, 41625.00, 0.00, 116625.00, 'Paid', '2024-07-15', '2024-08-08', 116625.00),
('INV004', 'AWD002', 'AWD002-INV-001', 14, '2024-01-31', '2024-01-01', '2024-01-31', 35000.00, 10500.00, 0.00, 45500.00, 'Paid', '2024-02-10', '2024-02-28', 45500.00),
('INV005', 'AWD002', 'AWD002-INV-002', 14, '2024-02-29', '2024-02-01', '2024-02-29', 32000.00, 9600.00, 0.00, 41600.00, 'Paid', '2024-03-10', '2024-03-25', 41600.00),
('INV006', 'AWD003', 'AWD003-INV-001', 14, '2023-09-30', '2023-06-01', '2023-09-30', 155000.00, 46500.00, 0.00, 201500.00, 'Paid', '2023-10-25', '2023-11-20', 201500.00),
('INV007', 'AWD003', 'AWD003-INV-002', 14, '2023-12-31', '2023-10-01', '2023-12-31', 145000.00, 43500.00, 0.00, 188500.00, 'Paid', '2024-01-30', '2024-02-25', 188500.00),
('INV008', 'AWD004', 'AWD004-INV-001', 13, '2024-08-31', '2024-03-01', '2024-08-31', 115000.00, 63825.00, 0.00, 178825.00, 'Submitted', '2024-09-15', NULL, NULL);

-- =============================================================================
-- AwardDeliverable
-- =============================================================================
INSERT INTO AwardDeliverable (Award_ID, Deliverable_Type_Value_ID, AwardBudgetPeriod_ID, Deliverable_Number, Due_Date, Submission_Date, Deliverable_Status, Responsible_Personnel_ID, Reviewed_By_Personnel_ID, Review_Date, Comments) VALUES
('AWD001', 34, 14, 'AWD001-RPT-001', '2024-09-30', '2024-09-25', 'Accepted', 'P001', 'P008', '2024-10-02', 'Comprehensive progress report with excellent results. All milestones met.'),
('AWD001', 35, 14, 'AWD001-FIN-001', '2024-10-30', '2024-10-15', 'Accepted', 'P005', 'P008', '2024-10-20', 'Financial report complete and accurate. Spending on track.'),
('AWD002', 34, 14, 'AWD002-RPT-001', '2025-01-31', NULL, 'Pending', 'P002', NULL, NULL, NULL),
('AWD003', 36, 14, 'AWD003-ANN-001', '2024-06-30', '2024-06-20', 'Accepted', 'P003', 'P008', '2024-07-05', 'Annual report approved. Patient enrollment ahead of schedule.'),
('AWD003', 39, 15, 'AWD003-INV-001', '2024-12-15', '2024-12-10', 'Submitted', 'P003', NULL, NULL, NULL),
('AWD004', 35, 13, 'AWD004-FIN-001', '2025-04-30', NULL, 'Pending', 'P004', NULL, NULL, NULL),
('AWD005', 34, 15, 'AWD005-RPT-001', '2025-10-15', NULL, 'Pending', 'P001', NULL, NULL, NULL);

-- =============================================================================
-- ProjectRole
-- =============================================================================
INSERT INTO ProjectRole (Project_ID, Personnel_ID, Role_Value_ID, Is_Key_Personnel, Funding_Award_ID, Start_Date, End_Date, FTE_Percent, Salary_Charged) VALUES
('PRJ001', 'P001', 10, TRUE, 'AWD001', '2023-09-01', '2026-08-31', 25.00, 60000.00),
('PRJ001', 'P005', 14, FALSE, 'AWD001', '2023-09-01', '2026-08-31', 50.00, 45000.00),
('PRJ001', 'P007', 12, FALSE, 'AWD001', '2023-09-01', '2026-08-31', 100.00, 105000.00),
('PRJ002', 'P002', 10, TRUE, 'AWD002', '2024-01-01', '2027-12-31', 20.00, 66000.00),
('PRJ002', 'P006', 12, TRUE, 'AWD002', '2024-01-01', '2027-12-31', 100.00, 165000.00),
('PRJ002', 'P011', 11, TRUE, 'AWD002', '2024-01-01', '2027-12-31', 15.00, 35000.00),
('PRJ003', 'P003', 10, TRUE, 'AWD003', '2023-06-01', '2028-05-31', 30.00, 135000.00),
('PRJ003', 'P009', 11, TRUE, 'AWD003', '2023-06-01', '2028-05-31', 25.00, 112500.00),
('PRJ003', 'P013', 12, FALSE, 'AWD003', '2024-01-01', '2026-12-31', 50.00, 60000.00),
('PRJ004', 'P004', 10, TRUE, 'AWD004', '2024-03-01', '2027-02-28', 25.00, 67500.00),
('PRJ005', 'P001', 10, TRUE, 'AWD005', '2023-08-15', '2028-08-14', 15.00, 67500.00),
('PRJ005', 'P014', 11, TRUE, 'AWD005', '2023-08-15', '2028-08-14', 10.00, 45000.00),
('PRJ006', 'P001', 10, TRUE, NULL, '2024-06-01', '2027-05-31', 20.00, NULL),
('PRJ006', 'P007', 12, FALSE, NULL, '2024-06-01', '2027-05-31', 100.00, NULL);

-- =============================================================================
-- Fund
-- =============================================================================
INSERT INTO Fund (Fund_Code, Fund_Name, Fund_Type_Value_ID, Organization_ID) VALUES
('FUND-AWD001', 'NSF AI Research Institute Award', 15, 'DEPT001'),
('FUND-AWD002', 'DOE Energy Storage Research', 15, 'DEPT002'),
('FUND-AWD003', 'NIH Cancer Clinical Trial', 15, 'DEPT003'),
('FUND-AWD004', 'NSF Materials Chemistry', 15, 'DEPT004'),
('FUND-AWD005', 'NIH Training Grant Data Science', 15, 'DEPT001'),
('FUND-DEPT001-INT', 'CS Department Internal Funds', 16, 'DEPT001'),
('FUND-INST-GIFT', 'University General Gift Fund', 17, 'INST001'),
('FUND-ENDOW-CS', 'Computer Science Endowment', 18, 'DEPT001');

-- =============================================================================
-- Account
-- =============================================================================
INSERT INTO Account (Account_Code, Account_Name, Account_Category, Account_Type, Parent_Account_Code) VALUES
('1000', 'Assets', 'Balance Sheet', 'Asset', NULL),
('1100', 'Cash and Cash Equivalents', 'Current Assets', 'Asset', '1000'),
('2000', 'Liabilities', 'Balance Sheet', 'Liability', NULL),
('2100', 'Accounts Payable', 'Current Liabilities', 'Liability', '2000'),
('3000', 'Fund Balance', 'Balance Sheet', 'Equity', NULL),
('4000', 'Revenue', 'Income Statement', 'Revenue', NULL),
('4100', 'Sponsored Revenue', 'Operating Revenue', 'Revenue', '4000'),
('5000', 'Expenses', 'Income Statement', 'Expense', NULL),
('5100', 'Salaries and Wages', 'Personnel Expenses', 'Expense', '5000'),
('5200', 'Fringe Benefits', 'Personnel Expenses', 'Expense', '5000'),
('5300', 'Travel', 'Operating Expenses', 'Expense', '5000'),
('5400', 'Equipment', 'Capital Expenses', 'Expense', '5000'),
('5500', 'Supplies and Materials', 'Operating Expenses', 'Expense', '5000'),
('5600', 'Contractual Services', 'Operating Expenses', 'Expense', '5000'),
('5700', 'Indirect Costs', 'Operating Expenses', 'Expense', '5000');

-- =============================================================================
-- FinanceCode
-- =============================================================================
INSERT INTO FinanceCode (Finance_Code, Finance_Name, Award_ID, Purpose_Value_ID, Organization_ID) VALUES
('FC-AWD001-DIR', 'AWD001 Direct Costs', 'AWD001', 46, 'DEPT001'),
('FC-AWD001-IDC', 'AWD001 Indirect Costs', 'AWD001', 48, 'INST001'),
('FC-AWD002-DIR', 'AWD002 Direct Costs', 'AWD002', 46, 'DEPT002'),
('FC-AWD002-IDC', 'AWD002 Indirect Costs', 'AWD002', 48, 'INST001'),
('FC-AWD002-CS', 'AWD002 Cost Share', 'AWD002', 47, 'DEPT002'),
('FC-AWD003-DIR', 'AWD003 Direct Costs', 'AWD003', 46, 'DEPT003'),
('FC-AWD003-IDC', 'AWD003 Indirect Costs', 'AWD003', 48, 'INST001'),
('FC-AWD003-SUB', 'AWD003 Subcontract', 'AWD003', 49, 'DEPT003'),
('FC-DEPT-UNRESTR', 'Department Unrestricted', NULL, 46, 'DEPT001');

-- =============================================================================
-- Transaction
-- =============================================================================
INSERT INTO Transaction (Transaction_ID, Fund_Code, Account_Code, Finance_Code, Transaction_Date, Fiscal_Year, Fiscal_Period, Transaction_Amount, Transaction_Type_Value_ID, Description, Award_ID, Project_ID, AwardBudgetPeriod_ID, Document_Number, Journal_ID, Vendor_ID, Personnel_ID, Reference_Number, Is_Reconciled) VALUES
('TXN001', 'FUND-AWD001', '4100', 'FC-AWD001-DIR', '2023-09-01', 2024, 14, 387750.00, 20, 'Initial award funding Year 1', 'AWD001', 'PRJ001', 14, 'AWD001-00', 'JE-2023-0901', NULL, NULL, 'NSF-23-12345', TRUE),
('TXN002', 'FUND-AWD001', '5100', 'FC-AWD001-DIR', '2023-09-30', 2024, 14, 5000.00, 19, 'PI salary - September', 'AWD001', 'PRJ001', 14, 'PAY-2023-09-001', 'JE-2023-0930', NULL, 'P001', NULL, TRUE),
('TXN003', 'FUND-AWD001', '5100', 'FC-AWD001-DIR', '2023-09-30', 2024, 14, 2916.67, 19, 'Graduate RA salary - September', 'AWD001', 'PRJ001', 14, 'PAY-2023-09-002', 'JE-2023-0930', NULL, 'P007', NULL, TRUE),
('TXN004', 'FUND-AWD001', '5200', 'FC-AWD001-DIR', '2023-09-30', 2024, 14, 2533.33, 19, 'Fringe benefits - September payroll', 'AWD001', 'PRJ001', 14, 'FB-2023-09-001', 'JE-2023-0930', NULL, NULL, NULL, TRUE),
('TXN005', 'FUND-AWD001', '5500', 'FC-AWD001-DIR', '2023-10-15', 2024, 15, 2500.00, 19, 'Lab supplies - chemicals and reagents', 'AWD001', 'PRJ001', 14, 'PO-2023-1234', 'JE-2023-1015', 'VEND001', NULL, 'INV-LAB-5678', TRUE),
('TXN006', 'FUND-AWD001', '5300', 'FC-AWD001-DIR', '2023-11-20', 2024, 16, 1500.00, 19, 'Conference travel - NeurIPS 2023', 'AWD001', 'PRJ001', 14, 'TR-2023-0045', 'JE-2023-1120', NULL, 'P001', NULL, TRUE),
('TXN007', 'FUND-AWD001', '5700', 'FC-AWD001-IDC', '2023-12-31', 2024, 17, 15725.00, 19, 'Indirect costs Q1', 'AWD001', 'PRJ001', 14, 'IDC-2023-Q1', 'JE-2023-1231', NULL, NULL, NULL, TRUE),
('TXN008', 'FUND-AWD002', '4100', 'FC-AWD002-DIR', '2024-01-01', 2024, 20, 500000.00, 20, 'Initial award funding Year 1', 'AWD002', 'PRJ002', 17, 'AWD002-00', 'JE-2024-0101', NULL, NULL, 'DOE-2024-001', TRUE),
('TXN009', 'FUND-AWD002', '5400', 'FC-AWD002-DIR', '2024-02-15', 2024, 8, 75000.00, 19, 'Battery testing equipment purchase', 'AWD002', 'PRJ002', 17, 'PO-2024-0012', 'JE-2024-0215', 'VEND001', NULL, 'INV-EQ-9876', TRUE),
('TXN010', 'FUND-AWD002', '5100', 'FC-AWD002-DIR', '2024-01-31', 2024, 20, 4583.33, 19, 'Postdoc salary - January', 'AWD002', 'PRJ002', 17, 'PAY-2024-01-001', 'JE-2024-0131', NULL, 'P006', NULL, TRUE),
('TXN011', 'FUND-AWD002-CS', '5100', 'FC-AWD002-CS', '2024-01-31', 2024, 20, 2916.67, 25, 'Cost share - Graduate student salary', 'AWD002', 'PRJ002', 17, 'CS-2024-01-001', 'JE-2024-0131', NULL, 'P007', NULL, TRUE),
('TXN012', 'FUND-AWD003', '4100', 'FC-AWD003-DIR', '2023-06-01', 2024, 12, 650000.00, 20, 'Initial award funding Year 1', 'AWD003', 'PRJ003', 8, 'AWD003-00', 'JE-2023-0601', NULL, NULL, 'CA123456', TRUE),
('TXN013', 'FUND-AWD003', '5100', 'FC-AWD003-DIR', '2023-06-30', 2024, 12, 15000.00, 19, 'PI salary - June', 'AWD003', 'PRJ003', 8, 'PAY-2023-06-001', 'JE-2023-0630', NULL, 'P003', NULL, TRUE),
('TXN014', 'FUND-AWD003', '5600', 'FC-AWD003-SUB', '2023-09-15', 2024, 16, 90000.00, 19, 'Subaward payment - Coastal Medical Center', 'AWD003', 'PRJ003', 8, 'SUB-2023-001', 'JE-2023-0915', 'SUBRE003', NULL, 'CMC-INV-001', TRUE),
('TXN015', 'FUND-AWD003', '5500', 'FC-AWD003-DIR', '2023-07-20', 2024, 14, 12000.00, 19, 'Clinical trial supplies', 'AWD003', 'PRJ003', 8, 'PO-2023-2345', 'JE-2023-0720', 'VEND001', NULL, 'INV-MED-1122', TRUE),
('TXN016', 'FUND-AWD004', '4100', 'FC-AWD004-DIR', '2024-03-01', 2024, 9, 362792.50, 20, 'Award funding Year 1', 'AWD004', 'PRJ004', 13, 'AWD004-00', 'JE-2024-0301', NULL, NULL, 'DMS-2401234', TRUE),
('TXN017', 'FUND-AWD004', '5500', 'FC-AWD004-DIR', '2024-04-10', 2024, 10, 8500.00, 19, 'Chemistry lab materials and reagents', 'AWD004', 'PRJ004', 13, 'PO-2024-0234', 'JE-2024-0410', 'VEND001', NULL, 'INV-CHEM-3344', TRUE),
('TXN018', 'FUND-DEPT001-INT', '5500', 'FC-DEPT-UNRESTR', '2024-05-15', 2024, 11, 3500.00, 19, 'Department supplies for PRJ006', NULL, 'PRJ006', NULL, 'PO-2024-0456', 'JE-2024-0515', 'VEND002', NULL, 'INV-OFF-5566', TRUE),
('TXN019', 'FUND-AWD001', '5600', 'FC-AWD001-DIR', '2023-10-01', 2024, 15, 12500.00, 19, 'Subaward payment - Tech Research Institute', 'AWD001', 'PRJ001', 14, 'SUB-2023-002', 'JE-2023-1001', 'SUBRE001', NULL, 'TRI-INV-001', TRUE),
('TXN020', 'FUND-AWD002', '5500', 'FC-AWD002-DIR', '2024-03-20', 2024, 9, 5000.00, 21, 'Encumbrance - Battery materials order', 'AWD002', 'PRJ002', 17, 'ENC-2024-0045', 'JE-2024-0320', 'VEND001', NULL, 'PO-2024-0089', FALSE);

-- =============================================================================
-- Effort
-- =============================================================================
INSERT INTO Effort (ProjectRole_ID, Period_Start_Date, Period_End_Date, Committed_Percent, Committed_Person_Months, Actual_Percent, Variance_Percent, Is_Certified, Certification_Date, Certified_By_Personnel_ID, Certification_Method, Requires_Prior_Approval, Prior_Approval_Status) VALUES
(1, '2023-09-01', '2024-02-29', 25.00, 1.50, 26.00, 1.00, TRUE, '2024-03-15', 'P001', 'PAR', FALSE, 'Not Required'),
(1, '2024-03-01', '2024-08-31', 25.00, 1.50, 24.00, -1.00, TRUE, '2024-09-10', 'P001', 'PAR', FALSE, 'Not Required'),
(2, '2023-09-01', '2024-02-29', 50.00, 3.00, 52.00, 2.00, TRUE, '2024-03-15', 'P005', 'Activity Report', FALSE, 'Not Required'),
(3, '2023-09-01', '2024-02-29', 100.00, 6.00, 100.00, 0.00, TRUE, '2024-03-15', 'P007', 'Timesheet', FALSE, 'Not Required'),
(4, '2024-01-01', '2024-06-30', 20.00, 1.20, 18.00, -2.00, TRUE, '2024-07-12', 'P002', 'PAR', FALSE, 'Not Required'),
(5, '2024-01-01', '2024-06-30', 100.00, 6.00, 95.00, -5.00, TRUE, '2024-07-12', 'P006', 'Activity Report', FALSE, 'Not Required'),
(7, '2023-06-01', '2023-11-30', 30.00, 1.80, 32.00, 2.00, TRUE, '2023-12-15', 'P003', 'PAR', FALSE, 'Not Required'),
(7, '2023-12-01', '2024-05-31', 30.00, 1.80, 28.00, -2.00, TRUE, '2024-06-10', 'P003', 'PAR', FALSE, 'Not Required'),
(8, '2023-06-01', '2023-11-30', 25.00, 1.50, 25.00, 0.00, TRUE, '2023-12-15', 'P009', 'PAR', FALSE, 'Not Required'),
(10, '2024-03-01', '2024-08-31', 25.00, 1.50, 26.00, 1.00, TRUE, '2024-09-12', 'P004', 'PAR', FALSE, 'Not Required'),
(11, '2023-08-15', '2024-02-14', 15.00, 0.90, 14.00, -1.00, TRUE, '2024-03-01', 'P001', 'PAR', FALSE, 'Not Required'),
(11, '2024-02-15', '2024-08-14', 15.00, 0.90, 16.00, 1.00, TRUE, '2024-08-25', 'P001', 'PAR', FALSE, 'Not Required');

-- =============================================================================
-- ComplianceRequirement
-- =============================================================================
INSERT INTO ComplianceRequirement (ComplianceRequirement_ID, Requirement_Number, Requirement_Title, Requirement_Type, Project_ID, Review_Type, Initial_Approval_Date, Expiration_Date, Requirement_Status, Principal_Investigator_ID, Approval_Body, Risk_Level) VALUES
('COMP001', 'IRB-2023-1234', 'Machine Learning Medical Diagnosis Human Subjects Protocol', 'IRB', 'PRJ001', 'Expedited', '2023-07-15', '2024-07-14', 'Approved', 'P001', 'State University IRB', 'Minimal'),
('COMP002', 'IRB-2023-5678', 'Cancer Immunotherapy Clinical Trial Phase II', 'IRB', 'PRJ003', 'Full Board', '2023-04-20', '2024-04-19', 'Approved', 'P003', 'State University IRB', 'More than Minimal'),
('COMP003', 'IBC-2024-0012', 'Recombinant DNA and Viral Vectors - Cancer Trial', 'IBC', 'PRJ003', 'Full Board', '2023-05-10', '2024-05-09', 'Approved', 'P003', 'Institutional Biosafety Committee', 'More than Minimal'),
('COMP004', 'COI-2023-9876', 'Conflict of Interest Review - TechCorp Collaboration', 'COI', 'PRJ001', 'Administrative', '2023-08-01', NULL, 'Approved', 'P001', 'Office of Research Integrity', 'Minimal'),
('COMP005', 'IACUC-2024-3456', 'Animal Study - Advanced Materials Toxicity Testing', 'IACUC', 'PRJ004', 'Full Board', '2024-02-15', '2025-02-14', 'Approved', 'P004', 'Institutional Animal Care and Use Committee', 'More than Minimal'),
('COMP006', 'IRB-2024-7890', 'Annual Continuing Review - ML Medical Diagnosis', 'IRB', 'PRJ001', 'Expedited', '2024-07-15', '2025-07-14', 'Approved', 'P001', 'State University IRB', 'Minimal');

-- =============================================================================
-- ConflictOfInterest
-- =============================================================================
INSERT INTO ConflictOfInterest (Personnel_ID, Project_ID, Award_ID, Disclosure_Date, Relationship_Type_Value_ID, Entity_Name, Financial_Interest_Amount, Relationship_Description, Management_Plan, ConflictOfInterest_Status, Review_Date, Reviewed_By_Personnel_ID) VALUES
('P001', 'PRJ001', 'AWD001', '2023-07-15', 50, 'TechCorp Industries', 15000.00, 'Consulting agreement with TechCorp for machine learning algorithm review. TechCorp has expressed interest in licensing technology developed under this grant.', 'PI will not involve TechCorp in research decisions. Independent oversight committee established. Annual reporting to sponsor required.', 'Management Plan Required', '2023-07-25', 'P008'),
('P002', 'PRJ002', 'AWD002', '2024-01-10', 53, 'Battery Innovations Inc', 50000.00, 'Equity ownership (2%) in startup company developing battery technology. Company founded before grant award. No current involvement.', 'PI will not use grant funds for activities that benefit the company. Independent evaluation of results. Disclosure to all collaborators.', 'Manageable Conflict', '2024-01-20', 'P008'),
('P004', 'PRJ004', NULL, '2024-02-20', 51, 'ChemSupply Corporation', 5000.00, 'Spouse employed by chemical supply company that may provide materials for research project.', 'All purchases will use competitive bidding process. PI will not participate in vendor selection decisions. Department head will approve all ChemSupply purchases.', 'Manageable Conflict', '2024-03-01', 'P008');

-- =============================================================================
-- Document
-- =============================================================================
INSERT INTO Document (Document_Type_Value_ID, Related_Entity_Type, Related_Entity_ID, File_Name, Storage_Location, File_Size_Bytes, MIME_Type, File_Hash, Version_Number, Description) VALUES
(55, 'Proposal', 'PROP001', 'ML_Medical_Diagnosis_Proposal.pdf', '/documents/proposals/2023/PROP001/ML_Medical_Diagnosis_Proposal.pdf', 5242880, 'application/pdf', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', 14, 'Full NSF proposal with project description, budget, and biographical sketches'),
(56, 'Award', 'AWD001', 'NSF_Award_Notice_1R01CA123456.pdf', '/documents/awards/2023/AWD001/NSF_Award_Notice.pdf', 1048576, 'application/pdf', 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1', 14, 'Official NSF award notice with terms and conditions'),
(57, 'Award', 'AWD001', 'Annual_Progress_Report_Year1.pdf', '/documents/reports/2024/AWD001/Annual_Progress_Report_Year1.pdf', 3145728, 'application/pdf', 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2', 14, 'Year 1 annual technical progress report submitted to NSF'),
(58, 'Award', 'AWD001', 'Financial_Report_Year1.xlsx', '/documents/financial/2024/AWD001/Financial_Report_Year1.xlsx', 524288, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3', 14, 'Year 1 financial status report with detailed expenditures'),
(59, 'Award', 'AWD002', 'DOE_Award_Contract.pdf', '/documents/awards/2024/AWD002/DOE_Award_Contract.pdf', 2097152, 'application/pdf', 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4', 14, 'DOE award contract with detailed terms and conditions'),
(62, 'Subaward', 'SUB001', 'Subaward_Agreement_TechResearch.pdf', '/documents/subawards/2023/SUB001/Subaward_Agreement.pdf', 1572864, 'application/pdf', 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5', 14, 'Executed subaward agreement with Tech Research Institute including SOW'),
(61, 'Award', 'AWD003', 'IRB_Approval_Letter.pdf', '/documents/compliance/2023/COMP002/IRB_Approval_Letter.pdf', 262144, 'application/pdf', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6', 14, 'IRB full board approval letter for clinical trial protocol'),
(63, 'ComplianceRequirement', 'COMP002', 'Clinical_Protocol_v1.pdf', '/documents/compliance/2023/COMP002/Clinical_Protocol_v1.pdf', 4194304, 'application/pdf', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7', 14, 'Clinical trial protocol submitted to IRB'),
(60, 'Award', 'AWD003', 'NIH_Program_Officer_Email.msg', '/documents/correspondence/2024/AWD003/PO_Email_20240115.msg', 102400, 'application/vnd.ms-outlook', 'i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8', 14, 'Email correspondence from NIH program officer regarding modification'),
(55, 'Proposal', 'PROP002', 'Energy_Storage_Proposal.pdf', '/documents/proposals/2024/PROP002/Energy_Storage_Proposal.pdf', 6291456, 'application/pdf', 'j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9', 14, 'DOE full proposal with technical approach and budget justification'),
(61, 'Award', 'AWD001', 'Budget_Revision_Justification.docx', '/documents/modifications/2024/MOD005/Budget_Revision_Justification.docx', 204800, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0', 14, 'Justification for budget reallocation modification MOD005'),
(63, 'ConflictOfInterest', 'COMP004', 'COI_Management_Plan.pdf', '/documents/compliance/2023/COMP004/COI_Management_Plan.pdf', 524288, 'application/pdf', 'l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1', 14, 'Conflict of interest management plan for TechCorp relationship'),
(58, 'Invoice', 'INV001', 'Invoice_Detail_Report.xlsx', '/documents/invoices/2024/INV001/Invoice_Detail_Report.xlsx', 409600, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'm3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1l2', 14, 'Detailed expenditure report supporting invoice INV001');

-- =============================================================================
-- ActivityLog
-- =============================================================================
INSERT INTO ActivityLog (Table_Name, Record_ID, Action_Type, Action_Timestamp, User_ID, Old_Values, New_Values, IP_Address, Session_ID) VALUES
('Award', 'AWD001', 'INSERT', '2023-08-25 10:15:00', 'P008', NULL, '{"Award_Number":"1R01CA123456-01","Award_Status":"Pending"}', '10.1.1.100', 'SESSION-2023-08-25-001'),
('Award', 'AWD001', 'UPDATE', '2023-09-01 08:00:00', 'P008', '{"Award_Status":"Pending"}', '{"Award_Status":"Active"}', '10.1.1.100', 'SESSION-2023-09-01-001'),
('Modification', 'MOD001', 'INSERT', '2023-08-25 10:30:00', 'P008', NULL, '{"Modification_Number":"00","Event_Type":"INITIAL","Funding_Amount_Change":387750.00}', '10.1.1.100', 'SESSION-2023-08-25-002'),
('Project', 'PRJ001', 'UPDATE', '2024-06-15 14:20:00', 'P001', '{"Project_Status":"Active"}', '{"Project_Status":"Active"}', '10.1.2.50', 'SESSION-2024-06-15-001'),
('Proposal', 'PROP001', 'INSERT', '2023-05-10 09:00:00', 'P005', NULL, '{"Proposal_Number":"SU-2023-0101","Internal_Approval_Status":"Draft"}', '10.1.2.25', 'SESSION-2023-05-10-001'),
('Proposal', 'PROP001', 'UPDATE', '2023-06-15 11:30:00', 'P001', '{"Internal_Approval_Status":"Draft"}', '{"Internal_Approval_Status":"In Review"}', '10.1.2.50', 'SESSION-2023-06-15-001'),
('Proposal', 'PROP001', 'UPDATE', '2023-07-01 10:00:00', 'P012', '{"Internal_Approval_Status":"In Review"}', '{"Internal_Approval_Status":"Approved"}', '10.1.1.105', 'SESSION-2023-07-01-001'),
('Invoice', 'INV001', 'INSERT', '2024-01-15 13:45:00', 'P005', NULL, '{"Invoice_Number":"AWD001-INV-001","Invoice_Status":"Draft"}', '10.1.2.25', 'SESSION-2024-01-15-001'),
('Invoice', 'INV001', 'UPDATE', '2024-01-20 09:15:00', 'P008', '{"Invoice_Status":"Draft"}', '{"Invoice_Status":"Submitted"}', '10.1.1.100', 'SESSION-2024-01-20-001'),
('Invoice', 'INV001', 'UPDATE', '2024-02-10 15:30:00', 'P008', '{"Invoice_Status":"Submitted","Payment_Date":null}', '{"Invoice_Status":"Paid","Payment_Date":"2024-02-10"}', '10.1.1.100', 'SESSION-2024-02-10-001'),
('Transaction', 'TXN001', 'INSERT', '2023-09-01 10:00:00', 'SYSTEM', NULL, '{"Transaction_Amount":387750.00,"Transaction_Type":"REVENUE"}', '10.1.1.1', 'BATCH-2023-09-01'),
('Transaction', 'TXN002', 'INSERT', '2023-09-30 23:59:00', 'PAYROLL', NULL, '{"Transaction_Amount":5000.00,"Transaction_Type":"EXPENSE"}', '10.1.1.2', 'PAYROLL-2023-09'),
('ComplianceRequirement', 'COMP001', 'INSERT', '2023-07-15 11:00:00', 'P001', NULL, '{"Requirement_Number":"IRB-2023-1234","Requirement_Status":"In Review"}', '10.1.2.50', 'SESSION-2023-07-15-001'),
('ComplianceRequirement', 'COMP001', 'UPDATE', '2023-07-20 14:30:00', 'IRB-STAFF', '{"Requirement_Status":"In Review"}', '{"Requirement_Status":"Approved"}', '10.1.3.20', 'SESSION-2023-07-20-001'),
('AwardDeliverable', 'AWD001', 'SELECT', '2024-09-15 10:00:00', 'P001', NULL, NULL, '10.1.2.50', 'SESSION-2024-09-15-001'),
('Personnel', 'P001', 'UPDATE', '2024-03-10 09:30:00', 'P001', '{"Primary_Email":"jane.smith@stateuniversity.edu"}', '{"Primary_Email":"jane.smith@stateuniversity.edu"}', '10.1.2.50', 'SESSION-2024-03-10-001'),
('ConflictOfInterest', '1', 'INSERT', '2023-07-15 16:00:00', 'P001', NULL, '{"ConflictOfInterest_Status":"Under Review"}', '10.1.2.50', 'SESSION-2023-07-15-002'),
('ConflictOfInterest', '1', 'UPDATE', '2023-07-25 10:00:00', 'P008', '{"ConflictOfInterest_Status":"Under Review"}', '{"ConflictOfInterest_Status":"Management Plan Required"}', '10.1.1.100', 'SESSION-2023-07-25-001'),
('Subaward', 'SUB001', 'INSERT', '2023-09-20 14:00:00', 'P008', NULL, '{"Subaward_Number":"AWD001-SUB-001","Subaward_Status":"Pending"}', '10.1.1.100', 'SESSION-2023-09-20-001'),
('Subaward', 'SUB001', 'UPDATE', '2023-10-01 09:00:00', 'P008', '{"Subaward_Status":"Pending"}', '{"Subaward_Status":"Active"}', '10.1.1.100', 'SESSION-2023-10-01-001');

-- =============================================================================
-- End of Sample Data
-- =============================================================================
