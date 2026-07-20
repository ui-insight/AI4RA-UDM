// Canonical domain assignments for each UDM v2 table.
// Source of truth: domain_membership in udm_schema_v2.json.

export interface DomainGroup {
  name: string;
  color: string;
  tables: string[];
}

export const domainGroups: DomainGroup[] = [
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
      'SubmissionProfile',
      'SubmissionPackage',
      'SubmissionAttempt',
    ],
  },
  {
    name: 'Effort',
    color: '#d97706',
    tables: ['AwardRole', 'Effort'],
  },
  {
    name: 'Money',
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
    ],
  },
  {
    name: 'Attachments',
    color: '#7c3aed',
    tables: [
      'Document',
      'Communication',
      'Restriction',
      'Deadline',
      'Classification',
      'Action',
      'ActivityLog',
    ],
  },
];

const tableToDomain: Record<string, DomainGroup> = {};
for (const group of domainGroups) {
  for (const t of group.tables) tableToDomain[t] = group;
}

export function getDomain(tableName: string): DomainGroup | undefined {
  return tableToDomain[tableName];
}
