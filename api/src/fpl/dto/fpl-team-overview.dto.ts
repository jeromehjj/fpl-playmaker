import { FplLeagueDto } from './fpl-league.dto';

export interface FplTeamOverviewDto {
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
  leagues: FplLeagueDto[];
}
