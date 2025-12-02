import { FplPosition } from './fpl-position';

export type ListPlayersOptions = {
  clubExternalId?: number;
  position?: FplPosition;
  search?: string;
  offset?: number;
  limit?: number;
};
