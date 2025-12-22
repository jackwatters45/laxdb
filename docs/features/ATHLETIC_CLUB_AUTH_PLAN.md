# Athletic Club Auth System Implementation Plan

## Architecture Overview

Based on Better Auth's organization plugin, here's how to structure your athletic club system:

```
Athletic Club (Organization)
├── Coaches (role: "coach" - admin permissions)
├── Players (role: "player" - member permissions)
└── Teams (enabled teams feature)
    ├── U18s
    ├── Senior Men's A
    ├── Senior Men's B
    └── etc.
```

## 1. Database Structure (Already Handled by Better Auth)

The existing tables work perfectly:

- `organization` → Athletic Club
- `member` → Coaches and Players with roles
- `team` → Individual teams (U18s, Senior A, etc.)
- `teamMember` → Players assigned to teams
- `invitation` → Inviting new players/coaches

## 2. Role-Based Access Control

Create custom permissions for your athletic club:

```typescript
// packages/core/src/auth/permissions.ts
import {
  createAccessControl,
  defaultStatements,
} from "better-auth/plugins/organization";

const athleticStatements = {
  ...defaultStatements,
  roster: ["view", "edit", "create", "delete"],
  player: ["view", "move", "remove", "invite"],
  schedule: ["view", "edit", "create", "delete"],
  stats: ["view", "edit", "create"],
} as const;

export const ac = createAccessControl(athleticStatements);

// Coach role (admin-like)
export const coach = ac.newRole({
  ...defaultStatements.admin,
  roster: ["view", "edit", "create", "delete"],
  player: ["view", "move", "remove", "invite"],
  schedule: ["view", "edit", "create", "delete"],
  stats: ["view", "edit", "create"],
  member: ["create", "update", "delete"],
  team: ["create", "update", "delete"],
});

// Player role (member-like)
export const player = ac.newRole({
  roster: ["view"],
  schedule: ["view"],
  stats: ["view"],
  team: ["view"],
});

// Head Coach role (owner-like)
export const headCoach = ac.newRole({
  ...coach.statements,
  organization: ["update", "delete"],
});
```

## 3. Configuration Updates

Update your auth configuration:

```typescript
// packages/core/src/auth.ts
import { coach, player, headCoach, ac } from "./auth/permissions";

export const auth = betterAuth({
  plugins: [
    organization({
      ac,
      roles: {
        coach,
        player,
        headCoach,
      },
      teams: {
        enabled: true,
      },
      creatorRole: "headCoach", // Club creator becomes head coach
      allowUserToCreateOrganization: true, // Allow creating new clubs
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.APP_URL}/accept-invitation/${data.id}`;
        // Send email with your email service
        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name} on LaxDB`,
          template: "player-invitation",
          data: {
            inviteLink,
            clubName: data.organization.name,
            role: data.role,
            teamName: data.teamId ? await getTeamName(data.teamId) : null,
          },
        });
      },
    }),
  ],
});
```

## 4. Key Implementation Features

### A. Player Management Flow

1. **Adding Players to Club**:

   - Coach invites via email
   - Player accepts invitation → becomes club member
   - Coach assigns player to one or more teams

2. **Moving Players Between Teams**:

   ```typescript
   // Add player to new team
   await authClient.organization.addTeamMember({
     teamId: "senior-a-team-id",
     userId: "player-user-id",
   });

   // Remove from old team (if exclusive)
   await authClient.organization.removeTeamMember({
     teamId: "u18s-team-id",
     userId: "player-user-id",
   });
   ```

3. **Multi-Team Support**:
   - Players can be in multiple teams simultaneously
   - Use `teamMember` table to track all team assignments

### B. Coach Capabilities

- Create/edit/delete teams
- Invite new players and coaches
- Move players between teams
- Remove players from club
- Update player roles
- View all roster information

### C. Player Capabilities

- View their team rosters
- View schedules
- View their stats
- Cannot modify organizational data

## 5. UI/UX Components to Build

1. **Dashboard Views**:

   - Coach dashboard with team management
   - Player dashboard with team memberships

2. **Team Management**:

   - Create/edit team forms
   - Team roster tables with player management
   - Drag-and-drop player assignment

3. **Invitation System**:

   - Invite player form with team selection
   - Pending invitations list
   - Accept invitation page

4. **Permission-Based UI**:
   ```tsx
   // Show edit buttons only for coaches
   const { data: member } = await authClient.organization.getActiveMember();
   const canEdit = member?.role === "coach" || member?.role === "headCoach";
   ```

## 6. API Endpoints You'll Use

```typescript
// Organization (Club) Management
authClient.organization.create(); // Create new club
authClient.organization.update(); // Update club details
authClient.organization.setActive(); // Switch active club

// Team Management
authClient.organization.createTeam(); // Create new team
authClient.organization.listTeams(); // List all club teams
authClient.organization.updateTeam(); // Edit team details
authClient.organization.removeTeam(); // Delete team

// Player Management
authClient.organization.inviteMember(); // Invite player with role & team
authClient.organization.listMembers(); // List all club members
authClient.organization.updateMemberRole(); // Change player to coach
authClient.organization.removeMember(); // Remove from club
authClient.organization.addTeamMember(); // Add to team
authClient.organization.removeTeamMember(); // Remove from team
authClient.organization.listTeamMembers(); // Get team roster

// Permissions
authClient.organization.hasPermission(); // Check if can perform action
```

## 7. Implementation Steps

### High Priority

1. ✅ Plan database schema for teams and player memberships
2. ✅ Design role-based access control (RBAC) system
3. ⏳ Configure Better Auth with teams and custom roles
4. ⏳ Create permissions file with coach/player roles

### Medium Priority

5. ⏳ Build coach dashboard with team management
6. ⏳ Create team roster component with player management
7. ⏳ Implement invitation system for players

### Low Priority

8. ⏳ Add multi-team assignment functionality
9. ⏳ Create player dashboard with team views

## 8. Example User Flows

### Coach Workflow

1. Coach logs in → sees all teams they manage
2. Creates new team "U16s"
3. Invites players via email with team assignment
4. Moves existing player from U16s to U18s
5. Updates player role from "player" to "coach"

### Player Workflow

1. Player receives invitation email
2. Accepts invitation → joins club
3. Views dashboard showing teams they're on
4. Sees schedule and roster for each team
5. Cannot edit any organizational data

## 9. Permission Matrix

| Action         | Head Coach | Coach | Player |
| -------------- | ---------- | ----- | ------ |
| Create club    | ✅         | ❌    | ❌     |
| Create teams   | ✅         | ✅    | ❌     |
| Invite players | ✅         | ✅    | ❌     |
| Move players   | ✅         | ✅    | ❌     |
| Remove players | ✅         | ✅    | ❌     |
| View rosters   | ✅         | ✅    | ✅     |
| Edit schedules | ✅         | ✅    | ❌     |
| View schedules | ✅         | ✅    | ✅     |
| Edit stats     | ✅         | ✅    | ❌     |
| View stats     | ✅         | ✅    | ✅     |

This plan leverages Better Auth's organization plugin perfectly for athletic club management, requiring no database changes while providing comprehensive role-based access control and team management capabilities.
