import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  ownerAc,
} from 'better-auth/plugins/organization/access';

// Define athletic club specific permissions
const athleticStatements = {
  ...defaultStatements,
  roster: ['read', 'create', 'update', 'delete'],
  player: ['read', 'move', 'remove', 'invite'],
  schedule: ['read', 'create', 'update', 'delete'],
  stats: ['read', 'create', 'update', 'delete'],
  practice: ['read', 'create', 'update', 'delete'],
  game: ['read', 'create', 'update', 'delete'],
} as const;

export const ac = createAccessControl(athleticStatements);

// Head Coach role (owner-like) - full control of the athletic club
export const headCoach = ac.newRole({
  ...ownerAc.statements,
  roster: ['read', 'create', 'update', 'delete'],
  player: ['read', 'move', 'remove', 'invite'],
  schedule: ['read', 'create', 'update', 'delete'],
  stats: ['read', 'create', 'update', 'delete'],
  practice: ['read', 'create', 'update', 'delete'],
  game: ['read', 'create', 'update', 'delete'],
});

// Coach role (admin-like) - can manage teams and players but not delete club
export const coach = ac.newRole({
  ...adminAc.statements,
  roster: ['read', 'create', 'update', 'delete'],
  player: ['read', 'move', 'remove', 'invite'],
  schedule: ['read', 'create', 'update', 'delete'],
  stats: ['read', 'create', 'update', 'delete'],
  practice: ['read', 'create', 'update', 'delete'],
  game: ['read', 'create', 'update', 'delete'],
});

// Assistant Coach role - can manage specific teams but limited permissions
export const assistantCoach = ac.newRole({
  roster: ['read', 'update'],
  player: ['read', 'move'],
  schedule: ['read', 'update'],
  stats: ['read', 'update'],
  practice: ['read', 'update'],
  game: ['read', 'update'],
  // team and member only have create/update/delete in default statements
});

// Player role (member-like) - view only access
export const player = ac.newRole({
  roster: ['read'],
  schedule: ['read'],
  stats: ['read'],
  practice: ['read'],
  game: ['read'],
  // team and member only have create/update/delete in default statements
});

// Parent role - can view their child's team information
export const parent = ac.newRole({
  roster: ['read'],
  schedule: ['read'],
  stats: ['read'],
  practice: ['read'],
  game: ['read'],
});
