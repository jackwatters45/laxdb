# Practice Planning System - Architecture Plan

## Overview
The Practice Planning System enables coaches to create a comprehensive drill bank and schedule structured practice sessions. This system focuses on efficient practice organization, drill management, and session planning.

## Database Schema

### Core Tables

#### 1. `drill_categories`
- `id` (Primary Key)
- `team_id` (Foreign Key to teams)
- `name` (String) - Category name (e.g., "Shooting", "Passing", "Conditioning")
- `description` (Text) - Category description
- `color` (String) - UI color for visual organization
- `sort_order` (Integer) - Display order
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 2. `drills`
- `id` (Primary Key)
- `team_id` (Foreign Key to teams)
- `category_id` (Foreign Key to drill_categories)
- `name` (String) - Drill name
- `description` (Text) - Detailed drill description
- `instructions` (Text) - Step-by-step instructions
- `duration_minutes` (Integer) - Estimated duration
- `difficulty_level` (Enum: beginner, intermediate, advanced)
- `player_count_min` (Integer) - Minimum players required
- `player_count_max` (Integer) - Maximum players (null for unlimited)
- `equipment_needed` (JSON) - Array of equipment items
- `skills_focus` (JSON) - Array of skills being developed
- `tags` (JSON) - Array of searchable tags
- `is_favorite` (Boolean) - Coach favorited drill
- `usage_count` (Integer) - Times used in practices
- `created_by` (Foreign Key to users)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 3. `drill_variations`
- `id` (Primary Key)
- `drill_id` (Foreign Key to drills)
- `name` (String) - Variation name
- `description` (Text) - How this variation differs
- `modifications` (Text) - Specific changes to make
- `difficulty_adjustment` (Enum: easier, same, harder)
- `created_at` (Timestamp)

#### 4. `practice_templates`
- `id` (Primary Key)
- `team_id` (Foreign Key to teams)
- `name` (String) - Template name
- `description` (Text) - Template description
- `duration_minutes` (Integer) - Total practice duration
- `focus_areas` (JSON) - Array of practice focus areas
- `is_default` (Boolean) - Default template for quick scheduling
- `usage_count` (Integer) - Times used
- `created_by` (Foreign Key to users)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 5. `practice_sessions`
- `id` (Primary Key)
- `team_id` (Foreign Key to teams)
- `template_id` (Foreign Key to practice_templates, nullable)
- `name` (String) - Practice session name
- `description` (Text) - Session description
- `scheduled_date` (DateTime) - When practice is scheduled
- `duration_minutes` (Integer) - Planned duration
- `location` (String) - Practice location
- `status` (Enum: scheduled, in_progress, completed, cancelled)
- `actual_start_time` (DateTime, nullable)
- `actual_end_time` (DateTime, nullable)
- `attendance_count` (Integer, nullable) - Players who attended
- `weather_conditions` (String, nullable)
- `field_conditions` (String, nullable)
- `coach_notes` (Text, nullable) - Post-practice notes
- `objectives` (JSON) - Practice objectives/goals
- `created_by` (Foreign Key to users)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### 6. `practice_drill_assignments`
- `id` (Primary Key)
- `practice_session_id` (Foreign Key to practice_sessions)
- `drill_id` (Foreign Key to drills)
- `order_index` (Integer) - Order in practice schedule
- `planned_duration_minutes` (Integer) - Planned time for this drill
- `actual_duration_minutes` (Integer, nullable) - Actual time spent
- `notes` (Text, nullable) - Drill-specific notes
- `modifications_made` (Text, nullable) - Changes made during practice
- `effectiveness_rating` (Integer, nullable) - 1-10 rating post-practice
- `player_participation` (JSON, nullable) - Player involvement data
- `created_at` (Timestamp)

#### 7. `practice_attendance`
- `id` (Primary Key)
- `practice_session_id` (Foreign Key to practice_sessions)
- `player_id` (Foreign Key to players)
- `status` (Enum: present, absent, late, injured)
- `arrival_time` (DateTime, nullable)
- `departure_time` (DateTime, nullable)
- `participation_level` (Enum: full, limited, observer)
- `notes` (Text, nullable) - Attendance notes
- `created_at` (Timestamp)

#### 8. `drill_feedback`
- `id` (Primary Key)
- `drill_id` (Foreign Key to drills)
- `practice_session_id` (Foreign Key to practice_sessions)
- `player_id` (Foreign Key to players, nullable) - Player-specific feedback
- `feedback_type` (Enum: general, player_specific, modification_needed)
- `content` (Text) - Feedback content
- `rating` (Integer, nullable) - 1-10 rating
- `created_by` (Foreign Key to users)
- `created_at` (Timestamp)

## API Endpoints Structure

### Drill Management
- `GET /api/drills` - List drills with filtering
- `POST /api/drills` - Create new drill
- `GET /api/drills/:id` - Get drill details
- `PUT /api/drills/:id` - Update drill
- `DELETE /api/drills/:id` - Delete drill
- `POST /api/drills/:id/favorite` - Toggle favorite status

### Drill Categories
- `GET /api/drill-categories` - List categories
- `POST /api/drill-categories` - Create category
- `PUT /api/drill-categories/:id` - Update category
- `DELETE /api/drill-categories/:id` - Delete category

### Practice Templates
- `GET /api/practice-templates` - List templates
- `POST /api/practice-templates` - Create template
- `GET /api/practice-templates/:id` - Get template details
- `PUT /api/practice-templates/:id` - Update template
- `DELETE /api/practice-templates/:id` - Delete template

### Practice Sessions
- `GET /api/practice-sessions` - List sessions with filtering
- `POST /api/practice-sessions` - Create/schedule practice
- `GET /api/practice-sessions/:id` - Get session details
- `PUT /api/practice-sessions/:id` - Update session
- `DELETE /api/practice-sessions/:id` - Cancel/delete session
- `POST /api/practice-sessions/:id/start` - Start practice
- `POST /api/practice-sessions/:id/end` - End practice
- `POST /api/practice-sessions/:id/attendance` - Record attendance

### Practice Analytics
- `GET /api/analytics/drills/usage` - Drill usage statistics
- `GET /api/analytics/practices/effectiveness` - Practice effectiveness metrics
- `GET /api/analytics/player/attendance` - Player attendance patterns

## User Interface Structure

### Main Navigation
- Add "Practice" tab to main navigation
- Subnav: Dashboard, Drills, Schedule, Templates, Analytics

### Page Routes
- `/practice` - Practice dashboard overview
- `/practice/drills` - Drill bank management
- `/practice/drills/create` - Create new drill
- `/practice/drills/:id` - Drill details/edit
- `/practice/schedule` - Practice calendar/scheduler
- `/practice/schedule/create` - Schedule new practice
- `/practice/sessions/:id` - Practice session details
- `/practice/templates` - Practice templates
- `/practice/templates/create` - Create template
- `/practice/analytics` - Practice analytics

## Key Features

### Drill Bank Management
- **Categorized Organization**: Drills organized by category (Shooting, Passing, etc.)
- **Advanced Search & Filtering**: By category, difficulty, duration, skills, equipment
- **Drill Variations**: Multiple variations of base drills
- **Equipment Tracking**: Required equipment list for each drill
- **Skill Development Mapping**: Link drills to specific skills being developed
- **Usage Analytics**: Track which drills are most effective

### Practice Scheduling
- **Calendar Interface**: Visual practice calendar with drag-and-drop
- **Template System**: Pre-built practice templates for quick scheduling
- **Drill Assignment**: Assign drills to practice sessions with timing
- **Player Availability**: Consider player availability when scheduling
- **Recurring Practices**: Schedule regular practice sessions
- **Location Management**: Track different practice locations

### Practice Session Management
- **Real-time Updates**: Start/stop practice, track actual timing
- **Attendance Tracking**: Mark player attendance and participation levels
- **Dynamic Adjustments**: Modify drills during practice
- **Coach Notes**: Capture observations and feedback
- **Effectiveness Ratings**: Rate drill effectiveness post-practice

### Analytics & Insights
- **Drill Effectiveness**: Which drills work best for skill development
- **Practice Patterns**: Optimal practice structures and timing
- **Player Development**: Track individual player progress through drills
- **Attendance Trends**: Monitor practice attendance patterns
- **Equipment Utilization**: Track equipment usage and needs

## Coach Workflow

### 1. Drill Bank Setup
1. Create drill categories
2. Add drills to the bank with detailed instructions
3. Tag drills with skills and difficulty levels
4. Create variations for different skill levels

### 2. Practice Planning
1. Select practice template or create custom session
2. Assign drills from the bank
3. Set timing and order for each drill
4. Add practice objectives and notes
5. Schedule with date, time, and location

### 3. Practice Execution
1. Start practice session
2. Track attendance
3. Execute drills with real-time timing
4. Make on-the-fly adjustments
5. Record effectiveness ratings and notes

### 4. Post-Practice Review
1. Review session effectiveness
2. Update drill ratings
3. Add coach observations
4. Plan follow-up practices based on results

## Integration Points

### Player Development System
- Link drills to player skill assessments
- Track individual player performance in drills
- Assign specific drills for player development goals

### Playbook System
- Reference plays during practice drills
- Create drills that support specific plays
- Link practice sessions to upcoming games

### Team Management
- Consider roster availability for practice scheduling
- Track player attendance and participation
- Coordinate with game schedules

## Future Enhancements

### Video Integration
- Attach instructional videos to drills
- Record practice sessions for review
- Create video libraries for drill demonstrations

### Mobile App
- Coach mobile app for practice management
- Real-time updates during practice
- Offline access to drill instructions

### Advanced Analytics
- AI-powered practice recommendations
- Predictive analytics for optimal practice timing
- Correlation analysis between drills and game performance

### Equipment Management
- Track equipment inventory
- Reserve equipment for practices
- Maintenance scheduling and tracking

This comprehensive Practice Planning system will transform how coaches organize, execute, and analyze their practice sessions, leading to more effective player development and team improvement.