import type { FplSquadPlayerDto } from './fpl-squad.dto';
import type { FplPlayerListItemDto } from './fpl-player.dto';

export interface FplTransferSuggestionDto {
  from: FplSquadPlayerDto; // Player from user's squad
  to: FplPlayerListItemDto; // Player from player base
  delta: {
    cost: number; // to.nowCost - from.nowCost
    bankRemaining: number; // new bank in tenths of a million
    pointsPerNinetyDiff: number | null;
    pointsPerMillionDiff: number | null;
  };
}
