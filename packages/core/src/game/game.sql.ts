import { boolean, index, integer, pgTable, text } from "drizzle-orm/pg-core";

import { ids, timestamp, timestamps } from "../drizzle/drizzle.type";
import { organizationTable } from "../organization/organization.sql";
import { seasonTable } from "../season/season.sql";
import { teamTable } from "../team/team.sql";

export const gameTable = pgTable(
  "game",
  {
    ...ids,
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationTable.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    seasonId: integer("seasonId")
      .notNull()
      .references(() => seasonTable.id, { onDelete: "cascade" }),

    // Opponent Information
    opponentName: text("opponent_name").notNull(),
    opponentTeamId: text("opponent_team_id"), // Optional: if opponent is also in system

    // Game Details
    gameDate: timestamp("game_date").notNull(),
    venue: text("venue").notNull(),
    isHomeGame: boolean("is_home_game").notNull(), // 1 = home, 0 = away

    // Game Classification
    gameType: text("game_type").notNull().default("regular"),
    // Values: 'regular' | 'playoff' | 'tournament' | 'friendly' | 'practice'

    status: text("status").notNull().default("scheduled"),
    // Values: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'

    // Scores
    homeScore: integer("home_score").default(0),
    awayScore: integer("away_score").default(0),

    // Optional Fields
    notes: text("notes"),
    location: text("location"), // For maps/directions

    // Optional Fields V2
    uniformColor: text("uniform_color"), // Practical need
    arrivalTime: timestamp("arrival_time"), // Important for logistics
    opponentLogoUrl: text("opponent_logo_url"), // UI enhancement
    externalGameId: text("external_game_id"), // Integration with league systems

    ...timestamps,
  },
  (table) => [
    index("idx_game_organization").on(table.organizationId),
    index("idx_game_team").on(table.teamId),
    index("idx_game_date").on(table.gameDate),
    index("idx_game_status").on(table.status),
    index("idx_game_team_date").on(table.teamId, table.gameDate),
  ],
);

type GameInternal = typeof gameTable.$inferSelect;
export type GameSelect = Omit<GameInternal, "id">;

export type GameInsert = typeof gameTable.$inferInsert;

// ## Scheduling & Logistics

// • arrivalTime - When team should arrive (often 30-60 min before game)
// • uniformColor - Home/away jersey color to wear
// • transportation - Bus/carpool details for away games
// • rosterDeadline - When roster must be submitted

// ## Game Management

// • officialId/refereeId - Reference to assigned officials
// • fieldNumber - For venues with multiple fields
// • duration - Expected game length (varies by age group)
// • periods - Number of quarters/halves
// • overtime - Boolean if game went to OT

// ## Weather & Conditions (Outdoor Sports)

// • weatherConditions - Text field
// • temperature - Integer
// • fieldConditions - 'good' | 'wet' | 'muddy' etc.

// ## Advanced Stats & Tracking

// • attendance - Number of spectators
// • streamUrl - Link to live stream or recorded game
// • highlightsUrl - Link to highlights reel
// • statsSheetUrl - Link to uploaded stats document
// • gameReportUrl - Post-game report/summary

// ## Competition Context
// • seasonId - Reference to season table
// • conferenceGame - Boolean for conference/league games
// • divisionId - League division reference
// • tournamentId - If part of a tournament
// • roundNumber - For tournaments/playoffs
// • importance - 'high' | 'medium' | 'low' for priority

// ## Communication

// • preGameMeetingTime - Team meeting before game
// • postGameNotes - Coach's post-game summary
// • injuries - JSONB array of injury reports
// • mvpPlayerId - Player of the game

// ## Administrative

// • confirmedAt - When opponent confirmed the game
// • remindersSent - JSONB tracking what reminders were sent
// • cancelledReason - Text if status is cancelled
// • postponedTo - New date if postponed

// ## Lacrosse-Specific (since this is laxdb)

// • goalieStats - JSONB with saves/goals allowed
// • faceoffStats - JSONB with faceoff win/loss
// • penaltyMinutes - Total penalty minutes
// • manUpGoals - Goals scored while man-up
// • manDownGoals - Goals scored while man-down
