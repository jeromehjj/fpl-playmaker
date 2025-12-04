import type { Position, Availability } from './fpl-common';

export interface League {
  id: number;
  name: string;
  shortName: string | null;
  scoring: 'classic' | 'h2h';
  leagueType: string;
  rawLeagueType: string;
  closed: boolean;
  isAdmin: boolean;
  canLeave: boolean;
  entryRank: number | null;
  entryLastRank: number | null;
  rankCount: number | null;
  entryPercentileRank: number | null;
  category: 'classic-array' | 'h2h-array';
}

export interface TeamOverview {
  teamId: string;
  teamName: string;
  managerName: string;
  region: string;
  regionCode: string;
  overallPoints: number;
  overallRank: number;
  gwPoints: number;
  gwRank: number;
  currentEvent: number;
  leagues: League[];
  lastSyncedAt: string | null;
}

export interface SquadPlayer {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: Position;
  nowCost: number;
  gwPoints: number | null;
  valueMillions: number;
  totalPoints: number | null;
  pointsPerGame: number | null;
  pointsPerMillion: number | null;
  pointsPerNinety: number | null;
  minutes: number | null;
  availability: Availability;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
  pick: {
    position: number;
    multiplier: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
    isStarting: boolean;
  };
}

export interface Squad {
  event: number;
  teamId: string;
  value: number; // tenths of a million
  bank: number;  // tenths of a million
  starting: SquadPlayer[];
  bench: SquadPlayer[];
}

export interface TransferDelta {
  cost: number;
  bankRemaining: number;
  pointsPerNinetyDiff: number | null;
  pointsPerMillionDiff: number | null;
}

export interface TransferSuggestion {
  from: SquadPlayer;
  to: SquadPlayer & {
    next3DifficultySum: number | null;
    next5DifficultySum: number | null;
    pointsPerNinety: number | null;
  };
  delta: TransferDelta;
}
