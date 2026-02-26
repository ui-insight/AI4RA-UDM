interface CellValue {
  value: string;
  color?: string;
  fontWeight?: string;
  mono?: boolean;
  fontSize?: string;
}

type Cell = string | CellValue;

interface ViewColumn {
  header: string;
  align?: 'left' | 'right' | 'center';
}

export interface ExampleView {
  name: string;
  description: string;
  color: string;
  columns: ViewColumn[];
  rows: Cell[][];
}

const mono = (value: string): CellValue => ({ value, mono: true });
const colored = (value: string, color: string, fontWeight?: string): CellValue => ({ value, color, fontWeight });

export const exampleViews: ExampleView[] = [
  {
    name: 'vw_Active_Awards',
    description: 'Summary of all active awards with financial tracking including expenses, encumbrances, available balance, and days until expiration.',
    color: '#4A90E2',
    columns: [
      { header: 'Award_Number' },
      { header: 'Award_Title' },
      { header: 'Sponsor_Name' },
      { header: 'Total_Funded', align: 'right' },
      { header: 'Expenses', align: 'right' },
      { header: 'Available', align: 'right' },
      { header: 'Days_Left', align: 'right' },
    ],
    rows: [
      [mono('R01-GM123456'), 'AI in Medical Diagnostics', { value: 'NIH', color: '#546e7a' }, '$500,000', '$287,500', colored('$212,500', '#27ae60', '600'), '245'],
      [mono('NSF-2145789'), 'Quantum Computing Research', { value: 'NSF', color: '#546e7a' }, '$350,000', '$298,000', colored('$52,000', '#e67e22', '600'), '89'],
      [mono('W911NF-23-001'), 'Cybersecurity Framework', { value: 'DoD', color: '#546e7a' }, '$750,000', '$125,000', colored('$625,000', '#27ae60', '600'), '412'],
    ],
  },
  {
    name: 'vw_Active_Personnel_Roles',
    description: 'All active personnel assignments to projects and awards, showing roles, FTE percentages, and key personnel designations.',
    color: '#F5A623',
    columns: [
      { header: 'Name' },
      { header: 'Email' },
      { header: 'Role' },
      { header: 'Project_Title' },
      { header: 'Key?', align: 'center' },
      { header: 'FTE%', align: 'right' },
      { header: 'Award' },
    ],
    rows: [
      ['Jane Smith', { value: 'jane.smith@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }, colored('PI', '#667eea', '600'), 'AI in Medical Diagnostics', colored('\u2713', '#27ae60', '600'), '25%', mono('R01-GM123456')],
      ['John Doe', { value: 'john.doe@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }, colored('Co-I', '#667eea', '600'), 'AI in Medical Diagnostics', colored('\u2713', '#27ae60', '600'), '15%', mono('R01-GM123456')],
      ['Maria Garcia', { value: 'maria.garcia@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }, colored('PI', '#667eea', '600'), 'Quantum Computing Research', colored('\u2713', '#27ae60', '600'), '30%', mono('NSF-2145789')],
      ['Michael Brown', { value: 'm.brown@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }, { value: 'Postdoc', color: '#546e7a' }, 'Quantum Computing Research', colored('\u2013', '#95a5a6'), '100%', mono('NSF-2145789')],
    ],
  },
  {
    name: 'vw_Expiring_Awards',
    description: 'Awards expiring within 90 days, with PI contact information for renewal planning and closeout coordination.',
    color: '#e74c3c',
    columns: [
      { header: 'Award_Number' },
      { header: 'Award_Title' },
      { header: 'End_Date' },
      { header: 'Days_Left', align: 'right' },
      { header: 'PI' },
      { header: 'Contact' },
    ],
    rows: [
      [mono('R21-CA987654'), 'Cancer Biomarker Study', '2025-02-28', colored('78', '#e74c3c', '600'), 'Linda Martinez', { value: 'l.martinez@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }],
      [mono('NSF-2145789'), 'Quantum Computing Research', '2025-03-10', colored('89', '#e67e22', '600'), 'Maria Garcia', { value: 'maria.garcia@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }],
    ],
  },
  {
    name: 'vw_Overdue_Deliverables',
    description: 'All pending or overdue deliverables with responsible personnel contact information for follow-up.',
    color: '#ffc107',
    columns: [
      { header: 'Type' },
      { header: 'Due_Date' },
      { header: 'Days_Late', align: 'right' },
      { header: 'Award' },
      { header: 'Responsible' },
      { header: 'Contact' },
    ],
    rows: [
      [colored('Progress Report', '#e74c3c', '600'), '2024-11-15', colored('28', '#e74c3c', '600'), mono('R01-GM123456'), 'Jane Smith', { value: 'jane.smith@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }],
      [colored('Financial Report', '#e74c3c', '600'), '2024-12-01', colored('12', '#e67e22', '600'), mono('W911NF-23-001'), 'Robert Wilson', { value: 'r.wilson@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }],
      [colored('Technical Milestone', '#e74c3c', '600'), '2024-12-07', colored('6', '#ffc107', '600'), mono('NSF-2145789'), 'Maria Garcia', { value: 'maria.garcia@uni.edu', mono: true, color: '#546e7a', fontSize: '0.8rem' }],
    ],
  },
  {
    name: 'vw_Award_Financial_Summary',
    description: 'Financial summary by award budget period, showing budget vs. actual expenses and encumbrances for each period.',
    color: '#7ED321',
    columns: [
      { header: 'Award' },
      { header: 'Period', align: 'center' },
      { header: 'Period_Start' },
      { header: 'Budget', align: 'right' },
      { header: 'Expenses', align: 'right' },
      { header: 'Available', align: 'right' },
    ],
    rows: [
      [mono('R01-GM123456'), '1', { value: '2023-07-01', color: '#546e7a' }, '$125,000', '$124,200', colored('$800', '#27ae60')],
      [mono('R01-GM123456'), colored('2', '#667eea', '600'), { value: '2024-07-01', color: '#546e7a' }, '$125,000', '$78,300', colored('$46,700', '#27ae60')],
      [mono('NSF-2145789'), colored('1', '#667eea', '600'), { value: '2024-04-01', color: '#546e7a' }, '$175,000', '$149,000', colored('$26,000', '#e67e22')],
    ],
  },
  {
    name: 'vw_Budget_Comparison',
    description: 'Compares proposed, approved, current, and actual spending by budget category and period. Includes percent change from proposal.',
    color: '#BD10E0',
    columns: [
      { header: 'Award' },
      { header: 'Category' },
      { header: 'Proposed', align: 'right' },
      { header: 'Approved', align: 'right' },
      { header: 'Actual', align: 'right' },
      { header: '% Change', align: 'right' },
    ],
    rows: [
      [mono('R01-GM123456'), 'Senior Personnel', { value: '$80,000', color: '#546e7a' }, '$75,000', '$72,100', colored('-6.3%', '#e74c3c')],
      [mono('R01-GM123456'), 'Equipment', { value: '$25,000', color: '#546e7a' }, '$30,000', '$28,500', colored('+20.0%', '#27ae60')],
      [mono('NSF-2145789'), 'Travel', { value: '$15,000', color: '#546e7a' }, '$15,000', '$12,300', { value: '0.0%', color: '#546e7a' }],
    ],
  },
  {
    name: 'vw_ComplianceRequirement_Status',
    description: 'All compliance requirements (IRB, IACUC, etc.) with expiration tracking and PI contact information.',
    color: '#9b59b6',
    columns: [
      { header: 'Number' },
      { header: 'Type' },
      { header: 'Status' },
      { header: 'Expiration' },
      { header: 'Days_Left', align: 'right' },
      { header: 'PI' },
    ],
    rows: [
      [mono('IRB-2023-145'), colored('IRB', '#9b59b6', '600'), colored('Approved', '#27ae60'), '2025-06-15', colored('185', '#27ae60'), 'Jane Smith'],
      [mono('IACUC-2024-089'), colored('IACUC', '#9b59b6', '600'), colored('Approved', '#27ae60'), '2025-03-30', colored('108', '#e67e22'), 'Linda Martinez'],
      [mono('IBC-2024-012'), colored('IBC', '#9b59b6', '600'), colored('Conditional', '#e67e22'), '2025-02-15', colored('65', '#e74c3c'), 'David Chen'],
    ],
  },
  {
    name: 'vw_All_ContactDetails',
    description: 'Unified view of contact details for both personnel and organizations, with entity type and name.',
    color: '#34495e',
    columns: [
      { header: 'Entity_Type' },
      { header: 'Entity_Name' },
      { header: 'Contact_Type' },
      { header: 'Contact_Value' },
    ],
    rows: [
      [colored('Personnel', '#667eea', '600'), 'Jane Smith', { value: 'Email', color: '#546e7a' }, mono('jane.smith@stateuniversity.edu')],
      [colored('Personnel', '#667eea', '600'), 'Jane Smith', { value: 'Office Phone', color: '#546e7a' }, mono('555-0101')],
      [colored('Organization', '#e67e22', '600'), 'National Institutes of Health', { value: 'Email', color: '#546e7a' }, mono('grants@nih.gov')],
      [colored('Organization', '#e67e22', '600'), 'National Institutes of Health', { value: 'Office Phone', color: '#546e7a' }, mono('301-496-4000')],
    ],
  },
];
