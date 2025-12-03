import { FplPosition } from '../types/fpl-position';

export interface FplPlayerListItemDto {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: FplPosition;
  nowCost: number;
  // Metric values
  valueMillions: number;
  totalPoints: number | null;
  pointsPerGame: number | null;
  pointsPerMillion: number | null;
  minutes: number | null;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
}
