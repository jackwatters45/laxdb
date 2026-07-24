import { AuthService } from "@laxdb/core/auth/auth.service";
import { ClubService } from "@laxdb/core/club/club.service";
import { MatchService } from "@laxdb/core/match/match.service";
import type { StatsApiPayload } from "@laxdb/core/stats/stats.contract";
import { StatsService } from "@laxdb/core/stats/stats.service";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import {
  requireTeamManager,
  withMemberSession,
  type MemberSessionContext,
} from "../auth/auth";
import { LaxdbApi } from "../definition";

export const StatsHandlers = HttpApiBuilder.group(
  LaxdbApi,
  "Stats",
  (handlers) =>
    Effect.gen(function* () {
      const authService = yield* AuthService;
      const clubService = yield* ClubService;
      const matchService = yield* MatchService;
      const statsService = yield* StatsService;

      const authorizeTeam = (session: MemberSessionContext, teamId: string) =>
        Effect.gen(function* () {
          const team = yield* clubService.getTeam({
            organizationId: session.organizationId,
            id: teamId,
          });
          yield* requireTeamManager(session, team.coachMemberId);
          return team;
        });

      const authorizeFixture = (
        session: MemberSessionContext,
        fixtureId: string,
      ) =>
        Effect.gen(function* () {
          const fixture = yield* matchService.getFixture({
            organizationId: session.organizationId,
            id: fixtureId,
          });
          yield* authorizeTeam(session, fixture.teamId);
          return fixture;
        });

      const getFixtureStats = (payload: typeof StatsApiPayload.fixture.Type) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            yield* authorizeFixture(session, payload.fixtureId);
            return yield* statsService.getFixtureStatSheet({
              organizationId: session.organizationId,
              fixtureId: payload.fixtureId,
            });
          }),
        );

      const upsertFixtureStats = (
        payload: typeof StatsApiPayload.upsertFixture.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            yield* authorizeFixture(session, payload.fixtureId);
            return yield* statsService.upsertFixtureStatSheet({
              organizationId: session.organizationId,
              submittedByUserId: session.userId,
              ...payload,
            });
          }),
        );

      const getTeamSummary = (
        payload: typeof StatsApiPayload.teamSeason.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            yield* authorizeTeam(session, payload.teamId);
            return yield* statsService.getTeamSeasonSummary({
              organizationId: session.organizationId,
              ...payload,
            });
          }),
        );

      const getTeamPlayerStats = (
        payload: typeof StatsApiPayload.teamSeason.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            yield* authorizeTeam(session, payload.teamId);
            return yield* statsService.getTeamPlayerStats({
              organizationId: session.organizationId,
              ...payload,
            });
          }),
        );

      const getTeamStandings = (
        payload: typeof StatsApiPayload.teamSeason.Type,
      ) =>
        withMemberSession(authService, (session) =>
          Effect.gen(function* () {
            yield* authorizeTeam(session, payload.teamId);
            return yield* statsService.getTeamStandings({
              organizationId: session.organizationId,
              ...payload,
            });
          }),
        );

      return handlers
        .handle("getFixtureStats", ({ payload }) => getFixtureStats(payload))
        .handle("upsertFixtureStats", ({ payload }) =>
          upsertFixtureStats(payload),
        )
        .handle("getTeamSummary", ({ payload }) => getTeamSummary(payload))
        .handle("getTeamPlayerStats", ({ payload }) =>
          getTeamPlayerStats(payload),
        )
        .handle("getTeamStandings", ({ payload }) => getTeamStandings(payload));
    }),
);
