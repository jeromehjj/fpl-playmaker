import { FplPosition } from '../types/fpl-position';

export interface FplPlayerListItemDto {
  id: number;
  externalId: number;
  webName: string;
  fullName: string | null;
  position: FplPosition;
  nowCost: number;
  club: {
    id: number;
    externalId: number;
    name: string;
    shortName: string;
  };
}
