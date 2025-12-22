# Playbook Management System - Comprehensive Plan

## Overview

A comprehensive system for coaches to create, organize, and manage their team's plays and strategies. This system will start with basic play management and text descriptions, with plans to evolve into a visual canvas/whiteboard system for diagramming plays.

## Database Schema Design

### Core Tables

#### 1. Play Categories Table

```sql
CREATE TABLE play_categories (
  id UUID PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT, -- Hex color for visual organization
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

#### 2. Plays Table

```sql
CREATE TABLE plays (
  id UUID PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  category_id UUID REFERENCES play_categories(id) ON DELETE SET NULL,

  -- Basic Play Information
  name TEXT NOT NULL,
  description TEXT,
  play_type TEXT NOT NULL, -- 'offensive', 'defensive', 'special_situations', 'transition'
  situation TEXT, -- 'man_up', 'man_down', 'even_strength', 'clear', 'ride', 'face_off'
  formation TEXT, -- '2-3-1', '3-3', '1-4-1', etc.

  -- Play Details
  personnel_count INTEGER DEFAULT 6, -- Number of players involved
  difficulty_level TEXT DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  success_rate DECIMAL(5,2), -- Percentage success rate in games

  -- Tactical Information
  primary_objective TEXT, -- Main goal of the play
  key_concepts TEXT[], -- Array of key tactical concepts
  counter_strategies TEXT[], -- How opponents might counter this play

  -- Usage Tracking
  times_called INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  last_used_date DATE,

  -- Visual/Diagram Data (for future canvas feature)
  diagram_data JSONB, -- Store visual diagram information

  -- Status and Organization
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  is_secret BOOLEAN DEFAULT false, -- Hide from certain players
  priority_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Metadata
  created_by_id TEXT NOT NULL REFERENCES user(id),
  notes TEXT,
  tags TEXT[], -- Array of searchable tags

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3),
  deleted_at TIMESTAMP(3)
);
```

#### 3. Play Steps Table

```sql
CREATE TABLE play_steps (
  id UUID PRIMARY KEY,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  timing TEXT, -- 'On whistle', 'After 2 seconds', 'When defender commits'

  -- Player Instructions
  player_instructions JSONB, -- JSON object with position-specific instructions
  key_points TEXT[], -- Array of critical execution points

  -- Visual positioning (for future canvas feature)
  player_positions JSONB, -- Store player positions for this step
  ball_position JSONB, -- Ball location for this step

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 4. Play Assignments Table

```sql
CREATE TABLE play_assignments (
  id UUID PRIMARY KEY,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,

  -- Assignment Details
  assigned_date DATE NOT NULL,
  assigned_by_id TEXT NOT NULL REFERENCES user(id),
  due_date DATE,

  -- Learning Progress
  status TEXT DEFAULT 'assigned', -- 'assigned', 'studying', 'practicing', 'mastered'
  confidence_level INTEGER, -- 1-10 scale
  practice_count INTEGER DEFAULT 0,

  -- Feedback
  player_notes TEXT,
  coach_feedback TEXT,
  areas_to_improve TEXT[],

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

#### 5. Play Execution Log Table

```sql
CREATE TABLE play_execution_log (
  id UUID PRIMARY KEY,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,

  -- Execution Details
  execution_date DATE NOT NULL,
  quarter_period INTEGER,
  time_remaining TEXT,
  score_situation TEXT, -- 'tied', 'leading_by_1', 'trailing_by_2', etc.
  field_position TEXT, -- 'defensive_zone', 'midfield', 'offensive_zone'

  -- Outcome
  was_successful BOOLEAN NOT NULL,
  result_description TEXT, -- 'Goal scored', 'Turnover', 'Shot saved', etc.
  points_scored INTEGER DEFAULT 0,

  -- Analysis
  execution_quality INTEGER, -- 1-10 rating of how well it was executed
  what_worked TEXT,
  what_needs_improvement TEXT,
  opponent_response TEXT,

  -- Context
  players_involved TEXT[], -- Array of player names/IDs who executed
  recorded_by_id TEXT NOT NULL REFERENCES user(id),
  notes TEXT,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
```

#### 6. Play Practice Sessions Table

```sql
CREATE TABLE play_practice_sessions (
  id UUID PRIMARY KEY,
  play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  -- Session Details
  practice_date DATE NOT NULL,
  duration_minutes INTEGER,
  players_present TEXT[], -- Array of player IDs

  -- Practice Focus
  focus_areas TEXT[], -- What aspects were emphasized
  drill_variations TEXT[], -- Different ways the play was practiced

  -- Assessment
  overall_execution_rating INTEGER, -- 1-10 scale
  individual_ratings JSONB, -- Per-player ratings
  improvement_notes TEXT,
  next_session_goals TEXT,

  -- Metrics
  repetitions_completed INTEGER,
  successful_executions INTEGER,

  conducted_by_id TEXT NOT NULL REFERENCES user(id),
  notes TEXT,

  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW()
);
```

#### 7. Play Variations Table

```sql
CREATE TABLE play_variations (
  id UUID PRIMARY KEY,
  parent_play_id UUID NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  -- Variation Details
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  variation_type TEXT, -- 'personnel_change', 'timing_adjustment', 'formation_shift'

  -- Differences from parent play
  changes_description TEXT,
  modified_steps JSONB, -- Which steps are different

  -- Usage
  when_to_use TEXT, -- Specific situations for this variation
  advantages TEXT[],
  disadvantages TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_by_id TEXT NOT NULL REFERENCES user(id),
  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(3)
);
```

## Effect Service Architecture

### 1. Playbook Service (`packages/core/src/playbook/index.ts`)

#### Input Schemas

```typescript
export const CreatePlayCategoryInput = Schema.Struct({
  teamId: Schema.String,
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  colorCode: Schema.String.pipe(Schema.optional),
  sortOrder: Schema.Number.pipe(Schema.optional),
});

export const CreatePlayInput = Schema.Struct({
  teamId: Schema.String,
  categoryId: Schema.String.pipe(Schema.optional),
  name: Schema.String,
  description: Schema.String.pipe(Schema.optional),
  playType: Schema.Literal(
    "offensive",
    "defensive",
    "special_situations",
    "transition"
  ),
  situation: Schema.String.pipe(Schema.optional),
  formation: Schema.String.pipe(Schema.optional),
  personnelCount: Schema.Number.pipe(Schema.optional),
  difficultyLevel: Schema.Literal("beginner", "intermediate", "advanced").pipe(
    Schema.optional
  ),
  primaryObjective: Schema.String.pipe(Schema.optional),
  keyConcepts: Schema.Array(Schema.String).pipe(Schema.optional),
  counterStrategies: Schema.Array(Schema.String).pipe(Schema.optional),
  isActive: Schema.Boolean.pipe(Schema.optional),
  isFavorite: Schema.Boolean.pipe(Schema.optional),
  isSecret: Schema.Boolean.pipe(Schema.optional),
  priorityLevel: Schema.Literal("low", "medium", "high").pipe(Schema.optional),
  notes: Schema.String.pipe(Schema.optional),
  tags: Schema.Array(Schema.String).pipe(Schema.optional),
});

export const CreatePlayStepInput = Schema.Struct({
  playId: Schema.String,
  stepNumber: Schema.Number,
  title: Schema.String,
  description: Schema.String,
  timing: Schema.String.pipe(Schema.optional),
  playerInstructions: Schema.Record(Schema.String, Schema.String).pipe(
    Schema.optional
  ),
  keyPoints: Schema.Array(Schema.String).pipe(Schema.optional),
});

export const CreatePlayAssignmentInput = Schema.Struct({
  playId: Schema.String,
  userId: Schema.String,
  assignedDate: Schema.Date,
  dueDate: Schema.Date.pipe(Schema.optional),
});

export const CreatePlayExecutionInput = Schema.Struct({
  playId: Schema.String,
  gameId: Schema.String.pipe(Schema.optional),
  executionDate: Schema.Date,
  quarterPeriod: Schema.Number.pipe(Schema.optional),
  timeRemaining: Schema.String.pipe(Schema.optional),
  scoreSituation: Schema.String.pipe(Schema.optional),
  fieldPosition: Schema.String.pipe(Schema.optional),
  wasSuccessful: Schema.Boolean,
  resultDescription: Schema.String.pipe(Schema.optional),
  pointsScored: Schema.Number.pipe(Schema.optional),
  executionQuality: Schema.Number.pipe(Schema.optional),
  whatWorked: Schema.String.pipe(Schema.optional),
  whatNeedsImprovement: Schema.String.pipe(Schema.optional),
  playersInvolved: Schema.Array(Schema.String).pipe(Schema.optional),
  notes: Schema.String.pipe(Schema.optional),
});

export const CreatePracticeSessionInput = Schema.Struct({
  playId: Schema.String,
  practiceDate: Schema.Date,
  durationMinutes: Schema.Number.pipe(Schema.optional),
  playersPresent: Schema.Array(Schema.String).pipe(Schema.optional),
  focusAreas: Schema.Array(Schema.String).pipe(Schema.optional),
  overallExecutionRating: Schema.Number.pipe(Schema.optional),
  repetitionsCompleted: Schema.Number.pipe(Schema.optional),
  successfulExecutions: Schema.Number.pipe(Schema.optional),
  improvementNotes: Schema.String.pipe(Schema.optional),
  nextSessionGoals: Schema.String.pipe(Schema.optional),
  notes: Schema.String.pipe(Schema.optional),
});
```

#### Service Methods

```typescript
export class PlaybookService extends Context.Tag("PlaybookService")<
  PlaybookService,
  {
    // Play Categories
    readonly createPlayCategory: (
      input: CreatePlayCategoryInput,
      headers: Headers
    ) => Effect.Effect<PlayCategory, ParseError | PlaybookError>;
    readonly getPlayCategories: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<PlayCategory[], ParseError | PlaybookError>;
    readonly updatePlayCategory: (
      categoryId: string,
      input: Partial<CreatePlayCategoryInput>,
      headers: Headers
    ) => Effect.Effect<PlayCategory, ParseError | PlaybookError>;
    readonly deletePlayCategory: (
      categoryId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | PlaybookError>;

    // Plays CRUD
    readonly createPlay: (
      input: CreatePlayInput,
      headers: Headers
    ) => Effect.Effect<Play, ParseError | PlaybookError>;
    readonly updatePlay: (
      playId: string,
      input: Partial<CreatePlayInput>,
      headers: Headers
    ) => Effect.Effect<Play, ParseError | PlaybookError>;
    readonly deletePlay: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | PlaybookError>;
    readonly getPlay: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<PlayWithSteps, ParseError | PlaybookError>;
    readonly getTeamPlays: (
      teamId: string,
      filters?: PlayFilters,
      headers?: Headers
    ) => Effect.Effect<Play[], ParseError | PlaybookError>;

    // Play Steps
    readonly createPlayStep: (
      input: CreatePlayStepInput,
      headers: Headers
    ) => Effect.Effect<PlayStep, ParseError | PlaybookError>;
    readonly updatePlayStep: (
      stepId: string,
      input: Partial<CreatePlayStepInput>,
      headers: Headers
    ) => Effect.Effect<PlayStep, ParseError | PlaybookError>;
    readonly deletePlayStep: (
      stepId: string,
      headers: Headers
    ) => Effect.Effect<void, ParseError | PlaybookError>;
    readonly reorderPlaySteps: (
      playId: string,
      stepIds: string[],
      headers: Headers
    ) => Effect.Effect<PlayStep[], ParseError | PlaybookError>;

    // Play Assignments
    readonly assignPlayToPlayer: (
      input: CreatePlayAssignmentInput,
      headers: Headers
    ) => Effect.Effect<PlayAssignment, ParseError | PlaybookError>;
    readonly updatePlayAssignment: (
      assignmentId: string,
      status: string,
      confidenceLevel?: number,
      playerNotes?: string,
      headers?: Headers
    ) => Effect.Effect<PlayAssignment, ParseError | PlaybookError>;
    readonly getPlayerAssignments: (
      userId: string,
      headers: Headers
    ) => Effect.Effect<PlayAssignment[], ParseError | PlaybookError>;
    readonly getPlayAssignments: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<PlayAssignment[], ParseError | PlaybookError>;

    // Execution Tracking
    readonly logPlayExecution: (
      input: CreatePlayExecutionInput,
      headers: Headers
    ) => Effect.Effect<PlayExecution, ParseError | PlaybookError>;
    readonly getPlayExecutionHistory: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<PlayExecution[], ParseError | PlaybookError>;
    readonly updatePlayStatistics: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<Play, ParseError | PlaybookError>;

    // Practice Sessions
    readonly createPracticeSession: (
      input: CreatePracticeSessionInput,
      headers: Headers
    ) => Effect.Effect<PracticeSession, ParseError | PlaybookError>;
    readonly getPracticeSessions: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<PracticeSession[], ParseError | PlaybookError>;

    // Analytics & Reports
    readonly getPlaybookAnalytics: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<PlaybookAnalytics, ParseError | PlaybookError>;
    readonly getPlayEffectiveness: (
      playId: string,
      headers: Headers
    ) => Effect.Effect<PlayEffectiveness, ParseError | PlaybookError>;
    readonly getTeamPlaybookSummary: (
      teamId: string,
      headers: Headers
    ) => Effect.Effect<PlaybookSummary, ParseError | PlaybookError>;
  }
>() {}
```

## UI Architecture

### 1. Route Structure

```
/playbook                          - Playbook overview/dashboard
/playbook/categories               - Manage play categories
/playbook/categories/create        - Create new category
/playbook/plays                    - All plays list
/playbook/plays/create             - Create new play
/playbook/plays/:playId            - Individual play details
/playbook/plays/:playId/edit       - Edit play
/playbook/plays/:playId/steps      - Manage play steps
/playbook/plays/:playId/practice   - Practice session tracking
/playbook/plays/:playId/analytics  - Play performance analytics
/playbook/assignments              - Player play assignments
/playbook/practice                 - Practice session overview
```

### 2. Component Structure

#### Playbook Dashboard (`/src/routes/$organizationSlug/playbook/index.tsx`)

- Overview statistics (total plays, categories, success rates)
- Recent play usage and performance
- Quick access to favorite plays
- Practice session summary
- Player assignment status

#### Play Categories Management (`/src/routes/$organizationSlug/playbook/categories.tsx`)

- Visual category organization with color coding
- Drag-and-drop reordering
- Category creation and editing
- Play count per category

#### Plays List (`/src/routes/$organizationSlug/playbook/plays/index.tsx`)

- Filterable and searchable play library
- Grid/list view toggle
- Filter by category, type, difficulty, success rate
- Quick actions: favorite, assign, practice log

#### Play Details (`/src/routes/$organizationSlug/playbook/plays/$playId.tsx`)

- Complete play information and description
- Step-by-step breakdown with instructions
- Execution history and statistics
- Assignment tracking
- Practice session logs

#### Play Creation/Editing (`/src/routes/$organizationSlug/playbook/plays/create.tsx`)

- Multi-step form for play creation
- Category selection and tagging
- Step-by-step instruction builder
- Visual formation selector (future canvas integration)

#### Play Steps Management (`/src/routes/$organizationSlug/playbook/plays/$playId/steps.tsx`)

- Interactive step editor
- Drag-and-drop step reordering
- Position-specific instruction editor
- Timing and execution notes

### 3. Component Library

#### Core Components

```typescript
// Play card component
export function PlayCard({
  play,
  showActions,
}: {
  play: Play;
  showActions: boolean;
});

// Play category badge
export function PlayCategoryBadge({ category }: { category: PlayCategory });

// Play statistics display
export function PlayStatistics({ play }: { play: Play });

// Step editor component
export function PlayStepEditor({
  step,
  onUpdate,
}: {
  step: PlayStep;
  onUpdate: (step: PlayStep) => void;
});

// Formation selector
export function FormationSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (formation: string) => void;
});

// Play execution logger
export function PlayExecutionForm({
  playId,
  onSave,
}: {
  playId: string;
  onSave: () => void;
});

// Practice session tracker
export function PracticeSessionForm({
  playId,
  onSave,
}: {
  playId: string;
  onSave: () => void;
});

// Play analytics dashboard
export function PlayAnalytics({ playId }: { playId: string });
```

## Permission System

### Role-Based Access Control

```typescript
const checkPlaybookPermission = (
  userRole: string,
  action: "read" | "write" | "create" | "manage" | "assign"
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
    case "create":
      return ["coach", "headCoach"].includes(userRole);
    case "manage":
      return ["headCoach"].includes(userRole);
    case "assign":
      return ["assistantCoach", "coach", "headCoach"].includes(userRole);
    default:
      return false;
  }
};
```

### Data Visibility Levels

- **Players**: View assigned plays, practice notes, execution feedback
- **Parents**: Limited view of public plays and practice information
- **Assistant Coaches**: View all plays, create practice sessions, assign plays
- **Coaches**: Full access to create, edit, and manage plays
- **Head Coaches**: Complete access including secret plays and strategic analysis

## Features & Functionality

### Phase 1 - Core Features

1. **Play Management**

   - Basic play creation with categories
   - Text-based play descriptions
   - Step-by-step instructions
   - Simple organization and tagging

2. **Player Assignments**

   - Assign plays to individual players
   - Track learning progress
   - Basic feedback system

3. **Execution Tracking**
   - Log play usage in games
   - Success/failure tracking
   - Basic statistics

### Phase 2 - Advanced Features

4. **Practice Integration**

   - Practice session logging
   - Execution quality tracking
   - Progress monitoring

5. **Analytics Dashboard**

   - Play effectiveness metrics
   - Usage patterns and trends
   - Success rate analysis

6. **Play Variations**
   - Create play variations
   - Situational adaptations
   - Counter-strategy development

### Phase 3 - Visual Features

7. **Canvas/Whiteboard Integration**

   - Visual play diagramming
   - Interactive field positioning
   - Animation of play movement

8. **Video Integration**

   - Link practice videos to plays
   - Execution examples
   - Analysis footage

9. **Advanced Analytics**
   - Predictive success modeling
   - Opponent-specific adaptations
   - Performance correlation analysis

## Integration Points

### With Game Management System

- Link play executions to specific games
- Performance analysis per opponent
- Game situation effectiveness

### With Player Development

- Track individual play mastery
- Development progress on specific plays
- Skill improvement correlation

### With Team Management

- Position-specific play assignments
- Roster-based play selection
- Team chemistry optimization

## Future Canvas/Whiteboard Features

### Phase 3 Implementation Plan

1. **Field Canvas Component**

   - Interactive lacrosse field overlay
   - Drag-and-drop player positioning
   - Ball movement paths

2. **Animation System**

   - Step-by-step play animation
   - Timing visualization
   - Movement coordination

3. **Drawing Tools**
   - Annotation capabilities
   - Custom markings and notes
   - Strategy overlays

## Implementation Priority

### High Priority (Phase 1)

1. ✅ Database schema design
2. 🔄 Basic play management (CRUD)
3. 🔄 Play categories system
4. 🔄 Playbook dashboard UI
5. 🔄 Play creation and editing

### Medium Priority (Phase 2)

6. Player assignment system
7. Execution tracking and logging
8. Practice session management
9. Basic analytics and statistics
10. Play search and filtering

### Lower Priority (Phase 3)

11. Advanced analytics dashboard
12. Canvas/whiteboard integration
13. Video integration capabilities
14. Mobile app synchronization
15. AI-powered play suggestions

## Technical Considerations

### Performance

- Efficient querying with proper indexing
- Optimized image/diagram storage
- Real-time collaboration features
- Mobile-responsive design

### Data Security

- Role-based access to strategic information
- Secret play protection
- Audit trails for play modifications
- Secure sharing capabilities

### User Experience

- Intuitive play creation workflow
- Quick access to frequently used plays
- Visual organization and categorization
- Offline capability for field use

### Scalability

- Multi-season play libraries
- Cross-team play sharing
- Template and standard play libraries
- Performance optimization for large playbooks

This comprehensive playbook management system will provide coaches with powerful tools to organize their strategic knowledge, track play effectiveness, and improve team execution through systematic practice and analysis.
