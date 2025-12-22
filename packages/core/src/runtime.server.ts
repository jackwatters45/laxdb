import { Layer, ManagedRuntime } from 'effect';
import { AuthService } from './auth';
import { FeedbackService } from './feedback/feedback.service';
import { GameService } from './game/game.service';
import { OrganizationService } from './organization/organization.service';
import { PlayerContactInfoService } from './player/contact-info/contact-info.service';
import { PlayerService } from './player/player.service';
import { SeasonService } from './season/season.service';
import { TeamService } from './team/team.service';

const MainLayer = Layer.mergeAll(
  AuthService.Default,
  OrganizationService.Default,
  TeamService.Default,
  SeasonService.Default,
  GameService.Default,
  PlayerService.Default,
  PlayerContactInfoService.Default,
  FeedbackService.Default
);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
