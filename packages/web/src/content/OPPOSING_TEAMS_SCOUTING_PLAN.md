# Opposing Teams & Scouting System - Comprehensive Plan

## Overview

A comprehensive system for coaches to manage opposing teams within their league, create detailed scouting reports, track player information, and analyze team patterns. This system will integrate with the existing game management to provide strategic insights.

## Database Schema Design

### Core Tables

#### 1. Opposing Teams Table

```sql
CREATE TABLE opposing_teams (
  id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  league_name TEXT,
  division TEXT,
  coach_name TEXT,
  assistant_coaches TEXT[], -- Array of coach names
  home_field TEXT,
  team_colors TEXT,
  mascot TEXT,

  -- Contact Information
  coach_email TEXT,
  coach_phone TEXT,
  team_website TEXT,

  -- Team Stats & Characteristics
  typical_style TEXT, -- 'aggressive', 'defensive', 'fast_break', 'possession'
  strengths TEXT[], -- Array of strengths
  weaknesses TEXT[], -- Array of weaknesses
  key_players TEXT[], -- Array of key player names/notes

  -- Season Performance
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,

  -- Additional Metadata
  notes TEXT,
  is_archived BOOLEAN DEFAULT false,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

#### 2. Scouting Reports Table

```sql
CREATE TABLE scouting_reports (
  id UUID PRIMARY KEY,
  opposing_team_id UUID NOT NULL REFERENCES opposing_teams(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL, -- Optional link to specific game
  scout_user_id TEXT NOT NULL REFERENCES user(id),

  -- Report Details
  title TEXT NOT NULL,
  report_date DATE NOT NULL,
  game_watched_date DATE, -- Date of game that was scouted
  venue_scouted TEXT, -- Where the scouting took place

  -- Team Analysis
  formation TEXT, -- Primary formation used
  style_of_play TEXT,
  tempo TEXT, -- 'fast', 'medium', 'slow'

  -- Offensive Analysis
  offensive_strengths TEXT,
  offensive_weaknesses TEXT,
  key_plays TEXT,
  set_plays TEXT,
  transition_offense TEXT,

  -- Defensive Analysis
  defensive_strengths TEXT,
  defensive_weaknesses TEXT,
  defensive_formation TEXT,
  pressure_style TEXT, -- 'high', 'medium', 'low'

  -- Special Situations
  power_play_analysis TEXT,
  penalty_kill_analysis TEXT,
  face_off_analysis TEXT,

  -- Key Players Analysis
  star_players TEXT,
  players_to_watch TEXT,
  injury_concerns TEXT,

  -- Recommendations
  game_plan_suggestions TEXT,
  matchup_advantages TEXT,
  areas_to_exploit TEXT,

  -- Confidence & Priority
  confidence_level INTEGER DEFAULT 5, -- 1-10 scale
  priority_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Media Attachments
  video_links TEXT[], -- URLs to video analysis
  photo_links TEXT[], -- URLs to photos

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

#### 3. Player Scouting Table

```sql
CREATE TABLE opposing_players (
  id UUID PRIMARY KEY,
  opposing_team_id UUID NOT NULL REFERENCES opposing_teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT, -- 'attack', 'midfield', 'defense', 'goalie', 'lsm', 'fogo'

  -- Player Characteristics
  height TEXT,
  weight TEXT,
  year TEXT, -- 'freshman', 'sophomore', 'junior', 'senior'
  hometown TEXT,

  -- Performance Metrics
  goals_season INTEGER DEFAULT 0,
  assists_season INTEGER DEFAULT 0,
  shots_season INTEGER DEFAULT 0,
  save_percentage DECIMAL(5,3), -- For goalies

  -- Scouting Notes
  strengths TEXT,
  weaknesses TEXT,
  playing_style TEXT,
  injury_status TEXT,
  tendencies TEXT,

  -- Ratings (1-10 scale)
  speed_rating INTEGER,
  skill_rating INTEGER,
  strength_rating INTEGER,
  iq_rating INTEGER,
  leadership_rating INTEGER,

  -- Strategic Notes
  how_to_defend TEXT,
  matchup_notes TEXT,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

#### 4. Team Patterns Table

```sql
CREATE TABLE team_patterns (
  id UUID PRIMARY KEY,
  opposing_team_id UUID NOT NULL REFERENCES opposing_teams(id) ON DELETE CASCADE,
  scouting_report_id UUID REFERENCES scouting_reports(id) ON DELETE CASCADE,

  pattern_type TEXT NOT NULL, -- 'offensive_play', 'defensive_set', 'special_situation'
  pattern_name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Pattern Details
  trigger_situation TEXT, -- When this pattern is typically used
  personnel_involved TEXT, -- Which players are typically involved
  success_rate TEXT, -- How often it works
  counter_strategy TEXT, -- How to defend against it

  -- Visual Aids
  diagram_url TEXT, -- Link to play diagram
  video_timestamp TEXT, -- Timestamp in scouting video

  priority_level TEXT DEFAULT 'medium',

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 5. Head-to-Head History Table

```sql
CREATE TABLE head_to_head_history (
  id UUID PRIMARY KEY,
  our_team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  opposing_team_id UUID NOT NULL REFERENCES opposing_teams(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,

  game_date DATE NOT NULL,
  our_score INTEGER NOT NULL,
  their_score INTEGER NOT NULL,
  venue TEXT,

  -- Game Summary
  game_summary TEXT,
  what_worked TEXT,
  what_didnt_work TEXT,
  key_moments TEXT,

  -- Post-game Analysis
  lessons_learned TEXT,
  adjustments_for_next_time TEXT,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 6. League Management Table

```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season TEXT NOT NULL, -- 'Spring 2024', 'Fall 2023'
  division TEXT,

  -- League Details
  start_date DATE,
  end_date DATE,
  league_website TEXT,
  commissioner_name TEXT,
  commissioner_email TEXT,

  -- Rules & Format
  game_format TEXT, -- '4x15min', '3x20min', etc.
  playoff_format TEXT,
  regular_season_games INTEGER,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

## Effect Service Architecture

### 1. Opposing Teams Service (`packages/core/src/opposing-team/index.ts`)

#### Input Schemas

```typescript
export const CreateOpposingTeamInput = Schema.Struct({
  name: Schema.String,
  leagueName: Schema.String.pipe(Schema.optional),
  division: Schema.String.pipe(Schema.optional),
  coachName: Schema.String.pipe(Schema.optional),
  homeField: Schema.String.pipe(Schema.optional),
  teamColors: Schema.String.pipe(Schema.optional),
  mascot: Schema.String.pipe(Schema.optional),
  coachEmail: Schema.String.pipe(Schema.optional),
  coachPhone: Schema.String.pipe(Schema.optional),
  teamWebsite: Schema.String.pipe(Schema.optional),
});

export const CreateScoutingReportInput = Schema.Struct({
  opposingTeamId: Schema.String,
  gameId: Schema.String.pipe(Schema.optional),
  title: Schema.String,
  reportDate: Schema.Date,
  gameWatchedDate: Schema.Date.pipe(Schema.optional),
  venueScouted: Schema.String.pipe(Schema.optional),
  formation: Schema.String.pipe(Schema.optional),
  styleOfPlay: Schema.String.pipe(Schema.optional),
  tempo: Schema.Literal("fast", "medium", "slow").pipe(Schema.optional),
  offensiveStrengths: Schema.String.pipe(Schema.optional),
  offensiveWeaknesses: Schema.String.pipe(Schema.optional),
  defensiveStrengths: Schema.String.pipe(Schema.optional),
  defensiveWeaknesses: Schema.String.pipe(Schema.optional),
  gamePlanSuggestions: Schema.String.pipe(Schema.optional),
  confidenceLevel: Schema.Number.pipe(Schema.optional),
  priorityLevel: Schema.Literal("low", "medium", "high").pipe(Schema.optional),
});

export const CreateOpposingPlayerInput = Schema.Struct({
  opposingTeamId: Schema.String,
  name: Schema.String,
  jerseyNumber: Schema.Number.pipe(Schema.optional),
  position: Schema.String.pipe(Schema.optional),
  strengths: Schema.String.pipe(Schema.optional),
  weaknesses: Schema.String.pipe(Schema.optional),
  playingStyle: Schema.String.pipe(Schema.optional),
  speedRating: Schema.Number.pipe(Schema.optional),
  skillRating: Schema.Number.pipe(Schema.optional),
  strengthRating: Schema.Number.pipe(Schema.optional),
  iqRating: Schema.Number.pipe(Schema.optional),
});

export const CreateTeamPatternInput = Schema.Struct({
  opposingTeamId: Schema.String,
  scoutingReportId: Schema.String.pipe(Schema.optional),
  patternType: Schema.Literal(
    "offensive_play",
    "defensive_set",
    "special_situation"
  ),
  patternName: Schema.String,
  description: Schema.String,
  triggerSituation: Schema.String.pipe(Schema.optional),
  counterStrategy: Schema.String.pipe(Schema.optional),
  priorityLevel: Schema.Literal("low", "medium", "high").pipe(Schema.optional),
});
```

#### Service Methods

```typescript
export class OpposingTeamsService extends Context.Tag("OpposingTeamsService")<
  OpposingTeamsService,
  {
    // Opposing Teams CRUD
    readonly createOpposingTeam: (
      input: CreateOpposingTeamInput,
      headers: Headers
    ) => Effect.Effect<OpposingTeam, ParseError | OpposingTeamsError>;
    readonly updateOpposingTeam: (
      teamId: string,
      input: Partial<CreateOpposingTeamInput>,
      headers: Headers
    ) => Effect.Effect<OpposingTeam, ParseError | OpposingTeamsError>;
    readonly deleteOpposingTeam: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | OpposingTeamsError>;
    readonly getOpposingTeam: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<OpposingTeam, ParseError | OpposingTeamsError>;
    readonly getOpposingTeams: (
      headers: Headers
    ) => Effect.Effect<OpposingTeam[], ParseError | OpposingTeamsError>;

    // Scouting Reports CRUD
    readonly createScoutingReport: (
      input: CreateScoutingReportInput,
      headers: Headers
    ) => Effect.Effect<ScoutingReport, ParseError | OpposingTeamsError>;
    readonly updateScoutingReport: (
      reportId: string,
      input: Partial<CreateScoutingReportInput>,
      headers: Headers
    ) => Effect.Effect<ScoutingReport, ParseError | OpposingTeamsError>;
    readonly deleteScoutingReport: (
      reportId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | OpposingTeamsError>;
    readonly getScoutingReport: (
      reportId: string,
      headers: Headers
    ) => Effect.Effect<ScoutingReport, ParseError | OpposingTeamsError>;
    readonly getTeamScoutingReports: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<ScoutingReport[], ParseError | OpposingTeamsError>;

    // Players Management
    readonly createOpposingPlayer: (
      input: CreateOpposingPlayerInput,
      headers: Headers
    ) => Effect.Effect<OpposingPlayer, ParseError | OpposingTeamsError>;
    readonly updateOpposingPlayer: (
      playerId: string,
      input: Partial<CreateOpposingPlayerInput>,
      headers: Headers
    ) => Effect.Effect<OpposingPlayer, ParseError | OpposingTeamsError>;
    readonly deleteOpposingPlayer: (
      playerId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | OpposingTeamsError>;
    readonly getTeamPlayers: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<OpposingPlayer[], ParseError | OpposingTeamsError>;

    // Team Patterns
    readonly createTeamPattern: (
      input: CreateTeamPatternInput,
      headers: Headers
    ) => Effect.Effect<TeamPattern, ParseError | OpposingTeamsError>;
    readonly getTeamPatterns: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<TeamPattern[], ParseError | OpposingTeamsError>;
    readonly deleteTeamPattern: (
      patternId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | OpposingTeamsError>;

    // Head-to-Head Analysis
    readonly getHeadToHeadHistory: (
      opposingTeamId: string,
      headers: Headers
    ) => Effect.Effect<HeadToHeadRecord[], ParseError | OpposingTeamsError>;
    readonly createHeadToHeadRecord: (
      input: CreateHeadToHeadInput,
      headers: Headers
    ) => Effect.Effect<HeadToHeadRecord, ParseError | OpposingTeamsError>;
  }
>() {}
```

## UI Architecture

### 1. Route Structure

```
/scouting                           - Scouting dashboard
/scouting/teams                     - Opposing teams list
/scouting/teams/create              - Create new opposing team
/scouting/teams/:teamId             - Opposing team details
/scouting/teams/:teamId/edit        - Edit opposing team
/scouting/teams/:teamId/players     - Manage opposing team players
/scouting/teams/:teamId/reports     - Team scouting reports
/scouting/teams/:teamId/patterns    - Team patterns & plays
/scouting/teams/:teamId/history     - Head-to-head history
/scouting/reports                   - All scouting reports
/scouting/reports/create            - Create new scouting report
/scouting/reports/:reportId         - Scouting report details
/scouting/reports/:reportId/edit    - Edit scouting report
```

### 2. Component Structure

#### Scouting Dashboard (`/src/routes/$organizationSlug/scouting/index.tsx`)

- Overview of recent scouting activity
- Quick stats (teams tracked, reports created, upcoming games)
- Recent scouting reports
- Priority alerts (high-priority teams, missing reports)
- Quick action buttons

#### Opposing Teams List (`/src/routes/$organizationSlug/scouting/team/index.tsx`)

- Grid/table view of all opposing teams
- Filter by league, division, priority
- Search functionality
- Quick actions: create report, view details
- Team summary cards with key info

#### Team Profile (`/src/routes/$organizationSlug/scouting/teams/$teamId.tsx`)

- Team overview and basic information
- Key statistics and performance metrics
- Recent scouting reports
- Player roster with ratings
- Head-to-head history
- Quick links to create reports, add players

#### Scouting Report Creation (`/src/routes/$organizationSlug/scouting/reports/create.tsx`)

- Comprehensive form with multiple sections
- Team selection with search/autocomplete
- Structured analysis sections (offense, defense, special situations)
- Player-specific notes
- Pattern documentation
- Media upload capabilities
- Save as draft functionality

#### Player Management (`/src/routes/$organizationSlug/scouting/teams/$teamId/players.tsx`)

- Player roster management
- Individual player profiles with ratings
- Bulk player import
- Player comparison tools
- Scouting notes per player

### 3. Component Library

#### Core Components

```typescript
// Team card component
export function OpposingTeamCard({
  team,
  showActions,
}: {
  team: OpposingTeam;
  showActions: boolean;
});

// Scouting report card
export function ScoutingReportCard({ report }: { report: ScoutingReport });

// Player rating component
export function PlayerRatingDisplay({ player }: { player: OpposingPlayer });

// Team pattern diagram
export function TeamPatternDiagram({ pattern }: { pattern: TeamPattern });

// Head-to-head stats
export function HeadToHeadStats({ history }: { history: HeadToHeadRecord[] });

// Scouting form sections
export function OffensiveAnalysisForm({ data, onChange }: FormSectionProps);
export function DefensiveAnalysisForm({ data, onChange }: FormSectionProps);
export function SpecialSituationsForm({ data, onChange }: FormSectionProps);
```

## Permission System

### Role-Based Access Control

```typescript
const checkScoutingPermission = (
  userRole: string,
  action: "read" | "write" | "manage"
) => {
  switch (action) {
    case "read":
      return [
        "player",
        "parent",
        "assistantCoach",
        "coach",
        "headCoach",
      ].includes(userRole);
    case "write":
      return ["assistantCoach", "coach", "headCoach"].includes(userRole);
    case "manage":
      return ["coach", "headCoach"].includes(userRole);
    default:
      return false;
  }
};
```

### Data Access Levels

- **Players/Parents**: View team names and basic info only
- **Assistant Coaches**: View all scouting reports, create basic reports
- **Coaches**: Full access to create, edit, and manage all scouting data
- **Head Coaches**: Full access plus ability to archive/delete teams and reports

## Features & Functionality

### Phase 1 - Core Features

1. **Team Management**

   - Create and manage opposing teams
   - Basic team information and contact details
   - Team archiving and organization

2. **Basic Scouting Reports**

   - Structured report creation
   - Offensive and defensive analysis
   - Key player identification
   - Game plan suggestions

3. **Player Database**
   - Individual player profiles
   - Basic ratings and characteristics
   - Position-specific notes

### Phase 2 - Advanced Features

4. **Pattern Recognition**

   - Document common plays and formations
   - Visual play diagrams
   - Counter-strategy development

5. **Head-to-Head Analysis**

   - Historical performance tracking
   - Trend analysis
   - Success/failure patterns

6. **Report Templates**
   - Standardized report formats
   - Quick-start templates
   - Custom organization templates

### Phase 3 - Intelligence Features

7. **Video Integration**

   - Link video clips to reports
   - Timestamp specific plays
   - Video annotation tools

8. **Statistical Analysis**

   - Trend identification
   - Performance predictions
   - Comparative analysis

9. **League Integration**
   - Import team data from league websites
   - Automatic schedule updates
   - League-wide statistics

## Integration Points

### With Game Management System

- Link scouting reports to specific games
- Pre-game report access
- Post-game analysis updates
- Roster comparisons

### With Team Management

- Access to own team's strengths/weaknesses
- Matchup analysis
- Strategic planning coordination

### Future Integrations

- Calendar system for scouting schedule
- Notification system for report updates
- Mobile app for sideline scouting
- Statistical analysis tools

## Data Import/Export

### Import Capabilities

- CSV import for team rosters
- League website data scraping
- Bulk player information import
- Historical game data import

### Export Features

- PDF scouting reports
- Team comparison charts
- Statistical summaries
- Presentation-ready formats

## Implementation Priority

### High Priority (Phase 1)

1. ✅ Database schema design
2. 🔄 Opposing teams CRUD operations
3. 🔄 Basic scouting report creation
4. 🔄 Team list and detail views
5. 🔄 Player management basics

### Medium Priority (Phase 2)

6. Advanced report templates
7. Pattern documentation system
8. Head-to-head analysis
9. Search and filtering
10. Report sharing and collaboration

### Lower Priority (Phase 3)

11. Video integration
12. Advanced analytics
13. Mobile scouting app
14. League data integration
15. AI-powered insights

## Technical Considerations

### Performance

- Efficient search across teams and players
- Pagination for large datasets
- Image/video optimization
- Caching for frequently accessed reports

### Data Security

- Sensitive scouting information protection
- Role-based access controls
- Audit trails for data changes
- Secure file storage for media

### User Experience

- Intuitive report creation workflow
- Quick access to critical information
- Mobile-responsive design
- Offline capability for field use

### Scalability

- Support for multiple leagues
- Historical data retention
- Archive management
- Cross-season comparisons

This comprehensive scouting system will give coaches a significant strategic advantage by organizing and analyzing opponent intelligence in a systematic way, ultimately improving game preparation and team performance.
