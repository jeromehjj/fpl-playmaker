import type { Position, Availability } from './fpl-common';

export type PositionFilter = Position | 'ALL';
export type AvailabilityFilter = Availability | 'ALL';

export type PlayerSortKey =
  | 'PRICE'
  | 'TOTAL_POINTS'
  | 'POINTS_PER_GAME'
  | 'POINTS_PER_90'
  | 'POINTS_PER_MILLION'
  | 'MINUTES';

export interface PlayerListItem {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: Position;
  nowCost: number;
  valueMillions: number;
  totalPoints: number | null;
  pointsPerGame: number | null;
  pointsPerMillion: number | null;
  minutes: number | null;
  pointsPerNinety: number | null;
  availability: Availability;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
}

export const PLAYER_SORT_KEY_OPTIONS: { label: string; value: PlayerSortKey }[] =
  [
    { label: 'Price', value: 'PRICE' },
    { label: 'Total points', value: 'TOTAL_POINTS' },
    { label: 'Pts/G', value: 'POINTS_PER_GAME' },
    { label: 'Pts/90', value: 'POINTS_PER_90' },
    { label: 'Pts/mil', value: 'POINTS_PER_MILLION' },
    { label: 'Minutes', value: 'MINUTES' },
  ];

export const PLAYER_SORT_DIRECTION_OPTIONS = [
  { label: 'High \u2192 Low', value: 'DESC' },
  { label: 'Low \u2192 High', value: 'ASC' },
];

export const POSITION_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'GK', value: 'GK' },
  { label: 'DEF', value: 'DEF' },
  { label: 'MID', value: 'MID' },
  { label: 'FWD', value: 'FWD' },
];

export const AVAILABILITY_OPTIONS = [
  { label: 'All', value: 'ALL' as AvailabilityFilter },
  { label: 'Available', value: 'AVAILABLE' as AvailabilityFilter },
  { label: 'Risky', value: 'RISKY' as AvailabilityFilter },
  { label: 'Unavailable', value: 'UNAVAILABLE' as AvailabilityFilter },
];

