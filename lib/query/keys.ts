/**
 * Centralized query key factory for consistent cache management
 * Follow the pattern: [entity, ...identifiers, ...filters]
 */
export const queryKeys = {
  // Tasks queries
  tasks: {
    all: ['tasks'] as const,
    byOrg: (orgId: string) => [...queryKeys.tasks.all, 'org', orgId] as const,
    byUser: (orgId: string, userId: string) =>
      [...queryKeys.tasks.byOrg(orgId), 'user', userId] as const,
  },

  // Calendar blocks queries
  calendarBlocks: {
    all: ['calendar-blocks'] as const,
    byOrg: (orgId: string) => [...queryKeys.calendarBlocks.all, 'org', orgId] as const,
    byOwner: (orgId: string, ownerId: string) =>
      [...queryKeys.calendarBlocks.byOrg(orgId), 'owner', ownerId] as const,
    byDateRange: (orgId: string, ownerId: string, start: string, end: string) =>
      [...queryKeys.calendarBlocks.byOwner(orgId, ownerId), 'range', start, end] as const,
  },

  // Multi-member blocks queries
  multiMemberBlocks: {
    all: ['multi-member-blocks'] as const,
    byMembers: (orgId: string, memberIds: string[], start: string, end: string) =>
      [...queryKeys.multiMemberBlocks.all, 'org', orgId, 'members', memberIds.sort().join(','), 'range', start, end] as const,
  },

  // Team tasks queries
  teamTasks: {
    all: ['team-tasks'] as const,
    byOrg: (orgId: string) => [...queryKeys.teamTasks.all, 'org', orgId] as const,
    byDate: (orgId: string, date: string) =>
      [...queryKeys.teamTasks.byOrg(orgId), 'date', date] as const,
  },

  // User role queries
  userRole: {
    all: ['user-role'] as const,
    byUser: (orgId: string, userId: string) =>
      [...queryKeys.userRole.all, 'org', orgId, 'user', userId] as const,
  },

  // Organization queries
  organization: {
    all: ['organization'] as const,
    byId: (orgId: string) => [...queryKeys.organization.all, orgId] as const,
    members: (orgId: string) => [...queryKeys.organization.byId(orgId), 'members'] as const,
  },

  // User preferences queries
  userPreferences: {
    all: ['user-preferences'] as const,
    byUser: (userId: string) => [...queryKeys.userPreferences.all, 'user', userId] as const,
  },
};
