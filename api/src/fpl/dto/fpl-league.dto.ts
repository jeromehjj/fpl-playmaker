import { FplLeagueKind } from '../types/fpl-league-kind';
import { FplLeagueScoring } from '../types/fpl-league-scoring';

export interface FplLeagueDto {
  id: number;
  name: string;
  shortName: string | null;
  scoring: FplLeagueScoring;
  leagueType: FplLeagueKind;
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
