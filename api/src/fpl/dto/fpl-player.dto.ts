import { FplAvailability } from '../types/fpl-availability.type';
import { FplPosition } from '../types/fpl-position';

export interface FplPlayerListItemDto {
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
  minutes: number | null;
  pointsPerNinety: number | null;
  availability: FplAvailability;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
}
