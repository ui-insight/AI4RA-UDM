// Canonical domain assignments for each UDM table.
// Kept in sync with the Domain Organization table in README.md.

export interface DomainGroup {
  name: string;
  color: string;
  tables: string[];
}

export const domainGroups: DomainGroup[] = [
  {
    name: 'Reference',
    color: '#64748b',
    tables: ['Organization', 'AllowedValues', 'BudgetCategory'],
  },
  {
    name: 'Core',
    color: '#0ea5e9',
    tables: ['Personnel', 'ContactDetails', 'Project'],
  },
  {
    name: 'Pre-Award',
    color: '#6366f1',
    tables: ['RFA', 'RFARequirement', 'Proposal', 'ProposalBudget', 'ProposalChecklistItem'],
  },
  {
    name: 'Submission',
    color: '#7c3aed',
    tables: [
      'SubmissionProfile',
      'SubmissionPackage',
      'SubmissionAttachment',
      'SubmissionAttempt',
      'SubmissionEvent',
    ],
  },
  {
    name: 'Post-Award',
    color: '#16a34a',
    tables: [
      'Award',
      'Modification',
      'Terms',
      'AwardBudgetPeriod',
      'AwardBudget',
      'Subaward',
      'CostShare',
      'AwardDeliverable',
    ],
  },
  {
    name: 'Financial',
    color: '#ca8a04',
    tables: ['Fund', 'Account', 'FinanceCode', 'Transaction', 'IndirectRate', 'Invoice'],
  },
  {
    name: 'Personnel & Effort',
    color: '#d97706',
    tables: ['ProjectRole', 'Effort'],
  },
  {
    name: 'Faculty Development',
    color: '#db2777',
    tables: ['ProjectCohort', 'CohortParticipation'],
  },
  {
    name: 'Operations',
    color: '#0891b2',
    tables: ['ApplicationSystem', 'ServiceRequest'],
  },
  {
    name: 'Compliance',
    color: '#dc2626',
    tables: ['ComplianceRequirement', 'ConflictOfInterest'],
  },
  {
    name: 'System',
    color: '#475569',
    tables: ['Document', 'ActivityLog'],
  },
];

const tableToDomain: Record<string, DomainGroup> = {};
for (const group of domainGroups) {
  for (const t of group.tables) tableToDomain[t] = group;
}

export function getDomain(tableName: string): DomainGroup | undefined {
  return tableToDomain[tableName];
}
