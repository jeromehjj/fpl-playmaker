import { FplPosition } from './fpl-position';

export type PlayerSortKey =
  | 'PRICE'
  | 'TOTAL_POINTS'
  | 'POINTS_PER_GAME'
  | 'POINTS_PER_90'
  | 'POINTS_PER_MILLION'
  | 'MINUTES';

export type PlayerSortDirection = 'ASC' | 'DESC';

export type ListPlayersOptions = {
  clubExternalId?: number;
  position?: FplPosition;
  search?: string;
  offset?: number;
  limit?: number;
  minMinutes?: number;
  sortKey?: PlayerSortKey;
  sortDirection?: PlayerSortDirection;
};
