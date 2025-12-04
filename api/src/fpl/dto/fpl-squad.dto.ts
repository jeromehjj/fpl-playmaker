import { FplAvailability } from '../types/fpl-availability.type';
import type { FplPosition } from '../types/fpl-position';

export interface FplSquadPlayerDto {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: FplPosition;
  nowCost: number;
  // Metric values
  next3DifficultySum: number | null;
  next5DifficultySum: number | null;
  valueMillions: number;
  totalPoints: number | null;
  pointsPerGame: number | null;
  pointsPerMillion: number | null;
  pointsPerNinety: number | null;
  minutes: number | null;
  availability: FplAvailability;
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

export interface FplSquadDto {
  event: number;
  teamId: string;
  value: number; // tenths of a million
  bank: number; // tenths of a million
  starting: FplSquadPlayerDto[];
  bench: FplSquadPlayerDto[];
}
