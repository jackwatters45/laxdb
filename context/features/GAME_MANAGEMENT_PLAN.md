# Game Management System - Comprehensive Plan

## Overview

A complete game management system for lacrosse teams that tracks games, player participation, statistics, rosters, and lineups. This system will integrate with the existing team and organization structure.

## Database Schema Design

### Core Tables

#### 1. Games Table

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  game_date TIMESTAMP(3) NOT NULL,
  venue TEXT,
  is_home_game BOOLEAN DEFAULT false,
  game_type TEXT NOT NULL, -- 'regular', 'playoff', 'tournament', 'friendly', 'practice'
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'

  -- Score tracking
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,

  -- Game periods/quarters
  periods_played INTEGER DEFAULT 0,
  period_length INTEGER DEFAULT 15, -- minutes per period

  -- Additional metadata
  weather_conditions TEXT,
  field_conditions TEXT,
  referee_notes TEXT,
  coach_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

#### 2. Game Rosters Table

```sql
CREATE TABLE game_rosters (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  position TEXT, -- 'goalie', 'defense', 'midfield', 'attack', 'lsm', 'fogo'
  jersey_number INTEGER,
  is_starter BOOLEAN DEFAULT false,
  is_captain BOOLEAN DEFAULT false,
  attendance_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'absent', 'late', 'injured'

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 3. Player Game Stats Table

```sql
CREATE TABLE player_game_stats (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,

  -- Offensive stats
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  shots INTEGER DEFAULT 0,
  shots_on_goal INTEGER DEFAULT 0,

  -- Defensive stats (for all players)
  ground_balls INTEGER DEFAULT 0,
  turnovers INTEGER DEFAULT 0,
  caused_turnovers INTEGER DEFAULT 0,

  -- Goalie-specific stats
  saves INTEGER DEFAULT 0,
  goals_allowed INTEGER DEFAULT 0,
  save_percentage DECIMAL(5,3),

  -- Face-off stats
  face_offs_won INTEGER DEFAULT 0,
  face_offs_taken INTEGER DEFAULT 0,
  face_off_percentage DECIMAL(5,3),

  -- Penalties
  penalties INTEGER DEFAULT 0,
  penalty_minutes INTEGER DEFAULT 0,

  -- Playing time
  minutes_played INTEGER DEFAULT 0,
  periods_played INTEGER DEFAULT 0,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 4. Game Events Table (for detailed tracking)

```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'goal', 'assist', 'penalty', 'substitution', 'timeout', 'period_end'
  period INTEGER NOT NULL,
  time_in_period INTEGER NOT NULL, -- seconds

  -- Player involved
  primary_player_id TEXT REFERENCES user(id),
  secondary_player_id TEXT REFERENCES user(id), -- for assists, etc.

  -- Event details
  description TEXT,
  location_x DECIMAL(5,2), -- field position if relevant
  location_y DECIMAL(5,2),

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
```

#### 5. Game Lineups Table (for tracking who plays when)

```sql
CREATE TABLE game_lineups (
  id UUID PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period INTEGER NOT NULL,
  lineup_name TEXT, -- 'First Line', 'Second Line', 'Power Play', 'Penalty Kill'

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 6. Lineup Players Table

```sql
CREATE TABLE lineup_players (
  id UUID PRIMARY KEY,
  lineup_id UUID NOT NULL REFERENCES game_lineups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  jersey_number INTEGER,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
```

## Effect Service Architecture

### 1. Games Service (`packages/core/src/games/index.ts`)

#### Input Schemas

```typescript
export const CreateGameInput = Schema.Struct({
  teamId: Schema.String,
  opponentName: Schema.String,
  gameDate: Schema.Date,
  venue: Schema.String.pipe(Schema.optional),
  isHomeGame: Schema.Boolean.pipe(Schema.optional),
  gameType: Schema.Literal(
    "regular",
    "playoff",
    "tournament",
    "friendly",
    "practice"
  ),
});

export const UpdateGameInput = Schema.Struct({
  gameId: Schema.String,
  opponentName: Schema.String.pipe(Schema.optional),
  gameDate: Schema.Date.pipe(Schema.optional),
  venue: Schema.String.pipe(Schema.optional),
  isHomeGame: Schema.Boolean.pipe(Schema.optional),
  gameType: Schema.Literal(
    "regular",
    "playoff",
    "tournament",
    "friendly",
    "practice"
  ).pipe(Schema.optional),
  status: Schema.Literal(
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
    "postponed"
  ).pipe(Schema.optional),
  homeScore: Schema.Number.pipe(Schema.optional),
  awayScore: Schema.Number.pipe(Schema.optional),
  coachNotes: Schema.String.pipe(Schema.optional),
});

export const GameRosterInput = Schema.Struct({
  gameId: Schema.String,
  playerId: Schema.String,
  position: Schema.String.pipe(Schema.optional),
  jerseyNumber: Schema.Number.pipe(Schema.optional),
  isStarter: Schema.Boolean.pipe(Schema.optional),
  isCaptain: Schema.Boolean.pipe(Schema.optional),
});

export const PlayerStatsInput = Schema.Struct({
  gameId: Schema.String,
  playerId: Schema.String,
  goals: Schema.Number.pipe(Schema.optional),
  assists: Schema.Number.pipe(Schema.optional),
  shots: Schema.Number.pipe(Schema.optional),
  shotsOnGoal: Schema.Number.pipe(Schema.optional),
  groundBalls: Schema.Number.pipe(Schema.optional),
  turnovers: Schema.Number.pipe(Schema.optional),
  causedTurnovers: Schema.Number.pipe(Schema.optional),
  saves: Schema.Number.pipe(Schema.optional),
  goalsAllowed: Schema.Number.pipe(Schema.optional),
  faceOffsWon: Schema.Number.pipe(Schema.optional),
  faceOffsTaken: Schema.Number.pipe(Schema.optional),
  penalties: Schema.Number.pipe(Schema.optional),
  penaltyMinutes: Schema.Number.pipe(Schema.optional),
  minutesPlayed: Schema.Number.pipe(Schema.optional),
});
```

#### Service Methods

```typescript
export class GamesService extends Context.Tag("GamesService")<
  GamesService,
  {
    // Game CRUD operations
    readonly createGame: (
      input: CreateGameInput,
      headers: Headers
    ) => Effect.Effect<Game, ParseError | GamesError>;
    readonly updateGame: (
      input: UpdateGameInput,
      headers: Headers
    ) => Effect.Effect<Game, ParseError | GamesError>;
    readonly deleteGame: (
      gameId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | GamesError>;
    readonly getGame: (
      gameId: string,
      headers: Headers
    ) => Effect.Effect<Game, ParseError | GamesError>;
    readonly getTeamGames: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<Game[], ParseError | GamesError>;

    // Roster management
    readonly addPlayerToRoster: (
      input: GameRosterInput,
      headers: Headers
    ) => Effect.Effect<void, ParseError | GamesError>;
    readonly removePlayerFromRoster: (
      gameId: string,
      playerId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | GamesError>;
    readonly getGameRoster: (
      gameId: string,
      headers: Headers
    ) => Effect.Effect<GameRosterPlayer[], ParseError | GamesError>;

    // Stats management
    readonly updatePlayerStats: (
      input: PlayerStatsInput,
      headers: Headers
    ) => Effect.Effect<void, ParseError | GamesError>;
    readonly getPlayerGameStats: (
      gameId: string,
      playerId: string,
      headers: Headers
    ) => Effect.Effect<PlayerGameStats, ParseError | GamesError>;
    readonly getGameStats: (
      gameId: string,
      headers: Headers
    ) => Effect.Effect<GameStats, ParseError | GamesError>;

    // Season/aggregate stats
    readonly getPlayerSeasonStats: (
      playerId: string,
      teamId: string,
      headers: Headers
    ) => Effect.Effect<PlayerSeasonStats, ParseError | GamesError>;
    readonly getTeamSeasonStats: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<TeamSeasonStats, ParseError | GamesError>;
  }
>() {}
```

## UI Architecture

### 1. Route Structure

```
/games                           - Games list view
/games/create                    - Create new game
/games/:gameId                   - Game details view
/games/:gameId/edit              - Edit game details
/games/:gameId/roster            - Manage game roster
/games/:gameId/stats             - Game statistics
/games/:gameId/lineup            - Lineup management
```

### 2. Component Structure

#### Games List (`/src/routes/$organizationSlug/games/index.tsx`)

- Table/card view of all team games
- Filter by status, game type, date range
- Quick actions: edit, view details, add roster
- Permission-based actions (coaches can edit, players view only)

#### Game Creation (`/src/routes/$organizationSlug/games/create.tsx`)

- Form with game details
- Date/time picker
- Opponent selection/input
- Venue management
- Game type selection

#### Game Details (`/src/routes/$organizationSlug/games/$gameId.tsx`)

- Game information display
- Score tracking
- Basic stats overview
- Links to roster, detailed stats, lineup management

#### Roster Management (`/src/routes/$organizationSlug/games/$gameId/roster.tsx`)

- Add/remove players from game roster
- Set positions and jersey numbers
- Mark starters and captains
- Attendance tracking

#### Stats Management (`/src/routes/$organizationSlug/games/$gameId/stats.tsx`)

- Input player statistics
- Real-time stat calculation
- Stat validation and error handling
- Export/print game stats

### 3. Component Library

#### Core Components

```typescript
// Game card component
export function GameCard({ game, canEdit }: { game: Game; canEdit: boolean });

// Stats input component
export function StatsInputForm({
  gameId,
  playerId,
}: {
  gameId: string;
  playerId: string;
});

// Roster management component
export function RosterManager({ gameId }: { gameId: string });

// Game status badge
export function GameStatusBadge({ status }: { status: GameStatus });

// Score display component
export function ScoreDisplay({
  homeScore,
  awayScore,
  isHomeGame,
}: ScoreDisplayProps);
```

## Permission System

### Role-Based Access Control

```typescript
// Permission checks in service layer
const checkGamePermission = (
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

### UI Permission Gates

```typescript
// Permission-based rendering
{
  canManageGames && (
    <Button asChild>
      <Link to="/games/create">Create Game</Link>
    </Button>
  );
}

{
  canEditGame && (
    <Button asChild>
      <Link to={`/games/${game.id}/edit`}>Edit Game</Link>
    </Button>
  );
}
```

## Data Flow

### 1. Game Creation Flow

1. Coach navigates to `/games/create`
2. Fills out game creation form
3. Server function validates input and creates game
4. Router invalidation refreshes games list
5. Redirect to game details page

### 2. Stats Entry Flow

1. Coach navigates to `/games/{gameId}/stats`
2. Selects player and enters stats
3. Real-time validation and calculation
4. Server updates player stats and game aggregates
5. UI updates with new totals

### 3. Roster Management Flow

1. Coach navigates to `/games/{gameId}/roster`
2. Views current team members
3. Adds players to game roster with positions
4. Sets starters and captains
5. Server updates game roster
6. Roster locked once game starts

## Future Enhancements

### Phase 2 Features

- [ ] Calendar view for games
- [ ] Game reminders and notifications
- [ ] Photo/video attachments to games
- [ ] Game reports generation
- [ ] Statistical analysis and trends
- [ ] Season standings and rankings

### Phase 3 Features

- [ ] Live game tracking with mobile app
- [ ] Parent notifications and updates
- [ ] Integration with league management systems
- [ ] Advanced analytics and performance metrics
- [ ] Injury tracking and player availability
- [ ] Equipment and uniform management

## Implementation Priority

### High Priority (Phase 1)

1. ✅ Database schema design
2. 🔄 Games Effect service
3. 🔄 Games list UI
4. 🔄 Game creation form
5. 🔄 Game details page
6. 🔄 Basic roster management

### Medium Priority (Phase 1.5)

7. Stats input system
8. Permission system implementation
9. Roster lineup management
10. Score tracking and game status updates

### Lower Priority (Phase 2)

11. Advanced statistics
12. Season aggregate views
13. Export and reporting features
14. Calendar integration

## Technical Considerations

### Performance

- Paginated game lists for teams with many games
- Efficient stat calculations using database aggregations
- Caching strategy for frequently accessed game data

### Data Integrity

- Validation of stat inputs (shots on goal ≤ total shots)
- Referential integrity between games, rosters, and stats
- Soft deletion for historical data preservation

### User Experience

- Optimistic updates for stat entry
- Auto-save functionality for long forms
- Mobile-responsive design for sideline use
- Offline capability for stat entry

This comprehensive plan provides a solid foundation for building a complete game management system that can scale with future requirements while maintaining clean architecture and good user experience.
