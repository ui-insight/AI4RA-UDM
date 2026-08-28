// Canonical core-module assignments for each UDM v2 table.
// Source of truth: core_module_membership in udm_schema_v2.json.

export interface CoreModuleGroup {
  name: string;
  color: string;
  tables: string[];
}

export const coreModuleGroups: CoreModuleGroup[] = [
  {
    name: 'Actors',
    color: '#0ea5e9',
    tables: [
      'Personnel',
      'PersonnelCredential',
      'Organization',
      'OrganizationCapability',
      'OrganizationIdentifier',
      'OrganizationRole',
      'ContactDetails',
    ],
  },
  {
    name: 'Funding Cycle',
    color: '#6366f1',
    tables: [
      'RFA',
      'RFARequirement',
      'Proposal',
      'ProposalApproval',
      'PreAwardAuthorization',
      'Award',
      'Modification',
      'Subaward',
      'Negotiation',
      'Terms',
      'Report',
      'Closeout',
    ],
  },
  {
    name: 'Effort',
    color: '#d97706',
    tables: ['AwardRole', 'Effort'],
  },
  {
    name: 'Finance',
    color: '#16a34a',
    tables: [
      'Budget',
      'Fund',
      'Account',
      'FinanceCode',
      'Transaction',
      'RateAgreement',
      'IndirectRate',
      'Payment',
      'CostShare',
      'Equipment',
    ],
  },
  {
    name: 'Compliance',
    color: '#dc2626',
    tables: [
      'ComplianceRequirement',
      'ComplianceCoverage',
      'ProtocolRole',
      'ConflictOfInterest',
      'OtherSupport',
      'OtherSupportDisclosure',
      'PolicyException',
    ],
  },
  {
    name: 'Records',
    color: '#7c3aed',
    tables: [
      'Document',
      'Communication',
      'Restriction',
      'Deadline',
      'Classification',
      'Action',
      'CommunicationResponse',
    ],
  },
];

const tableToCoreModule: Record<string, CoreModuleGroup> = {};
for (const group of coreModuleGroups) {
  for (const t of group.tables) tableToCoreModule[t] = group;
}

export function getCoreModule(tableName: string): CoreModuleGroup | undefined {
  return tableToCoreModule[tableName];
}
