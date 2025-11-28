import { FplLeagueDto } from '../dto/fpl-league.dto';
import { FplTeamOverviewDto } from '../dto/fpl-team-overview.dto';
import { FplLeagueKind } from '../types/fpl-league-kind';
import { RawFplEntry, RawFplLeague } from '../types/fpl-raw-types';
import { FplLeagueScoring } from '../types/fpl-league-scoring';

function mapScoring(scoring: string): FplLeagueScoring {
  if (scoring === 'h') return 'h2h';
  return 'classic';
}

function mapLeagueType(leagueType: string): FplLeagueKind {
  switch (leagueType) {
    case 's':
      return 'standard';
    case 'x':
      return 'invitation';
    case 'c':
      return 'cup';
    default:
      return 'unknown';
  }
}

export function mapLeaguesFromEntry(entry: RawFplEntry): FplLeagueDto[] {
  const classicLeagues = entry.leagues?.classic ?? [];
  const h2hLeagues = entry.leagues?.h2h ?? [];

  const mapLeague = (
    lg: RawFplLeague,
    category: 'classic-array' | 'h2h-array',
  ): FplLeagueDto => {
    return {
      id: lg.id,
      name: lg.name,
      shortName: lg.short_name ?? null,
      scoring: mapScoring(lg.scoring),
      leagueType: mapLeagueType(lg.league_type),
      rawLeagueType: lg.league_type,
      closed: !!lg.closed,
      isAdmin: !!lg.entry_can_admin,
      canLeave: !!lg.entry_can_leave,
      entryRank: lg.entry_rank ?? null,
      entryLastRank: lg.entry_last_rank ?? null,
      rankCount: lg.rank_count ?? null,
      entryPercentileRank: lg.entry_percentile_rank ?? null,
      category,
    };
  };

  return [
    ...classicLeagues.map((lg) => mapLeague(lg, 'classic-array')),
    ...h2hLeagues.map((lg) => mapLeague(lg, 'h2h-array')),
  ];
}

export function mapEntryToOverview(
  teamId: string,
  entry: RawFplEntry,
): FplTeamOverviewDto {
  const leagues = mapLeaguesFromEntry(entry);

  return {
    teamId,
    teamName: entry.name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
    region: entry.player_region_name,
    regionCode: entry.player_region_iso_code_short,
    overallPoints: entry.summary_overall_points,
    overallRank: entry.summary_overall_rank,
    gwPoints: entry.summary_event_points,
    gwRank: entry.summary_event_rank,
    currentEvent: entry.current_event,
    leagues,
    lastSyncedAt: null,
  };
}
